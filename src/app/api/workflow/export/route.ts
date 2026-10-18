import { NextRequest, NextResponse } from 'next/server';

// POST /api/workflow/export?format=pdf|docx|markdown - Export blogs in various formats
export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const format = url.searchParams.get('format') || 'markdown';
        
        const body = await request.json();
        const { blogs } = body;

        if (!blogs || !Array.isArray(blogs) || blogs.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Blogs array is required' },
                { status: 400 }
            );
        }

        let content: string;
        let contentType: string;
        let filename: string;

        switch (format) {
            case 'markdown':
                content = generateMarkdownExport(blogs);
                contentType = 'text/markdown';
                filename = `blogs-${new Date().toISOString().split('T')[0]}.md`;
                break;

            case 'docx':
                // For DOCX, you'd use a library like docx
                // For now, return HTML that can be converted
                content = generateHTMLExport(blogs);
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                filename = `blogs-${new Date().toISOString().split('T')[0]}.docx`;
                // Note: Actual DOCX generation requires a library
                break;

            case 'pdf':
                // For PDF, return HTML that can be printed/converted
                content = generateHTMLExport(blogs);
                contentType = 'text/html';
                filename = `blogs-${new Date().toISOString().split('T')[0]}.html`;
                break;

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid format. Use: markdown, docx, or pdf' },
                    { status: 400 }
                );
        }

        return new NextResponse(content, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error('Error exporting blogs:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to export blogs' },
            { status: 500 }
        );
    }
}

function generateMarkdownExport(blogs: any[]): string {
    let markdown = `# Blog Export\n\n`;
    markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
    markdown += `Total Blogs: ${blogs.length}\n\n`;
    markdown += `---\n\n`;

    blogs.forEach((blog, index) => {
        markdown += `## ${index + 1}. ${blog.title}\n\n`;
        markdown += `**Target Keyword:** ${blog.targetKeyword}\n\n`;
        markdown += `**Angle:** ${blog.angle}\n\n`;
        if (blog.seoScore) {
            markdown += `**SEO Score:** ${blog.seoScore}/100\n\n`;
        }
        if (blog.wordCount) {
            markdown += `**Word Count:** ${blog.wordCount}\n\n`;
        }
        if (blog.imageUrl) {
            markdown += `![${blog.title}](${blog.imageUrl})\n\n`;
        }
        if (blog.content) {
            // Strip HTML tags for markdown
            const textContent = blog.content.replace(/<[^>]*>/g, '');
            markdown += `${textContent}\n\n`;
        }
        markdown += `---\n\n`;
    });

    return markdown;
}

function generateHTMLExport(blogs: any[]): string {
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Blog Export</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
        h2 { color: #6366f1; margin-top: 40px; }
        .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
        .content { line-height: 1.6; }
        img { max-width: 100%; height: auto; margin: 20px 0; }
        hr { margin: 40px 0; border: none; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <h1>Blog Export</h1>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Total Blogs:</strong> ${blogs.length}</p>
    <hr>`;

    blogs.forEach((blog, index) => {
        html += `
    <h2>${index + 1}. ${blog.title}</h2>
    <div class="meta">
        <p><strong>Target Keyword:</strong> ${blog.targetKeyword}</p>
        <p><strong>Angle:</strong> ${blog.angle}</p>
        ${blog.seoScore ? `<p><strong>SEO Score:</strong> ${blog.seoScore}/100</p>` : ''}
        ${blog.wordCount ? `<p><strong>Word Count:</strong> ${blog.wordCount}</p>` : ''}
    </div>
    ${blog.imageUrl ? `<img src="${blog.imageUrl}" alt="${blog.title}">` : ''}
    <div class="content">
        ${blog.content || '<p>Content not available</p>'}
    </div>
    <hr>`;
    });

    html += `
</body>
</html>`;

    return html;
}

