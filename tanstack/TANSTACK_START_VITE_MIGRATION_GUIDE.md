# TanStack Start + Vite Migration Guide

**Complete Guide for Migrating React Apps to TanStack Start with Vite**

This guide documents the verified migration process from a standard React + Vite app to a full TanStack Start + Vite application with SSR capabilities.

---

## Table of Contents

1. [What is TanStack Start + Vite?](#what-is-tanstack-start--vite)
2. [Migration Checklist](#migration-checklist)
3. [Required Features for 100% TanStack Start](#required-features-for-100-tanstack-start)
4. [Step-by-Step Migration](#step-by-step-migration)
5. [Verification Steps](#verification-steps)
6. [Common Pitfalls](#common-pitfalls)

---

## What is TanStack Start + Vite?

TanStack Start is a full-stack React framework that adds SSR (Server-Side Rendering) capabilities to TanStack Router. When combined with Vite, it provides:

- ✅ **File-based routing** with type-safe navigation
- ✅ **Server-Side Rendering (SSR)** for better SEO and performance
- ✅ **Streaming SSR** for progressive page loading
- ✅ **Type-safe data loading** with suspense
- ✅ **Server functions** for API calls
- ✅ **Vite's fast HMR** (Hot Module Replacement)

### TanStack Router vs TanStack Start

| Feature | TanStack Router Only | TanStack Start + Vite |
|---------|---------------------|----------------------|
| File-based routing | ✅ | ✅ |
| `createFileRoute()` | ✅ | ✅ |
| Client-side navigation | ✅ | ✅ |
| SSR Support | ❌ | ✅ |
| `<Scripts />` component | ❌ | ✅ |
| `<HeadContent />` component | ❌ | ✅ |
| `RootDocument` HTML shell | ❌ | ✅ |
| `tanstackStart()` Vite plugin | ❌ | ✅ |
| No `index.html` needed | ❌ | ✅ |

---

## Migration Checklist

### Phase 1: Setup
- [ ] Install TanStack Start packages
- [ ] Configure Vite with TanStack Start plugin
- [ ] Update TypeScript configuration
- [ ] Update package.json scripts

### Phase 2: Structure
- [ ] Create `src/routes/` directory
- [ ] Create `__root.tsx` with RootDocument
- [ ] Remove `index.html` (if migrating from standard Vite)
- [ ] Remove `main.tsx` entry point (if exists)

### Phase 3: Routing
- [ ] Convert pages to file-based routes
- [ ] Implement route components with `createFileRoute()`
- [ ] Set up route tree generation

### Phase 4: Verification
- [ ] Verify all required features are present
- [ ] Test SSR functionality
- [ ] Check dev server runs correctly
- [ ] Verify build output

---

## Required Features for 100% TanStack Start

Your app **MUST** have these features to be considered a proper TanStack Start + Vite application:

### 1. ✅ TanStack Start Vite Plugin

**File: `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart(),  // ✅ REQUIRED: This enables TanStack Start
    viteReact(),      // Must come AFTER tanstackStart()
  ],
})
```

**Key Points:**
- Import from `@tanstack/react-start/plugin/vite`
- Plugin order matters: `tanstackStart()` before `viteReact()`
- Can configure with `srcDirectory` option if needed

---

### 2. ✅ Correct Dependencies

**File: `package.json`**

```json
{
  "dependencies": {
    "@tanstack/react-router": "^1.145.x",
    "@tanstack/react-start": "^1.145.x",     // ✅ REQUIRED
    "@tanstack/react-router-devtools": "^1.145.x",
    "react": "^19.x",
    "react-dom": "^19.x"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.x",
    "vite": "^7.x",
    "typescript": "^5.x"
  }
}
```

**Key Points:**
- `@tanstack/react-start` is REQUIRED (not just `@tanstack/react-router`)
- Do NOT install `@tanstack/start` package (that's for Vinxi-based setup)
- Do NOT install `vinxi` as a dependency (it may be a peer dependency, that's OK)

---

### 3. ✅ RootDocument with SSR Components

**File: `src/routes/__root.tsx`**

```typescript
import {
  createRootRoute,
  Outlet,
  HeadContent,  // ✅ REQUIRED for SSR
  Scripts       // ✅ REQUIRED for SSR
} from '@tanstack/react-router'
import type { ReactNode } from 'react'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Your App Title' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

// ✅ REQUIRED: RootDocument defines the HTML shell
function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />  {/* ✅ REQUIRED: Injects meta tags, title, etc. */}
      </head>
      <body>
        {children}
        <Scripts />  {/* ✅ REQUIRED: Injects client-side scripts */}
      </body>
    </html>
  )
}
```

**Key Points:**
- `<HeadContent />` - Renders meta tags, title, links defined in route's `head()` function
- `<Scripts />` - Injects client-side JavaScript bundles
- `RootDocument` returns full HTML structure (including `<html>`, `<head>`, `<body>`)
- This replaces the traditional `index.html` file

---

### 4. ✅ File-Based Routing Structure

**Directory: `src/routes/`**

```
src/routes/
├── __root.tsx              # Root layout (REQUIRED)
├── index.tsx               # Home page (/)
├── about.tsx               # About page (/about)
├── dashboard.tsx           # Dashboard layout (/dashboard)
├── dashboard.index.tsx     # Dashboard home (/dashboard)
├── dashboard.profile.tsx   # Profile page (/dashboard/profile)
├── posts.$id.tsx           # Dynamic route (/posts/:id)
└── _authenticated/         # Layout route (no URL segment)
    └── settings.tsx        # (/settings with _authenticated layout)
```

**Example Route File: `src/routes/index.tsx`**

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return <div>Home Page</div>
}
```

**Key Points:**
- All routes must be in `src/routes/` directory
- Use `createFileRoute()` for each route
- `__root.tsx` is required and must use `createRootRoute()`
- Dynamic segments use `$` prefix (e.g., `$id.tsx`)
- Layout routes use `_` prefix (e.g., `_authenticated.tsx`)

---

### 5. ✅ No index.html File

**IMPORTANT:** TanStack Start + Vite does NOT use an `index.html` file!

**Before (Standard Vite):**
```
project/
├── index.html          # ❌ Remove this
├── src/
│   └── main.tsx        # ❌ Remove this
```

**After (TanStack Start + Vite):**
```
project/
├── src/
│   └── routes/
│       └── __root.tsx  # ✅ This replaces index.html
```

**Why?**
- The `tanstackStart()` plugin generates HTML at runtime
- The `RootDocument` in `__root.tsx` defines the HTML structure
- This enables Server-Side Rendering (SSR)

---

### 6. ✅ Correct Package Scripts

**File: `package.json`**

```json
{
  "scripts": {
    "dev": "vite dev",           // ✅ Starts dev server with SSR
    "build": "vite build",       // ✅ Builds for production
    "start": "vite preview",     // ✅ Preview production build
    "typecheck": "tsc --noEmit"  // Type checking
  }
}
```

**Key Points:**
- Use `vite` commands (NOT `vinxi`)
- `vite dev` runs the development server with SSR
- `vite build` creates production build with SSR support

---

### 7. ✅ TypeScript Configuration

**File: `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]  // Optional: Path aliases
    }
  },
  "include": ["src"]
}
```

**Key Points:**
- `moduleResolution: "bundler"` is recommended for Vite
- `include: ["src"]` to include your source directory
- Path aliases are optional but recommended

---

## Step-by-Step Migration

### Step 1: Install Dependencies

```bash
# Install TanStack Start packages
npm install @tanstack/react-router @tanstack/react-start @tanstack/react-router-devtools

# Install Vite and React plugin
npm install -D vite @vitejs/plugin-react typescript

# Install React 19 (recommended)
npm install react@19 react-dom@19
```

### Step 2: Configure Vite

Create or update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart(),
    viteReact(),
  ],
})
```

### Step 3: Update Package Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "start": "vite preview"
  }
}
```

### Step 4: Create Routes Directory

```bash
mkdir -p src/routes
```

### Step 5: Create Root Route

Create `src/routes/__root.tsx`:

```typescript
import { createRootRoute, Outlet, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { ReactNode } from 'react'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
```

### Step 6: Create Your First Route

Create `src/routes/index.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div>
      <h1>Welcome to TanStack Start + Vite!</h1>
      <p>Your app is now SSR-ready! 🚀</p>
    </div>
  )
}
```

### Step 7: Remove Old Files

If migrating from standard Vite:

```bash
# Remove these files
rm index.html
rm src/main.tsx
rm src/App.tsx  # If you have this
```

### Step 8: Test the Migration

```bash
# Start dev server
npm run dev

