"use client";
// shadcn Calendar uses React DayPicker; keep the existing navy visual tokens.
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
export function Calendar(props: React.ComponentProps<typeof DayPicker>) {
  return <DayPicker locale={es} showOutsideDays className="ui-calendar" {...props} />;
}
