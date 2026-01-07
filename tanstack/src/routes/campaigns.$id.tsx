import { createFileRoute, redirect } from '@tanstack/react-router'
import authService from '../services/auth.service'
import CampaignDetail from '../pages/CampaignDetail'

export const Route = createFileRoute('/campaigns/$id')({
  beforeLoad: () => {
    const user = authService.getCurrentUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: CampaignDetail,
})

