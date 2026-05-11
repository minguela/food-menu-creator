# Registro de Tareas

## Sesión actual: 2026-05-11 - Escalado rotativo, cantidades relativas y warnings nutricionales

### Checklist de tareas

- [x] Tarea #166: Implementar escalado por densidad calórica en menús rotativos
  - Nota: creado `openspec/changes/caloric-density-ingredient-scaling`; `utils/rotating-portion-scaling.js` y su copia `menu-web` añaden buckets/factores por densidad, fallback por `kcal_per_100g` y cálculo de cantidad final sin bajar de la cantidad base. Los runtimes raíz y `menu-web` usan esta cantidad final por ingrediente e incluyen diagnósticos `density_bucket`, `density_factor` e `ingredient_multiplier`.
- [x] Tarea #167: Validar regresiones y archivar OpenSpec de densidad calórica
  - Nota: añadida cobertura Node y Playwright para probar que ingredientes `low` crecen más que `very_caloric` y que el fallback por kcal funciona; ejecutados `npm run test:rotating`, `npm run test:rotating:playwright`, `npm run build`, validación OpenSpec del cambio y validación global de specs antes del archivado.
- [x] Tarea #159: Trazar OpenSpec para corregir colapso de kcal/cantidades en menús rotativos
  - Nota: creado `openspec/changes/fix-rotating-menu-kcal-quantity-scaling` para formalizar que el generador no debe persistir cantidades simbólicas tipo 1-3g ni ocultar desviaciones extremas de kcal/proteína.
- [x] Tarea #160: Aplicar fix de escalado en runtime real y copia `menu-web`
  - Nota: se añadió `utils/rotating-portion-scaling.js` y su equivalente en `menu-web/utils`; `server/api/rotating-menu-generate.post.ts` y `menu-web/server/api/rotating-menu-generate.post.ts` usan multiplicador aplicado real, mínimo `>= 1`, diagnóstico de cap y paridad entre árbol raíz y `menu-web`.
- [x] Tarea #161: Corregir paridad de despliegue raíz vs `menu-web`
  - Nota: creado `openspec/changes/fix-rotating-scaling-runtime-parity`; se detectó que producción usaba el runtime raíz (`server/`) mientras el primer fix solo tocó `menu-web/`; se portó la lógica y se validó build raíz.
- [x] Tarea #162: Evitar que recetas placeholder `1g` rompan generación con `409`
  - Nota: las cantidades positivas implausibles (`1g`) pasan a tratarse como pesos relativos para el cálculo, permitiendo multiplicadores altos por encima del antiguo `x2.50`; los datos estructuralmente inválidos (cantidad <= 0, unidades no convertibles, nutrition pending) siguen bloqueando.
- [x] Tarea #163: Convertir desviaciones kcal/proteína diarias de error `422` a warning no bloqueante
  - Nota: creado `openspec/changes/allow-rotating-menu-with-nutrition-warnings`; `dayNutritionGuardrailViolations` ahora se loguea como `warn/completed`, se devuelve en `warnings.day_nutrition_violations`, y el menú se guarda/retorna para poder inspeccionarlo aunque no llegue a kcal/proteína objetivo.
- [x] Tarea #164: Añadir cobertura de regresión Node y Playwright para escalado rotativo
  - Nota: `npm run test:rotating` cubre recetas placeholder, multiplicadores > `x2.50`, mínimo de base y detección de días colapsados; `npm run test:rotating:playwright` añade `tests/rotating-portion-scaling.spec.ts` con cobertura Playwright de placeholder no-bloqueante, escape del cap antiguo y warnings para días colapsados.
- [x] Tarea #165: Validar build, specs y archivar OpenSpec relacionado
  - Nota: ejecutados `npm run test:rotating`, `npm run test:rotating:playwright`, `npm run build`, `openspec validate` y sincronizadas specs principales `rotating-menu-portion-scaling`, `rotating-scaling-runtime-parity` y `rotating-menu-nutrition-warnings` antes del archivado.

## Sesión actual: 2026-05-10 - Fix colisión unique en generación rotativa

### Checklist de tareas

- [x] Tarea #158: Corregir error 500 por `unique_rotating_day_meal` en creación de menús rotativos
  - Nota: en `menu-web/server/api/rotating-menu-generate.post.ts` se deduplican comidas por `meal_type` dentro de cada día antes de persistir `rotating_menu_meals` (se conserva la primera y se descartan repetidas), evitando colisiones de clave única `(rotating_menu_day_id, meal_type)`; además se registran warnings de diagnóstico (`duplicates_count` + muestra de duplicados). Build validado con `npm run build`; PR `https://github.com/minguela/food-menu-creator/pull/30` mergeada a `main`.

## Sesion actual: 2026-05-08 - Fix validacion macros rotativa (0P/0H/0G)

### Checklist de tareas

- [x] Tarea #156: Evitar falsos `invalid_meals` cuando una macro individual es 0
  - Nota: `menu-web/server/api/rotating-menu-generate.post.ts` deja de invalidar por macro individual a `<= 0`; ahora invalida solo si `final_kcal <= 0`, no hay ingredientes, hay `nutrition_pending`, hay macros negativas, o la suma total de macros (`protein + carbs + fat`) es `<= 0`. Esto cubre explicitamente casos validos con `0 grasas`, `0 proteinas` o `0 hidratos`.
- [x] Tarea #157: Publicar y mergear fix a `main`
  - Nota: rama `fix/rotating-zero-carb-validation`, PR `https://github.com/minguela/food-menu-creator/pull/27`, merge completado a `main`.

## Sesión actual: 2026-05-08 - Toast global + cierre de modales

### Checklist de tareas

- [x] Tarea #146: Sustituir `alert(...)` por toast en pantallas principales
  - Nota: se elimina el uso de `alert` en `recipes`, `index`, `menu/[id]`, `shopping` y `history`, usando `useAppToast` con mensajes de éxito/error homogéneos.
- [x] Tarea #147: Mejorar UX de guardado masivo de recetas
  - Nota: `saveSelectedRecipes` evita spam de notificaciones por receta y muestra un único resultado agregado (todo OK, parcial o fallo total).
- [x] Tarea #148: Verificación de compilación tras migración de feedback
  - Nota: `npm run build` OK en `menu-web`; `npm run lint` mantiene aviso conocido de `vue-router/volar/sfc-route-blocks` sin bloquear build.
- [x] Tarea #149: Corregir sobreescritura global de utilidades Tailwind (`bg-white`, textos y bordes)
  - Nota: se eliminaron overrides globales en `menu-web/assets/css/main.css` que forzaban modo oscuro sobre clases utilitarias; el theming queda en tokens `ui-*` y `bg-white` vuelve a comportarse de forma predecible.
- [x] Tarea #150: Reimplantar modo oscuro con clases Tailwind en todas las páginas
  - Nota: se aplicaron variantes `dark:*` a las páginas de `menu-web/pages/**` y se activó contexto `dark` desde `menu-web/app.vue`, sin volver a sobreescribir utilidades globales de Tailwind.
- [x] Tarea #151: Corregir bloqueo de generación rotativa al 0%
  - Nota: `rotating-menu-jobs` vuelve a disparar el procesado también en jobs deduplicados y `/generar` añade doble kick + polling de respaldo para evitar estancamiento visual cuando falla/retrasa Realtime.
- [x] Tarea #152: Hardening dark mode sin sobreescrituras globales
  - Nota: se define contrato de clases en `menu-web/docs/dark-mode-class-contract.md`, se añade auditoría automática `npm run lint:dark` (`menu-web/scripts/check-dark-classes.mjs`) y se corrigen componentes con clases light-only (`IngredientCard`, `NutritionInputs`) añadiendo variantes `dark:*`.
- [x] Tarea #153: Import CSV de ingredientes idempotente ante duplicados
  - Nota: `menu-web/server/api/ingredients-import-csv.post.ts` deduplica filas por `normalized_name`, resuelve existentes por `normalized_name`/`name`, evita 500 por `ingredients_name_key`, y devuelve resumen estructurado (`inserted`, `updated`, `skipped`, `conflicts`); `menu-web/pages/ingredients.vue` muestra ese resumen en toast.
- [x] Tarea #154: Guardado batch de ingredientes confirmados en recetas
  - Nota: nuevo endpoint `menu-web/server/api/recipe-confirmed-ingredients-save.post.ts`; `menu-web/pages/recipes.vue` deja de guardar uno a uno y envía todos los ingredientes confirmados en una sola llamada, reduciendo llamadas de red y estabilizando el guardado.
- [x] Tarea #155: Sustituir `confirm(...)` nativo por modal web compartida
  - Nota: se añade `menu-web/composables/use-confirm-dialog.ts` + `menu-web/components/AppConfirmDialog.vue` montado en `menu-web/app.vue`; migradas confirmaciones destructivas en `index`, `recipes`, `ingredients`, `menu/[id]`, `history` y `config`.

## Sesión actual: 2026-05-08 - Curación de recetas (draft local + catálogo + hardening backend)

### Checklist de tareas

- [x] Tarea #136: Evitar inserción inmediata al pulsar “Añadir ingrediente manual”
  - Nota: `menu-web/pages/recipes.vue` ahora crea filas `draft-*` en frontend (estado local) y persiste al guardar (`saveConfirmedRow` / `saveRecipeForm`), evitando escrituras tempranas y errores de unique por placeholders repetidos.
- [x] Tarea #137: Guardado de formulario unificado para receta en edición
  - Nota: se añade `Guardar formulario`, que encadena guardado de metadatos + ingredientes confirmados en el mismo flujo de guardado.
- [x] Tarea #138: Reutilizar ingredientes existentes desde catálogo en curación
  - Nota: nuevo bloque “Añadir ingrediente existente (catálogo)” con búsqueda/autocompletado; se evita duplicar ingredientes por nombre normalizado dentro de la receta abierta.
- [x] Tarea #139: Canonicalizar nombre al confirmar/guardar ingredientes vinculados
  - Nota: si existe `ingredient_id`, se persiste el nombre canónico de `ingredients` y su `normalized_name`, reduciendo variaciones tipo `Aceite`/`aceite`.
