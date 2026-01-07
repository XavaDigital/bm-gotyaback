import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ConfigProvider } from 'antd'
import * as React from 'react'
import 'antd/dist/reset.css'
import '../index.css'
import '../App.css'
import { AppLayout } from '../components/AppLayout'
import authService from '../services/auth.service'

// Light theme for admin portal
const lightTheme = {
  token: {
    colorPrimary: "#C8102E",
    colorLink: "#C8102E",
    colorLinkHover: "#A00D25",
    fontFamily:
      "Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontFamilyCode: "'Courier New', Courier, monospace",
  },
  components: {
    Button: {
      primaryShadow: "0 0 0 0 rgba(0,0,0,0)",
    },
  },
}

// Dark theme for public pages
const darkTheme = {
  token: {
    colorPrimary: "#C8102E",
    colorLink: "#C8102E",
    colorLinkHover: "#A00D25",
    colorBgContainer: "#2a2a2a",
    colorText: "#ffffff",
    colorTextSecondary: "#cccccc",
    colorTextTertiary: "#999999",
    colorBorder: "#3a3a3a",
    fontFamily:
      "Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontFamilyCode: "'Courier New', Courier, monospace",
  },
  components: {
    Button: {
      primaryShadow: "0 0 0 0 rgba(0,0,0,0)",
    },
  },
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'GotYaBack - Crowdfunding Platform',
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootComponent() {
  const [user, setUser] = React.useState<any>(null)
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  // Only access localStorage on the client side
  React.useEffect(() => {
    setUser(authService.getCurrentUser())
  }, [pathname])

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isPublicPage = pathname === '/' || pathname.startsWith('/campaign/') || pathname.startsWith('/u/')

  // Protected pages: dashboard, campaigns, profile
  const isProtectedPage = pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/campaigns') ||
                          pathname.includes('/profile')

  // Public pages (including home) and auth pages use dark theme
  if (isAuthPage || isPublicPage) {
    return (
      <ConfigProvider theme={darkTheme}>
        <Outlet />
      </ConfigProvider>
    )
  }

  // Protected pages use light theme and AppLayout
  if (isProtectedPage) {
    return (
      <ConfigProvider theme={lightTheme}>
        <AppLayout onLogout={authService.logout}>
          <Outlet />
        </AppLayout>
      </ConfigProvider>
    )
  }

  // Default fallback (should rarely be used)
  return (
    <ConfigProvider theme={lightTheme}>
      <Outlet />
    </ConfigProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}

