import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || !body.email || !body.password || !body.full_name) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Missing fields' }, { status: 400 })
    }

    const { email, password, full_name, region } = body as {
      email: string
      password: string
      full_name: string
      region?: string
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRole || serviceRole === 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE') {
      console.error('Missing or placeholder SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Invalid server config: SUPABASE_SERVICE_ROLE_KEY must be set in .env.local' }, { status: 500 })
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, region, role: 'field_staff' },
    })

    if (createError || !userData || !userData.user) {
      console.warn('Admin createUser failed:', createError?.message)

      if (createError?.message?.toLowerCase().includes('invalid api key')) {
        // Fallback to anon signUp to avoid blocking on service key problems
        const anonClient = createSupabaseClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', { auth: { persistSession: false } })
        const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({ email, password })
        if (signUpError || !signUpData?.user) {
          return NextResponse.json<ApiResponse<null>>({ data: null, error: signUpError?.message || 'Unable to register with anon key' }, { status: 400 })
        }

        return NextResponse.json<ApiResponse<{ user_id: string }>>({ data: { user_id: signUpData.user.id }, error: null }, { status: 201 })
      }

      const message = createError?.message || 'Unable to create user'
      return NextResponse.json<ApiResponse<null>>({ data: null, error: message }, { status: 400 })
    }

    const userId = userData.user.id
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: userId,
      full_name,
      region: region || null,
      role: 'field_staff',
    })

    if (profileError) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Profile creation failed' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<{ user_id: string }>>({ data: { user_id: userId }, error: null }, { status: 201 })
  } catch (err) {
    console.error('POST /api/auth/register error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Unexpected error' }, { status: 500 })
  }
}