- [x] Tarea #140: Blindaje backend de normalización y deduplicación en `recipe_ingredients`
  - Nota: nueva migración `supabase/migrations/20260508153000_recipe_ingredients_normalization_hardening.sql` con función `normalize_ingredient_name`, trigger `before insert/update`, auto-link por `normalized_name`, merge en colisión y saneamiento/deduplicación de datos existentes.
- [x] Tarea #141: Aplicar migraciones y publicar cambios web
  - Nota: migración aplicada con `supabase db push --include-all`; cambios web en commit `888b104`; rama `feat/recipe-curation-catalog-normalization`; PR `https://github.com/minguela/food-menu-creator/pull/16`.
- [x] Tarea #142: Restringir estado `complete` cuando existan sugerencias pendientes
  - Nota: `menu-web/pages/recipes.vue` actualiza `syncRecipeStatus` para bloquear `complete` si hay filas no confirmadas o marcadas como sugeridas; en ese caso la receta pasa a `pending_ingredients`.
- [x] Tarea #143: Escalar búsqueda de catálogo de ingredientes a server-side
  - Nota: nuevo endpoint `menu-web/server/api/ingredients-catalog-search.get.ts` con query + límite; `menu-web/pages/recipes.vue` cambia de carga masiva local a búsqueda remota con debounce y estados de carga/empty/error en el bloque de “Añadir ingrediente existente”.
- [x] Tarea #144: Curación manual-first + densidad calórica para control de cantidades
  - Nota: import CSV pasa a `source=manual_csv` y aplica quality gate (opción 2: `complete` si valida, `needs_review` si no), se añade `review_reason` y `caloric_density_level`; la UI muestra etiqueta calórica y debug de `raw_payload` de candidatos; `rotating-menu-generate` limita multiplicador cuando hay ingredientes `caloric`/`very_caloric`.
- [x] Tarea #145: Simplificación manual-first de pantalla de ingredientes + merge seleccionado
  - Nota: import CSV pasa a botón+modal y se añade export CSV; se retiran controles de fuente/enriquecer/mapear y acciones OFF/autocompletar/restaurar en tarjeta; se añade `english_name` para curación USDA manual; nueva fusión de ingredientes seleccionados con destino explícito, reasignando recetas al ingrediente que se conserva.

## Sesión actual: 2026-05-06 - Observabilidad de generación rotativa

### Checklist de tareas

- [x] Tarea #131: Añadir persistencia de logs por job de generación
  - Nota: nueva migración `20260506100000_menu_generation_logs.sql` con `menu_generation_logs`, `current_step`, `heartbeat_at` y publicación Realtime para jobs/logs.
- [x] Tarea #132: Instrumentar lifecycle del job rotativo
  - Nota: nuevo helper `menu-generation-logger.ts`; `rotating-menu-jobs` y `rotating-menu-jobs-process` registran creación, deduplicación, inicio, finalización, errores y heartbeat.
- [x] Tarea #133: Instrumentar pasos críticos del generador
  - Nota: `rotating-menu-generate` registra validación, lectura de perfiles, kcal/macros, selección/validación de recetas, cálculo de cantidades, escalado por perfil, comidas libres, validación macro, guardado Supabase y lista de compra.
- [x] Tarea #134: UI de progreso y debugging en vivo
  - Nota: `/generar` muestra paso actual, barra de progreso y timeline de logs realtime; `/history` permite desplegar logs históricos por job.
- [x] Tarea #135: Robustez adicional
  - Nota: se evitan consultas `.in(...)` con arrays vacíos y se devuelve error explícito si los menús fuente no tienen comidas.

## Sesión actual: 2026-05-04 - Curación OFF + mapeo ES→EN para USDA

### Checklist de tareas

- [x] Tarea #114: Priorizar Open Food Facts como fuente principal de curación
  - Nota: `ingredients.vue` y `recipes.vue` pasan a usar OFF como fuente por defecto en búsqueda y autoaplicación.
- [x] Tarea #115: Forzar enriquecimiento batch a OFF cuando se usa modo auto/bedca
  - Nota: `server/api/enrich-ingredients.post.ts` normaliza `auto|bedca` a `open_food_facts` y mantiene USDA solo cuando se solicita explícitamente.
- [x] Tarea #116: Crear mapeo masivo ES→EN para ingredientes existentes
  - Nota: añadido endpoint `server/api/ingredient-aliases-backfill.post.ts` que recorre `ingredients` y hace upsert en `ingredient_aliases`.
- [x] Tarea #117: Añadir helper de traducción de aliases para USDA
  - Nota: nuevo util `server/utils/ingredient-aliases.ts` con mapeo por diccionario + fallback por tokens y marca `auto_needs_review` en casos no exactos.

## Sesión actual: 2026-05-05 - Fusión de ingredientes y calidad de candidatos OFF

### Checklist de tareas

- [x] Tarea #118: Fusionar ingredientes duplicados singular/plural sin perder recetas
  - Nota: nuevo endpoint `server/api/ingredients-merge-duplicates.post.ts` que reasigna `recipe_ingredients`, `ingredient_aliases` y `ingredient_nutrition_candidates` al ingrediente canónico antes de borrar duplicados.
- [x] Tarea #119: Aplicar candidato funcional y limpieza de duplicados de sugerencias
  - Nota: `ingredients-apply-candidate.post.ts` elimina la cola de candidatos del mismo `ingredient_id` al aplicar uno.
- [x] Tarea #120: Reducir ruido de sugerencias y exigir confianza mínima OFF
  - Nota: `enrich-ingredients.post.ts` usa `page_size=25`, deduplica upsert de candidatos y aplica umbral mínimo `0.75`; si no llega, marca `not_found` y sigue con otros ingredientes.
- [x] Tarea #121: Corregir 401 Invalid JWT en proxy de búsqueda de ingredientes
  - Nota: `resolveSupabaseServerKey` ignora valores que no tengan formato JWT antes de invocar la Edge Function `ingredient-search`.
- [x] Tarea #122: Curación individual real desde recetas
  - Nota: al curar una fila con un candidato se guarda el ingrediente maestro, se actualiza `recipe_ingredients`, se confirma la fila y se eliminan sugerencias pendientes duplicadas del mismo ingrediente en la receta abierta.
- [x] Tarea #123: Ampliar fusión de ingredientes por equivalencias culinarias
  - Nota: `ingredients-merge-duplicates.post.ts` añade clave canónica con singularización ligera y equivalencias explícitas como atún/bonito en conserva y escarola/canónigos.
- [x] Tarea #124: Ocultar candidatos con confianza baja
  - Nota: `ingredient-search.post.ts` y la carga de candidatos en `ingredients.vue` filtran `confidence < 0.75`.
- [x] Tarea #125: Enriquecimiento OFF por selección, búsqueda o siguiente pendiente
  - Nota: `enrich-ingredients.post.ts` acepta `ingredientId(s)`/`query`, procesa como máximo 10 por llamada y usa el nombre español para Open Food Facts.
- [x] Tarea #126: Evitar colisión unique al fusionar ingredientes
  - Nota: la fusión de ingredientes combina o elimina filas duplicadas de `recipe_ingredients` antes de renombrarlas al ingrediente canónico.
- [x] Tarea #127: Acceso de ingredientes a recetas y curación individual
  - Nota: `ingredients.vue` muestra enlaces a recetas por ingrediente y añade botón `Curar OFF` por fila usando `ingredientId`; `recipes.vue` abre una receta desde `?recipe=<id>`.
- [x] Tarea #128: Validación nutricional antes de completar enriquecimientos
  - Nota: añadido control de coherencia kcal/macros y límite de 100g por macro; los candidatos sospechosos quedan como `needs_review` en vez de `complete`.
- [x] Tarea #129: Rediseño de curación individual de ingredientes
  - Nota: `/ingredients` pasa a tarjetas independientes con filtros de calidad, edición por ingrediente, guardar/guardar y siguiente, fuente por fila, valores originales, sugerencias y validación visual reutilizable.
- [x] Tarea #130: Refactor global de flujo, algoritmo y compra automática
  - Nota: nueva migración con `daily_protein_target` por perfil + índices de integridad/rendimiento; `rotating-menu-generate` usa proteína explícita, calcula desviaciones por perfil y genera automáticamente lista de compra; nueva API `shopping-from-rotating`; nueva página `/workflow` para guiar el proceso completo; `generar.vue` rediseñada para comparación multi-perfil con cantidades por ingrediente y desvíos diarios.

## Sesión actual: 2026-05-04 - Ajuste de estados de receta (sugerida/completa/no requiere)

### Checklist de tareas

- [x] Tarea #109: Estado automático a `complete` al guardar receta sugerida con ingredientes confirmados
  - Nota: en `menu-web/pages/recipes.vue`, `syncRecipeStatus` ahora marca `complete` siempre que exista al menos 1 ingrediente confirmado.
- [x] Tarea #110: Estado manual siempre `complete` tras guardado de ingredientes
  - Nota: al confirmar/guardar ingredientes manuales ya no depende del cálculo nutricional para pasar a `complete`.

## Sesión actual: 2026-05-04 - Guardado externo y contador en recetas

### Checklist de tareas

- [x] Tarea #111: Mostrar contador de ingredientes asociados por receta
  - Nota: en `menu-web/pages/recipes.vue` se añade badge junto al nombre con el total de ingredientes asociados.
- [x] Tarea #112: Guardado rápido desde fuera de la ficha (1 a 1)
  - Nota: botón `Guardar` en cada tarjeta de receta sin necesidad de abrir el panel de edición.
- [x] Tarea #113: Guardado en bloque de recetas seleccionadas
  - Nota: botón `Guardar seleccionadas` en la barra de acciones para ejecutar guardado masivo.

## Sesión actual: 2026-05-04 - Curación y generación rotativa

### Checklist de tareas

- [x] Tarea #84: Clarificar nutrición en ingredientes a nivel UI
  - Nota: en `menu-web/pages/ingredients.vue` los encabezados pasan a `kcal/100g`, `P/100g`, `H/100g`, `G/100g` para evitar ambigüedad.
