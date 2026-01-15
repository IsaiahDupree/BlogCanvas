#!/usr/bin/env node

/**
 * Test Script for feat-146: Pipeline Page Topic Selection Checkboxes
 *
 * Verification Checklist:
 * 1. Navigate to http://localhost:4848/app/pipeline
 * 2. Check if the page loads without errors
 * 3. Look for checkbox elements (individual topic checkboxes and "select all" checkbox)
 * 4. Verify checkbox functionality:
 *    - Individual checkboxes are visible next to each topic
 *    - "Select all" checkbox exists in the header
 *    - Clicking checkboxes updates the selection
 *    - Selected count is displayed in "Create Batch (X)" button
 * 5. Return detailed report on acceptance criteria
 *
 * Acceptance Criteria:
 * - Checkboxes render
 * - Toggle works (select/deselect)
 * - Count shown
 * - Selection persists during interaction
 */

import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const TARGET_URL = 'http://localhost:4848/app/pipeline';
const LOGIN_URL = 'http://localhost:4848/login';
const TIMEOUT = 30000;

// Test credentials from .env.local
const TEST_EMAIL = 'sashleyblogs@gmail.com';
const TEST_PASSWORD = 'thenewaccount123';

async function login(page) {
  console.log('🔐 Logging in...');

  // Navigate to login page
  await page.goto(LOGIN_URL, {
    waitUntil: 'networkidle2',
    timeout: TIMEOUT
  });

  // Take screenshot of login page
  await page.screenshot({
    path: '/Users/isaiahdupree/Documents/Software/BlogCanvas/screenshot-feat-146-00a-login-page.png',
    fullPage: true
  });
  console.log('📸 Screenshot of login page saved');

  // Get page URL to see where we are
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);

  // Wait for any email input
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  // Fill in credentials
  await page.type('input[type="email"]', TEST_EMAIL);
  await page.type('input[type="password"]', TEST_PASSWORD);

  // Take screenshot before clicking login
  await page.screenshot({
    path: '/Users/isaiahdupree/Documents/Software/BlogCanvas/screenshot-feat-146-00b-filled-login.png',
    fullPage: true
  });

  // Click login button - try multiple selectors
  const loginButton = await page.$('button[type="submit"]') ||
                      await page.$('button:has-text("Sign In")') ||
                      await page.$('button:has-text("Login")');

  if (loginButton) {
    await loginButton.click();
  } else {
    throw new Error('Login button not found');
  }

  // Wait for navigation after login
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT });
  } catch (e) {
    // Sometimes navigation doesn't occur if already authenticated
    console.log('Navigation timeout (might be already on destination)');
  }

  // Take screenshot after login
  await page.screenshot({
    path: '/Users/isaiahdupree/Documents/Software/BlogCanvas/screenshot-feat-146-00c-after-login.png',
    fullPage: true
  });

  console.log('✅ Logged in successfully');
  return true;
}

async function waitForNetworkIdle(page, timeout = 5000) {
  return new Promise((resolve) => {
    let timer;
    const onIdle = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        page.removeListener('request', onRequest);
        page.removeListener('requestfinished', onRequest);
        page.removeListener('requestfailed', onRequest);
        resolve();
      }, timeout);
    };

    const onRequest = () => {
      clearTimeout(timer);
      timer = setTimeout(onIdle, 500);
    };

    page.on('request', onRequest);
    page.on('requestfinished', onRequest);
    page.on('requestfailed', onRequest);

    onIdle();
  });
}

