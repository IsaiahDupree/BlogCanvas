import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

// Try production URL first, fallback to localhost
const BASE_URL = process.env.PRODUCTION_URL || 'https://blog-canvas-24bcpegvs-isaiahduprees-projects.vercel.app' || 'http://localhost:3000'

// All routes to screenshot
const ROUTES = [
    // Public/Home
    '/',
    
    // App routes (staff/admin)
    '/app',
    '/app/websites',
    '/app/batches',
    '/app/review',
    '/app/publishing',
    '/app/clients',
    '/app/analytics',
    '/app/settings',
    
    // Portal routes (client)
    '/portal/login',
    '/portal/dashboard',
    '/portal/posts',
    '/portal/batches',
    '/portal/brand',
    '/portal/settings/notifications',
    
    // Auth
    '/auth/reset-password',
    
    // Other
    '/analyze',
    '/blog',
    '/brand-guide',
    '/posts',
    '/settings'
]

interface ScreenshotResult {
    route: string
    success: boolean
    error?: string
    screenshotPath?: string
}

async function takeScreenshots() {
    let browser: Browser | null = null
    const results: ScreenshotResult[] = []
    
    try {
        console.log('Launching browser...')
        browser = await chromium.launch({ headless: true })
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        const page = await context.newPage()
        
        // Create screenshots directory
        const screenshotsDir = path.join(process.cwd(), 'screenshots')
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true })
        }
        
        console.log(`\nTaking screenshots of ${ROUTES.length} routes...\n`)
        
        for (const route of ROUTES) {
            const url = `${BASE_URL}${route}`
            const filename = route === '/' ? 'home.png' : route.replace(/\//g, '_').replace(/^_/, '') + '.png'
            const screenshotPath = path.join(screenshotsDir, filename)
            
            try {
                console.log(`📸 ${route}...`)
                
                // Navigate to page
                await page.goto(url, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 60000 
                })
                
                // Wait for content to load
                await page.waitForTimeout(3000)
                
                // Wait for any loading states to finish
                try {
                    await page.waitForSelector('body', { timeout: 5000 })
                } catch (e) {
                    // Continue even if selector wait fails
                }
                
                // Take screenshot
                await page.screenshot({
                    path: screenshotPath,
                    fullPage: true
                })
                
                results.push({
                    route,
                    success: true,
                    screenshotPath
                })
                
                console.log(`   ✅ Saved: ${filename}`)
                
            } catch (error: any) {
                console.log(`   ❌ Error: ${error.message}`)
                results.push({
                    route,
                    success: false,
                    error: error.message
                })
            }
            
            // Small delay between screenshots
            await page.waitForTimeout(1000)
        }
        
        // Generate index HTML
        generateScreenshotIndex(results, screenshotsDir)
        
        console.log(`\n✅ Screenshots complete!`)
        console.log(`   Total: ${results.length}`)
        console.log(`   Successful: ${results.filter(r => r.success).length}`)
        console.log(`   Failed: ${results.filter(r => !r.success).length}`)
        console.log(`   Directory: ${screenshotsDir}`)
        console.log(`   Index: ${path.join(screenshotsDir, 'index.html')}`)
        
    } catch (error: any) {
        console.error('Error taking screenshots:', error.message)
    } finally {
        if (browser) {
            await browser.close()
        }
    }
    
    return results
}

function generateScreenshotIndex(results: ScreenshotResult[], screenshotsDir: string) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BlogCanvas Screenshots</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
            margin-bottom: 30px;
            font-size: 2.5rem;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #6366f1;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        .screenshots {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 30px;
        }
        .screenshot-item {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .screenshot-item:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 12px rgba(0,0,0,0.15);
        }
        .screenshot-header {
            padding: 15px;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
        }
        .screenshot-route {
            font-weight: 600;
            color: #333;
            font-size: 1.1rem;
        }
        .screenshot-status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            margin-top: 5px;
        }
        .status-success {
            background: #d1fae5;
            color: #065f46;
        }
        .status-error {
            background: #fee2e2;
            color: #991b1b;
        }
        .screenshot-image {
            width: 100%;
            height: auto;
            display: block;
        }
        .screenshot-placeholder {
            padding: 60px 20px;
            text-align: center;
            color: #999;
            background: #f9fafb;
        }
        .error-message {
            padding: 15px;
            color: #dc2626;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📸 BlogCanvas Screenshots</h1>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${results.length}</div>
                <div class="stat-label">Total Routes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #10b981;">${results.filter(r => r.success).length}</div>
                <div class="stat-label">Successful</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #ef4444;">${results.filter(r => !r.success).length}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #6366f1;">${new Date().toLocaleString()}</div>
                <div class="stat-label">Generated</div>
            </div>
        </div>
        
        <div class="screenshots">
            ${results.map(result => {
                const filename = result.route === '/' ? 'home.png' : result.route.replace(/\//g, '_').replace(/^_/, '') + '.png'
                
                if (result.success) {
                    return `
                        <div class="screenshot-item">
                            <div class="screenshot-header">
                                <div class="screenshot-route">${result.route || '/'}</div>
                                <span class="screenshot-status status-success">✅ Success</span>
                            </div>
                            <img src="${filename}" alt="${result.route}" class="screenshot-image" loading="lazy">
                        </div>
                    `
                } else {
                    return `
                        <div class="screenshot-item">
                            <div class="screenshot-header">
                                <div class="screenshot-route">${result.route || '/'}</div>
                                <span class="screenshot-status status-error">❌ Failed</span>
                            </div>
                            <div class="screenshot-placeholder">
                                <p>Failed to capture screenshot</p>
                                <div class="error-message">${result.error || 'Unknown error'}</div>
                            </div>
                        </div>
                    `
                }
            }).join('')}
        </div>
    </div>
</body>
</html>
    `.trim()
    
    fs.writeFileSync(path.join(screenshotsDir, 'index.html'), html)
}

// Run the screenshot script
takeScreenshots().catch(console.error)

