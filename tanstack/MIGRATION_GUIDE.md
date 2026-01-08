# Migration Guide: Vite → Vite + TanStack Start

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Project Setup](#phase-1-project-setup)
4. [Phase 2: File Structure Migration](#phase-2-file-structure-migration)
5. [Phase 3: Routing Migration](#phase-3-routing-migration)
6. [Phase 4: API Integration](#phase-4-api-integration)
7. [Phase 5: Authentication](#phase-5-authentication)
8. [Phase 6: Testing & Validation](#phase-6-testing--validation)
9. [Phase 7: Deployment](#phase-7-deployment)
10. [Rollback Plan](#rollback-plan)

---

## Overview

### What is TanStack Start?
TanStack Start is a full-stack React framework built on top of TanStack Router, providing:
- **File-based routing** with type-safe navigation
- **Server-side rendering (SSR)** and streaming
- **Server functions** for API calls
- **Built-in data loading** with suspense
- **Type-safe APIs** end-to-end

### Why Migrate?
- ✅ Better SEO with SSR
- ✅ Improved performance with streaming
- ✅ Type-safe routing and data fetching
- ✅ Simplified API integration
- ✅ Better developer experience

### Current Stack
- **Frontend**: React 19.2.0 + Vite 7.2.4 + TypeScript
- **Routing**: React Router DOM 7.10.1
- **UI**: Ant Design 6.1.1
- **State**: React hooks + local state
- **API**: Axios with service layer
- **Auth**: JWT with AuthGuard/GuestGuard

### Target Stack
- **Framework**: TanStack Start (latest)
- **Routing**: TanStack Router (file-based)
- **Rendering**: SSR + Client hydration
- **API**: Server functions + Axios
- **Auth**: TanStack Router auth integration
- **UI**: Ant Design (preserved)

---

## Prerequisites

### Knowledge Requirements
- React fundamentals
- TypeScript basics
- Understanding of SSR concepts
- Familiarity with file-based routing

### Tools Needed
- Node.js 18+ (check: `node --version`)
- npm/pnpm/yarn
- Git for version control

### Backup Current State
```bash
# Create a backup branch
git checkout -b backup/vite-original
git add .
git commit -m "Backup: Original Vite setup before TanStack migration"
git checkout main

# Or simply ensure your current work is committed
git status
```

---

## Phase 1: Project Setup

### Step 1.1: Initialize TanStack Start Project

```bash
cd D:\Coding\bm-gotyaback\tanstack

# Initialize with npm
npm create @tanstack/start@latest

# Follow prompts:
# - Project name: . (current directory)
# - Template: basic (we'll customize)
# - Package manager: npm (or your preference)
```

### Step 1.2: Install Dependencies

```bash
cd D:\Coding\bm-gotyaback\tanstack

# Core dependencies from your current project
npm install antd @ant-design/icons
npm install axios
npm install @stripe/stripe-js @stripe/react-stripe-js

# Additional TanStack ecosystem
npm install @tanstack/react-query
npm install @tanstack/router-devtools

# Development dependencies
npm install -D @types/node
npm install -D typescript
```

### Step 1.3: Project Structure Setup

Create the following directory structure:
```
tanstack/
├── app/
│   ├── routes/              # File-based routes
│   ├── components/          # Reusable components
│   ├── services/            # API services
│   ├── types/               # TypeScript types
│   ├── utils/               # Helper functions
│   ├── hooks/               # Custom hooks
│   ├── constants/           # Constants
│   ├── assets/              # Static assets
│   └── styles/              # Global styles
├── public/                  # Public static files
├── .gitignore
├── app.config.ts            # TanStack Start config
├── tsconfig.json
└── package.json
```

---

## Phase 2: File Structure Migration

### Step 2.1: Copy Static Assets

```bash
# From project root
cp -r frontend/src/assets tanstack/app/assets
cp -r frontend/public/* tanstack/public/
```

### Step 2.2: Copy Type Definitions

```bash
cp frontend/src/types/campaign.types.ts tanstack/app/types/
```

Review and update imports in `tanstack/app/types/campaign.types.ts`:
- No changes needed if types are self-contained
- Update any relative imports if necessary

### Step 2.3: Copy Utility Functions

```bash
cp frontend/src/utils/stripe.ts tanstack/app/utils/
```

### Step 2.4: Copy Constants

```bash
cp -r frontend/src/constants/* tanstack/app/constants/
```

### Step 2.5: Copy Services (Will be adapted)

```bash
cp -r frontend/src/services/* tanstack/app/services/
```

**Note**: Services will need modification to work with TanStack Start's server functions (covered in Phase 4).

---

## Phase 3: Routing Migration

### Understanding the Migration

**Current (React Router DOM)**:
```tsx
// App.tsx
<Router>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
  </Routes>
</Router>
```

**Target (TanStack Router - File-based)**:
```
app/routes/
├── __root.tsx           # Root layout
├── index.tsx            # Home page (/)
├── login.tsx            # Login page (/login)
└── dashboard/
    ├── index.tsx        # Dashboard (/dashboard)
    └── profile.tsx      # Profile (/dashboard/profile)
```

### Step 3.1: Create Root Route

Create `tanstack/app/routes/__root.tsx`:

```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  )
}
```

### Step 3.2: Route Mapping Reference

Map your current routes to TanStack Router file structure:

| Current Route | Current Component | TanStack File | Notes |
|--------------|-------------------|---------------|-------|
| `/` | `Home` | `routes/index.tsx` | Protected route |
| `/login` | `Login` | `routes/login.tsx` | Guest only |
| `/register` | `Register` | `routes/register.tsx` | Guest only |
| `/campaign/:slug` | `PublicCampaign` | `routes/campaign/$slug.tsx` | Public |
| `/u/:slug` | `OrganizerLandingPage` | `routes/u/$slug.tsx` | Public |
| `/campaigns/create` | `CreateCampaign` | `routes/campaigns/create.tsx` | Protected |
| `/campaigns/:id` | `CampaignDetail` | `routes/campaigns/$id.tsx` | Protected |
| `/dashboard` | `MyCampaigns` | `routes/dashboard/index.tsx` | Protected |
| `/dashboard/profile` | `ProfileSettings` | `routes/dashboard/profile.tsx` | Protected |

### Step 3.3: Create Public Routes

**File: `tanstack/app/routes/login.tsx`**
```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import Login from '../components/pages/Login'
import { authService } from '../services/auth.service'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    // Redirect if already authenticated
    if (authService.isAuthenticated()) {
      throw redirect({ to: '/' })
    }
  },
  component: Login,
})
```

**File: `tanstack/app/routes/register.tsx`**
```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import Register from '../components/pages/Register'
import { authService } from '../services/auth.service'

export const Route = createFileRoute('/register')({
  beforeLoad: async () => {
    if (authService.isAuthenticated()) {
      throw redirect({ to: '/' })
    }
  },
  component: Register,
})
```

**File: `tanstack/app/routes/campaign/$slug.tsx`**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import PublicCampaign from '../../components/pages/PublicCampaign'

export const Route = createFileRoute('/campaign/$slug')({
  component: PublicCampaign,
})
```

**File: `tanstack/app/routes/u/$slug.tsx`**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import OrganizerLandingPage from '../../components/pages/OrganizerLandingPage'

export const Route = createFileRoute('/u/$slug')({
  component: OrganizerLandingPage,
})
```

### Step 3.4: Create Protected Routes Layout

**File: `tanstack/app/routes/_authenticated.tsx`**
```tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { AppLayout } from '../components/AppLayout'
import { authService } from '../services/auth.service'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <AppLayout onLogout={authService.logout}>
      <Outlet />
    </AppLayout>
  )
}
```

### Step 3.5: Create Protected Routes

**File: `tanstack/app/routes/_authenticated/index.tsx`**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import Home from '../../components/pages/Home'

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
})
```

**File: `tanstack/app/routes/_authenticated/campaigns/create.tsx`**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import CreateCampaign from '../../../components/pages/CreateCampaign'

export const Route = createFileRoute('/_authenticated/campaigns/create')({
  component: CreateCampaign,
})
```

**File: `tanstack/app/routes/_authenticated/campaigns/$id.tsx`**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import CampaignDetail from '../../../components/pages/CampaignDetail'

export const Route = createFileRoute('/_authenticated/campaigns/$id')({
  component: CampaignDetail,
})
```

**File: `tanstack/app/routes/_authenticated/dashboard/index.tsx`**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import MyCampaigns from '../../../components/pages/MyCampaigns'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: MyCampaigns,
})
```

**File: `tanstack/app/routes/_authenticated/dashboard/profile.tsx`**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import ProfileSettings from '../../../components/pages/ProfileSettings'

export const Route = createFileRoute('/_authenticated/dashboard/profile')({
  component: ProfileSettings,
})
```

### Step 3.6: Update Router Configuration

**File: `tanstack/app/router.tsx`**
```tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

---

## Phase 4: API Integration

### Step 4.1: Understanding Server Functions

TanStack Start allows you to create server-side functions that run on the server and can be called from the client.

**Benefits**:
- Type-safe API calls
- No need to expose API endpoints
- Automatic serialization
- Better security (API keys stay on server)

### Step 4.2: Create Server Functions

**File: `tanstack/app/services/server/auth.server.ts`**
```tsx
import { createServerFn } from '@tanstack/start'
import axios from 'axios'

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api'

export const loginServerFn = createServerFn('POST', async (credentials: {
  email: string
  password: string
}) => {
  const response = await axios.post(`${API_URL}/auth/login`, credentials)
  return response.data
})

export const registerServerFn = createServerFn('POST', async (userData: {
  email: string
  password: string
  name: string
}) => {
  const response = await axios.post(`${API_URL}/auth/register`, userData)
  return response.data
})

export const getCurrentUserServerFn = createServerFn('GET', async () => {
  const token = // Get token from cookie/session
  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
})
```

### Step 4.3: Adapt Existing Services

You can keep your existing service layer and gradually migrate to server functions.

**File: `tanstack/app/services/auth.service.ts`**
```tsx
import apiClient from './apiClient'
import { loginServerFn, registerServerFn } from './server/auth.server'

class AuthService {
  private readonly TOKEN_KEY = 'token'

  async login(email: string, password: string) {
    // Option 1: Use server function (recommended)
    const data = await loginServerFn({ email, password })

    // Option 2: Keep existing axios call (easier migration)
    // const response = await apiClient.post('/auth/login', { email, password })
    // const data = response.data

    if (data.token) {
      localStorage.setItem(this.TOKEN_KEY, data.token)
    }
    return data
  }

  async register(name: string, email: string, password: string) {
    const data = await registerServerFn({ name, email, password })
    if (data.token) {
      localStorage.setItem(this.TOKEN_KEY, data.token)
    }
    return data
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY)
    window.location.href = '/login'
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export const authService = new AuthService()
export default authService
```

### Step 4.4: Create Campaign Server Functions

**File: `tanstack/app/services/server/campaign.server.ts`**
```tsx
import { createServerFn } from '@tanstack/start'
import axios from 'axios'

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api'

export const getCampaignsServerFn = createServerFn('GET', async () => {
  const response = await axios.get(`${API_URL}/campaigns`)
  return response.data
})

export const getCampaignByIdServerFn = createServerFn('GET', async (id: string) => {
  const response = await axios.get(`${API_URL}/campaigns/${id}`)
  return response.data
})

export const createCampaignServerFn = createServerFn('POST', async (campaignData: any) => {
  const response = await axios.post(`${API_URL}/campaigns`, campaignData)
  return response.data
})
```

### Step 4.5: Integrate with TanStack Query

**File: `tanstack/app/routes/_authenticated/dashboard/index.tsx`** (updated)
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCampaignsServerFn } from '../../../services/server/campaign.server'
import MyCampaigns from '../../../components/pages/MyCampaigns'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: DashboardPage,
  loader: async () => {
    // Prefetch data on the server
    return await getCampaignsServerFn()
  },
})

function DashboardPage() {
  const initialData = Route.useLoaderData()

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => getCampaignsServerFn(),
    initialData,
  })

  return <MyCampaigns campaigns={campaigns} isLoading={isLoading} />
}
```

---

## Phase 5: Authentication

### Step 5.1: Session Management

TanStack Start works best with cookie-based sessions for SSR.

**File: `tanstack/app/utils/session.ts`**
```tsx
import { useSession } from 'vinxi/http'

export interface SessionData {
  userId?: string
  token?: string
}

export async function getSession() {
  return await useSession<SessionData>({
    password: process.env.SESSION_SECRET || 'your-secret-key-min-32-chars-long',
  })
}

export async function requireAuth() {
  const session = await getSession()
  if (!session.data.token) {
    throw redirect({ to: '/login' })
  }
  return session
}
```

### Step 5.2: Update Auth Service for SSR

**File: `tanstack/app/services/auth.service.ts`** (updated)
```tsx
import { getSession } from '../utils/session'

class AuthService {
  // Client-side methods
  async loginClient(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return response.json()
  }

  async logoutClient() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  // Server-side methods
  async isAuthenticatedServer() {
    const session = await getSession()
    return !!session.data.token
  }

  async getTokenServer() {
    const session = await getSession()
    return session.data.token
  }
}

export const authService = new AuthService()
export default authService
```

### Step 5.3: Update Protected Routes with Session

**File: `tanstack/app/routes/_authenticated.tsx`** (updated)
```tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { AppLayout } from '../components/AppLayout'
import { requireAuth } from '../utils/session'
import { authService } from '../services/auth.service'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    // Server-side auth check
    await requireAuth()
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <AppLayout onLogout={() => authService.logoutClient()}>
      <Outlet />
    </AppLayout>
  )
}
```

---

## Phase 6: Component Migration

### Step 6.1: Copy Components

```bash
# Copy all components
cp -r frontend/src/components/* tanstack/app/components/

# Create pages directory
mkdir -p tanstack/app/components/pages
cp -r frontend/src/pages/* tanstack/app/components/pages/
```

### Step 6.2: Update Component Imports

Components will need updated imports. Common changes:

**Before (React Router)**:
```tsx
import { useNavigate, useParams } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()
  const { id } = useParams()

  const handleClick = () => navigate('/dashboard')
}
```

**After (TanStack Router)**:
```tsx
import { useNavigate, useParams } from '@tanstack/react-router'

function MyComponent() {
  const navigate = useNavigate()
  const { id } = useParams({ from: '/campaigns/$id' })

  const handleClick = () => navigate({ to: '/dashboard' })
}
```

### Step 6.3: Update Navigation Links

**Before**:
```tsx
import { Link } from 'react-router-dom'

<Link to="/dashboard">Dashboard</Link>
```

**After**:
```tsx
import { Link } from '@tanstack/react-router'

<Link to="/dashboard">Dashboard</Link>
```

### Step 6.4: Update AppLayout Component

**File: `tanstack/app/components/AppLayout.tsx`**
```tsx
import React from 'react'
import { Layout, Menu } from 'antd'
import { Link, Outlet } from '@tanstack/react-router'
import { HomeOutlined, PlusOutlined, DashboardOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'

const { Header, Content, Footer } = Layout

interface AppLayoutProps {
  onLogout: () => void
}

export const AppLayout: React.FC<AppLayoutProps> = ({ onLogout }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header>
        <Menu theme="dark" mode="horizontal">
          <Menu.Item key="home" icon={<HomeOutlined />}>
            <Link to="/">Home</Link>
          </Menu.Item>
          <Menu.Item key="create" icon={<PlusOutlined />}>
            <Link to="/campaigns/create">Create Campaign</Link>
          </Menu.Item>
          <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
            <Link to="/dashboard">My Campaigns</Link>
          </Menu.Item>
          <Menu.Item key="profile" icon={<UserOutlined />}>
            <Link to="/dashboard/profile">Profile</Link>
          </Menu.Item>
          <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={onLogout}>
            Logout
          </Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '50px' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Fundraising Platform ©2026
      </Footer>
    </Layout>
  )
}
```

### Step 6.5: Update Page Components

Most page components will work with minimal changes. Focus on:

1. **Import updates**: Change from `react-router-dom` to `@tanstack/react-router`
2. **Navigation**: Use type-safe navigation
3. **Data fetching**: Optionally use loaders and TanStack Query

**Example: `tanstack/app/components/pages/CampaignDetail.tsx`**
```tsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Card, Button, Spin } from 'antd'
import { campaignService } from '../../services/campaign.service'
import type { Campaign } from '../../types/campaign.types'

const CampaignDetail: React.FC = () => {
  const { id } = useParams({ from: '/campaigns/$id' })
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaign()
  }, [id])

  const loadCampaign = async () => {
    try {
      const data = await campaignService.getCampaignById(id)
      setCampaign(data)
    } catch (error) {
      console.error('Failed to load campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spin size="large" />

  return (
    <Card title={campaign?.title}>
      {/* Campaign details */}
      <Button onClick={() => navigate({ to: '/dashboard' })}>
        Back to Dashboard
      </Button>
    </Card>
  )
}

