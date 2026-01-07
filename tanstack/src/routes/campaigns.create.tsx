import { createFileRoute, redirect } from '@tanstack/react-router'
import authService from '../services/auth.service'
import CreateCampaign from '../pages/CreateCampaign'

export const Route = createFileRoute('/campaigns/create')({
  beforeLoad: () => {
    const user = authService.getCurrentUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: CreateCampaign,
})

