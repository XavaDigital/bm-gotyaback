import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '~/utils/auth-helpers'
import ProfileSettings from '~/pages/ProfileSettings'

export const Route = createFileRoute('/dashboard/profile')({
  beforeLoad: async () => {
    await requireAuth()
  },
  component: ProfileSettings,
})

