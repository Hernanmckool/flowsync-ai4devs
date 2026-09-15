import Task from '#models/task'
import { createTaskValidator, updateTaskValidator } from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import TaskTransformer from '#transformers/task_transformer'
import TaskDetailTransformer from '#transformers/task_detail_transformer'

export default class TasksController {
  async index({ serialize }: HttpContext) {
    const tasks = await Task.query().preload('assignedTo')

    return serialize(TaskTransformer.transform(tasks))
  }

  async store({ request, auth, serialize }: HttpContext) {
    const { title } = await request.validateUsing(createTaskValidator)
    const user = auth.getUserOrFail()

    const task = await Task.create({
      title,
      status: 'pending',
      assignedToId: user.id,
    })
    await task.load('assignedTo')

    return serialize(TaskTransformer.transform(task))
  }

  /**
   * Detalle de una tarea suelta: es la única operación que expone la fecha
   * de vencimiento (la lista nunca la incluye, ni siquiera en el JSON).
   */
  async show({ params, serialize }: HttpContext) {
    const task = await Task.findOrFail(params.id)
    await task.load('assignedTo')

    return serialize(TaskDetailTransformer.transform(task))
  }

  /**
   * Cambia el estado y/o la fecha de vencimiento de una tarea existente.
   * Ambos campos son independientes y opcionales: solo se toca el que
   * viaja en el body. Cualquier usuario autenticado puede llamarlo sobre
   * cualquier tarea, no solo sobre las propias (no hay comprobación de
   * propiedad, igual que ninguna otra ruta de la API comprueba roles hoy).
   */
  async update({ params, request, serialize }: HttpContext) {
    const { status, dueDate } = await request.validateUsing(updateTaskValidator)

    const task = await Task.findOrFail(params.id)
    if (status !== undefined) task.status = status
    if (dueDate !== undefined) task.dueDate = dueDate
    await task.save()
    await task.load('assignedTo')

    return serialize(TaskDetailTransformer.transform(task))
  }
}
