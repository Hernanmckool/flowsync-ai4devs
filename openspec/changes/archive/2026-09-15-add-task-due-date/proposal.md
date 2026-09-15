## Why

FS-118 del backlog pide que una tarea pueda tener una fecha de vencimiento opcional y que quien mira sepa si se ha pasado de plazo, para comprometerse con una fecha solo cuando de verdad existe una, en vez de tener que llevar la cuenta mentalmente o descubrirlo tarde.

## What Changes

- Cada tarea gana una fecha de vencimiento **opcional**: nula por defecto, nunca pedida ni sugerida al crear (la creación sigue siendo solo-título, sin cambios).
- Se añade una superficie mínima para "abrir" una tarea, limitada exactamente a lo que esta historia necesita: ver la fecha (o su ausencia) y, si corresponde, que está vencida; ponerla, cambiarla o quitarla. No es la vista de detalle general que el backlog contempla en `E2-5` — esa sigue bloqueada por **PA-6** (qué más debería mostrar) y este change no la resuelve ni la anticipa.
- **Vencida** se define así: tiene fecha, esa fecha es anterior al día de hoy y la tarea no está en "Hecho". Poner la fecha de hoy no cuenta como vencida; una tarea sin fecha nunca vence, por antigua que sea; pasar a "Hecho" congela la fecha pero deja de contar como vencida.
- "Hoy" se resuelve **según el día de quien mira**, no un día fijo del servidor: dos personas en husos horarios distintos pueden ver un veredicto distinto para la misma tarea en el mismo instante, y las dos lecturas son correctas.
- Poner una fecha ya pasada está permitido (no se bloquea): la tarea pasa a vencida de inmediato si no está hecha.
- Quitar la fecha es inmediato, sin diálogo de confirmación.
- Cualquier miembro del equipo puede poner, cambiar o quitar la fecha de cualquier tarea, sea o no su responsable — mismo criterio de permisos planos que ya rige el cambio de estado.
- La lista principal sigue sin mostrar ninguna fecha ni marca de vencida (esto ya lo garantizaba la capability `tasks`; este change no lo toca, solo confirma que sigue así).
- **BREAKING** (a nivel de contrato de API, sin impacto real: repositorio de práctica sin usuarios): se **modifica** el requisito ya archivado "Superficie de la API de tareas", que hoy prohíbe explícitamente la lectura de una tarea suelta. Pasa a permitir `GET /api/v1/tasks/:id` (y solo ese: sigue sin haber borrado ni endpoints de equipo), y el `PATCH /api/v1/tasks/:id` ya existente pasa a aceptar también la fecha de vencimiento, no solo el estado.
- Sin tests: igual que `add-task-list`, se verifica a mano (curl + navegador). Es una decisión consciente pese a que la regla de vencimiento tiene bordes delicados (día anterior/mismo día/posterior, sin fecha, paso de medianoche, huso horario) — queda anotado como riesgo en `design.md`.

Fuera de alcance en este change, deliberadamente:
- La vista de detalle general de una tarea (`E2-5` / PA-6): solo se construye lo mínimo para fechas.
- Reasignar el responsable: sigue sin existir (requisito ya archivado, sin cambios); por tanto no hay nada que verificar sobre "reasignar no toca la fecha" más allá de que la operación de reasignar sigue sin existir.
- Volver de "Hecho" a un estado anterior con la fecha ya pasada: el backlog lo deja pendiente de PA-7; este change no decide qué pasa ahí.
- Cualquier forma de aviso, recordatorio o resumen de vencimientos fuera de abrir la tarea uno por uno (no lo pide ninguna historia de esta base).

## Capabilities

### New Capabilities
_(ninguna)_

### Modified Capabilities
- `tasks`: se modifica el requisito "Superficie de la API de tareas" (pasa a permitir `GET /tasks/:id`) y se añaden los requisitos de fecha de vencimiento, regla de vencida y la superficie mínima para abrir una tarea. Los requisitos existentes sobre la lista, la creación y el cambio de estado no cambian.

## Impact

- **Backend**: nueva columna nullable en `tasks` (fecha, sin componente horario) vía migración; se extiende el validador de actualización para aceptar también la fecha (`vine.date(...)`, formato `YYYY-MM-DD`, nula para quitarla; una fecha pasada se acepta sin restricción); nueva acción de detalle (`GET /tasks/:id`) y su transformer, que expone la fecha además de lo que ya expone la lista — la lista sigue sin incluirla, ni siquiera en el JSON, no solo en pantalla.
- **Frontend**: la lógica de "está vencida" (día anterior al de hoy, no hecha) vive en el frontend como una función compartida que compara contra el reloj del propio navegador — es la única forma de que dos personas en husos distintos vean lo correcto cada una (ver `design.md`). Se añade una superficie para abrir una tarea (a decidir en `design.md`: modal o ruta propia) con el campo de fecha, su quitar y la señal de vencida: reutiliza componentes ya existentes o, si hace falta uno nuevo, se trae con `npx shadcn@latest add <componente>` siguiendo la convención ya establecida en el proyecto (no aplica aquí la restricción de "sin componentes nuevos" que sí regía en `add-task-list`, porque no fue una condición de este change).
- **Sin tests**: no se monta ninguna suite en este change; se verifica a mano.
