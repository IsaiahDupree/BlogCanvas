import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

const TARGET_URL = 'https://app.wordbrew.com'

interface PageStructure {
    url: string
    title: string
    viewport: { width: number; height: number }
    layout: {
        sidebar?: {
            visible: boolean
            items: Array<{ text: string; href?: string; icon?: string }>
        }
        header?: {
            visible: boolean
            elements: Array<{ type: string; text: string; selector: string }>
        }
        mainContent?: {
            sections: Array<{
                type: string
                selector: string
                text: string
                classes: string[]
                children?: number
            }>
        }
        cards?: Array<{
            title: string
            text: string
            classes: string[]
            buttons?: string[]
        }>
        buttons?: Array<{
            text: string
            type: string
            classes: string[]
        }>
        forms?: Array<{
            inputs: Array<{ type: string; placeholder?: string; label?: string }>
            buttons: string[]
        }>
    }
    colors: {
        primary?: string
        background?: string
        text?: string
    }
    typography: {
        fonts: string[]
        sizes: string[]
    }
}

async function scrapeWithPlaywright(): Promise<PageStructure | null> {
    let browser: Browser | null = null
    
    try {
        console.log('Launching browser...')
        browser = await chromium.launch({ headless: false }) // Set to true for production
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        const page = await context.newPage()
        
        console.log(`Navigating to ${TARGET_URL}...`)
        await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 })
        
        // Wait for content to load
        await page.waitForTimeout(3000)
        
        // Take screenshot for reference
        const screenshotDir = path.join(process.cwd(), 'scraped-data')
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true })
        }
        await page.screenshot({ 
            path: path.join(screenshotDir, 'wordbrew-homepage.png'),
            fullPage: true 
        })
        
        console.log('Analyzing page structure...')
        
        // Extract page title
        const title = await page.title()
        
        // Extract sidebar structure
        const sidebarItems: PageStructure['layout']['sidebar']['items'] = []
        const sidebarSelectors = [
            'nav',
            'aside',
            '[role="navigation"]',
            '[class*="sidebar"]',
            '[class*="nav"]',
            '[class*="menu"]'
        ]
        
        for (const selector of sidebarSelectors) {
            const sidebar = await page.$(selector)
            if (sidebar) {
                const items = await sidebar.$$('a, button, [role="button"]')
                for (const item of items) {
                    const text = await item.textContent()
                    const href = await item.getAttribute('href')
                    if (text && text.trim()) {
                        sidebarItems.push({
                            text: text.trim(),
                            href: href || undefined
                        })
                    }
                }
                if (sidebarItems.length > 0) break
            }
        }
        
        // Extract main content sections
        const mainSections: PageStructure['layout']['mainContent']['sections'] = []
        const mainSelectors = [
            'main',
            '[role="main"]',
            '.main-content',
            '#main-content',
            '[class*="content"]',
            '[class*="dashboard"]'
        ]
        
        for (const selector of mainSelectors) {
            const main = await page.$(selector)
            if (main) {
                // Get all child sections
                const children = await main.$$('section, div[class*="section"], div[class*="card"], div[class*="container"]')
                
                for (const child of children.slice(0, 20)) { // Limit to first 20
                    const tagName = await child.evaluate(el => el.tagName.toLowerCase())
                    const text = await child.textContent()
                    const classes = await child.getAttribute('class') || ''
                    const childCount = (await child.$$('*')).length
                    
                    if (text && text.trim().length > 10) {
                        mainSections.push({
                            type: tagName,
                            selector: selector,
                            text: text.trim().substring(0, 500),
                            classes: classes.split(' ').filter(c => c.trim()),
                            children: childCount
                        })
                    }
                }
                break
            }
        }
        
        // Extract cards
        const cards: PageStructure['layout']['cards'] = []
        const cardElements = await page.$$('[class*="card"], [class*="Card"], .card, .Card')
        
        for (const card of cardElements.slice(0, 15)) {
            const text = await card.textContent()
            const classes = await card.getAttribute('class') || ''
            const title = await card.$('h1, h2, h3, h4, [class*="title"], [class*="Title"]')
            const titleText = title ? await title.textContent() : ''
            
            const buttons = await card.$$('button, [role="button"], a[class*="button"]')
            const buttonTexts: string[] = []
            for (const btn of buttons) {
                const btnText = await btn.textContent()
                if (btnText && btnText.trim()) {
                    buttonTexts.push(btnText.trim())
                }
            }
            
            if (text && text.trim().length > 5) {
                cards.push({
                    title: titleText?.trim() || '',
                    text: text.trim().substring(0, 300),
                    classes: classes.split(' ').filter(c => c.trim()),
                    buttons: buttonTexts
                })
            }
        }
        
        // Extract buttons
        const buttons: PageStructure['layout']['buttons'] = []
        const buttonElements = await page.$$('button, [role="button"], a[class*="button"], [class*="Button"]')
        
        for (const btn of buttonElements.slice(0, 30)) {
            const text = await btn.textContent()
            const type = await btn.getAttribute('type') || 'button'
            const classes = await btn.getAttribute('class') || ''
            
            if (text && text.trim()) {
                buttons.push({
                    text: text.trim(),
                    type,
                    classes: classes.split(' ').filter(c => c.trim())
                })
            }
        }
        
        // Extract colors from computed styles
        const colors: PageStructure['colors'] = {}
        try {
            const body = await page.$('body')
            if (body) {
                const bgColor = await body.evaluate(el => {
                    const style = window.getComputedStyle(el)
                    return style.backgroundColor
                })
                colors.background = bgColor
            }
        } catch (e) {
            // Ignore
        }
        
        // Extract typography
        const typography: PageStructure['typography'] = {
            fonts: [],
            sizes: []
        }
        
        try {
            const body = await page.$('body')
            if (body) {
                const fontFamily = await body.evaluate(el => {
                    const style = window.getComputedStyle(el)
                    return style.fontFamily
                })
                typography.fonts.push(fontFamily)
            }
        } catch (e) {
            // Ignore
        }
        
        const structure: PageStructure = {
            url: TARGET_URL,
            title,
            viewport: { width: 1920, height: 1080 },
            layout: {
                sidebar: sidebarItems.length > 0 ? {
                    visible: true,
                    items: sidebarItems
                } : undefined,
                mainContent: {
                    sections: mainSections
                },
                cards,
                buttons
            },
            colors,
            typography
        }
        
        return structure
        
    } catch (error: any) {
        console.error('Error scraping with Playwright:', error.message)
        return null
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}

