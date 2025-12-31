# Fundraising Shirt Campaign Platform – Comprehensive Build Guide

This guide walks you from **architecture and data modeling** all the way to **production deployment** for a fundraising campaign platform similar to *Got Ya Back*, using:

- **Frontend:** React + Vite + TypeScript + Ant Design
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB (with Mongoose)
- **Payments:** Optional (Stripe or similar)

The focus is **campaigns and transactions**, not e‑commerce inventory.

---

## 1. Core Product Concept

The platform allows individuals or teams to:
- Create fundraising campaigns
- Sell **sponsorship spots** on the back of a shirt
- Accept **online payments** or **manual (cash) registrations**
- Close campaigns automatically
- Generate a printable/exportable sponsor list for garment printing

### Key Differences from an E‑store
- No stock levels
- No shipping logic
- No variants or SKUs
- Shirts are symbolic, not purchasable inventory

---

## 2. Functional Requirements Breakdown

### Campaign Types
1. **Fixed Price Campaign**
   - All spots cost the same amount
   - Example: 40 spots × $20

2. **Placement-Based Campaign**
   - Different shirt positions have different prices
   - Example:
     - Top row: $50
     - Middle: $30
     - Bottom: $20

3. **Donation-Only Mode**
   - No shirt placement
   - Pure fundraising

### Payment Modes
- Online card payments (optional)
- Offline/manual payments (cash or bank transfer)
  - Admin marks payment as received

---

## 3. High-Level Architecture

```
[ React (Vite) ]
       |
       | REST API
       v
[ Node.js + Express ]
       |
       v
[ MongoDB ]
```

Optional services:
- Stripe (payments)
- Cloudinary / S3 (logos)
- Redis (timers & caching – optional)

---

## 4. Data Modeling (MongoDB)

### User
```ts
{
  _id: ObjectId,
  name: string,
  email: string,
  passwordHash: string,
  role: 'user' | 'admin',
  createdAt: Date
}
```

### Campaign
```ts
{
  _id: ObjectId,
  ownerId: ObjectId,
  title: string,
  description: string,
  garmentType: 'singlet' | 'tshirt' | 'hoodie',
  campaignType: 'fixed' | 'placement' | 'donation',
  currency: 'NZD' | 'AUD' | 'USD',
  startDate: Date,
  endDate: Date,
  isClosed: boolean,
  allowOfflinePayments: boolean,
  createdAt: Date
}
```

### ShirtLayout
```ts
{
  _id: ObjectId,
  campaignId: ObjectId,
  rows: number,
  columns: number,
  placements: [
    {
      positionId: string,
      price: number,
      isTaken: boolean
    }
  ]
}
```

### SponsorEntry
```ts
{
  _id: ObjectId,
  campaignId: ObjectId,
  positionId?: string,
  name: string,
  message?: string,
  amount: number,
  paymentMethod: 'card' | 'cash',
  paymentStatus: 'pending' | 'paid' | 'failed',
  createdAt: Date
}
```

### Transaction (Optional but Recommended)
```ts
{
  _id: ObjectId,
  sponsorEntryId: ObjectId,
  provider: 'stripe' | 'manual',
  providerRef?: string,
  status: 'success' | 'failed',
  amount: number,
  createdAt: Date
}
```

---

## 5. Backend Setup

### Project Structure
```
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── controllers/
│   ├── email/
│   ├── jobs/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── test/
│   └── utils/
```

### Core Middleware
- CORS
- JSON body parsing
- Auth (JWT)
- Role-based access control

---

## 6. Backend API Design

### Auth
```
POST   /auth/register
POST   /auth/login
```

### Campaigns
```
POST   /campaigns
GET    /campaigns/:id
GET    /campaigns/public/:slug
PUT    /campaigns/:id
POST   /campaigns/:id/close
```

### Shirt Layout
```
POST   /campaigns/:id/layout
GET    /campaigns/:id/layout
```

### Sponsorships
```
POST   /campaigns/:id/sponsor
GET    /campaigns/:id/sponsors
POST   /sponsors/:id/mark-paid   (offline payments)
```

### Payments (Optional)
```
POST   /payments/create-intent
POST   /payments/webhook
```

---

## 7. Payment Flow (Online)

1. Visitor selects spot
2. Backend locks the spot (temporary)
3. Stripe Payment Intent created
4. Payment confirmed
5. Spot permanently assigned

⚠️ Use **database transactions or atomic updates** to avoid double booking.

---

## 8. Offline / Cash Payments

Flow:
1. Sponsor registers name & message
2. Entry created with `paymentStatus = pending`
3. Campaign owner receives cash
4. Owner marks entry as paid

No payment gateway involved.

---

## 9. Campaign Countdown Logic

- Store `endDate`
- Frontend calculates remaining time
- Backend enforces closure

```ts
if (Date.now() > campaign.endDate) {
  throw new Error('Campaign closed');
}
```

Optional: Cron job to auto-close campaigns.

---

## 10. Frontend Architecture

### Project Structure
```
frontend/
├── src/
│   ├── assets/
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── test/
│   ├── types/
│   └── utils/
```

### Key Pages
- Home / Landing
- Create Campaign Wizard
- Campaign Public Page
- Sponsor Checkout
- Dashboard (Campaign Owner)

---

## 11. Shirt Placement UI (Critical Feature)

Approach:
- Use **CSS Grid** or **SVG overlay**
- Each cell = selectable placement
- Color states:
  - Available
  - Selected
  - Taken

Store `positionId` for each cell.

---

## 12. Ant Design Usage

Key components:
- `Form` – campaign creation
- `Steps` – creation wizard
- `Card` – campaign display
- `Modal` – sponsor checkout
- `Countdown` – campaign timer
- `Table` – sponsor list

---

## 13. Security & Validation

Backend:
- Validate ownership on updates
- Prevent race conditions on spot booking
- Webhook signature validation (Stripe)

Frontend:
- Disable taken spots
- Prevent double submission

---

## 14. Export & Printing Support

Campaign owners should be able to:
- Export sponsor list as CSV
- Export layout with names (PDF/SVG)

This is essential for garment printing.

---

## 15. Deployment

### Backend
- Host: Railway, Render, Fly.io, or EC2
- Environment variables for secrets

### Frontend
- Vercel or Netlify

### Database
- MongoDB Atlas

---

## 16. Future Enhancements

- Team accounts (multiple users per campaign)
- Multiple garments per campaign
- Public campaign discovery
- Email notifications
- Admin moderation panel

---

## 17. MVP Scope Recommendation

For fastest launch:
- Fixed-price campaigns
- Online payments only
- One garment per campaign
- CSV export

Then iterate.

---

If you want, next I can:
- Design the **shirt placement algorithm**
- Provide **Stripe integration code**
- Create a **DB transaction-safe booking flow**
- Write a **step-by-step MVP build checklist**

