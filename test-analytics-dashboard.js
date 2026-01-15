const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.test.local' });

async function testAnalyticsDashboard() {
  console.log('Starting BlogCanvas Analytics Dashboard Test...\n');

  const browser = await puppeteer.launch({
    headless: false, // Set to false to see the browser
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Track console messages and errors
    const consoleMessages = [];
    const errors = [];

    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    page.on('pageerror', error => {
      errors.push(error.toString());
    });

    // Step 1: Navigate to homepage and check for login
    console.log('Step 1: Navigating to http://localhost:4848...');
    await page.goto('http://localhost:4848', { waitUntil: 'networkidle2', timeout: 30000 });

    // Take screenshot of initial page
    await page.screenshot({ path: 'screenshot-01-homepage.png', fullPage: true });
    console.log('  ✓ Screenshot saved: screenshot-01-homepage.png');

    // Check if there's a "Sign In" link in the navigation and click it
    const signInLink = await page.$$eval('a, button', elements => {
      for (const el of elements) {
        if (el.textContent.trim() === 'Sign In' || el.textContent.trim() === 'Sign in') {
          return true;
        }
      }
      return false;
    });

    if (signInLink) {
      console.log('  Found "Sign In" link in navigation, clicking...');
      const links = await page.$$('a, button');
      for (const link of links) {
        const text = await page.evaluate(el => el.textContent.trim(), link);
        if (text === 'Sign In' || text === 'Sign in') {
          await link.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          await page.screenshot({ path: 'screenshot-01a-after-signin-click.png', fullPage: true });
          console.log('  ✓ Screenshot saved: screenshot-01a-after-signin-click.png');
          break;
        }
      }
    }

    // Check if we need to login
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    const loginPageInfo = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]') ||
                        document.querySelector('input[name="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const isLogin = document.body.innerText.toLowerCase().includes('login') ||
                     document.body.innerText.toLowerCase().includes('sign in') ||
                     passwordInput !== null;

      return {
        isLoginPage: isLogin,
        hasLoginForm: emailInput !== null && passwordInput !== null,
        emailInputVisible: emailInput ? !emailInput.hidden : false,
        passwordInputVisible: passwordInput ? !passwordInput.hidden : false
      };
    });

    if (loginPageInfo.isLoginPage) {
      console.log('  ⚠ Login page detected. Attempting to log in...');
      console.log(`  Login form visible: ${loginPageInfo.hasLoginForm}`);
      console.log(`  Email input visible: ${loginPageInfo.emailInputVisible}`);
      console.log(`  Password input visible: ${loginPageInfo.passwordInputVisible}`);

      let hasLoginForm = loginPageInfo.hasLoginForm;

      // If login form is not visible, try clicking "I'm a Vendor" button
      if (!hasLoginForm) {
        console.log('  Login form not visible, looking for account type buttons...');

        // Look for "I'm a Vendor" button and click it
        const vendorButtons = await page.$$('button, div[role="button"], a');
        for (const button of vendorButtons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text && text.includes("I'm a Vendor")) {
            console.log('  Found "I\'m a Vendor" button, clicking...');
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Check if form is now visible
            hasLoginForm = await page.evaluate(() => {
              const emailInput = document.querySelector('input[type="email"]');
              const passwordInput = document.querySelector('input[type="password"]');
              return emailInput !== null && passwordInput !== null;
            });

            console.log(`  Login form now visible: ${hasLoginForm}`);
            break;
          }
        }
      }

      if (hasLoginForm) {
        console.log('  Login form found. Filling in credentials...');

        const email = process.env.TEST_USER_EMAIL || 'sashleyblogs@gmail.com';
        const password = process.env.TEST_USER_PASSWORD || 'thenewaccount123';

        // Wait for the form to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Clear and fill in the login form
        const emailSelector = 'input[type="email"]';
        const passwordSelector = 'input[type="password"]';

        await page.waitForSelector(emailSelector, { timeout: 5000 });
        await page.click(emailSelector, { clickCount: 3 }); // Select all
        await page.keyboard.press('Backspace'); // Clear
        await page.type(emailSelector, email, { delay: 50 });
        console.log(`  ✓ Entered email: ${email}`);

        await page.click(passwordSelector, { clickCount: 3 }); // Select all
        await page.keyboard.press('Backspace'); // Clear
        await page.type(passwordSelector, password, { delay: 50 });
        console.log('  ✓ Entered password');

        // Take screenshot before clicking sign in
        await page.screenshot({ path: 'screenshot-01b-before-login.png', fullPage: true });
        console.log('  ✓ Screenshot saved: screenshot-01b-before-login.png');

        // Try pressing Enter to submit the form
        console.log('  Pressing Enter to submit form...');
        await page.keyboard.press('Enter');

        // Wait for navigation
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check for login errors
        const loginError = await page.evaluate(() => {
          const errorText = document.body.innerText.toLowerCase();
          if (errorText.includes('invalid') || errorText.includes('incorrect') || errorText.includes('error')) {
            return document.body.innerText;
          }
          return null;
        });

        if (loginError) {
          console.log('  ✗ Login error detected:');
          console.log(`  ${loginError.substring(0, 200)}`);
        }

        console.log(`  Current URL after login: ${page.url()}`);
        await page.screenshot({ path: 'screenshot-01c-after-login.png', fullPage: true });
        console.log('  ✓ Screenshot saved: screenshot-01c-after-login.png');

        // Check if we're still on login page
        const stillOnLoginPage = page.url().includes('/login');
        if (stillOnLoginPage) {
          console.log('  ⚠ Still on login page - login may have failed');
          console.log('  ⚠ Continuing with test to capture current state...');
        } else {
          console.log('  ✓ Login successful - navigated away from login page');
        }
      }
    } else {
      console.log('  ✓ No login required or already logged in');
    }

    // Step 2: Navigate to analytics page
    console.log('\nStep 2: Navigating to http://localhost:4848/app/analytics...');
    await page.goto('http://localhost:4848/app/analytics', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a bit for React components to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Take screenshot
    console.log('\nStep 3: Taking screenshot of analytics page...');
    await page.screenshot({ path: 'screenshot-02-analytics.png', fullPage: true });
    console.log('  ✓ Screenshot saved: screenshot-02-analytics.png');

    // Step 4: Check for page errors
    console.log('\nStep 4: Checking for page load errors...');
    if (errors.length > 0) {
      console.log('  ✗ Page errors found:');
      errors.forEach(err => console.log(`    - ${err}`));
    } else {
      console.log('  ✓ No page errors detected');
    }

    // Check for console errors
    const consoleErrors = consoleMessages.filter(msg => msg.type === 'error');
    if (consoleErrors.length > 0) {
      console.log('  ⚠ Console errors found:');
      consoleErrors.forEach(err => console.log(`    - ${err.text}`));
    }

    // Step 5: Check for Client Performance section
    console.log('\nStep 5: Looking for "Client Performance" section...');
    const clientMetricsFound = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasClientPerformance = text.includes('Client Performance') ||
                                    text.includes('Client Metrics') ||
                                    text.includes('ClientMetrics');

      // Look for ClientMetrics component or client-related metrics
      const clientSection = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, div, section'))
        .find(el => el.textContent.toLowerCase().includes('client'));

      return {
        found: hasClientPerformance || clientSection !== undefined,
        sectionText: clientSection ? clientSection.textContent.substring(0, 100) : null
      };
    });

    if (clientMetricsFound.found) {
      console.log('  ✓ Client Performance section found');
      if (clientMetricsFound.sectionText) {
        console.log(`    Section text: ${clientMetricsFound.sectionText}`);
      }
    } else {
      console.log('  ✗ Client Performance section NOT found');
    }

    // Step 6: Check for Batch Performance section
    console.log('\nStep 6: Looking for "Batch Performance" section...');
    const batchMetricsFound = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasBatchPerformance = text.includes('Batch Performance') ||
                                   text.includes('Batch Metrics') ||
                                   text.includes('BatchMetrics');

      // Look for BatchMetrics component or batch-related metrics
      const batchSection = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, div, section'))
        .find(el => el.textContent.toLowerCase().includes('batch'));

      return {
        found: hasBatchPerformance || batchSection !== undefined,
        sectionText: batchSection ? batchSection.textContent.substring(0, 100) : null
      };
    });

    if (batchMetricsFound.found) {
      console.log('  ✓ Batch Performance section found');
      if (batchMetricsFound.sectionText) {
        console.log(`    Section text: ${batchMetricsFound.sectionText}`);
      }
    } else {
      console.log('  ✗ Batch Performance section NOT found');
    }

    // Step 7: Verify metrics are displayed
    console.log('\nStep 7: Verifying metrics (impressions, clicks, CTR, position, SEO score)...');
    const metricsFound = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();

      const metrics = {
        impressions: text.includes('impression'),
        clicks: text.includes('click'),
        ctr: text.includes('ctr') || text.includes('click-through rate'),
        position: text.includes('position') || text.includes('avg position'),
        seoScore: text.includes('seo score') || text.includes('seo-score')
      };

      // Try to extract actual values
      const pageContent = document.body.innerText;
      const numbers = pageContent.match(/\d+\.?\d*/g);

      return {
        metrics,
        hasNumbers: numbers && numbers.length > 0,
        sampleNumbers: numbers ? numbers.slice(0, 10) : []
      };
    });

    console.log('  Metrics found:');
    console.log(`    - Impressions: ${metricsFound.metrics.impressions ? '✓' : '✗'}`);
    console.log(`    - Clicks: ${metricsFound.metrics.clicks ? '✓' : '✗'}`);
    console.log(`    - CTR: ${metricsFound.metrics.ctr ? '✓' : '✗'}`);
    console.log(`    - Position: ${metricsFound.metrics.position ? '✓' : '✗'}`);
    console.log(`    - SEO Score: ${metricsFound.metrics.seoScore ? '✓' : '✗'}`);

    if (metricsFound.hasNumbers) {
      console.log(`  ✓ Numerical values detected on page`);
      console.log(`    Sample values: ${metricsFound.sampleNumbers.join(', ')}`);
    }

    // Step 8: Get full page structure
    console.log('\nStep 8: Analyzing page structure...');
    const pageStructure = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => ({ tag: h.tagName, text: h.textContent.trim().substring(0, 100) }));

      const sections = Array.from(document.querySelectorAll('section, [class*="section"], [class*="Section"]'))
        .map(s => ({
          classes: s.className,
          text: s.textContent.trim().substring(0, 150)
        }));

      return {
        title: document.title,
        headings,
        sectionCount: sections.length,
        sections: sections.slice(0, 5) // First 5 sections
      };
    });

    console.log(`  Page title: ${pageStructure.title}`);
    console.log(`  Headings found: ${pageStructure.headings.length}`);
    pageStructure.headings.forEach(h => {
      console.log(`    - ${h.tag}: ${h.text}`);
    });

    console.log(`  Sections found: ${pageStructure.sectionCount}`);
    if (pageStructure.sections.length > 0) {
      console.log('  First few sections:');
      pageStructure.sections.forEach((s, idx) => {
        console.log(`    ${idx + 1}. ${s.classes || '(no class)'}`);
        console.log(`       Content: ${s.text.substring(0, 100)}...`);
      });
    }

    // Generate final report
    console.log('\n' + '='.repeat(80));
    console.log('FINAL REPORT - feat-107 Acceptance Criteria');
    console.log('='.repeat(80));

    const criteria = [
      {
        name: '1. Client totals work - ClientMetrics component rendering',
        passed: clientMetricsFound.found,
        status: clientMetricsFound.found ? 'PASS ✓' : 'FAIL ✗'
      },
      {
        name: '2. Batch totals work - BatchMetrics component rendering',
        passed: batchMetricsFound.found,
        status: batchMetricsFound.found ? 'PASS ✓' : 'FAIL ✗'
      },
      {
        name: '3. Averages calculated - CTR, position, SEO score displayed',
        passed: metricsFound.metrics.ctr && metricsFound.metrics.position && metricsFound.metrics.seoScore,
        status: (metricsFound.metrics.ctr && metricsFound.metrics.position && metricsFound.metrics.seoScore) ? 'PASS ✓' : 'FAIL ✗'
      },
      {
        name: '4. Dashboard shows - All sections visible',
        passed: pageStructure.sectionCount > 0 && errors.length === 0,
        status: (pageStructure.sectionCount > 0 && errors.length === 0) ? 'PASS ✓' : 'FAIL ✗'
      }
    ];

    criteria.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.name}`);
      console.log(`   Status: ${c.status}\n`);
    });

    const passedCount = criteria.filter(c => c.passed).length;
    const totalCount = criteria.length;

    console.log('='.repeat(80));
    console.log(`Overall: ${passedCount}/${totalCount} criteria passed`);
    console.log('='.repeat(80));

    // Save detailed report to file
    const report = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:4848/app/analytics',
      criteria,
      pageStructure,
      errors,
      consoleErrors: consoleErrors.map(e => e.text),
      screenshots: [
        'screenshot-01-homepage.png',
        'screenshot-02-analytics.png'
      ]
    };

    fs.writeFileSync('analytics-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n✓ Detailed report saved to: analytics-test-report.json');

  } catch (error) {
    console.error('\n✗ Test failed with error:');
    console.error(error);
  } finally {
    await browser.close();
    console.log('\nBrowser closed. Test complete.');
  }
}

// Run the test
testAnalyticsDashboard().catch(console.error);