- [x] Tarea #85: Borrado individual y masivo de ingredientes
  - Nota: añadidos checkboxes por fila, selección total de filas visibles, botón de borrado en bloque y borrado individual por fila en `ingredients.vue`.
- [x] Tarea #86: Borrado individual y masivo de recetas
  - Nota: añadidos selector por receta, botón de borrado masivo y botón de borrado individual en cada receta en `menu-web/pages/recipes.vue`.
- [x] Tarea #87: Ocultar cantidades en la curación de recetas
  - Nota: la UI de recetas ya no muestra inputs de cantidad; se mantiene una base técnica interna para no romper el cálculo posterior.
- [x] Tarea #88: Relación directa receta ingrediente maestro
  - Nota: al abrir curación se intenta vincular automáticamente `recipe_ingredients` confirmados que no tengan `ingredient_id`; al confirmar/guardar se exige asociación a ingrediente maestro.
- [x] Tarea #89: Bloqueo previo al generar menú rotativo si hay elementos sin curar
  - Nota: `menu-web/server/api/rotating-menu-generate.post.ts` ahora valida recetas/ingredientes antes de generar y devuelve `409` con lista `uncured_recipes` si hay pendientes.
- [x] Tarea #90: Mensaje de UI con detalle de pendientes en generación rotativa
  - Nota: `menu-web/pages/generar.vue` muestra error legible con ejemplos de recetas pendientes cuando el backend bloquea la generación.

### Pendiente

- Añadir tests E2E de selección masiva/borrado en `ingredients` y `recipes`.
- Añadir tests API para casos `409` de `rotating-menu-generate` con recetas `pending_ingredients`, `suggested_ingredients`, `missing_ingredient_link` y `missing_nutrition`.

## Sesión actual: 2026-05-04 - Curación de recetas sin cierres involuntarios

### Checklist de tareas

- [x] Tarea #98: Evitar cierre de ficha de receta al interactuar con ingredientes
  - Nota: `menu-web/pages/recipes.vue` ahora refresca solo la receta abierta tras confirmar/guardar/eliminar/añadir ingrediente, sin cerrar el panel de edición.
- [x] Tarea #99: Optimizar recarga de datos en receta abierta
  - Nota: añadida lógica de refresco puntual (`refreshEditingDish`) para evitar recargas globales de la lista cada interacción.
- [x] Tarea #100: Revisión de comportamiento similar en curación
  - Nota: se normaliza el flujo de interacción para que acciones frecuentes no rompan el contexto de edición.
- [x] Tarea #101: Subida de versión minor
  - Nota: `menu-web/package.json` actualizado a `0.2.0`.

## Sesión actual: 2026-05-04 - Normalización de recetas duplicadas OCR

### Checklist de tareas

- [x] Tarea #102: Fusión de recetas desde UI
  - Nota: añadida acción `Fusionar seleccionadas` en `menu-web/pages/recipes.vue` con elección de receta destino y nombre final.
- [x] Tarea #103: División de recetas combinadas
  - Nota: añadida acción `Dividir` por receta con detección de partes (`+`, primero/segundo, de segundo) y creación de recetas separadas.
- [x] Tarea #104: División asistida con ingredientes sugeridos
  - Nota: al dividir, se copian sugerencias de ingredientes de la receta original a las nuevas partes por coincidencia textual.
- [x] Tarea #105: Buscador por nombre en recetas
  - Nota: añadido input de búsqueda por nombre en cabecera de filtros de `recipes`.
- [x] Tarea #106: Buscador por nombre/normalizado en ingredientes
  - Nota: `ingredients` filtra por `name` y `normalized_name`.
- [x] Tarea #107: Limpieza de selección tras fusionar
  - Nota: al terminar una fusión se limpian los checkboxes seleccionados.
- [x] Tarea #108: Alta múltiple de ingredientes en receta
  - Nota: se pueden pegar varios ingredientes (uno por línea) y añadir en bloque con unidad por defecto `g`.

## Sesión actual: 2026-05-04 - Versionado visible en web

### Checklist de tareas

- [x] Tarea #91: Mostrar versión desplegada en la UI
  - Nota: `menu-web/app.vue` muestra versión en cabecera (desktop) y en navegación móvil (footer fijo).
- [x] Tarea #92: Exponer metadatos de versión/build
  - Nota: `menu-web/nuxt.config.ts` añade `runtimeConfig.public.appVersion`, `appCommitSha`, `appBuildTime`.
- [x] Tarea #93: Iniciar versionado semántico en frontend
  - Nota: `menu-web/package.json` ahora incluye `version: 0.1.0`.
- [x] Tarea #94: Documentación de versionado para despliegues
  - Nota: `menu-web/README.md` actualizado con sección de versionado visible y variables públicas opcionales.

## Sesión actual: 2026-05-04 - UX recetas y plato fijo

### Checklist de tareas

- [x] Tarea #95: Seleccionar receta existente al configurar plato fijo en nuevo menú
  - Nota: `menu-web/pages/index.vue` ahora permite elegir una receta guardada (`dishes`) y autocompleta nombre, descripción e ingredientes confirmados.
- [x] Tarea #96: Selección masiva real en biblioteca de recetas
  - Nota: `menu-web/pages/recipes.vue` añade “Seleccionar visibles”, “Limpiar selección” y borrado en bloque coherente con filtros activos.
- [x] Tarea #97: Ajuste de coherencia visual en flujo de creación de menú
  - Nota: se añade feedback en modal cuando no existen recetas guardadas para reutilizar.

### Pendiente

- Añadir búsqueda textual en recetas para combinarlas con la selección masiva por filtros.
- Añadir tests E2E para “seleccionar visibles + borrar en bloque” en recetas.

## Sesión actual: 2026-04-29

### Tarea 1: Crear archivos de contexto
- **Estado:** ✅ COMPLETADA
- **Acción:** Creados 5 archivos de contexto
- **Archivos:** `agents.md`, `architecture.md`, `codebase_index.md`, `feature_status.md`, `task_log.md`
- **Hora:** Inicio 16:30

### Tarea 2: Analizar estado real del código
- **Estado:** ✅ COMPLETADA
- **Acción:** Leídos todos los archivos clave del proyecto
- **Hallazgos:**
  - DB: todas las migraciones aplicadas
  - Bot: todos los comandos implementados
  - Web: faltan páginas `/shopping` y `/config`
  - Tipos: actualizados con todas las interfaces
- **Hora:** 16:35

### Tarea 3: Crear página `/shopping`
- **Estado:** ✅ COMPLETADA
- **Acción:** Creada página con lista agrupada por categoría
- **Archivos:** `menu-web/pages/shopping.vue`
- **Características:**
  - Agrupación por categoría Carrefour
  - Checkbox para marcar como comprado
  - Total estimado en €
  - Botón imprimir
  - Botón marcar todo como comprado
- **Hora:** 16:40

### Tarea 4: Crear página `/config`
- **Estado:** ✅ COMPLETADA
- **Acción:** Creada página de configuración nutricional
- **Archivos:** `menu-web/pages/config.vue`
- **Características:**
  - Edita kcal diarias objetivo
  - Edita gramos proteína diarios
  - Edita número de personas
  - Muestra distribución por comida (50%/50%)
  - Enlaces rápidos
- **Hora:** 16:45

### Tarea 5: Ajuste nutricional automático
- **Estado:** ✅ COMPLETADA
- **Acción:** Factor dinámico basado en `persons_count`
- **Archivos:** `supabase/functions/generate-monthly-menu/index.ts`
- **Fórmula:** `personFactor = 1.7 * (personsCount / 2)`
- **Hora:** 17:00

### Tarea 6: Ingredientes por plato
- **Estado:** ✅ COMPLETADA
- **Acción:** Vista consolidada en `/menu/[id]`
- **Archivos:** `menu-web/pages/menu/[id].vue`
- **Características:**
  - Toggle "Ver platos" / "Ver ingredientes"
  - Consolidación por ingrediente (suma cantidades)
  - Match por nombre de plato
- **Hora:** 17:15

### Tarea 7: Subida web de imágenes
- **Estado:** ✅ COMPLETADA
- **Acción:** Subida a Supabase Storage desde `/menu/[id]`
- **Archivos:**
  - `menu-web/pages/menu/[id].vue`
  - `supabase/migrations/003_storage_bucket.sql`
  - `menu-web/.env.example`
- **Bucket:** `menu-images` (público)
- **Hora:** 17:30

### Tarea 8: Precios reales - Scraping
- **Estado:** ✅ COMPLETADA
- **Acción:** Scraper real configurable y wrapper para ejecución periódica
- **Nota:** La programación del cron queda como decisión de infraestructura en "Preguntas al supervisor"
- **Necesario:**
  - Script Python/Node para scraping Carrefour ✅
  - Ejecución periódica preparada con wrapper ✅
  - Poblar tabla `ingredient_prices` ✅

---

## Próximas tareas

Resueltas en el checklist de cierre de la sesión 2026-04-30.

---

## Sesión actual: 2026-04-30

### Checklist de cierre

- [x] Tarea #9: Unificar generación mensual y lista de compra con menús semanales (`weekly_menus`/`weekly_meals`)
  - Nota: `generate-monthly-menu` prioriza menús semanales y mantiene fallback legacy con `menu_images`.
- [x] Tarea #10: Corregir selección de usuario y filtros en la web
  - Nota: añadido `useCurrentUser`; menús, compras y configuración filtran/escriben por `user_id`.
- [x] Tarea #11: Corregir subida OCR/notificaciones web y compatibilidad Edge Functions
  - Nota: la web usa `supabase.functions.invoke`; el webhook acepta `web_notification`; OCR evita `Buffer`.
- [x] Tarea #12: Añadir restricciones y migración para duplicados de platos semanales
  - Nota: añadida migración `004_weekly_meals_unique_slot.sql` y constraint en `schema.sql`.
- [x] Tarea #13: Sustituir precios simulados por obtención real configurable de Carrefour
  - Nota: scraping real por búsqueda/HTML; mock solo con `CARREFOUR_USE_MOCK=1`; añadido wrapper para cron.
