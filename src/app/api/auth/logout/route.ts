import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/logout - Sign out the current user
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Signed out successfully'
        });

    } catch (error: any) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Logout failed' },
            { status: 500 }
        );
    }
}

