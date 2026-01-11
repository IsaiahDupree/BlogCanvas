/**
 * PDF Generation Library
 * Converts HTML strings to PDF files using Puppeteer
 */

import puppeteer from 'puppeteer';

export async function htmlToPDF(html: string): Promise<Buffer> {
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set content with proper base URL and wait for load
        await page.setContent(html, {
            waitUntil: 'networkidle0'
        });

        // Generate PDF with nice formatting
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            }
        });

        return Buffer.from(pdf);

    } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error('Failed to generate PDF');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Generate a filename for a PDF report
 */
export function generatePDFFilename(
    clientName: string,
    periodStart: string,
    periodEnd: string
): string {
    const safeClientName = clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const startDate = new Date(periodStart).toISOString().split('T')[0];
    const endDate = new Date(periodEnd).toISOString().split('T')[0];

    return `seo_report_${safeClientName}_${startDate}_to_${endDate}.pdf`;
}
