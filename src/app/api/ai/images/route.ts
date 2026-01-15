import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runImagePromptAgent, generateImageWithDALLE, generateBlogImages } from '@/lib/agents/image-generator';
import { getSharedClientContext } from '@/lib/brand/shared-context';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      action = 'prompts', // 'prompts' | 'generate' | 'generate-all'
      topic,
      contentSummary,
      prompt,
      brandColors,
      imageStyle,
      targetAudience,
      imageCount = 5,
      size = '1792x1024',
      quality = 'standard',
      generateHero = true,
      generateSocial = true,
      inlineCount = 2,
      clientId // NEW: Accept clientId to pull brand context
    } = body;

    // Get brand context if clientId provided
    let brandContext = null;
    let enhancedImageStyle = imageStyle;
    let enhancedBrandColors = brandColors;
    let enhancedTargetAudience = targetAudience;
    let bannedElements: string[] = [];
    let imageSpecs = { size, quality };

    if (clientId) {
      try {
        brandContext = await getSharedClientContext(clientId);

        // Use image guidelines from brand context
        const imgGuidelines = brandContext.imageGuidelines;

        // Apply AI generation settings
        if (imgGuidelines.aiGenerationSettings) {
          enhancedImageStyle = imgGuidelines.aiGenerationSettings.style || imageStyle;
          bannedElements = imgGuidelines.aiGenerationSettings.bannedElements || [];
        }

        // Apply target audience from brand context
        if (brandContext.targetAudiences.length > 0) {
          enhancedTargetAudience = brandContext.targetAudiences
            .map((ta: any) => ta.name || ta.description)
            .join(', ');
        }

        // Apply featured image specs
        if (imgGuidelines.featuredImageSpecs) {
          const { minWidth, minHeight, preferredFormat } = imgGuidelines.featuredImageSpecs;
          // Map aspect ratio to DALL-E size format
          const aspectRatio = imgGuidelines.featuredImageSpecs.aspectRatio;
          if (aspectRatio === '16:9') {
            imageSpecs.size = '1792x1024';
          } else if (aspectRatio === '1:1') {
            imageSpecs.size = '1024x1024';
          }
        }
      } catch (error) {
        console.error('Failed to fetch brand context for image generation:', error);
        // Continue with provided values if context fetch fails
      }
    }

    // Generate image prompts only
    if (action === 'prompts') {
      if (!topic || !contentSummary) {
        return NextResponse.json({ 
          error: 'Topic and content summary are required' 
        }, { status: 400 });
      }

      const result = await runImagePromptAgent({
        topic,
        contentSummary,
        brandColors: enhancedBrandColors,
        imageStyle: enhancedImageStyle,
        targetAudience: enhancedTargetAudience,
        imageCount
      });

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        prompts: result.data?.prompts,
        heroImage: result.data?.heroImage,
        socialImage: result.data?.socialImage,
        inlineImages: result.data?.inlineImages,
        stockPhotoKeywords: result.data?.stockPhotoKeywords,
        colorPalette: result.data?.colorPalette
      });
    }

    // Generate a single image with DALL-E
    if (action === 'generate') {
      if (!prompt) {
        return NextResponse.json({ 
          error: 'Prompt is required for image generation' 
        }, { status: 400 });
      }

      const result = await generateImageWithDALLE(prompt, imageSpecs.size as any, imageSpecs.quality as any);

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        image: result.data
      });
    }

    // Generate all images for a blog post
    if (action === 'generate-all') {
      if (!topic || !contentSummary) {
        return NextResponse.json({ 
          error: 'Topic and content summary are required' 
        }, { status: 400 });
      }

      const result = await generateBlogImages(topic, contentSummary, {
        generateHero,
        generateSocial,
        inlineCount,
        quality: imageSpecs.quality as any
      });

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        images: result.data
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Use: prompts, generate, or generate-all' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