async function runTest() {
  const report = {
    testName: 'feat-146: Pipeline Page Topic Selection Checkboxes',
    timestamp: new Date().toISOString(),
    url: TARGET_URL,
    results: [],
    acceptanceCriteria: {
      checkboxesRender: false,
      toggleWorks: false,
      countShown: false,
      selectionPersists: false
    },
    errors: [],
    screenshots: [],
    summary: ''
  };

  let browser;
  try {
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Enable console logging from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => {
      console.error('PAGE ERROR:', error.message);
      report.errors.push({ type: 'pageerror', message: error.message });
    });

    console.log(`\n📍 Step 0: Authenticate`);
    try {
      await login(page);
      report.results.push({ step: 0, status: 'PASS', message: 'Authentication successful' });
      console.log('✅ Authentication successful');
    } catch (error) {
      report.results.push({ step: 0, status: 'FAIL', message: `Failed to authenticate: ${error.message}` });
      report.errors.push({ type: 'authentication', message: error.message });
      console.error('❌ Failed to authenticate:', error.message);
      throw error;
    }

    console.log(`\n📍 Step 1: Navigate to ${TARGET_URL}`);
    try {
      await page.goto(TARGET_URL, {
        waitUntil: 'networkidle2',
        timeout: TIMEOUT
      });
      report.results.push({ step: 1, status: 'PASS', message: 'Page loaded successfully' });
      console.log('✅ Page loaded successfully');
    } catch (error) {
      report.results.push({ step: 1, status: 'FAIL', message: `Failed to load page: ${error.message}` });
      report.errors.push({ type: 'navigation', message: error.message });
      console.error('❌ Failed to load page:', error.message);
      throw error;
    }

    // Take screenshot of initial state
    const screenshotPath1 = '/Users/isaiahdupree/Documents/Software/BlogCanvas/screenshot-feat-146-01-initial.png';
    await page.screenshot({ path: screenshotPath1, fullPage: true });
    report.screenshots.push(screenshotPath1);
    console.log(`📸 Screenshot saved: ${screenshotPath1}`);

    // Wait a bit for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📍 Step 2: Check for page errors');
    const pageErrors = report.errors.filter(e => e.type === 'pageerror');
    if (pageErrors.length === 0) {
      report.results.push({ step: 2, status: 'PASS', message: 'No page errors detected' });
      console.log('✅ No page errors detected');
    } else {
      report.results.push({ step: 2, status: 'FAIL', message: `Page errors detected: ${pageErrors.length}` });
      console.log(`⚠️  Page errors detected: ${pageErrors.length}`);
    }

    console.log('\n📍 Step 3: Look for checkbox elements');

    // Check for individual topic checkboxes
    const topicCheckboxes = await page.$$('input[type="checkbox"]');
    console.log(`Found ${topicCheckboxes.length} checkbox elements`);

    if (topicCheckboxes.length > 0) {
      report.results.push({
        step: 3.1,
        status: 'PASS',
        message: `Found ${topicCheckboxes.length} checkbox elements`
      });
      report.acceptanceCriteria.checkboxesRender = true;
      console.log(`✅ Found ${topicCheckboxes.length} checkbox elements`);
    } else {
      report.results.push({
        step: 3.1,
        status: 'FAIL',
        message: 'No checkbox elements found on the page'
      });
      console.log('❌ No checkbox elements found on the page');
    }

    // Look for "select all" checkbox specifically
    const selectAllCheckbox = await page.$('[data-testid="select-all-checkbox"], input[aria-label*="Select all"], input[aria-label*="select all"]');
    if (selectAllCheckbox) {
      report.results.push({ step: 3.2, status: 'PASS', message: 'Select all checkbox found' });
      console.log('✅ Select all checkbox found');
    } else {
      // Check if there's a checkbox in a header/table header context
      const headerCheckbox = await page.$('thead input[type="checkbox"], th input[type="checkbox"]');
      if (headerCheckbox) {
        report.results.push({ step: 3.2, status: 'PASS', message: 'Header checkbox (likely select all) found' });
        console.log('✅ Header checkbox (likely select all) found');
      } else {
        report.results.push({ step: 3.2, status: 'FAIL', message: 'No select all checkbox found' });
        console.log('⚠️  No select all checkbox found');
      }
    }

    // Get page content for analysis
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasTopics = bodyText.includes('topic') || bodyText.includes('Topic');
    const hasBatchButton = bodyText.includes('Create Batch') || bodyText.includes('batch');

    console.log(`\nPage content analysis:`);
    console.log(`- Contains 'topic' text: ${hasTopics}`);
    console.log(`- Contains 'Create Batch' or 'batch' text: ${hasBatchButton}`);

    console.log('\n📍 Step 4: Verify checkbox functionality');

    if (topicCheckboxes.length > 0) {
      // Test individual checkbox toggle
      console.log('\nTesting individual checkbox toggle...');

      // Get initial state
      const initialCheckedCount = await page.$$eval('input[type="checkbox"]:checked', els => els.length);
      console.log(`Initial checked count: ${initialCheckedCount}`);

      // Click first checkbox
      try {
        await topicCheckboxes[0].click();
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for any state updates

        const afterFirstClickCount = await page.$$eval('input[type="checkbox"]:checked', els => els.length);
        console.log(`After first click count: ${afterFirstClickCount}`);

        // Click it again
        await topicCheckboxes[0].click();
        await new Promise(resolve => setTimeout(resolve, 500));

        const afterSecondClickCount = await page.$$eval('input[type="checkbox"]:checked', els => els.length);
        console.log(`After second click count: ${afterSecondClickCount}`);

        if (afterFirstClickCount !== initialCheckedCount || afterSecondClickCount !== afterFirstClickCount) {
          report.results.push({ step: 4.1, status: 'PASS', message: 'Individual checkbox toggle works' });
          report.acceptanceCriteria.toggleWorks = true;
          console.log('✅ Individual checkbox toggle works');
        } else {
          report.results.push({ step: 4.1, status: 'FAIL', message: 'Checkbox toggle does not change state' });
          console.log('❌ Checkbox toggle does not change state');
        }

        // Take screenshot after interaction
        const screenshotPath2 = '/Users/isaiahdupree/Documents/Software/BlogCanvas/screenshot-feat-146-02-after-toggle.png';
        await page.screenshot({ path: screenshotPath2, fullPage: true });
        report.screenshots.push(screenshotPath2);
        console.log(`📸 Screenshot saved: ${screenshotPath2}`);

      } catch (error) {
        report.results.push({ step: 4.1, status: 'ERROR', message: `Failed to test toggle: ${error.message}` });
        console.error('❌ Failed to test toggle:', error.message);
      }

      // Check for selected count display
      console.log('\nChecking for selected count display...');

      // Look for various patterns that might show count
      const countPatterns = [
        'Create Batch \\((\\d+)\\)',
        'Selected: (\\d+)',
        '(\\d+) selected',
        'Batch \\((\\d+)\\)'
      ];

      let countFound = false;
      for (const pattern of countPatterns) {
        const regex = new RegExp(pattern, 'i');
        const match = bodyText.match(regex);
        if (match) {
          report.results.push({
            step: 4.2,
            status: 'PASS',
            message: `Selected count found: "${match[0]}"`
          });
          report.acceptanceCriteria.countShown = true;
          countFound = true;
          console.log(`✅ Selected count found: "${match[0]}"`);
          break;
        }
      }

      if (!countFound) {
        // Check for button with data attributes or aria labels
        const buttonWithCount = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const found = buttons.find(btn => {
            const text = btn.textContent || '';
            return /\(\d+\)/.test(text) ||
                   /\d+\s+selected/i.test(text) ||
                   btn.getAttribute('aria-label')?.includes('selected');
          });
          return found ? found.textContent : null;
        });

        if (buttonWithCount) {
          report.results.push({
            step: 4.2,
            status: 'PASS',
            message: `Selected count found in button: "${buttonWithCount}"`
          });
          report.acceptanceCriteria.countShown = true;
          console.log(`✅ Selected count found in button: "${buttonWithCount}"`);
        } else {
          report.results.push({
            step: 4.2,
            status: 'FAIL',
            message: 'No selected count display found'
          });
          console.log('❌ No selected count display found');
        }
      }

      // Test selection persistence
      console.log('\nTesting selection persistence...');
      try {
        // Select a checkbox
        await topicCheckboxes[0].click();
        await new Promise(resolve => setTimeout(resolve, 500));

        const checkedBefore = await page.evaluate(() => {
          const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
          return checkboxes.map(cb => cb.checked);
        });

        // Interact with another element (e.g., scroll)
        await page.evaluate(() => window.scrollBy(0, 100));
        await new Promise(resolve => setTimeout(resolve, 500));

        const checkedAfter = await page.evaluate(() => {
          const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
          return checkboxes.map(cb => cb.checked);
        });

        const selectionPersisted = JSON.stringify(checkedBefore) === JSON.stringify(checkedAfter);

        if (selectionPersisted) {
          report.results.push({
            step: 4.3,
            status: 'PASS',
            message: 'Selection persists during interaction'
          });
          report.acceptanceCriteria.selectionPersists = true;
          console.log('✅ Selection persists during interaction');
        } else {
          report.results.push({
            step: 4.3,
            status: 'FAIL',
            message: 'Selection does not persist'
          });
          console.log('❌ Selection does not persist');
        }

      } catch (error) {
        report.results.push({
          step: 4.3,
          status: 'ERROR',
          message: `Failed to test persistence: ${error.message}`
        });
        console.error('❌ Failed to test persistence:', error.message);
      }

      // Test select all functionality if available
      const selectAllElement = await page.$('thead input[type="checkbox"], [data-testid="select-all-checkbox"]');
      if (selectAllElement) {
        console.log('\nTesting select all functionality...');
        try {
          // Uncheck all first
          await page.evaluate(() => {
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
          });
          await new Promise(resolve => setTimeout(resolve, 500));

          // Click select all
          await selectAllElement.click();
          await new Promise(resolve => setTimeout(resolve, 500));

          const allChecked = await page.$$eval('tbody input[type="checkbox"]', els =>
            els.every(el => el.checked)
          );

          if (allChecked) {
            report.results.push({
              step: 4.4,
              status: 'PASS',
              message: 'Select all functionality works'
            });
            console.log('✅ Select all functionality works');
          } else {
            report.results.push({
              step: 4.4,
              status: 'FAIL',
              message: 'Select all does not check all checkboxes'
            });
            console.log('❌ Select all does not check all checkboxes');
          }

          // Take screenshot of select all state
          const screenshotPath3 = '/Users/isaiahdupree/Documents/Software/BlogCanvas/screenshot-feat-146-03-select-all.png';
          await page.screenshot({ path: screenshotPath3, fullPage: true });
          report.screenshots.push(screenshotPath3);
          console.log(`📸 Screenshot saved: ${screenshotPath3}`);

        } catch (error) {
          report.results.push({
            step: 4.4,
            status: 'ERROR',
            message: `Failed to test select all: ${error.message}`
          });
          console.error('❌ Failed to test select all:', error.message);
        }
      }

    } else {
      report.results.push({
        step: 4,
        status: 'SKIP',
        message: 'Skipped checkbox functionality tests - no checkboxes found'
      });
      console.log('⚠️  Skipped checkbox functionality tests - no checkboxes found');
    }

    // Generate summary
    const passCount = Object.values(report.acceptanceCriteria).filter(v => v).length;
    const totalCriteria = Object.keys(report.acceptanceCriteria).length;

    if (passCount === totalCriteria) {
      report.summary = `✅ ALL ACCEPTANCE CRITERIA MET (${passCount}/${totalCriteria})`;
    } else {
      report.summary = `⚠️  INCOMPLETE - ${passCount}/${totalCriteria} acceptance criteria met`;
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    report.errors.push({ type: 'execution', message: error.message, stack: error.stack });
    report.summary = '❌ TEST EXECUTION FAILED';
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return report;
}

