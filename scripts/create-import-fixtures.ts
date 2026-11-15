import { writeFileSync } from "node:fs";
import { csv, xlsx, revenueRow } from "../tests/fixtures/imports/build.ts";
import { HEADERS } from "../src/lib/imports/contracts.ts";
const dir = new URL("../tests/fixtures/imports/", import.meta.url);
writeFileSync(
  new URL("aum.csv", dir),
  csv("aum", [
    ["SINTETICO", "00123", "00077", "100.10", "1", "2026"],
    ["SINTETICO", "00456", "00088", "-0.10", "1", "2026"],
  ]),
);
writeFileSync(
  new URL("revenue.csv", dir),
  csv("revenue", [
    revenueRow("00077", "0.1"),
    revenueRow("00077", "0.1"),
    revenueRow("00077", "-0.05"),
  ]),
);
writeFileSync(
  new URL("fa.csv", dir),
  csv("fa", [
    [
      "00123",
      "00077",
      "Owner SINTETICO",
      "Grupo SINTETICO",
      "Anterior SINTETICO",
      "Cliente SINTETICO",
      "Broker SINTETICO",
    ],
    [
      "00123",
      "00999",
      "Otro SINTETICO",
      "Grupo SINTETICO",
      "",
      "Cliente SINTETICO",
      "Broker SINTETICO",
    ],
  ]),
);
writeFileSync(
  new URL("aum-problemas.csv", dir),
  csv("aum", [
    ["SINTETICO", "00123", "00077", "1,234", "1", "2026"],
    ["SINTETICO", "00123", "00077", "", "2", "2026"],
    ["SINTETICO", "", "00099", "abc", "1", "2026"],
  ]),
);
writeFileSync(
  new URL("revenue-problemas.csv", dir),
  csv("revenue", [
    revenueRow("", "abc"),
    revenueRow("00077", "1,234", "SYN-B"),
  ]),
);
writeFileSync(
  new URL("aum.xlsx", dir),
  xlsx([
    {
      name: "AUM SINTETICO",
      rows: [
        [...HEADERS.aum],
        [
          "SINTETICO",
          "00123",
          "00077",
          { n: "88259496234518.57" },
          { n: "1" },
          { n: "2026" },
        ],
      ],
    },
    {
      name: "Problemas",
      rows: [
        [...HEADERS.aum],
        ["SINTETICO", { n: "123" }, "00077", { formula: "1+1" }, "1", "2026"],
        [
          "SINTETICO",
          "00456",
          "00088",
          { formula: "1+1", cached: "2" },
          "1",
          "2026",
        ],
      ],
    },
  ]),
);
writeFileSync(
  new URL("revenue.xlsx", dir),
  xlsx([
    {
      name: "Revenue SINTETICO",
      rows: [
        [...HEADERS.revenue],
        revenueRow("00077", "0.1"),
        revenueRow("00077", "0.1"),
      ],
    },
  ]),
);
writeFileSync(
  new URL("fa.xlsx", dir),
  xlsx([
    {
      name: "FA SINTETICO",
      rows: [
        [...HEADERS.fa],
        [
          "00123",
          "00077",
          "Owner SINTETICO",
          "Grupo SINTETICO",
          "Anterior SINTETICO",
          "Cliente SINTETICO",
          "Broker SINTETICO",
        ],
      ],
    },
  ]),
);
