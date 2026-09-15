import { useEffect, useState } from 'react'
import { AlertCircleIcon } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import { useAuthForm } from '@/auth/use-auth-form'
import { AppNav } from '@/components/app-nav'
import { FieldError } from '@/components/field-error'
import { FullScreenLoader } from '@/components/full-screen-loader'
import { TaskDueDateDialog } from '@/components/task-due-date-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import { TASK_STATUS_LABELS } from '@/lib/types'
import type { Task, TaskStatus } from '@/lib/types'

const STATUS_OPTIONS: readonly TaskStatus[] = ['pending', 'in_progress', 'done']

const FIELDS = ['title'] as const

/**
 * Mismas clases que `Input` (components/ui/input.tsx) para que el `<select>`
 * nativo combine visualmente sin ser, en los hechos, un componente nuevo.
 */
const selectClassName =
  'h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

export function TasksPage() {
  const { token } = useAuth()
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const { isSubmitting, formError, fieldErrors, submit } = useAuthForm(FIELDS)

  // `ProtectedRoute` garantiza que aquí ya hay sesión resuelta, así que
  // `token` siempre está presente mientras esta página está montada.
  useEffect(() => {
    if (!token) return
    let cancelled = false

    api
      .listTasks(token)
      .then((data) => {
        if (!cancelled) setTasks(data)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'No hemos podido cargar las tareas.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault()
    if (!token) return

    return submit(async () => {
      const task = await api.createTask({ title }, token)
      // Se añade en el sitio sin recargar ni navegar a ninguna otra pantalla.
      setTasks((current) => [...(current ?? []), task])
      setTitle('')
    })
  }

  const handleStatusChange = (task: Task, status: TaskStatus) => {
    if (!token) return
    setStatusError(null)

    // El cambio se refleja de inmediato en la vista; si el backend lo
    // rechaza, se revierte y se avisa, en vez de dejar la fila desincronizada.
    const previousStatus = task.status
    setTasks((current) =>
      (current ?? []).map((t) => (t.id === task.id ? { ...t, status } : t)),
    )

    api.updateTask(task.id, { status }, token).catch((error: unknown) => {
      setTasks((current) =>
        (current ?? []).map((t) =>
          t.id === task.id ? { ...t, status: previousStatus } : t,
        ),
      )
      setStatusError(
        error instanceof ApiError
          ? error.message
          : 'No hemos podido cambiar el estado de esa tarea.',
      )
    })
  }

  if (tasks === null && !loadError) {
    return <FullScreenLoader />
  }

  // `ProtectedRoute` garantiza que aquí ya hay sesión resuelta.
  if (!token) return null

  return (
    <div className="bg-muted/40 min-h-svh">
      <AppNav current="tasks" />

      <main className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Tareas del equipo</CardTitle>
            <CardDescription>
              Una única lista, la misma para todos: cualquiera puede crear una
              tarea y cambiar su estado.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6">
            {loadError && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCreate} className="grid gap-2" noValidate>
              <Label htmlFor="title">Nueva tarea</Label>
              <div className="flex gap-2">
                <Input
                  id="title"
                  name="title"
                  placeholder="¿En qué vas a trabajar?"
                  autoComplete="off"
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.title)}
                  aria-describedby={
                    fieldErrors.title ? 'title-error' : undefined
                  }
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando…' : 'Añadir'}
                </Button>
              </div>
              <FieldError id="title-error" message={fieldErrors.title} />

              {formError && (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
            </form>

            {statusError && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertDescription>{statusError}</AlertDescription>
              </Alert>
            )}

            {tasks && tasks.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Todavía no hay ninguna tarea. Esta es la lista compartida del
                equipo: escribe un título arriba para crear la primera.
              </p>
            )}

            {tasks && tasks.length > 0 && (
              <ul className="grid gap-3">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{task.title}</p>
                      <p className="text-muted-foreground truncate text-sm">
                        {task.assignedTo.fullName ?? 'Sin nombre'}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        aria-label={`Estado de "${task.title}"`}
                        className={selectClassName}
                        value={task.status}
                        onChange={(event) =>
                          handleStatusChange(
                            task,
                            event.target.value as TaskStatus,
                          )
                        }
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {TASK_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>

                      <TaskDueDateDialog task={task} token={token} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
