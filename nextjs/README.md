# Got Ya Back - Next.js Frontend

Modern Next.js 15 frontend for the Got Ya Back fundraising platform.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: Ant Design 5
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Payments**: Stripe
- **Fonts**: Archivo (headings), Montserrat (body)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on http://localhost:5000

### Installation

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_key_here
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Project Structure

```
nextjs/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public routes
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Dashboard routes
│   ├── campaigns/         # Campaign management
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── layouts/          # Layout components
│   └── ui/               # Reusable UI components
├── lib/                   # Core utilities
│   ├── services/         # API services
│   ├── utils/            # Helper functions
│   ├── hooks/            # Custom hooks
│   ├── contexts/         # React contexts
│   └── api-client.ts     # Axios configuration
├── types/                 # TypeScript types
└── middleware.ts          # Route protection
```

## Features

### Phase 1: Setup (Complete) ✅
- Project setup and configuration
- API client with authentication
- Route protection middleware
- Type definitions
- Utility functions (currency, dates, Stripe)
- Authentication context
- Ant Design integration with SSR

### Phase 2: Authentication (Complete) ✅
- Login page with email/password
- Registration page with validation
- JWT token management
- Protected routes
- Auth layout with centered design

### Phase 3: Dashboard (Complete) ✅
- Dashboard layout with sidebar navigation
- Campaign list with statistics
- Profile settings page
- User dropdown menu
- Responsive mobile design

### Phase 4: Campaign Creation (Complete) ✅
- Multi-step campaign creation wizard
- Three pricing strategies (fixed, positional, pay-what-you-want)
- Multiple layout styles (grid, size-ordered, amount-ordered, word cloud)
- Image upload support
- Layout configuration page

### Phase 5: Public Pages (Complete) ✅
- Public campaign view by slug
- Campaign statistics and progress
- Sponsorship form
- Logo upload for sponsors
- Payment method selection

### Phase 6: Next Steps (Planned)
- Campaign edit page
- Sponsor management and approval
- Logo approval interface
- Stripe payment integration
- Email notifications
- Campaign analytics

**Current Progress: 68% Complete** (50 features implemented, 23 planned)

See [FEATURES.md](./FEATURES.md) for detailed feature breakdown.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Client-side API URL | `http://localhost:5000/api` |
| `API_URL` | Server-side API URL | `http://localhost:5000/api` |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | Stripe publishable key | `pk_test_...` |

## Development Notes

- Uses `--legacy-peer-deps` for installation due to react-quill peer dependencies
- Middleware convention is deprecated in Next.js 16 but still functional
- SSR-aware API client (different URLs for server/client rendering)
- Authentication tokens stored in localStorage (client-side only)

## Migration Documentation

The migration from Vite + React Router to Next.js 15 is complete! See the following documents for details:

- **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - Complete migration overview and status
- **[MIGRATION_COMPARISON.md](./MIGRATION_COMPARISON.md)** - Side-by-side comparison of Vite vs Next.js
- **[QUICK_START.md](./QUICK_START.md)** - Quick start guide for running and testing
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Comprehensive testing checklist
- **[MIGRATION_PROGRESS.md](./MIGRATION_PROGRESS.md)** - Detailed migration progress (legacy)

## License

Proprietary - All rights reserved
