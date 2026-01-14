/**
 * Test Email Sending - Vendor & Client Scenarios
 * Tests actual email delivery via Resend
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const RESEND_DOMAIN = process.env.RESEND_DOMAIN || 'blogcanvas.io';

interface EmailTestResult {
  scenario: string;
  success: boolean;
  emailId?: string;
  error?: string;
}

async function testVendorToClientEmail(clientEmail: string): Promise<EmailTestResult> {
  console.log('\n📧 Test 1: Vendor sending newsletter to Client');
  console.log(`   From: BlogCanvas <newsletters@${RESEND_DOMAIN}>`);
  console.log(`   To: ${clientEmail}`);
  
  try {
    const { data, error } = await resend.emails.send({
      from: `BlogCanvas <newsletters@${RESEND_DOMAIN}>`,
      to: clientEmail,
      subject: '🎉 Your Weekly SEO Content Digest',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .post { background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #6366f1; }
            .cta { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">📊 Your Weekly Content Update</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">New blog posts are ready for review!</p>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>Your content team has been busy! Here are the latest blog posts ready for your review:</p>
            
            <div class="post">
              <h3 style="margin: 0 0 10px 0;">🚀 10 SEO Strategies for 2026</h3>
              <p style="margin: 0; color: #6b7280;">A comprehensive guide to boosting your organic traffic this year.</p>
            </div>
            
            <div class="post">
              <h3 style="margin: 0 0 10px 0;">💡 Content Marketing Best Practices</h3>
              <p style="margin: 0; color: #6b7280;">Learn how top brands create engaging content that converts.</p>
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="https://blogcanvas.io/portal/review" class="cta">Review Posts Now →</a>
            </p>
          </div>
          <div class="footer">
            <p>Sent via BlogCanvas | <a href="#">Unsubscribe</a></p>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      return { scenario: 'Vendor → Client Newsletter', success: false, error: error.message };
    }

    console.log(`   ✅ Sent! Email ID: ${data?.id}`);
    return { scenario: 'Vendor → Client Newsletter', success: true, emailId: data?.id };
  } catch (err: any) {
    console.log(`   ❌ Failed: ${err.message}`);
    return { scenario: 'Vendor → Client Newsletter', success: false, error: err.message };
  }
}

async function testClientApprovalNotification(vendorEmail: string): Promise<EmailTestResult> {
  console.log('\n📧 Test 2: Client approval notification to Vendor');
  console.log(`   From: BlogCanvas <noreply@${RESEND_DOMAIN}>`);
  console.log(`   To: ${vendorEmail}`);
  
  try {
    const { data, error } = await resend.emails.send({
      from: `BlogCanvas <noreply@${RESEND_DOMAIN}>`,
      to: vendorEmail,
      subject: '✅ Client Approved 3 Blog Posts',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .post-item { background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; }
            .check { color: #10b981; font-size: 24px; margin-right: 15px; }
            .cta { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">✅ Posts Approved!</h1>
          </div>
          <div class="content">
            <p><strong>Acme Corp</strong> has approved the following blog posts:</p>
            
            <div class="post-item">
              <span class="check">✓</span>
              <div>
                <strong>10 SEO Strategies for 2026</strong>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Ready to publish</p>
              </div>
            </div>
            
            <div class="post-item">
              <span class="check">✓</span>
              <div>
                <strong>Content Marketing Best Practices</strong>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Ready to publish</p>
              </div>
            </div>
            
            <div class="post-item">
              <span class="check">✓</span>
              <div>
                <strong>Building Brand Authority Online</strong>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Ready to publish</p>
              </div>
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="https://blogcanvas.io/app/posts" class="cta">View in Dashboard →</a>
            </p>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      return { scenario: 'Client → Vendor Approval', success: false, error: error.message };
    }

    console.log(`   ✅ Sent! Email ID: ${data?.id}`);
    return { scenario: 'Client → Vendor Approval', success: true, emailId: data?.id };
  } catch (err: any) {
    console.log(`   ❌ Failed: ${err.message}`);
    return { scenario: 'Client → Vendor Approval', success: false, error: err.message };
  }
}

async function testPitchDeckEmail(prospectEmail: string): Promise<EmailTestResult> {
  console.log('\n📧 Test 3: Vendor sending SEO pitch deck to prospect');
  console.log(`   From: BlogCanvas Sales <sales@${RESEND_DOMAIN}>`);
  console.log(`   To: ${prospectEmail}`);
  
  try {
    const { data, error } = await resend.emails.send({
      from: `BlogCanvas Sales <sales@${RESEND_DOMAIN}>`,
      to: prospectEmail,
      subject: '📈 SEO Content Strategy Proposal for Your Business',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
            .stat { display: inline-block; background: white; padding: 20px; border-radius: 8px; margin: 10px; text-align: center; width: 120px; }
            .stat-value { font-size: 32px; font-weight: bold; color: #3b82f6; }
            .stat-label { font-size: 12px; color: #6b7280; }
            .cta { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">📈 Your SEO Growth Opportunity</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Custom strategy based on your website analysis</p>
          </div>
          
          <div style="text-align: center; padding: 30px 0;">
            <div class="stat">
              <div class="stat-value">45</div>
              <div class="stat-label">Current SEO Score</div>
            </div>
            <div class="stat">
              <div class="stat-value">85</div>
              <div class="stat-label">Target Score</div>
            </div>
            <div class="stat">
              <div class="stat-value">+120%</div>
              <div class="stat-label">Traffic Potential</div>
            </div>
          </div>
          
          <p>Based on our analysis of your website, we've identified significant opportunities to improve your organic search visibility and drive more qualified traffic.</p>
          
          <h3>What's Included:</h3>
          <ul>
            <li>✓ 12 SEO-optimized blog posts per month</li>
            <li>✓ Keyword research & topic clustering</li>
            <li>✓ Content gap analysis</li>
            <li>✓ Monthly performance reports</li>
          </ul>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="https://blogcanvas.io/schedule-demo" class="cta">Schedule a Demo Call →</a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            <strong>Isaiah Dupree</strong><br>
            BlogCanvas Team
          </p>
        </body>
        </html>
      `
    });

    if (error) {
      return { scenario: 'Vendor → Prospect Pitch', success: false, error: error.message };
    }

    console.log(`   ✅ Sent! Email ID: ${data?.id}`);
    return { scenario: 'Vendor → Prospect Pitch', success: true, emailId: data?.id };
  } catch (err: any) {
    console.log(`   ❌ Failed: ${err.message}`);
    return { scenario: 'Vendor → Prospect Pitch', success: false, error: err.message };
  }
}

async function main() {
  console.log('🔬 BlogCanvas Email Sending Test');
  console.log('='.repeat(50));
  console.log(`Using Resend Domain: ${RESEND_DOMAIN}`);
  console.log(`API Key: ${process.env.RESEND_API_KEY?.slice(0, 10)}...`);
  
  // Use a test email - change this to your actual email to receive tests
  const testEmail = process.argv[2] || 'lcreator34@gmail.com';
  
  console.log(`\n📬 Sending all test emails to: ${testEmail}`);

  const results: EmailTestResult[] = [];

  // Test 1: Vendor sends newsletter to client
  results.push(await testVendorToClientEmail(testEmail));

  // Test 2: Client approval notification to vendor
  results.push(await testClientApprovalNotification(testEmail));

  // Test 3: Vendor sends pitch deck to prospect
  results.push(await testPitchDeckEmail(testEmail));

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.scenario}`);
    if (result.success) {
      console.log(`   Email ID: ${result.emailId}`);
      passed++;
    } else {
      console.log(`   Error: ${result.error}`);
      failed++;
    }
  }
  
  console.log('\n' + '-'.repeat(50));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (passed === results.length) {
    console.log('\n🎉 All email tests passed! Check your inbox at: ' + testEmail);
  }
}

main().catch(console.error);
