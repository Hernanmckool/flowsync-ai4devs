import type Task from '#models/task'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * El responsable se recorta a `{ id, fullName }` a propósito: la lista solo
 * necesita un nombre, y devolver el `UserTransformer` completo (que incluye
 * `email`) filtraría datos de cuenta a una vista que no los usa.
 */
export default class TaskTransformer extends BaseTransformer<Task> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'title', 'status', 'createdAt', 'updatedAt']),
      assignedTo: this.pick(this.resource.assignedTo, ['id', 'fullName']),
    }
  }
}