async function main() {
    console.log('Starting WordBrew structure analysis with Playwright...\n')
    
    const structure = await scrapeWithPlaywright()
    
    if (!structure) {
        console.error('Failed to scrape WordBrew')
        process.exit(1)
    }
    
    // Save results
    const outputDir = path.join(process.cwd(), 'scraped-data')
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const outputFile = path.join(outputDir, 'wordbrew-structure-detailed.json')
    fs.writeFileSync(
        outputFile,
        JSON.stringify(structure, null, 2)
    )
    
    // Generate markdown report
    const report: string[] = []
    report.push('# WordBrew Structure Analysis (Playwright)\n\n')
    report.push(`**URL:** ${structure.url}\n`)
    report.push(`**Title:** ${structure.title}\n`)
    report.push(`**Scraped:** ${new Date().toISOString()}\n\n`)
    
    report.push('## Layout Structure\n\n')
    
    if (structure.layout.sidebar) {
        report.push('### Sidebar Navigation\n\n')
        structure.layout.sidebar.items.forEach((item, i) => {
            report.push(`${i + 1}. ${item.text}${item.href ? ` (${item.href})` : ''}\n`)
        })
        report.push('\n')
    }
    
    if (structure.layout.mainContent) {
        report.push('### Main Content Sections\n\n')
        structure.layout.mainContent.sections.slice(0, 10).forEach((section, i) => {
            report.push(`#### Section ${i + 1}\n`)
            report.push(`- **Type:** ${section.type}\n`)
            report.push(`- **Selector:** ${section.selector}\n`)
            report.push(`- **Classes:** ${section.classes.join(', ')}\n`)
            report.push(`- **Children:** ${section.children}\n`)
            report.push(`- **Preview:** ${section.text.substring(0, 200)}...\n\n`)
        })
    }
    
    if (structure.layout.cards && structure.layout.cards.length > 0) {
        report.push('### Cards Found\n\n')
        structure.layout.cards.slice(0, 10).forEach((card, i) => {
            report.push(`#### Card ${i + 1}\n`)
            if (card.title) report.push(`- **Title:** ${card.title}\n`)
            report.push(`- **Classes:** ${card.classes.join(', ')}\n`)
            if (card.buttons && card.buttons.length > 0) {
                report.push(`- **Buttons:** ${card.buttons.join(', ')}\n`)
            }
            report.push(`- **Preview:** ${card.text.substring(0, 150)}...\n\n`)
        })
    }
    
    if (structure.layout.buttons && structure.layout.buttons.length > 0) {
        report.push('### Buttons Found\n\n')
        const uniqueButtons = new Set<string>()
        structure.layout.buttons.forEach(btn => {
            if (btn.text && !uniqueButtons.has(btn.text)) {
                uniqueButtons.add(btn.text)
                report.push(`- "${btn.text}" (${btn.type})\n`)
            }
        })
        report.push('\n')
    }
    
    if (structure.colors) {
        report.push('### Color Scheme\n\n')
        Object.entries(structure.colors).forEach(([key, value]) => {
            if (value) report.push(`- **${key}:** ${value}\n`)
        })
        report.push('\n')
    }
    
    if (structure.typography) {
        report.push('### Typography\n\n')
        if (structure.typography.fonts.length > 0) {
            report.push(`- **Fonts:** ${structure.typography.fonts.join(', ')}\n`)
        }
        report.push('\n')
    }
    
    const reportFile = path.join(outputDir, 'wordbrew-analysis-detailed.md')
    fs.writeFileSync(reportFile, report.join(''))
    
    console.log('\n✅ Analysis complete!')
    console.log(`   Structure: ${outputFile}`)
    console.log(`   Report: ${reportFile}`)
    console.log(`   Screenshot: ${path.join(outputDir, 'wordbrew-homepage.png')}`)
}

main().catch(console.error)

