# Next.js Migration Implementation Plan

## Executive Summary

**Current Architecture:**
- **Frontend:** React + Vite + TypeScript + Ant Design (SPA)
- **Backend:** Node.js + Express + TypeScript + MongoDB
- **Deployment:** Separate frontend/backend containers

**Proposed Architecture:**
- **Next.js 15** (App Router) - Full-stack framework
- **MongoDB** - Database (unchanged)
- **Deployment:** Single Next.js application

---

## Migration Feasibility Assessment

### ✅ **RECOMMENDED APPROACH: Hybrid Migration**

Converting to Next.js is **feasible and beneficial**, but I recommend a **hybrid approach** rather than full consolidation:

**Option A: Next.js with Separate Backend (RECOMMENDED)**
- Migrate frontend to Next.js App Router
- Keep existing Express backend as-is
- Use Next.js API routes only for SSR data fetching
- Backend remains independent microservice

**Option B: Full Consolidation (More Complex)**
- Migrate all Express routes to Next.js API routes
- Consolidate into single Next.js application
- Higher risk, more refactoring required

---

## Why Option A is Recommended

### Advantages:
1. **Lower Risk** - Frontend migration is isolated from backend
2. **Incremental Migration** - Can migrate page by page
3. **Preserve Backend Logic** - No need to refactor Express routes, middleware, services
4. **Better Separation** - Maintains clear API boundaries
5. **Easier Rollback** - Can revert frontend without affecting backend
6. **Deployment Flexibility** - Can scale frontend/backend independently

### Disadvantages of Full Consolidation (Option B):
1. **High Complexity** - Need to refactor all Express routes to Next.js API routes
2. **Middleware Migration** - JWT auth, CORS, file uploads need adaptation
3. **Webhook Handling** - Stripe webhooks with raw body parsing is tricky in Next.js
4. **File Upload Complexity** - Multer doesn't work in Next.js (need different approach)
5. **Database Connection** - Need to manage MongoDB connections differently
6. **Testing Overhead** - All API endpoints need retesting

---

## Recommended Implementation Plan (Option A)

### Phase 1: Setup Next.js Project (Week 1)

#### 1.1 Initialize Next.js
```bash
cd nextjs
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```

#### 1.2 Install Dependencies
```bash
npm install antd @ant-design/icons axios
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install lexical @lexical/react @lexical/rich-text @lexical/html @lexical/link @lexical/list @lexical/utils
npm install react-quill
```

#### 1.3 Configure Next.js
- Set up `next.config.js` for Ant Design
- Configure TypeScript paths
- Set up environment variables
- Configure API proxy to backend

---

### Phase 2: Migrate Core Infrastructure (Week 1-2)

#### 2.1 Port Shared Code
- Copy `types/campaign.types.ts` → `types/`
- Copy `services/` → `lib/services/` (update API client)
- Copy `utils/` → `lib/utils/`
- Copy `constants/` → `lib/constants/`

#### 2.2 Create API Client
```typescript
// lib/api-client.ts
// Point to existing Express backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
```

#### 2.3 Set Up Authentication
- Create auth context/provider
- Implement middleware for protected routes
- Port AuthGuard/GuestGuard logic

---

### Phase 3: Migrate Pages (Week 2-3)

#### 3.1 Public Pages (Client-Side Rendering)
- `/` - Home page
- `/login` - Login page
- `/register` - Register page
- `/forgot-password` - Password reset
- `/reset-password` - Password reset confirmation

#### 3.2 Public Pages (Server-Side Rendering)
- `/campaign/[slug]` - Public campaign view (SSR for SEO)
- `/u/[slug]` - Organizer landing page (SSR for SEO)

#### 3.3 Protected Pages (Client-Side Rendering)
- `/dashboard` - My campaigns
- `/campaigns/create` - Create campaign
- `/campaigns/[id]` - Campaign detail
- `/campaigns/[id]/logo-approval` - Logo approval
- `/dashboard/profile` - Profile settings

---

### Phase 4: Migrate Components (Week 3-4)

#### 4.1 Layout Components
- Port `AppLayout` → `components/layouts/AppLayout.tsx`
- Port `PublicHeader` → `components/layouts/PublicHeader.tsx`
- Port `PublicFooter` → `components/layouts/PublicFooter.tsx`

#### 4.2 Feature Components
- Port all components from `frontend/src/components/`
- Update imports to use Next.js conventions
- Ensure client components use `'use client'` directive

#### 4.3 Styling
- Migrate CSS files
- Configure Ant Design theme provider
- Set up global styles

---

### Phase 5: Routing & Navigation (Week 4)

#### 5.1 App Router Structure
```
nextjs/app/
├── layout.tsx                    # Root layout with providers
├── page.tsx                      # Home page
├── login/
│   └── page.tsx
├── register/
│   └── page.tsx
├── forgot-password/
│   └── page.tsx
├── reset-password/
│   └── page.tsx
├── campaign/
│   └── [slug]/
│       └── page.tsx              # SSR public campaign
├── u/
│   └── [slug]/
│       └── page.tsx              # SSR organizer page
├── dashboard/
│   ├── layout.tsx                # Protected layout
│   ├── page.tsx                  # My campaigns
│   └── profile/
│       └── page.tsx
└── campaigns/
    ├── create/
    │   └── page.tsx
    ├── [id]/
    │   ├── page.tsx
    │   └── logo-approval/
    │       └── page.tsx
```

