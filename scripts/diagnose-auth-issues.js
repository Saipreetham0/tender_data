// Comprehensive authentication diagnosis script
// Run with: node scripts/diagnose-auth-issues.js

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Authentication Diagnosis Tool\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

console.log('📋 Environment Variables Check:');
console.log(`✅ Supabase URL: ${supabaseUrl}`);
console.log(`✅ Supabase Key: ${supabaseKey ? 'SET (' + supabaseKey.length + ' chars)' : 'MISSING'}`);
console.log(`✅ Google Client ID: ${googleClientId}`);
console.log(`✅ Google Secret: ${googleClientSecret ? 'SET' : 'MISSING'}`);
console.log(`✅ Base URL: ${baseUrl}`);

console.log('\n🎯 Auth Flow URLs (PORT CHANGED TO 3001):');
console.log('Previous working port: 3000');
console.log('Current dev server port: 3001');
console.log('This could break authentication redirects!\n');

console.log('📍 Current Redirect URLs:');
console.log(`Magic Link: ${baseUrl}/auth/callback`);
console.log(`Google OAuth: ${supabaseUrl}/auth/v1/callback`);
console.log(`Dev Server: http://localhost:3001/auth/callback`);

console.log('\n⚠️  PORT MISMATCH ISSUE:');
console.log('If your authentication was working on port 3000 but now');
console.log('development server runs on 3001, this breaks redirects!');

console.log('\n🔧 SOLUTIONS:');
console.log('1. KILL PROCESS ON PORT 3000:');
console.log('   lsof -ti:3000 | xargs kill -9');
console.log('   Then restart: npm run dev');

console.log('\n2. UPDATE REDIRECT URLs (if keeping port 3001):');
console.log('   Google Cloud Console:');
console.log('   - Change: http://localhost:3000/auth/callback');
console.log('   - To: http://localhost:3001/auth/callback');
console.log('');
console.log('   Supabase Dashboard:');
console.log('   - Update redirect URLs to use port 3001');

console.log('\n3. TEST MAGIC LINK LOCALLY:');
console.log('   Magic links redirect to production URL by default');
console.log('   For local testing, they should redirect to localhost:3001');

console.log('\n🧪 TESTING STEPS:');
console.log('1. Fix port issue first');
console.log('2. Test at: http://localhost:3001/login');
console.log('3. Try magic link with a test email');
console.log('4. Try Google sign-in');
console.log('5. Check browser console for errors');
console.log('6. Check network tab for failed requests');

console.log('\n🚨 COMMON AUTHENTICATION ISSUES:');
console.log('• Port mismatch (3000 vs 3001)');
console.log('• Cache with wrong URLs');
console.log('• Missing redirect URLs in providers');
console.log('• Wrong environment variables');
console.log('• Supabase service issues');

console.log('\n📞 IMMEDIATE ACTION:');
console.log('Run: lsof -ti:3000 | xargs kill -9');
console.log('Then: npm run dev');
console.log('Should start on port 3000 again');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ CRITICAL: Missing Supabase configuration!');
} else if (!googleClientId || !googleClientSecret) {
  console.log('\n⚠️  WARNING: Google OAuth not fully configured!');
} else {
  console.log('\n✅ All environment variables present.');
  console.log('🎯 Focus on port mismatch issue.');
}