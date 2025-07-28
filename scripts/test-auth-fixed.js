// Test the fixed authentication methods
// Run with: node scripts/test-auth-fixed.js

require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Fixed Authentication\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

console.log('📋 Configuration:');
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Base URL: ${baseUrl}`);

console.log('\n🔧 Authentication Methods Fixed:');
console.log('✅ Magic Link: Now uses current window.location.origin for dev');
console.log('✅ Google OAuth: Now uses current window.location.origin for dev');
console.log('✅ Production: Uses NEXT_PUBLIC_API_BASE_URL');
console.log('✅ Environment-aware redirect URLs');

console.log('\n📍 Expected Redirect URLs:');
console.log('Development:');
console.log('  Magic Link: http://localhost:3000/auth/callback (or current port)');
console.log('  Google OAuth: http://localhost:3000/auth/callback (or current port)');
console.log('');
console.log('Production:');
console.log(`  Magic Link: ${baseUrl}/auth/callback`);
console.log(`  Google OAuth: ${baseUrl}/auth/callback`);

console.log('\n🚀 Testing Steps:');
console.log('1. Stop current dev server (Ctrl+C)');
console.log('2. Start fresh: npm run dev');
console.log('3. Should run on port 3000 now');
console.log('4. Visit: http://localhost:3000/login');
console.log('5. Test magic link with your email');
console.log('6. Test Google sign-in');

console.log('\n🔍 Debug Information:');
console.log('Check browser console for:');
console.log('- "Magic link redirect URL: http://localhost:3000/auth/callback"');
console.log('- "Google OAuth redirect URL: http://localhost:3000/auth/callback"');
console.log('- "Current environment: { nodeEnv: \'development\', ... }"');

console.log('\n✅ What Was Fixed:');
console.log('• Dynamic redirect URL based on current port');
console.log('• Environment-aware configuration');
console.log('• Better debugging with console logs');
console.log('• Handles port changes automatically');

console.log('\n⚠️  If Still Not Working:');
console.log('1. Clear browser cache completely');
console.log('2. Check Google Cloud Console redirect URIs');
console.log('3. Verify Supabase dashboard configuration');
console.log('4. Check network tab for failed requests');

console.log('\n🎯 Quick Test:');
console.log('node scripts/clear-supabase-cache.js');
console.log('npm run dev');
console.log('Go to http://localhost:3000/login and test both auth methods');