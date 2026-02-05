import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '~/utils/auth-helpers'
import Admin from '~/pages/Admin'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    // Server-side authentication and admin role check
    await requireAdmin()
  },
  component: Admin,
})

