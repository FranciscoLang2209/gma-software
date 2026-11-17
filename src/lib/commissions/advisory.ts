import { decimal } from "../imports/decimal.ts";

export const ADVISORY_FORMULA = "advisory-actual-365-v1";

type GrossInput = {
  // Solo proporciones y bases semánticamente confirmadas; null conserva ausencia.
  assetsBilledOn: string | null;
  annualRate: string | null;
  periodDays: string;
  rounding: { decimals: number; mode: "half-away-from-zero" };
};

function coefficient(value: string) {
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(value))
    throw new Error("Se requiere decimal canónico sin separadores de miles ni porcentaje.");
  const normalized = decimal(value, "dot");
  const [whole, fraction = ""] = normalized.split(".");
  return { units: BigInt(whole + fraction), divisor: 10n ** BigInt(fraction.length) };
}

// No se aproxima la división periódica por 365 antes del redondeo de presentación.
function rounded(numerator: bigint, denominator: bigint, decimals: number) {
  const magnitude = (numerator < 0n ? -numerator : numerator) * 10n ** BigInt(decimals);
  const units = magnitude / denominator + (2n * (magnitude % denominator) >= denominator ? 1n : 0n);
  const digits = units.toString().padStart(decimals + 1, "0");
  return (numerator < 0n && units !== 0n ? "-" : "") +
    (decimals ? digits.slice(0, -decimals) + "." + digits.slice(-decimals) : digits);
}

/** Cálculo bruto aislado: nunca produce fee final, deuda ni importe persistido. */
export function calculateGrossAdvisory(input: GrossInput) {
  if (!/^[1-9]\d{0,5}$/.test(input.periodDays))
    throw new Error("Días del período: entero positivo explícito de hasta seis dígitos.");
  if (!Number.isInteger(input.rounding.decimals) || input.rounding.decimals < 0 ||
      input.rounding.decimals > 30 || input.rounding.mode !== "half-away-from-zero")
    throw new Error("Convención de redondeo inválida.");
  // Validar también entradas presentes cuando falte la otra base.
  const assets = input.assetsBilledOn === null ? null : coefficient(input.assetsBilledOn);
  const rate = input.annualRate === null ? null : coefficient(input.annualRate);
  const common = { formulaVersion: ADVISORY_FORMULA, periodDays: input.periodDays,
    rounding: { ...input.rounding }, finalFee: null };
  if (!rate || !assets) return { ...common,
    status: !rate ? "pending_rate" as const : "pending_balance" as const,
    missing: [...(!rate ? ["annual_rate"] : []), ...(!assets ? ["assets_billed_on"] : [])],
    grossFeeExact: null, grossFeeDisplay: null };
  const numerator = assets.units * rate.units * BigInt(input.periodDays);
  const denominator = assets.divisor * rate.divisor * 365n;
  return { ...common, status: "gross_only" as const, missing: [],
    grossFeeExact: { numerator: numerator.toString(), denominator: denominator.toString() },
    grossFeeDisplay: rounded(numerator, denominator, input.rounding.decimals) };
}
