/**
 * SLA Settings Endpoint
 * GET /api/sla/settings - Get current vendor's SLA settings
 * PUT /api/sla/settings - Update vendor's SLA settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user and vendor
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get vendor_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('vendor_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.vendor_id) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Get SLA settings
    const { data: settings, error: settingsError } = await supabase
      .from('vendor_sla_settings')
      .select('*')
      .eq('vendor_id', profile.vendor_id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching SLA settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch SLA settings' },
        { status: 500 }
      );
    }

    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        success: true,
        settings: {
          vendor_id: profile.vendor_id,
          editor_sla_hours: 24,
          editor_alert_threshold_hours: 20,
          client_sla_hours: 72,
          client_alert_threshold_hours: 60,
          enable_alerts: true,
          alert_recipients: [],
          escalation_enabled: false,
          escalation_hours: 48,
          escalation_recipients: []
        },
        isDefault: true
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: settings.id,
        vendor_id: settings.vendor_id,
        editor_sla_hours: settings.editor_sla_hours,
        editor_alert_threshold_hours: settings.editor_alert_threshold_hours,
        client_sla_hours: settings.client_sla_hours,
        client_alert_threshold_hours: settings.client_alert_threshold_hours,
        enable_alerts: settings.enable_alerts,
        alert_recipients: settings.alert_recipients || [],
        escalation_enabled: settings.escalation_enabled,
        escalation_hours: settings.escalation_hours,
        escalation_recipients: settings.escalation_recipients || [],
        created_at: settings.created_at,
        updated_at: settings.updated_at
      },
      isDefault: false
    });

  } catch (error: any) {
    console.error('SLA settings GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user and vendor
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get vendor_id from profile and verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('vendor_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.vendor_id) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Only admins can update SLA settings
    if (profile.role !== 'admin' && profile.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can update SLA settings' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const {
      editor_sla_hours,
      editor_alert_threshold_hours,
      client_sla_hours,
      client_alert_threshold_hours,
      enable_alerts,
      alert_recipients,
      escalation_enabled,
      escalation_hours,
      escalation_recipients
    } = body;

    // Validation rules
    if (editor_sla_hours !== undefined && (editor_sla_hours < 1 || editor_sla_hours > 168)) {
      return NextResponse.json(
        { error: 'Editor SLA hours must be between 1 and 168 (1 week)' },
        { status: 400 }
      );
    }

    if (client_sla_hours !== undefined && (client_sla_hours < 1 || client_sla_hours > 720)) {
      return NextResponse.json(
        { error: 'Client SLA hours must be between 1 and 720 (30 days)' },
        { status: 400 }
      );
    }

    if (editor_alert_threshold_hours !== undefined && editor_sla_hours !== undefined) {
      if (editor_alert_threshold_hours >= editor_sla_hours) {
        return NextResponse.json(
          { error: 'Editor alert threshold must be less than SLA hours' },
          { status: 400 }
        );
      }
    }

    if (client_alert_threshold_hours !== undefined && client_sla_hours !== undefined) {
      if (client_alert_threshold_hours >= client_sla_hours) {
        return NextResponse.json(
          { error: 'Client alert threshold must be less than SLA hours' },
          { status: 400 }
        );
      }
    }

    if (alert_recipients !== undefined && !Array.isArray(alert_recipients)) {
      return NextResponse.json(
        { error: 'Alert recipients must be an array of email addresses' },
        { status: 400 }
      );
    }

    if (escalation_recipients !== undefined && !Array.isArray(escalation_recipients)) {
      return NextResponse.json(
        { error: 'Escalation recipients must be an array of email addresses' },
        { status: 400 }
      );
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (editor_sla_hours !== undefined) updateData.editor_sla_hours = editor_sla_hours;
    if (editor_alert_threshold_hours !== undefined) updateData.editor_alert_threshold_hours = editor_alert_threshold_hours;
    if (client_sla_hours !== undefined) updateData.client_sla_hours = client_sla_hours;
    if (client_alert_threshold_hours !== undefined) updateData.client_alert_threshold_hours = client_alert_threshold_hours;
    if (enable_alerts !== undefined) updateData.enable_alerts = enable_alerts;
    if (alert_recipients !== undefined) updateData.alert_recipients = alert_recipients;
    if (escalation_enabled !== undefined) updateData.escalation_enabled = escalation_enabled;
    if (escalation_hours !== undefined) updateData.escalation_hours = escalation_hours;
    if (escalation_recipients !== undefined) updateData.escalation_recipients = escalation_recipients;

    // Upsert settings
    const { data: settings, error: upsertError } = await supabase
      .from('vendor_sla_settings')
      .upsert({
        vendor_id: profile.vendor_id,
        ...updateData
      }, {
        onConflict: 'vendor_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error updating SLA settings:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update SLA settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: settings.id,
        vendor_id: settings.vendor_id,
        editor_sla_hours: settings.editor_sla_hours,
        editor_alert_threshold_hours: settings.editor_alert_threshold_hours,
        client_sla_hours: settings.client_sla_hours,
        client_alert_threshold_hours: settings.client_alert_threshold_hours,
        enable_alerts: settings.enable_alerts,
        alert_recipients: settings.alert_recipients || [],
        escalation_enabled: settings.escalation_enabled,
        escalation_hours: settings.escalation_hours,
        escalation_recipients: settings.escalation_recipients || [],
        created_at: settings.created_at,
        updated_at: settings.updated_at
      },
      message: 'SLA settings updated successfully'
    });

  } catch (error: any) {
    console.error('SLA settings PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
