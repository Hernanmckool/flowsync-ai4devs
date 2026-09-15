import { Link } from 'react-router'

type AppNavProps = {
  current: 'tasks' | 'profile'
}

const OTHER_SCREEN = {
  tasks: { to: '/profile', label: 'Mi perfil' },
  profile: { to: '/tasks', label: 'Tareas' },
} as const satisfies Record<
  AppNavProps['current'],
  { to: string; label: string }
>

/**
 * Franja mínima para moverse entre las dos pantallas protegidas. No hace
 * falta un componente de `components/ui/` para esto: un `<header>` con un
 * enlace basta, con las mismas clases de texto que ya usa `auth-layout.tsx`.
 */
export function AppNav({ current }: AppNavProps) {
  const other = OTHER_SCREEN[current]

  return (
    <header className="flex items-center justify-between border-b bg-background px-6 py-3">
      <span className="text-sm font-semibold tracking-tight">FlowSync</span>
      <Link
        to={other.to}
        className="text-foreground text-sm font-medium underline"
      >
        {other.label}
      </Link>
    </header>
  )
}
