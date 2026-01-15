import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { queueTransactionalEmail } from '@/lib/emails/transactional-email-service';
import { createClient, requireStaff } from '@/lib/supabase/server';

// GET /api/clients - List all clients with stats (paginated)
export async function GET(request: Request) {
    try {
        await requireStaff();

        const supabase = createClient();
        const { searchParams } = new URL(request.url);

        // Import pagination utilities dynamically to avoid circular dependencies
        const { parsePaginationParams, applyPagination, applySorting, createPaginatedResponse } = await import('@/lib/pagination');
        const { queryCache, CacheKeys } = await import('@/lib/cache');

        const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams);

        // Build cache key
        const cacheKey = CacheKeys.clients({ page, limit, sortBy, sortOrder });

        // Try to get from cache
        const cached = queryCache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Build base query with count
        let query = supabase
            .from('clients')
            .select(`
                *,
                websites (count),
                blog_posts (count),
                content_batches (count)
            `, { count: 'exact' });

        // Apply sorting
        const sortColumn = sortBy || 'created_at';
        query = applySorting(query, sortColumn, sortOrder);

        // Apply pagination
        query = applyPagination(query, page, limit);

        const { data: clients, count, error } = await query;

        if (error) throw error;

        const response = {
            success: true,
            ...createPaginatedResponse(clients || [], count || 0, page, limit),
        };

        // Cache the response
        queryCache.set(cacheKey, response);

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('Error fetching clients:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch clients' },
            { status: error.message?.includes('Staff access required') ? 403 : 500 }
        );
    }
}

// POST /api/clients - Create new client and send invitation
export async function POST(request: Request) {
    try {
        await requireStaff();

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            name,
            website,
            contact_email,
            contact_name,
            onboarding_method,
            send_invitation = true,
            client_role = 'client_admin',
            // PRD Stage 1 fields
            industry,
            niche,
            company_size,
            business_goals,
            seo_goals,
            target_markets,
            brand_values,
            key_differentiators,
            content_topics
        } = body;

        if (!name || !contact_email) {
            return NextResponse.json(
                { success: false, error: 'Client name and contact email are required' },
                { status: 400 }
            );
        }

        // Generate slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        // Check for duplicate slug
        const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('slug', slug)
            .single();

        if (existingClient) {
            return NextResponse.json(
                { success: false, error: `A client with slug "${slug}" already exists` },
                { status: 400 }
            );
        }

        // Get vendor info for email
        const { data: profile } = await supabase
            .from('profiles')
            .select('vendor_id, vendors!inner(name)')
            .eq('id', user.id)
            .single();

        const vendorName = profile?.vendors?.name || 'BlogCanvas';

        // Insert client into Supabase
        const { data: client, error } = await supabaseAdmin
            .from('clients')
            .insert({
                name,
                slug,
                website_url: website || '',
                contact_email: contact_email || '',
                contact_name: contact_name || '',
                status: 'onboarding',
                onboarded_via: onboarding_method || 'manual_intake',
                vendor_id: profile?.vendor_id,
                // PRD Stage 1 fields
                industry: industry || null,
                niche: niche || null,
                company_size: company_size || null,
                business_goals: business_goals || [],
                seo_goals: seo_goals || {},
                target_markets: target_markets || [],
                brand_values: brand_values || [],
                key_differentiators: key_differentiators || null,
                content_topics: content_topics || []
            })
            .select()
            .single();

        if (error) {
            console.error('Client creation error:', error);
            throw error;
        }

        console.log('Client created:', client);

        // Send invitation email if requested
        let invitationResult = null;
        if (send_invitation && contact_email) {
            try {
                // Create invitation token
                const { data: tokenData } = await supabase.rpc('generate_invitation_token');
                const token = tokenData as string;

                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

                // Create invitation record
                const { data: invitation, error: inviteError } = await supabaseAdmin
                    .from('client_invitations')
                    .insert({
                        client_id: client.id,
                        email: contact_email,
                        token: token,
                        role: client_role,
                        invited_by: user.id,
                        expires_at: expiresAt.toISOString()
                    })
                    .select()
                    .single();

                if (inviteError) {
                    console.error('Invitation creation error:', inviteError);
                } else {
                    // Queue invitation email
                    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848'}/auth/client?token=${token}`;

                    const emailResult = await queueTransactionalEmail({
                        templateKey: 'client_invitation',
                        to: contact_email,
                        toName: contact_name || name,
                        variables: {
                            client_name: contact_name || name,
                            vendor_name: vendorName,
                            portal_url: portalUrl
                        },
                        priority: 1 // High priority for invitations
                    });

                    if (!emailResult.success) {
                        console.error('Failed to queue invitation email:', emailResult.error);
                    }

                    invitationResult = {
                        sent: emailResult.success,
                        invitationUrl: portalUrl,
                        expiresAt: expiresAt.toISOString()
                    };
                }
            } catch (emailError) {
                console.error('Error sending invitation:', emailError);
                // Don't fail the whole request if email fails
            }
        }

        return NextResponse.json({
            success: true,
            client,
            invitation: invitationResult,
            message: send_invitation
                ? 'Client created and invitation sent successfully'
                : 'Client created successfully'
        });
    } catch (error: any) {
        console.error('Error creating client:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create client' },
            { status: error.message?.includes('Staff access required') ? 403 : 500 }
        );
    }
}
