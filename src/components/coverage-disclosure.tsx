import type { ReactNode } from "react";
import type { Report } from "@/lib/queries/contracts";
import { ReportCoverage } from "./report-view";

export function CoverageDisclosure({ report, consultedAt, children }: { report: Report; consultedAt: string; children?: ReactNode }) {
  return <details className="panel coverage-disclosure" id="cobertura"><summary><span>Cobertura y trazabilidad</span><span>Fuentes, faltantes y actualización</span></summary>
    <ReportCoverage report={report} consultedAt={consultedAt} anchor={false} />{children}
  </details>;
}
