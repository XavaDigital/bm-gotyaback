# Implementation Guide: Organizer Profile & Multi-Campaign Support

## 1. Overview
The goal is to allow an Organizer (User) to run multiple campaigns simultaneously and have a dedicated public landing page (Profile) that showcases all their active campaigns. This page will be customizable with a logo, cover image, and description.

## 2. Database Schema Changes

### Update `User` Model
We need to store the customization options for the organizer's profile.

**File:** `backend/src/models/User.ts`

```typescript
const userSchema = new mongoose.Schema({
    // ... existing fields
    organizerProfile: {
        displayName: { type: String }, // Optional: separate from account name
        slug: { type: String, unique: true, sparse: true }, // For pretty URLs like /u/my-org
        logoUrl: { type: String },
        coverImageUrl: { type: String },
        bio: { type: String }, // WYSIWYG content
        websiteUrl: { type: String },
        socialLinks: {
            facebook: String,
            twitter: String,
            instagram: String
        }
    }
}, { timestamps: true });
```

> **Note:** We add `slug` to allow friendly URLs (e.g., `gotyaback.com/u/run-for-health`) instead of using ObjectIDs in the public URL.

## 3. Backend API Changes

### 3.1. Public Profile Endpoints
**File:** `backend/src/routes/public.routes.ts` (or similar)

*   `GET /api/public/organizers/:slug`
    *   **Purpose:** Fetch public profile details + list of active campaigns.
    *   **Logic:**
        1.  Find User by `organizerProfile.slug`.
        2.  Find all Campaigns where `ownerId` matches user, `isClosed` is false, and `endDate` > now.
        3.  Return combined object: `{ profile: user.organizerProfile, campaigns: [...] }`.

### 3.2. Organizer Settings Endpoints
**File:** `backend/src/routes/user.routes.ts`

*   `PUT /api/users/profile`
    *   **Purpose:** Update profile settings (Logo, Bio, Cover).
    *   **Auth:** Protected (Logged in user).
    *   **Body:** `{ displayName, bio, logoUrl, coverImageUrl, slug ... }`

## 4. Frontend Changes

### 4.1. Components
*   **`OrganizerProfileLayout`**: A layout component showing the Cover Image and Logo at the top.
*   **`CampaignCard`**: A reusable card component to display a summary of a campaign (Title, Image, Progress).

### 4.2. Pages

#### Public View: `OrganizerLandingPage.tsx`
*   **Route:** `/u/:slug`
*   **Features:**
    *   Fetches data from `GET /api/public/organizers/:slug`.
    *   Displays Header (Cover + Logo).
    *   Displays "About" section (Bio).
    *   Displays Grid of Active Campaigns.

#### Dashboard: `ProfileSettings.tsx`
*   **Route:** `/dashboard/profile`
*   **Features:**
    *   Form to upload Logo/Cover (using Cloudinary or existing upload logic).
    *   Input for Display Name and Slug.
    *   Rich Text Editor (WYSIWYG) for Bio (e.g., `react-quill` or `tiptap`).

## 5. Implementation Steps

1.  **Backend Model**: Update `User.ts` schema.
2.  **Backend Service**: Add `getPublicProfile(slug)` method to `UserService` or `CampaignService`.
3.  **Backend Controller**: Create endpoints for fetching public profile and updating settings.
4.  **Frontend API**: Update `api.service` to support the new endpoints.
5.  **Frontend Settings**: Create the `ProfileSettings` page in the Dashboard.
6.  **Frontend Public**: Create the `OrganizerLandingPage` and add the route.
7.  **Testing**: Verify multiple campaigns verify correctly on the landing page.
