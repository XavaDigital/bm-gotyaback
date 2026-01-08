import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireAuth } from '~/utils/auth-helpers'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    // Server-side authentication check
    await requireAuth()
  },
  component: () => <Outlet />,
})

