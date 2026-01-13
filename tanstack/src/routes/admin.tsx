import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '~/utils/auth-helpers'
import Admin from '~/pages/Admin'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    // Server-side authentication check
    await requireAuth()
  },
  component: Admin,
})

