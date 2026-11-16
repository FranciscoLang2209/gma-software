"use client";
// shadcn/ui Select composition, styled with the application's existing CSS tokens.
import * as Primitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Children, isValidElement, useState, useRef, type ReactNode, type SelectHTMLAttributes, type ChangeEvent } from "react";
type Option = { value: string; label: ReactNode; disabled?: boolean };
function optionsOf(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{value?: string; children?: ReactNode; disabled?: boolean}>(child)) return [];
    if (child.type === "option") return [{value: String(child.props.value ?? child.props.children), label: child.props.children, disabled: child.props.disabled}];
    return optionsOf(child.props.children);
  });
}
export function Select({children, value, defaultValue, onChange, name, required, disabled, ...props}: SelectHTMLAttributes<HTMLSelectElement>) {
  const trigger = useRef<HTMLButtonElement>(null);
  const options = optionsOf(children);
  const [internal, setInternal] = useState(String(defaultValue ?? options[0]?.value ?? ""));
  const current = value === undefined ? internal : String(value);
  // Radix reserves empty strings for placeholders; use a private item key only in the popup.
  const empty = "__gma_empty_option__";
  return <Primitive.Root required={required} disabled={disabled} value={current || empty} onValueChange={next => {
    const selected = next === empty ? "" : next; setInternal(selected);
    onChange?.({target:{value:selected}, currentTarget:{value:selected}} as ChangeEvent<HTMLSelectElement>);
  }}>
    {name && <input className="ui-validation-input" aria-hidden="true" tabIndex={-1} name={name} value={current} required={required} disabled={disabled} onChange={() => {}} onInvalid={e => {e.preventDefault(); trigger.current?.focus(); trigger.current?.setAttribute("aria-invalid", "true");}} />}
    <Primitive.Trigger ref={trigger} className="ui-select-trigger" id={props.id} aria-label={props["aria-label"]} aria-required={required}>
      <Primitive.Value>{options.find(o => o.value === current)?.label ?? "Seleccionar"}</Primitive.Value><Primitive.Icon><ChevronDown size={16}/></Primitive.Icon>
    </Primitive.Trigger>
    <Primitive.Portal><Primitive.Content className="ui-select-content" position="popper" sideOffset={4}>
      <Primitive.ScrollUpButton className="ui-select-scroll"><ChevronUp size={16}/></Primitive.ScrollUpButton>
      <Primitive.Viewport>{options.map(o => <Primitive.Item className="ui-select-item" key={o.value} value={o.value || empty} disabled={o.disabled}><Primitive.ItemText>{o.label}</Primitive.ItemText><Primitive.ItemIndicator><Check size={16}/></Primitive.ItemIndicator></Primitive.Item>)}</Primitive.Viewport>
      <Primitive.ScrollDownButton className="ui-select-scroll"><ChevronDown size={16}/></Primitive.ScrollDownButton>
    </Primitive.Content></Primitive.Portal>
  </Primitive.Root>;
}
