"use client";
import * as Popover from "@radix-ui/react-popover";
import { CalendarIcon } from "lucide-react";
import { useRef, useState, type InputHTMLAttributes } from "react";
import { Calendar } from "./calendar";
import { Select } from "./select";
export function DatePicker({type = "date", name, value, defaultValue, disabled, readOnly, required, min, max}: InputHTMLAttributes<HTMLInputElement>) {
  const [internal, setInternal] = useState(String(defaultValue ?? ""));
  const current = value === undefined ? internal : String(value);
  const parse = (s: string) => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m - 1, d || 1); };
  const [month, setMonth] = useState(() => current ? parse(current) : new Date());
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const monthly = type === "month";
  const lower = min ? String(min) : "1900-01";
  const upper = max ? String(max) : "9998-12-31";
  const format = (d: Date) => `${String(d.getFullYear()).padStart(4,"0")}-${String(d.getMonth()+1).padStart(2,"0")}${monthly ? "" : `-${String(d.getDate()).padStart(2,"0")}`}`;
  return <Popover.Root open={open} onOpenChange={setOpen}>
    <input className="ui-validation-input" aria-hidden="true" tabIndex={-1} name={name} value={current} required={required} disabled={disabled} readOnly={readOnly} onChange={() => {}} onInvalid={e => {e.preventDefault(); trigger.current?.focus(); trigger.current?.setAttribute("aria-invalid","true");}} />
    <Popover.Trigger asChild><button ref={trigger} type="button" className="ui-select-trigger" disabled={disabled || readOnly}><span>{current ? new Intl.DateTimeFormat("es-AR", monthly ? {month:"long", year:"numeric"} : {day:"2-digit",month:"2-digit",year:"numeric"}).format(parse(current)) : monthly ? "Elegir mes" : "Elegir fecha"}</span><CalendarIcon size={16} aria-hidden="true"/></button></Popover.Trigger>
    <Popover.Portal><Popover.Content className="ui-date-content" sideOffset={4} align="start">
      <div className="ui-calendar-controls"><Select aria-label="Mes del calendario" value={String(month.getMonth())} onChange={e => setMonth(new Date(month.getFullYear(),Number(e.target.value),1))}>{Array.from({length:12},(_,m)=><option key={m} value={String(m)}>{new Intl.DateTimeFormat("es",{month:"long"}).format(new Date(2026,m,1))}</option>)}</Select><input aria-label="Año del calendario" type="number" min={1900} max={9998} value={month.getFullYear()} onChange={e => {const y=Number(e.target.value); if(y>=1900 && y<=9998)setMonth(new Date(y,month.getMonth(),1));}} /></div>
      {monthly ? <button type="button" className="ui-month-confirm" disabled={format(month)<lower || format(month)>upper} onClick={() => {setInternal(format(month)); setOpen(false);}}>Seleccionar este mes</button> : <Calendar mode="single" month={month} onMonthChange={setMonth} selected={current ? parse(current) : undefined} disabled={[{before:parse(lower)},{after:parse(upper)}]} onSelect={date => {if(date){setInternal(format(date));setOpen(false);}}} />}
      {!required && !readOnly && <button className="ui-date-clear" type="button" onClick={() => {setInternal("");setOpen(false);}}>Limpiar selección</button>}
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
