"use client";
import { useId, useState } from "react";
import { Select } from "./ui/select";
import { textSearchKey } from "@/lib/data/normalization";

export function SearchSelect({ name, label, options, selected = "", all = "Todos · incluye sin asignar" }: {
  name: string; label: string; options: { id: string; label: string }[]; selected?: string; all?: string;
}) {
  const id = useId();
  const [search, setSearch] = useState("");
  const [value, setValue] = useState(selected);
  const query = textSearchKey(search);
  const matches = options.filter(o => o.id === value || textSearchKey(`${o.label} ${o.id}`).includes(query));
  return <div className="search-select">
    <label htmlFor={id}>{label}</label>
    {options.length > 20 && <input type="search" aria-label={`Buscar ${label}`} placeholder={`Buscar ${label.toLowerCase()}`} value={search} onChange={e => setSearch(e.target.value)} />}
    <Select id={id} name={name} value={value} onChange={e => setValue(e.target.value)}>
      <option value="">{all}</option>
      {value && !options.some(o => o.id === value) && <option value={value}>Selección actual · {value}</option>}
      {matches.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </Select>
    {search && <small role="status">{matches.length} de {options.length} opciones · la selección actual se conserva</small>}
  </div>;
}
