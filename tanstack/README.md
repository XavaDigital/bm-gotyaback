# TanStack Start Frontend

This is the new frontend for the Fundraising Shirt Campaign Platform, built with TanStack Start.

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 30 minutes
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Complete migration guide (detailed)
- **[MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)** - Track your progress
- **[COMPARISON.md](./COMPARISON.md)** - Vite vs TanStack Start comparison

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

Visit: `http://localhost:3000`

## 📖 What is TanStack Start?

TanStack Start is a full-stack React framework that provides:

- ✅ **File-based routing** - Routes are files in `app/routes/`
- ✅ **Server-side rendering (SSR)** - Better SEO and performance
- ✅ **Type-safe navigation** - Catch routing errors at compile time
- ✅ **Built-in data loading** - Load data before rendering
- ✅ **Server functions** - Call server code from client safely

## 🏗️ Project Structure

```
tanstack/
├── app/
│   ├── routes/              # File-based routes (your pages)
│   │   ├── __root.tsx       # Root layout
│   │   ├── index.tsx        # Home page (/)
│   │   ├── login.tsx        # Login page (/login)
│   │   └── _authenticated/  # Protected routes
│   ├── components/          # Reusable UI components
│   ├── services/            # API services
│   ├── types/               # TypeScript types
│   ├── utils/               # Helper functions
│   ├── hooks/               # Custom React hooks
│   └── constants/           # Constants
├── public/                  # Static files
├── .env                     # Environment variables
├── app.config.ts            # TanStack Start config
└── package.json
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run typecheck    # Check TypeScript types
npm run lint         # Lint code
```

## 🔐 Environment Variables

Create a `.env` file:

```env
# Backend API
VITE_API_URL=http://localhost:5000/api

# Session Secret (min 32 characters)
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## 📁 Routing

Routes are file-based. The file structure determines the URL:

| File | URL | Description |
|------|-----|-------------|
| `routes/index.tsx` | `/` | Home page |
| `routes/login.tsx` | `/login` | Login page |
| `routes/campaign/$slug.tsx` | `/campaign/:slug` | Campaign detail |
| `routes/_authenticated/dashboard/index.tsx` | `/dashboard` | Dashboard (protected) |

### Dynamic Routes

Use `$` for dynamic segments:
- `$id.tsx` → `:id` parameter
- `$slug.tsx` → `:slug` parameter

### Protected Routes

Routes under `_authenticated/` require authentication:
```
routes/
└── _authenticated/          # Auth required
    ├── index.tsx            # /
    ├── dashboard/
    │   └── index.tsx        # /dashboard
    └── campaigns/
        └── create.tsx       # /campaigns/create
```

## 🔄 Migration Status

This project is being migrated from Vite to TanStack Start.

**Current Status**: Setup phase

See [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md) for detailed progress.

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Type checking
npm run typecheck
```

## 📦 Key Dependencies

- **@tanstack/start** - Full-stack React framework
- **@tanstack/react-router** - Type-safe routing
- **@tanstack/react-query** - Data fetching and caching
- **antd** - UI component library
- **axios** - HTTP client
- **@stripe/stripe-js** - Stripe integration

## 🤝 Contributing

1. Follow the migration guide
2. Test your changes thoroughly
3. Update documentation
4. Submit pull request

## 📝 Notes

- Backend must be running on `http://localhost:5000`
- Uses cookie-based sessions for SSR compatibility
- All routes are type-safe
- Data loads before component renders (no loading spinners needed!)

## 🆘 Need Help?

1. Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions
2. Check [COMPARISON.md](./COMPARISON.md) to understand differences
3. See "Common Issues & Solutions" in the migration guide
4. Join [TanStack Discord](https://discord.com/invite/tanstack)

## 🎯 Next Steps

1. Read [QUICK_START.md](./QUICK_START.md)
2. Follow [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
3. Track progress with [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)
4. Start migrating!

---

**Happy coding!** 🚀

