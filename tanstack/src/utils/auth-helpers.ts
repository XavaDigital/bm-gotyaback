import { redirect } from '@tanstack/react-router'

// Helper to check if we're in the browser
const isBrowser = typeof window !== 'undefined'

/**
 * Get current user from localStorage (works on both client and server)
 */
function getCurrentUser() {
  if (!isBrowser) return null

  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      return JSON.parse(userStr)
    }
  } catch (error) {
    console.error('Failed to parse user from localStorage:', error)
  }
  return null
}

/**
 * Get token from localStorage
 */
function getToken() {
  if (!isBrowser) return null
  return localStorage.getItem('token')
}

/**
 * Authentication check for protected routes
 * Throws redirect to /login if not authenticated
 * Only runs on the client side to avoid SSR issues
 */
export async function requireAuth() {
  // Skip auth check on server-side (SSR)
  // The check will happen on the client after hydration
  if (!isBrowser) {
    return
  }

  const user = getCurrentUser()
  const token = getToken()

  if (!user || !token) {
    throw redirect({ to: '/login' })
  }
}

/**
 * Check for guest-only routes (login, register)
 * Throws redirect to / if already authenticated
 * Only runs on the client side to avoid SSR issues
 */
export async function requireGuest() {
  // Skip check on server-side (SSR)
  if (!isBrowser) {
    return
  }

  const user = getCurrentUser()

  if (user) {
    throw redirect({ to: '/' })
  }
}

