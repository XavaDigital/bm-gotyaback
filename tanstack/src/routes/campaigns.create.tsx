import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '~/utils/auth-helpers'
import CreateCampaign from '~/pages/CreateCampaign'

export const Route = createFileRoute('/campaigns/create')({
  beforeLoad: async () => {
    // Server-side authentication check
    await requireAuth()
  },
  component: CreateCampaign,
})