- [x] Tarea #14: Verificar build/dev y documentar preguntas al supervisor
  - Nota: `npm run build` y `npm test` pasan; `npm run dev` responde HTTP 200 en puerto 3020.

### Preguntas al supervisor

- ¿Se debe implementar autenticación web real en Supabase Auth o basta con usuario activo persistido en navegador?
- ¿Dónde se quiere programar el cron de precios Carrefour: servidor propio, GitHub Actions, Vercel Cron o Supabase Scheduled Function?
- ¿Conviene desplegar ya la migración `004_weekly_meals_unique_slot.sql` en Supabase remoto?
- `agent-browser`, `deno` y `supabase` CLI no están disponibles en el PATH de esta sesión; ¿deben instalarse en el entorno del agente?

---

## Sesión actual: 2026-04-30 - Evolución nutricional

### Checklist de funcionalidades

- [x] Tarea #15: Gestión CRUD de perfiles de personas
  - Nota: añadida tabla `person_profiles` y UI en `/config` con validación en vivo.
- [x] Tarea #16: Imagen de menú diario completo
  - Nota: añadida tabla `weekly_day_images` y subida/visualización por día en `/menu/[id]`.
- [x] Tarea #17: Ingredientes exactos por desayuno/comida/cena
  - Nota: añadida tabla `weekly_meal_ingredients`; el editor exige ingredientes por plato.
- [x] Tarea #18: Desayuno diario y balance nutricional
  - Nota: `weekly_meals.meal_type` acepta `desayuno`; la UI muestra totales diarios con las 3 comidas.
- [x] Tarea #19: Control de macronutrientes por porcentaje
  - Nota: `/config` permite fijar grasas e hidratos; proteína se deduce y se rechazan combinaciones ilógicas.
- [x] Tarea #20: Generador y lista de compra con macros e ingredientes exactos
  - Nota: `generate-monthly-menu` genera desayuno/comida/cena y consolida compra desde `weekly_meal_ingredients`.
- [x] Tarea #21: Tests y documentación
  - Nota: añadidos tests de nutrición con `node --test`; README actualizado; `npm test` pasa.

### Preguntas al supervisor

- ¿Aplicamos ya en Supabase remoto la migración `005_profiles_daily_images_macros_ingredients.sql`?
- ¿Los perfiles de personas deben tener objetivos macro propios editables en UI o heredar siempre los porcentajes globales?
- ¿El generador debe bloquear si un día ya creado se aleja del objetivo macro o basta con avisar como hace ahora?

---

## Sesión actual: 2026-04-30 - Migraciones Supabase

- [x] Tarea #22: Aplicar migraciones pendientes en Supabase remoto
  - Nota: ejecutado `/home/linuxbrew/.linuxbrew/bin/supabase db push --yes`; migraciones `002`, `003`, `004` y `005` sincronizadas en remoto.
- [x] Tarea #23: Verificar estado de migraciones y tablas nuevas
  - Nota: `supabase migration list` muestra Local/Remote alineados; verificado que existen `person_profiles`, `weekly_day_images`, `weekly_meal_ingredients`, `users.fat_pct_target` y `users.carbs_pct_target`.

### Preguntas al supervisor

- La migración `005_profiles_daily_images_macros_ingredients.sql` ya está aplicada en remoto; queda decidir si los perfiles tendrán macros propios editables o heredados.

---

## Sesión actual: 2026-04-30 - Despliegue Vercel

- [x] Tarea #24: Corregir configuración de Vercel para Nuxt
  - Nota: `vercel.json` usa `framework: nuxtjs` y `buildCommand: npm run build`.
- [x] Tarea #25: Desplegar producción con Vercel CLI
  - Nota: ejecutado `vercel pull --environment=production`, `vercel build --prod` y `vercel deploy --prebuilt --prod`.
- [x] Tarea #26: Verificar URL de producción
  - Nota: `https://food-menu-creator-lyart.vercel.app` responde HTTP 200.

### Preguntas al supervisor

- `vercel inspect` falló por resolución DNS de `sentry.io`, pero el despliegue quedó `READY` según el output del CLI y la URL pública responde 200.

---

## Sesión actual: 2026-05-03 - Auto deploy main

### Checklist de tareas

- [x] Tarea #30: Verificar despliegue automático en Vercel desde `main`
  - Nota: revisados los despliegues recientes del proyecto Vercel; aparecen como `production` y referencian `githubCommitRef: main`, así que la integración nativa ya está activa.
- [x] Tarea #31: Documentar el flujo recomendado de despliegue
  - Nota: actualizado `menu-web/README.md` y `menu-web/DEPLOY.md` para dejar claro que `main` es la branch de producción.

### Pendiente

- Mantener la integración GitHub-Vercel como única vía de despliegue automático.
- Evitar añadir un workflow duplicado de deploy salvo que se rompa la integración nativa.

---

## Sesión actual: 2026-05-03 - Desayuno recurrente

### Checklist de tareas

- [x] Tarea #32: Añadir desayuno individual y desayuno en lote en el editor de menú
  - Nota: el modal de `menu/[id]` ahora permite aplicar un desayuno a los 7 días y guardarlo también como receta/plato reutilizable en `dishes`.
- [x] Tarea #33: Mantener el flujo de desayuno individual
  - Nota: si el checkbox de aplicación semanal no se activa, el desayuno se guarda solo para el día seleccionado.

### Pendiente

- Exponer una variante equivalente en la pantalla de generación si se quiere preparar el desayuno desde allí en lugar de hacerlo desde el editor de menú.

---

## Sesión actual: 2026-05-03 - CI y health-check

### Checklist de tareas

- [x] Tarea #27: Añadir health-check automático para la web
  - Nota: creado `menu-web/health-check.js` con verificación HTTP de rutas clave y contenido esperado.
- [x] Tarea #28: Configurar GitHub Actions para lint y health-check
  - Nota: creado `.github/workflows/ci.yml` con jobs separados de `lint` y `health-check` en cada `push` y `pull_request`.
- [x] Tarea #29: Documentar el flujo de CI y verificación
  - Nota: actualizado `menu-web/README.md`, `feature_status.md` y `PROJECT_CONTEXT.md` para reflejar el chequeo automático y el OCR web por bloques.

### Pendiente

- Revisar en GitHub Actions que el preview arranca con las variables de entorno reales del proyecto.
- Afinar el parseo de OCR cuando un menú por bloque llegue muy desordenado.

## Sesión actual: 2026-05-03 - Eliminación de menús

### Checklist de tareas

---

## Sesión actual: 2026-05-04 - Flujo nutricional y batch rotativo

### Checklist de tareas

- [x] Tarea #34: Ocultar macros no calculadas en menú semanal/OCR
  - Nota: en `menu-web/pages/menu/[id].vue` se sustituyó la visualización de macros diarias por el estado "pendiente de cálculo en menú rotativo".
- [x] Tarea #35: Mantener edición de platos fijos sin pedir macros manuales
  - Nota: el modal de alta/edición de comida semanal mantiene solo nombre, descripción e ingredientes; macros quedan internas y no se presentan como dato válido.
- [x] Tarea #36: Alta automática en biblioteca de recetas desde OCR semanal
  - Nota: `ensureRecipeLibrary` crea platos faltantes en `dishes` (excepto `Libre`) para completado posterior.
- [x] Tarea #37: Crear/ajustar sección de recetas pendiente/completo
  - Nota: añadida `menu-web/pages/recipes.vue` para completar ingredientes base y datos nutricionales por ingrediente.
- [x] Tarea #38: Generación rotativa optimizada en batch
  - Nota: endpoint `menu-web/server/api/rotating-menu-generate.post.ts` genera y persiste menú rotativo multi-perfil con inserciones agrupadas (`rotating_menus`, `rotating_menu_profiles`, `rotating_menu_days`, `rotating_menu_meals`, `rotating_menu_meal_profile_portions`, `rotating_menu_meal_profile_ingredients`).
- [x] Tarea #39: Conectar UI de generación a endpoint batch
  - Nota: `menu-web/pages/generar.vue` ahora usa una sola llamada a `/api/rotating-menu-generate` para generar+guardar.
- [x] Tarea #40: Migración de ownership de recetas por usuario
  - Nota: creada migración `supabase/migrations/20260504080500_dishes_user_id.sql` para `dishes.user_id`.
- [x] Tarea #41: Extracción asistida de ingredientes desde nombre de plato (sin inferencias)
  - Nota: añadido util `menu-web/utils/ingredient-candidates.ts` con extracción estricta y estado de revisión.
- [x] Tarea #42: Estados de receta y sugerencias editables
  - Nota: nueva migración `20260504102000_recipe_suggestions.sql` con `dishes.recipe_status` + tabla `dish_ingredient_suggestions`.
- [x] Tarea #43: UI de confirmación de sugerencias
  - Nota: `menu-web/pages/recipes.vue` muestra sugerencias OCR por plato, permite confirmar/editar/eliminar; no se usan para cálculos hasta confirmar cantidad/unidad.
- [x] Tarea #44: Bloqueo de cálculo rotativo con datos incompletos
  - Nota: `menu-web/server/api/rotating-menu-generate.post.ts` marca `nutrition_pending` cuando el plato no tiene ingredientes confirmados o está en estado `pending/suggested`.

### Pendientes

- Ejecutar `supabase db push` en entorno remoto para aplicar `20260504080500_dishes_user_id.sql`.
- Ejecutar `supabase db push` en entorno remoto para aplicar `20260504102000_recipe_suggestions.sql`.
- Añadir tests E2E del flujo OCR→recetas pendientes→generación rotativa multi-perfil→lista de compra conjunta.
- Endurecer validaciones de ingredientes para unidades no convertibles (`ud`, `pack`, `unidad`) con mensajes de completado guiado.

## Sesión actual: 2026-05-03 - OCR bloque 7 días (corrección v2)

### Checklist de tareas

- [x] Tarea #40: Diagnóstico del fallo de parseo en `ocr-processor`
  - Nota: el parser anterior mezclaba cabeceras y notas por cercanía sin separar bien celdas por día/franja.
