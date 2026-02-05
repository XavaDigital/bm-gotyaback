# Vite vs TanStack Start - Side-by-Side Comparison

This document shows the differences between your current Vite setup and the new TanStack Start setup.

---

## Project Structure

### Current (Vite)
```
frontend/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Router setup
│   ├── pages/                # Page components
│   ├── components/           # Reusable components
│   ├── services/             # API services
│   └── types/                # TypeScript types
├── index.html                # HTML template
├── vite.config.ts            # Vite config
└── package.json
```

### New (TanStack Start)
```
tanstack/
├── app/
│   ├── routes/               # File-based routes (pages)
│   │   ├── __root.tsx        # Root layout
│   │   ├── index.tsx         # Home page
│   │   └── login.tsx         # Login page
│   ├── components/           # Reusable components
│   ├── services/             # API services
│   └── types/                # TypeScript types
├── app.config.ts             # TanStack config
└── package.json
```

**Key Difference**: Routes are now files in `app/routes/` instead of being defined in `App.tsx`.

---

## Routing

### Current (React Router DOM)

**File: `frontend/src/App.tsx`**
```tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/campaign/:slug" element={<PublicCampaign />} />
      </Routes>
    </Router>
  )
}
```

### New (TanStack Router)

**File: `tanstack/app/routes/index.tsx`**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import Home from '../components/pages/Home'

export const Route = createFileRoute('/')({
  component: Home,
})
```

**File: `tanstack/app/routes/login.tsx`**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import Login from '../components/pages/Login'

export const Route = createFileRoute('/login')({
  component: Login,
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

**Key Difference**: Each route is a separate file. Dynamic segments use `$` prefix.

---

## Navigation

### Current (React Router DOM)

```tsx
import { useNavigate, Link } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()
  
  return (
    <>
      <Link to="/dashboard">Dashboard</Link>
      <button onClick={() => navigate('/login')}>Login</button>
    </>
  )
}
```

### New (TanStack Router)

```tsx
import { useNavigate, Link } from '@tanstack/react-router'

function MyComponent() {
  const navigate = useNavigate()
  
  return (
    <>
      <Link to="/dashboard">Dashboard</Link>
      <button onClick={() => navigate({ to: '/login' })}>Login</button>
    </>
  )
}
```

**Key Difference**: `navigate()` takes an object instead of a string (type-safe!).

---

## Route Parameters

### Current (React Router DOM)

```tsx
import { useParams } from 'react-router-dom'

function CampaignDetail() {
  const { id } = useParams() // Type: string | undefined
  
  return <div>Campaign ID: {id}</div>
}
```

### New (TanStack Router)

```tsx
import { useParams } from '@tanstack/react-router'

function CampaignDetail() {
  const { id } = useParams({ from: '/campaigns/$id' }) // Fully typed!
  
  return <div>Campaign ID: {id}</div>
}
```

**Key Difference**: Must specify `from` route for type safety.

---

## Protected Routes

### Current (React Router DOM)

**File: `frontend/src/components/AuthGuard.tsx`**
```tsx
import { Navigate, Outlet } from 'react-router-dom'
import authService from '../services/auth.service'

export const AuthGuard = () => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
```

**Usage in `App.tsx`:**
```tsx
<Route element={<AuthGuard />}>
  <Route path="/" element={<Home />} />
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

### New (TanStack Router)

**File: `tanstack/app/routes/_authenticated.tsx`**
```tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { authService } from '../services/auth.service'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => <Outlet />,
})
```

**File: `tanstack/app/routes/_authenticated/index.tsx`**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import Home from '../../components/pages/Home'

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
})
```

**Key Difference**: Auth logic in route file using `beforeLoad`. Routes under `_authenticated/` are automatically protected.

---

## Data Fetching

### Current (React Router DOM + useEffect)

```tsx
import { useEffect, useState } from 'react'
import { campaignService } from '../services/campaign.service'

function MyCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadCampaigns()
  }, [])
  
  const loadCampaigns = async () => {
    try {
      const data = await campaignService.getCampaigns()
      setCampaigns(data)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) return <div>Loading...</div>
  return <div>{/* Render campaigns */}</div>
}
```

### New (TanStack Router + Loader)

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { campaignService } from '../services/campaign.service'

export const Route = createFileRoute('/dashboard/')({
  loader: async () => {
    return await campaignService.getCampaigns()
  },
  component: MyCampaigns,
})

function MyCampaigns() {
  const campaigns = Route.useLoaderData()
  
  return <div>{/* Render campaigns */}</div>
}
```

