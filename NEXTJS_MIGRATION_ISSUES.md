# Next.js Migration: Potential Issues & Solutions

## Critical Issues to Address

### 1. Ant Design SSR Configuration

**Issue:** Ant Design components may have hydration mismatches with SSR.

**Solution:**
```typescript
// app/layout.tsx
import { AntdRegistry } from '@ant-design/nextjs-registry';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
```

**Install:**
```bash
npm install @ant-design/nextjs-registry
```

---

### 2. Client-Side Only Components

**Issue:** Components using `window`, `localStorage`, `document` will break SSR.

**Current Code:**
```typescript
// frontend/src/services/auth.service.ts
const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
};
```

**Solution:**
```typescript
// lib/services/auth.service.ts
'use client';

const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
};
```

**Or use cookies for SSR:**
```typescript
// Server Component
import { cookies } from 'next/headers';

export async function getServerUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    // Verify token and return user
}
```

---

### 3. Rich Text Editors (Lexical/Quill)

**Issue:** Lexical and Quill are client-side only libraries.

**Solution:**
```typescript
// components/RichTextEditor.tsx
'use client';

import dynamic from 'next/dynamic';

const QuillEditor = dynamic(() => import('./QuillEditor'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>
});

export default function RichTextEditor() {
  return <QuillEditor />;
}
```

---

### 4. React Router → Next.js Router

**Issue:** Different routing APIs.

**Current Code:**
```typescript
import { useNavigate, Link } from 'react-router-dom';

const navigate = useNavigate();
navigate('/dashboard');

<Link to="/login">Login</Link>
```

**Next.js Code:**
```typescript
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const router = useRouter();
router.push('/dashboard');

<Link href="/login">Login</Link>
```

**Migration Map:**
- `useNavigate()` → `useRouter()` from `'next/navigation'`
- `navigate(path)` → `router.push(path)`
- `<Link to={}>` → `<Link href={}>`
- `useParams()` → `useParams()` (same, but from `'next/navigation'`)
- `useLocation()` → `usePathname()` and `useSearchParams()`

---

### 5. API Client Configuration

**Issue:** Different base URLs for server-side vs client-side fetching.

**Current Code:**
```typescript
// frontend/src/services/apiClient.ts
const apiClient = axios.create({
  baseURL: "http://localhost:5000/api",
});
```

**Next.js Solution:**
```typescript
// lib/api-client.ts
const getBaseURL = () => {
  // Server-side: use internal URL
  if (typeof window === 'undefined') {
    return process.env.API_URL || 'http://localhost:5000/api';
  }
  // Client-side: use public URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
});
```

**Environment Variables:**
```env
# .env.local
API_URL=http://backend:5000/api  # Server-side (Docker internal)
NEXT_PUBLIC_API_URL=http://localhost:5000/api  # Client-side
```

---

### 6. Authentication Guards

**Issue:** Need to implement route protection differently.

**Current Code:**
```typescript
// frontend/src/components/AuthGuard.tsx
export const AuthGuard: React.FC = () => {
    const user = authService.getCurrentUser();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
};
```

**Next.js Solution (Middleware):**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/campaigns')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Guest-only routes
  if (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/register')) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/campaigns/:path*', '/login', '/register'],
};
```

---

### 7. Environment Variables

**Issue:** Next.js has specific naming conventions.

**Migration:**
```env
# Current (.env)
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Next.js (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

**Code Update:**
```typescript
// Current
const apiUrl = import.meta.env.VITE_API_URL;

// Next.js
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

---

### 8. Image Optimization

**Issue:** Need to use Next.js Image component for optimization.

**Current Code:**
```typescript
<img src={campaign.imageUrl} alt={campaign.title} />
```

**Next.js Code:**
```typescript
import Image from 'next/image';

<Image 
  src={campaign.imageUrl} 
  alt={campaign.title}
  width={500}
  height={300}
  priority={false}
/>
```

**Configure external images:**
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-s3-bucket.s3.amazonaws.com'],
  },
};
```

---

### 9. Stripe Integration

**Issue:** Stripe Elements need client-side rendering.

**Solution:**
```typescript
// components/StripeCheckout.tsx
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function StripeCheckout() {
  return (
    <Elements stripe={stripePromise}>
      {/* Your checkout form */}
    </Elements>
  );
}
```

---

### 10. Font Loading

**Issue:** Google Fonts need to be loaded differently.

**Current Code:**
```html
<!-- frontend/index.html -->
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
```

**Next.js Code:**
```typescript
// app/layout.tsx
import { Archivo, Montserrat } from 'next/font/google';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${archivo.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

## Testing Checklist

### Functionality Testing
- [ ] User registration works
- [ ] User login works
- [ ] Protected routes redirect to login
- [ ] Guest routes redirect to dashboard when logged in
- [ ] Campaign creation works
- [ ] Campaign editing works
- [ ] File uploads work
- [ ] Stripe payments work
- [ ] Logo approval flow works
- [ ] Public campaign pages load
- [ ] Organizer landing pages load

### SSR/SEO Testing
- [ ] Public pages render on server
- [ ] Meta tags present in HTML source
- [ ] Open Graph tags work
- [ ] Twitter cards work
- [ ] Google can crawl public pages

### Performance Testing
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Lighthouse score > 90
- [ ] Bundle size reasonable
- [ ] Images optimized

### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

---

## Common Errors & Fixes

### Error: "Hydration failed"
**Cause:** Server HTML doesn't match client HTML
**Fix:** Ensure no client-only code runs during SSR, use `'use client'` directive

### Error: "localStorage is not defined"
**Cause:** Accessing localStorage during SSR
**Fix:** Check `typeof window !== 'undefined'` before using

### Error: "Cannot read property 'get' of undefined"
**Cause:** Using cookies() in client component
**Fix:** Use cookies() only in Server Components or Server Actions

### Error: "Module not found: Can't resolve 'fs'"
**Cause:** Importing Node.js modules in client components
**Fix:** Move server-only code to API routes or Server Components

---

## Performance Optimization Tips

1. **Use Server Components by default** - Only add `'use client'` when needed
2. **Implement loading states** - Use `loading.tsx` files
3. **Add error boundaries** - Use `error.tsx` files
4. **Optimize images** - Use Next.js Image component
5. **Enable caching** - Configure proper cache headers
6. **Code splitting** - Use dynamic imports for large components
7. **Prefetch links** - Next.js Link prefetches automatically
8. **Minimize client JS** - Keep client components small

---

## Deployment Considerations

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### next.config.js for Docker
```javascript
module.exports = {
  output: 'standalone',
};
```

