/**
 * Slide Deck Generator
 * Creates HTML-based slide presentations with charts and graphs
 * Supports export as standalone HTML file
 */

interface SlideData {
    title: string;
    subtitle?: string;
    content?: string;
    chartData?: ChartData;
    bullets?: string[];
    layout?: 'title' | 'content' | 'chart' | 'comparison' | 'bullets';
}

interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'comparison';
    data: Array<{ label: string; value: number; color?: string }>;
    title?: string;
    yAxisLabel?: string;
    xAxisLabel?: string;
}

interface SlideReportData {
    client: { name: string };
    website: { url: string; name?: string };
    period: { start: string; end: string };
    summary: any;
    baseline: any;
    current: any;
    comparison: any;
    topicCoverageDelta: any;
    topPosts: any[];
    underperformers: any[];
    trends: any;
    narrative: any;
}

/**
 * Generate a complete HTML slide deck with embedded charts
 */
export function generateHTMLSlides(reportData: SlideReportData): string {
    const slides = buildSlides(reportData);
    const html = renderSlidesHTML(slides);
    return html;
}

/**
 * Build slide data from report
 */
function buildSlides(data: SlideReportData): SlideData[] {
    const { client, website, period, summary, baseline, current, comparison, topicCoverageDelta, topPosts, underperformers, trends, narrative } = data;
    const periodStart = new Date(period.start).toLocaleDateString();
    const periodEnd = new Date(period.end).toLocaleDateString();

    const slides: SlideData[] = [];

    // Slide 1: Title
    slides.push({
        title: 'SEO Performance Report',
        subtitle: client.name,
        content: `${website.name || website.url}\n${periodStart} - ${periodEnd}`,
        layout: 'title'
    });

    // Slide 2: Executive Summary (if narrative exists)
    if (narrative?.executiveSummary) {
        slides.push({
            title: 'Executive Summary',
            content: narrative.executiveSummary,
            bullets: narrative.keyWins?.slice(0, 3),
            layout: 'content'
        });
    }

    // Slide 3: Baseline vs Current with Bar Chart
    if (comparison && baseline && current) {
        slides.push({
            title: 'SEO Score Progress',
            chartData: {
                type: 'comparison',
                data: [
                    { label: 'Baseline', value: baseline.score, color: '#94a3b8' },
                    { label: 'Current', value: current.score, color: Number(comparison.scoreChange) >= 0 ? '#10b981' : '#ef4444' },
                    { label: 'Target', value: 100, color: '#6366f1' }
                ],
                title: `Score Change: ${Number(comparison.scoreChange) >= 0 ? '+' : ''}${comparison.scoreChange} points`,
                yAxisLabel: 'SEO Score'
            },
            layout: 'chart'
        });
    }

    // Slide 4: Performance Metrics with Multiple Charts
    slides.push({
        title: 'Performance Summary',
        content: `Period: ${periodStart} - ${periodEnd}`,
        bullets: [
            `${summary.totalPosts} posts published`,
            `${summary.totalImpressions.toLocaleString()} total impressions`,
            `${summary.totalClicks.toLocaleString()} total clicks`,
            `${summary.avgCTR}% average CTR`,
            `Position ${summary.avgPosition} average ranking`,
            `${summary.avgSEO}/100 average SEO score`
        ],
        layout: 'bullets'
    });

    // Slide 5: Traffic Trends (if available)
    if (trends) {
        slides.push({
            title: 'Traffic Trends',
            chartData: {
                type: 'bar',
                data: [
                    {
                        label: 'Impressions',
                        value: Math.abs(trends.impressions.percentChange),
                        color: trends.impressions.percentChange >= 0 ? '#10b981' : '#ef4444'
                    },
                    {
                        label: 'Clicks',
                        value: Math.abs(trends.clicks.percentChange),
                        color: trends.clicks.percentChange >= 0 ? '#10b981' : '#ef4444'
                    }
                ],
                title: 'Period-over-Period Growth (%)',
                yAxisLabel: 'Percent Change'
            },
            content: `Impressions: ${trends.impressions.change >= 0 ? '+' : ''}${trends.impressions.change.toLocaleString()} (${trends.impressions.percentChange >= 0 ? '+' : ''}${trends.impressions.percentChange.toFixed(1)}%)\nClicks: ${trends.clicks.change >= 0 ? '+' : ''}${trends.clicks.change.toLocaleString()} (${trends.clicks.percentChange >= 0 ? '+' : ''}${trends.clicks.percentChange.toFixed(1)}%)`,
            layout: 'chart'
        });
    }

    // Slide 6: Topic Coverage
    if (topicCoverageDelta) {
        slides.push({
            title: 'Content Coverage',
            chartData: {
                type: 'pie',
                data: [
                    { label: 'Covered', value: topicCoverageDelta.coveredTopics, color: '#10b981' },
                    { label: 'Uncovered', value: topicCoverageDelta.uncoveredTopics, color: '#f59e0b' }
                ],
                title: `${topicCoverageDelta.coveragePercentage}% Coverage (${topicCoverageDelta.coveredTopics}/${topicCoverageDelta.totalTopics} topics)`
            },
            layout: 'chart'
        });

        // Slide 7: Content Gaps
        if (topicCoverageDelta.topGaps?.length > 0) {
            slides.push({
                title: 'Top Content Opportunities',
                bullets: topicCoverageDelta.topGaps.slice(0, 5).map((gap: any) =>
                    `${gap.name} - ${gap.estimatedTraffic.toLocaleString()} monthly searches`
                ),
                layout: 'bullets'
            });
        }
    }

    // Slide 8: Top Performers with Bar Chart
    if (topPosts.length > 0) {
        slides.push({
            title: 'Top Performing Posts',
            chartData: {
                type: 'bar',
                data: topPosts.slice(0, 5).map((post: any) => ({
                    label: (post.target_keyword || 'Untitled').substring(0, 30),
                    value: post.metrics.clicks,
                    color: '#6366f1'
                })),
                title: 'Clicks per Post',
                yAxisLabel: 'Clicks'
            },
            layout: 'chart'
        });
    }

    // Slide 9: Underperformers (if any)
    if (underperformers.length > 0) {
        slides.push({
            title: 'Improvement Opportunities',
            bullets: underperformers.slice(0, 4).map((post: any) =>
                `${post.title.substring(0, 40)} - ${post.recommendations[0]}`
            ),
            layout: 'bullets'
        });
    }

    // Slide 10: Next Steps
    if (narrative?.nextSteps?.length > 0) {
        slides.push({
            title: 'Recommended Next Steps',
            bullets: narrative.nextSteps.slice(0, 5),
            layout: 'bullets'
        });
    }

    // Final Slide: Thank You / CTA
    slides.push({
        title: 'Questions & Discussion',
        content: narrative?.callToAction || 'Let\'s discuss how to continue improving your SEO performance.',
        layout: 'title'
    });

    return slides;
}

