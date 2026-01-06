# Testing Checklist - Next.js Migration

Use this checklist to verify all features work correctly after migration.

## ✅ Pre-Testing Setup

- [ ] Backend API is running on `http://localhost:5000`
- [ ] MongoDB database is connected
- [ ] `.env.local` file is configured with correct API URL
- [ ] Dependencies are installed (`npm install`)
- [ ] Development server is running (`npm run dev`)

## 🔐 Authentication Tests

### Registration
- [ ] Navigate to `/register`
- [ ] Fill in all required fields
- [ ] Submit form
- [ ] Verify success message appears
- [ ] Verify redirect to dashboard
- [ ] Verify user is logged in (check localStorage for token)

### Login
- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] Submit form
- [ ] Verify redirect to dashboard
- [ ] Verify user data is stored in localStorage

### Login - Error Cases
- [ ] Try logging in with invalid email
- [ ] Try logging in with wrong password
- [ ] Verify error messages display correctly

### Forgot Password
- [ ] Navigate to `/forgot-password`
- [ ] Enter registered email
- [ ] Submit form
- [ ] Verify success message
- [ ] Check email for reset link (if email service configured)

### Reset Password
- [ ] Click reset link from email (or navigate to `/reset-password?token=xxx`)
- [ ] Enter new password
- [ ] Confirm new password
- [ ] Submit form
- [ ] Verify success message
- [ ] Try logging in with new password

### Logout
- [ ] Click logout button
- [ ] Verify redirect to home page
- [ ] Verify localStorage is cleared
- [ ] Try accessing protected route (should redirect to login)

## 📊 Dashboard Tests

- [ ] Navigate to `/dashboard`
- [ ] Verify user's campaigns are displayed
- [ ] Verify "Create New Campaign" button is visible
- [ ] Verify campaign cards show correct information
- [ ] Click on a campaign card
- [ ] Verify redirect to campaign detail page

## 🎯 Campaign Management Tests

### Create Campaign
- [ ] Click "Create New Campaign" from dashboard
- [ ] Fill in campaign details:
  - [ ] Title
  - [ ] Slug (verify uniqueness validation)
  - [ ] Description
  - [ ] Campaign type
  - [ ] Garment type
  - [ ] Currency
- [ ] Submit form
- [ ] Verify success message
- [ ] Verify redirect to campaign detail page
- [ ] Verify campaign appears in dashboard

### View Campaign Details
- [ ] Navigate to a campaign detail page
- [ ] Verify all campaign information displays correctly
- [ ] Verify statistics cards show correct data:
  - [ ] Total Sponsors
  - [ ] Paid Sponsors
  - [ ] Total Revenue
  - [ ] Pending Revenue
- [ ] Verify action buttons are present:
  - [ ] View Public Page
  - [ ] Configure Layout
  - [ ] Logo Approvals

### Update Campaign
- [ ] From campaign detail, click edit button (if available)
- [ ] Update campaign information
- [ ] Save changes
- [ ] Verify changes are reflected

### Delete Campaign
- [ ] From campaign detail or dashboard, click delete
- [ ] Confirm deletion
- [ ] Verify campaign is removed from dashboard

## 🎨 Layout Configuration Tests

- [ ] Navigate to `/campaigns/[id]/layout-config`
- [ ] Select "Flexible Grid" layout
- [ ] Set grid columns and rows
- [ ] Save configuration
- [ ] Verify success message
- [ ] Navigate back to campaign detail
- [ ] View public page to verify layout

- [ ] Return to layout config
- [ ] Select "Word Cloud" layout
- [ ] Set maximum words
- [ ] Save configuration
- [ ] Verify on public page

## 🖼️ Logo Approval Tests

- [ ] Navigate to `/campaigns/[id]/logo-approval`
- [ ] Verify pending logos tab shows sponsors awaiting approval
- [ ] Click "Approve" on a logo
- [ ] Verify logo moves to "Approved" tab
- [ ] Verify success message

- [ ] Click "Reject" on a logo
- [ ] Enter rejection reason
- [ ] Submit
- [ ] Verify logo is rejected
- [ ] Verify rejection reason is stored

## 🌐 Public Campaign Page Tests

- [ ] Navigate to `/c/[campaign-slug]`
- [ ] Verify campaign information displays correctly
- [ ] Verify campaign description renders (with rich text if applicable)
- [ ] Verify sponsor layout displays correctly
- [ ] Verify approved sponsors are shown
- [ ] Verify rejected/pending sponsors are NOT shown

### Sponsor Checkout (if Stripe configured)
- [ ] Click "Become a Sponsor" or similar button
- [ ] Fill in sponsor information:
  - [ ] Name
  - [ ] Email
  - [ ] Amount
  - [ ] Message (optional)
- [ ] Upload logo (if applicable)
- [ ] Select payment method
- [ ] Complete checkout
- [ ] Verify redirect to success page
- [ ] Verify sponsor appears in campaign (pending approval)

## 👤 Profile Tests

- [ ] Navigate to `/profile`
- [ ] Verify current user information displays
- [ ] Update profile fields:
  - [ ] Name
  - [ ] Email
  - [ ] Organization
- [ ] Save changes
- [ ] Verify success message
- [ ] Refresh page and verify changes persist

### Change Password
- [ ] Navigate to profile
- [ ] Click "Change Password"
- [ ] Enter current password
- [ ] Enter new password
- [ ] Confirm new password
- [ ] Submit
- [ ] Verify success message
- [ ] Log out and log in with new password

## 🔒 Route Protection Tests

- [ ] Log out
- [ ] Try accessing `/dashboard` (should redirect to `/login`)
- [ ] Try accessing `/campaigns/new` (should redirect to `/login`)
- [ ] Try accessing `/profile` (should redirect to `/login`)
- [ ] Log in
- [ ] Verify redirect to originally requested page

## 📱 Responsive Design Tests

- [ ] Test on mobile viewport (375px width)
- [ ] Test on tablet viewport (768px width)
- [ ] Test on desktop viewport (1920px width)
- [ ] Verify all pages are responsive
- [ ] Verify navigation works on mobile
- [ ] Verify forms are usable on mobile

## 🎨 UI/UX Tests

- [ ] Verify Ant Design components render correctly
- [ ] Verify custom fonts (Archivo, Montserrat) load
- [ ] Verify loading states show during API calls
- [ ] Verify error messages display correctly
- [ ] Verify success messages display correctly
- [ ] Verify form validation works
- [ ] Verify buttons have proper hover states

## 🐛 Error Handling Tests

- [ ] Stop backend server
- [ ] Try making API calls
- [ ] Verify error messages display
- [ ] Restart backend
- [ ] Verify app recovers

- [ ] Enter invalid data in forms
- [ ] Verify validation errors display
- [ ] Verify form doesn't submit with errors

## 🚀 Performance Tests

- [ ] Check page load times
- [ ] Verify images are optimized (Next.js Image component)
- [ ] Check for console errors
- [ ] Check for console warnings
- [ ] Verify no memory leaks (check DevTools Memory tab)

## 📝 Notes

Record any issues found during testing:

1. 
2. 
3. 

## ✅ Sign-Off

- [ ] All critical features tested and working
- [ ] All bugs documented
- [ ] Ready for production deployment

**Tested by**: _______________
**Date**: _______________
**Version**: _______________

