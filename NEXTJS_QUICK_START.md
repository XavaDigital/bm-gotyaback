# Next.js Migration - Quick Start Guide

## Pre-Flight Checklist

Before starting the migration, ensure:

- [ ] You've read `NEXTJS_MIGRATION_SUMMARY.md`
- [ ] You've decided on Option A (Hybrid) or Option B (Full)
- [ ] You have 6+ weeks allocated for this project
- [ ] Your team is ready to learn Next.js basics
- [ ] You've backed up the current codebase
- [ ] You have a staging environment for testing

---

## Day 1: Initialize Next.js Project

### Step 1: Navigate to nextjs folder
```bash
cd nextjs
```

### Step 2: Initialize Next.js
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**Answer the prompts:**
- ✅ TypeScript: Yes
- ✅ ESLint: Yes
- ✅ Tailwind CSS: Yes (we'll use it alongside Ant Design)
- ✅ App Router: Yes
- ✅ Turbopack: Yes
- ❌ src/ directory: No
- ✅ Import alias: Yes (@/*)

### Step 3: Install Core Dependencies
```bash
npm install antd @ant-design/icons @ant-design/nextjs-registry
npm install axios
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install lexical @lexical/react @lexical/rich-text @lexical/html @lexical/link @lexical/list @lexical/utils
npm install react-quill
npm install sharp  # For Next.js image optimization
```

### Step 4: Install Dev Dependencies
```bash
npm install -D @types/node
```

---

## Day 1-2: Configure Next.js

### Step 1: Create `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Configure external images (S3, etc.)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  
  // Transpile Ant Design for SSR
  transpilePackages: ['antd', '@ant-design/icons'],
};

module.exports = nextConfig;
```

### Step 2: Create Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_key_here

# For server-side API calls (Docker internal)
API_URL=http://backend:5000/api
```

### Step 3: Update `app/layout.tsx`
```typescript
import type { Metadata } from 'next';
import { Archivo, Montserrat } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Got Ya Back - Fundraising Platform',
  description: 'Create and manage fundraising campaigns',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${archivo.variable} ${montserrat.variable}`}>
      <body>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
```

### Step 4: Create Folder Structure
```bash
mkdir -p app/(public)
mkdir -p app/(auth)
mkdir -p app/dashboard
mkdir -p app/campaigns
mkdir -p components/layouts
mkdir -p components/ui
mkdir -p lib/services
mkdir -p lib/utils
mkdir -p lib/hooks
mkdir -p types
```

---

## Day 2-3: Set Up Core Infrastructure

### Step 1: Create API Client
```typescript
// lib/api-client.ts
import axios from 'axios';

const getBaseURL = () => {
  if (typeof window === 'undefined') {
    return process.env.API_URL || 'http://localhost:5000/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Step 2: Copy Types
```bash
cp ../frontend/src/types/campaign.types.ts types/
```

### Step 3: Create Auth Context
```typescript
// lib/contexts/auth-context.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types/campaign.types';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Step 4: Create Middleware for Auth
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ['/dashboard', '/campaigns/create'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Guest-only routes
  const guestRoutes = ['/login', '/register'];
  const isGuestRoute = guestRoutes.some(route => pathname === route);

  if (isGuestRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/campaigns/create',
    '/campaigns/:id/logo-approval',
    '/login',
    '/register',
  ],
};
```

---

## Week 1 Deliverables Checklist

By end of Week 1, you should have:

- [ ] Next.js project initialized
- [ ] All dependencies installed
- [ ] `next.config.js` configured
- [ ] Environment variables set up
- [ ] Folder structure created
- [ ] API client created
- [ ] Types copied from frontend
- [ ] Auth context created
- [ ] Middleware for route protection
- [ ] Root layout with fonts and Ant Design
- [ ] Dev server running (`npm run dev`)

---

## Testing Your Setup

### Run the dev server:
```bash
cd nextjs
npm run dev
```

### Visit:
- http://localhost:3000 - Should see Next.js default page

### Verify:
- [ ] No console errors
- [ ] Fonts loading correctly
- [ ] Ant Design components work (test with a Button)

---

## Next Steps After Week 1

1. **Week 2:** Start migrating components
   - Copy components from `frontend/src/components/`
   - Add `'use client'` where needed
   - Update imports

2. **Week 3-4:** Migrate pages
   - Start with simple pages (Login, Register)
   - Then public pages (Home, PublicCampaign)
   - Finally protected pages (Dashboard, etc.)

3. **Week 5:** Testing
   - Functional testing
   - SEO testing
   - Performance testing

4. **Week 6:** Deployment
   - Update Docker configuration
   - Deploy to staging
   - Production deployment

---

## Common First-Day Issues

### Issue: "Module not found: Can't resolve 'antd'"
**Fix:** Run `npm install antd @ant-design/icons @ant-design/nextjs-registry`

### Issue: "Error: Cannot find module 'sharp'"
**Fix:** Run `npm install sharp`

### Issue: "Hydration failed"
**Fix:** Make sure you're using `AntdRegistry` in root layout

### Issue: "localStorage is not defined"
**Fix:** Check `typeof window !== 'undefined'` before using localStorage

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Ant Design with Next.js](https://ant.design/docs/react/use-with-next)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)

---

## Need Help?

If you get stuck:
1. Check the error message carefully
2. Review `NEXTJS_MIGRATION_ISSUES.md` for common problems
3. Search Next.js documentation
4. Ask for help with specific error messages

---

## Ready to Start?

Run this command to begin:
```bash
cd nextjs
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

Good luck! 🚀

