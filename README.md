# App Papá

Repositorio autorizado: [FranciscoLang2209/gma-software](https://github.com/FranciscoLang2209/gma-software).
Proyecto Vercel: [gma-software](https://vercel.com/franlang2209-8232/gma-software).
La base de prueba Supabase Free/São Paulo está creada y conectada solo a Preview;
la puesta en uso con datos reales sigue pendiente. Ver [operación](docs/operations.md).

[Abrir Preview de prueba](https://gma-software-git-prueba-franlang2209-8232.vercel.app).
Requiere acceso Vercel. SMTP, invitación y primer administrador quedan pendientes
por decisión del dueño; todavía no hay ingreso operativo por correo.

Aplicación interna para analizar AUM, Revenue y distribución comercial. Esta es la
**etapa 10: preparación operativa local**, con el circuito funcional de etapa 9 verificado sintéticamente. Incluye preparación XLSX/CSV,
originales privados, resolución explícita y correcciones versionadas por fuente/mes/custodio, además de filtros, series, cobertura, JSON/CSV paginados y descarga CSV completa.
Conserva sesiones SSR y autorización RLS/Storage. No contiene datos de negocio ni una conexión
verificada a un Supabase dedicado. No está lista para operar
con información real.

## Instalación local

Requisitos: Node.js **24 LTS** y npm. Se verificó con Node 24.19.0 y npm 11.17.0.
La versión mayor de Node está en `.nvmrc`; `package-lock.json` fija las dependencias.

```sh
npm ci
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Sin credenciales se muestra el ingreso con acceso cerrado. Para recorrer las
secciones privadas hacen falta Supabase dedicado y una cuenta invitada habilitada. Si usás nvm, ejecutá `nvm use` antes de instalar.

Rutas: `/` (Resumen), `/analisis-comercial`, `/cuentas`, `/importaciones` y
`/correspondencias` (solo administradores) y `/configuracion`. La navegación indica la sección activa. Las tablas se desplazan
dentro de su contenedor en pantallas pequeñas y los estados vacíos siguen visibles.

## Scripts

```sh
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
npm run test:auth:http
npm run benchmark:imports
npm start
```

`start` requiere un build previo. `typecheck` genera primero los tipos de rutas de
Next.js, por lo que funciona también después de una instalación limpia. Las
pruebas unitarias usan el runner de Node y fixtures de configuración/importaciones sintéticos: no consultan
una base. `test:db` usa PostgreSQL efímero real y `test:auth:http` usa Next con un proveedor HTTP sintético. `--conditions=react-server` permite probar módulos protegidos por
`server-only` fuera del runtime de Next.

## Stack y decisiones

| Pieza | Versión fijada | Motivo |
| --- | --- | --- |
| Next.js App Router | 16.4.6 | Rutas y renderizado de servidor, límites de carga y error integrados. |
| React / React DOM | 19.3.1 | Compatibles con los peers declarados por Next, Radix y Recharts. |
| TypeScript | 5.9.3 | Tipado estricto; versión admitida por las herramientas elegidas. |
| Radix Themes | 3.3.0 | Componentes accesibles y estilos consistentes sin sumar otro sistema de UI o CSS. |
| Recharts | 3.10.1 | Gráficos declarativos SVG y adaptables, con soporte declarado para React 19. |
| react-is | 19.3.1 | Peer requerido por Recharts, alineado con React según su documentación. |
| Supabase JS / SSR | 2.119.0 / 0.12.7 | Sesiones oficiales por cookies en servidor; SSR admite el peer JS instalado. |
| Supabase CLI | 3.1.0 | Herramienta local fijada; comandos contrastados con su propio help. |
| ESLint / eslint-config-next | 9.39.5 / 16.4.6 | Peers compatibles sin forzar la instalación. Ver limitación abajo. |

CSS propio sobre los tokens de Radix, tipografía de sistema y botones principales
de alto contraste. Sin Tailwind, librería de iconos, gestor de estado ni framework adicional de pruebas. Lectura con `read-excel-file` 9.3.15,
`csv-parse` 7.0.3, `fflate` 0.8.3 y `saxen` 11.2.0. `server-only` protege el límite de
servidor. Prettier se usó puntualmente para dar formato, sin agregarlo al proyecto.

**Limitación conocida de desarrollo:** ESLint 9 figura deprecado/no soportado.
ESLint 10 genera conflictos de peers con los plugins transitivos de React,
importaciones y accesibilidad de la configuración actual de Next. Se conserva 9
para no forzar peers ni introducir overrides. `npm audit` reportó siete avisos
moderados en la cadena de `typescript-eslint`/`minimatch`; `npm audit --omit=dev`
reportó **cero**. Revisar la actualización cuando los plugins admitan ESLint 10
y la cadena publique una corrección compatible; no ejecutar `audit fix --force`
automáticamente. No se presenta la auditoría como una revisión integral de seguridad.

## Configuración de Supabase

Sin variables el acceso permanece cerrado. Para preparar un entorno propio:

```sh
cp .env.example .env.local
```

| Variable de servidor | Contenido esperado |
| --- | --- |
| `SUPABASE_URL` | Origen HTTPS del proyecto dedicado; HTTP solo para localhost/loopback. |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publicable moderna con prefijo `sb_publishable_`. |

Dejá ambas vacías mientras no exista un destino dedicado. No usar `service_role`,
`sb_secret`, JWT legacy ni credenciales en la URL. Las variables no tienen prefijo
`NEXT_PUBLIC_` y sus valores nunca se muestran en la interfaz. Reiniciá el servidor
después de cambiar el entorno. `.env.local` está excluido de Git.

La validación de formato no prueba conectividad. Sin configuración válida las rutas privadas
redirigen al ingreso; con configuración válida se verifica identidad y perfil en servidor.
Ver [operación de Auth](docs/auth.md) para deshabilitar efectivamente el registro remoto,
configurar las plantillas de correo, crear el primer administrador y verificar invitaciones.
El código no usa ninguna clave privilegiada ni ofrece autoasignación de roles.

`server.ts` usa `@supabase/ssr` y cookies por solicitud; `src/proxy.ts` refresca y protege
el acceso. Cada página y la API también verifican permisos; RLS y Storage los imponen
para peticiones directas. Todas las respuestas son privadas y no se cachean públicamente.
Las pantallas financieras consumen las consultas publicadas; su circuito está
implementado y probado con datos sintéticos.

No existe entorno demo ni fallback a mocks. Una configuración fallida conserva
su error; no se sustituye por arrays de cuentas vacíos ni por importes cero. `—`
significa «no disponible». No se calculan métricas financieras con `number`.

## Migraciones y acceso

`supabase/config.toml` se generó con `supabase init` de la CLI instalada y se redujo
a la base local necesaria. Registro público/anónimo, seeds, exposición automática
de tablas, Realtime, funciones y analytics están deshabilitados. Auth, correo local
de prueba y Storage están habilitados en configuración; el stack no se inició.
PostgreSQL 17 es el objetivo local; se verificó el esquema en PostgreSQL 17.11
nativo y temporal, sin versión remota acordada.

La migración está en [supabase/migrations](supabase/migrations/README.md). Se aplicó
desde cero en una base sintética efímera, sin conectar la aplicación. No se enlazó
un proyecto, inició Docker ni modificó un servicio remoto. La CLI 3 cambió los destinos predeterminados y las confirmaciones
para acciones remotas: consultar siempre el help de la versión fijada antes de operar.

El esquema privado tiene RLS forzado y políticas admin/reader. Las vistas administrativas
son invoker; las RPC publicadas proyectan campos seguros y respetan RLS con un rol interno
sin BYPASSRLS. Solo el operador asigna roles por SQL revisado. El bucket se crea privado
mediante migración; no se ha verificado en Storage real. Ver [auth](docs/auth.md).
No subir fuentes financieras ni secretos al repositorio.

### Prueba reproducible del esquema

Requiere PostgreSQL 17 con herramientas de cliente/servidor y `btree_gist` instalados:

```sh
npm run test:db
# Si pg_config apunta a otra instalación:
APP_PAPA_PG_BIN=/opt/homebrew/opt/postgresql@17/bin npm run test:db
```

El script crea su propio clúster `app_papa_synthetic` en un directorio temporal,
solo con socket privado y sin TCP; aplica migraciones, prueba restricciones y
permisos con datos sintéticos, prueba dos publicaciones concurrentes y restaura
el esquema en otra base vacía. Al terminar elimina únicamente ese clúster. No acepta
URL ni usa credenciales de la aplicación. No ejecutarlo como root (`initdb` lo rechaza).
El bootstrap contiene solo contratos SQL mínimos de roles/Auth/Storage para PostgreSQL
nativo; no equivale a probar el servicio Supabase Auth, Storage o PostgREST.

Consultar [diccionario](docs/data-dictionary.md), [consultas agregadas](docs/aggregate-queries.md)
y [evidencia y límites](docs/validation.md). Ver [uso, formatos, límites y recuperación de importaciones](docs/imports.md).
Correspondencias permite resolver con evidencia, revisar todo el alcance y publicar/corregir sin duplicar versiones.
La etapa 6 implementa consultas/indicadores reutilizables mediante `queryReport` y `/api/consultas`, con JSON y CSV paginados bajo los mismos filtros/permisos. Ver el contrato de consultas. Resumen y Análisis comercial consumen esa misma RPC, con filtros compartidos en URL, cobertura y detalle paginado. La etapa 7 agrega rankings y participaciones; la 8, Cuentas y administración con revisión histórica; la 9, descarga CSV completa y verificación integral sintética. La preparación de entornos y operación está documentada en [operations.md](docs/operations.md); destinos, decisiones y validación remota pendientes constan en [progress.md](docs/progress.md).

## Estados de interfaz

- `src/app/loading.tsx`: skeleton y anuncio accesible «Cargando sección…» durante Suspense.
- Estados vacíos: sin cuentas, importaciones ni series disponibles; cobertura sin verificar.
- `src/app/error.tsx`: mensaje genérico, reintento de la sección y vuelta al Resumen; no imprime payloads.
- `src/app/not-found.tsx`: recuperación de navegación ante rutas inexistentes.
- Aviso de configuración inválida: distingue un error del entorno de un estado vacío.

La navegación es utilizable con teclado, incluye enlace para saltar al contenido,
foco visible y `aria-current`. Se respeta la preferencia de movimiento reducido.
Esto no equivale a una certificación de accesibilidad ni a pruebas con lectores de pantalla.

## Referencias consultadas el 2026-11-11

- [Next: instalación](https://nextjs.org/docs/app/getting-started/installation),
  [ESLint](https://nextjs.org/docs/app/api-reference/config/eslint),
  [error y retry](https://nextjs.org/docs/app/api-reference/file-conventions/error),
  [agentRules](https://nextjs.org/docs/app/api-reference/config/next-config-js/agentRules).
  Se deshabilitó `agentRules` para conservar `AGENTS.md` sin modificaciones automáticas.
- [Radix Themes: instalación y Theme](https://www.radix-ui.com/themes/docs/overview/getting-started).
- [Recharts: instalación y peer react-is](https://github.com/recharts/recharts#installation).
- [Supabase: inicializar cliente](https://supabase.com/docs/reference/javascript/initializing),
  [changelog](https://supabase.com/changelog.md),
  [cambio de CLI 3](https://supabase.com/changelog/supabase-cli-v3),
  [retiro de cifrados TLS antiguos](https://supabase.com/changelog/cbc-tls-ciphers-deprecated).
  No se habilita TLS legacy ni se probó conectividad remota.

Además de la documentación se consultaron versiones, engines y peerDependencies
en npm; las comprobaciones locales y sus límites están en [docs/progress.md](docs/progress.md).
La guía externa sirve de referencia: las etapas posteriores requieren su propia solicitud.


## Verificar Resumen y Análisis comercial (etapa 7)

`npm run build && npm run test:dashboard` crea un PostgreSQL temporal por socket privado sin TCP, aplica todas las migraciones, publica el fixture sintético común y comprueba Next → RPC → PostgreSQL bajo lector → HTML/API. Simula únicamente Auth/HTTP; no acredita servicios Supabase reales. Requiere los binarios PostgreSQL locales (`pg_config`). No admite una URL de base externa, no toca bases existentes ni crea una demo en la aplicación.

Para repetir el recorrido visual: `npm run test:dashboard -- --serve`; abrir la URL `/fixture-login` impresa, solo datos SINTÉTICOS. El proceso mantiene su clúster y servidores aislados hasta Ctrl+C, cuando los elimina. Consultar casos/pasos y limitaciones en [docs/validation.md](docs/validation.md). No usar este arnés con información real.


## Cuentas y administración (etapa 8)

Cuentas incluye búsqueda textual (ceros conservados), filtros compartidos, orden estable y paginación con revisión. El detalle muestra identidad, historia mensual del rango, atribución comercial, procedencia y Revenue paginado. Comercial/equipo del listado son referencias al cierre; el Revenue usa cada cierre histórico. Los meses fuera del filtro se identifican como contexto. Originales y archivos permanecen reservados a admin.

Configuración se puede consultar como lector. Admin mantiene clientes, custodios, equipos, comerciales, membresías, asignaciones manuales y clasificación de cuentas; cuentas nuevas por importación. Para un cambio: completar campos, evidencia/fechas cuando corresponda y motivo → Revisar efecto → verificar antes/después y cuenta-meses afectados → Confirmar y guardar. Hasta es exclusiva; para mover de equipo, cerrar la membresía anterior y crear la siguiente sin superponerlas. FA publicado se corrige por importación versionada. Desactivar no borra hechos ni reasigna historia.

Las RPC rechazan cambios directos, referencias inválidas/inactivas, solapamientos, tokens ajenos/obsoletos y cambios de más de 5000 cuenta-meses. La revisión vence a los 30 minutos; se conserva auditoría y reintentos no duplican la operación. Las opciones administrativas sugieren hasta 250 registros por tipo y admiten UUID del catálogo. Catálogos/auditoría tienen páginas de 25. Sin edición manual de importes ni roles.

`npm run test:db` incluye la suite de cuentas/modelo; `npm run test:auth:http` prueba acceso directo del lector a edición; `npm run test:dashboard -- --serve` ofrece login lector y administrador **sintéticos** sobre PostgreSQL efímero. Ver pasos y límites en [validación](docs/validation.md). No conecta ni migra un Supabase remoto.

## Exportación y circuito integral (etapa 9)

Aplicar filtros en Resumen o Análisis comercial y pulsar **Descargar … CSV completo**. Incluye todas las filas del desglose (máximo 10.000), totales, series, cobertura, período, filtros, revisión y definiciones. Si los datos cambian, reiniciar la consulta antes de descargar. El tamaño de página visible no limita el archivo. Admin y lector exportan únicamente información publicada; originales privados se descargan desde su circuito administrativo.

CSV UTF-8 con BOM, separado por comas y punto decimal. Textos peligrosos llevan apóstrofo; importes negativos/cero y decimales se conservan sin convertirlos a números binarios. Excel puede reducir la precisión al abrirlo: usar importación de texto para las columnas con decimales extensos. Ver [contrato](docs/aggregate-queries.md).

`npm run test:dashboard` ahora ejecuta login por formularios Next, cargas CSV sintéticas de FA/AUM/Revenue, correspondencias, vigencias, conciliación/publicación de dos meses, consulta y CSV, retry/reimportación, corrección aislada/historia, archivo inválido y descarga completa de 253 cuentas en dos páginas SQL. PostgreSQL/RLS son reales en un clúster temporal; Auth, transporte y bytes Storage son sintéticos. Las carreras entre sesiones y demás restricciones se ejecutan con `npm run test:db`. La matriz completa, checks y pendientes para archivos reales están en [validación](docs/validation.md). Sin despliegue ni validación financiera real.
