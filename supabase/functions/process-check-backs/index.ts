// Scheduled Edge Function to process pending check-backs
// Runs on cron schedule to fetch analytics for published posts
// Deploy with: supabase functions deploy process-check-backs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Fetch pending check-backs that are due
    const { data: pendingCheckBacks, error } = await supabaseAdmin
      .from('check_back_schedules')
      .select(`
        *,
        blog_post:blog_posts(
          id,
          cms_publish_info
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_date', new Date().toISOString())
      .limit(100)

    if (error) {
      throw new Error(`Failed to fetch check-backs: ${error.message}`)
    }

    let processed = 0
    let failed = 0

    // Process each check-back
    for (const checkBack of pendingCheckBacks || []) {
      try {
        const publishInfo = (checkBack.blog_post as any)?.cms_publish_info

        if (!publishInfo?.url) {
          console.log(`Skipping check-back ${checkBack.id}: No publish URL`)
          continue
        }

        // TODO: Integrate with real Google Analytics and Search Console APIs
        // For now, we'll mark as completed without fetching real metrics
        const metrics = {
          pageviews: 0,
          unique_visitors: 0,
          avg_time_on_page: 0,
          bounce_rate: 0,
          organic_traffic: 0,
          impressions: 0,
          clicks: 0,
          avg_position: 0
        }

        // Save metrics to blog_post_metrics table
        await supabaseAdmin
          .from('blog_post_metrics')
          .insert({
            blog_post_id: checkBack.blog_post_id,
            check_date: new Date().toISOString(),
            ...metrics
          })

        // Mark check-back as completed
        await supabaseAdmin
          .from('check_back_schedules')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            metrics_snapshot: metrics
          })
          .eq('id', checkBack.id)

        processed++

      } catch (error) {
        console.error(`Failed to process check-back ${checkBack.id}:`, error)

        // Mark as failed
        await supabaseAdmin
          .from('check_back_schedules')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', checkBack.id)

        failed++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        failed,
        total: pendingCheckBacks?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error processing check-backs:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