export default CampaignDetail
```

---

## Phase 7: Configuration Files

### Step 7.1: TanStack Start Configuration

**File: `tanstack/app.config.ts`**
```tsx
import { defineConfig } from '@tanstack/start/config'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  vite: {
    plugins: [tsConfigPaths()],
  },
  server: {
    preset: 'node-server',
  },
})
```

### Step 7.2: TypeScript Configuration

**File: `tanstack/tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["./app/*"]
    }
  },
  "include": ["app"],
  "exclude": ["node_modules"]
}
```

### Step 7.3: Environment Variables

**File: `tanstack/.env.example`**
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Session Secret (min 32 characters)
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# Stripe (if using)
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

**File: `tanstack/.env`**
```env
VITE_API_URL=http://localhost:5000/api
SESSION_SECRET=change-this-to-a-secure-random-string-min-32-chars
```

### Step 7.4: Package.json Scripts

**File: `tanstack/package.json`** (update scripts)
```json
{
  "name": "tanstack-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
}
```

### Step 7.5: Git Ignore

**File: `tanstack/.gitignore`**
```
# Dependencies
node_modules

# Build output
.output
.vinxi
dist
.vercel

# Environment
.env
.env.local

# IDE
.vscode
.idea

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# TanStack Router
routeTree.gen.ts
```

---

## Phase 8: Testing & Validation

### Step 8.1: Development Server

```bash
cd tanstack
npm run dev
```

Expected output:
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### Step 8.2: Test Checklist

Create a testing checklist:

- [ ] **Public Routes**
  - [ ] `/login` - Login page loads
  - [ ] `/register` - Register page loads
  - [ ] `/campaign/test-slug` - Public campaign page loads
  - [ ] `/u/test-organizer` - Organizer landing page loads

- [ ] **Authentication**
  - [ ] Can register new user
  - [ ] Can login with credentials
  - [ ] Redirects to `/` after login
  - [ ] Cannot access protected routes when logged out
  - [ ] Can logout successfully

- [ ] **Protected Routes**
  - [ ] `/` - Home page loads when authenticated
  - [ ] `/campaigns/create` - Create campaign page loads
  - [ ] `/dashboard` - My campaigns page loads
  - [ ] `/dashboard/profile` - Profile settings loads
  - [ ] `/campaigns/:id` - Campaign detail loads

- [ ] **Navigation**
  - [ ] Menu links work correctly
  - [ ] Back buttons work
  - [ ] Type-safe navigation works
  - [ ] Browser back/forward works

- [ ] **API Integration**
  - [ ] Can fetch campaigns
  - [ ] Can create campaign
  - [ ] Can update campaign
  - [ ] Can delete campaign
  - [ ] Error handling works

- [ ] **UI Components**
  - [ ] Ant Design components render correctly
  - [ ] Forms work properly
  - [ ] Modals open and close
  - [ ] Image uploads work
  - [ ] Stripe integration works

### Step 8.3: Performance Testing

```bash
# Build for production
npm run build

