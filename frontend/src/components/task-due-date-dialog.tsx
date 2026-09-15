import { useEffect, useState } from 'react'
import { AlertCircleIcon, TriangleAlertIcon } from 'lucide-react'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import { isOverdue } from '@/lib/is-overdue'
import { TASK_STATUS_LABELS } from '@/lib/types'
import type { Task, TaskDetail } from '@/lib/types'
import { FieldError } from '@/components/field-error'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type TaskDueDateDialogProps = {
  task: Task
  token: string
}

/**
 * La superficie mínima de "abrir una tarea" que este change necesita: solo
 * la fecha de vencimiento y si está vencida, nada más (no es la vista de
 * detalle general de `E2-5`, que sigue bloqueada por PA-6). Un `Dialog` en
 * vez de una ruta propia: cerrar es simplemente cerrar el modal, la lista
 * de detrás nunca se desmonta, y el foco/teclado ya vienen resueltos por
 * Radix (ver `design.md`).
 */
export function TaskDueDateDialog({ task, token }: TaskDueDateDialogProps) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<TaskDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [dueDateError, setDueDateError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Se consulta cada vez que se abre: es la única superficie que trae la
  // fecha, y abrir sin tocar nada no debe cambiar nada de la tarea.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setDetail(null)
    setDetailError(null)

    api
      .getTask(task.id, token)
      .then((data) => {
        if (cancelled) return
        setDetail(data)
        setDueDate(data.dueDate)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setDetailError(
          error instanceof ApiError
            ? error.message
            : 'No hemos podido cargar la tarea.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [open, task.id, token])

  // Poner, cambiar o quitar se guarda solo: no hay botón de "guardar" ni
  // diálogo de confirmación al quitar (CA-15, CA-16 de la historia).
  const applyDueDate = (next: string | null) => {
    setDueDateError(null)
    setIsSaving(true)
    const previous = dueDate
    setDueDate(next)

    api
      .updateTask(task.id, { dueDate: next }, token)
      .then((updated) => setDetail(updated))
      .catch((error: unknown) => {
        setDueDate(previous)
        setDueDateError(
          error instanceof ApiError
            ? error.message
            : 'No hemos podido guardar la fecha.',
        )
      })
      .finally(() => setIsSaving(false))
  }

  // Se calcula sobre `dueDate` (el estado local, ya actualizado de forma
  // optimista por `applyDueDate`), no sobre `detail.dueDate`: si se usara
  // este último, la insignia quedaría mostrando la condición anterior
  // durante la ventana entre cambiar el campo y que el PATCH resuelva.
  const overdue =
    detail !== null && isOverdue({ dueDate, status: detail.status }, new Date())
  const fieldId = `due-date-${task.id}`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Abrir
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">{task.title}</DialogTitle>
          <DialogDescription>
            {task.assignedTo.fullName ?? 'Sin nombre'} ·{' '}
            {TASK_STATUS_LABELS[task.status]}
          </DialogDescription>
        </DialogHeader>

        {detailError && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{detailError}</AlertDescription>
          </Alert>
        )}

        {!detail && !detailError && (
          <p className="text-muted-foreground text-sm">Cargando…</p>
        )}

        {detail && (
          <div className="grid gap-4">
            {overdue && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertDescription>Vencida</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor={fieldId}>Fecha de vencimiento</Label>
              <div className="flex gap-2">
                <Input
                  id={fieldId}
                  type="date"
                  value={dueDate ?? ''}
                  disabled={isSaving}
                  onChange={(event) => applyDueDate(event.target.value || null)}
                  aria-invalid={Boolean(dueDateError)}
                  aria-describedby={
                    dueDateError ? `${fieldId}-error` : undefined
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving || dueDate === null}
                  onClick={() => applyDueDate(null)}
                >
                  Quitar
                </Button>
              </div>
              <FieldError
                id={`${fieldId}-error`}
                message={dueDateError ?? undefined}
              />
              {dueDate === null && !dueDateError && (
                <p className="text-muted-foreground text-sm">
                  Sin fecha de vencimiento.
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