**Key Difference**: Data loads before component renders. No loading state needed!

---

## API Calls

### Current (Axios)

**File: `frontend/src/services/apiClient.ts`**
```tsx
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
```

**File: `frontend/src/services/campaign.service.ts`**
```tsx
import apiClient from './apiClient'

class CampaignService {
  async getCampaigns() {
    const response = await apiClient.get('/campaigns')
    return response.data
  }
}

export const campaignService = new CampaignService()
```

### New (Server Functions - Optional)

**File: `tanstack/app/services/server/campaign.server.ts`**
```tsx
import { createServerFn } from '@tanstack/start'
import axios from 'axios'

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api'

export const getCampaignsServerFn = createServerFn('GET', async () => {
  const response = await axios.get(`${API_URL}/campaigns`)
  return response.data
})
```

**File: `tanstack/app/services/campaign.service.ts`**
```tsx
import { getCampaignsServerFn } from './server/campaign.server'

class CampaignService {
  async getCampaigns() {
    return await getCampaignsServerFn()
  }
}

export const campaignService = new CampaignService()
```

**Key Difference**: Server functions run on the server, keeping API keys secure. But you can keep using Axios if preferred!

---

## Environment Variables

### Current (Vite)

**File: `frontend/.env`**
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

**Usage:**
```tsx
const apiUrl = import.meta.env.VITE_API_URL
```

### New (TanStack Start)

**File: `tanstack/.env`**
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
SESSION_SECRET=your-secret-key
```

**Usage (same):**
```tsx
const apiUrl = import.meta.env.VITE_API_URL
```

**Key Difference**: Can also use server-only env vars (without `VITE_` prefix) in server functions.

---

## Build & Dev Commands

### Current (Vite)

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Build for production
npm run preview  # Preview production build
```

### New (TanStack Start)

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Build for production (SSR)
npm start        # Start production server
```

**Key Difference**: Production build includes a server, not just static files.

---

## Rendering

### Current (Vite - CSR)

1. Browser loads empty HTML
2. Downloads JavaScript bundle
3. React renders app
4. Content appears

**Result**: Slower initial load, worse SEO

### New (TanStack Start - SSR)

1. Server renders HTML with content
2. Browser displays content immediately
3. JavaScript loads and hydrates
4. App becomes interactive

**Result**: Faster initial load, better SEO

---

## Summary of Benefits

| Feature | Vite (Current) | TanStack Start (New) |
|---------|---------------|---------------------|
| **Routing** | Manual setup | File-based, automatic |
| **Type Safety** | Partial | Full (routes, params, loaders) |
| **SEO** | Poor (CSR only) | Excellent (SSR) |
| **Initial Load** | Slower | Faster |
| **Data Fetching** | Manual (useEffect) | Built-in (loaders) |
| **Code Splitting** | Manual | Automatic (per route) |
| **Developer Experience** | Good | Excellent |
| **Learning Curve** | Low | Medium |

---

## Migration Effort

| Task | Effort | Notes |
|------|--------|-------|
| Setup project | Low | ~30 minutes |
| Create routes | Medium | ~2-4 hours |
| Migrate components | Low | Mostly copy-paste |
| Update navigation | Low | Find & replace imports |
| Implement auth | Medium | ~2-3 hours |
| Test everything | High | ~1-2 days |
| **Total** | **2-4 weeks** | Depends on testing thoroughness |

---

## When to Use What

### Stick with Vite if:
- ✅ You need a simple SPA
- ✅ SEO doesn't matter
- ✅ Team is unfamiliar with SSR
- ✅ Project is very small

### Migrate to TanStack Start if:
- ✅ You need better SEO
- ✅ You want faster initial loads
- ✅ You want type-safe routing
- ✅ You're building a production app
- ✅ You want modern best practices

---

**For your fundraising platform, TanStack Start is recommended because:**
1. Better SEO for campaign pages
2. Faster load times for public campaigns
3. Type-safe routing reduces bugs
4. Better developer experience
5. Future-proof architecture


