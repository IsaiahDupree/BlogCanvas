import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify client is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get client record
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id, name, vendor_id')
            .eq('auth_user_id', user.id)
            .single()

        if (clientError || !client) {
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            )
        }

        // Parse request body
        const { post_ids, action, feedback } = await request.json()

        // Validate inputs
        if (!post_ids || !Array.isArray(post_ids) || post_ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'post_ids array is required' },
                { status: 400 }
            )
        }

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { success: false, error: 'action must be "approve" or "reject"' },
                { status: 400 }
            )
        }

        if (action === 'reject' && !feedback) {
            return NextResponse.json(
                { success: false, error: 'feedback is required for rejection' },
                { status: 400 }
            )
        }

        // Verify all posts belong to this client
        const { data: posts, error: postsError } = await supabase
            .from('blog_posts')
            .select('id, topic, client_id, status, vendor_id')
            .in('id', post_ids)

        if (postsError) {
            console.error('Error fetching posts:', postsError)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch posts' },
                { status: 500 }
            )
        }

        // Check all posts belong to this client
        const unauthorized = posts?.filter(p => p.client_id !== client.id)
        if (unauthorized && unauthorized.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Some posts do not belong to this client' },
                { status: 403 }
            )
        }

        // Determine new status based on action
        const newStatus = action === 'approve' ? 'client_approved' : 'client_rejected'

        // Update all posts
        const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString()
        }

        // Add feedback to metadata if rejecting
        if (action === 'reject') {
            updateData.metadata = { client_feedback: feedback }
        }

        const { error: updateError } = await supabase
            .from('blog_posts')
            .update(updateData)
            .in('id', post_ids)

        if (updateError) {
            console.error('Error updating posts:', updateError)
            return NextResponse.json(
                { success: false, error: 'Failed to update posts' },
                { status: 500 }
            )
        }

        // Log activity for each post
        const activityLogs = post_ids.map(postId => ({
            user_id: user.id,
            entity_type: 'blog_post',
            entity_id: postId,
            action: action === 'approve' ? 'client_approved' : 'client_rejected',
            metadata: {
                client_name: client.name,
                batch_action: true,
                total_posts: post_ids.length,
                ...(action === 'reject' && { feedback })
            }
        }))

        await supabase
            .from('activity_log')
            .insert(activityLogs)

        // Send notification email to vendor
        try {
            // Get vendor email
            const { data: vendorUser } = await supabase
                .from('users')
                .select('email, full_name')
                .eq('id', client.vendor_id)
                .single()

            if (vendorUser?.email && process.env.RESEND_API_KEY) {
                const actionText = action === 'approve' ? 'approved' : 'requested changes for'
                const actionColor = action === 'approve' ? '#10b981' : '#f59e0b'
                const postsList = posts?.map(p => `<li>${p.topic}</li>`).join('') || ''

                const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px;">Batch Client Action</h1>
        <p style="color: #6b7280; margin: 0; font-size: 16px;">
            ${client.name} has ${actionText} ${post_ids.length} post${post_ids.length > 1 ? 's' : ''}
        </p>
    </div>

    <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
        <h2 style="color: ${actionColor}; margin: 0 0 16px 0; font-size: 18px; display: flex; align-items: center;">
            ${action === 'approve' ? '✓ Approved' : '⚠ Changes Requested'}
        </h2>

        <h3 style="color: #374151; margin: 20px 0 10px 0; font-size: 16px;">Posts Affected:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
            ${postsList}
        </ul>

        ${action === 'reject' && feedback ? `
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-top: 20px; border-radius: 4px;">
            <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Client Feedback:</h4>
            <p style="color: #78350f; margin: 0; font-size: 14px;">${feedback}</p>
        </div>
        ` : ''}
    </div>

    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
            Log in to BlogCanvas to view details and take action
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848'}/app/review"
           style="display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
            View in Dashboard
        </a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This is an automated notification from BlogCanvas.<br>
            You're receiving this because you're assigned as the vendor for ${client.name}.
        </p>
    </div>
</body>
</html>`

                const textContent = `
Batch Client Action

${client.name} has ${actionText} ${post_ids.length} post${post_ids.length > 1 ? 's' : ''}

Posts Affected:
${posts?.map(p => `- ${p.topic}`).join('\n') || ''}

${action === 'reject' && feedback ? `
Client Feedback:
${feedback}
` : ''}

Log in to BlogCanvas to view details and take action:
${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848'}/app/review

---
This is an automated notification from BlogCanvas.
`

                await resend.emails.send({
                    from: 'BlogCanvas <noreply@blogcanvas.app>',
                    to: vendorUser.email,
                    subject: `${client.name} ${actionText} ${post_ids.length} post${post_ids.length > 1 ? 's' : ''}`,
                    html: htmlContent,
                    text: textContent
                })
            }
        } catch (emailError) {
            console.error('Failed to send notification email:', emailError)
            // Don't fail the request if email fails
        }

        return NextResponse.json({
            success: true,
            message: `Successfully ${action === 'approve' ? 'approved' : 'rejected'} ${post_ids.length} posts`,
            updated_count: post_ids.length
        })

    } catch (error) {
        console.error('Batch action error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
