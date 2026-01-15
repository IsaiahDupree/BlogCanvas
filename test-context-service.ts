/**
 * Quick test script for the shared context service
 * Run with: npx tsx test-context-service.ts <clientId>
 */

import { getSharedClientContext, formatContextForAI } from './src/lib/brand/shared-context';

async function testContextService() {
  const clientId = process.argv[2];

  if (!clientId) {
    console.error('Usage: npx tsx test-context-service.ts <clientId>');
    process.exit(1);
  }

  console.log(`\n🔍 Fetching shared context for client: ${clientId}\n`);

  try {
    const context = await getSharedClientContext(clientId);

    console.log('✅ Successfully fetched context!');
    console.log('\n📋 Context Summary:');
    console.log(`   Client: ${context.clientName}`);
    console.log(`   Brand: ${context.brandGuide.brandName || 'N/A'}`);
    console.log(`   Voice Traits: ${context.voiceAndTone.voiceTraits.length}`);
    console.log(`   Avoid Patterns: ${context.stylesToAvoid.wordPatterns.length}`);
    console.log(`   Preferred Patterns: ${context.stylesToKeep.preferredPatterns.length}`);
    console.log(`   Title Formats: ${context.titleGuidelines.preferredFormats.length}`);

    console.log('\n📝 AI-Formatted Context:\n');
    console.log(formatContextForAI(context));

    console.log('\n✨ Full Context Object:');
    console.log(JSON.stringify(context, null, 2));

  } catch (error) {
    console.error('❌ Error fetching context:', error);
    process.exit(1);
  }
}

testContextService();
