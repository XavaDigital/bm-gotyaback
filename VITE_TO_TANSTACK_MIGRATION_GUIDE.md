# Complete Migration Guide: Vite + React Router → TanStack Start

This guide documents the complete migration process from a Vite + React Router application to TanStack Start, based on real-world experience migrating the GotYaBack crowdfunding platform.

## Table of Contents
1. [Overview](#overview)
2. [Common Issues & Solutions](#common-issues--solutions)
3. [Step-by-Step Migration Process](#step-by-step-migration-process)
4. [Styling & Theming](#styling--theming)
5. [Component Migration](#component-migration)
6. [Routing Migration](#routing-migration)
7. [Testing & Validation](#testing--validation)
8. [Checklist](#checklist)

---

## Overview

### Why Migrate to TanStack Start?

- **Better Performance**: Built-in SSR and streaming support
- **Type Safety**: Full TypeScript support with type-safe routing
- **Modern Architecture**: File-based routing with automatic code splitting
- **Developer Experience**: Better dev tools and debugging

### Key Differences

| Aspect | Vite + React Router | TanStack Start |
|--------|-------------------|----------------|
| Routing | Component-based (`<Route>`) | File-based (`routes/` directory) |
| Navigation | `useNavigate()` from react-router-dom | `useNavigate()` from @tanstack/react-router |
| Route Params | `useParams<{ id: string }>()` | `useParams({ from: '/route/$id' })` |
| Layouts | Nested `<Route>` with `<Outlet>` | File naming convention with `<Outlet>` |
| SSR | Manual setup required | Built-in support |

---

## Common Issues & Solutions

### Issue 1: Missing Dependencies

**Problem**: Components fail to render due to missing npm packages.

**Symptoms**:
```
Failed to resolve import "@lexical/react/LexicalComposer"
```

**Solution**:
1. Compare `package.json` from both projects
2. Install missing dependencies:
```bash
npm install <missing-package>
```

**Common packages to check**:
- Rich text editors: `lexical`, `@lexical/react`, `@lexical/rich-text`, `@lexical/html`
- Payment processing: `@stripe/stripe-js`, `@stripe/react-stripe-js`
- UI libraries: `antd`, `@ant-design/icons`

---

### Issue 2: Font Styling Not Applied

**Problem**: Custom fonts (Google Fonts) not loading, causing fallback to system fonts.

**Symptoms**:
- Text appears in default system font instead of custom fonts
- Headings don't use the specified font family

**Solution**:

In TanStack Start, add fonts to the root route's `head` configuration:

```tsx
// tanstack/src/routes/__root.tsx
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap',
      },
    ],
  }),
  // ... rest of config
})
```

Then ensure your CSS uses these fonts:

```css
/* App.css */
body {
  font-family: Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: Archivo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

---

### Issue 3: Theme Context Issues

**Problem**: Components inherit wrong theme (dark theme on light pages or vice versa).

**Symptoms**:
- Modal text is white on white background (invisible)
- Public pages have wrong background colors
- Form labels are unreadable

**Solution**:

**A. Set up theme configuration in root route:**

```tsx
// tanstack/src/routes/__root.tsx
import { ConfigProvider } from 'antd'

const lightTheme = {
  token: {
    colorPrimary: "#C8102E",
    colorText: "rgba(0, 0, 0, 0.88)",
    colorTextSecondary: "rgba(0, 0, 0, 0.65)",
    colorBgContainer: "#ffffff",
    colorBorder: "#d9d9d9",
  },
}

const darkTheme = {
  token: {
    colorPrimary: "#C8102E",
    colorBgContainer: "#2a2a2a",
    colorText: "#ffffff",
    colorTextSecondary: "#cccccc",
    colorBorder: "#3a3a3a",
  },
}
```

**B. Apply themes based on route:**

```tsx
function RootComponent() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isPublicPage = pathname === '/' || pathname.startsWith('/campaign/')
  const isProtectedPage = pathname.startsWith('/dashboard') || pathname.startsWith('/campaigns')

  if (isAuthPage || isPublicPage) {
    return (
      <ConfigProvider theme={darkTheme}>
        <Outlet />
      </ConfigProvider>
    )
  }

  if (isProtectedPage) {
    return (
      <ConfigProvider theme={lightTheme}>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </ConfigProvider>
    )
  }
}
```

**C. Override theme for specific components (e.g., modals):**

When a component needs a different theme than its parent:

```tsx
// SponsorCheckoutModal.tsx
import { ConfigProvider, theme } from 'antd'

const SponsorCheckoutModal = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorText: 'rgba(0, 0, 0, 0.88)',
          colorBgContainer: '#ffffff',
          // ... other light theme tokens
        },
      }}
    >
      <Modal>
        {/* Modal content */}
      </Modal>
    </ConfigProvider>
  )
}
```

---

### Issue 4: Page Centering Issues

**Problem**: Content is not centered on public pages despite having `margin: '0 auto'`.

**Symptoms**:
- Content appears flush left
- `maxWidth` and `margin: '0 auto'` styles don't work

**Solution**:

Check `index.css` for conflicting flex styles on the body:

**❌ Bad (causes issues):**
```css
body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}
```

**✅ Good:**
```css
body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}
```

The `display: flex` and `place-items: center` on body interferes with child element centering.

---

### Issue 5: Text Color Visibility on Dark Backgrounds

**Problem**: Text appears black on dark backgrounds, making it unreadable.

**Symptoms**:
- Bio/description text is invisible on public profile pages
- Headings blend with dark backgrounds

**Solution**:

Explicitly set text colors for components rendered on dark backgrounds:

```tsx
// OrganizerProfileHeader.tsx
<div>
  <Title level={2} style={{ margin: 0, color: '#ffffff' }}>
    {profile.displayName}
  </Title>

  <Title level={4} style={{ color: '#ffffff' }}>About</Title>

  <div
    className="ql-editor"
    style={{ padding: 0, color: '#cccccc' }}
    dangerouslySetInnerHTML={{ __html: profile.bio }}
  />

  <Link href={url} target="_blank" style={{ color: '#C8102E' }}>
    Website
  </Link>