// Run the test
console.log('========================================');
console.log('feat-146 Verification Test');
console.log('Pipeline Page: Topic Selection Checkboxes');
console.log('========================================\n');

runTest().then(report => {
  console.log('\n========================================');
  console.log('TEST REPORT SUMMARY');
  console.log('========================================\n');

  console.log('Acceptance Criteria Status:');
  console.log(`  • Checkboxes render: ${report.acceptanceCriteria.checkboxesRender ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  • Toggle works: ${report.acceptanceCriteria.toggleWorks ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  • Count shown: ${report.acceptanceCriteria.countShown ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  • Selection persists: ${report.acceptanceCriteria.selectionPersists ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n' + report.summary);

  console.log('\nScreenshots:');
  report.screenshots.forEach(path => console.log(`  - ${path}`));

  if (report.errors.length > 0) {
    console.log('\nErrors:');
    report.errors.forEach(err => console.log(`  - [${err.type}] ${err.message}`));
  }

  // Save detailed report
  const reportPath = '/Users/isaiahdupree/Documents/Software/BlogCanvas/test-feat-146-report.json';
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved: ${reportPath}`);

  console.log('\n========================================\n');

  // Exit with appropriate code
  const allPassed = Object.values(report.acceptanceCriteria).every(v => v);
  process.exit(allPassed ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
