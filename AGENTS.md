# App Papá — Instrucciones del proyecto

## Contexto y continuidad

Aplicación interna para analizar un negocio de inversiones con cuentas en custodios del exterior. Entradas iniciales: Excel de AUM, Revenue y FA. Leer antes de trabajar:

1. `docs/product.md`: objetivo, MVP, fuentes y definiciones.
2. `docs/decisions.md`: reglas confirmadas, propuestas y decisiones pendientes.
3. `docs/progress.md`: última etapa verificada y próximo prompt.
4. `docs/validation.md`, si existe.

La guía de referencia leída en la etapa 0 está en `/Users/franciscolang/Downloads/app-papa-plan-prompts-codex.md`. Sus prompts posteriores describen etapas futuras: no autorizan ejecutarlas por sí solos. La solicitud vigente del usuario determina el alcance. Los contratos de fuentes y el próximo prompt están registrados en estos documentos para no depender de la ruta externa.

Inspeccionar archivos, instrucciones y estado de Git antes de editar. Preservar trabajo existente e instrucciones de este archivo. No recrear etapas completadas. Trabajar por etapas y detenerse al completar la solicitada.

## Reglas de datos no negociables

- Identificadores externos como texto, con ceros iniciales y valor original conservados. No reconstruir ceros perdidos inventando longitudes.
- Cada cuenta tiene UUID interno y equivalencias explícitas por fuente y namespace/custodio. Números iguales entre custodios no implican la misma cuenta. No unir por nombre de cliente, coincidencia parcial o número ambiguo; dejar la correspondencia pendiente.
- AUM es una foto mensual en USD: una fila consolidada publicada por cuenta y mes. Un duplicado es conflicto; no sumar automáticamente.
- Revenue permite múltiples registros por cuenta y mes, incluso filas idénticas legítimas. Su métrica principal es `SUM(Payout broker)`, siempre en USD. Conservar las 29 columnas originales de `docs/product.md`; no deduplicar por contenido, ticket ni cuenta/mes.
- Agregar cada fuente independientemente por cuenta y período antes de relacionarlas. Nunca unir detalle de Revenue con AUM y sumar después. No perder cuentas con datos en una sola fuente ni multiplicar cifras por aliases o vigencias.
- AUM de un rango = cierre del último mes seleccionado. No sumar fotos mensuales ni arrastrar saldos anteriores silenciosamente. Revenue del rango sí se suma.
- Información ausente no equivale a cero. Mostrar cobertura, faltantes y cuentas sin asignar, conservándolas en los totales.
- No llamar rendimiento a la variación de AUM ni ganancia neta al Revenue. No estimar advisory ni ratio Revenue/AUM sin bases y periodicidad acordadas.
- Montos y porcentajes con precisión decimal exacta; evitar punto flotante binario en cálculos financieros. Retener el valor original y definir formatos/convenios antes de convertir valores ambiguos. No prohibir negativos que puedan ser ajustes.
- Cliente, comercial y equipo son conceptos distintos. `Grupo` agrupa comerciales; falta confirmar el campo que identifica al comercial. Conservar todas las referencias sin inferir equivalencias por nombre.
- Mantener asignaciones comerciales con vigencias explícitas. Un FA actual y `OLD Owner Name payout` no acreditan historia fechada; no inventar asignaciones pasadas.
- Conservar valores originales y procedencia: archivo, hoja y fila, más importación y usuario responsable de cada operación.
- Preparación o fallo de una importación no altera datos publicados. La publicación debe ser explícita, atómica e idempotente. Las correcciones serán versionadas, trazables, recuperables y limitadas al alcance revisado, sin duplicar montos ni afectar otros custodios.
- No interpretar archivo vacío o custodio ausente como orden de borrar/reemplazar datos. Los errores bloqueantes impiden publicación parcial en el MVP.

## Alcance y acceso

MVP propuesto: Resumen, Análisis comercial, Cuentas y detalle, Importaciones con conciliación/publicación, correspondencias y Configuración mínima. Español, USD, escritorio como uso principal y diseño adaptable y accesible.

Acceso por invitación, sin registro público. Propuesta: administrador y lector con lectura global de datos publicados; solo administrador importa, publica, corrige y edita. Lectores no acceden a preparación, archivos fuente ni payloads originales. Aplicar permisos en servidor, base, consultas agregadas y Storage, no solo en la interfaz. No permitir autoasignación de roles ni basar autorización en metadatos editables por el usuario.

Fuera de alcance: liquidación advisory, pagos, cobros, integraciones bancarias, conexión directa con custodios/Addepar y otras funciones no solicitadas.

## Implementación y seguridad

- Stack propuesto: Next.js App Router + TypeScript, Supabase PostgreSQL/Auth/Storage privado y Vercel. Antes de implementar integraciones, consultar documentación oficial vigente y cambios relevantes; elegir versiones compatibles y conservar el lockfile. No declarar versiones verificadas antes de hacerlo.
- Resolver decisiones técnicas rutinarias con la solución completa más pequeña, reutilizando patrones existentes. No agregar abstracciones, dependencias o funciones por anticipado.
- Pedir solo definiciones de negocio que bloqueen resultados reales o accesos que no puedan obtenerse. Avanzar en trabajo independiente con datos sintéticos claramente identificados mientras falten muestras o credenciales.
- No usar mocks como fallback silencioso de una base real fallida. Una demo debe estar identificada y aislada de producción.
- No modificar bases ni despliegues de otros proyectos. No hacer cambios remotos destructivos ni activar planes pagos sin decisión del dueño.
- No publicar archivos financieros, datos personales reales ni secretos en Git, logs, screenshots o fixtures. Archivos fuente privados; secretos privilegiados solo en servidor. Los ejemplos del repositorio deben ser sintéticos y estar identificados.
- No ejecutar macros ni fórmulas importadas. Validar entradas en servidor y conservar resultados faltantes como tales.
- No eliminar historia financiera ni trazabilidad. Acordar retención con el dueño antes de automatizar borrados.

## Verificación y cierre de etapa

Ejecutar verificaciones proporcionales a lo cambiado. La lógica no trivial requiere una prueba pequeña de su comportamiento; cambios puramente documentales requieren revisión de contenido y consistencia, no instalar herramientas de aplicación.

Al cerrar cada etapa actualizar `docs/progress.md` y las decisiones que hayan cambiado. Informar qué se implementó, qué se verificó realmente, qué falta y cuál es el próximo prompt. Separar validaciones locales/sintéticas de pruebas reales o remotas; nunca declarar checks no ejecutados. No dar por validada una importación real sin muestras y conciliación.