#### 5.2 Middleware for Auth
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Check auth token, redirect if needed
}
```

---

### Phase 6: Testing & Optimization (Week 5)

#### 6.1 Testing Checklist
- [ ] All pages render correctly
- [ ] Authentication flow works
- [ ] Protected routes redirect properly
- [ ] API calls to backend succeed
- [ ] File uploads work
- [ ] Stripe payments work
- [ ] Forms submit correctly
- [ ] SEO meta tags present

#### 6.2 Performance Optimization
- Enable Next.js Image optimization
- Implement proper loading states
- Add error boundaries
- Optimize bundle size

---

### Phase 7: Deployment (Week 6)

#### 7.1 Update Docker Configuration
```dockerfile
# Dockerfile for Next.js
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

#### 7.2 Update Deployment Scripts
- Modify `docker-compose.yml` to include Next.js service
- Update nginx configuration
- Update environment variables

---

## Potential Issues & Solutions

### Issue 1: Client-Side Only Features
**Problem:** Some components use `window`, `localStorage`, etc.
**Solution:** Use `'use client'` directive and check for browser environment

### Issue 2: Ant Design SSR
**Problem:** Ant Design needs special configuration for SSR
**Solution:** Use `@ant-design/nextjs-registry` package

### Issue 3: Authentication State
**Problem:** Managing auth state across server/client
**Solution:** Use cookies for SSR, context for client state

### Issue 4: API Base URL
**Problem:** Different URLs for server-side vs client-side fetching
**Solution:** Environment variables with fallbacks

### Issue 5: File Uploads
**Problem:** Next.js handles multipart differently than Express
**Solution:** Keep file uploads in Express backend, call from Next.js

### Issue 6: Rich Text Editors
**Problem:** Lexical/Quill are client-side only
**Solution:** Dynamic imports with `ssr: false`

### Issue 7: React Router → Next.js Router
**Problem:** Different routing paradigms
**Solution:** Replace `useNavigate` with `useRouter`, `Link` components

---

## Migration Checklist

### Pre-Migration
- [ ] Backup current codebase
- [ ] Document current functionality
- [ ] Set up Next.js project structure
- [ ] Install all dependencies

### During Migration
- [ ] Migrate types and interfaces
- [ ] Migrate services and API clients
- [ ] Migrate components (mark client components)
- [ ] Migrate pages one by one
- [ ] Update routing logic
- [ ] Configure authentication
- [ ] Test each migrated feature

### Post-Migration
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] SEO verification
- [ ] Update documentation
- [ ] Update deployment scripts
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

---

## Alternative: Full Consolidation (Option B)

If you want to consolidate everything into Next.js:

### Additional Steps Required:

1. **Migrate Express Routes to Next.js API Routes**
   - Convert all `/api/*` routes to `app/api/*/route.ts`
   - Rewrite middleware (auth, CORS, etc.)
   - Handle file uploads with Next.js approach

2. **Database Connection Management**
   - Create MongoDB connection utility for Next.js
   - Handle connection pooling properly

3. **Webhook Handling**
   - Special handling for Stripe webhooks (raw body)
   - Use Next.js route handlers with proper config

4. **File Upload Refactoring**
   - Replace Multer with Next.js file handling
   - Update S3 upload logic

5. **Environment Variables**
   - Migrate all backend env vars
   - Ensure proper NEXT_PUBLIC_ prefixes

**Estimated Time:** 8-10 weeks (vs 6 weeks for Option A)
**Risk Level:** High (vs Medium for Option A)

---

## Recommendation

**I strongly recommend Option A (Hybrid Approach)** for the following reasons:

1. **Your backend is well-structured** - Express API is clean and working
2. **Lower risk** - Frontend migration is isolated
3. **Faster delivery** - 6 weeks vs 8-10 weeks
4. **Easier maintenance** - Clear separation of concerns
5. **Better for your use case** - You need SEO for public pages, but backend logic is complex

### What You Gain with Next.js (Option A):
- ✅ Server-Side Rendering for public campaign pages (better SEO)
- ✅ Better performance with automatic code splitting
- ✅ Image optimization
- ✅ Better developer experience
- ✅ Modern React features (Server Components where beneficial)
- ✅ Improved routing with App Router

### What You Keep:
- ✅ Existing Express backend (proven, working)
- ✅ All backend logic intact
- ✅ Existing database connections
- ✅ Webhook handling
- ✅ File upload logic

---

## Next Steps

1. **Review this plan** and decide between Option A or Option B
2. **Set up the Next.js project** in the `nextjs/` folder
3. **Start with Phase 1** (Setup)
4. **Migrate incrementally** - one page at a time
5. **Test thoroughly** at each phase

Would you like me to:
1. Start implementing Option A (recommended)?
2. Create a detailed plan for Option B (full consolidation)?
3. Set up the initial Next.js project structure?
4. Create a comparison document with more technical details?

