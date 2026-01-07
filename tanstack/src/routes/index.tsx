import { createFileRoute, redirect } from '@tanstack/react-router'
import authService from '../services/auth.service'
import Home from '../pages/Home'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const user = authService.getCurrentUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: Home,
})