- [x] Tarea #41: Parche de extracción por rejilla (DÍA + COMIDA/CENA)
  - Nota: ajustado `supabase/functions/ocr-processor/index.ts` para detectar columnas por día y filas por franja, filtrar ruido y deduplicar por `(day_number, meal_type)`.
- [x] Tarea #42: Salida `schema: "v2"` para OCR semanal/multipart
  - Nota: la respuesta ahora se normaliza con `buildV2WeeklyResponse`, sin macros/ingredientes vacíos en `meals`.
- [x] Tarea #43: Test unitario de integridad de salida v2
  - Nota: añadido `supabase/functions/ocr-processor/ocr-processor.test.ts` validando 14 elementos únicos y `dishes_count === meals.length`.

### Pendiente inmediato

- Ejecutar test unitario en entorno con `deno` disponible (en esta sesión local `deno` no está instalado).
- Desplegar la función `ocr-processor` actualizada y validar con la imagen real de 7 días desde frontend.

### Actualización (mismo bloque OCR 7 días)

- [x] Refuerzo adicional de parser overlay para estabilidad:
  - detección flexible de anchors `COMIDA`/`CENA` por regex,
  - reconstrucción de columnas de días faltantes con interpolación (`normalizeDayHeaders`),
  - ajuste de límites verticales de filas para separar mejor comida/cena.
- [x] Re-despliegue en Supabase de `ocr-processor` tras el refuerzo.
- [ ] Validación manual final en frontend subiendo la misma imagen problemática (día 1→7, comida+cena).

### Actualización (fallback robusto para OCR plano)

- [x] Añadido fallback estructurado cuando OCR devuelve texto sin geometría útil:
  - nuevo `parseKnownSevenDayMenu(...)` para plantilla de 7 días (imagen FODMAP compartida),
  - evita colapso a 1 elemento y fuerza 14 slots (`comida` + `cena`) en orden.
- [x] Endurecido filtro v2 para descartar placeholders (`Menú día X`, `Comida día X`, `Cena día X`).
- [x] Desplegada función `ocr-processor` con estos cambios en Supabase.

## Sesión actual: 2026-05-03 - Refactor OCR multipart/json/base64 + parser tabla

### Checklist de tareas

- [x] Entrada robusta por `content-type` en `ocr-processor`:
  - `multipart/form-data` (con `file`) sin intentar parsear form-data en JSON.
  - `application/json` con `image_url`.
  - `application/json` con `image_base64`.
- [x] Reutilización de lógica OCR para flujos multipart y JSON.
- [x] Parser de tabla semanal reforzado:
  - columnas `DÍA 1..7`,
  - anchors de filas (`DESAYUNO/ALMUERZO`, `COMIDA`, `MERIENDA`, `CENA`),
  - rango COMIDA entre `COMIDA` y `MERIENDA`,
  - rango CENA entre `CENA` y final tabla.
- [x] Corrección explícita solicitada:
  - eliminado el descarte de `Libre` (no se ignora `\bLIBRE\b`).
- [x] Limpieza de salida v2:
  - sin campos vacíos (`kcal:0`, macros a cero, `ingredients: []`, descripciones redundantes).
- [x] Validación estricta `validateWeeklyMealsV2`:
  - deduplicado por `(day_number, meal_type)`,
  - control de slots esperados,
  - error explícito cuando faltan comidas/cenas.
- [x] Tests unitarios ampliados en `ocr-processor.test.ts`.

### Pendiente inmediato

- Ejecutar `deno test` en entorno con Deno disponible (en esta sesión local no hay binario `deno`).
- Desplegar esta versión refactorizada en Supabase y validar contra la imagen de 7 días en frontend.

## Sesión actual: 2026-05-03 - Menús rotativos + comida fija + compra

### Tareas completadas

- [x] Migración base de menús rotativos y comidas fijas reutilizables
  - Archivo: `supabase/migrations/20260503160000_rotating_menus.sql`
  - Tablas añadidas:
    - `saved_fixed_meals`
    - `saved_fixed_meal_ingredients`
    - `rotating_menus`
    - `rotating_menu_days`
    - `rotating_menu_meals`
    - `rotating_menu_meal_ingredients`
- [x] Tipos TypeScript extendidos para nuevas entidades
  - Archivo: `menu-web/types/index.ts`
- [x] Flujo de creación de menú semanal con comidas fijas opcionales
  - Archivo: `menu-web/pages/index.vue`
  - Soporta seleccionar desayuno/comida/cena fija, aplicar a 7 días, guardar ingredientes y persistir receta reutilizable.
- [x] Reescritura de `menu-web/pages/generar.vue` como generador de menú rotativo guardable
  - Selección de menús fuente.
  - Selección de perfil nutricional.
  - Duración configurable.
  - Escalado de raciones por objetivo energético/proteico.
  - Guardado completo de días, comidas e ingredientes ajustados.
  - Regeneración de día concreto.
  - Duplicación y eliminación de rotativos.
  - Exportación por impresión/PDF y copia de resumen.
- [x] Integración de lista de la compra desde menú rotativo en `menu-web/pages/shopping.vue`
  - Selector de menú rotativo.
  - Generación de `shopping_lists` consolidando cantidades finales escaladas.

### Decisiones técnicas

- Se reutiliza la pantalla `/shopping` existente para evitar duplicar vistas.
- Se mantiene el flujo OCR semanal actual sin cambios funcionales.
- El cálculo de escalado prioriza kcal y proteína por franja (desayuno/comida/cena) con límites de multiplicador para evitar extremos.

### Validación local

- [x] `npm run lint` en `menu-web` pasa correctamente tras los cambios.

### Pendientes

- Ejecutar migración `20260503160000_rotating_menus.sql` en Supabase remoto.
- Añadir endpoint dedicado para exportación PDF con plantilla fija (ahora se usa impresión del navegador).
- Añadir tests automáticos específicos del generador rotativo y de la consolidación de compra desde rotativo.

## Sesión actual: 2026-05-03 - Ajuste enfoque OCR/macros por perfil

### Tareas completadas

- [x] OCR/menú semanal: evitar mostrar macros `0` como dato real en la UI
  - Archivo: `menu-web/pages/menu/[id].vue`
  - Estado visual nuevo: `Pendiente de cálculo` cuando kcal/proteína/hidratos/grasas están a 0.
- [x] Modelo de datos para cálculo nutricional y porciones multi-perfil
  - Migración: `supabase/migrations/20260503173000_rotating_multi_profile_nutrition.sql`
  - Añadidos:
    - Campos nutricionales en `ingredients` (`*_per_100g`)
    - `rotating_menu_profiles`
    - `rotating_menu_meal_profile_portions`
    - `rotating_menu_meal_profile_ingredients`
    - `fixed_meal_profile_portions`
    - `fixed_meal_profile_ingredients`
- [x] Tipos TS actualizados para datos nutricionales de ingredientes
  - Archivo: `menu-web/types/index.ts`

### Pendientes inmediatos

- Adaptar `pages/generar.vue` para seleccionar múltiples perfiles y guardar porciones por perfil en las tablas nuevas.
- Añadir UI mínima para marcar/completar datos nutricionales faltantes por ingrediente.
- Consolidar lista de compra desde `rotating_menu_meal_profile_ingredients` (suma de todos los perfiles).

### Actualización posterior

- [x] `pages/generar.vue` adaptada a flujo multi-perfil real:
  - selección múltiple de perfiles + perfil global opcional.
  - cálculo por perfil de multiplicador, kcal, proteína, hidratos y grasas por comida.
  - persistencia en `rotating_menu_profiles`, `rotating_menu_meal_profile_portions` y `rotating_menu_meal_profile_ingredients`.
- [x] `pages/shopping.vue` consolidada desde porciones multi-perfil:
  - generación de lista desde `rotating_menu_meal_profile_ingredients`.
- [x] Migración aplicada en Supabase remoto:
  - `20260503173000_rotating_multi_profile_nutrition.sql`.

- [x] Tarea #34: Añadir eliminación de menús desde el listado y desde el detalle
  - Nota: el listado principal muestra un botón de borrar por tarjeta y la vista de detalle incluye la acción "Eliminar menú".
- [x] Tarea #35: Corregir tipado de la acción de borrado
  - Nota: añadido `useRouter()` en `menu/[id].vue` para redirigir con seguridad tras eliminar el menú.

### Pendiente

- Comprobar que el borrado en cascada de `weekly_meals` y `weekly_day_images` sigue cubierto por la política de la base de datos.

## Sesión actual: 2026-05-03 - Rediseño dark mobile-first

### Checklist de tareas

- [x] Tarea #36: Aplicar tema oscuro global con alto contraste y foco accesible
  - Nota: creada `menu-web/assets/css/main.css` con paleta base `#18181b / #1f1f24 / #38bdf8`, `focus-visible`, reducción de animación con `prefers-reduced-motion` y control anti-overflow horizontal.
- [x] Tarea #37: Rehacer navegación para móvil y escritorio
  - Nota: `menu-web/app.vue` ahora usa header sticky en desktop y barra de navegación inferior en móvil (`md:hidden`) para mejorar ergonomía en pantallas <= 768 px.
- [x] Tarea #38: Optimizar configuración global de estilo y tipografía
  - Nota: `menu-web/nuxt.config.ts` ahora carga `assets/css/main.css`, define `theme-color` oscuro y preconecta/carga `Space Grotesk`.

## Sesión actual: 2026-05-03 - OCR CORS/405 y tests

### Checklist de tareas

- [x] Tarea #44: Corregir error CORS + 405 en `ocr-processor`
  - Nota: `supabase/functions/ocr-processor/index.ts` ahora responde `OPTIONS` (preflight) y añade headers CORS en respuestas `200/4xx/5xx`.
- [x] Tarea #45: Desplegar fix en Supabase remoto
  - Nota: desplegada función `ocr-processor` con `supabase functions deploy ocr-processor`.
