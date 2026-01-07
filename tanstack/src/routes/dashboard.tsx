import { createFileRoute, redirect } from '@tanstack/react-router'
import authService from '../services/auth.service'
import MyCampaigns from '../pages/MyCampaigns'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    const user = authService.getCurrentUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: MyCampaigns,
})

