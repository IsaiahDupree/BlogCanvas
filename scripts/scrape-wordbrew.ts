import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import * as cheerio from 'cheerio'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const TARGET_URL = 'https://app.wordbrew.com'

interface ScrapedPage {
    url: string
    title: string
    content: string
    structure: {
        sections: Array<{
            type: string
            selector: string
            text: string
            attributes?: Record<string, string>
        }>
    }
    metadata: {
        description?: string
        keywords?: string
    }
}

async function scrapePage(url: string): Promise<ScrapedPage | null> {
    try {
        console.log(`Scraping: ${url}`)
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        })

        const $ = cheerio.load(response.data)
        
        // Extract page structure
        const sections: ScrapedPage['structure']['sections'] = []
        
        // Get main navigation
        $('nav, [role="navigation"]').each((i, el) => {
            const $el = $(el)
            sections.push({
                type: 'navigation',
                selector: $el.get(0)?.tagName || 'nav',
                text: $el.text().trim().substring(0, 200),
                attributes: {
                    class: $el.attr('class') || '',
                    id: $el.attr('id') || ''
                }
            })
        })

        // Get main content areas
        $('main, [role="main"], .main-content, #main-content').each((i, el) => {
            const $el = $(el)
            sections.push({
                type: 'main-content',
                selector: $el.get(0)?.tagName || 'main',
                text: $el.text().trim().substring(0, 500),
                attributes: {
                    class: $el.attr('class') || '',
                    id: $el.attr('id') || ''
                }
            })
        })

        // Get sidebar
        $('aside, [role="complementary"], .sidebar, #sidebar').each((i, el) => {
            const $el = $(el)
            sections.push({
                type: 'sidebar',
                selector: $el.get(0)?.tagName || 'aside',
                text: $el.text().trim().substring(0, 200),
                attributes: {
                    class: $el.attr('class') || '',
                    id: $el.attr('id') || ''
                }
            })
        })

        // Get cards/containers
        $('.card, [class*="card"], .container, [class*="container"]').each((i, el) => {
            const $el = $(el)
            if (i < 10) { // Limit to first 10 cards
                sections.push({
                    type: 'card',
                    selector: $el.get(0)?.tagName || 'div',
                    text: $el.text().trim().substring(0, 300),
                    attributes: {
                        class: $el.attr('class') || '',
                        id: $el.attr('id') || ''
                    }
                })
            }
        })

        // Get buttons and CTAs
        $('button, .btn, [class*="button"], a[class*="button"]').each((i, el) => {
            const $el = $(el)
            if (i < 20) { // Limit to first 20 buttons
                sections.push({
                    type: 'button',
                    selector: $el.get(0)?.tagName || 'button',
                    text: $el.text().trim(),
                    attributes: {
                        class: $el.attr('class') || '',
                        id: $el.attr('id') || '',
                        href: $el.attr('href') || ''
                    }
                })
            }
        })

        // Get forms
        $('form').each((i, el) => {
            const $el = $(el)
            sections.push({
                type: 'form',
                selector: 'form',
                text: $el.text().trim().substring(0, 200),
                attributes: {
                    class: $el.attr('class') || '',
                    id: $el.attr('id') || '',
                    action: $el.attr('action') || ''
                }
            })
        })

        const title = $('title').text() || $('h1').first().text() || 'Untitled'
        const description = $('meta[name="description"]').attr('content') || ''
        const keywords = $('meta[name="keywords"]').attr('content') || ''

        return {
            url,
            title: title.trim(),
            content: $('body').text().trim().substring(0, 5000),
            structure: {
                sections
            },
            metadata: {
                description,
                keywords
            }
        }
    } catch (error: any) {
        console.error(`Error scraping ${url}:`, error.message)
        return null
    }
}

async function findInternalLinks(html: string, baseUrl: string): Promise<string[]> {
    const $ = cheerio.load(html)
    const links: string[] = []
    const base = new URL(baseUrl)

    $('a[href]').each((i, el) => {
        const href = $(el).attr('href')
        if (!href) return

        try {
            const url = new URL(href, baseUrl)
            if (url.origin === base.origin && !links.includes(url.href)) {
                links.push(url.href)
            }
        } catch {
            // Invalid URL, skip
        }
    })

    return links
}

