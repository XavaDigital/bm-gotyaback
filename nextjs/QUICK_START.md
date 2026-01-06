# Quick Start Guide - Next.js Migration

## Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:5000`
- MongoDB database configured

## Installation

```bash
cd nextjs
npm install
```

## Environment Setup

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your_stripe_public_key_here
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Testing the Migration

### 1. Authentication Flow

1. Navigate to `http://localhost:3000`
2. Click "Register" to create a new account
3. Fill in the registration form
4. Verify you're redirected to the dashboard
5. Log out and log back in
6. Test "Forgot Password" flow

### 2. Campaign Management

1. From the dashboard, click "Create New Campaign"
2. Fill in campaign details:
   - Title
   - Slug (URL-friendly name)
   - Description
   - Campaign type
   - Garment type
3. Save the campaign
4. Verify you're redirected to the campaign detail page

### 3. Campaign Configuration

1. From a campaign detail page, click "Configure Layout"
2. Select layout type (flexible, fixed, wordcloud, list)
3. Configure grid settings if applicable
4. Save configuration
5. Verify settings are saved

### 4. Public Campaign Page

1. From campaign detail, click "View Public Page"
2. Verify the public campaign page loads
3. Test sponsor checkout flow (if Stripe is configured)
4. Verify sponsor information displays correctly

### 5. Logo Approval Workflow

1. From campaign detail, click "Logo Approvals"
2. Verify pending logos are displayed
3. Test approve/reject functionality
4. Verify approved/rejected tabs work

### 6. Profile Management

1. Navigate to `/profile`
2. Update profile information
3. Change password
4. Verify changes are saved

## API Endpoints Being Used

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Campaigns
- `GET /api/campaigns` - List user's campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/campaigns/slug/:slug` - Get campaign by slug

### Sponsorships
- `GET /api/sponsorships/campaign/:campaignId` - Get campaign sponsors
- `POST /api/sponsorships` - Create sponsorship
- `PUT /api/sponsorships/:id` - Update sponsorship
- `GET /api/sponsorships/pending-logos/:campaignId` - Get pending logo approvals
- `PUT /api/sponsorships/:id/approve-logo` - Approve/reject logo

### Payments
- `POST /api/payments/create-checkout-session` - Create Stripe checkout
- `POST /api/payments/webhook` - Stripe webhook handler

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password

## Common Issues & Solutions

### Issue: "Network Error" or API calls failing

**Solution**: Ensure backend is running on `http://localhost:5000` and CORS is configured correctly.

### Issue: Ant Design styles not loading

**Solution**: Clear `.next` cache and restart dev server:
```bash
rm -rf .next
npm run dev
```

### Issue: Authentication not persisting

**Solution**: Check browser localStorage for `token` and `user` keys. Ensure cookies are enabled.

### Issue: Images not loading

**Solution**: Verify images are in the `public/` directory and referenced correctly.

### Issue: TypeScript errors

**Solution**: Run type checking:
```bash
npm run type-check
```

## File Structure Quick Reference

```
app/
├── (auth)/          # Public auth pages
├── (protected)/     # Protected pages (require login)
├── (public)/        # Public pages (campaigns, organizers)
├── layout.tsx       # Root layout with providers
└── page.tsx         # Home page

components/ui/       # Reusable UI components
lib/
├── api-client.ts    # Axios instance
├── services/        # API service layer
├── contexts/        # React contexts
└── utils.ts         # Utility functions

types/               # TypeScript type definitions
styles/              # Global styles and CSS
public/              # Static assets
```

## Development Tips

1. **Hot Reload**: Next.js automatically reloads on file changes
2. **Error Overlay**: Errors will show in browser overlay during development
3. **Console Logs**: Check browser console for client-side logs
4. **Network Tab**: Use browser DevTools Network tab to debug API calls
5. **React DevTools**: Install React DevTools extension for component debugging

## Next Steps After Testing

1. Configure Stripe payment integration
2. Set up email service for notifications
3. Add more comprehensive error handling
4. Implement loading states for better UX
5. Add unit and integration tests
6. Configure production environment variables
7. Set up CI/CD pipeline
8. Deploy to production (Vercel, AWS, etc.)

## Support

For issues or questions:
1. Check the MIGRATION_SUMMARY.md for detailed migration notes
2. Review Next.js documentation: https://nextjs.org/docs
3. Check Ant Design documentation: https://ant.design/docs/react/introduce

