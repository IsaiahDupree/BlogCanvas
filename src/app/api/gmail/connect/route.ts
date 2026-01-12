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

    // Generate OAuth URL with user ID in state
    const authUrl = gmailService.getAuthUrl(user.id);

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('Gmail connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Gmail connection' },
      { status: 500 }
    );
  }
}