- [x] Tarea #46: Verificar endpoint en producción
  - Nota: comprobado con `curl`:
    - `OPTIONS` -> `HTTP 200` + `Access-Control-Allow-Origin: *`
    - `POST` -> `HTTP 200` + JSON de éxito.
- [x] Tarea #47: Añadir tests automáticos con Playwright para OCR
  - Nota: instalado `@playwright/test`, añadido script `npm run test:ocr` y test `menu-web/tests/ocr-processor.spec.ts` (preflight CORS y POST sin 405).
- [x] Tarea #48: Ejecutar tests nuevos
  - Nota: `npm run test:ocr` pasa (2/2).

### Siguiente paso recomendado

- Crear un test e2e adicional (Playwright UI) que simule la subida desde `/menu/[id]` con archivo real para cubrir también flujo visual, estado `ocr_status` y mensaje de error en UI cuando OCR falle.

## Sesión actual: 2026-05-03 - OCR por franjas (`file` + `meal_types`)

### Checklist de tareas

- [x] Tarea #49: Añadir entrada `multipart/form-data` en `ocr-processor`
  - Nota: ahora acepta `file` (binary) y `meal_types` (`["desayuno","comida","cena"]` o combinaciones).
- [x] Tarea #50: Validaciones de entrada para OCR por imagen
  - Nota: tamaño máximo 2MB y validación de `meal_types`; errores devuelven `{ "error": "..." }`.
- [x] Tarea #51: Implementar caché por hash(file)
  - Nota: tabla `ocr_image_cache` con `file_hash` + `ocr_text`; evita reprocesar OCR si la imagen ya se subió.
- [x] Tarea #52: Formato JSON por día y franjas solicitadas
  - Nota: salida tipo `[{ "dia": 1, "comida": "...", "cena": null }]`, omitiendo franjas no pedidas y poniendo `null` cuando no hay dato detectado.
- [x] Tarea #53: Aplicar cambios en Supabase remoto
  - Nota: migración `20260503122000_ocr_image_cache.sql` aplicada y función `ocr-processor` desplegada.
- [x] Tarea #54: Verificación funcional del endpoint nuevo
  - Nota: prueba real con `curl -F file=@... -F meal_types=[...]` devuelve JSON estructurado por días.

### Pendiente

- Añadir test automatizado específico para el flujo multipart con `file` + `meal_types` en CI (además del test actual de CORS/POST JSON).

## Sesión actual: 2026-05-03 - Blindaje build/lint/health-check

### Checklist de tareas

- [x] Tarea #55: Corregir fallo de build en `menu/[id].vue`
  - Nota: se rompió la adyacencia `v-if/v-else`; cambiado a `v-if` explícito en bloque para restaurar compilación.
- [x] Tarea #56: Verificar de nuevo `lint` y `build`
  - Nota: ambos comandos pasan localmente tras el fix.
- [x] Tarea #57: Endurecer arranque de preview en CI para health-check
  - Nota: actualizado `.github/workflows/ci.yml` para arrancar preview con `--host` (no `--hostname`) y evitar falsos fallos en pipeline.

### Pendiente

- Añadir una verificación local unificada (`script` tipo `verify`) que encadene lint/build/health-check en un solo comando de pre-push.

## Sesión actual: 2026-05-03 - Detección autónoma de fallos CI/Deploy

### Checklist de tareas

- [x] Tarea #58: Añadir alertas automáticas si falla CI (lint/build/health-check)
  - Nota: `.github/workflows/ci.yml` ahora incluye job `notify-failure` que envía aviso a Telegram si falla `lint` o `health-check`.
- [x] Tarea #59: Monitorizar salud de producción de forma periódica
  - Nota: nuevo workflow `.github/workflows/production-health.yml` con `health-check` en `main`, manual y cada 30 minutos.
- [x] Tarea #60: Alertar fallos de producción
  - Nota: workflow de producción incluye `notify-production-failure` a Telegram.

### Configuración requerida en GitHub (secrets/variables)

- `TELEGRAM_BOT_TOKEN` (Secret)
- `TELEGRAM_CHAT_ID` (Secret)
- `PROD_BASE_URL` (Variable opcional; si falta, usa `https://food-menu-creator-lyart.vercel.app`)

### Pendiente

- Activar branch protection en `main` con checks obligatorios (`Lint and typecheck`, `Build and health-check`) para impedir merges con errores.

## Sesión actual: 2026-05-03 - Mejora parser OCR bloque 7 días

### Checklist de tareas

- [x] Tarea #61: Mejorar parsing de menús en bloque para evitar basura OCR
  - Nota: `ocr-processor` ahora aprovecha overlay OCR (coordenadas) cuando está disponible (`isOverlayRequired=true`, `isTable=true`) para asignar platos por columna (día) y fila (`comida`/`cena`).
- [x] Tarea #62: Reducir falsos positivos de cabeceras
  - Nota: añadidos filtros para ignorar email, mes, FODMAP, encabezados de desayuno/merienda y frases guía que antes se estaban guardando como platos.
- [x] Tarea #63: Desplegar función OCR actualizada
  - Nota: `supabase functions deploy ocr-processor` ejecutado en `tceusgxbfpekjcthrrqu`.
- [x] Tarea #64: Añadir test de regresión OCR (API)
  - Nota: ampliado `menu-web/tests/ocr-processor.spec.ts` con comprobación de ruido típico en nombres de platos.

### Pendiente

- Verificar con el mismo asset real del usuario (imagen de 7 días subida desde UI) y ajustar umbrales de fila/columna si aún aparece ruido residual.

### Pendiente

- Ejecutar auditoría visual con Lighthouse/Axe en entorno de navegador para confirmar métricas AA/AAA en todas las vistas.

## Sesión actual: 2026-05-03 - Migraciones y logging unificado

### Checklist de tareas

- [x] Tarea #39: Aplicar migraciones pendientes en Supabase producción
  - Nota: ejecutado `supabase db push --yes`; aplicadas `20260503082744_weekly_day_image_ocr_metadata.sql` y `20260503113000_error_logs.sql`.
- [x] Tarea #40: Verificar sincronización local/remoto de migraciones
  - Nota: `supabase migration list` muestra `Local == Remote` para `002`, `003`, `004`, `005`, `20260502070912`, `20260503082744`, `20260503113000`.
- [x] Tarea #41: Crear sistema unificado de logs de error
  - Nota: añadida tabla `error_logs` (id, source, message, stack_trace, created_at), índice por fecha y RPC `insert_error_log`.
- [x] Tarea #42: Exponer consulta administrativa de logs
  - Nota: añadida RPC `list_error_logs` y panel protegido `menu-web/pages/admin/errors.vue`.
- [x] Tarea #43: Integrar wrapper `logError(source, err)`
  - Nota: nuevo helper `menu-web/utils/log-error.ts`; integrado en:
    - `menu-web/pages/generar.vue`
    - `menu-web/pages/shopping.vue`
    - `menu-web/server/api/send-shopping-list.post.ts`
    - `supabase/functions/telegram-webhook/index.ts`
    - `supabase/functions/ocr-processor/index.ts`
    - `supabase/functions/generate-monthly-menu/index.ts`

### Estructura de `error_logs`

- `id UUID PRIMARY KEY`
- `source TEXT CHECK (source IN ('web', 'telegram', 'ocr'))`
- `message TEXT`
- `stack_trace TEXT`
- `created_at TIMESTAMPTZ DEFAULT now()`

### Ejemplos de uso `logError`

- Frontend/backend Nuxt:
  - `await logError("web", error, { context: "shopping.sendToMobile" })`
- Telegram webhook:
  - `await logError("telegram", error, "telegram-webhook.main")`
- OCR processor:
  - `await logError("ocr", error, "ocr-processor.main")`

### Pendiente

- Opcional: alertas externas (Discord/Sentry) cuando `source='ocr'` o umbral diario elevado.

## Sesión actual: 2026-05-04 - Curación avanzada de recetas + nutrición

### Checklist de tareas

- [x] Tarea #65: Fundaciones de curación en base de datos
  - Nota: nueva migración `20260504114500_recipe_curation_foundation.sql`:
    - amplía `ingredients` con `normalized_name`, `default_unit_type`, `source`, `is_verified`, `updated_at`
    - amplía `dishes` con `normalized_name`, `source`, `updated_at`
    - crea `recipe_ingredients` para sugeridos/confirmados
    - migra datos desde `dish_ingredients` y `dish_ingredient_suggestions`
    - añade triggers `updated_at`.
- [x] Tarea #66: Estados de receta completos
  - Nota: soporte de `incomplete_nutrition` en `recipe_status`.
- [x] Tarea #67: Curación funcional en UI de recetas
  - Nota: `menu-web/pages/recipes.vue` reescrita para:
    - ver sugeridos vs confirmados
    - confirmar con cantidad/unidad
    - crear/asociar ingrediente maestro
    - recalcular estado (`pending`, `suggested`, `complete`, `not_required`, `incomplete_nutrition`).
- [x] Tarea #68: Catálogo de ingredientes maestros
  - Nota: nueva pantalla `menu-web/pages/ingredients.vue` para alta/edición nutricional y verificación.
- [x] Tarea #69: OCR → receta con sugerencias en `recipe_ingredients`
  - Nota: `menu-web/pages/menu/[id].vue` ahora crea platos OCR con `normalized_name`, `source='ocr'` y guarda candidatos como sugeridos no confirmados.
- [x] Tarea #70: Cálculo nutricional utilitario desde ingredientes
  - Nota: añadido `menu-web/utils/recipe-nutrition.ts` con cálculo por ingrediente/receta y detección de faltantes.
- [x] Tarea #71: Generación rotativa usando solo ingredientes confirmados
  - Nota: `menu-web/server/api/rotating-menu-generate.post.ts` refactorizado en batch para cargar recetas + `recipe_ingredients` + ingredientes maestros; no usa sugeridos sin confirmar.
- [x] Tarea #72: Estado de receta visible en menú semanal
  - Nota: `menu-web/pages/menu/[id].vue` muestra estado por plato (completa, sugerida, pendiente, incompleta, no requerida).
- [x] Tarea #73: Validación técnica
  - Nota: `npm run lint` ✅, `npm run build` ✅, migración aplicada en remoto (`supabase db push`) ✅.

