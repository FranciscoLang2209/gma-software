-- SINTÉTICO: oráculo independiente sobre totales mensuales publicados, sin account_months.
\ir query-fixture.sql
update app_private.accounts set service=case when id in ('20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002') then 'Advisory' else 'Brokerage' end;
select pg_temp.seed('aum','2024-01-01',1,'[[1,"10000000"],[2,"30000000"]]');
select pg_temp.seed('aum','2024-02-01',1,'[[1,"11000000"],[2,"30000000"]]');
select pg_temp.seed('aum','2024-03-01',1,'[[1,"12000000"],[2,"30000000"]]');
select pg_temp.seed('revenue','2024-01-01',1,'[[1,"5000"],[1,"5000"],[1,"3750"],[2,"15000"]]');
select pg_temp.seed('revenue','2024-02-01',1,'[[1,"0"],[2,"0"]]');
select pg_temp.seed('revenue','2024-03-01',1,'[[1,"0"],[2,"0"]]');
do $$ declare m date; begin
 for m in select d::date from generate_series('2024-01-01'::date,'2024-03-01',interval '1 month')d loop
  perform pg_temp.seed('aum',m,2,'[[7,"2000000"]]');
  perform pg_temp.seed('revenue',m,2,'[[7,"0"]]');
 end loop;
end $$;
insert into app_private.master_publications(id,input,result,created_by)
values('93000000-0000-0000-0000-000000000001','{"synthetic_metric_fixture":true}','{}',auth.uid());
insert into app_private.roa_rate_versions(id,account_id,quarter,annual_rate,evidence,created_by,master_publication_id,master_source_row)
select gen_random_uuid(),('20000000-0000-0000-0000-00000000000'||i)::uuid,'2024-01-01',case when i=1 then 0.005 else 0.002 end,
 'SINTETICO: tasa anual acreditada para prueba de métrica',auth.uid(),'93000000-0000-0000-0000-000000000001',i+2
from generate_series(1,2)i;

create function pg_temp.check_monthly_oracle(report jsonb, selected uuid[]) returns void language plpgsql as $$
declare m date; a numeric; r numeric; s numeric:=0; rev numeric:=0; n integer:=0; weighted numeric:=0; expected_fee numeric;
begin
 for m in select d::date from generate_series('2024-01-01'::date,'2024-03-01',interval '1 month')d loop
  -- Cada fuente se consulta por separado: un Revenue repetido no replica una foto.
  select sum(value_usd) into a from app_private.aum_current where account_id=any(selected) and period=m;
  select sum(payout_broker_usd) into r from app_private.revenue_current where account_id=any(selected) and period=m;
  perform pg_temp.assert_true((report->'months'->n->>'aum_known_usd')::numeric is not distinct from a,'AUM mensual directo');
  perform pg_temp.assert_true((report->'months'->n->>'revenue_known_usd')::numeric is not distinct from r,'Revenue mensual directo');
  s:=s+a; rev:=rev+r; n:=n+1;
 end loop;
 perform pg_temp.assert_true((report->'total'->>'aum_average_usd')::numeric=s/3,'promedio de tres totales mensuales, no filas');
 perform pg_temp.assert_true((report->'total'->>'revenue_quarter_usd')::numeric=rev,'Revenue trimestral conserva todas las filas');
 perform pg_temp.assert_true((report->'total'->>'roa_numerator')::numeric=rev*1200 and (report->'total'->>'roa_denominator')::numeric=s,'productos exactos comunes al conjunto');
 perform pg_temp.assert_true((report->'total'->>'roa_percent')::numeric=rev*1200/s,'ROA agregado de sumandos');
 select sum(a.value_usd*v.annual_rate) into weighted from app_private.aum_current a
 join app_private.roa_rate_versions v on v.account_id=a.account_id and v.quarter='2024-01-01'
 where a.account_id=any(selected) and a.period between '2024-01-01' and '2024-03-01';
 expected_fee:=weighted*100/s;
 if report->'total'->>'advisory_fee_status'='verified_reference' then
  perform pg_temp.assert_true((report->'total'->>'advisory_fee_percent')::numeric=expected_fee,'Fee ponderado por exposición AUM mensual de igual población');
  perform pg_temp.assert_true((report->'total'->>'advisory_difference_pp')::numeric=(rev*1200-weighted*100)/s,'diferencia en puntos porcentuales');
 end if;
end $$;
-- El oráculo necesita leer hechos privados: sólo operador del clúster SINTÉTICO.
select public.quarterly_roa_report_ref('{}',2024,1,account=>'20000000-0000-0000-0000-000000000001') example \gset
select pg_temp.check_monthly_oracle(:'example','{20000000-0000-0000-0000-000000000001}');
select pg_temp.assert_true((:'example'::jsonb->'total'->>'aum_average_usd')::numeric=11000000 and (:'example'::jsonb->'total'->>'revenue_quarter_usd')::numeric=13750,'ejemplo: once millones y Revenue 13.750');
select pg_temp.assert_true((:'example'::jsonb->'total'->>'roa_percent')::numeric=0.5 and
 (:'example'::jsonb->'total'->>'advisory_fee_percent')::numeric=0.5,'ejemplo: 0.50% anual y 50 bps de fee');
select public.quarterly_roa_report_ref('{}',2024,1,service_filter=>'Advisory') advisory \gset
select pg_temp.check_monthly_oracle(:'advisory','{20000000-0000-0000-0000-000000000001,20000000-0000-0000-0000-000000000002}');
select pg_temp.assert_true((:'advisory'::jsonb->'total'->>'aum_average_usd')::numeric=41000000 and
 (:'advisory'::jsonb->'total'->>'roa_percent')::numeric<>0.35,'agregado ponderado distinto de promedio simple 0.50/0.20');
select pg_temp.assert_true((:'advisory'::jsonb->'total'->>'advisory_difference_pp')::numeric=0,'mismas poblaciones, diferencia cero sin mezclar Brokerage');
select public.quarterly_roa_report_ref('{}',2024,1) mixed \gset
select pg_temp.check_monthly_oracle(:'mixed','{20000000-0000-0000-0000-000000000001,20000000-0000-0000-0000-000000000002,20000000-0000-0000-0000-000000000007}');
select pg_temp.assert_true(:'mixed'::jsonb->'total'->>'advisory_fee_status'='not_applicable' and :'mixed'::jsonb->'total'->>'advisory_fee_percent' is null,'total mixto no compara fee de subconjunto');
-- La proyección autenticada coincide, sin acceso del lector al oráculo privado.
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set local request.jwt.claims='{"session_id":"00000000-0000-0000-0000-000000000002"}';
set local role authenticated;
select pg_temp.assert_true(public.quarterly_roa_report_ref('{}',2024,1,service_filter=>'Advisory')=:'advisory'::jsonb,'lector conserva cálculo publicado');
reset role;
rollback;
\o
\echo 'OK métricas independientes: ejemplo 10/11/12M, 13.750 Revenue, 0.50%, grupos desiguales, fee ponderado y población mixta.'
