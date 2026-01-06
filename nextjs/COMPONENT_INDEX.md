# Component Index

Quick reference guide for all migrated components in the Next.js application.

## 📁 Location

All components are in: `nextjs/components/ui/`

## 🎨 UI Components

### Display Components

#### CampaignCard.tsx
- **Purpose**: Display campaign summary card
- **Used in**: Dashboard, campaign lists
- **Props**: `campaign`, `onClick`

#### LogoApprovalCard.tsx
- **Purpose**: Logo approval interface with approve/reject actions
- **Used in**: Logo approval page
- **Props**: `sponsor`, `onApprove`, `onReject`

### Upload Components

#### ImageUpload.tsx
- **Purpose**: Generic image upload component
- **Used in**: Campaign creation, profile editing
- **Props**: `onFileSelect`, `maxSizeMB`, `accept`

#### LogoUpload.tsx
- **Purpose**: Logo-specific upload with validation
- **Used in**: Sponsor checkout, logo submissions
- **Props**: `onFileSelect`, `maxSizeMB`

### Header Components

#### OrganizerProfileHeader.tsx
- **Purpose**: Display organizer profile information
- **Used in**: Organizer landing pages
- **Props**: `organizer`, `campaignCount`

#### PublicHeader.tsx
- **Purpose**: Header for public-facing pages
- **Used in**: Public campaign pages
- **Props**: None

#### PublicFooter.tsx
- **Purpose**: Footer for public-facing pages with CTA
- **Used in**: Public campaign pages
- **Props**: None

## 🎯 Layout Renderers

### FlexibleLayoutRenderer.tsx
- **Purpose**: Main layout router that delegates to specific renderers
- **Used in**: Public campaign pages
- **Props**: `sponsors`, `layoutStyle`, `sponsorDisplayType`
- **Delegates to**: SizeOrderedRenderer, AmountOrderedRenderer, WordCloudRenderer

### AmountOrderedRenderer.tsx
- **Purpose**: Display sponsors ordered by donation amount
- **Used in**: Via FlexibleLayoutRenderer
- **Props**: `sponsors`, `sponsorDisplayType`

### SizeOrderedRenderer.tsx
- **Purpose**: Display sponsors ordered by display size
- **Used in**: Via FlexibleLayoutRenderer
- **Props**: `sponsors`, `sponsorDisplayType`

### WordCloudRenderer.tsx
- **Purpose**: Display sponsors in word cloud layout
- **Used in**: Via FlexibleLayoutRenderer
- **Props**: `sponsors`, `sponsorDisplayType`

### ShirtLayout.tsx
- **Purpose**: Display sponsors in shirt/jersey grid layout
- **Used in**: Positional pricing campaigns
- **Props**: `layout`, `selectedPosition`, `onPositionSelect`, `sponsors`

## 👥 Sponsor Components

### LogoSponsor.tsx
- **Purpose**: Display sponsor logo with optional tooltip
- **Used in**: All layout renderers
- **Props**: `name`, `logoUrl`, `logoWidth`, `message`, `isPending`

### TextSponsor.tsx
- **Purpose**: Display sponsor name as text with optional tooltip
- **Used in**: All layout renderers
- **Props**: `name`, `fontSize`, `message`, `isPending`

### SponsorCheckoutModal.tsx
- **Purpose**: Modal for sponsor checkout and payment
- **Used in**: Public campaign pages
- **Props**: `visible`, `onCancel`, `onSubmit`, `amount`, `campaign`

## ✏️ Editor Components

### RichTextEditor.tsx
- **Purpose**: Lexical-based rich text editor
- **Used in**: Campaign creation, editing
- **Props**: `value`, `onChange`, `placeholder`, `readOnly`
- **Features**: Headings, lists, bold, italic, underline

### ToolbarPlugin.tsx
- **Purpose**: Toolbar for RichTextEditor
- **Used in**: RichTextEditor component
- **Props**: None (uses Lexical context)

## 🎪 Campaign Components

### CampaignWizard.tsx
- **Purpose**: Multi-step campaign creation/editing wizard
- **Used in**: Campaign creation, EditCampaignModal
- **Props**: `mode`, `initialCampaignData`, `onSubmit`, `loading`
- **Steps**: Basic Info, Layout, Payment

### EditCampaignModal.tsx
- **Purpose**: Modal for editing existing campaigns
- **Used in**: Campaign detail page
- **Props**: `visible`, `onCancel`, `onSuccess`, `campaign`

## 🔒 Guard Components

### AuthGuard.tsx
- **Purpose**: Protect routes that require authentication
- **Used in**: Protected page layouts
- **Props**: `children`
- **Behavior**: Redirects to login if not authenticated

### GuestGuard.tsx
- **Purpose**: Protect routes that should only be accessible to guests
- **Used in**: Auth page layouts (login, register)
- **Props**: `children`
- **Behavior**: Redirects to dashboard if authenticated

## 📊 Usage Examples

### Using Layout Renderers

```tsx
import FlexibleLayoutRenderer from '@/components/ui/FlexibleLayoutRenderer';

<FlexibleLayoutRenderer
  sponsors={sponsors}
  layoutStyle="amount-ordered"
  sponsorDisplayType="both"
/>
```

### Using Rich Text Editor

```tsx
import RichTextEditor from '@/components/ui/RichTextEditor';

<RichTextEditor
  value={description}
  onChange={(html) => setDescription(html)}
  placeholder="Enter campaign description..."
/>
```

### Using Campaign Wizard

```tsx
import CampaignWizard from '@/components/ui/CampaignWizard';

<CampaignWizard
  mode="create"
  onSubmit={handleSubmit}
  loading={loading}
/>
```

### Using Guards

```tsx
import AuthGuard from '@/components/ui/AuthGuard';

export default function ProtectedPage() {
  return (
    <AuthGuard>
      <div>Protected content</div>
    </AuthGuard>
  );
}
```

## 🎨 Styling

All components use:
- **Ant Design** components for UI
- **Tailwind CSS** for utility classes
- **Inline styles** for dynamic styling
- **CSS modules** for component-specific styles (richtext.css)

## 📝 Notes

- All components have `'use client'` directive for Next.js
- All imports use `@/` alias for absolute paths
- TypeScript types are imported from `@/types/`
- Services are imported from `@/lib/services/`

## 🔗 Related Documentation

- See `MIGRATION_SUMMARY.md` for migration details
- See `TESTING_CHECKLIST.md` for testing each component
- See `QUICK_START.md` for setup instructions

