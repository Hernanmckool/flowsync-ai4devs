import type { TaskDetail } from '@/lib/types'

/**
 * Vencida ⇔ tiene fecha de vencimiento, esa fecha es anterior al día de
 * `today`, y la tarea no está en "Hecho".
 *
 * `today` se recibe como parámetro (nunca se lee `new Date()` aquí dentro)
 * para que la función sea pura y trivial de razonar; quien la llama en
 * pantalla le pasa el reloj del propio navegador — es la única forma de que
 * dos personas en husos horarios distintos puedan ver un veredicto distinto
 * para la misma tarea, y que las dos lecturas sean correctas.
 *
 * La comparación es por día de calendario, no por instante: tanto
 * `dueDate` como `today` se normalizan a medianoche **local** antes de
 * comparar. `dueDate` (`YYYY-MM-DD`) se parsea a mano en vez de con
 * `new Date(dueDate)`, porque el motor de JS interpreta ese formato como
 * medianoche UTC, no local — con eso, alguien al oeste de UTC vería
 * vencida una tarea con fecha de "hoy" bastante antes de que ese día
 * terminase para ella.
 */
export function isOverdue(
  task: Pick<TaskDetail, 'dueDate' | 'status'>,
  today: Date,
): boolean {
  if (task.dueDate === null || task.status === 'done') return false

  return parseLocalDate(task.dueDate) < startOfLocalDay(today)
}

function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
