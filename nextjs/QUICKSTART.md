# Got Ya Back - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Backend API running (see backend README)

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   
   Create a `.env.local` file in the `nextjs` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your_stripe_public_key
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
nextjs/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth routes (login, register)
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (public)/                 # Public routes
│   │   └── c/[slug]/             # Campaign public pages
│   │       ├── page.tsx          # Campaign view
│   │       └── sponsor/          # Sponsorship form
│   ├── dashboard/                # Protected dashboard routes
│   │   ├── page.tsx              # Campaign list
│   │   ├── profile/              # Profile settings
│   │   └── layout.tsx            # Dashboard layout
│   ├── campaigns/                # Campaign management
│   │   ├── create/               # Create campaign wizard
│   │   └── [id]/
│   │       └── layout-config/    # Layout configuration
│   ├── page.tsx                  # Home page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── lib/                          # Shared libraries
│   ├── api-client.ts             # Axios API client
│   ├── contexts/
│   │   └── auth-context.tsx      # Auth context provider
│   ├── services/
│   │   ├── auth.service.ts       # Auth API calls
│   │   └── campaign.service.ts   # Campaign API calls
│   ├── utils.ts                  # Utility functions
│   └── middleware.ts             # Route protection
├── types/                        # TypeScript types
│   └── campaign.types.ts         # Campaign-related types
└── public/                       # Static assets

```

## Key Features

### Authentication
- **Login**: `/login`
- **Register**: `/register`
- **Protected Routes**: Automatically redirect to login if not authenticated

### Dashboard
- **Campaign List**: `/dashboard`
- **Create Campaign**: `/campaigns/create`
- **Profile Settings**: `/dashboard/profile`
- **Layout Config**: `/campaigns/[id]/layout-config`

### Public Pages
- **Campaign View**: `/c/[slug]`
- **Sponsorship Form**: `/c/[slug]/sponsor`

## Development Workflow

### Creating a New Page

1. Create a new folder in `app/` with a `page.tsx` file
2. Use the `'use client'` directive if you need client-side features
3. Import and use Ant Design components
4. Add TypeScript types for props and state

Example:
```tsx
'use client';

import { Typography, Card } from 'antd';

const { Title } = Typography;

export default function MyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <Title level={2}>My Page</Title>
        {/* Your content */}
      </Card>
    </div>
  );
}
```

### Adding a New API Service

1. Create or update a service file in `lib/services/`
2. Use the `apiClient` for API calls
3. Add TypeScript types in `types/`

Example:
```typescript
import apiClient from '@/lib/api-client';

const myService = {
  async getData() {
    const response = await apiClient.get('/my-endpoint');
    return response.data;
  },
};

export default myService;
```

### Using the Auth Context

```tsx
import { useAuth } from '@/lib/contexts/auth-context';

export default function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.email}</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

## Common Tasks

### Protecting a Route

Routes in `app/dashboard/` are automatically protected by middleware.

To protect other routes, add them to `middleware.ts`:
```typescript
export const config = {
  matcher: ['/dashboard/:path*', '/my-protected-route/:path*'],
};
```

### Styling Components

Use Tailwind CSS classes for styling:
```tsx
<div className="max-w-4xl mx-auto p-6 bg-gray-50">
  <Card className="shadow-lg">
    {/* Content */}
  </Card>
</div>
```

### Handling Forms

Use Ant Design Form components:
```tsx
import { Form, Input, Button } from 'antd';

const [form] = Form.useForm();

const onFinish = (values) => {
  console.log('Form values:', values);
};

<Form form={form} onFinish={onFinish}>
  <Form.Item name="name" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
  <Button type="primary" htmlType="submit">Submit</Button>
</Form>
```

## Troubleshooting

### API Connection Issues
- Ensure backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is enabled on backend

### Authentication Issues
- Clear browser cookies and localStorage
- Check JWT token expiration
- Verify backend auth endpoints are working

### Build Errors
- Run `npm run build` to check for TypeScript errors
- Ensure all imports are correct
- Check for missing dependencies

## Next Steps

1. Review the [FEATURES.md](./FEATURES.md) for implemented features
2. Check [MIGRATION_PROGRESS.md](./MIGRATION_PROGRESS.md) for migration status
3. Start building additional features from the roadmap
4. Test with the backend API
5. Deploy to production

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Ant Design Components](https://ant.design/components/overview/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

