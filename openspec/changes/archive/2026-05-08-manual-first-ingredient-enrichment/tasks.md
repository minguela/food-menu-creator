## 1. Manual-first import quality gate

- [x] 1.1 Actualizar import CSV para guardar `source=manual_csv`.
- [x] 1.2 Aplicar validación automática y decidir `complete` vs `needs_review`.
- [x] 1.3 Guardar `review_reason` en ingredientes que quedan en revisión.

## 2. Caloric density tagging

- [x] 2.1 Crear util compartido de clasificación por kcal/100g.
- [x] 2.2 Añadir columnas/migración para `caloric_density_level` y `review_reason`.
- [x] 2.3 Calcular etiqueta en import y enriquecimiento.

## 3. UI observability

- [x] 3.1 Mostrar etiqueta de densidad calórica en tarjetas de ingredientes.
- [x] 3.2 Exponer `review_reason` de forma visible en UI.
- [x] 3.3 Añadir visualización de `raw_payload` de candidatos desde la tarjeta.

## 4. Rotating generator guard

- [x] 4.1 Incorporar `caloric_density_level` en lectura de nutrientes para generación.
- [x] 4.2 Aplicar cap de multiplicador para recetas calóricas/muy calóricas.

## 5. Cierre del change

- [x] 5.1 Actualizar `task_log.md` con el cambio.
- [x] 5.2 Archivar el change OpenSpec al completar implementación.
