import TaskTransformer from '#transformers/task_transformer'

/**
 * Extiende `TaskTransformer` sumando la fecha de vencimiento. Es un
 * transformer aparte, no un campo condicional dentro de `TaskTransformer`,
 * a propósito: así es imposible que un cambio futuro en el detalle filtre
 * la fecha a la lista por accidente (la lista siempre usa `TaskTransformer`
 * a secas, que nunca ha sabido de `dueDate`).
 *
 * `dueDate` se formatea con `toISODate()` (`YYYY-MM-DD`, sin hora ni huso):
 * el valor crudo de Lucid es un `DateTime` de Luxon cuyo `toJSON()` por
 * defecto incluiría hora y offset, filtrando precisión que este campo
 * deliberadamente no tiene (ver `design.md`).
 */
export default class TaskDetailTransformer extends TaskTransformer {
  toObject() {
    return {
      ...super.toObject(),
      dueDate: this.resource.dueDate?.toISODate() ?? null,
    }
  }
}
