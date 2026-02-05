import { useSession } from 'vinxi/http'

export interface SessionData {
  userId?: string
  token?: string
  user?: {
    _id: string
    name: string
    email: string
    organizerSlug?: string
    token: string
  }
}

/**
 * Get the current session
 * This function can only be called on the server side
 */
export async function getSession() {
  return await useSession<SessionData>({
    password: process.env.SESSION_SECRET || 'change-this-to-a-secure-random-string-min-32-chars-long-please',
  })
}

/**
 * Set user session data
 */
export async function setUserSession(userData: SessionData['user']) {
  const session = await getSession()
  await session.update({
    userId: userData?._id,
    token: userData?.token,
    user: userData,
  })
}

/**
 * Clear user session
 */
export async function clearUserSession() {
  const session = await getSession()
  await session.update({
    userId: undefined,
    token: undefined,
    user: undefined,
  })
}

/**
 * Get current user from session
 */
export async function getCurrentUserFromSession() {
  const session = await getSession()
  return session.data.user || null
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticatedServer() {
  const session = await getSession()
  return !!session.data.token && !!session.data.user
}

