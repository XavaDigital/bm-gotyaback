# TanStack Start - Quick Start Guide

This is a condensed version of the migration guide to get you started quickly.

## Prerequisites

- Node.js 18+
- Your backend running on `http://localhost:5000`

## Step 1: Initialize Project (5 minutes)

```bash
cd D:\Coding\bm-gotyaback\tanstack

# Initialize TanStack Start
npm create @tanstack/start@latest .

# Install dependencies
npm install antd @ant-design/icons axios @stripe/stripe-js @stripe/react-stripe-js
npm install @tanstack/react-query @tanstack/router-devtools
npm install -D @types/node
```

## Step 2: Create Basic Structure (10 minutes)

```bash
# Create directories
mkdir -p app/routes app/components app/services app/types app/utils app/hooks app/constants app/assets

# Copy from existing frontend
cp -r ../frontend/src/types/* app/types/
cp -r ../frontend/src/utils/* app/utils/
cp -r ../frontend/src/constants/* app/constants/
cp -r ../frontend/src/assets/* app/assets/
```

## Step 3: Environment Setup (2 minutes)

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters-long
```

## Step 4: Create Root Route (5 minutes)

**File: `app/routes/__root.tsx`**
```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import 'antd/dist/reset.css'

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

## Step 5: Create Login Page (10 minutes)

**File: `app/routes/login.tsx`**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { Form, Input, Button, Card } from 'antd'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      // TODO: Implement login
      console.log('Login:', values)
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card title="Login" style={{ width: 400 }}>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
```

## Step 6: Create Home Page (5 minutes)

**File: `app/routes/index.tsx`**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { Card } from 'antd'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div style={{ padding: '50px' }}>
      <Card title="Welcome to TanStack Start">
        <p>Your migration is working! 🎉</p>
      </Card>
    </div>
  )
}
```

## Step 7: Configure App (5 minutes)

**File: `app.config.ts`**
```tsx
import { defineConfig } from '@tanstack/start/config'

export default defineConfig({
  server: {
    preset: 'node-server',
  },
})
```

## Step 8: Run Development Server (1 minute)

```bash
npm run dev
```

Visit: `http://localhost:3000`

You should see:
- ✅ Home page at `/`
- ✅ Login page at `/login`
- ✅ TanStack Router DevTools in bottom-right

## Step 9: Next Steps

Now that you have a working basic setup:

1. **Copy your components**: `cp -r ../frontend/src/components/* app/components/`
2. **Copy your services**: `cp -r ../frontend/src/services/* app/services/`
3. **Create more routes**: Follow the pattern in `MIGRATION_GUIDE.md`
4. **Implement authentication**: See Phase 5 in the full guide
5. **Migrate pages one by one**: Start with simple pages first

## Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Lint
npm run lint
```

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Module not found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Check what's wrong
npm run typecheck
```

## File Structure Reference

```
tanstack/
├── app/
│   ├── routes/              # Your pages (file-based routing)
│   │   ├── __root.tsx       # Root layout
│   │   ├── index.tsx        # Home page (/)
│   │   ├── login.tsx        # Login page (/login)
│   │   └── dashboard/       # Dashboard section
│   │       └── index.tsx    # (/dashboard)
│   ├── components/          # Reusable components
│   ├── services/            # API services
│   ├── types/               # TypeScript types
│   ├── utils/               # Helper functions
│   └── router.tsx           # Router configuration
├── public/                  # Static files
├── .env                     # Environment variables
├── app.config.ts            # TanStack Start config
├── package.json
└── tsconfig.json
```

## Need Help?

- 📖 Full guide: See `MIGRATION_GUIDE.md`
- 🐛 Issues: Check "Common Issues & Solutions" in full guide
- 💬 Community: [TanStack Discord](https://discord.com/invite/tanstack)

---

**You're ready to start migrating!** 🚀

Follow the full `MIGRATION_GUIDE.md` for detailed instructions on each phase.

