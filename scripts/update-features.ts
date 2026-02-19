#!/usr/bin/env tsx

/**
 * Update Feature Status Script
 *
 * Marks specific features as passing in feature_list.json
 */

import * as fs from 'fs';
import * as path from 'path';

const FEATURE_LIST_PATH = path.join(__dirname, '..', 'feature_list.json');

const FEATURES_TO_UPDATE = [
  'VENDOR-WC-023', // Security test: auth bypass
  'VENDOR-WC-027', // Test seed script
  'VENDOR-WC-028', // Mock service layer
  'VENDOR-WC-029'  // CI test configuration
];

async function updateFeatures() {
  console.log('📝 Updating feature status...\n');

  // Read the feature list
  const featureListContent = fs.readFileSync(FEATURE_LIST_PATH, 'utf-8');
  const featureList = JSON.parse(featureListContent);

  let updatedCount = 0;

  // Update each feature
  for (const featureId of FEATURES_TO_UPDATE) {
    const featureIndex = featureList.features.findIndex((f: any) => f.id === featureId);

    if (featureIndex !== -1) {
      const feature = featureList.features[featureIndex];
      const oldStatus = feature.passes;

      if (!oldStatus) {
        feature.passes = true;
        updatedCount++;
        console.log(`✅ ${featureId}: ${feature.name} - marked as passing`);
      } else {
        console.log(`⏭️  ${featureId}: ${feature.name} - already passing`);
      }
    } else {
      console.log(`❌ ${featureId}: Not found in feature list`);
    }
  }

  // Update completed feature count
  const totalFeatures = featureList.features.length;
  const completedFeatures = featureList.features.filter((f: any) => f.passes).length;
  featureList.completedFeatures = completedFeatures;

  // Write back to file
  fs.writeFileSync(FEATURE_LIST_PATH, JSON.stringify(featureList, null, 2));

  console.log(`\n📊 Summary:`);
  console.log(`  - Features updated: ${updatedCount}`);
  console.log(`  - Total completed: ${completedFeatures}/${totalFeatures}`);
  console.log(`  - Completion rate: ${((completedFeatures / totalFeatures) * 100).toFixed(1)}%`);
  console.log('\n✅ Feature list updated successfully!');
}

updateFeatures()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error updating features:', error);
    process.exit(1);
  });
