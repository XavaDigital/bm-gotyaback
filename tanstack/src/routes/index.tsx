import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '~/utils/auth-helpers'
import Home from '~/pages/Home'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    // Server-side authentication check
    await requireAuth()
  },
  component: Home,
})

