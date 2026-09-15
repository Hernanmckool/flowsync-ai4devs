## Context

Ver `proposal.md` para el porqué. Estado actual relevante (todo de `add-task-list`, ya archivado):

- **Backend**: `tasks` (`title`, `status`, `assigned_to_id`) con `TasksController` (`index`, `store`, `update`), `createTaskValidator` (`title`) y `updateTaskValidator` (`status`, vía `vine.enum(TASK_STATUSES)`), `TaskTransformer` (expone `id, title, status, createdAt, updatedAt, assignedTo: {id, fullName}`). Rutas: `GET/POST /api/v1/tasks`, `PATCH /api/v1/tasks/:id`, agrupadas con `middleware.auth()`. No existe `GET /tasks/:id`.
- **Frontend**: `pages/tasks-page.tsx` — carga la lista, formulario inline de creación, `<select>` nativo de estado por fila. `lib/types.ts` tiene `Task`, `TaskStatus`, `TASK_STATUS_LABELS`. `lib/api.ts` tiene `listTasks`, `createTask`, `updateTaskStatus`. `components/ui/` sigue teniendo solo `alert`, `button`, `card`, `input`, `label` — no hay `Dialog` ni ningún componente de fecha.
- El backlog trae el ticket FS-118.2 ("Regla de vencimiento en el dominio") asumiendo que esa regla vive en el backend. Esa asunción choca con **CA-19** de la propia historia (cada persona ve el vencimiento según su propio día): un backend sin husos horarios de cada cliente no puede decidir "hoy" por nadie más que por sí mismo. La decisión de abajo explica cómo se resuelve esa tensión.

## Goals / Non-Goals

**Goals:**
- Persistir una fecha de vencimiento opcional (sin componente horario) por tarea.
- Que "vencida" sea correcto para cada persona según su propio reloj, no un valor fijo igual para todos (CA-19).
- Abrir/cerrar una tarea para tocar su fecha, con el mínimo de superficie nueva posible.
- La lista sigue sin fecha, ni en pantalla ni en la respuesta que la alimenta.

**Non-Goals (a nivel de diseño, además de lo ya excluido en el proposal):**
- No se resuelve **PA-6** (qué más debería mostrar una vista de detalle general de una tarea). La superficie que se abre aquí no es esa vista: es exactamente el campo de fecha y la señal de vencida, nada más.
- No se decide aquí qué pasa al volver de "Hecho" a un estado anterior con la fecha pasada (PA-7): la fecha simplemente no se toca al cambiar de estado, en ninguna dirección.
- No se introduce ningún resumen, aviso o recordatorio de vencimientos fuera de abrir la tarea uno por uno.
- No se añade control de concurrencia sobre la fecha (mismo criterio que ya aceptó `add-task-list` para el estado: última escritura gana).

## Decisions

### La regla de "vencida" vive en el frontend, no en el backend
El backend persiste y devuelve la fecha de vencimiento tal cual (`dueDate: string | null`, formato `YYYY-MM-DD`); **no** calcula ni devuelve un booleano `isOverdue`. Quien decide si una tarea está vencida es el frontend, comparando esa fecha contra el día local de quien está mirando (`new Date()` del propio navegador, usando sus getters locales — nunca `toISOString`, que convierte a UTC y puede desplazar el día).

**Por qué**: CA-19 exige que dos personas en husos horarios distintos puedan ver un veredicto distinto para la misma tarea en el mismo instante, y que las dos lecturas sean correctas. Un backend sin estado no conoce el huso horario de quien pregunta a menos que se lo mande en cada petición — y hacer que el cliente le diga al servidor "qué día es hoy para mí" en cada consulta es una complejidad (parámetro nuevo, superficie de confianza sobre un dato que el cliente controla) que no aporta nada frente a la alternativa obvia: si el veredicto depende de el reloj de quien mira, que lo calcule quien tiene ese reloj.

