## 1. Backend: modelo de datos

- [x] 1.1 Crear la migración `add_due_date_to_tasks` (columna `due_date`, tipo fecha sin hora, nullable) y correr `node ace migration:run`; verificar que termina sin errores, que `database/schema.ts` declara ahora `dueDate` en `TaskSchema`, y que `npm run typecheck` (en `backend/`) sigue pasando sin tocar `app/models/task.ts` a mano.

## 2. Backend: validación

- [x] 2.1 Extender `updateTaskValidator` para aceptar `status` y `dueDate` como campos independientes y opcionales (`dueDate`: `vine.date({ formats: ['YYYY-MM-DD'] }).nullable().optional()`, sin cota de "no en el pasado"); verificar con `curl` que se puede actualizar solo el estado, solo la fecha, o ambos a la vez, y que el campo no enviado queda intacto.
- [x] 2.2 Verificar con `curl` que una fecha inválida (mal formada o inexistente, p. ej. un 30 de febrero) responde 422 con el error asociado al campo `dueDate`, y que la fecha que la tarea tuviera antes no cambia.
- [x] 2.3 Verificar con `curl` que una fecha anterior a hoy se acepta sin ningún rechazo.
- [x] 2.4 Verificar con `curl` que enviar `dueDate: null` quita la fecha de una tarea que la tenía.

## 3. Backend: endpoint de detalle y actualización extendida

- [x] 3.1 Añadir la acción de detalle y la ruta `GET /api/v1/tasks/:id`, con un transformer que sume `dueDate` a lo que ya expone la lista; verificar con `curl` que devuelve la tarea completa incluida su fecha, y que un identificador inexistente responde 404 en vez de inventar una tarea vacía.
- [x] 3.2 Verificar con `curl` que la respuesta de `GET /api/v1/tasks` (la lista) sigue sin incluir la clave `dueDate` en ningún elemento, aunque esas tareas sí tengan fecha puesta.
- [x] 3.3 Verificar con `curl` que actualizar la fecha o el estado de una tarea de otra cuenta se aplica igual que en una propia, sin ningún error de permiso.
- [x] 3.4 Verificar con `curl` que `DELETE /api/v1/tasks/:id` y cualquier ruta de equipos siguen sin existir (404) — comprobación de regresión sobre lo ya archivado.
- [x] 3.5 Arrancar `npm run dev` en `backend/` para regenerar `.adonisjs/server/controllers.ts` y `.adonisjs/client/registry/`; verificar el diff generado antes de incluirlo en el commit del change.

## 4. Frontend: tipos, regla de vencida y llamadas a la API

- [x] 4.1 Añadir `dueDate: string | null` al tipo `Task` y un tipo `UpdateTaskPayload` (`{ status?: TaskStatus; dueDate?: string | null }`) en `lib/types.ts`; verificar que `npm run build` (typecheck incluido) pasa en `frontend/`.
- [x] 4.2 Añadir la función pura `isOverdue(task, today)` (vencida ⇔ tiene fecha, esa fecha es anterior a `today`, y el estado no es `done`) en `lib/`; verificar a mano, llamándola con los cinco casos de `design.md` (fecha de ayer sin hacer, fecha de hoy, fecha de mañana, sin fecha, fecha de ayer pero hecha) y confirmando que cada uno da el resultado esperado — no hay test automatizado que lo cubra en este change, así que esta verificación manual es la única red.
- [x] 4.3 Añadir `getTask(id, token)` y `updateTask(id, payload, token)` a `lib/api.ts` (generalizando el `PATCH` que antes solo mandaba `status`); actualizar `tasks-page.tsx` para que el cambio de estado desde la lista use `updateTask` con `{ status }`; verificar con un script Node que replica el `fetch` exacto (mismo patrón que en `add-task-list`) contra el backend levantado.

## 5. Frontend: abrir la tarea

- [x] 5.1 Traer el componente `Dialog` con `npx shadcn@latest add dialog` en `frontend/`; verificar que se genera `components/ui/dialog.tsx` y que `npm run build` sigue pasando.
- [x] 5.2 Añadir un botón "Abrir" por fila que abre un `Dialog` con la fecha actual (o su ausencia), un campo para ponerla o cambiarla, un botón para quitarla, y una señal de vencida (icono + texto, no solo color) cuando corresponda; verificar en el navegador que se abre y se cierra tanto con ratón como solo con teclado (Tab hasta el botón, Enter para abrir, Esc para cerrar).
- [x] 5.3 Conectar el campo de fecha y el botón de quitar a `updateTask`, reflejando el cambio en la lista sin recargar ni volver a abrir la tarea, y sin ningún diálogo de confirmación al quitar; verificar en el navegador ambos flujos (poner/cambiar una fecha, quitarla) sobre una tarea propia y sobre una ajena.
- [x] 5.4 Verificar visualmente: una tarea sin fecha no muestra ningún aviso de que le falte algo; una tarea vencida muestra su condición con un icono además de color; abrir y cerrar una tarea sin tocar nada no cambia su estado, responsable ni fecha.
- [x] 5.5 Verificar visualmente que la lista principal sigue sin mostrar ninguna fecha ni marca de vencida en ninguna fila, tengan o no fecha puesta las tareas.

## 6. Verificación integral

- [x] 6.1 Recorrer a mano, con dos cuentas y dos sesiones de navegador, los bordes de la regla de vencida: fecha de ayer y no hecha (vencida), fecha de hoy y no hecha (no vencida), fecha de mañana (no vencida), sin fecha por antigua que sea la tarea (nunca vencida), una vencida que se pasa a "Hecho" (deja de estar vencida y conserva su fecha), una ya "Hecho" con fecha pasada (no vencida), y aplazar la fecha de una vencida a una posterior (deja de estar vencida).
- [x] 6.2 Confirmar que cualquiera de las dos cuentas puede abrir, poner, cambiar o quitar la fecha de una tarea de la otra, sin ningún permiso especial ni advertencia.
- [x] 6.3 Confirmar que una fecha inválida escrita en el campo se rechaza mostrando el mensaje junto al propio campo, en castellano, y sin perder la fecha que la tarea tuviera antes.
- [x] 6.4 Correr `openspec validate add-task-due-date --strict` y confirmar que no reporta errores.
