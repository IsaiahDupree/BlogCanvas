import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data.user) {
      // Check if user has a profile, if not create one
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        // Create a new profile for the user
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '',
          role: 'client', // Default role for OAuth users
        })
      }

      // Check user role and redirect accordingly
      const userRole = profile?.role || 'client'
      
      if (userRole === 'admin' || userRole === 'staff' || userRole === 'owner') {
        return NextResponse.redirect(`${origin}/app`)
      } else {
        return NextResponse.redirect(`${origin}/portal/dashboard`)
      }
    }
  }

  // If no code, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
