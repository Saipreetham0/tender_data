# Google OAuth Production Setup

## 🔧 Google Cloud Console Configuration

### 1. Create Google OAuth 2.0 Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** for user type
3. Fill in required fields:
   - **App name**: RGUKT Tenders Portal
   - **User support email**: Your support email
   - **Developer contact email**: Your email
   - **App domain**: `https://tender-data.vercel.app`
   - **Privacy Policy**: `https://tender-data.vercel.app/privacy`
   - **Terms of Service**: `https://tender-data.vercel.app/terms`

### 3. OAuth 2.0 Client Configuration

**Application type**: Web application

**Authorized JavaScript origins**:
```
https://tender-data.vercel.app
https://djbjiqanbuyciptstrqc.supabase.co
```

**Authorized redirect URIs**:
```
https://tender-data.vercel.app/auth/callback
https://djbjiqanbuyciptstrqc.supabase.co/auth/v1/callback
```

## 🔧 Supabase Configuration

### 1. Enable Google Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** > **Providers**
3. Enable **Google** provider
4. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

### 2. Configure Redirect URLs

In Supabase **Authentication** > **URL Configuration**:

**Site URL**: `https://tender-data.vercel.app`

**Redirect URLs**:
```
https://tender-data.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

## 🔧 Environment Variables

### Production (.env.production or Vercel)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://djbjiqanbuyciptstrqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# App URLs
NEXT_PUBLIC_API_BASE_URL=https://tender-data.vercel.app
VERCEL_URL=https://tender-data.vercel.app
```

### Development (.env.local)
```bash
# Same as above but with localhost URLs for testing
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

## 🔧 Code Changes Made

### 1. Production-Aware Redirect URLs
```typescript
const redirectUrl = process.env.NODE_ENV === 'production' 
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/callback`
  : `${window.location.origin}/auth/callback`;
```

### 2. Enhanced Google OAuth Options
```typescript
options: {
  redirectTo: redirectUrl,
  queryParams: {
    access_type: 'offline',
    prompt: 'consent',
  },
}
```

## 🔧 Vercel Deployment Setup

### 1. Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add all production environment variables

### 2. Domain Configuration

Ensure your custom domain is properly configured:
- **Production Domain**: `https://tender-data.vercel.app`
- **Preview URLs**: Also work with OAuth (optional)

## 🔧 Testing

### 1. Development Testing
```bash
npm run dev
# Test at http://localhost:3000
```

### 2. Production Testing
```bash
npm run build
npm run start
# Or deploy to Vercel and test
```

## 🚨 Common Issues & Fixes

### Issue 1: Redirect URI Mismatch
**Error**: `redirect_uri_mismatch`
**Fix**: Ensure all redirect URIs are added in Google Cloud Console

### Issue 2: Invalid Client
**Error**: `invalid_client`
**Fix**: Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct

### Issue 3: Supabase Provider Not Configured
**Error**: Provider not available
**Fix**: Enable Google provider in Supabase dashboard

### Issue 4: CORS Issues
**Error**: CORS blocked
**Fix**: Add your domain to authorized JavaScript origins

## ✅ Production Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 client ID created
- [ ] All redirect URIs added
- [ ] Supabase Google provider enabled
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Testing completed

## 🔧 Monitoring

### Google Cloud Console
- Monitor API usage in **APIs & Services** > **Dashboard**
- Check quota limits

### Supabase Dashboard
- Monitor auth events in **Authentication** > **Users**
- Check logs for errors

---

**Last Updated**: January 2025
**Environment**: Production Ready