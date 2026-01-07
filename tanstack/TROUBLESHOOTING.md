# Troubleshooting Guide

Common issues and solutions when migrating to TanStack Start.

---

## Installation Issues

### Issue: `npm create @tanstack/start` fails

**Error:**
```
npm ERR! code ENOENT
npm ERR! syscall lstat
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try with npx
npx create-tanstack-start@latest

# Or use specific version
npm create @tanstack/start@latest
```

---

### Issue: Dependency conflicts

**Error:**
```
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**
```bash
# Use --legacy-peer-deps
npm install --legacy-peer-deps

# Or use --force (not recommended)
npm install --force

# Better: Check package.json for conflicting versions
```

---

## Development Server Issues

### Issue: Port 3000 already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm run dev
```

---

### Issue: Dev server won't start

**Error:**
```
Cannot find module '@tanstack/start'
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check if all dependencies are installed
npm list @tanstack/start
```

---

## Routing Issues

### Issue: 404 on valid routes

**Problem:** Routes not being recognized

**Solution:**
1. Check file naming:
   - Dynamic routes: `$id.tsx` not `:id.tsx`
   - Layout routes: `_authenticated.tsx` starts with `_`
   
2. Check route generation:
   ```bash
   # Routes should auto-generate
   # Check if routeTree.gen.ts exists
   ls app/routeTree.gen.ts
   ```

3. Restart dev server:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

### Issue: Route parameters not working

**Error:**
```
Property 'id' does not exist on type '{}'
```

**Solution:**
```tsx
// ❌ Wrong
const { id } = useParams()

// ✅ Correct
const { id } = useParams({ from: '/campaigns/$id' })
```

---

### Issue: Nested routes not rendering

**Problem:** Child routes show 404

**Solution:**
```tsx
// Parent route MUST have <Outlet />
import { Outlet } from '@tanstack/react-router'

function ParentLayout() {
  return (
    <div>
      <h1>Parent</h1>
      <Outlet /> {/* Child routes render here */}
    </div>
  )
}
```

---

## SSR/Hydration Issues

### Issue: Hydration mismatch

**Error:**
```
Warning: Text content did not match. Server: "..." Client: "..."
```

**Solution:**
```tsx
// Use ClientOnly for client-specific content
import { ClientOnly } from '@tanstack/start'

<ClientOnly>
  {() => <ComponentThatUsesWindow />}
</ClientOnly>
```

---

### Issue: `localStorage is not defined`

**Error:**
```
ReferenceError: localStorage is not defined
```

**Solution:**
```tsx
// Check if running on client
if (typeof window !== 'undefined') {
  localStorage.setItem('key', 'value')
}

// Or use a helper
export function getLocalStorage(key: string) {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(key)
}
```

---

### Issue: `window is not defined`

**Error:**
```
ReferenceError: window is not defined
```

**Solution:**
```tsx
// Use useEffect for window access
import { useEffect, useState } from 'react'

function MyComponent() {
  const [windowWidth, setWindowWidth] = useState(0)
  
  useEffect(() => {
    setWindowWidth(window.innerWidth)
  }, [])
  
  return <div>Width: {windowWidth}</div>
}
```

---

## Authentication Issues

### Issue: Auth redirect loop

**Problem:** Keeps redirecting between `/login` and `/`

**Solution:**
```tsx
// Check auth logic carefully
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    // Make sure this doesn't always return false
    if (!authService.isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
})

// And in login route
export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    // Redirect if ALREADY authenticated
    if (authService.isAuthenticated()) {
      throw redirect({ to: '/' })
    }
  },
})
```

---

### Issue: Session not persisting

**Problem:** User logged out on refresh

**Solution:**
```tsx
// Make sure SESSION_SECRET is set
// File: .env
SESSION_SECRET=your-secret-key-minimum-32-characters-long

// Check session is being saved
export async function login(token: string) {
  const session = await getSession()
  session.data.token = token
  await session.save() // Don't forget this!
}
```

---

## API Integration Issues

### Issue: CORS errors

**Error:**
```
Access to fetch at 'http://localhost:5000/api' has been blocked by CORS policy
```

**Solution:**
```tsx
// Backend: Update CORS settings
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}))
```

---

