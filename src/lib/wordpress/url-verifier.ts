/**
 * URL Verification Utility for WordPress Published Posts
 * PRD: feat-104 - Track canonical URL after WordPress publish
 */

export interface URLVerificationResult {
    accessible: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
    canonicalUrl?: string;
    redirectUrl?: string;
}

/**
 * Verify that a published URL is accessible
 * Follows redirects and captures the final canonical URL
 */
export async function verifyPublishedURL(url: string): Promise<URLVerificationResult> {
    const startTime = Date.now();

    try {
        // Validate URL format
        let validUrl: URL;
        try {
            validUrl = new URL(url);
        } catch (error) {
            return {
                accessible: false,
                error: 'Invalid URL format'
            };
        }

        // Make HEAD request first (faster, less bandwidth)
        const response = await fetch(validUrl.toString(), {
            method: 'HEAD',
            redirect: 'follow',
            headers: {
                'User-Agent': 'BlogCanvas-URLVerifier/1.0'
            }
        });

        const responseTime = Date.now() - startTime;
        const finalUrl = response.url; // URL after any redirects
        const statusCode = response.status;

        // Check if the response is successful
        const accessible = statusCode >= 200 && statusCode < 400;

        const result: URLVerificationResult = {
            accessible,
            statusCode,
            responseTime,
            canonicalUrl: finalUrl !== url ? finalUrl : undefined,
            redirectUrl: finalUrl !== url ? finalUrl : undefined
        };

        if (!accessible) {
            result.error = `HTTP ${statusCode}: ${response.statusText}`;
        }

        return result;

    } catch (error: any) {
        return {
            accessible: false,
            responseTime: Date.now() - startTime,
            error: error.message || 'Network error'
        };
    }
}

/**
 * Verify multiple URLs in batch
 * Uses concurrent requests with rate limiting
 */
export async function verifyMultipleURLs(
    urls: string[],
    options?: {
        maxConcurrent?: number;
        delayMs?: number;
    }
): Promise<Map<string, URLVerificationResult>> {
    const results = new Map<string, URLVerificationResult>();
    const maxConcurrent = options?.maxConcurrent || 5;
    const delayMs = options?.delayMs || 500;

    // Process URLs in batches
    for (let i = 0; i < urls.length; i += maxConcurrent) {
        const batch = urls.slice(i, i + maxConcurrent);

        const batchResults = await Promise.all(
            batch.map(async (url) => {
                const result = await verifyPublishedURL(url);
                return { url, result };
            })
        );

        // Store results
        batchResults.forEach(({ url, result }) => {
            results.set(url, result);
        });

        // Rate limiting delay between batches
        if (i + maxConcurrent < urls.length && delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}

/**
 * Extract canonical URL from HTML
 * Useful for verifying the canonical link element
 */
export async function extractCanonicalURL(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'BlogCanvas-URLVerifier/1.0'
            }
        });

        if (!response.ok) {
            return null;
        }

        const html = await response.text();

        // Extract canonical URL from <link rel="canonical"> tag
        const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
                               html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);

        if (canonicalMatch) {
            return canonicalMatch[1];
        }

        // If no canonical tag, return the final URL after redirects
        return response.url;
    } catch (error) {
        return null;
    }
}
