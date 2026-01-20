import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found' },
        { status: 404 }
      );
    }

    // Get all workspaces with their status
    const { data: workspaces, error: workspacesError } = await supabase
      .from('vendor_workspaces')
      .select(`
        id,
        status,
        client_id,
        vendor_clients!inner(
          id,
          email,
          full_name,
          status
        )
      `)
      .eq('vendor_id', vendor.id);

    if (workspacesError) {
      console.error('Error fetching workspaces:', workspacesError);
    }

    // Get all clients
    const { data: allClients, error: clientsError } = await supabase
      .from('vendor_clients')
      .select('id, email, full_name, status, created_at')
      .eq('vendor_id', vendor.id);

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
    }

    // Get orders to calculate total value per client
    const { data: orders, error: ordersError } = await supabase
      .from('vendor_orders')
      .select('client_id, total_amount, payment_status')
      .eq('vendor_id', vendor.id);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    // Get meetings to identify who has booked
    const { data: meetings, error: meetingsError } = await supabase
      .from('vendor_meetings')
      .select('client_id')
      .eq('vendor_id', vendor.id);

    const clientsWithMeetings = new Set(
      (meetings || []).map((m: any) => m.client_id).filter(Boolean)
    );

    // Build client pipeline data
    const clientMap = new Map<string, any>();

    // Initialize with all clients
    (allClients || []).forEach((client: any) => {
      clientMap.set(client.id, {
        id: client.id,
        email: client.email,
        full_name: client.full_name,
        stage: client.status,
        workspace_status: null,
        total_value: 0,
        created_at: client.created_at,
        has_booked: clientsWithMeetings.has(client.id)
      });
    });

    // Add workspace status
    (workspaces || []).forEach((workspace: any) => {
      const clientId = workspace.client_id;
      if (clientMap.has(clientId)) {
        const client = clientMap.get(clientId);
        client.workspace_status = workspace.status;
      }
    });

    // Calculate total value per client
    (orders || []).forEach((order: any) => {
      if (clientMap.has(order.client_id)) {
        const client = clientMap.get(order.client_id);
        if (order.payment_status === 'paid') {
          client.total_value += parseFloat(order.total_amount);
        }
      }
    });

    const clients = Array.from(clientMap.values());

    // Calculate pipeline stages
    const stages = [
      {
        stage: 'prospect',
        label: 'Prospect',
        count: 0,
        value: 0,
        color: 'gray'
      },
      {
        stage: 'booked',
        label: 'Booked',
        count: 0,
        value: 0,
        color: 'blue'
      },
      {
        stage: 'paid',
        label: 'Paid',
        count: 0,
        value: 0,
        color: 'green'
      },
      {
        stage: 'onboarding',
        label: 'Onboarding',
        count: 0,
        value: 0,
        color: 'yellow'
      },
      {
        stage: 'active',
        label: 'Active',
        count: 0,
        value: 0,
        color: 'purple'
      },
      {
        stage: 'completed',
        label: 'Completed',
        count: 0,
        value: 0,
        color: 'indigo'
      }
    ];

    clients.forEach((client) => {
      // Determine pipeline stage
      if (!client.workspace_status) {
        if (client.has_booked) {
          // Booked but not paid
          stages[1].count++;
          stages[1].value += client.total_value;
        } else {
          // Prospect - lead with no booking
          stages[0].count++;
          stages[0].value += client.total_value;
        }
      } else {
        // Has a workspace
        switch (client.workspace_status) {
          case 'onboarding':
            if (client.total_value > 0) {
              stages[2].count++; // Paid
              stages[2].value += client.total_value;
            } else {
              stages[3].count++; // Onboarding
              stages[3].value += client.total_value;
            }
            break;
          case 'active':
            stages[4].count++;
            stages[4].value += client.total_value;
            break;
          case 'completed':
            stages[5].count++;
            stages[5].value += client.total_value;
            break;
          default:
            stages[0].count++;
            stages[0].value += client.total_value;
        }
      }
    });

    return NextResponse.json({
      success: true,
      stages,
      clients
    });
  } catch (error) {
    console.error('Error in vendor pipeline API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
