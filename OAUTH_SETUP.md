# OAuth Setup Guide for SiteGen

This guide will help you set up Google and Facebook OAuth providers for your SiteGen application.

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Existing GitHub OAuth (already configured)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Google OAuth (NEW)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Facebook OAuth (NEW)
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
```

## Setup Instructions

### 1. Google OAuth Setup

1. **Go to Google Cloud Console**

   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google+ API**

   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "People API" for better user info

3. **Create OAuth 2.0 Credentials**

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Name: "SiteGen"

4. **Configure Authorized URLs**

   - **Authorized JavaScript origins:**

     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)

   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)

5. **Get Your Credentials**
   - Copy the "Client ID" → `GOOGLE_CLIENT_ID`
   - Copy the "Client Secret" → `GOOGLE_CLIENT_SECRET`

### 2. Facebook OAuth Setup

1. **Go to Facebook Developers**

   - Visit: https://developers.facebook.com/
   - Click "My Apps" > "Create App"

2. **Create Facebook App**

   - Choose "Consumer" app type
   - App Name: "SiteGen"
   - Contact Email: your email
   - Choose a category: "Business"

3. **Add Facebook Login Product**

   - In your app dashboard, click "Add Product"
   - Find "Facebook Login" and click "Set Up"
   - Choose "Web" platform

4. **Configure Facebook Login Settings**

   - Go to "Facebook Login" > "Settings"
   - **Valid OAuth Redirect URIs:**
     - `http://localhost:3000/api/auth/callback/facebook` (for development)
     - `https://yourdomain.com/api/auth/callback/facebook` (for production)

5. **Get Your Credentials**
   - Go to "Settings" > "Basic"
   - Copy the "App ID" → `FACEBOOK_CLIENT_ID`
   - Copy the "App Secret" → `FACEBOOK_CLIENT_SECRET`
   - Make sure your app is in "Live" mode for production

### 3. User Data Mapping

The auth system will automatically map user data from each provider to your database schema:

#### Google provides:

- `id` → `accountId` in accounts table
- `name` → `name` in users table
- `email` → `email` in users table
- `picture` → `image` in users table
- `email_verified` → `emailVerified` in users table

#### Facebook provides:

- `id` → `accountId` in accounts table
- `name` → `name` in users table
- `email` → `email` in users table
- `picture.data.url` → `image` in users table

#### GitHub provides (existing):

- `id` → `accountId` in accounts table
- `name` or `login` → `name` in users table
- `email` → `email` in users table
- `avatar_url` → `image` in users table

## Testing Your Setup

1. **Start your development server:**

   ```bash
   npm run dev
   ```

2. **Test OAuth flows:**

   - Go to `http://localhost:3000`
   - Try signing in with each provider
   - Check your database to see user records created

3. **Check for errors:**
   - Look at browser console for any OAuth errors
   - Check your app's server logs
   - Verify redirect URIs match exactly

## Production Deployment

When deploying to production:

1. **Update OAuth app settings** in Google Cloud Console and Facebook Developers
2. **Add production URLs** to authorized domains/redirect URIs
3. **Update environment variables** on your hosting platform
4. **Test OAuth flows** on your live domain

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**

   - Double-check your redirect URIs in OAuth app settings
   - Ensure URLs match exactly (including http/https)

2. **"invalid_client" error**

   - Verify your client ID and secret are correct
   - Make sure OAuth app is enabled/published

3. **Permission denied errors**

   - Check if required APIs are enabled (Google)
   - Verify app is in Live mode (Facebook)

4. **Email not provided**
   - Request email permission in OAuth scopes
   - Some users may not have public emails

## Security Notes

- Never commit OAuth secrets to version control
- Use different OAuth apps for development and production
- Regularly rotate OAuth secrets
- Monitor OAuth app usage in provider dashboards

## Database Schema

Your existing database schema already supports multiple OAuth providers through the `accounts` table:

```sql
-- Each OAuth provider creates a record here
CREATE TABLE account (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,     -- Provider's user ID
  provider_id TEXT NOT NULL,    -- 'github', 'google', 'facebook'
  user_id TEXT NOT NULL,       -- Your internal user ID
  access_token TEXT,           -- OAuth access token
  refresh_token TEXT,          -- OAuth refresh token (if provided)
  -- ... other OAuth fields
);
```

Users can link multiple OAuth providers to the same account by signing in with different providers using the same email address.
