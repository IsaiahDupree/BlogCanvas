/**
 * Test Auth on Deployment
 * Verifies manual login and Google OAuth redirect URLs
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DEPLOYMENT_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://blog-canvas.vercel.app';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

async function testLoginPageAccessible(): Promise<TestResult> {
  console.log('\n🔍 Test 1: Login page accessible');
  
  try {
    const response = await fetch(`${DEPLOYMENT_URL}/login`);
    
    if (response.ok || response.status === 200) {
      console.log(`   ✅ Login page accessible: ${DEPLOYMENT_URL}/login`);
      return { test: 'Login Page Accessible', status: 'pass', message: 'Login page loads correctly' };
    } else {
      console.log(`   ❌ Login page returned ${response.status}`);
      return { test: 'Login Page Accessible', status: 'fail', message: `HTTP ${response.status}` };
    }
  } catch (error: any) {
    console.log(`   ❌ Failed to reach login page: ${error.message}`);
    return { test: 'Login Page Accessible', status: 'fail', message: error.message };
  }
}

async function testAuthCallbackRoute(): Promise<TestResult> {
  console.log('\n🔍 Test 2: Auth callback route exists');
  
  try {
    // This should redirect to login since no code is provided
    const response = await fetch(`${DEPLOYMENT_URL}/auth/callback`, {
      redirect: 'manual'
    });
    
    // Should redirect (302/307) to login page
    if (response.status === 302 || response.status === 307 || response.status === 308) {
      const location = response.headers.get('location');
      console.log(`   ✅ Callback route redirects to: ${location}`);
      return { 
        test: 'Auth Callback Route', 
        status: 'pass', 
        message: 'Callback route exists and redirects',
        details: { redirectTo: location }
      };
    } else if (response.ok) {
      console.log(`   ⚠️ Callback returned 200 instead of redirect`);
      return { test: 'Auth Callback Route', status: 'warning', message: 'No redirect, returned 200' };
    } else {
      console.log(`   ❌ Callback returned ${response.status}`);
      return { test: 'Auth Callback Route', status: 'fail', message: `HTTP ${response.status}` };
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { test: 'Auth Callback Route', status: 'fail', message: error.message };
  }
}

async function testManualLoginAPI(): Promise<TestResult> {
  console.log('\n🔍 Test 3: Manual login API endpoint');
  
  try {
    const response = await fetch(`${DEPLOYMENT_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
        userType: 'vendor'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 401 || response.status === 400) {
      console.log(`   ✅ Login API responds correctly (rejects invalid credentials)`);
      return { 
        test: 'Manual Login API', 
        status: 'pass', 
        message: 'API endpoint works, rejects invalid credentials',
        details: data
      };
    } else if (response.ok) {
      console.log(`   ⚠️ Login API accepted test credentials (unexpected)`);
      return { test: 'Manual Login API', status: 'warning', message: 'Accepted test credentials' };
    } else {
      console.log(`   ❌ Login API returned ${response.status}`);
      return { test: 'Manual Login API', status: 'fail', message: `HTTP ${response.status}`, details: data };
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { test: 'Manual Login API', status: 'fail', message: error.message };
  }
}

async function testSupabaseGoogleOAuthConfig(): Promise<TestResult> {
  console.log('\n🔍 Test 4: Supabase Google OAuth configuration');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  
  // Check what redirect URLs should be configured in Supabase
  const expectedRedirectUrls = [
    `${DEPLOYMENT_URL}/auth/callback`,
    'http://localhost:4848/auth/callback',
    'http://localhost:3000/auth/callback'
  ];
  
  console.log('   Expected redirect URLs in Supabase dashboard:');
  expectedRedirectUrls.forEach(url => console.log(`     - ${url}`));
  
  return {
    test: 'Supabase OAuth Config',
    status: 'warning',
    message: 'Manual verification required',
    details: {
      supabaseUrl: SUPABASE_URL,
      requiredRedirectUrls: expectedRedirectUrls,
      instructions: [
        '1. Go to Supabase Dashboard > Authentication > URL Configuration',
        '2. Add Site URL: ' + DEPLOYMENT_URL,
        '3. Add Redirect URLs: ' + expectedRedirectUrls.join(', '),
        '4. Go to Authentication > Providers > Google',
        '5. Verify Authorized redirect URI includes: ' + SUPABASE_URL + '/auth/v1/callback'
      ]
    }
  };
}

async function testPortalLoginPage(): Promise<TestResult> {
  console.log('\n🔍 Test 5: Portal login page (client side)');
  
  try {
    const response = await fetch(`${DEPLOYMENT_URL}/portal/login`);
    
    if (response.ok || response.status === 200) {
      console.log(`   ✅ Portal login page accessible: ${DEPLOYMENT_URL}/portal/login`);
      return { test: 'Portal Login Page', status: 'pass', message: 'Portal login page loads correctly' };
    } else {
      console.log(`   ❌ Portal login page returned ${response.status}`);
      return { test: 'Portal Login Page', status: 'fail', message: `HTTP ${response.status}` };
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { test: 'Portal Login Page', status: 'fail', message: error.message };
  }
}

async function testMiddlewareRedirects(): Promise<TestResult> {
  console.log('\n🔍 Test 6: Middleware protects /app routes');
  
  try {
    const response = await fetch(`${DEPLOYMENT_URL}/app`, {
      redirect: 'manual'
    });
    
    // Should redirect to login if not authenticated
    if (response.status === 302 || response.status === 307 || response.status === 308) {
      const location = response.headers.get('location');
      console.log(`   ✅ Protected route redirects to: ${location}`);
      return { 
        test: 'Middleware Redirects', 
        status: 'pass', 
        message: 'Unauthenticated users redirected to login',
        details: { redirectTo: location }
      };
    } else if (response.ok) {
      console.log(`   ⚠️ /app route accessible without auth (check middleware)`);
      return { test: 'Middleware Redirects', status: 'warning', message: '/app accessible without auth' };
    } else {
      console.log(`   Status: ${response.status}`);
      return { test: 'Middleware Redirects', status: 'pass', message: `HTTP ${response.status} - protected` };
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { test: 'Middleware Redirects', status: 'fail', message: error.message };
  }
}

async function main() {
  console.log('🔐 BlogCanvas Auth Deployment Test');
  console.log('='.repeat(60));
  console.log(`Deployment URL: ${DEPLOYMENT_URL}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('='.repeat(60));

  const results: TestResult[] = [];

  results.push(await testLoginPageAccessible());
  results.push(await testPortalLoginPage());
  results.push(await testAuthCallbackRoute());
  results.push(await testManualLoginAPI());
  results.push(await testMiddlewareRedirects());
  results.push(await testSupabaseGoogleOAuthConfig());

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  let passed = 0, failed = 0, warnings = 0;
  
  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.test}: ${result.message}`);
    
    if (result.status === 'pass') passed++;
    else if (result.status === 'fail') failed++;
    else warnings++;
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Warnings: ${warnings}`);

  // Google OAuth specific instructions
  console.log('\n' + '='.repeat(60));
  console.log('🔧 GOOGLE OAUTH CONFIGURATION CHECKLIST');
  console.log('='.repeat(60));
  console.log(`
1. SUPABASE DASHBOARD (${SUPABASE_URL?.replace('.supabase.co', '')})
   Authentication > URL Configuration:
   - Site URL: ${DEPLOYMENT_URL}
   - Redirect URLs:
     • ${DEPLOYMENT_URL}/auth/callback
     • http://localhost:4848/auth/callback

2. GOOGLE CLOUD CONSOLE (console.cloud.google.com)
   APIs & Services > Credentials > OAuth 2.0 Client:
   - Authorized JavaScript origins:
     • ${DEPLOYMENT_URL}
     • http://localhost:4848
   - Authorized redirect URIs:
     • ${SUPABASE_URL}/auth/v1/callback

3. VERCEL ENVIRONMENT VARIABLES
   Verify these are set correctly:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_APP_URL = ${DEPLOYMENT_URL}
`);
}

main().catch(console.error);
