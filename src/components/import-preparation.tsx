"use client";
import { DatePicker } from "./ui/date-picker";
import { Select } from "./ui/select";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Upload, ArrowRight, History } from "lucide-react";
import { WorkflowSteps } from "./workflow-steps";
import { StatusBadge } from "./status-badge";
import { Button, Table } from "@radix-ui/themes";
import type {
  Issue,
  Options,
  PreparedRow,
  Source,
  NumericFormat,
} from "@/lib/imports/contracts";
type BatchLink = {
  id: string;
  source: string;
  period: string;
  status: string;
  custodian_id: string;
};
type Detail = {
  batch: BatchLink & {
    file_name_original: string;
    file_sha256: string;
    row_count: number;
    blocking_error_count: number;
    parsing_conventions: { options: Options; configuration?: Options };
    totals: {
      processed?: number;
      total?: string | null;
      distinctAccounts?: number;
      valueCount?: number;
      missingValues?: number;
      duplicateRows?: number;
      warnings?: Issue[];
      headers?: {
        position: number;
        original: string | null;
        canonical: string | null;
      }[];
    };
    errors: Issue[];
  };
  rows: PreparedRow[];
  rowMatches: number;
  page: number;
  sheets: string[];
  readError: string | null;
  repeatCount: number;
  repeats: BatchLink[];
};
async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error ?? "No se pudo completar la solicitud.");
  return data;
}
export function ImportPreparation({
  custodians,
  batches,
}: {
  custodians: { id: string; code: string; name: string }[];
  batches: BatchLink[];
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [sheet, setSheet] = useState("");
  const [format, setFormat] = useState<NumericFormat>("undefined");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const requestId = useRef<string | null>(null),
    paused = useRef(false);
  async function load(id: string, page = 0, errors = onlyErrors) {
    const data: Detail = await api(
      `/api/importaciones/${id}?page=${page}&errors=${errors ? 1 : 0}`,
    );
    setDetail(data);
    setSheet(
      data.batch.parsing_conventions.configuration?.sheet ??
        data.sheets[0] ??
        "",
    );
    setFormat(
      data.batch.parsing_conventions.configuration?.numericFormat ??
        data.batch.parsing_conventions.options.numericFormat,
    );
    return data;
  }
  async function open(id: string) {
    setBusy(true);
    setError("");
    setOnlyErrors(false);
    try {
      await load(id, 0, false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const custodian = custodians.find((c) => c.id === form.get("custodian"));
      if (!custodian) throw new Error("Elegí un custodio registrado.");
      requestId.current ??= crypto.randomUUID();
      const options: Options = {
        source: String(form.get("source")) as Source,
        period: `${form.get("period")}-01`,
        custodianId: custodian.id,
        custodianCode: custodian.code,
        sheet: "",
        numericFormat: String(form.get("numericFormat")) as NumericFormat,
        delimiter: String(form.get("delimiter")) as Options["delimiter"],
      };
      form.set("options", JSON.stringify(options));
      form.set("requestId", requestId.current);
      const data = await api("/api/importaciones", {
        method: "POST",
        body: form,
      });
      requestId.current = null;
      setOnlyErrors(false);
      await load(data.id, 0, false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function process() {
    if (!detail) return;
    setBusy(true);
    setProcessing(true);
    setError("");
    paused.current = false;
    const id = detail.batch.id;
    const options = detail.batch.parsing_conventions.configuration ?? {
      ...detail.batch.parsing_conventions.options,
      sheet,
      numericFormat: format,
    };
    try {
      while (!paused.current) {
        const result = await api(`/api/importaciones/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ options }),
        });
        await load(id);
        if (result.done) break;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setProcessing(false);
    }
  }
  const frozen = !!detail?.batch.parsing_conventions.configuration;
  return (
    <>
      <WorkflowSteps status={detail?.batch.status} />
      <section className="panel import-panel">
        <div className="section-heading"><div><p className="eyebrow">PASO 1 · FUENTE Y ALCANCE</p><h2><Upload size={18} aria-hidden="true" /> Cargar archivo privado</h2></div><span className="semantic-badge">Solo administrador</span></div>
        <details className="format-help"><summary>Formatos admitidos y límites del archivo</summary><p>
          Máximo 2 MiB, 5.000 filas por hoja, 64 columnas y 10 hojas; XLSX hasta
          12 MiB descomprimidos. Guardamos como máximo 250 filas por petición.
          Podés pausar y retomar desde el historial.
        </p>
        <p>
          Solo .xlsx sin macros o CSV UTF-8. Para .xls, .xlsm o .xlsb: recalculá
          en Excel y guardá una copia .xlsx sin macros o CSV UTF-8. Headers en
          la primera fila, sin celdas combinadas.
        </p></details>
        {!custodians.length && (
          <p role="status">
            Falta registrar un custodio autorizado en la configuración de la
            base. No se infiere a partir del archivo.
          </p>
        )}
        <form
          className="import-form"
          onSubmit={upload}
          onChange={() => {
            requestId.current = null;
          }}
        >
          <label>
            Fuente
            <Select name="source" required disabled={busy}>
              <option value="aum">AUM</option>
              <option value="revenue">Revenue</option>
              <option value="fa">FA</option>
            </Select>
          </label>
          <label>
            Período / referencia FA
            <DatePicker
              type="month"
              name="period"
              required
              min="1900-01"
              max="2200-12"
              disabled={busy}
            />
          </label>
          <label>
            Alcance: un custodio
            <Select name="custodian" required disabled={busy}>
              <option value="">Elegí custodio</option>
              {custodians.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </Select>
          </label>
          <label>
            Formato de importes de texto
            <Select
              name="numericFormat"
              defaultValue="undefined"
              disabled={busy}
            >
              <option value="undefined">
                Sin definir: separadores bloqueados
              </option>
              <option value="dot">1,234.56 — punto decimal</option>
              <option value="comma">1.234,56 — coma decimal</option>
            </Select>
          </label>
          <label>
            Delimitador CSV
            <Select name="delimiter" defaultValue="," disabled={busy}>
              <option value=",">Coma</option>
              <option value=";">Punto y coma</option>
              <option value={"\t"}>Tabulación</option>
            </Select>
          </label>
          <label>
            Archivo original
            <input
              name="file"
              type="file"
              accept=".xlsx,.csv"
              required
              disabled={busy}
            />
          </label>
          <Button type="submit" disabled={busy || !custodians.length}>
            Guardar original y revisar
          </Button>
        </form>
        <p className="section-note">
          El alcance no descarta otras filas del archivo: si Revenue trae otro
          custodio, se informa un error. En FA, el período es solo una
          referencia y el custodio es declarado; no se crean vigencias ni
          equivalencias.
        </p>
      </section>
      {error && (
        <p role="alert" className="import-error feedback feedback-error">
          {error}
        </p>
      )}
      {detail && (
        <section className="panel import-panel" aria-busy={busy}>
          <h2>Revisión de {detail.batch.file_name_original}</h2>
          <p role="status">
            {detail.batch.source.toUpperCase()} · {detail.batch.period} ·
            Custodio {detail.batch.parsing_conventions.options.custodianCode} ·{" "}
            <StatusBadge status={detail.batch.status} /> · Filas guardadas:{" "}
            {detail.batch.totals.processed ?? 0} /{" "}
            {detail.batch.row_count || "pendiente"}
          </p>
          <details className="format-help"><summary>Archivo original y trazabilidad</summary><p className="import-hash">SHA-256: {detail.batch.file_sha256}</p><a href={`/api/fuentes/${detail.batch.id}`}>Descargar original privado</a></details>
          {!!detail.repeatCount && (
            <p role="status">
              Advertencia: la misma huella aparece en {detail.repeatCount}{" "}
              preparaciones/importaciones. No se eliminaron filas; la
              publicación requiere revisar alcance y versión.
            </p>
          )}
          {detail.readError && <p role="alert">{detail.readError}</p>}
          <div className="import-form">
            <label>
              Hoja
              <Select
                value={sheet}
                onChange={(e) => setSheet(e.target.value)}
                disabled={busy || frozen}
              >
                {detail.sheets.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </label>
            <label>
              Convención numérica
              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value as NumericFormat)}
                disabled={busy || frozen}
              >
                <option value="undefined">Sin definir</option>
                <option value="dot">1,234.56</option>
                <option value="comma">1.234,56</option>
              </Select>
            </label>
            {["uploaded", "validating"].includes(detail.batch.status) && (
              <Button
                disabled={busy || (!sheet && !detail.readError)}
                onClick={process}
              >
                {frozen ? "Reanudar preparación" : "Validar y preparar"}
              </Button>
            )}
            {processing && (
              <Button
                variant="soft" highContrast
                onClick={() => {
                  paused.current = true;
                }}
              >
                Pausar tras este lote
              </Button>
            )}
          </div>
          <p>
            La hoja y convención quedan fijadas al iniciar. Para corregirlas,
            creá otra preparación; se conserva la anterior.
          </p>
          {detail.batch.source !== "fa" &&
            detail.batch.totals.total !== undefined && (
              <p>
                Cuentas distintas por referencia principal:{" "}
                {detail.batch.totals.distinctAccounts ?? "N/D"}. Filas:{" "}
                {detail.batch.row_count}. Suma de control{" "}
                {detail.batch.source === "aum"
                  ? "Value (USD)"
                  : "Payout broker (USD)"}
                : <strong>{detail.batch.totals.total ?? "N/D"}</strong>. Valores
                interpretados: {detail.batch.totals.valueCount ?? 0}; ausentes:{" "}
                {detail.batch.totals.missingValues ?? 0}; filas repetidas
                conservadas: {detail.batch.totals.duplicateRows ?? 0}. Errores
                bloqueantes: {detail.batch.blocking_error_count}. La suma de
                control incluye importes interpretables de filas con otros
                errores; no es un total publicable.
              </p>
            )}
          {detail.batch.source === "fa" && (
            <p>
              FA: {detail.batch.row_count} filas;{" "}
              {detail.batch.totals.distinctAccounts ?? "N/D"} referencias
              principales distintas; {detail.batch.blocking_error_count} errores
              bloqueantes. La resolución y la vigencia se revisan en Correspondencias.
            </p>
          )}
          {[
            ...(detail.batch.totals.warnings ?? []),
            ...detail.batch.errors,
          ].map((x, i) => (
            <p key={i}>
              {x.column && `${x.column}: `}
              {x.message}
            </p>
          ))}
          {detail.batch.totals.headers && (
            <details>
              <summary>Mapeo explícito de headers</summary>
              <ul>
                {detail.batch.totals.headers.map((h) => (
                  <li key={h.position}>
                    {h.position}: {h.original ?? "(vacío)"} →{" "}
                    {h.canonical ?? "sin mapeo; conservado"}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <h3>Vista previa y errores por fila</h3>
          <label>
            <input
              type="checkbox"
              checked={onlyErrors}
              disabled={busy}
              onChange={async (e) => {
                const checked = e.target.checked;
                setOnlyErrors(checked);
                setBusy(true);
                try {
                  await load(detail.batch.id, 0, checked);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />{" "}
            Solo filas con errores
          </label>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Filas preparadas"
          >
            <Table.Root className="data-table">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Hoja / fila</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>
                    Cuenta original
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="right">
                    Importe USD
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>
                    Validación y original
                  </Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {detail.rows.map((r) => (
                  <Table.Row key={r.row_number}>
                    <Table.Cell>
                      {r.sheet_name} / {r.row_number}
                    </Table.Cell>
                    <Table.Cell>
                      {r.cell_metadata.account ?? "Ausente"}
                    </Table.Cell>
                    <Table.Cell align="right">
                      {r.cell_metadata.amount ?? "N/D"}
                    </Table.Cell>
                    <Table.Cell>
                      {[...r.errors, ...r.cell_metadata.warnings].map(
                        (e, i) => (
                          <p key={i}>
                            {e.column && `${e.column}: `}
                            {e.message}
                          </p>
                        ),
                      )}
                      <details>
                        <summary>Ver celdas originales</summary>
                        <pre>{JSON.stringify(r.original_cells, null, 2)}</pre>
                      </details>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </div>
          {!detail.rows.length && <p>Sin filas en esta página.</p>}
          <div className="import-pagination">
            <Button
              variant="soft" highContrast
              disabled={busy || detail.page === 0}
              onClick={() => {
                setBusy(true);
                load(detail.batch.id, detail.page - 1)
                  .catch((e) => setError(e.message))
                  .finally(() => setBusy(false));
              }}
            >
              Anterior
            </Button>
            <span>
              Página {detail.page + 1} · {detail.rowMatches} filas en esta vista
            </span>
            <Button
              variant="soft" highContrast
              disabled={busy || (detail.page + 1) * 25 >= detail.rowMatches}
              onClick={() => {
                setBusy(true);
                load(detail.batch.id, detail.page + 1)
                  .catch((e) => setError(e.message))
                  .finally(() => setBusy(false));
              }}
            >
              Siguiente
            </Button>
          </div>
          <p>
            <Link className="button-outline" href={`/correspondencias?lote=${detail.batch.id}`}>Resolver correspondencias, revisar y publicar <ArrowRight size={16} aria-hidden="true" /></Link>
          </p>
        </section>
      )}
      <section className="panel import-panel">
        <h2><History size={18} aria-hidden="true" /> Preparaciones recientes</h2>
        <p>
          Últimas 50 al abrir esta página. Una carga nueva se muestra arriba;
          recargá para actualizar el historial.
        </p>
        <ul className="import-history-list">
          {batches.map((b) => (
            <li key={b.id}>
              <button
                className="import-history"
                disabled={busy}
                onClick={() => open(b.id)}
              >
                {b.source.toUpperCase()} · {b.period} ·{" "}
                {custodians.find((c) => c.id === b.custodian_id)?.code ??
                  "Custodio pendiente"}{" "}
                <StatusBadge status={b.status} />
              </button>
            </li>
          ))}
        </ul>
        {!batches.length && <p>Sin preparaciones anteriores.</p>}
      </section>
    </>
  );
}
