#!/bin/bash
# Script to upgrade Next.js to patched version when available
# Run this script daily until Next.js 16.0.7 is published

echo "Checking for Next.js 16.0.7 security patch..."

# Check if 16.0.7 is available
VERSION_CHECK=$(npm view next@16.0.7 version 2>&1)

if [[ $VERSION_CHECK == *"16.0.7"* ]]; then
    echo "✅ Next.js 16.0.7 is now available!"
    echo "Upgrading..."
    
    npm install next@16.0.7
    
    echo "Running build test..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful!"
        echo "Committing changes..."
        git add package.json package-lock.json
        git commit -m "security: upgrade Next.js to 16.0.7 to fix CVE-2025-66478"
        git push
        
        echo "✅ Upgrade complete! Deploying..."
        vercel --prod
    else
        echo "❌ Build failed. Please review errors."
        exit 1
    fi
else
    echo "⏳ Next.js 16.0.7 is not yet available."
    echo "Current latest: $(npm view next@latest version)"
    echo "Please check again later."
    exit 0
fi