# Start production server
npm start
```

Check:
- [ ] SSR works (view page source, HTML should be populated)
- [ ] Hydration works (page is interactive)
- [ ] No hydration errors in console
- [ ] Fast initial page load
- [ ] Smooth navigation

### Step 8.4: Type Safety Testing

```bash
# Run type checking
npm run typecheck
```

Should have no TypeScript errors.

---

## Phase 9: Deployment

### Step 9.1: Build Configuration

**For Node.js Server**:
```bash
npm run build
```

This creates a `.output` directory with:
- Server bundle
- Client assets
- Static files

### Step 9.2: Deployment Options

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**File: `tanstack/vercel.json`**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".output/public",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index"
    }
  ]
}
```

#### Option B: Docker

**File: `tanstack/Dockerfile`**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Option C: Traditional Node Server

```bash
# On server
git clone <repo>
cd tanstack
npm install
npm run build
npm start
```

Use PM2 for process management:
```bash
npm i -g pm2
pm2 start npm --name "tanstack-app" -- start
pm2 save
pm2 startup
```

### Step 9.3: Environment Variables in Production

Set these in your hosting platform:
- `VITE_API_URL` - Your backend API URL
- `SESSION_SECRET` - Secure random string (32+ chars)
- `STRIPE_PUBLIC_KEY` - Stripe public key
- `STRIPE_SECRET_KEY` - Stripe secret key

