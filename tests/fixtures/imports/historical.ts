// SOLO DATOS SINTÉTICOS. 36 meses en orden inverso; tres cuentas por mes.
export function historicalRows() {
  return Array.from({ length: 36 }, (_, i) => {
    const month = 35 - i;
    return ["0.1", "0.2", "-0.05"].map((amount, account) => [
      "Cliente SINTETICO", `0000${account + 1}`, `SYN-REV-0000${account + 1}`,
      amount, String(month % 12 + 1), String(2023 + Math.floor(month / 12)),
    ]);
  }).flat();
}
