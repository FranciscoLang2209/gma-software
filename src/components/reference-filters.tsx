import type { ReferenceOptions } from "@/lib/queries/references";
import { REFERENCE_FIELDS, REFERENCE_PARAMETERS } from "@/lib/queries/references";
import { SearchSelect } from "./search-select";

export function ReferenceFilters({ params, references }: { params: URLSearchParams; references?: ReferenceOptions | null }) {
  if (!references) return REFERENCE_PARAMETERS.some(key => params.has(key)) ? <fieldset className="reference-filters">
    <legend>Selección REF conservada</legend>
    <p>Las opciones no están disponibles. Reintentar conserva la selección; usá el enlace de reinicio para limpiarla.</p>
    {REFERENCE_PARAMETERS.filter(key => params.has(key)).map(key => <input key={key} type="hidden" name={key} value={params.get(key)!} />)}
  </fieldset> : null;
  return <fieldset className="reference-filters">
    <legend>Referencias de REF · foto sin vigencia histórica</legend>
    <p>Estas etiquetas seleccionan cuentas de la foto publicada. No acreditan quién atendía la cuenta en cada mes. Se combinan con los demás filtros.</p>
    <input type="hidden" name="ref_snapshot" value={references.snapshot} />
    <div className="advanced-fields">{Object.entries(REFERENCE_FIELDS).map(([key, label]) => <SearchSelect key={`${key}-${params.get(key) ?? ""}`} name={key} label={label} selected={params.get(key) ?? ""}
      options={[{ id: "sin_referencia", label: "Sin referencia" }, ...(references.options[key] ?? [])]} all="Todas · incluye sin referencia" />)}</div>
  </fieldset>;
}
