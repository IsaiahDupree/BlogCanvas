import { NextRequest, NextResponse } from 'next/server';

/**
 * Download CSV template for content batch imports
 * GET /api/content-batches/[id]/download-csv-template
 *
 * Returns a CSV template with:
 * - All supported column headers
 * - Example data row with instructions
 * - Instructions in comment format
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // CSV template with all standard columns
        const headers = [
            'topic',                    // Required: Blog post title/topic
            'target_keyword',           // Target SEO keyword
            'target_wordcount',         // Desired word count (default: 1500)
            'topic_cluster',            // Content cluster/category
            'priority',                 // Priority level (0-10)
            'notes',                    // Additional notes or description
            'search_intent',            // informational, commercial, transactional, navigational
            'tone_voice',               // professional, casual, technical, friendly, authoritative
            'due_date',                 // Due date (YYYY-MM-DD format)
            'publish_window_start',     // Publish window start (YYYY-MM-DD format)
            'publish_window_end'        // Publish window end (YYYY-MM-DD format)
        ];

        // Example row with realistic data
        const exampleRow = [
            'How to Get Started with SEO in 2026',              // topic
            'seo for beginners',                                 // target_keyword
            '2000',                                              // target_wordcount
            'SEO Basics',                                        // topic_cluster
            '8',                                                 // priority
            'Include step-by-step guide and beginner checklist', // notes
            'informational',                                     // search_intent
            'friendly',                                          // tone_voice
            '2026-02-15',                                        // due_date
            '2026-02-20',                                        // publish_window_start
            '2026-02-28'                                         // publish_window_end
        ];

        // Instructions row (will appear as comments in CSV)
        const instructionsRow = [
            'REQUIRED - Your blog post title or topic',
            'Main keyword to target for SEO',
            'Target length in words (e.g., 1500, 2000)',
            'Content category or cluster name',
            'Priority 0-10 (higher = more important)',
            'Any notes, briefs, or requirements',
            'informational | commercial | transactional | navigational',
            'professional | casual | technical | friendly | authoritative',
            'Format: YYYY-MM-DD',
            'Format: YYYY-MM-DD',
            'Format: YYYY-MM-DD'
        ];

        // Build CSV content
        const csvRows = [
            // Header row
            headers.join(','),
            // Instructions row (commented format)
            '# ' + instructionsRow.join(' | '),
            // Example row
            exampleRow.map(cell => {
                // Quote cells that contain commas
                if (cell.includes(',')) {
                    return `"${cell}"`;
                }
                return cell;
            }).join(','),
            // Empty rows for user to fill
            headers.map(() => '').join(','),
            headers.map(() => '').join(','),
            headers.map(() => '').join(',')
        ];

        const csvContent = csvRows.join('\n');

        // Return CSV file
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="blogcanvas-import-template-batch-${id}.csv"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

    } catch (error: any) {
        console.error('Error generating CSV template:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate CSV template' },
            { status: 500 }
        );
    }
}