# Should see output like:
# VITE v7.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

Visit `http://localhost:5173/` - your app should load!

---

## Verification Steps

Use this checklist to verify your migration is 100% complete:

### ✅ 1. Check Dependencies

```bash
npm list @tanstack/react-start
```

Should show `@tanstack/react-start@1.145.x` or higher.

### ✅ 2. Check Vite Config

Open `vite.config.ts` and verify:
- [ ] Imports `tanstackStart` from `@tanstack/react-start/plugin/vite`
- [ ] Has `tanstackStart()` in plugins array
- [ ] `tanstackStart()` comes BEFORE `viteReact()`

### ✅ 3. Check Root Route

Open `src/routes/__root.tsx` and verify:
- [ ] Imports `HeadContent` and `Scripts` from `@tanstack/react-router`
- [ ] Has `RootDocument` component
- [ ] `RootDocument` returns `<html>`, `<head>`, `<body>` structure
- [ ] Uses `<HeadContent />` in `<head>`
- [ ] Uses `<Scripts />` in `<body>`

### ✅ 4. Check File Structure

Verify your project structure:
- [ ] Has `src/routes/` directory
- [ ] Has `src/routes/__root.tsx` file
- [ ] Does NOT have `index.html` in root
- [ ] Does NOT have `src/main.tsx` entry point

