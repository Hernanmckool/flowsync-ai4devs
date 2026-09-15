## Context

Ver `proposal.md` para el porqué. Lo que este documento da por sentado del estado actual:

- **Backend**: el único vertical existente es `auth` (`backend/app/{controllers,models,validators,transformers}` con un solo recurso, `User`). El modelo `User` extiende un `UserSchema` autogenerado (`database/schema.ts`, regenerado por `node ace migration:run`) y no declara columnas a mano. Las rutas se agrupan con `router.group(...).prefix(...).as(...).use(middleware.auth())`, referenciando controladores vía el registro generado `#generated/controllers` (no imports directos). Toda respuesta pasa por `serialize()` con un `Transformer` propio; nunca se devuelve un modelo crudo.
- **Frontend**: el único vertical existente es también `auth` (`auth/`, `pages/{login,register,profile}-page.tsx`, `routes/{app-routes,protected-route,public-only-route}.tsx`, `lib/api.ts`, `lib/types.ts`). Los componentes de UI disponibles en `components/ui/` son `Alert`, `Button`, `Card`, `Input`, `Label` — no hay `Select`, `Badge`, `Table` ni ningún componente de listas o formularios más ricos.
- Restricción explícita del alcance: sin dependencias nuevas, sin componentes de `components/ui/` nuevos, sin tests.

## Goals / Non-Goals

**Goals:**
- Persistir tareas con título, responsable y estado, sin fecha de vencimiento.
- Tres endpoints, ni uno más: listar, crear, actualizar estado.
- Reutilizar al máximo el patrón ya existente (transformers, validators, grouping de rutas, `ProtectedRoute`, `lib/api.ts`) en vez de introducir uno nuevo para este vertical.
- Que el responsable nunca filtre más que su nombre en la respuesta de la API de tareas.

**Non-Goals (a nivel de diseño, además de lo ya excluido en el proposal):**
- No se introduce una capa de estado global de frontend (Redux/Zustand/Context genérico) para las tareas: el estado vive local a la página, igual de simple que lo que ya hace `AuthProvider` para la sesión.
- No se añade paginación, filtros ni búsqueda a `GET /tasks`: se devuelven todas.
- No se introduce control de concurrencia (optimistic locking, ETags) en la actualización de estado: última escritura gana, igual que cualquier UPDATE simple.
- No se decide aquí ningún criterio de orden para la lista (ver proposal.md); el orden que devuelva la consulta no se fuerza ni se documenta como contrato.

## Decisions

### Modelo de datos: una tabla `tasks`, sin tabla de estados
`title` (string), `status` (string, restringido solo a nivel de aplicación) y `assigned_to_id` (entero, FK a `users.id`, `NOT NULL`). Nada de fecha de vencimiento ni columnas preparadas para ella.

**Alternativa descartada**: modelar el estado como una tabla `task_statuses` separada. Es innecesario para un catálogo cerrado de tres valores fijos que ninguna historia permite ampliar (`Requirement: Conjunto cerrado de tres estados`); añadiría una tabla, un join y una migración de datos semilla sin ningún beneficio observable.

`status` se valida con `vine.enum(['pending', 'in_progress', 'done'])` tanto al crear como al actualizar, igual en espíritu a como `app/validators/user.ts` ya centraliza reglas compartidas — aquí como una constante exportada con los tres valores, reutilizada por ambos validadores para no duplicar el catálogo.

### Límite de longitud del título: una asunción explícita, no una decisión de producto
El propio backlog (`us-titulo-obligatorio.md`) deja el umbral exacto pendiente de **PA-9**. Para que el sistema funcione hay que fijar algún número ahora: se usa **200 caracteres** como valor de trabajo (`vine.string().trim().minLength(1).maxLength(200)`), documentado aquí y en el proposal como asunción, no como contrato. Cambiarlo después es tocar un único número en el validador; no afecta a la spec (que deliberadamente no fija ningún número) ni al resto del diseño.

`.trim()` antes de `.minLength(1)` cubre a la vez "sin título" y "título solo con espacios" (`Requirement: Título obligatorio y con contenido real`) con la misma regla, sin un chequeo aparte.

### Recorte del responsable a `{id, fullName}`, nunca el `UserTransformer` completo
La propia historia de origen avisa: "la lista solo necesita un nombre; devolver el registro de usuario entero filtra datos de cuenta". El `TaskTransformer` no reutiliza `UserTransformer` (que expone `email`) para el responsable: construye a mano un objeto mínimo con `id` y `fullName` (nullable). El frontend decide mostrar "Sin nombre" cuando `fullName` es `null`, con el mismo patrón (`user.fullName ?? 'Sin nombre'`) que ya usa `profile-page.tsx` — no se inventa un fallback nuevo.

### Cambiar el estado: `PATCH /api/v1/tasks/:id` con `{ status }`, nada más
Un único campo editable. Sin body de reasignación (decisión ya tomada: el responsable no se reasigna en este change) ni de título. Cualquier usuario autenticado puede llamarlo sobre cualquier tarea: no hay comprobación de propiedad, igual que ninguna ruta de `auth` comprueba roles hoy.

**Alternativa descartada**: un único `PATCH` genérico que aceptase también `title`. Ninguna historia de este change pide editar el título tras crearlo; añadirlo sería alcance no pedido.

