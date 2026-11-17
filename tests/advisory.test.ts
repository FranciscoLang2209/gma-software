import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateGrossAdvisory } from "../src/lib/commissions/advisory.ts";

// Todas las cifras son sintéticas; las fechas/días no se infieren de un Excel.
const base = { assetsBilledOn: "1000000", annualRate: "0.01", periodDays: "90",
  rounding: { decimals: 2, mode: "half-away-from-zero" as const } };

test("Advisory bruto: 90/91/92 días y denominador 365 también en año bisiesto", () => {
  for (const [periodDays, expected] of [["90", "2465.75"], ["91", "2493.15"], ["92", "2520.55"]]) {
    const result = calculateGrossAdvisory({ ...base, periodDays });
    assert.equal(result.grossFeeDisplay, expected);
    assert.equal(result.grossFeeExact?.denominator, "36500");
    assert.equal(result.finalFee, null);
    assert.equal(result.status, "gross_only");
  }
  // Q1 2024 tiene 91 días; no se cambia el divisor a 366.
  assert.equal(calculateGrossAdvisory({ ...base, periodDays: "91" }).grossFeeDisplay, "2493.15");
});

test("ausencias no son cero; cero explícito y ajustes negativos se conservan", () => {
  assert.equal(calculateGrossAdvisory({ ...base, annualRate: null }).status, "pending_rate");
  assert.equal(calculateGrossAdvisory({ ...base, assetsBilledOn: null }).status, "pending_balance");
  assert.deepEqual(calculateGrossAdvisory({ ...base, annualRate: null, assetsBilledOn: null }).missing,
    ["annual_rate", "assets_billed_on"]);
  assert.equal(calculateGrossAdvisory({ ...base, annualRate: "0" }).grossFeeDisplay, "0.00");
  assert.equal(calculateGrossAdvisory({ ...base, annualRate: "-0.01" }).grossFeeDisplay, "-2465.75");
});

test("racional exacto, sin pérdida por Number ni redondeo intermedio", () => {
  const result = calculateGrossAdvisory({ ...base, assetsBilledOn: "9007199254740993.01", annualRate: "1", periodDays: "365" });
  assert.equal(result.grossFeeDisplay, "9007199254740993.01");
  assert.equal(calculateGrossAdvisory({ ...base, assetsBilledOn: "1.005", annualRate: "1", periodDays: "365" }).grossFeeDisplay, "1.01");
  assert.equal(calculateGrossAdvisory({ ...base, assetsBilledOn: "-1.005", annualRate: "1", periodDays: "365" }).grossFeeDisplay, "-1.01");
  const old = calculateGrossAdvisory(base);
  const corrected = calculateGrossAdvisory({ ...base, annualRate: "0.02" });
  assert.equal(old.grossFeeDisplay, "2465.75");
  assert.equal(corrected.grossFeeDisplay, "4931.51");
  assert.equal(calculateGrossAdvisory(base).grossFeeDisplay, old.grossFeeDisplay);
});

test("entradas inválidas se rechazan sin conversión financiera implícita", () => {
  for (const annualRate of ["1%", "0,01", "1e-2", "NaN", ""])
    assert.throws(() => calculateGrossAdvisory({ ...base, annualRate }));
  for (const periodDays of ["0", "-1", "90.5", "", "1000000"])
    assert.throws(() => calculateGrossAdvisory({ ...base, periodDays }));
  assert.throws(() => calculateGrossAdvisory({ ...base, rounding: { ...base.rounding, decimals: -1 } }));
});