**Alternativa descartada**: que el backend reciba un parámetro `asOf` (la fecha de hoy según el cliente) en la consulta y devuelva `isOverdue` ya calculado, tal como sugiere el ticket FS-118.2 al situar "la regla" en el dominio del backend. Se descarta porque no es más correcto que calcularlo en el cliente (el cliente podría mandar cualquier fecha) y sí es más código: un parámetro nuevo, su validación, y la misma regla que igualmente hay que tener en el cliente para pintar la señal sin esperar una respuesta de red.

**Consecuencia para la spec**: la "Regla de tarea vencida" se escribió en términos de comportamiento observable (qué ve la persona), no de dónde vive el cálculo — sigue siendo válida sea cual sea la capa que la implemente. Aquí se documenta la elección concreta para este código.

### La regla en sí: una función pura, compartida entre la señal de vencida y cualquier otro sitio que la necesite
`isOverdue(task: Pick<Task, 'dueDate' | 'status'>, today: Date): boolean` en `lib/`, junto a `TASK_STATUS_LABELS`. Vencida ⇔ `dueDate !== null && status !== 'done' && dueDate < today` (comparación por fecha de calendario, no por instante). `today` se pasa como parámetro (no se llama a `new Date()` dentro de la función) para que sea una función pura y trivial de razonar; quien la llama en pantalla le pasa `new Date()`.

### Modelo de datos: una columna `due_date`, de tipo fecha sin hora
`tasks.due_date`, `date`, nullable. Sin hora: "hoy" y "vencida" se razonan en días de calendario, no en instantes (coherente con CA-5: vencer *hoy* todavía no es estar vencida — si tuviera hora, "hoy a las 00:01" ya habría vencido literalmente, que es justo la lectura que CA-5 descarta).

### Un único `PATCH /tasks/:id`, ahora con `status` y/o `dueDate` opcionales
No se añade una ruta aparte para la fecha. El validador de actualización pasa a aceptar `status` (igual que antes, ahora opcional) y `dueDate` (opcional; `string` en formato `YYYY-MM-DD` para ponerla o cambiarla, `null` explícito para quitarla, ausente para no tocarla). `vine.date({ formats: ['YYYY-MM-DD'] }).nullable().optional()` — sin `.afterOrEqual('today')` ni ninguna otra cota: una fecha pasada se acepta (CA-13), tal como exige la regla.

**Alternativa descartada**: una ruta específica (`PATCH /tasks/:id/due-date`) separada de la de estado. Se descarta por la misma razón que ya llevó a un único `PATCH` en `add-task-list`: es el mismo recurso, la misma comprobación de permisos (ninguna), y separarla solo multiplica rutas sin cambiar nada observable.

### `GET /tasks/:id`: modifica el requisito de superficie ya archivado, a propósito
Se añade la única operación que faltaba para poder "abrir" una tarea. El transformer de detalle reutiliza `TaskTransformer` y le suma `dueDate`; el de la lista (`index`) sigue sin incluirlo — dos formas de construir la respuesta, no una condicional dentro de la misma, para que sea imposible que un cambio futuro en el transformer de detalle filtre la fecha a la lista por accidente.

**Alternativa descartada**: que `TaskTransformer` incluyera siempre `dueDate` y que fuera el frontend quien decidiera no pintarlo en la lista. Se descarta por el mismo principio que ya se aplicó al recortar el responsable a `{id, fullName}` en `add-task-list`: la garantía de "la lista no expone esto" vale más si es cierta también en la respuesta HTTP, no solo en lo que la pantalla decide mostrar.

### Frontend: un `Dialog` para abrir la tarea, no una ruta nueva
Se trae `components/ui/dialog.tsx` con `npx shadcn@latest add dialog` (usa `radix-ui`, ya instalado — no añade una dependencia nueva, solo un componente generado más, siguiendo la convención ya documentada del proyecto). Cada fila de la lista gana un botón "Abrir" que muestra un `Dialog` con: la fecha actual (o su ausencia), un campo para ponerla/cambiarla, un botón para quitarla, y la señal de vencida cuando corresponda.

