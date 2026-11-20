"use client";
import { Tabs } from "@radix-ui/themes";
import { ImportPreparation } from "./import-preparation";
import { MasterImport } from "./master-import";
import { HistoricalImport } from "./historical-import";
import type { ComponentProps } from "react";
export function ImportModes({ initialHistoricalId, ...props }: ComponentProps<typeof ImportPreparation> & { initialHistoricalId?: string }) {
  return <Tabs.Root defaultValue={initialHistoricalId ? "historical" : "monthly"}>
    <Tabs.List aria-label="Modo de importación"><Tabs.Trigger value="monthly">Mensual</Tabs.Trigger><Tabs.Trigger value="historical">Histórica</Tabs.Trigger><Tabs.Trigger value="master">Master Owners / Fee</Tabs.Trigger></Tabs.List>
    <Tabs.Content value="monthly"><ImportPreparation {...props} /></Tabs.Content>
    <Tabs.Content value="master"><MasterImport custodians={props.custodians} /></Tabs.Content>
    <Tabs.Content value="historical"><HistoricalImport custodians={props.custodians} initialId={initialHistoricalId} /></Tabs.Content>
  </Tabs.Root>;
}
