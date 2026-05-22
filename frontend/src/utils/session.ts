import { useSession } from 'vinxi/http'

export interface SessionData {
  userId?: string
  token?: string
  user?: {
    _id: string
    name: string
    email: string
    organizerSlug?: string
    accessToken: string
  }
}

/**
 * Get the current session
 * This function can only be called on the server side
 */
export async function getSession() {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required but not set. Generate one with: openssl rand -hex 32')
  }
  return await useSession<SessionData>({
    password: secret,
  })
}

/**
 * Set user session data
 */
export async function setUserSession(userData: SessionData['user']) {
  const session = await getSession()
  await session.update({
    userId: userData?._id,
    token: userData?.accessToken,
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

