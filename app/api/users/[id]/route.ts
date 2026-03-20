import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { ApiResponse } from '@/lib/types'
import { normalizeFullName } from '@/lib/name-format'
import { assertRateLimit } from '@/lib/rate-limit'
import { logServerError } from '@/lib/server-log'

const requireAdmin = async (supabase: any) => {
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

const requireServiceClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceRoleKey,
    { auth: { persistSession: false } }
  )
}

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 12
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password)
  )
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const rate = await assertRateLimit(request, { key: 'api-users-update', limit: 60, windowMs: 60_000 })
    if (!rate.allowed) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Too many requests. Please retry shortly.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      )
    }

    const supabase = await createClient()
    const authCheck = await requireAdmin(supabase)
    if (authCheck.status !== 200) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: authCheck.message }, { status: authCheck.status })
    }

    const payload = await request.json().catch(() => null)
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Invalid payload' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (payload.full_name) updates.full_name = normalizeFullName(payload.full_name)
    if (payload.region) updates.region = payload.region
    if (payload.role) updates.role = payload.role

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'No fields to update' }, { status: 400 })
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', id)
    if (error) {
      logServerError('PATCH /api/users/[id] supabase error', error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<{ user_id: string }>>({ data: { user_id: id }, error: null }, { status: 200 })
  } catch (err) {
    logServerError('PATCH /api/users/[id] error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const rate = await assertRateLimit(request, { key: 'api-users-reset-password', limit: 20, windowMs: 60_000 })
    if (!rate.allowed) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Too many requests. Please retry shortly.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      )
    }

    const supabase = await createClient()
    const authCheck = await requireAdmin(supabase)
    if (authCheck.status !== 200) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: authCheck.message }, { status: authCheck.status })
    }

    const payload = await request.json().catch(() => null)
    if (!payload || !payload.new_password) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Missing new_password field' }, { status: 400 })
    }

    if (typeof payload.new_password !== 'string' || !isStrongPassword(payload.new_password)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: 'Password must be at least 12 characters and include uppercase, lowercase, number, and special character',
        },
        { status: 400 }
      )
    }

    const resetClient = requireServiceClient()
    const { error: authError } = await resetClient.auth.admin.updateUserById(id, {
      password: payload.new_password,
      email_confirm: true,
    })

    if (authError) {
      logServerError('POST /api/users/[id] reset-password error', authError)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: authError.message }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<{ user_id: string }>>({ data: { user_id: id }, error: null }, { status: 200 })
  } catch (err) {
    logServerError('POST /api/users/[id] reset-password error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to reset password' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const rate = await assertRateLimit(request, { key: 'api-users-delete', limit: 20, windowMs: 60_000 })
    if (!rate.allowed) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Too many requests. Please retry shortly.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      )
    }

    const supabase = await createClient()
    const authCheck = await requireAdmin(supabase)
    if (authCheck.status !== 200) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: authCheck.message }, { status: authCheck.status })
    }

    const adminClient = requireServiceClient()
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(id)
    if (deleteAuthError) {
      logServerError('DELETE /api/users/[id] delete Auth user error', deleteAuthError)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: deleteAuthError.message }, { status: 500 })
    }

    const { error: deleteProfileError } = await adminClient.from('profiles').delete().eq('id', id)
    if (deleteProfileError) {
      logServerError('DELETE /api/users/[id] delete profile error', deleteProfileError)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to remove profile' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<{ user_id: string }>>({ data: { user_id: id }, error: null }, { status: 200 })
  } catch (err) {
    logServerError('DELETE /api/users/[id] error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to delete user' }, { status: 500 })
  }
}
