import { NextResponse } from 'next/server';

// Mock sections storage
const mockSections: Record<string, any> = {};

// PATCH /api/posts/[postId]/sections/[sectionId] - Update section content
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ postId: string; sectionId: string }> }
) {
    try {
        const { postId, sectionId } = await params;
        const body = await request.json();
        const { content, title, needs_human, human_prompt } = body;

        const sectionKey = `${postId}-${sectionId}`;

        if (!mockSections[sectionKey]) {
            mockSections[sectionKey] = {
                id: sectionId,
                blog_post_id: postId,
                section_key: sectionId
            };
        }

        if (content !== undefined) mockSections[sectionKey].content = content;
        if (title !== undefined) mockSections[sectionKey].title = title;
        if (needs_human !== undefined) mockSections[sectionKey].needs_human = needs_human;
        if (human_prompt !== undefined) mockSections[sectionKey].human_prompt = human_prompt;

        mockSections[sectionKey].updated_at = new Date().toISOString();

        console.log(`Section ${sectionId} updated for post ${postId}`);

        return NextResponse.json({
            success: true,
            section: mockSections[sectionKey],
            message: 'Section updated successfully'
        });
    } catch (error) {
        console.error('Error updating section:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update section' },
            { status: 500 }
        );
    }
}

// POST /api/posts/[postId]/sections/[sectionId]/regenerate - Regenerate section with AI
export async function POST(
    request: Request,
    { params }: { params: Promise<{ postId: string; sectionId: string }> }
) {
    try {
        const { postId, sectionId } = await params;
        const body = await request.json();
        const { prompt, focusArea } = body;

        console.log(`Regenerating section ${sectionId} for post ${postId}`);
        console.log('Prompt:', prompt);
        console.log('Focus area:', focusArea);

        // In production: call draft agent with specific section focus
        // const newContent = await draftAgent.regenerateSection(postId, sectionId, prompt);

        // Simulate AI generation
        const mockNewContent = `
      <h3>Regenerated Content</h3>
      <p>This section has been regenerated based on your feedback: "${prompt}"</p>
      <p>The AI has focused on: ${focusArea || 'improving overall quality'}</p>
    `;

        const sectionKey = `${postId}-${sectionId}`;
        if (!mockSections[sectionKey]) {
            mockSections[sectionKey] = { id: sectionId, blog_post_id: postId };
        }

        mockSections[sectionKey].content = mockNewContent;
        mockSections[sectionKey].regenerated_at = new Date().toISOString();
        mockSections[sectionKey].regeneration_prompt = prompt;

        return NextResponse.json({
            success: true,
            section: mockSections[sectionKey],
            message: 'Section regenerated successfully'
        });
    } catch (error) {
        console.error('Error regenerating section:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to regenerate section' },
            { status: 500 }
        );
    }
}