/**
 * Render slides as standalone HTML
 */
function renderSlidesHTML(slides: SlideData[]): string {
    const slidesHTML = slides.map((slide, index) => renderSlide(slide, index)).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO Performance Report - Slide Deck</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #0f172a;
            color: #1e293b;
            overflow: hidden;
        }

        .slide-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            overflow-x: scroll;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
        }

        .slide-container::-webkit-scrollbar { display: none; }

        .slide {
            min-width: 100vw;
            height: 100vh;
            scroll-snap-align: start;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 80px;
            background: white;
            position: relative;
        }

        .slide::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef);
        }

        .slide-number {
            position: absolute;
            bottom: 30px;
            right: 40px;
            font-size: 14px;
            color: #94a3b8;
            font-weight: 500;
        }

        .slide.title-layout {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .slide-title {
            font-size: 56px;
            font-weight: 800;
            margin-bottom: 20px;
            line-height: 1.2;
            text-align: center;
        }

        .slide.title-layout .slide-title {
            font-size: 72px;
            color: white;
        }

        .slide-subtitle {
            font-size: 32px;
            font-weight: 600;
            color: #cbd5e1;
            margin-bottom: 30px;
            text-align: center;
        }

        .slide-content {
            font-size: 20px;
            line-height: 1.8;
            max-width: 900px;
            text-align: center;
            white-space: pre-wrap;
            color: #334155;
        }

        .slide.title-layout .slide-content {
            color: white;
            font-size: 24px;
        }

        .bullets {
            list-style: none;
            max-width: 900px;
            width: 100%;
            margin-top: 40px;
        }

        .bullets li {
            font-size: 28px;
            line-height: 1.6;
            margin: 24px 0;
            padding-left: 50px;
            position: relative;
            color: #1e293b;
        }

        .bullets li::before {
            content: '→';
            position: absolute;
            left: 0;
            color: #6366f1;
            font-weight: bold;
            font-size: 32px;
        }

        .chart-container {
            margin-top: 40px;
            width: 100%;
            max-width: 1000px;
        }

        .chart-title {
            font-size: 20px;
            font-weight: 600;
            color: #475569;
            margin-bottom: 30px;
            text-align: center;
        }

        /* Navigation */
        .nav-buttons {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
            z-index: 1000;
        }

        .nav-button {
            background: #6366f1;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);
        }

        .nav-button:hover {
            background: #4f46e5;
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(99, 102, 241, 0.4);
        }

        .nav-button:disabled {
            background: #cbd5e1;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        /* Print styles */
        @media print {
            .slide { page-break-after: always; }
            .nav-buttons { display: none; }
        }
    </style>
</head>
<body>
    <div class="slide-container" id="slideContainer">
        ${slidesHTML}
    </div>

    <div class="nav-buttons">
        <button class="nav-button" id="prevBtn" onclick="navigate(-1)">← Previous</button>
        <button class="nav-button" id="nextBtn" onclick="navigate(1)">Next →</button>
    </div>

    <script>
        let currentSlide = 0;
        const totalSlides = ${slides.length};
        const container = document.getElementById('slideContainer');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        function navigate(direction) {
            currentSlide += direction;
            if (currentSlide < 0) currentSlide = 0;
            if (currentSlide >= totalSlides) currentSlide = totalSlides - 1;

            container.scrollTo({
                left: currentSlide * window.innerWidth,
                behavior: 'smooth'
            });

            updateButtons();
        }

        function updateButtons() {
            prevBtn.disabled = currentSlide === 0;
            nextBtn.disabled = currentSlide === totalSlides - 1;
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        });

        // Detect scroll position
        container.addEventListener('scroll', () => {
            currentSlide = Math.round(container.scrollLeft / window.innerWidth);
            updateButtons();
        });

        updateButtons();
    </script>
</body>
</html>`;
}

/**
 * Render individual slide
 */
function renderSlide(slide: SlideData, index: number): string {
    const layout = slide.layout || 'content';
    const layoutClass = layout === 'title' ? 'title-layout' : '';

    let content = '';

    if (slide.subtitle) {
        content += `<div class="slide-subtitle">${escapeHTML(slide.subtitle)}</div>`;
    }

    if (slide.content) {
        content += `<div class="slide-content">${escapeHTML(slide.content)}</div>`;
    }

    if (slide.bullets && slide.bullets.length > 0) {
        content += `<ul class="bullets">`;
        slide.bullets.forEach(bullet => {
            content += `<li>${escapeHTML(bullet)}</li>`;
        });
        content += `</ul>`;
    }

    if (slide.chartData) {
        content += renderChart(slide.chartData);
    }

    return `
    <div class="slide ${layoutClass}">
        <h1 class="slide-title">${escapeHTML(slide.title)}</h1>
        ${content}
        <div class="slide-number">${index + 1} / ${index + 1}</div>
    </div>`;
}

/**
 * Render SVG chart
 */
function renderChart(chartData: ChartData): string {
    if (chartData.type === 'bar') {
        return renderBarChart(chartData);
    } else if (chartData.type === 'comparison') {
        return renderComparisonChart(chartData);
    } else if (chartData.type === 'pie') {
        return renderPieChart(chartData);
    }
    return '';
}

/**
 * Render bar chart
 */
function renderBarChart(chartData: ChartData): string {
    const maxValue = Math.max(...chartData.data.map(d => d.value), 1);
    const barWidth = 80;
    const spacing = 40;
    const chartWidth = chartData.data.length * (barWidth + spacing);
    const chartHeight = 400;

    const bars = chartData.data.map((item, index) => {
        const barHeight = (item.value / maxValue) * (chartHeight - 100);
        const x = index * (barWidth + spacing) + 50;
        const y = chartHeight - barHeight - 50;
        const color = item.color || '#6366f1';

        return `
            <g>
                <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}"
                      fill="${color}" rx="4" />
                <text x="${x + barWidth / 2}" y="${y - 10}"
                      text-anchor="middle" font-size="18" font-weight="600" fill="#1e293b">
                    ${item.value.toFixed(1)}
                </text>
                <text x="${x + barWidth / 2}" y="${chartHeight - 20}"
                      text-anchor="middle" font-size="14" fill="#64748b">
                    ${item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label}
                </text>
            </g>
        `;
    }).join('');

    return `
        <div class="chart-container">
            ${chartData.title ? `<div class="chart-title">${escapeHTML(chartData.title)}</div>` : ''}
            <svg width="${chartWidth + 100}" height="${chartHeight}" style="margin: 0 auto; display: block;">
                ${bars}
            </svg>
        </div>
    `;
}

/**
 * Render comparison bar chart
 */
function renderComparisonChart(chartData: ChartData): string {
    return renderBarChart(chartData);
}

/**
 * Render pie chart
 */
function renderPieChart(chartData: ChartData): string {
    const total = chartData.data.reduce((sum, d) => sum + d.value, 0);
    const centerX = 250;
    const centerY = 200;
    const radius = 150;

    let currentAngle = -90; // Start at top
    const slices = chartData.data.map(item => {
        const sliceAngle = (item.value / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = centerX + radius * Math.cos(startRad);
        const y1 = centerY + radius * Math.sin(startRad);
        const x2 = centerX + radius * Math.cos(endRad);
        const y2 = centerY + radius * Math.sin(endRad);

        const largeArc = sliceAngle > 180 ? 1 : 0;

        const path = `M ${centerX},${centerY} L ${x1},${y1} A ${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;

        currentAngle = endAngle;

        return {
            path,
            color: item.color || '#6366f1',
            label: item.label,
            value: item.value,
            percentage: ((item.value / total) * 100).toFixed(1)
        };
    });

    const slicesHTML = slices.map(slice => `
        <path d="${slice.path}" fill="${slice.color}" stroke="white" stroke-width="3" />
    `).join('');

    const legendHTML = slices.map((slice, index) => `
        <div style="display: flex; align-items: center; margin: 10px 0;">
            <div style="width: 24px; height: 24px; background: ${slice.color}; border-radius: 4px; margin-right: 12px;"></div>
            <span style="font-size: 18px; color: #1e293b;">
                ${slice.label}: ${slice.value} (${slice.percentage}%)
            </span>
        </div>
    `).join('');

    return `
        <div class="chart-container">
            ${chartData.title ? `<div class="chart-title">${escapeHTML(chartData.title)}</div>` : ''}
            <div style="display: flex; justify-content: center; align-items: center; gap: 60px;">
                <svg width="500" height="400">
                    ${slicesHTML}
                </svg>
                <div>
                    ${legendHTML}
                </div>
            </div>
        </div>
    `;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
