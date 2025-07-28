# 🚀 Production Deployment Checklist

## 📋 Pre-Deployment Checklist

### 🔧 Environment Configuration
- [ ] All environment variables set in Vercel
- [ ] Production URLs configured
- [ ] SSL certificates active
- [ ] Custom domain configured

### 🔐 Authentication Setup
- [ ] Google OAuth configured in Google Cloud Console
- [ ] All redirect URLs added to Google OAuth
- [ ] Supabase Google provider enabled
- [ ] Supabase redirect URLs configured
- [ ] Test authentication flow

### 💳 Payment Setup
- [ ] Razorpay production keys configured
- [ ] Webhook endpoints configured
- [ ] Test payment flow
- [ ] Currency conversion verified (paise)

### 🗄️ Database Setup
- [ ] Supabase production database ready
- [ ] All tables created with proper schema
- [ ] RLS policies enabled
- [ ] Indexes created for performance
- [ ] Subscription plans seeded

### 🔒 Security Configuration
- [ ] CSP headers configured
- [ ] CORS properly set
- [ ] API rate limiting enabled
- [ ] Secret keys secured
- [ ] No sensitive data in client code

## 🧪 Testing Checklist

### Authentication Testing
- [ ] Google sign-in works
- [ ] Magic link sign-in works  
- [ ] Sign-out works
- [ ] Session persistence works
- [ ] Auth callback handles errors

### Payment Testing
- [ ] Subscription purchase works
- [ ] Correct amount displayed (₹1,499)
- [ ] Payment verification works
- [ ] Subscription activation works
- [ ] Payment history recorded

### Core Functionality
- [ ] Dashboard loads correctly
- [ ] Tender data displays
- [ ] Search and filtering work
- [ ] API endpoints respond correctly
- [ ] Email notifications work

### Performance Testing
- [ ] Page load times acceptable
- [ ] API response times good
- [ ] Database queries optimized
- [ ] Images optimized
- [ ] Bundle size reasonable

## 🔧 Google OAuth Production Setup

### 1. Google Cloud Console
```
✅ Project: RGUKT Tenders
✅ OAuth consent screen configured
✅ Client ID: 1065336223459-edna2b3ausdvvgumt58ek503b8qm6a30.apps.googleusercontent.com
✅ Authorized origins: https://tender-data.vercel.app, https://djbjiqanbuyciptstrqc.supabase.co
✅ Redirect URIs: https://tender-data.vercel.app/auth/callback, https://djbjiqanbuyciptstrqc.supabase.co/auth/v1/callback
```

### 2. Supabase Configuration
```
✅ Project: djbjiqanbuyciptstrqc
✅ Google provider enabled
✅ Client credentials configured
✅ Site URL: https://tender-data.vercel.app
✅ Redirect URLs: https://tender-data.vercel.app/auth/callback
```

## 🔧 Environment Variables (Vercel)

### Required Production Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://djbjiqanbuyciptstrqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth
GOOGLE_CLIENT_ID=1065336223459-edna2b3ausdvvgumt58ek503b8qm6a30.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Payment
RAZORPAY_KEY_ID=rzp_live_saQZVBwftHYNK6
RAZORPAY_KEY_SECRET=QFhBuBMTdajJqTcs6wtK1eCz
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_saQZVBwftHYNK6

# App URLs
NEXT_PUBLIC_API_BASE_URL=https://tender-data.vercel.app
VERCEL_URL=https://tender-data.vercel.app

# Security
JWT_SECRET=yjMf75QE8tSlDNXprNQl49JAiNBvua0jq8l8oikNjEznKxZq1YvlLDycTKNaPEwQAuVZ80aiFDGJ2P8mR9TU/A==
CRON_API_SECRET_KEY=73a80cef7db4ca22fee915c22779abdca8d3565776595f87c30fe530f1d4c052

# Email
RESEND_API_KEY=re_D313EGP3_HbJxHU1aC48Cy64xvs4jczM4
RESEND_FROM_EMAIL=tenders@kspelectronics.in
NOTIFICATION_EMAILS=hi@saipreetham.com
```

## 🚀 Deployment Steps

### 1. Final Code Review
- [ ] Remove console.logs from production code
- [ ] Update error messages for users
- [ ] Verify all TODOs resolved
- [ ] Code quality check passed

### 2. Build Testing
- [ ] `npm run build` succeeds
- [ ] `npm run start` works locally
- [ ] No TypeScript errors
- [ ] No linting errors

### 3. Vercel Deployment
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Deploy successful

### 4. Post-Deployment Testing
- [ ] Site loads correctly
- [ ] Authentication works
- [ ] Payments work
- [ ] APIs respond correctly
- [ ] Database operations work

## 🔍 Monitoring Setup

### Performance Monitoring
- [ ] Vercel Analytics enabled
- [ ] Core Web Vitals tracked
- [ ] Error tracking configured

### Business Monitoring  
- [ ] Payment success rates
- [ ] User registration rates
- [ ] Subscription conversion rates
- [ ] API usage patterns

## 🔧 Post-Launch Tasks

### Week 1
- [ ] Monitor error rates
- [ ] Check payment flows
- [ ] Verify email delivery
- [ ] User feedback collection

### Week 2-4
- [ ] Performance optimization
- [ ] SEO improvements
- [ ] Feature usage analysis
- [ ] Support ticket patterns

## 🆘 Rollback Plan

### If Issues Occur
1. **Immediate**: Roll back to previous Vercel deployment
2. **Database**: Backup current state before changes
3. **Environment**: Keep staging environment for testing
4. **Communication**: User notification plan ready

## ✅ Sign-off

- [ ] Development Team: All features tested
- [ ] Product Owner: Requirements met
- [ ] Security Team: Security review passed
- [ ] DevOps: Infrastructure ready
- [ ] Support Team: Documentation updated

**Deployment Date**: _________________
**Deployed By**: _________________
**Version**: v1.0.0

---

**🎉 Ready for Production!**