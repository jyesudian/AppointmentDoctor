import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT remove this auth.getUser() call.
  // It refreshes the token if it has expired.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // 1. Admin Dashboard Route Protection
  if (url.pathname.startsWith('/admin/dashboard')) {
    if (!user) {
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
    
    // Check if the user is registered in the public.admins table
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()
      
    if (!admin) {
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  // 2. Volunteer Dashboard Route Protection
  if (url.pathname.startsWith('/volunteer/dashboard')) {
    if (!user) {
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
    
    // Check if the user is registered in the public.profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()
      
    if (!profile) {
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
