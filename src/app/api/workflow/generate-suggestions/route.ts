import { NextRequest, NextResponse } from 'next/server';

interface BlogSuggestion {
    id: string;
    title: string;
    angle: string;
    targetKeyword: string;
    estimatedTraffic: number;
    difficulty: number;
}

// POST /api/workflow/generate-suggestions - Generate blog titles and angles
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { analysis } = body;

        if (!analysis || !analysis.clusters) {
            return NextResponse.json(
                { success: false, error: 'Analysis data is required' },
                { status: 400 }
            );
        }

        const suggestions: BlogSuggestion[] = [];

        // Generate blog suggestions from clusters
        for (const cluster of analysis.clusters) {
            const articleCount = cluster.recommended_article_count || 3;
            
            for (let i = 0; i < articleCount && i < 5; i++) {
                // Generate varied titles and angles for each cluster
                const titles = generateTitlesForCluster(cluster, i);
                const angles = generateAnglesForCluster(cluster, i);

                suggestions.push({
                    id: `${cluster.id || cluster.name}-${i}`,
                    title: titles[0],
                    angle: angles[0],
                    targetKeyword: cluster.primary_keyword,
                    estimatedTraffic: Math.floor(cluster.estimated_traffic / articleCount),
                    difficulty: cluster.difficulty
                });
            }
        }

        // Limit to top 20 suggestions
        const topSuggestions = suggestions
            .sort((a, b) => (b.estimatedTraffic / (b.difficulty + 1)) - (a.estimatedTraffic / (a.difficulty + 1)))
            .slice(0, 20);

        return NextResponse.json({
            success: true,
            blogs: topSuggestions
        });

    } catch (error: any) {
        console.error('Error generating suggestions:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate suggestions' },
            { status: 500 }
        );
    }
}

function generateTitlesForCluster(cluster: any, index: number): string[] {
    const keyword = cluster.primary_keyword;
    const clusterName = cluster.name;

    const templates = [
        `Complete Guide to ${keyword}`,
        `How to Master ${keyword} in 2024`,
        `${keyword}: Everything You Need to Know`,
        `The Ultimate ${keyword} Guide for Beginners`,
        `${keyword} Best Practices: Expert Tips`,
        `10 Essential ${keyword} Strategies`,
        `${keyword} Explained: A Comprehensive Overview`,
        `Getting Started with ${keyword}`,
        `${keyword} Tips and Tricks`,
        `Advanced ${keyword} Techniques`
    ];

    return [templates[index % templates.length]];
}

function generateAnglesForCluster(cluster: any, index: number): string[] {
    const angles = [
        'Educational approach: Teach readers the fundamentals and build their knowledge step-by-step',
        'Problem-solving angle: Address common pain points and provide actionable solutions',
        'Comparison perspective: Compare different approaches, tools, or methods',
        'Case study format: Share real-world examples and success stories',
        'Trend analysis: Explore current trends and future predictions',
        'Beginner-friendly: Break down complex concepts into simple, digestible pieces',
        'Expert deep-dive: Provide advanced insights for experienced practitioners',
        'Practical tutorial: Step-by-step instructions with examples',
        'Industry insights: Share expert opinions and industry perspectives',
        'Resource compilation: Curate the best tools, resources, and references'
    ];

    return [angles[index % angles.length]];
}