### ✅ 5. Check Package Scripts

Open `package.json` and verify:
- [ ] `"dev": "vite dev"` (NOT `vinxi dev`)
- [ ] `"build": "vite build"` (NOT `vinxi build`)

### ✅ 6. Test SSR

Run the dev server and check browser DevTools:

```bash
npm run dev
```

1. Open browser DevTools → Network tab
2. Refresh the page
3. Click on the first document request
4. Check the Response tab
5. You should see **full HTML content** (not just `<div id="root"></div>`)

**Example of SSR working:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>My App</title>
  </head>
  <body>
    <div>Welcome to TanStack Start + Vite!</div>
    <script type="module" src="..."></script>
  </body>
</html>
```

### ✅ 7. Test Build

```bash
npm run build
```

Should complete without errors and create a `.output/` or `dist/` directory.

---

## Common Pitfalls

### ❌ Pitfall 1: Using Wrong Package

**Wrong:**
```json
{
  "dependencies": {
    "@tanstack/start": "^1.x"  // ❌ This is for Vinxi-based setup
  }
}
```

**Correct:**
```json
{
  "dependencies": {
    "@tanstack/react-start": "^1.x"  // ✅ This is for Vite-based setup
  }
}
```

### ❌ Pitfall 2: Wrong Plugin Import

**Wrong:**
```typescript
import { tanstackStart } from '@tanstack/start/plugin'  // ❌
```

**Correct:**
```typescript
import { tanstackStart } from '@tanstack/react-start/plugin/vite'  // ✅
```

### ❌ Pitfall 3: Missing RootDocument

**Wrong:**
```typescript
export const Route = createRootRoute({
  component: () => <Outlet />  // ❌ No RootDocument
})
```

**Correct:**
```typescript
export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }) {
  return (
    <html>
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
```

### ❌ Pitfall 4: Keeping index.html

**Wrong:**
```
project/
├── index.html          // ❌ Remove this!
├── src/routes/
│   └── __root.tsx
```

**Correct:**
```
project/
├── src/routes/
│   └── __root.tsx      // ✅ This replaces index.html
```

### ❌ Pitfall 5: Wrong Plugin Order

**Wrong:**
```typescript
export default defineConfig({
  plugins: [
    viteReact(),      // ❌ React plugin first
    tanstackStart(),  // ❌ Start plugin second
  ],
})
```

**Correct:**
```typescript
export default defineConfig({
  plugins: [
    tanstackStart(),  // ✅ Start plugin first
    viteReact(),      // ✅ React plugin second
  ],
})
```

### ❌ Pitfall 6: Using Vinxi Commands

**Wrong:**
```json
{
  "scripts": {
    "dev": "vinxi dev",    // ❌
    "build": "vinxi build" // ❌
  }
}
```

**Correct:**
```json
{
  "scripts": {
    "dev": "vite dev",    // ✅
    "build": "vite build" // ✅
  }
}
```

---

## Summary: The 7 Required Features

Your app is **100% TanStack Start + Vite** if it has ALL of these:

1. ✅ `@tanstack/react-start` package installed
2. ✅ `tanstackStart()` plugin in `vite.config.ts`
3. ✅ `RootDocument` component with `<html>`, `<head>`, `<body>`
4. ✅ `<HeadContent />` component in `<head>`
5. ✅ `<Scripts />` component in `<body>`
6. ✅ File-based routing in `src/routes/`
7. ✅ No `index.html` file

**If any of these are missing, you have TanStack Router (not TanStack Start).**

---

## Additional Resources

- [TanStack Start Documentation](https://tanstack.com/start)
- [TanStack Router Documentation](https://tanstack.com/router)
- [Vite Documentation](https://vitejs.dev)

---

## Migration Success Criteria

Your migration is complete when:

- ✅ Dev server runs with `npm run dev`
- ✅ Build completes with `npm run build`
- ✅ Browser shows full HTML in initial response (SSR working)
- ✅ All 7 required features are present
- ✅ No `index.html` file exists
- ✅ Routes work correctly

---

**Last Updated:** 2026-01-08
**Verified Working:** bm-gotyaback project (GotYaBack crowdfunding platform)

---

## Quick Reference

### Minimal Working Example

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tanstackStart(), viteReact()],
})
```

**src/routes/__root.tsx:**
```typescript
import { createRootRoute, Outlet, HeadContent, Scripts } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export const Route = createRootRoute({
  component: () => (
    <html>
      <head><HeadContent /></head>
      <body><Outlet /><Scripts /></body>
    </html>
  ),
})
```

**src/routes/index.tsx:**
```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => <div>Hello TanStack Start!</div>,
})
```

**package.json:**
```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build"
  },
  "dependencies": {
    "@tanstack/react-router": "^1.145.11",
    "@tanstack/react-start": "^1.145.11",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.1",
    "vite": "^7.2.4"
  }
}
```

That's it! Run `npm install && npm run dev` and you have a working TanStack Start + Vite app! 🚀



