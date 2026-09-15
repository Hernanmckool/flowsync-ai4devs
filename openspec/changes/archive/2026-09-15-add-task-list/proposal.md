## Why

FlowSync tiene cuentas y sesión (`auth`) pero ninguna forma de anotar ni ver trabajo: hoy, tras iniciar sesión, lo único que hay es la página de perfil. El equipo necesita una lista compartida donde crear una tarea con un título, verla junto a las de todos los demás y mover su estado sin fricción, que es el núcleo mínimo de gestión de tareas que el PRD del MVP describe (RF-5 a RF-9, RF-16, RF-17).

## What Changes

- Se añade una tabla de tareas: título, responsable (usuario que la creó) y estado (`pending` | `in_progress` | `done`), sin fecha de vencimiento.
- Se añaden tres endpoints autenticados bajo `/api/v1`: listar todas las tareas, crear una tarea (solo título) y actualizar el estado de una tarea existente. No hay lectura individual, no hay borrado y no hay endpoints de equipo.
- Al crear, el título es el único dato que se pide; la tarea nace en `pending` con quien la crea como responsable, sin que el cliente pueda enviar responsable, estado ni fecha.
- El estado es un conjunto cerrado de tres valores; cualquier otro valor en la creación o la actualización se rechaza.
- El responsable de una tarea no es reasignable en este change: cualquiera puede cambiar el estado de cualquier tarea, pero no hay operación para cambiar de quién es.
- Se añade una pantalla de lista de tareas en el frontend (reutilizando `Button`, `Card`, `Input`, `Label`, `Alert` ya existentes en `frontend/src/components/ui/`, sin añadir dependencias ni componentes de un design system nuevo): crear con solo el título, ver título/responsable/estado de cada tarea sin abrirla, cambiar el estado desde la propia fila, y un estado vacío que explica qué es esto y ofrece crear la primera.
- El responsable se muestra en la lista por su nombre; si la cuenta no tiene nombre puesto, se muestra "Sin nombre" (nunca el email ni el id).
- La lista de tareas pasa a ser la pantalla principal tras iniciar sesión: se añade la ruta `/tasks`, protegida igual que `/profile`, y tanto el catch-all como el destino por defecto tras login/registro pasan de `/profile` a `/tasks`. Se añade un enlace desde la lista hacia `/profile` (antes era la única pantalla protegida y no necesitaba uno).
- **BREAKING** (solo dentro de este repo de práctica, sin usuarios reales): quien ya tenía guardado el hábito de llegar a `/profile` tras iniciar sesión ahora llega a `/tasks`.

Fuera de alcance en este change, deliberadamente:
- Fecha de vencimiento de la tarea (no existe el campo; no se prepara para añadirlo después).
- Reasignar el responsable de una tarea a otra persona (ninguna de las historias de origen lo describe, y no hay endpoint de equipo del que sacar con quién reasignar).
- Cualquier orden o agrupación de la lista: no hay criterio de orden decidido (pendiente de PA-3 en el backlog); la lista no se ordena explícitamente y el orden en que aparecen las tareas queda como comportamiento no especificado.
- Refresco en vivo cuando otra persona cambia algo (es la historia `E3-2`, aparte).
- Tests: este change no monta base de pruebas ni añade tests, ni en el backend ni en el frontend.

## Capabilities

### New Capabilities
- `tasks`: crear, listar y cambiar el estado de las tareas de la lista compartida del equipo, y cómo se ven en pantalla.

### Modified Capabilities
_(ninguna: `auth` no cambia su comportamiento. La ruta por defecto tras login pasa a ser `/tasks` en vez de `/profile`, pero eso es routing del frontend, no un requisito de la capability `auth` — que nunca ha declarado a dónde se navega tras autenticar, solo que se autentica.)_

## Impact

- **Backend**: nueva migración (tabla `tasks`), modelo `Task`, un controlador para listar+crear y otro (o el mismo) para actualizar estado, un validador para creación y otro para actualización de estado, un transformer que exponga el responsable por nombre. Nuevas rutas bajo `/api/v1`, protegidas con el mismo guard `auth` que ya protege `/account/*`.
- **Frontend**: nueva página de lista de tareas y su ruta protegida `/tasks`; ajuste de `app-routes.tsx` (login/registro/catch-all apuntan a `/tasks`); nueva llamada en `lib/api.ts` para las tres operaciones; un enlace de navegación entre `/tasks` y `/profile`. Sin dependencias nuevas ni componentes de UI nuevos más allá de los ya existentes en `components/ui/`.
- **Sin tests**: no se crea `tests/unit` ni `tests/functional` en el backend, ni runner de tests en el frontend, como parte de este change.