</div>
```

**Color Guidelines for Dark Backgrounds:**
- Headings: `#ffffff` (white)
- Body text: `#cccccc` (light gray)
- Links: `#C8102E` (brand color)
- Secondary text: `#999999` (medium gray)

---

### Issue 6: Nested Routes Not Rendering

**Problem**: Child routes (e.g., `/dashboard/profile`) show parent component instead.

**Symptoms**:
- Navigating to `/dashboard/profile` shows campaigns list instead of profile settings
- Child route component never renders

**Root Cause**:

In TanStack Router, file naming creates route hierarchy:
- `dashboard.tsx` → `/dashboard` (parent)
- `dashboard.profile.tsx` → `/dashboard/profile` (child of dashboard)

If `dashboard.tsx` renders a component directly instead of `<Outlet />`, child routes won't render.

**Solution**:

**❌ Bad (parent route renders component directly):**
```tsx
// routes/dashboard.tsx
export const Route = createFileRoute('/dashboard')({
  component: MyCampaigns, // ❌ No outlet for children
})
```

**✅ Good (parent route renders Outlet):**
```tsx
// routes/dashboard.tsx
export const Route = createFileRoute('/dashboard')({
  component: () => <Outlet />, // ✅ Renders child routes
})

// routes/dashboard.index.tsx (NEW FILE)
export const Route = createFileRoute('/dashboard/')({
  component: MyCampaigns, // Renders at /dashboard
})

// routes/dashboard.profile.tsx
export const Route = createFileRoute('/dashboard/profile')({
  component: ProfileSettings, // Renders at /dashboard/profile
})
```

**Key Points:**
- Parent routes with children should render `<Outlet />`
- Create `dashboard.index.tsx` for the parent route's default content
- Child routes automatically nest under parent

---

## Step-by-Step Migration Process

### Phase 1: Project Setup

