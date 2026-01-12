import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gmailService } from '@/lib/gmail-service';

export async function POST(request: NextRequest) {
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

    const { maxResults = 50 } = await request.json();

    // Sync emails from Gmail
    const syncedCount = await gmailService.syncThreads(user.id, maxResults);

    return NextResponse.json({
      success: true,
      syncedCount,
      message: `Synced ${syncedCount} email threads`
    });
  } catch (error: any) {
    console.error('Gmail sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync emails' },
      { status: 500 }
    );
  }
}
