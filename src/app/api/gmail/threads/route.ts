import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gmailService } from '@/lib/gmail-service';

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get threads from database
    const threads = await gmailService.getThreads(user.id, limit);

    return NextResponse.json({ threads });
  } catch (error: any) {
    console.error('Get threads error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}