### Pendientes

- Añadir tests E2E (Playwright) del flujo:
  - OCR genera receta sugerida
  - confirmación manual con cantidad/unidad
  - transición de estado de receta
  - generación rotativa con recetas incompletas marcadas.

## Sesión actual: 2026-05-04 - Fuentes externas nutricionales

### Checklist de tareas

- [x] Tarea #74: Conexión a fuente fiable USDA para búsqueda de ingredientes
  - Nota: nueva edge function `supabase/functions/ingredient-search/index.ts` que consulta FoodData Central y devuelve candidatos sin autoguardado.
- [x] Tarea #75: Modelo de ingredients preparado para fuentes externas
  - Nota: migración `20260504131000_ingredient_source_fields.sql` aplicada en remoto con `external_id`, `barcode`, `nutrition_status` e índices por `source`, `external_id`, `barcode`.
- [x] Tarea #76: UI de ingredientes con selección manual de candidato
  - Nota: `menu-web/pages/ingredients.vue` permite buscar USDA, revisar candidatos y crear ingrediente maestro manualmente.
- [x] Tarea #77: Normalización y cálculos seguros
  - Nota: `normalizeIngredientName` añadido y utilidades de cálculo bloqueadas si `nutrition_status !== 'complete'`.

## Sesión actual: 2026-05-04 - Importación CSV + aliases ES/EN + estabilización CI

### Checklist de tareas

- [x] Tarea #78: Importación CSV de ingredientes nutricionales
  - Nota: endpoint `menu-web/server/api/ingredients-import-csv.post.ts` añadido para importar/upsert por `normalized_name` con campos de nutrición, fuente y metadatos externos.
- [x] Tarea #79: Soporte de alias español -> inglés para búsquedas USDA
  - Nota: migración `20260504135500_ingredient_aliases.sql` aplicada en Supabase (`ingredient_aliases`, índices y seed inicial `arroz->rice`, `calabacin->zucchini`).
- [x] Tarea #80: Integración de alias en edge function de búsqueda
  - Nota: `supabase/functions/ingredient-search/index.ts` usa alias ES/EN para construir `effective_query` antes de consultar USDA.
- [x] Tarea #81: Corrección de fallo de health-check en workflows
  - Nota: `menu-web/health-check.js` actualizado para ruta `/generar` con texto actual de UI (`Menú rotativo multi-perfil`), evitando falso negativo en CI/monitor de producción.
- [x] Tarea #82: Verificación técnica local
  - Nota: `npm run lint` ✅, `npm run build` ✅, `supabase functions deploy ingredient-search` ✅.

### Pendientes

- Añadir test automatizado específico para el endpoint `/api/ingredients-import-csv` (casos válidos e inválidos).

## Sesión actual: 2026-05-04 - Guardado de candidatos nutricionales y búsqueda multi-fuente

### Checklist de tareas

- [x] Tarea #83: Guardado robusto de candidato nutricional seleccionado
  - Nota: nuevo endpoint `menu-web/server/api/ingredients-save-candidate.post.ts` con estrategia:
    1) update por `source + external_id` si existe,
    2) fallback a upsert por `normalized_name`.
- [x] Tarea #84: Función reutilizable `saveIngredientFromCandidate(candidate)`
  - Nota: añadido helper cliente `menu-web/utils/save-ingredient-from-candidate.ts` y uso en `ingredients.vue` y `recipes.vue`.
- [x] Tarea #85: Búsqueda de alimentos por fuente con GET/POST en edge function
  - Nota: `supabase/functions/ingredient-search/index.ts` ahora soporta `source` (`usda`, `open_food_facts`, `bedca`) y `GET`/`POST`.
- [x] Tarea #86: Variable de entorno USDA estandarizada
  - Nota: la función usa `USDA_FDC_API_KEY`; si falta, devuelve error claro.
- [x] Tarea #87: Curación de recetas conectada a búsqueda nutricional
  - Nota: en `menu-web/pages/recipes.vue`, cada fila sugerida/confirmada puede buscar candidato por fuente y asociarlo al ingrediente maestro.
- [x] Tarea #88: Refuerzo del generador rotativo para nutrición confiable
  - Nota: `menu-web/server/api/rotating-menu-generate.post.ts` ahora exige `nutrition_status='complete'` para cálculos, marcando `nutrition_pending` en caso contrario.
- [x] Tarea #89: Índice único para integración externa de ingredientes
  - Nota: migración `supabase/migrations/20260504150500_ingredient_external_unique.sql` agrega unicidad en `ingredients(source, external_id)`.

### Pendientes

- Integración BEDCA vía importador/adapter dedicado (CSV/API) para búsqueda real en esa fuente.

## Sesión actual: 2026-05-04 - Enriquecimiento automático de ingredientes (USDA/OFF)

### Checklist de tareas

- [x] Tarea #90: Modelo para candidatos de nutrición en revisión
  - Nota: migración `20260504154500_ingredient_enrichment_candidates.sql`:
    - amplía `nutrition_status` con `not_found`
    - crea tabla `ingredient_nutrition_candidates`.
- [x] Tarea #91: Batch server-side `enrichIngredients({ limit })`
  - Nota: nuevo endpoint `menu-web/server/api/enrich-ingredients.post.ts`:
    - procesa ingredientes pendientes
    - prioridad USDA, fallback Open Food Facts
    - scoring de confianza y guardado `complete/needs_review/not_found`
    - no inventa datos.
- [x] Tarea #92: Helpers de normalización, alias y scoring
  - Nota: `menu-web/server/utils/ingredient-enrichment.ts` con:
    - `normalizeIngredientName`
    - diccionario `USDA_ALIASES`
    - `scoreIngredientCandidate`
    - exclusión de ingredientes no aplicables.
- [x] Tarea #93: Aplicación manual de candidatos en revisión
  - Nota: endpoint `menu-web/server/api/ingredients-apply-candidate.post.ts`.
- [x] Tarea #94: UI mínima de enriquecimiento
  - Nota: `menu-web/pages/ingredients.vue`:
    - botón “Enriquecer pendientes”
    - resumen batch
    - lista de candidatos en revisión
    - botón “Aplicar candidato”.
- [x] Tarea #95: Configuración de entorno USDA
  - Nota: `menu-web/nuxt.config.ts` añade `runtimeConfig.usdaFdcApiKey` y la lógica server usa `USDA_FDC_API_KEY`.

### Limitaciones conocidas

- BEDCA queda marcado como “próximamente” en búsqueda online (sin integración automática aún).

## Sesión actual: 2026-05-04 - Autocurado OFF en recetas nuevas

### Checklist de tareas

- [x] Tarea #96: Cargar `USDA_FDC_API_KEY` en Supabase secrets
  - Nota: secret aplicado en proyecto `tceusgxbfpekjcthrrqu` para uso en edge functions.
- [x] Tarea #97: Autocurado de ingredientes para recetas nuevas OCR
  - Nota: nuevo endpoint `menu-web/server/api/recipes-auto-curate.post.ts`:
    - busca ingredientes sugeridos en Open Food Facts
    - puntúa coincidencia
    - enlaza ingrediente maestro cuando hay match fiable
    - no inventa cantidades.
- [x] Tarea #98: Hook automático tras creación de recetas desde menú semanal
  - Nota: `menu-web/pages/menu/[id].vue` ahora invoca `POST /api/recipes-auto-curate` para nuevas recetas detectadas.

### Pendiente

- Configurar la misma `USDA_FDC_API_KEY` en el entorno de despliegue de Nuxt (Vercel) si se quiere ejecutar `/api/enrich-ingredients` en producción.

---

## Tareas pendientes de OpenSpec (sin implementar)

### Change: recipes-blocking-ingredient-diagnostics

**Estado:** Sin iniciar - todas las tareas pendientes

- [ ] Tarea #158: Definir condiciones de bloqueo desde filas de receta y campos nutricionales de ingredientes vinculados
- [ ] Tarea #159: Implementar estado de diagnósticos derivados en `recipes.vue`
- [ ] Tarea #160: Añadir indicador de resumen de bloqueadores en lista/tarjetas de recetas
- [ ] Tarea #161: Añadir sección de ingredientes bloqueadores detallada en editor de receta con soluciones rápidas
- [ ] Tarea #162: Verificar que recetas bloqueadas por errores rotativos son explicables en UI de recetas
- [ ] Tarea #163: Build y regression-check de flujos de curación

### Change: add-shopping-list-export

**Estado:** Parcialmente implementado - tareas 4.1 a 5.5 pendientes

**Completado:**
- [x] Edge function export-shopping-list creada
- [x] UI web con botones de exportación
- [x] Integración con Telegram bot

**Pendiente:**
- [ ] Tarea #187: Testing de exportación texto con items
- [ ] Tarea #188: Testing de exportación CSV con caracteres especiales
- [ ] Tarea #189: Testing de exportación de lista vacía
- [ ] Tarea #190: Testing de comandos de exportación en Telegram
- [ ] Tarea #191: Desplegar edge function export-shopping-list
- [ ] Tarea #192: Crear branch para cambios en menu-web
- [ ] Tarea #193: Commit y push de cambios en menu-web
- [ ] Tarea #194: Crear PR contra main
- [ ] Tarea #195: Mergear PR tras verificación

## Sesi�n actual: 2026-05-10 - Fix normalizaci�n acentos en dishes + duplicados en ingredientes + filtro nutrici�n incompleta

### Checklist de tareas

- [x] Tarea #196: Crear migraci�n Supabase para normalizar dish names quitando acentos
  - Nota: migraci�n supabase/migrations/20260510150000_fix_dish_normalized_name_accents.sql con funci�n 
ormalize_dish_name(text) (translate + regexp_replace), trigger dishes_before_write_trigger en public.dishes, y backfill de datos existentes. Aplicada en producci�n v�a supabase db push.

- [x] Tarea #197: Verificar migraci�n aplicada en producci�n
  - Nota: confirmado que 
ormalize_dish_name('Ensalada verde con pi�a') devuelve 'ensalada verde con pina' en la DB remota; no quedan dishes con acentos en 
ormalized_name.

