import { NextRequest, NextResponse } from 'next/server';
import { getServerUserProfile } from '@/lib/supabase/server';

/**
 * GET /api/auth/me - Get current authenticated user and profile
 */
export async function GET(request: NextRequest) {
    try {
        const profile = await getServerUserProfile();

        if (!profile) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: profile.user,
            profile: {
                role: profile.profile?.role,
                client_id: profile.profile?.client_id,
                full_name: profile.profile?.full_name,
                email: profile.user?.email
            }
        });

    } catch (error: any) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to get user' },
            { status: 500 }
        );
    }
}

