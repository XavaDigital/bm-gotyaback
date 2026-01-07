import { createFileRoute } from '@tanstack/react-router'
import PublicCampaign from '../pages/PublicCampaign'

export const Route = createFileRoute('/campaign/$slug')({
  component: PublicCampaign,
})