---

## Phase 10: Migration Strategy

### Recommended Approach: Gradual Migration

#### Week 1: Setup & Learning
1. Initialize TanStack Start project
2. Set up basic routing
3. Migrate 1-2 simple pages
4. Test thoroughly

#### Week 2: Core Features
1. Migrate authentication
2. Migrate main dashboard
3. Migrate campaign creation
4. Test user flows

#### Week 3: Advanced Features
1. Migrate campaign detail pages
2. Migrate public pages
3. Migrate payment integration
4. Test all features

#### Week 4: Polish & Deploy
1. Fix bugs
2. Performance optimization
3. Deploy to staging
4. User acceptance testing
5. Deploy to production

### Alternative: Parallel Development

Run both apps simultaneously:
- Keep `frontend/` running on port 5173
- Run `tanstack/` on port 3000
- Gradually move users to new app
- Deprecate old app when ready

---

## Phase 11: Rollback Plan

### If Migration Fails

1. **Keep original frontend intact**
   ```bash
   # Original is still at frontend/
   cd frontend
   npm run dev
   ```

2. **Use Git to revert**
   ```bash
   git checkout backup/vite-original
   ```

3. **Document issues**
   - What went wrong?
   - What needs fixing?
   - Timeline for retry

### Backup Strategy

Before starting:
```bash
# Create full backup
git checkout -b backup/pre-tanstack-migration
git add .
git commit -m "Full backup before TanStack migration"
git push origin backup/pre-tanstack-migration
```

