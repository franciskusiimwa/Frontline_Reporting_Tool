import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (!user && !path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    const hasValidRole = role === 'admin' || role === 'field_staff'
    const isAdminRoute = path.startsWith('/admin') || path.startsWith('/submissions') || path.startsWith('/users')
    const isFieldRoute = path.startsWith('/submit') || path.startsWith('/history')

    if (!hasValidRole) {
      // Avoid redirect loops when a user exists but profile/role is missing.
      if (path !== '/login') {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('error', 'profile_missing')
        return NextResponse.redirect(loginUrl)
      }
      return supabaseResponse
    }

    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL('/submit', request.url))
    }

    if (isFieldRoute && role !== 'field_staff') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    if (path === '/login') {
      return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/submit', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}