1. **Create TanStack Start project:**
```bash
npm create @tanstack/start@latest
cd tanstack-app
npm install
```

2. **Copy dependencies from Vite project:**
```bash
# Compare package.json files
# Install all dependencies from old project
npm install antd @ant-design/icons axios
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install lexical @lexical/react @lexical/rich-text
# ... etc
```

3. **Copy static assets:**
```bash
cp -r vite-app/src/assets tanstack-app/src/
```

4. **Copy global styles:**
```bash
cp vite-app/src/index.css tanstack-app/src/
cp vite-app/src/App.css tanstack-app/src/
```

---

### Phase 2: Configure Root Route

1. **Set up theme configuration:**

Copy theme objects from your Vite app's theme provider to `__root.tsx`:

```tsx
// tanstack/src/routes/__root.tsx
import { ConfigProvider } from 'antd'
import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'

const lightTheme = { /* ... */ }
const darkTheme = { /* ... */ }

function RootComponent() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  // Apply theme based on route
  // ... (see Issue 3 above)
}

export const Route = createRootRoute({
  head: () => ({
    meta: [/* ... */],
    links: [/* Google Fonts, etc. */],
  }),
  component: RootComponent,
})
```

2. **Add font configuration** (see Issue 2)

3. **Import global CSS:**
```tsx
import 'antd/dist/reset.css'
import '../index.css'
import '../App.css'
```

---

### Phase 3: Migrate Routes

#### Understanding File-Based Routing

TanStack Start uses file naming conventions:

| Route Path | File Name | Notes |
|------------|-----------|-------|
| `/` | `index.tsx` | Root index |
| `/login` | `login.tsx` | Simple route |
| `/dashboard` | `dashboard.tsx` | Parent route |
| `/dashboard` (index) | `dashboard.index.tsx` | Default child |
| `/dashboard/profile` | `dashboard.profile.tsx` | Child route |
| `/campaigns/:id` | `campaigns.$id.tsx` | Dynamic param |
| `/u/:slug` | `u.$slug.tsx` | Dynamic param |

#### Migration Steps

1. **Map your routes:**

Create a mapping table:

```
Vite Route              → TanStack File
/                       → routes/index.tsx
/login                  → routes/login.tsx
/register               → routes/register.tsx
/dashboard              → routes/dashboard.index.tsx
/dashboard/profile      → routes/dashboard.profile.tsx
/campaigns/create       → routes/campaigns.create.tsx
/campaigns/:id          → routes/campaigns.$id.tsx
/campaign/:slug         → routes/campaign.$slug.tsx
/u/:slug                → routes/u.$slug.tsx
```

2. **Create route files:**

**Example: Simple route**
```tsx
// routes/login.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import Login from '../pages/Login'
import authService from '../services/auth.service'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (authService.isAuthenticated()) {
      throw redirect({ to: '/' })
    }
  },
  component: Login,
})
```

**Example: Dynamic route**
```tsx
// routes/campaigns.$id.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import CampaignDetail from '../pages/CampaignDetail'
import authService from '../services/auth.service'

export const Route = createFileRoute('/campaigns/$id')({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: CampaignDetail,
})
```

**Example: Parent route with children**
```tsx
// routes/dashboard.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import authService from '../services/auth.service'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => <Outlet />, // Important: render children
})
```

3. **Update route guards:**

Move authentication checks from React Router's `<Route>` wrapper to `beforeLoad`:

