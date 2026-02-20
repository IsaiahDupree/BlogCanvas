#!/usr/bin/env python3
"""
Update feature_list.json for batch 3 implementations
"""

import json

# Features completed in this session (batch 3)
NEWLY_COMPLETED_FEATURES = [
    # Notifications
    "VENDOR-WC-121",  # In-app notification center - IMPLEMENTED

    # Database
    "VENDOR-WC-158",  # Soft delete pattern - IMPLEMENTED
    "VENDOR-WC-159",  # Audit trail table - IMPLEMENTED

    # DevOps
    "VENDOR-WC-108",  # Health check endpoints - VERIFIED (exists)
    "VENDOR-WC-110",  # Automated dependency updates - IMPLEMENTED (Renovate)

    # Performance (already existed but marking)
    "VENDOR-WC-058",  # Navigation prefetching - Next.js built-in
]

def update_feature_list():
    """Update feature_list.json"""

    # Read feature list
    with open('feature_list.json', 'r') as f:
        data = json.load(f)

    # Track updates
    updated_count = 0

    # Update each feature
    for feature in data['features']:
        if feature['id'] in NEWLY_COMPLETED_FEATURES:
            if not feature.get('passes', False):
                feature['passes'] = True
                updated_count += 1
                print(f"✓ Marked {feature['id']} as passing: {feature['name']}")

    # Update completion count
    passing_count = sum(1 for f in data['features'] if f.get('passes', False))
    data['completedFeatures'] = passing_count

    # Write back
    with open('feature_list.json', 'w') as f:
        json.dump(data, f, indent=2)

    print(f"\n{'='*80}")
    print(f"Updated {updated_count} features in this batch")
    print(f"Total passing: {passing_count}/{data['totalFeatures']}")
    print(f"Completion: {(passing_count / data['totalFeatures'] * 100):.1f}%")
    print(f"Remaining: {data['totalFeatures'] - passing_count} features")
    print(f"{'='*80}")

    # Show remaining by category
    failing = [f for f in data['features'] if not f.get('passes', False)]
    categories = {}
    for f in failing:
        cat = f.get('category', 'unknown')
        categories[cat] = categories.get(cat, 0) + 1

    print("\nRemaining by category:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")

if __name__ == "__main__":
    update_feature_list()