async function scrapeWordBrew() {
    console.log('Starting WordBrew website scrape...\n')
    
    const visited = new Set<string>()
    const toVisit = [TARGET_URL]
    const scrapedPages: ScrapedPage[] = []
    const maxPages = 10 // Limit to prevent too many requests

    while (toVisit.length > 0 && scrapedPages.length < maxPages) {
        const url = toVisit.shift()
        if (!url || visited.has(url)) continue

        visited.add(url)
        const page = await scrapePage(url)

        if (page) {
            scrapedPages.push(page)
            console.log(`✓ Scraped: ${page.title}`)
            console.log(`  Sections found: ${page.structure.sections.length}`)
            
            // Find links for further scraping
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 30000
                })
                const links = await findInternalLinks(response.data, url)
                
                for (const link of links.slice(0, 5)) { // Limit to 5 new links per page
                    if (!visited.has(link) && !toVisit.includes(link)) {
                        toVisit.push(link)
                    }
                }
            } catch (error) {
                console.error(`Error finding links on ${url}:`, error)
            }
        }

        // Be respectful - wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Save results
    const outputDir = path.join(process.cwd(), 'scraped-data')
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    const outputFile = path.join(outputDir, 'wordbrew-structure.json')
    fs.writeFileSync(
        outputFile,
        JSON.stringify({
            scrapedAt: new Date().toISOString(),
            targetUrl: TARGET_URL,
            totalPages: scrapedPages.length,
            pages: scrapedPages
        }, null, 2)
    )

    console.log(`\n✅ Scraping complete!`)
    console.log(`   Pages scraped: ${scrapedPages.length}`)
    console.log(`   Output saved to: ${outputFile}`)

    // Generate analysis report
    generateAnalysisReport(scrapedPages, outputDir)
}

function generateAnalysisReport(pages: ScrapedPage[], outputDir: string) {
    const report: string[] = []
    
    report.push('# WordBrew Website Structure Analysis\n')
    report.push(`**Scraped:** ${new Date().toISOString()}\n`)
    report.push(`**Total Pages:** ${pages.length}\n\n`)

    // Analyze structure patterns
    const sectionTypes = new Map<string, number>()
    const commonClasses = new Map<string, number>()
    const buttonTexts: string[] = []
    const navigationItems: string[] = []

    pages.forEach(page => {
        page.structure.sections.forEach(section => {
            // Count section types
            sectionTypes.set(section.type, (sectionTypes.get(section.type) || 0) + 1)
            
            // Collect common classes
            if (section.attributes?.class) {
                const classes = section.attributes.class.split(' ')
                classes.forEach(cls => {
                    if (cls.trim()) {
                        commonClasses.set(cls.trim(), (commonClasses.get(cls.trim()) || 0) + 1)
                    }
                })
            }

            // Collect button texts
            if (section.type === 'button' && section.text) {
                buttonTexts.push(section.text.trim())
            }

            // Collect navigation items
            if (section.type === 'navigation' && section.text) {
                const navItems = section.text.split('\n').filter(t => t.trim().length > 0 && t.trim().length < 50)
                navigationItems.push(...navItems.slice(0, 10))
            }
        })
    })

    report.push('## Structure Analysis\n\n')
    report.push('### Section Types Found:\n')
    Array.from(sectionTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
            report.push(`- **${type}**: ${count} occurrences\n`)
        })

    report.push('\n### Common CSS Classes:\n')
    Array.from(commonClasses.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .forEach(([cls, count]) => {
            report.push(`- \`.${cls}\`: ${count} occurrences\n`)
        })

    report.push('\n### Navigation Items:\n')
    const uniqueNavItems = [...new Set(navigationItems)].slice(0, 15)
    uniqueNavItems.forEach(item => {
        report.push(`- ${item}\n`)
    })

    report.push('\n### Button Labels:\n')
    const uniqueButtons = [...new Set(buttonTexts)].slice(0, 20)
    uniqueButtons.forEach(btn => {
        report.push(`- "${btn}"\n`)
    })

    report.push('\n## Page Details\n\n')
    pages.forEach((page, index) => {
        report.push(`### ${index + 1}. ${page.title}\n`)
        report.push(`- **URL:** ${page.url}\n`)
        report.push(`- **Sections:** ${page.structure.sections.length}\n`)
        if (page.metadata.description) {
            report.push(`- **Description:** ${page.metadata.description}\n`)
        }
        report.push('\n')
    })

    const reportFile = path.join(outputDir, 'wordbrew-analysis.md')
    fs.writeFileSync(reportFile, report.join(''))
    
    console.log(`   Analysis report: ${reportFile}`)
}

// Run the scraper
scrapeWordBrew().catch(console.error)