**Before (Vite):**
```tsx
<Route element={<AuthGuard />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

**After (TanStack):**
```tsx
export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: Dashboard,
})
```

---

### Phase 4: Update Component Imports

1. **Update router imports:**

**Before:**
```tsx
import { useNavigate, useParams, Link } from 'react-router-dom'
```

**After:**
```tsx
import { useNavigate, useParams, Link } from '@tanstack/react-router'
```

2. **Update useParams usage:**

**Before:**
```tsx
const { id } = useParams<{ id: string }>()
```

**After:**
```tsx
const { id } = useParams({ from: '/campaigns/$id' })
```

3. **Update navigation calls:**

**Before:**
```tsx
navigate('/dashboard')
```

**After:**
```tsx
navigate({ to: '/dashboard' })
```

---

### Phase 5: Migrate Components

#### Component Migration Checklist

For each component:

- [ ] Copy component file from `vite-app/src/components/` to `tanstack-app/src/components/`
- [ ] Update router imports (see Phase 4)
- [ ] Check for theme-dependent styling
- [ ] Test component in isolation
- [ ] Verify all props and types

#### Special Cases

**1. Components with routing:**

Update all navigation and link components:

```tsx
// Before
import { Link, useNavigate } from 'react-router-dom'

// After
import { Link, useNavigate } from '@tanstack/react-router'

// Update navigate calls
navigate({ to: '/path', params: { id: '123' } })
```

**2. Components with theme dependencies:**

If a component needs specific theme (e.g., modal on dark page):

```tsx
import { ConfigProvider, theme } from 'antd'

const MyModal = () => (
  <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
    <Modal>{/* content */}</Modal>
  </ConfigProvider>
)
```

**3. Rich text editors:**

Ensure all Lexical dependencies are installed:

```bash
npm install lexical @lexical/react @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/utils @lexical/html
```

---

### Phase 6: Migrate Pages

1. **Copy page files:**
```bash
cp -r vite-app/src/pages/* tanstack-app/src/pages/
```

2. **Update each page:**
   - Update router imports
   - Update `useParams` calls
   - Update `useNavigate` calls
   - Check theme compatibility

3. **Test each page:**
   - Navigate to the page
   - Test all interactions
   - Verify styling
   - Check responsive design

---

## Styling & Theming

### CSS Migration

1. **Copy all CSS files:**
```bash
cp vite-app/src/index.css tanstack-app/src/
cp vite-app/src/App.css tanstack-app/src/
```

2. **Review and fix body styles:**

Remove conflicting flex styles (see Issue 4):

```css
/* ❌ Remove these */
body {
  display: flex;
  place-items: center;
}

