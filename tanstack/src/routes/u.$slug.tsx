import { createFileRoute } from '@tanstack/react-router'
import OrganizerLandingPage from '../pages/OrganizerLandingPage'

export const Route = createFileRoute('/u/$slug')({
  component: OrganizerLandingPage,
})

