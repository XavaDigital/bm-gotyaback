# TanStack Start Migration Checklist

Use this checklist to track your migration progress.

## Pre-Migration

- [ ] Read `MIGRATION_GUIDE.md` thoroughly
- [ ] Read `QUICK_START.md` for quick setup
- [ ] Backup current frontend code
  ```bash
  git checkout -b backup/vite-original
  git add .
  git commit -m "Backup: Original Vite setup"
  ```
- [ ] Ensure backend is running and accessible
- [ ] Document current routes and features
- [ ] Set up testing environment

---

## Phase 1: Project Setup

- [ ] Initialize TanStack Start project
  ```bash
  cd tanstack
  npm create @tanstack/start@latest .
  ```
- [ ] Install core dependencies
  - [ ] `antd` and `@ant-design/icons`
  - [ ] `axios`
  - [ ] `@stripe/stripe-js` and `@stripe/react-stripe-js`
  - [ ] `@tanstack/react-query`
  - [ ] `@tanstack/router-devtools`
- [ ] Create directory structure
  - [ ] `app/routes/`
  - [ ] `app/components/`
  - [ ] `app/services/`
  - [ ] `app/types/`
  - [ ] `app/utils/`
  - [ ] `app/hooks/`
  - [ ] `app/constants/`
  - [ ] `app/assets/`
- [ ] Set up environment variables (`.env`)
- [ ] Configure `app.config.ts`
- [ ] Configure `tsconfig.json`
- [ ] Test dev server runs (`npm run dev`)

---

## Phase 2: File Migration

- [ ] Copy static assets
  - [ ] `frontend/src/assets/` → `tanstack/app/assets/`
  - [ ] `frontend/public/` → `tanstack/public/`
- [ ] Copy type definitions
  - [ ] `campaign.types.ts`
  - [ ] Other type files
- [ ] Copy utility functions
  - [ ] `stripe.ts`
  - [ ] Other utils
- [ ] Copy constants
  - [ ] All constant files
- [ ] Copy services (will need updates)
  - [ ] `auth.service.ts`
  - [ ] `campaign.service.ts`
  - [ ] `payment.service.ts`
  - [ ] `sponsorship.service.ts`
  - [ ] `user.service.ts`
  - [ ] `apiClient.ts`

---

## Phase 3: Routing Setup

### Root Route
- [ ] Create `app/routes/__root.tsx`
- [ ] Import Ant Design styles
- [ ] Add TanStack Router DevTools
- [ ] Test root route renders

### Public Routes
- [ ] Create `app/routes/login.tsx`
- [ ] Create `app/routes/register.tsx`
- [ ] Create `app/routes/campaign/$slug.tsx`
- [ ] Create `app/routes/u/$slug.tsx`
- [ ] Test all public routes accessible

### Protected Routes Layout
- [ ] Create `app/routes/_authenticated.tsx`
- [ ] Implement auth check in `beforeLoad`
- [ ] Add AppLayout wrapper
- [ ] Test auth redirect works

### Protected Routes
- [ ] Create `app/routes/_authenticated/index.tsx` (Home)
- [ ] Create `app/routes/_authenticated/campaigns/create.tsx`
- [ ] Create `app/routes/_authenticated/campaigns/$id.tsx`
- [ ] Create `app/routes/_authenticated/dashboard/index.tsx`
- [ ] Create `app/routes/_authenticated/dashboard/profile.tsx`
- [ ] Test all protected routes require auth

### Router Configuration
- [ ] Create `app/router.tsx`
- [ ] Configure router with route tree
- [ ] Test type-safe navigation

---

## Phase 4: Component Migration

### Layout Components
- [ ] Copy and update `AppLayout.tsx`
  - [ ] Update imports to `@tanstack/react-router`
  - [ ] Update `Link` components
  - [ ] Test layout renders correctly
- [ ] Copy and update `AuthGuard.tsx` (if still needed)
- [ ] Copy and update `GuestGuard.tsx` (if still needed)

### Feature Components
- [ ] Copy `CampaignCard.tsx`
- [ ] Copy `EditCampaignModal.tsx`
- [ ] Copy `ImageUpload.tsx`
- [ ] Copy `OrganizerProfileHeader.tsx`
- [ ] Copy `QuillEditor.tsx`
- [ ] Copy `ShareButton.tsx`
- [ ] Copy `ShirtLayout.tsx`
- [ ] Copy `SponsorCheckoutModal.tsx`

### Update Component Imports
- [ ] Replace `react-router-dom` with `@tanstack/react-router`
- [ ] Update `useNavigate` usage
- [ ] Update `useParams` usage (add `from` parameter)
- [ ] Update `Link` components
- [ ] Test all components render

---

## Phase 5: Page Migration

- [ ] Copy `Home.tsx` → `app/components/pages/Home.tsx`
- [ ] Copy `Login.tsx` → `app/components/pages/Login.tsx`
- [ ] Copy `Register.tsx` → `app/components/pages/Register.tsx`
- [ ] Copy `CreateCampaign.tsx` → `app/components/pages/CreateCampaign.tsx`
- [ ] Copy `MyCampaigns.tsx` → `app/components/pages/MyCampaigns.tsx`
- [ ] Copy `CampaignDetail.tsx` → `app/components/pages/CampaignDetail.tsx`
- [ ] Copy `PublicCampaign.tsx` → `app/components/pages/PublicCampaign.tsx`
- [ ] Copy `ProfileSettings.tsx` → `app/components/pages/ProfileSettings.tsx`
- [ ] Copy `OrganizerLandingPage.tsx` → `app/components/pages/OrganizerLandingPage.tsx`