/* ✅ Keep these */
body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}
```

3. **Verify font families:**

```css
body {
  font-family: Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: Archivo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

### Theme Configuration

1. **Define theme tokens:**

Create consistent theme objects:

```tsx
const lightTheme = {
  token: {
    // Brand colors
    colorPrimary: "#C8102E",
    colorLink: "#C8102E",
    colorLinkHover: "#A00D25",

    // Background colors
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f5f5f5",

    // Text colors
    colorText: "rgba(0, 0, 0, 0.88)",
    colorTextSecondary: "rgba(0, 0, 0, 0.65)",
    colorTextTertiary: "rgba(0, 0, 0, 0.45)",

    // Border colors
    colorBorder: "#d9d9d9",

    // Fonts
    fontFamily: "Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Button: {
      primaryShadow: "0 0 0 0 rgba(0,0,0,0)",
    },
  },
}

const darkTheme = {
  token: {
    // Brand colors (same as light)
    colorPrimary: "#C8102E",
    colorLink: "#C8102E",
    colorLinkHover: "#A00D25",

    // Background colors
    colorBgContainer: "#2a2a2a",
    colorBgLayout: "#1f1f1f",

    // Text colors
    colorText: "#ffffff",
    colorTextSecondary: "#cccccc",
    colorTextTertiary: "#999999",

    // Border colors
    colorBorder: "#3a3a3a",

    // Fonts (same as light)
    fontFamily: "Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Button: {
      primaryShadow: "0 0 0 0 rgba(0,0,0,0)",
    },
  },
}
```

2. **Apply themes conditionally:**

```tsx
function RootComponent() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  // Define which routes use which theme
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isPublicPage = pathname === '/' || pathname.startsWith('/campaign/') || pathname.startsWith('/u/')
  const isProtectedPage = pathname.startsWith('/dashboard') || pathname.startsWith('/campaigns')

  // Public and auth pages: dark theme
  if (isAuthPage || isPublicPage) {
    return (
      <ConfigProvider theme={darkTheme}>
        <Outlet />
      </ConfigProvider>
    )
  }

  // Protected pages: light theme with layout
  if (isProtectedPage) {
    return (
      <ConfigProvider theme={lightTheme}>
        <AppLayout onLogout={authService.logout}>
          <Outlet />
        </AppLayout>
      </ConfigProvider>
    )
  }

  // Fallback
  return (
    <ConfigProvider theme={lightTheme}>
      <Outlet />
    </ConfigProvider>
  )
}
```

### Component-Level Theme Overrides

For components that need different themes than their parent:

```tsx
// Modal that needs light theme on dark page
const MyModal = ({ visible, onClose }) => (
  <ConfigProvider
    theme={{
      algorithm: theme.defaultAlgorithm,
      token: {
        colorText: 'rgba(0, 0, 0, 0.88)',
        colorBgContainer: '#ffffff',
        colorBorder: '#d9d9d9',
      },
    }}
  >
    <Modal open={visible} onCancel={onClose}>
      {/* Content */}
    </Modal>
  </ConfigProvider>
)
```

---

## Component Migration

### Ensure Component Parity

**Critical Rule**: Use the **exact same components** from the old project.

#### Why This Matters

- Prevents functionality regressions
- Maintains consistent UX
- Reduces debugging time
- Preserves business logic

#### Migration Process

1. **Copy, don't rewrite:**
```bash
# Copy entire components directory
cp -r vite-app/src/components/* tanstack-app/src/components/
```

2. **Update only what's necessary:**
   - Router imports
   - Navigation calls
   - Theme-related code

3. **Don't change:**
   - Component logic
   - State management
   - Event handlers
   - Styling (unless theme-related)

#### Example: Migrating a Complex Component

**Before (Vite):**
```tsx
// vite-app/src/components/CampaignCard.tsx
import { useNavigate } from 'react-router-dom'
import { Card, Button } from 'antd'

const CampaignCard = ({ campaign }) => {
  const navigate = useNavigate()

  return (
    <Card>
      <h3>{campaign.title}</h3>
      <Button onClick={() => navigate(`/campaigns/${campaign._id}`)}>
        View Details
      </Button>
    </Card>
  )
}
```

**After (TanStack):**
```tsx
// tanstack-app/src/components/CampaignCard.tsx
import { useNavigate } from '@tanstack/react-router' // ← Only change
import { Card, Button } from 'antd'

const CampaignCard = ({ campaign }) => {
  const navigate = useNavigate()

  return (
    <Card>
      <h3>{campaign.title}</h3>
      <Button onClick={() => navigate({ to: `/campaigns/${campaign._id}` })}> {/* ← Only change */}
        View Details
      </Button>
    </Card>
  )
}
```

**Changes made:**
1. Import from `@tanstack/react-router`
2. Update navigate call to use object syntax

**Everything else stays the same!**

---

## Routing Migration

### Route Parameter Patterns

| Pattern | Vite File | TanStack File | Access Params |
|---------|-----------|---------------|---------------|
| Static | `/login` | `login.tsx` | N/A |
| Dynamic | `/campaigns/:id` | `campaigns.$id.tsx` | `useParams({ from: '/campaigns/$id' })` |
| Multi-param | `/posts/:category/:id` | `posts.$category.$id.tsx` | `useParams({ from: '/posts/$category/$id' })` |
| Optional | `/search/:query?` | `search.$query.tsx` | Check if param exists |
| Wildcard | `/docs/*` | `docs.$.tsx` | `useParams({ from: '/docs/$' })` |

### Navigation Patterns

**1. Simple navigation:**
```tsx
// Before
navigate('/dashboard')

// After
navigate({ to: '/dashboard' })
```

**2. With parameters:**
```tsx
// Before
navigate(`/campaigns/${id}`)

// After
navigate({ to: '/campaigns/$id', params: { id } })
```

**3. With query params:**
```tsx
// Before
navigate('/search?q=test')

// After
navigate({ to: '/search', search: { q: 'test' } })
```

**4. With state:**
```tsx
// Before
navigate('/dashboard', { state: { from: 'login' } })

// After
// Use search params or context instead
navigate({ to: '/dashboard', search: { from: 'login' } })
```

### Link Components

**Before:**
```tsx
<Link to="/dashboard">Dashboard</Link>
<Link to={`/campaigns/${id}`}>View Campaign</Link>
```

**After:**
```tsx
<Link to="/dashboard">Dashboard</Link>
<Link to="/campaigns/$id" params={{ id }}>View Campaign</Link>
```

---

## Testing & Validation

### Pre-Migration Checklist

- [ ] Document all routes in current app
- [ ] List all third-party dependencies
- [ ] Identify theme-dependent components
- [ ] Note any custom routing logic
- [ ] Screenshot all pages for visual comparison

### During Migration Checklist

For each route:
- [ ] Route file created with correct naming
- [ ] Component renders correctly
- [ ] Navigation works (to and from)
- [ ] Route parameters work
- [ ] Authentication/guards work
- [ ] Theme is correct
- [ ] Fonts load properly
- [ ] All interactive elements work
- [ ] Forms submit correctly
- [ ] API calls work
- [ ] Error handling works

### Post-Migration Validation

#### 1. Visual Testing

Compare screenshots:
```bash
# Take screenshots of all pages in both apps
# Compare side-by-side
```

Check:
- [ ] Colors match
- [ ] Fonts match
- [ ] Spacing/layout matches
- [ ] Responsive design works
- [ ] Dark/light themes work

#### 2. Functional Testing

Test all user flows:
- [ ] User registration
- [ ] User login
- [ ] Create new item
- [ ] Edit item
- [ ] Delete item
- [ ] View details
- [ ] Search/filter
- [ ] Pagination
- [ ] File uploads
- [ ] Payment processing

#### 3. Performance Testing

Compare:
- [ ] Initial load time
- [ ] Route transition speed
- [ ] Bundle size
- [ ] Lighthouse scores

#### 4. Browser Testing

Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

---

## Complete Migration Checklist

### Setup Phase
- [ ] Create new TanStack Start project
- [ ] Install all dependencies from old project
- [ ] Copy static assets
- [ ] Copy global CSS files
- [ ] Set up root route with theme configuration
- [ ] Add Google Fonts to head configuration

### Routing Phase
- [ ] Map all routes (old → new)
- [ ] Create all route files
- [ ] Implement route guards
- [ ] Test navigation between routes
- [ ] Verify dynamic routes work
- [ ] Test nested routes

### Component Phase
- [ ] Copy all components
- [ ] Update router imports
- [ ] Update navigation calls
- [ ] Update useParams calls
- [ ] Test each component
- [ ] Fix theme issues

### Page Phase
- [ ] Copy all pages
- [ ] Update router imports
- [ ] Test each page
- [ ] Verify forms work
- [ ] Test API integration

### Styling Phase
- [ ] Verify fonts load
- [ ] Check theme application
- [ ] Fix text color issues
- [ ] Test responsive design
- [ ] Verify dark/light themes

### Testing Phase
- [ ] Visual comparison
- [ ] Functional testing
- [ ] Performance testing
- [ ] Browser testing
- [ ] Mobile testing

### Deployment Phase
- [ ] Update build scripts
- [ ] Test production build
- [ ] Deploy to staging
- [ ] Final QA
- [ ] Deploy to production

---

## Common Pitfalls to Avoid

### 1. Don't Rewrite Components

❌ **Bad:**
```tsx
// Rewriting component from scratch
const NewCampaignCard = () => {
  // Completely new implementation
}
```

✅ **Good:**
```tsx
// Copy existing component, update only imports
import { useNavigate } from '@tanstack/react-router' // Only change
// Rest of component stays the same
```

### 2. Don't Skip Dependency Installation

❌ **Bad:**
```tsx
// Assuming dependencies are included
import { LexicalComposer } from '@lexical/react/LexicalComposer'
// Error: Module not found
```

✅ **Good:**
```bash
# Install all dependencies first
npm install lexical @lexical/react @lexical/rich-text
```

### 3. Don't Ignore Theme Context

❌ **Bad:**
```tsx
// Modal inherits dark theme, text is invisible
<Modal>
  <Form.Item label="Name"> {/* White text on white background */}
    <Input />
  </Form.Item>
</Modal>
```

✅ **Good:**
```tsx
// Wrap modal with light theme
<ConfigProvider theme={{ token: { colorText: 'rgba(0,0,0,0.88)' } }}>
  <Modal>
    <Form.Item label="Name">
      <Input />
    </Form.Item>
  </Modal>
</ConfigProvider>
```

### 4. Don't Forget Parent Routes Need Outlets

❌ **Bad:**
```tsx
// routes/dashboard.tsx
export const Route = createFileRoute('/dashboard')({
  component: MyCampaigns, // Child routes won't render!
})
```

✅ **Good:**
```tsx
// routes/dashboard.tsx
export const Route = createFileRoute('/dashboard')({
  component: () => <Outlet />, // Renders children
})

// routes/dashboard.index.tsx
export const Route = createFileRoute('/dashboard/')({
  component: MyCampaigns, // Renders at /dashboard
})
```

### 5. Don't Mix Router Versions

❌ **Bad:**
```tsx
import { useNavigate } from 'react-router-dom'
import { Link } from '@tanstack/react-router'
// Mixing routers causes issues
```

✅ **Good:**
```tsx
import { useNavigate, Link } from '@tanstack/react-router'
// Use one router consistently
```

---

## Troubleshooting

### Issue: "Module not found"

**Solution:**
1. Check if package is installed: `npm list <package-name>`
2. Install if missing: `npm install <package-name>`
3. Clear cache: `rm -rf node_modules package-lock.json && npm install`

### Issue: Fonts not loading

**Solution:**
1. Check `__root.tsx` has font links in `head` configuration
2. Verify CSS uses correct font-family names
3. Check browser Network tab for font loading errors

### Issue: Theme not applying

**Solution:**
1. Verify ConfigProvider wraps components
2. Check theme object structure
3. Use browser DevTools to inspect computed styles
4. Add component-level ConfigProvider if needed

### Issue: Routes not matching

**Solution:**
1. Check file naming convention
2. Verify route path in `createFileRoute()`
3. Check for typos in route params
4. Review generated `routeTree.gen.ts`

### Issue: Child routes not rendering

**Solution:**
1. Ensure parent route renders `<Outlet />`
2. Create `parent.index.tsx` for parent's content
3. Check route hierarchy in DevTools

---

## Summary

### Key Takeaways

1. **Copy, don't rewrite**: Use exact same components from old project
2. **Install all dependencies**: Compare package.json files carefully
3. **Configure themes properly**: Set up light/dark themes in root route
4. **Use file-based routing**: Follow TanStack naming conventions
5. **Test thoroughly**: Validate each route and component
6. **Fix styling issues**: Check fonts, colors, and centering
7. **Handle theme context**: Override themes for modals/components as needed

### Migration Time Estimate

For a medium-sized app (20-30 routes, 50+ components):
- Setup: 1-2 hours
- Route migration: 4-6 hours
- Component migration: 6-8 hours
- Styling fixes: 2-4 hours
- Testing: 4-6 hours
- **Total: 17-26 hours**

### Benefits After Migration

- ✅ Better performance with SSR
- ✅ Type-safe routing
- ✅ Automatic code splitting
- ✅ Better developer experience
- ✅ Modern architecture
- ✅ Easier maintenance

---

## Additional Resources

- [TanStack Router Documentation](https://tanstack.com/router)
- [TanStack Start Documentation](https://tanstack.com/start)
- [Ant Design Documentation](https://ant.design/)
- [Migration Examples Repository](https://github.com/TanStack/router/tree/main/examples)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-08
**Based on**: GotYaBack Vite → TanStack Start Migration

