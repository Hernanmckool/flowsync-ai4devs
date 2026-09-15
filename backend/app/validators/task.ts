import vine from '@vinejs/vine'

/**
 * Conjunto cerrado de estados posibles para una tarea. Compartido por los
 * validadores de creación y de actualización para no duplicar el catálogo.
 */
export const TASK_STATUSES = ['pending', 'in_progress', 'done'] as const

/**
 * Validator to use when creating a task. The title is the only input:
 * status and assignee are derived server-side, never accepted from the client.
 *
 * El límite de longitud (200) es una asunción de trabajo documentada en
 * `design.md`, no una decisión de producto: el umbral real sigue pendiente
 * (ver PA-9 en el backlog).
 */
export const createTaskValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(200),
})

/**
 * Validator to use when updating a task. `status` and `dueDate` are both
 * independent and optional: a request can touch either, both, or (in
 * practice) neither. The assignee cannot be reassigned in this change.
 *
 * `dueDate` accepts `null` to remove it, a `YYYY-MM-DD` string to set or
 * change it, or being absent to leave it untouched. No lower bound: a past
 * date is accepted without rejection (the task simply becomes overdue).
 */
export const updateTaskValidator = vine.create({
  status: vine.enum(TASK_STATUSES).optional(),
  dueDate: vine
    .date({ formats: ['YYYY-MM-DD'] })
    .nullable()
    .optional(),
})
