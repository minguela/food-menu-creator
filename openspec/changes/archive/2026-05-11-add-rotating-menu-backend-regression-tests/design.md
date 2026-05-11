## Context

El proyecto ya usa `node --test` en `menu-web/tests/*.test.mjs`, y existe un test unitario para `buildRotatingWeeklyMenuBlocks`. La cobertura actual no verifica `meal_slot`, no prueba una validación estructural completa contra menús fuente ni ofrece una vía rápida para contrastar datos reales de Supabase sin abrir el front.

## Goals / Non-Goals

**Goals:**

- Mantener tests rápidos, deterministas y sin dependencia externa por defecto.
- Cubrir la regla de rotación aleatoria sin repetición por menús semanales completos.
- Cubrir preservación de platos múltiples por `meal_slot`.
- Testear la validación que impide guardar días incompletos.
- Añadir una prueba live opcional/read-only contra Supabase real cuando haya variables de entorno.

**Non-Goals:**

- Añadir Playwright o E2E para este caso.
- Crear o borrar menús reales en Supabase durante tests live.
- Mockear todo Nuxt/H3 para probar el endpoint completo si la lógica puede validarse con funciones puras.

## Decisions

1. Extraer lógica testeable a utilidades puras en `menu-web/utils`.

   Alternativa considerada: testear solo el endpoint API. Se descarta para regresiones principales porque Nuxt, Supabase y estado de recetas harían los tests lentos y frágiles.

2. Usar fixtures sintéticos para los tests por defecto.

   Alternativa considerada: depender siempre de Supabase real. Se descarta porque dificultaría CI/local y podría fallar por datos en edición.

3. Añadir test live separado y opt-in mediante variables como `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y un `USER_ID`/`MENU_IDS` de prueba.

   Alternativa considerada: incluirlo en `npm test`. Se descarta para no introducir secretos ni dependencias externas en ejecución normal.

4. Inyectar RNG determinista en pruebas.

   Alternativa considerada: aceptar cualquier orden aleatorio. Se descarta porque las aserciones serían débiles y no detectarían repeticiones tempranas.

5. Añadir scripts específicos, por ejemplo `test:rotating` y `test:rotating:live`.

   Alternativa considerada: dejar todo bajo `npm test`. Se descarta porque el usuario pidió agilidad para probar este flujo concreto.

## Risks / Trade-offs

- [Risk] Tests con fixtures no detectan datos reales mal cargados -> Mitigation: añadir test live opt-in de contraste contra Supabase.
- [Risk] Extraer lógica puede duplicar reglas del endpoint -> Mitigation: el endpoint debe consumir las mismas funciones puras que los tests.
- [Risk] Tests live podrían ser destructivos si generan menús reales -> Mitigation: diseñarlos como lectura/planificación/validación sin inserciones.
- [Risk] Variables de entorno locales pueden faltar -> Mitigation: test live debe saltarse con mensaje claro si no están configuradas.

## Migration Plan

No hay migraciones de base de datos en este cambio. Se añadirá cobertura y scripts npm; rollback mediante eliminación de tests/scripts si fuera necesario.

## Open Questions

No quedan preguntas abiertas. El contraste live debe ser opcional y no destructivo.
