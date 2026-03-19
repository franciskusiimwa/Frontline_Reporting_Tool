import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { ApiResponse, Profile, UserRole } from '@/lib/types'

const requireAdmin = async (supabase: ReturnType<typeof createClient>) => {
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser()
  if (sessionError || !sessionData?.user) {
    return { status: 401, message: 'Unauthorized' }
  }

  const profileRes = await supabase.from('profiles').select('role').eq('id', sessionData.user.id).single()
  if (profileRes.error || profileRes.data?.role !== 'admin') {
    return { status: 403, message: 'Forbidden' }
  }

  return { status: 200, message: 'OK' }
}

export async function GET() {
  try {
    const supabase = createClient()
    const authCheck = await requireAdmin(supabase)
    if (authCheck.status !== 200) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: authCheck.message }, { status: authCheck.status })
    }

    const { data, error } = await supabase.from('profiles').select('*')
    if (error) {
      console.error('GET /api/users supabase error', error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to fetch users' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<Profile[]>>({ data: data ?? [], error: null }, { status: 200 })
  } catch (err) {
    console.error('GET /api/users error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const authCheck = await requireAdmin(supabase)
    if (authCheck.status !== 200) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: authCheck.message }, { status: authCheck.status })
    }

    const payload = await request.json().catch(() => null)
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Invalid payload' }, { status: 400 })
    }

    const { email, password, full_name, region, role } = payload as {
      email?: string
      password?: string
      full_name?: string
      region?: string
      role?: UserRole
    }

    if (!email || !password || !full_name || !role) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Missing required fields' }, { status: 400 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error('Service role key missing')
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Server configuration error' }, { status: 500 })
    }

    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      serviceRoleKey,
      { auth: { persistSession: false } }
    )

    const { data: userCreate, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name, region, role },
      email_confirm: true,
    })

    if (createError || !userCreate) {
      console.error('POST /api/users createUser error', createError)
      const message = createError?.message || 'Failed to create auth user'
      return NextResponse.json<ApiResponse<null>>({ data: null, error: message }, { status: 500 })
    }

    const userId = userCreate.user?.id
    if (!userId) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'User ID missing from created user' }, { status: 500 })
    }

    const { error: profileError } = await adminSupabase.from('profiles').insert({
      id: userId,
      full_name,
      region: region ?? null,
      role,
    })

    if (profileError) {
      console.error('POST /api/users insert profile error', profileError)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to store profile' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<{ user_id: string }>>({ data: { user_id: userId }, error: null }, { status: 201 })
  } catch (err) {
    console.error('POST /api/users error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to create user' }, { status: 500 })
  }
}
