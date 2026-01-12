import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gmailService } from '@/lib/gmail-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { threadId } = await params;
    const { clientId, projectId } = await request.json();

    // Link thread to client or project
    if (clientId) {
      await gmailService.linkThreadToClient(threadId, clientId);
    }
    if (projectId) {
      await gmailService.linkThreadToProject(threadId, projectId);
    }

    return NextResponse.json({
      success: true,
      message: 'Thread linked successfully'
    });
  } catch (error: any) {
    console.error('Link thread error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to link thread' },
      { status: 500 }
    );
  }
}