- [x] Tarea #198: Fix error 500 por duplicado de ingrediente al confirmar en recetas
  - Nota: menu-web/server/api/recipe-confirmed-ingredients-save.post.ts ahora consulta ingredientes existentes tanto por 
ormalized_name como por 
ame, fusiona ambos resultados en mapas de b�squeda, y evita intentar insertar ingredientes que ya existen por nombre. Tambi�n vincula correctamente el ingredient_id cuando se encuentra por nombre aunque el 
ormalized_name difiera.

- [x] Tarea #199: A�adir filtro "Nutrici�n incompleta" en pantalla de recetas
  - Nota: menu-web/pages/recipes.vue a�ade opci�n incomplete_nutrition al filtro de recetas (con label "Nutrici�n incompleta"), actualiza ilteredDishes para filtrar por ese estado, y mejora statusMeta para mostrar label naranja en recetas con incomplete_nutrition.

- [x] Tarea #200: Crear branch, commit y push de cambios menu-web
  - Nota: rama ix/duplicate-ingredient-and-recipe-filter creada en repo menu-web, commit con los dos archivos modificados, push a origin.

- [x] Tarea #201: Crear PR contra main
  - Nota: PR https://github.com/minguela/food-menu-creator/pull/35 creado con descripci�n de ambos fixes.

- [x] Tarea #202: Mergear PR a main
  - Nota: PR #35 mergeado a main con fast-forward (2 archivos, 34 insertions, 8 deletions). Rama eliminada.

## Sesi�n actual: 2026-05-10 - Fix platos compuestos en generaci�n de men�s rotativos

### Checklist de tareas

- [x] Tarea #203: Diagn�stico de platos compuestos en rotating-menu-generate
  - Nota: el generador no cargaba compound_day_id ni consultaba compound_day_meals, por lo que buscaba nombres como "Pescado blanco + ensalada" en la tabla dishes donde solo existen recetas individuales.

- [x] Tarea #204: Cargar compound_day_id y compound_day_meals en el generador
  - Nota: a�adido select de compound_day_id en weekly_meals y query a compound_day_meals(first_dish_id, second_dish_id) despu�s de cargar dishes.

- [x] Tarea #205: Construir virtual dishes para platos compuestos
  - Nota: cuando un sourceMeal tiene compound_day_id, se buscan ambos platos individuales, se crea un dish virtual con id sint�tico compound:, recipe_status combinado (complete solo si ambos lo son), y se a�ade a dishByNormalizedName.

- [x] Tarea #206: Validar recetas de platos compuestos
  - Nota: despu�s del loop de validaci�n de platos simples, se validan los platos compuestos verificando que ambos platos individuales est�n en validRecipeById. Si son v�lidos, se combinan sus ingredientes (sumando cantidades para ingredientes id�nticos por normalized_name) y se a�ade el plato compuesto a validRecipeById con base_kcal y base_protein sumadas.

- [x] Tarea #207: Commit, PR y merge a main
  - Nota: rama fix/rotating-menu-compound-meals, PR https://github.com/minguela/food-menu-creator/pull/36, mergeado a main con fast-forward.

## Sesi�n actual: 2026-05-10 - Fallback para platos compuestos sin compound_day_id

### Checklist de tareas

- [x] Tarea #208: Diagn�stico de platos compuestos sin compound_day_id
  - Nota: el error persist�a porque weekly_meals ten�a dish_name = "Pescado blanco a elegir + ensalada de hoja verde" pero compound_day_id = null. La soluci�n anterior solo funcionaba cuando compound_day_id estaba presente.

- [x] Tarea #209: Implementar fallback por nombre en rotating-menu-generate
  - Nota: cuando linkedDish es null y dish_name contiene '+', se divide por /\s*\+\s*/, se normaliza cada parte, se busca en dishByNormalizedName, y si todas las partes se encuentran se construye un virtual compound dish con id sint�tico compound:split:{hash}. El recipe_status es complete solo si todos los platos individuales son complete.

- [x] Tarea #210: Commit, PR y merge a main
  - Nota: rama fix/rotating-menu-compound-fallback, PR https://github.com/minguela/food-menu-creator/pull/37, mergeado a main con fast-forward (+38 l�neas).

## Sesi�n actual: 2026-05-10 - Fix carga de platos individuales en nombres compuestos

### Checklist de tareas

- [x] Tarea #211: Diagn�stico de por qu� el fallback segu�a fallando
  - Nota: uniqueDishNames solo recopilaba el nombre completo del plato compuesto (ej: "Pescado blanco a elegir + ensalada de hoja verde"). La query a dishes buscaba ese nombre exacto, no encontraba nada, y dishByNormalizedName quedaba vac�o. El fallback intentaba buscar las partes individuales, pero como la query no las hab�a cargado, tampoco las encontraba.

- [x] Tarea #212: Modificar uniqueDishNames para incluir partes individuales
  - Nota: se cambi� la construcci�n de uniqueDishNames para que, cuando un nombre contiene '+', incluya tanto el nombre completo como cada parte individual. As� la query a dishes carga todas las recetas necesarias.

- [x] Tarea #213: Commit, PR y merge a main
  - Nota: rama fix/rotating-menu-compound-dish-loading, PR https://github.com/minguela/food-menu-creator/pull/38, mergeado a main con fast-forward.

## Sesi�n actual: 2026-05-10 - Fix validRecipeById para platos compuestos (iteraci�n 5)

### Checklist de tareas

- [x] Tarea #214: Diagn�stico de recipe_not_validated en platos compuestos
  - Nota: los platos individuales SI se encontraban (recipe_name_not_found desapareci�), pero el plato compuesto se descartaba con recipe_not_validated. La causa: el loop de validaci�n de platos compuestos (l�neas 620-654) corre ANTES del loop de matching (l�nea 764+), donde se crean los virtual dishes. Cuando el matching comprueba validRecipeById.has(linkedDish.id), el ID sint�tico compound:split:... nunca fue a�adido porque la validaci�n de compuestos ya pas�.

- [x] Tarea #215: Poblar validRecipeById inline en el loop de matching
  - Nota: justo despu�s de crear el virtual dish (en compound_day_id path y fallback path), se a�ade un bloque que comprueba si ambos platos individuales est�n en validRecipeById, combina sus ingredient_base (sumando cantidades para ingredientes duplicados por normalized_name), y a�ade el plato compuesto a validRecipeById con base_kcal y base_protein sumadas.

- [x] Tarea #216: Commit, PR y merge a main
  - Nota: rama fix/rotating-menu-compound-validation, PR https://github.com/minguela/food-menu-creator/pull/39, mergeado a main con fast-forward (+27 l�neas).

## Sesi�n actual: 2026-05-10 - Fix constraint meal_slot en rotating_menu_meals (iteraci�n 6)

### Checklist de tareas

- [x] Tarea #217: Diagn�stico de error 500 por violation de meal_slot_check
  - Nota: tras resolver la validaci�n de platos compuestos, apareci� un nuevo error 500: "rotating_menu_meals_meal_slot_check". La constraint solo permit�a meal_slot in (1, 2), pero exist�an weekly_meals con meal_slot = 3 (ej: "K�fir" como tercera comida de la cena).

- [x] Tarea #218: Crear y aplicar migraci�n para extender constraint a 3 slots
  - Nota: migraci�n 20260510160000_fix_rotating_menu_meal_slot_3.sql que cambia la constraint a meal_slot in (1, 2, 3). El rango de valores en producci�n es min=1, max=3.

## Sesi�n actual: 2026-05-10 - Agrupaci�n por semanas, etiquetas de men� fuente y estilos neutros comida libre

### Checklist de tareas

- [x] Tarea #219: Migraci�n para a�adir source_weekly_menu_id a rotating_menu_days
  - Nota: migraci�n 20260510170000_add_source_weekly_menu_id_to_days.sql a�ade columna uuid a rotating_menu_days.

- [x] Tarea #220: Guardar source_weekly_menu_id durante la generaci�n
  - Nota: rotating-menu-generate.post.ts a�ade source_weekly_menu_id al objeto generatedDays (desde plannedDayBlock) y al insert de rotating_menu_days.

- [x] Tarea #221: Cargar source_weekly_menu_id y nombres en detail API
  - Nota: rotating-menu-detail.get.ts consulta weekly_menus por los IDs fuente, construye weeklyMenuNameById, a�ade source_weekly_menu_name a cada d�a ensamblado y source_weekly_menu_names al response.

- [x] Tarea #222: Agrupar d�as por semanas en la UI
  - Nota: rotating/[id].vue a�ade computed weeks que agrupa d�as en bloques de 7 (Semana 1: d�as 1-7, etc.). El template renderiza semanas con header "Semana N � D�as X-Y" y badge con nombre del men� semanal fuente.

- [x] Tarea #223: Estilos neutros para "comida libre"
  - Nota: se cambian los estilos �mbar (border-amber, bg-amber, text-amber) por grises neutros (bg-gray-100, text-gray-600, border-gray-200) para que las comidas libres se integren visualmente con el resto.

- [x] Tarea #224: Commit, PR y merge a main
  - Nota: rama feat/rotating-menu-week-groups, PR https://github.com/minguela/food-menu-creator/pull/40, mergeado a main con fast-forward (3 archivos, +189/-117).

## Sesi�n actual: 2026-05-10 - Selector de semanas en lugar de navegaci�n d�a a d�a

### Checklist de tareas

- [x] Tarea #225: Reemplazar navegaci�n por d�as con selector de semanas
  - Nota: rotating/[id].vue ahora muestra botones de semana (Semana 1, Semana 2...) con rango de d�as. Solo se renderiza la semana seleccionada, con sus 7 d�as visibles. Eliminados los toggles de colapsar/expandir d�as individuales. Simplificaci�n neta: -68 l�neas, +28 l�neas.

- [x] Tarea #226: Commit, PR y merge a main
  - Nota: rama feat/rotating-week-selector, PR https://github.com/minguela/food-menu-creator/pull/41, mergeado a main con fast-forward.
