import { NextRequest, NextResponse } from 'next/server';
import { generateBlogPost } from '@/lib/ai/content-generator';
import { generateText, generateImage, isOpenAIConfigured } from '@/lib/ai/openai-provider';

interface BlogPost {
    id: string;
    title: string;
    angle: string;
    targetKeyword: string;
    content?: string;
    imageUrl?: string;
    seoScore?: number;
    wordCount?: number;
}

// POST /api/workflow/generate-blogs - Generate full blog content with images
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { blogs, includeImages = true, humanTone = true } = body;

        if (!blogs || !Array.isArray(blogs) || blogs.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Blogs array is required' },
                { status: 400 }
            );
        }

        const useOpenAI = isOpenAIConfigured();
        const generatedBlogs: BlogPost[] = [];

        // Generate content for each blog
        for (let i = 0; i < blogs.length; i++) {
            const blog = blogs[i];
            
            try {
                let content: string;
                let qualityScore: number;

                if (useOpenAI) {
                    // Use OpenAI for enhanced content generation
                    const systemPrompt = `You are an expert content writer specializing in SEO-optimized blog posts. 
Write in a ${humanTone ? 'conversational, human, engaging' : 'professional'} tone.
Focus on providing value, using the target keyword naturally, and creating comprehensive content.`;

                    const userPrompt = `Write a comprehensive blog post about: "${blog.title}"

Target Keyword: ${blog.targetKeyword}
Angle: ${blog.angle}
Target Word Count: 1500 words

Requirements:
- Engaging introduction that hooks the reader
- Well-structured content with clear headings
- Natural keyword integration
- Actionable insights and examples
- Strong conclusion with key takeaways
- SEO-optimized throughout

Format the response as HTML with proper headings (h2, h3), paragraphs, and lists.`;

                    content = await generateText({
                        model: 'gpt-4o',
                        systemPrompt,
                        userPrompt,
                        temperature: 0.7,
                        maxTokens: 3000
                    });

                    // Calculate quality score (simplified - in production, use more sophisticated analysis)
                    const wordCount = content.split(/\s+/).length;
                    const keywordCount = (content.toLowerCase().match(new RegExp(blog.targetKeyword.toLowerCase(), 'g')) || []).length;
                    const keywordDensity = (keywordCount / wordCount) * 100;
                    
                    qualityScore = Math.min(100, Math.max(60, 
                        70 + // Base score
                        (wordCount > 1200 ? 10 : 0) + // Word count bonus
                        (keywordDensity > 1 && keywordDensity < 3 ? 10 : 0) + // Keyword density bonus
                        (content.includes('<h2>') ? 5 : 0) + // Structure bonus
                        (content.includes('<ul>') || content.includes('<ol>') ? 5 : 0) // List bonus
                    ));
                } else {
                    // Fallback to existing content generator
                    const result = await generateBlogPost(
                        blog.title,
                        blog.targetKeyword,
                        {
                            wordCount: 1500,
                            style: humanTone ? 'conversational' : 'professional'
                        }
                    );
                    content = result.content;
                    qualityScore = result.qualityScore;
                }

                // Generate image if requested
                let imageUrl: string | undefined;
                if (includeImages) {
                    try {
                        if (useOpenAI) {
                            // Use DALL-E for image generation
                            const imagePrompt = `Professional, high-quality blog post featured image for: "${blog.title}". 
Style: Modern, clean, business-oriented. No text overlays. Suitable for blog header.`;
                            
                            imageUrl = await generateImage({
                                prompt: imagePrompt,
                                size: '1024x1024',
                                quality: 'standard',
                                style: 'natural'
                            });
                        } else {
                            // Fallback to placeholder
                            imageUrl = await generateImageForBlog(blog.title, blog.targetKeyword);
                        }
                    } catch (imgError: any) {
                        console.error(`Failed to generate image for blog ${blog.id}:`, imgError);
                        // Fallback to placeholder
                        try {
                            imageUrl = await generateImageForBlog(blog.title, blog.targetKeyword);
                        } catch (fallbackError) {
                            console.error('Fallback image generation also failed:', fallbackError);
                        }
                    }
                }

                // Calculate word count
                const wordCount = content.split(/\s+/).length;

                generatedBlogs.push({
                    ...blog,
                    content,
                    imageUrl,
                    seoScore: qualityScore,
                    wordCount
                });

            } catch (error: any) {
                console.error(`Error generating blog ${blog.id}:`, error);
                generatedBlogs.push({
                    ...blog,
                    content: `<p>Error: ${error.message}</p>`
                });
            }
        }

        return NextResponse.json({
            success: true,
            blogs: generatedBlogs,
            openaiUsed: useOpenAI
        });

    } catch (error: any) {
        console.error('Error in blog generation:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate blogs' },
            { status: 500 }
        );
    }
}

async function generateImageForBlog(title: string, keyword: string): Promise<string> {
    // Fallback placeholder image using Unsplash
    const searchTerm = encodeURIComponent(keyword);
    return `https://source.unsplash.com/800x600/?${searchTerm}`;
}