**Por qué un modal y no una ruta `/tasks/:id`**: el `Dialog` de Radix trae gratis exactamente lo que CA-3 de "abrir tarea" pide (operable solo con teclado: `Esc` cierra, el foco queda atrapado dentro, `Tab` cicla) sin escribir gestión de foco a mano. "Cerrar" es simplemente cerrar el modal — la lista, que nunca se desmonta, sigue ahí debajo, que es exactamente lo que pide CA-2 ("se vuelve a la lista"). Una ruta aparte exigiría además decidir qué pasa si se navega directo a `/tasks/123` (¿hace falta la lista cargada primero? ¿otro fetch?) sin que ninguna historia pida esa capacidad.

**Alternativa descartada**: ruta dedicada `/tasks/:id` con su propia carga de datos. Más código (una página más, su propio manejo de "cargando"/"no existe") para el mismo comportamiento observable que ya cubre el modal.

### La señal de vencida: no solo color
Un badge de texto ("Vencida") junto a un icono (`lucide-react`, ya instalado), no un color de fondo solo. Cumple el punto de accesibilidad que el propio ticket FS-118.4 exige ("no depende solo del color") sin introducir nada nuevo: `lucide-react` ya es dependencia del proyecto (se usa en `login-page.tsx` y `full-screen-loader.tsx`).

## Risks / Trade-offs

- **[Riesgo]** Calcular "vencida" en el cliente significa que si el reloj del sistema de quien mira está mal ajustado, verá un veredicto incorrecto. → **Mitigación**: aceptado; es exactamente el comportamiento que CA-19 pide (el día de quien mira decide), y no hay forma de que un backend sin estado lo haga mejor sin pedirle al cliente ese mismo dato.
- **[Riesgo]** Sin tests (decisión explícita de esta sesión), los bordes de la regla de vencida (día anterior vs. mismo día, paso de medianoche) son fáciles de verificar mal a mano. → **Mitigación**: la función `isOverdue` queda aislada y pura precisamente para que, si más adelante se decide añadir tests, sea la primera candidata a cubrir sin tocar nada más; mientras tanto, `tasks.md` lista explícitamente los casos de borde a probar a mano uno por uno.
- **[Riesgo]** Añadir `GET /tasks/:id` reabre un requisito que se había cerrado deliberadamente en `add-task-list` ("no lectura individual"). → **Mitigación**: es un cambio de contrato consciente y documentado (delta `MODIFIED`, no una fisura silenciosa); sigue sin haber borrado ni endpoints de equipo, que era la preocupación de fondo de aquel requisito.
- **[Riesgo]** El campo de fecha nativo (`<input type="date">`) tiene un formato de presentación que varía según el navegador/idioma del sistema operativo, fuera del control de la aplicación. → **Mitigación**: aceptado; introducir un selector de fecha con librería propia sería una dependencia nueva para un problema cosmético menor, y ninguna historia pide un formato concreto.

## Migration Plan

1. Migración: columna `due_date` (`date`, nullable) en `tasks` → `node ace migration:run` (regenera `database/schema.ts`).
2. Backend: extender `updateTaskValidator` (`status` y `dueDate`, ambos opcionales); nueva acción `show` en `TasksController` con su transformer de detalle (`TaskTransformer` + `dueDate`); `GET /tasks/:id` en las rutas; `update` pasa a aplicar solo los campos presentes en el body.
3. Arrancar el servidor de desarrollo para regenerar `.adonisjs/server/controllers.ts` y `.adonisjs/client/registry/`, y commitear el diff.
4. Frontend: `dueDate` en el tipo `Task`; `getTask`, `updateTask` (o extender `updateTaskStatus` a un `updateTask` más general) en `lib/api.ts`; función pura `isOverdue` en `lib/`; `npx shadcn@latest add dialog`; botón "Abrir" por fila, `Dialog` con el campo de fecha, quitar fecha, y la señal de vencida.

**Rollback**: igual que `add-task-list` — repositorio de práctica sin usuarios reales; revertir el commit del change basta, o `node ace migration:rollback` para deshacer solo la columna.

## Open Questions

Ninguna: las decisiones que quedaban abiertas (vista de detalle general, tests, superficie de la API) ya se resolvieron con el usuario antes de escribir este documento.