---

## Common Issues & Solutions

### Issue 1: Hydration Mismatch

**Problem**: Console shows hydration errors

**Solution**:
```tsx
// Use client-only rendering for problematic components
import { ClientOnly } from '@tanstack/start'

<ClientOnly>
  {() => <ProblematicComponent />}
</ClientOnly>
```

### Issue 2: localStorage in SSR

**Problem**: `localStorage is not defined`

**Solution**:
```tsx
// Check if running on client
if (typeof window !== 'undefined') {
  localStorage.setItem('key', 'value')
}
```

### Issue 3: Route Not Found

**Problem**: 404 on valid routes

**Solution**:
- Check file naming: `$id.tsx` for dynamic routes
- Run route generation: Routes should auto-generate
- Check `routeTree.gen.ts` is created

### Issue 4: API Calls Failing

**Problem**: CORS or connection errors

**Solution**:
```tsx
// Ensure API URL is correct
console.log('API URL:', process.env.VITE_API_URL)

// Check CORS on backend
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-domain.com'],
  credentials: true
}))
```

### Issue 5: Ant Design Styles Not Loading

**Problem**: Components have no styling

**Solution**:
```tsx
// Import Ant Design CSS in root
// File: app/routes/__root.tsx
import 'antd/dist/reset.css'
```

