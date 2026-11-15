# Fixtures exclusivamente sintéticos

Generados por `node --experimental-strip-types scripts/create-import-fixtures.ts`, sin leer archivos reales.

- `aum.csv`: cuentas con ceros, valores positivo y negativo; suma 100 USD.
- `revenue.csv`: dos filas idénticas de 0.1 y ajuste -0.05; tres filas, total exacto 0.15 USD.
- `fa.csv`: una referencia Addepar con contrapartes y owner distintos; contradicción.
- `aum-problemas.csv`: duplicado, importe ambiguo 1,234, mes distinto, importe ausente, cuenta vacía e importe abc.
- `revenue-problemas.csv`: cuenta vacía, importe inválido, custodio ajeno e importe que necesita convención.
- `aum.xlsx`: hoja precisa 88259496234518.57 y hoja con cuenta numérica, fórmula sin caché y fórmula con caché 2.
- `revenue.xlsx`: 29 columnas, dos filas repetidas legítimas.
- `fa.xlsx`: 7 columnas, referencia comercial sintética sin historia acreditada.

Pruebas adicionales construyen XLSX/CSV en memoria para límites, headers, ZIP expandido, macros,
multilínea y 5.000 filas. La excepción de .gitignore se limita a esta carpeta; no copiar fuentes privadas aquí.