### Issue: API calls failing in production

**Problem:** Works in dev, fails in production

**Solution:**
```tsx
// Check environment variables
console.log('API URL:', process.env.VITE_API_URL)

// Make sure VITE_ prefix is used for client-side vars
// File: .env
VITE_API_URL=https://your-production-api.com/api
```

---

### Issue: Server functions not working

**Error:**
```
createServerFn is not a function
```

**Solution:**
```bash
# Make sure @tanstack/start is installed
npm install @tanstack/start

# Check import
import { createServerFn } from '@tanstack/start'
```

---

## TypeScript Issues

### Issue: Type errors in routes

**Error:**
```
Type 'string | undefined' is not assignable to type 'string'
```

**Solution:**
```tsx
// Use proper typing with params
const { id } = useParams({ from: '/campaigns/$id' })
// id is now typed as string, not string | undefined
```

---

### Issue: Module not found

**Error:**
```
Cannot find module '~/components/MyComponent'
```

**Solution:**
```json
// File: tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["./app/*"]
    }
  }
}
```

---

## Build Issues

### Issue: Build fails with type errors

**Error:**
```
error TS2307: Cannot find module
```

**Solution:**
```bash
# Check TypeScript config
npm run typecheck

# Fix errors before building
npm run build
```

---

### Issue: Build succeeds but app crashes

**Problem:** Production build doesn't work

**Solution:**
```bash
# Check build output
npm run build

# Test production build locally
npm start

# Check browser console for errors
```

---

## Ant Design Issues

### Issue: Styles not loading

**Problem:** Components have no styling

**Solution:**
```tsx
// Import Ant Design CSS in __root.tsx
import 'antd/dist/reset.css'
```

---

### Issue: Form validation not working

**Problem:** Form submits without validation

**Solution:**
```tsx
// Make sure rules are set
<Form.Item
  name="email"
  rules={[
    { required: true, message: 'Email is required' },
    { type: 'email', message: 'Invalid email' }
  ]}
>
  <Input />
</Form.Item>
```

---

## Performance Issues

### Issue: Slow initial load

**Solution:**
```tsx
// Use code splitting
import { lazy } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Use in component
<Suspense fallback={<Spin />}>
  <HeavyComponent />
</Suspense>
```

---

### Issue: Large bundle size

**Solution:**
```bash
# Analyze bundle
npm run build -- --analyze

# Check for large dependencies
# Consider lazy loading or alternatives
```

---

## Common Mistakes

### 1. Forgetting `from` in useParams
```tsx
// ❌ Wrong
const { id } = useParams()

// ✅ Correct
const { id } = useParams({ from: '/campaigns/$id' })
```

### 2. Using string in navigate
```tsx
// ❌ Wrong
navigate('/dashboard')

// ✅ Correct
navigate({ to: '/dashboard' })
```

### 3. Missing Outlet in layout
```tsx
// ❌ Wrong
function Layout() {
  return <div>Layout</div>
}

// ✅ Correct
function Layout() {
  return (
    <div>
      Layout
      <Outlet />
    </div>
  )
}
```

### 4. Wrong file naming for dynamic routes
```tsx
// ❌ Wrong
routes/:id.tsx
routes/[id].tsx

// ✅ Correct
routes/$id.tsx
```

---

## Getting Help

If you're still stuck:

1. **Check the docs**: https://tanstack.com/start
2. **Search GitHub issues**: https://github.com/TanStack/router/issues
3. **Ask on Discord**: https://discord.com/invite/tanstack
4. **Check this guide**: Review relevant sections in MIGRATION_GUIDE.md

---

## Debug Checklist

When something doesn't work:

- [ ] Check browser console for errors
- [ ] Check terminal for build errors
- [ ] Verify environment variables are set
- [ ] Restart dev server
- [ ] Clear browser cache
- [ ] Check file naming (especially routes)
- [ ] Verify imports are correct
- [ ] Check TypeScript errors (`npm run typecheck`)
- [ ] Test in incognito mode (rules out extensions)
- [ ] Check backend is running
- [ ] Verify API URL is correct

---

**Still having issues?** Document the error and ask for help with:
1. Error message (full stack trace)
2. What you were trying to do
3. What you've already tried
4. Relevant code snippets

