import { createFileRoute, redirect } from '@tanstack/react-router'
import authService from '../services/auth.service'
import ProfileSettings from '../pages/ProfileSettings'

export const Route = createFileRoute('/dashboard/profile')({
  beforeLoad: () => {
    const user = authService.getCurrentUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: ProfileSettings,
})

