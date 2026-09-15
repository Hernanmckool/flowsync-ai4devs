/**
 * Espejo de `UserTransformer` del backend (app/transformers/user_transformer.ts).
 */
export type User = {
  id: number
  fullName: string | null
  email: string
  initials: string
  createdAt: string
  updatedAt: string
}

/**
 * Respuesta de `POST /auth/signup` y `POST /auth/login`, ya sin el envoltorio `{ data }`.
 */
export type AuthResult = {
  user: User
  token: string
}

export type SignupPayload = {
  /** El backend lo declara `.nullable()`: la clave debe viajar siempre, aunque valga `null`. */
  fullName: string | null
  email: string
  password: string
  passwordConfirmation: string
}

export type LoginPayload = {
  email: string
  password: string
}

/**
 * Conjunto cerrado de estados de una tarea. Viajan por la API en inglés;
 * `TASK_STATUS_LABELS` es el único lugar donde se traducen para pantalla.
 */
export type TaskStatus = 'pending' | 'in_progress' | 'done'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  done: 'Hecho',
}

/**
 * Espejo de `TaskTransformer` del backend (app/transformers/task_transformer.ts).
 * El responsable viaja recortado a `{ id, fullName }`: nunca su email.
 */
export type Task = {
  id: number
  title: string
  status: TaskStatus
  createdAt: string
  updatedAt: string
  assignedTo: {
    id: number
    fullName: string | null
  }
}

/**
 * Espejo de `TaskDetailTransformer`: lo único que `Task` no trae y que solo
 * viaja al abrir una tarea suelta (`GET /tasks/:id`), nunca en la lista.
 * `dueDate` es una fecha de calendario (`YYYY-MM-DD`), sin hora ni huso.
 */
export type TaskDetail = Task & {
  dueDate: string | null
}

export type CreateTaskPayload = {
  title: string
}

/** Ambos campos son independientes: se envía solo el que se quiera tocar. */
export type UpdateTaskPayload = {
  status?: TaskStatus
  dueDate?: string | null
}