### Update Page Imports
- [ ] Update all router imports
- [ ] Update all navigation calls
- [ ] Update all Link components
- [ ] Test each page individually

---

## Phase 6: Authentication

- [ ] Create `app/utils/session.ts`
- [ ] Update `auth.service.ts` for SSR
  - [ ] Add server-side methods
  - [ ] Add client-side methods
  - [ ] Implement session management
- [ ] Update login flow
  - [ ] Test login works
  - [ ] Test session persists
  - [ ] Test redirect after login
- [ ] Update logout flow
  - [ ] Test logout works
  - [ ] Test session clears
  - [ ] Test redirect after logout
- [ ] Update registration flow
  - [ ] Test registration works
  - [ ] Test auto-login after registration
- [ ] Test protected route access
  - [ ] Logged out → redirects to login
  - [ ] Logged in → allows access
- [ ] Test guest route access
  - [ ] Logged in → redirects to home
  - [ ] Logged out → allows access

---

## Phase 7: API Integration

### Server Functions (Optional)
- [ ] Create `app/services/server/auth.server.ts`
- [ ] Create `app/services/server/campaign.server.ts`
- [ ] Create `app/services/server/payment.server.ts`
- [ ] Test server functions work

### Service Layer Updates
- [ ] Update `apiClient.ts` for SSR compatibility
- [ ] Update `auth.service.ts`
- [ ] Update `campaign.service.ts`
- [ ] Update `payment.service.ts`
- [ ] Update `sponsorship.service.ts`
- [ ] Update `user.service.ts`
- [ ] Test all API calls work

### TanStack Query Integration
- [ ] Set up QueryClient
- [ ] Add query provider to root
- [ ] Implement data fetching with loaders
- [ ] Test data loading works
- [ ] Test caching works

---

## Phase 8: Feature Testing

### Authentication Flow
- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] Session persists on refresh
- [ ] Protected routes require auth
- [ ] Guest routes redirect when authenticated

### Campaign Management
- [ ] Can view campaign list
- [ ] Can create new campaign
- [ ] Can edit campaign
- [ ] Can delete campaign
- [ ] Can view campaign details
- [ ] Can view public campaign page

### Sponsorship Flow
- [ ] Can view shirt layout
- [ ] Can select placement
- [ ] Can checkout with Stripe
- [ ] Payment processes correctly
- [ ] Sponsorship records correctly

### Profile Management
- [ ] Can view profile
- [ ] Can update profile
- [ ] Can upload profile image
- [ ] Changes persist

### Organizer Features
- [ ] Organizer landing page works
- [ ] Shows correct campaigns
- [ ] Profile displays correctly

---

## Phase 9: UI/UX Testing

- [ ] All Ant Design components render correctly
- [ ] Forms validate properly
- [ ] Modals open and close
- [ ] Buttons work correctly
- [ ] Navigation menu works
- [ ] Responsive design works
- [ ] Loading states display
- [ ] Error states display
- [ ] Success messages display

---

## Phase 10: Performance Testing

- [ ] Build for production (`npm run build`)
- [ ] Test production build (`npm start`)
- [ ] Verify SSR works (view page source)
- [ ] Verify hydration works (no console errors)
- [ ] Test page load speed
- [ ] Test navigation speed
- [ ] Test bundle size
- [ ] Run Lighthouse audit

---

## Phase 11: Browser Testing

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Phase 12: Deployment Preparation

- [ ] Create `.env.example`
- [ ] Update `.gitignore`
- [ ] Create deployment documentation
- [ ] Choose deployment platform
  - [ ] Vercel
  - [ ] Docker
  - [ ] Traditional Node server
- [ ] Configure deployment settings
- [ ] Set up environment variables in production
- [ ] Test deployment to staging

---

## Phase 13: Production Deployment

- [ ] Deploy to production
- [ ] Verify all routes work
- [ ] Verify API integration works
- [ ] Verify authentication works
- [ ] Verify payments work
- [ ] Monitor for errors
- [ ] Set up error tracking (optional)

---

## Post-Migration

- [ ] Update documentation
- [ ] Train team on new structure
- [ ] Monitor performance
- [ ] Collect user feedback
- [ ] Fix any issues
- [ ] Deprecate old frontend
- [ ] Celebrate! 🎉

---

## Rollback Plan (If Needed)

- [ ] Document what went wrong
- [ ] Revert to backup branch
  ```bash
  git checkout backup/vite-original
  ```
- [ ] Restart old frontend
  ```bash
  cd frontend
  npm run dev
  ```
- [ ] Plan fixes for next attempt

---

## Notes & Issues

Use this space to track issues encountered during migration:

```
Date: ___________
Issue: 
Solution:

Date: ___________
Issue:
Solution:
```

---

**Progress Tracker**

- Total Tasks: ~150
- Completed: ___
- Remaining: ___
- Estimated Completion: ___________


