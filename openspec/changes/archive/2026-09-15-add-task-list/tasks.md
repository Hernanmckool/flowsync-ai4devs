## 1. Backend: modelo de datos

- [x] 1.1 Crear la migración `create_tasks_table` (`title`, `status`, `assigned_to_id` como FK a `users.id`, timestamps) y correr `node ace migration:run`; verificar que termina sin errores y que `database/schema.ts` incluye ahora el schema generado para `tasks`.
- [x] 1.2 Crear el modelo `Task` (compose con el schema generado) con la relación `belongsTo` hacia `User` como responsable; verificar que `npm run typecheck` (en `backend/`) pasa sin errores.

## 2. Backend: validación y transformación

- [x] 2.1 Añadir el catálogo de los tres estados como constante compartida y el validador de creación (`title`: recortado, no vacío, con el límite de longitud fijado en `design.md`); verificar con `curl` que crear con título vacío o solo espacios responde 422 con el error asociado al campo `title`.
- [x] 2.2 Añadir el validador de cambio de estado (`status` restringido al catálogo de los tres valores); verificar con `curl` que actualizar con un valor fuera del catálogo responde 422.
- [x] 2.3 Añadir el transformer de tarea, exponiendo `id`, `title`, `status`, `createdAt`, `updatedAt` y `assignedTo: { id, fullName }`; verificar inspeccionando el JSON de una respuesta real y confirmando que `email` no aparece en ningún nivel de esa respuesta.

## 3. Backend: endpoints

- [x] 3.1 Añadir el controlador y las rutas `GET /api/v1/tasks` (listar) y `POST /api/v1/tasks` (crear), agrupadas bajo el mismo guard de autenticación que ya protege `/api/v1/account`; verificar con `curl` autenticado que listar devuelve el listado envuelto en `{"data": [...]}` y que crear enviando solo `{"title": "..."}` devuelve una tarea con `status` igual a `pending` y `assignedTo.id` igual al usuario dueño del token.
- [x] 3.2 Añadir el controlador y la ruta `PATCH /api/v1/tasks/:id` para cambiar el estado; verificar con `curl` que cambia el estado de una tarea creada por otra cuenta sin ningún error de permiso, y que la misma petición sin token responde 401.
- [x] 3.3 Verificar con `curl` que no existen `GET /api/v1/tasks/:id`, `DELETE /api/v1/tasks/:id` ni ningún endpoint bajo un prefijo de equipos.
- [x] 3.4 Arrancar `npm run dev` en `backend/` para que se regeneren `.adonisjs/server/controllers.ts` y `.adonisjs/client/registry/`; verificar el diff generado antes de incluirlo en el commit del change.

## 4. Frontend: tipos y llamadas a la API

- [x] 4.1 Añadir en `lib/types.ts` el tipo `Task`, la unión `TaskStatus` (`'pending' | 'in_progress' | 'done'`) y la constante `TASK_STATUS_LABELS` con las tres etiquetas en castellano; verificar que `npm run build` (typecheck incluido) pasa en `frontend/`.
- [x] 4.2 Añadir en `lib/api.ts` las funciones `listTasks`, `createTask` y `updateTaskStatus`, reutilizando el `request()` y el manejo de `ApiError` ya existentes; verificar llamándolas a mano contra el backend levantado y confirmando que un error de validación llega con sus `fieldErrors`.

## 5. Frontend: pantalla de tareas

- [x] 5.1 Crear `pages/tasks-page.tsx`: carga la lista al montar, formulario inline de creación con un único campo de título, una fila por tarea con título, responsable (nombre o "Sin nombre") y estado, y un `<select>` nativo por fila para cambiar el estado; verificar abriendo `/tasks` con una cuenta sin tareas (aparece el estado vacío con su explicación y su llamada a crear la primera) y luego creando una tarea (aparece en la lista sin recargar).
- [x] 5.2 Revisar visualmente que ninguna fila ni el formulario de creación muestran fecha, marca de "vencida", ni ofrecen elegir responsable o estado al crear.

## 6. Frontend: enrutado y navegación

- [x] 6.1 Añadir la ruta protegida `/tasks` en `app-routes.tsx` y cambiar a `/tasks` el destino de `PublicOnlyRoute` y el del catch-all (hoy ambos apuntan a `/profile`); verificar que tras iniciar sesión o registrarse se aterriza en `/tasks`, y que visitar una URL desconocida con sesión activa también lleva ahí.
- [x] 6.2 Añadir una franja de navegación mínima con un enlace entre `/tasks` y `/profile`; verificar que se puede ir de una pantalla a la otra sin recargar la página.

## 7. Verificación integral

- [x] 7.1 Recorrer a mano, con dos cuentas distintas y dos sesiones de navegador, los escenarios de `specs/tasks/spec.md`: mismo contenido para ambas cuentas, crear tarea con solo título, título vacío y título solo con espacios rechazados, tarea nacida en Pendiente y con quien la creó como responsable, cambio de estado de una tarea ajena desde la lista, y un estado inválido por API rechazado con 422; confirmar que cada uno se cumple tal cual está escrito.
- [x] 7.2 Correr `openspec validate add-task-list --strict` y confirmar que no reporta errores.
