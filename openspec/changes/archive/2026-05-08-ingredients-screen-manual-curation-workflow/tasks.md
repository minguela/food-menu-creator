## 1. CSV workflow in ingredients screen

- [x] 1.1 Reemplazar bloque inline de import CSV por botón + modal con textarea de pegado.
- [x] 1.2 Añadir botón de exportación CSV de ingredientes.
- [x] 1.3 Crear endpoint backend para descargar CSV de ingredientes.

## 2. Manual-first UI simplification

- [x] 2.1 Eliminar de filtros/buscador la parte de fuentes, enriquecer y mapear.
- [x] 2.2 Retirar en la tarjeta de ingrediente acciones de Curar OFF, autocompletar y restaurar.
- [x] 2.3 Ocultar visualización/edición de fuente en tarjeta.

## 3. English name support

- [x] 3.1 Añadir columna `english_name` en `ingredients` mediante migración.
- [x] 3.2 Persistir `english_name` en guardado y soportarlo en import CSV.
- [x] 3.3 Mostrar/editar `english_name` en tarjeta y usarlo en búsqueda.

## 4. Selected merge with explicit destination

- [x] 4.1 Añadir modal de fusión para seleccionados con selector de destino.
- [x] 4.2 Crear endpoint para fusionar seleccionados y reasignar relaciones de recetas al destino.
- [x] 4.3 Limpiar selección y refrescar lista tras fusión.

## 5. OpenSpec closure

- [x] 5.1 Actualizar `task_log.md` con el cambio.
- [x] 5.2 Archivar el change al completar implementación.
