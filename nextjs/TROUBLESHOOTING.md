# Troubleshooting Guide

## Login Issues

### Problem: Can't login, redirected to `/login?from=%2Fdashboard`

**Root Cause:** The middleware was checking for a token in cookies, but the auth service was only storing it in localStorage.

**Fix Applied:**
- Updated `lib/services/auth.service.ts` to store token in both localStorage AND cookies
- Updated `lib/contexts/auth-context.tsx` to delete cookie on logout

### How to Test the Fix

1. **Clear your browser data:**
   - Open DevTools (F12)
   - Go to Application tab
   - Clear all cookies and localStorage
   - Or use: `localStorage.clear()` in console

2. **Check backend is running:**
   ```bash
   # In a separate terminal, navigate to backend folder
   cd backend
   npm run dev
   ```
   Backend should be running on `http://localhost:5000`

3. **Try logging in:**
   - Go to `http://localhost:3000/login`
   - Enter your credentials
   - Open browser console (F12) to see debug logs
   - You should see:
     ```
     Attempting login with: your@email.com
     Auth service: Sending login request to API
     Auth service: Received response from API
     Auth service: Storing user data and token
     Auth service: Token stored in localStorage and cookie
     Login successful, response: {...}
     User set in context
     Redirecting to: /dashboard
     ```

4. **Verify token is stored:**
   - Open DevTools → Application tab
   - Check **Local Storage** → should see `token` and `user`
   - Check **Cookies** → should see `token` cookie

### Common Issues

#### 1. Backend Not Running
**Symptom:** Network error, "Failed to login"

**Solution:**
```bash
cd backend
npm run dev
```

#### 2. CORS Error
**Symptom:** "CORS policy" error in console

**Solution:** Check backend CORS configuration allows `http://localhost:3000`

#### 3. Invalid Credentials
**Symptom:** "Invalid credentials" error message

**Solution:** 
- Make sure you have a registered account
- Try registering at `/register` first
- Check backend database has the user

#### 4. Token Not Persisting
**Symptom:** Logged in but redirected back to login on refresh

**Solution:**
- Clear browser cache and cookies
- Make sure cookies are enabled
- Check cookie is being set (DevTools → Application → Cookies)

#### 5. Middleware Redirect Loop
**Symptom:** Keeps redirecting between login and dashboard

**Solution:**
- Clear all cookies and localStorage
- Restart the Next.js dev server
- Try logging in again

### Debug Checklist

- [ ] Backend is running on port 5000
- [ ] Frontend is running on port 3000
- [ ] Browser console shows no errors
- [ ] Network tab shows successful POST to `/api/auth/login`
- [ ] Response includes `token` field
- [ ] Token is stored in localStorage
- [ ] Token is stored in cookies
- [ ] No CORS errors

### Testing Login Flow

1. **Start fresh:**
   ```javascript
   // In browser console
   localStorage.clear();
   document.cookie.split(";").forEach(c => {
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   ```

2. **Navigate to login:**
   ```
   http://localhost:3000/login
   ```

3. **Enter credentials and submit**

4. **Check console for logs**

5. **Should redirect to dashboard**

### API Endpoints

Make sure these endpoints work:

- `POST http://localhost:5000/api/auth/login`
  - Body: `{ "email": "user@example.com", "password": "password" }`
  - Response: `{ "token": "...", "email": "...", "_id": "...", ... }`

- `POST http://localhost:5000/api/auth/register`
  - Body: `{ "name": "...", "email": "...", "password": "..." }`
  - Response: `{ "token": "...", "email": "...", "_id": "...", ... }`

### Test with cURL

```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Should return:
# {"token":"...","email":"test@example.com","_id":"..."}
```

### Still Having Issues?

1. Check the browser console for errors
2. Check the Network tab for failed requests
3. Check the backend logs for errors
4. Make sure `.env.local` has correct API URL
5. Try restarting both frontend and backend servers

### Environment Variables

Make sure `.env.local` has:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
API_URL=http://localhost:5000/api
```

### Quick Fix Script

Run this in browser console to reset everything:
```javascript
// Clear all auth data
localStorage.clear();
sessionStorage.clear();

// Clear all cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

// Reload page
location.reload();
```

