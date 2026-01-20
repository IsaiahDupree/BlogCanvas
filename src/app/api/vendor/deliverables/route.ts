import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendDeliverableReadyEmail } from '@/lib/vendor/email-notifications';

// Admin client for storage operations
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('vendor_deliverables')
      .select(`
        *,
        vendor_workspaces (
          id,
          name,
          vendor_clients (
            email,
            full_name
          )
        )
      `)
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data: deliverables, error } = await query;

    if (error) {
      console.error('Error fetching deliverables:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch deliverables' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deliverables: deliverables || []
    });

  } catch (error: any) {
    console.error('Error in deliverables API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const workspaceId = formData.get('workspace_id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const deliverableType = (formData.get('deliverable_type') as string) || 'file';
    const linkUrl = formData.get('link_url') as string | null;
    const shouldDeliver = formData.get('deliver') === 'true';

    if (!workspaceId || !name) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Verify workspace belongs to vendor
    const { data: workspace, error: wsError } = await supabase
      .from('vendor_workspaces')
      .select('id, client_id, vendor_clients (email, full_name)')
      .eq('id', workspaceId)
      .eq('vendor_id', vendor.id)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    let fileUrl: string | null = null;
    let fileSize: number | null = null;
    let fileType: string | null = null;

    // Handle file upload
    if (file && deliverableType === 'file') {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = `vendor-deliverables/${vendor.id}/${workspaceId}/${uniqueFilename}`;

      // Upload to Supabase Storage
      const fileBuffer = await file.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('vendor-files')
        .upload(storagePath, fileBuffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin
        .storage
        .from('vendor-files')
        .getPublicUrl(storagePath);

      fileUrl = urlData.publicUrl;
      fileSize = file.size;
      fileType = fileExtension;
    } else if (deliverableType === 'link' && linkUrl) {
      fileUrl = linkUrl;
    }

    // Create deliverable record
    const { data: deliverable, error: createError } = await supabase
      .from('vendor_deliverables')
      .insert({
        workspace_id: workspaceId,
        vendor_id: vendor.id,
        name,
        description,
        deliverable_type: deliverableType,
        file_url: fileUrl,
        file_size: fileSize,
        file_type: fileType,
        status: shouldDeliver ? 'delivered' : 'draft',
        delivered_at: shouldDeliver ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating deliverable:', createError);
      return NextResponse.json({ success: false, error: 'Failed to create deliverable' }, { status: 500 });
    }

    // Send email notification if delivering
    if (shouldDeliver && workspace.vendor_clients) {
      const clientData = workspace.vendor_clients as unknown as { email: string; full_name?: string };
      if (clientData?.email) {
        try {
          await sendDeliverableReadyEmail({
            clientEmail: clientData.email,
            clientName: clientData.full_name,
            vendorName: vendor.business_name || 'Your vendor',
            deliverableName: name,
            workspaceId
          });
        } catch (emailError) {
          console.error('Error sending deliverable email:', emailError);
          // Don't fail if email fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      deliverable
    });

  } catch (error: any) {
    console.error('Error in deliverables API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, status, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing deliverable ID' }, { status: 400 });
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    // Build update object
    const updateData: any = { ...updates };
    if (status) {
      updateData.status = status;
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }
    }

    // Update deliverable
    const { data: deliverable, error } = await supabase
      .from('vendor_deliverables')
      .update(updateData)
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .select(`
        *,
        vendor_workspaces (
          id,
          vendor_clients (
            email,
            full_name
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error updating deliverable:', error);
      return NextResponse.json({ success: false, error: 'Failed to update deliverable' }, { status: 500 });
    }

    // Send email if status changed to delivered
    if (status === 'delivered' && deliverable.vendor_workspaces?.vendor_clients) {
      const clientData = deliverable.vendor_workspaces.vendor_clients as unknown as { email: string; full_name?: string };
      if (clientData?.email) {
        try {
          await sendDeliverableReadyEmail({
            clientEmail: clientData.email,
            clientName: clientData.full_name,
            vendorName: vendor.business_name || 'Your vendor',
            deliverableName: deliverable.name,
            workspaceId: deliverable.workspace_id
          });
        } catch (emailError) {
          console.error('Error sending deliverable email:', emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      deliverable
    });

  } catch (error: any) {
    console.error('Error in deliverables API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