### Rutas: agrupadas bajo `/api/v1/tasks`, con el mismo guard que `/account`
```
GET   /api/v1/tasks       (listar)
POST  /api/v1/tasks       (crear)
PATCH /api/v1/tasks/:id   (cambiar estado)
```
Mismo patrón que el grupo `/account` ya existente: `router.group(...).prefix('tasks').as('tasks').use(middleware.auth())`, controladores referenciados vía `#generated/controllers`. No hay `GET /tasks/:id` ni `DELETE /tasks/:id` (`Requirement: Superficie de la API de tareas`).

### Frontend: página única con creación inline y cambio de estado con un `<select>` nativo
- `pages/tasks-page.tsx` carga la lista al montar (mismo patrón imperativo con `useEffect` + `useState` que ya usa `auth-provider.tsx` para rehidratar sesión, sin librería de fetching nueva).
- La creación es un formulario inline en la propia página (un `Input` + un `Button`, reutilizando `useAuthForm`-como-patrón si aplica, o un estado local equivalente), no una pantalla ni un modal aparte — así la tarea creada aparece sin navegar a ningún sitio.
- El cambio de estado por fila usa un elemento `<select>` HTML nativo (no un componente `Select` de shadcn, que no existe todavía en `components/ui/` y que el alcance prohíbe añadir), con las tres opciones fijas (Pendiente/En curso/Hecho) mapeadas 1:1 a `pending`/`in_progress`/`done` mediante una constante compartida en `lib/types.ts`. Se le aplican las mismas clases Tailwind que ya usa `Input` para que combine visualmente sin ser, en los hechos, ese componente.

  **Alternativa descartada**: tres `Button` a modo de toggle-group por fila. Es más código (gestionar cuál está "activo" por fila) para el mismo resultado observable que un `<select>`, que además es el control nativo pensado exactamente para "elegir uno de un conjunto cerrado".

- Constante `TASK_STATUS_LABELS` en `lib/types.ts`: `{ pending: 'Pendiente', in_progress: 'En curso', done: 'Hecho' }`. Único lugar donde el identificador de la API se traduce a texto en pantalla; nada en el resto del frontend compara ni transporta las etiquetas en castellano.

### Enrutado: `/tasks` como pantalla principal
- Nueva ruta protegida `/tasks` (dentro del mismo `<ProtectedRoute>` que ya envuelve a `/profile`).
- `PublicOnlyRoute` y el catch-all de `app-routes.tsx`, que hoy mandan a `/profile`, pasan a mandar a `/tasks`.
- Se añade una franja de navegación mínima (sin componente nuevo: un `<header>` con enlaces `Link` de `react-router`, reutilizando las clases de texto ya usadas en `auth-layout.tsx`) presente en `/tasks` y en `/profile`, para poder ir de una a la otra — hoy no hace falta porque `/profile` es la única pantalla protegida.

## Risks / Trade-offs

- **[Riesgo]** Sin control de concurrencia en el cambio de estado: si dos personas cambian el estado de la misma tarea casi a la vez, gana la última escritura y la otra persona no se entera hasta refrescar. → **Mitigación**: aceptado; ninguna historia de este change pide otra cosa, y el refresco en vivo es una historia aparte (`E3-2`).
- **[Riesgo]** El límite de 200 caracteres en el título es una asunción interna, no una cifra decidida por producto. → **Mitigación**: documentado aquí y en el proposal; es un único valor en un validador, trivial de cambiar cuando exista una decisión (PA-9).
- **[Riesgo]** Sin orden garantizado en `GET /tasks`, el orden visual puede no ser estable entre peticiones si el motor de base de datos no lo garantiza implícitamente. → **Mitigación**: aceptado y documentado como punto abierto (pendiente de PA-3); no se finge un orden que no está decidido.
- **[Riesgo]** Usar un `<select>` nativo en vez de un componente de UI dedicado puede leerse como una inconsistencia visual menor frente al resto del formulario. → **Mitigación**: se le aplican las mismas clases que a `Input`; el coste de introducir un componente nuevo (y la dependencia de radix que shadcn traería para un `Select` accesible) no está justificado para esta única interacción.

## Migration Plan

1. Migración `create_tasks_table` (`title`, `status`, `assigned_to_id` FK a `users.id`, timestamps) → `node ace migration:run` (regenera `database/schema.ts`).
2. Modelo `Task` (compose con el schema generado + relación `belongsTo` a `User`).
3. Validadores de creación (`title`) y de cambio de estado (`status`), compartiendo la constante del catálogo de estados.
4. `TaskTransformer`, con el responsable recortado a `{id, fullName}`.
5. Controlador(es) y rutas bajo `/api/v1/tasks`, con el mismo guard `auth` que ya protege `/account`.
6. Arrancar el servidor de desarrollo (o correr los tests, aunque en este change no se añaden) para que se regeneren `.adonisjs/server/controllers.ts` y `.adonisjs/client/registry/`, y commitear ese diff generado — según la convención ya documentada en `CLAUDE.md`.
7. Frontend: tipos y llamadas en `lib/`, página de lista con creación inline y `<select>` de estado, ajuste de `app-routes.tsx` (destino tras login/registro y catch-all a `/tasks`), franja de navegación mínima entre `/tasks` y `/profile`.

**Rollback**: repositorio de práctica sin usuarios reales; revertir el commit del change es suficiente. Si hiciera falta deshacer solo la migración, `node ace migration:rollback`.

## Open Questions

- El límite exacto de caracteres del título (aquí, 200, como asunción de trabajo) queda pendiente de que el PRD fije el umbral real (**PA-9** en el backlog). Cambiarlo no afecta a la spec, al enfoque ni al desglose de tareas — es un solo número en un validador.
