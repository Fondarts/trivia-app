# Google OAuth Configuration Guide

## Current Issue
Error: `{"code":500,"error_code":"unexpected_failure"}` and "message channel closed" errors indicate Google OAuth client configuration problems.

## Found Problem: Mismatched Client IDs ✅ FIXED
- **HTML Meta Tag**: Was using `248373888536-7k054s2rboa518esqgnn9gbp9c8c0qqt`
- **Auth Config**: Using `339736953753-h9oekqkii28804iv84r5mqad61p7m4es`
- **Fixed**: Updated HTML to use consistent Client ID

## Google Cloud Console Configuration Required

You MUST configure your Google OAuth client with the correct origins:

### 1. Go to Google Cloud Console
- URL: https://console.cloud.google.com/apis/credentials
- Select your project that contains: `339736953753-h9oekqkii28804iv84r5mqad61p7m4es.apps.googleusercontent.com`

### 2. Find Your OAuth 2.0 Client ID
- Look for: `339736953753-h9oekqkii28804iv84r5mqad61p7m4es`
- Click the ✏️ (edit) button

### 3. Configure Authorized JavaScript Origins
Add these URLs to "Authorized JavaScript origins":

```
http://192.168.0.21:8100
http://127.0.0.1:8100
http://localhost:8100
https://fpjkdibubjdbskthofdp.supabase.co
```

### 4. Configure Authorized Redirect URIs
Add these URLs to "Authorized redirect URIs":

```
http://192.168.0.21:8100/index.html
http://127.0.0.1:8100/index.html
http://localhost:8100/index.html
https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback
```

### 5. Save Configuration
- Click "SAVE" button
- Wait 5-10 minutes for changes to propagate

## Testing the Fix

1. **Clear browser cache** completely
2. **Reload the app**: http://192.168.0.21:8100
3. **Open Developer Console** (F12)
4. **Try Google Login** - check console for logs
5. **Should now work** without 500 errors

## Alternative: Create New OAuth Client

If the above doesn't work, create a new OAuth 2.0 client:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click "CREATE CREDENTIALS" → "OAuth 2.0 Client ID"
3. Application type: "Web application"
4. Name: "Quizle Local Development"
5. Add the origins and redirect URIs listed above
6. Copy the new Client ID
7. Update `www/js/auth/auth_v2.js` with the new Client ID

## Common Issues

- **"origin_mismatch"**: JavaScript origin not added to Google Console
- **"redirect_uri_mismatch"**: Redirect URI not added to Google Console
- **"invalid_client"**: Wrong Client ID or not configured properly
- **"popup_blocked"**: Browser blocking OAuth popup (disable popup blocker)

## Current Configuration

- **Client ID**: `339736953753-h9oekqkii28804iv84r5mqad61p7m4es.apps.googleusercontent.com`
- **Server**: `http://192.168.0.21:8100`
- **Supabase**: `https://fpjkdibubjdbskthofdp.supabase.co`