---

## Performance Optimization

### 1. Code Splitting

TanStack Start automatically code-splits by route. For additional splitting:

```tsx
import { lazy } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))
```

### 2. Prefetching

```tsx
import { Link } from '@tanstack/react-router'

<Link
  to="/dashboard"
  preload="intent" // Prefetch on hover
>
  Dashboard
</Link>
```

### 3. Image Optimization

```tsx
// Use next-gen formats
<img
  src="/image.webp"
  alt="Campaign"
  loading="lazy"
/>
```

### 4. Bundle Analysis

```bash
npm run build -- --analyze
```

---

## Additional Resources

### Documentation
- [TanStack Start Docs](https://tanstack.com/start)
- [TanStack Router Docs](https://tanstack.com/router)
- [TanStack Query Docs](https://tanstack.com/query)

### Community
- [TanStack Discord](https://discord.com/invite/tanstack)
- [GitHub Discussions](https://github.com/TanStack/router/discussions)

### Examples
- [TanStack Start Examples](https://github.com/TanStack/router/tree/main/examples)

---

## Next Steps

1. **Review this guide thoroughly**
2. **Set up development environment**
3. **Start with Phase 1: Project Setup**
4. **Follow phases sequentially**
5. **Test after each phase**
6. **Document any issues**
7. **Ask for help when stuck**

---

## Conclusion

This migration will modernize your application with:
- ✅ Better performance (SSR)
- ✅ Improved SEO
- ✅ Type-safe routing
- ✅ Better developer experience
- ✅ Future-proof architecture

**Estimated Timeline**: 2-4 weeks depending on complexity and testing requirements.

**Recommended**: Start with a small proof-of-concept (login + one protected page) before full migration.

Good luck with your migration! 🚀


