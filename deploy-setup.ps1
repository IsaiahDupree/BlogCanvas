# Quick Deploy to Vercel Script
# Run this script to initialize git and prepare for deployment

Write-Host "🚀 BlogCanvas - Vercel Deployment Setup" -ForegroundColor Cyan
Write-Host ""

# Step 1: Initialize Git
Write-Host "Step 1: Initializing Git repository..." -ForegroundColor Yellow
git init
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Git initialized" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Git already initialized" -ForegroundColor Blue
}

# Step 2: Add all files
Write-Host ""
Write-Host "Step 2: Adding files to Git..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files staged" -ForegroundColor Green

# Step 3: Create initial commit
Write-Host ""
Write-Host "Step 3: Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit - BlogCanvas ready for deployment"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Initial commit created" -ForegroundColor Green
} else {
    Write-Host "⚠️  No changes to commit or already committed" -ForegroundColor Yellow
}

# Step 4: Instructions
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create a GitHub repository:" -ForegroundColor White
Write-Host "   → Go to https://github.com/new" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Add remote and push:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YOUR-USERNAME/blog-canvas.git" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deploy to Vercel:" -ForegroundColor White
Write-Host "   → Go to https://vercel.com/new" -ForegroundColor Gray
Write-Host "   → Import your GitHub repository" -ForegroundColor Gray
Write-Host "   → Add environment variables (see deployment guide)" -ForegroundColor Gray
Write-Host "   → Click Deploy!" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Full guide: vercel_deployment_guide.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ You're ready to deploy!" -ForegroundColor Green
