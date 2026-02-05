# TanStack Start - Quick Reference Card

One-page reference for common tasks and patterns.

---

## 📁 File Structure

```
app/
├── routes/                  # File-based routes
│   ├── __root.tsx          # Root layout (double underscore)
│   ├── index.tsx           # Home page (/)
│   ├── about.tsx           # About page (/about)
│   ├── blog/               # Blog section
│   │   ├── index.tsx       # /blog
│   │   └── $slug.tsx       # /blog/:slug (dynamic)
│   └── _auth/              # Layout route (underscore prefix)
│       └── dashboard.tsx   # /dashboard (protected)
├── components/             # React components
├── services/               # API services
└── utils/                  # Helper functions
```

---

## 🛣️ Routing Patterns

### Basic Route
```tsx
// app/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: () => <div>About Page</div>
})
```

### Dynamic Route
```tsx
// app/routes/blog/$slug.tsx
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/blog/$slug')({
  component: BlogPost
})

function BlogPost() {
  const { slug } = useParams({ from: '/blog/$slug' })
  return <div>Post: {slug}</div>
}
```

### Layout Route (with children)
```tsx
// app/routes/_auth.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  component: () => (
    <div>
      <nav>Navigation</nav>
      <Outlet /> {/* Children render here */}
    </div>
  )
})
```

### Protected Route
```tsx
// app/routes/_auth.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  }
})
```

---

## 🔗 Navigation

### Link Component
```tsx
import { Link } from '@tanstack/react-router'

// Basic link
<Link to="/about">About</Link>

// With params
<Link to="/blog/$slug" params={{ slug: 'hello' }}>Post</Link>

// With search params
<Link to="/search" search={{ q: 'react' }}>Search</Link>

// Prefetch on hover
<Link to="/dashboard" preload="intent">Dashboard</Link>
```

### Programmatic Navigation
```tsx
import { useNavigate } from '@tanstack/react-router'

function MyComponent() {
  const navigate = useNavigate()
  
  // Basic navigation
  navigate({ to: '/about' })
  
  // With params
  navigate({ to: '/blog/$slug', params: { slug: 'hello' } })
  
  // With search
  navigate({ to: '/search', search: { q: 'react' } })
  
  // Replace (no history entry)
  navigate({ to: '/login', replace: true })
}
```

---

## 📊 Data Loading

### Route Loader
```tsx
export const Route = createFileRoute('/posts')({
  loader: async () => {
    const posts = await fetchPosts()
    return { posts }
  },
  component: PostsPage
})

function PostsPage() {
  const { posts } = Route.useLoaderData()
  return <div>{posts.map(p => <div key={p.id}>{p.title}</div>)}</div>
}
```

### With TanStack Query
```tsx
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/posts')({
  loader: async () => await fetchPosts(), // Prefetch
  component: PostsPage
})

function PostsPage() {
  const initialData = Route.useLoaderData()
  
  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    initialData
  })
  
  return <div>{posts.map(p => <div key={p.id}>{p.title}</div>)}</div>
}
```

---

## 🔐 Authentication

### Session Setup
```tsx
// app/utils/session.ts
import { useSession } from 'vinxi/http'

export async function getSession() {
  return await useSession({
    password: process.env.SESSION_SECRET!
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

### Protected Route
```tsx
// app/routes/_auth.tsx
import { requireAuth } from '../utils/session'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    await requireAuth()
  }
})
```

---

## 🌐 Server Functions

### Create Server Function
```tsx
// app/services/server/posts.server.ts
import { createServerFn } from '@tanstack/start'

export const getPostsServerFn = createServerFn('GET', async () => {
  const response = await fetch('https://api.example.com/posts')
  return response.json()
})

export const createPostServerFn = createServerFn('POST', async (data: {
  title: string
  content: string
}) => {
  const response = await fetch('https://api.example.com/posts', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return response.json()
})
```

### Use Server Function
```tsx
import { getPostsServerFn } from '../services/server/posts.server'

export const Route = createFileRoute('/posts')({
  loader: async () => await getPostsServerFn(),
  component: PostsPage
})
```

---

## 🎨 Common Patterns

### Search Params
```tsx
import { z } from 'zod'

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().default(1)
})

export const Route = createFileRoute('/search')({
  validateSearch: searchSchema,
  component: SearchPage
})

function SearchPage() {
  const { q, page } = Route.useSearch()
  return <div>Query: {q}, Page: {page}</div>
}
```

### Error Handling
```tsx
export const Route = createFileRoute('/posts')({
  loader: async () => {
    const posts = await fetchPosts()
    if (!posts) throw new Error('Failed to load posts')
    return { posts }
  },
  errorComponent: ({ error }) => (
    <div>Error: {error.message}</div>
  )
})
```

### Pending State
```tsx
export const Route = createFileRoute('/posts')({
  pendingComponent: () => <div>Loading...</div>,
  component: PostsPage
})
```

---

## 🔧 Hooks

```tsx
import {
  useNavigate,      // Navigate programmatically
  useParams,        // Get route params
  useSearch,        // Get search params
  useRouter,        // Access router instance
  useMatches,       // Get matched routes
  useLocation,      // Get current location
} from '@tanstack/react-router'

function MyComponent() {
  const navigate = useNavigate()
  const params = useParams({ from: '/blog/$slug' })
  const search = Route.useSearch()
  const data = Route.useLoaderData()
  
  return <div>...</div>
}
```

---

## 📝 File Naming

| Pattern | Example | URL |
|---------|---------|-----|
| Basic | `about.tsx` | `/about` |
| Index | `index.tsx` | `/` |
| Dynamic | `$id.tsx` | `/:id` |
| Nested | `blog/index.tsx` | `/blog` |
| Layout | `_auth.tsx` | Layout only |
| Root | `__root.tsx` | Root layout |

---

## ⚡ Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm run typecheck    # Check TypeScript
```

---

## 🐛 Common Mistakes

### ❌ Wrong
```tsx
// String navigation
navigate('/about')

// Missing 'from' in useParams
const { id } = useParams()

// Missing Outlet in layout
function Layout() {
  return <div>Layout</div>
}
```

### ✅ Correct
```tsx
// Object navigation
navigate({ to: '/about' })

// With 'from' in useParams
const { id } = useParams({ from: '/posts/$id' })

// With Outlet in layout
function Layout() {
  return (
    <div>
      Layout
      <Outlet />
    </div>
  )
}
```

---

## 📚 Resources

- [TanStack Start Docs](https://tanstack.com/start)
- [TanStack Router Docs](https://tanstack.com/router)
- [Discord](https://discord.com/invite/tanstack)

---

**Print this page for quick reference!** 📄

