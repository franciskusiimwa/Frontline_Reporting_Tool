import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'
import { assertRateLimit } from '@/lib/rate-limit'
import { logServerError } from '@/lib/server-log'

export async function GET(request: Request) {
  try {
    const rate = await assertRateLimit(request, { key: 'api-submissions-list', limit: 120, windowMs: 60_000 })
    if (!rate.allowed) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Too many requests. Please retry shortly.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      )
    }

    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const roleRes = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
    if (roleRes.error || !roleRes.data?.role) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const isAdmin = roleRes.data.role === 'admin'
    const isFieldStaff = roleRes.data.role === 'field_staff'
    if (!isAdmin && !isFieldStaff) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const region = url.searchParams.get('region')
    const status = url.searchParams.get('status')
    const week_label = url.searchParams.get('week_label')
    const pageParam = Number(url.searchParams.get('page') ?? '1')
    const limitParam = Number(url.searchParams.get('limit') ?? '20')

    if (!Number.isFinite(pageParam) || !Number.isFinite(limitParam) || pageParam < 1 || limitParam < 1) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Invalid page or limit parameter' }, { status: 400 })
    }

    const page = Math.floor(pageParam)
    const limit = Math.min(Math.floor(limitParam), 100)
    const offset = (page - 1) * limit

    let query = supabase.from('submissions').select('*, profile:profiles(full_name, region)', { count: 'exact' })
    if (isFieldStaff) query = query.eq('submitted_by', userData.user.id)
    if (region) query = query.eq('region', region)
    if (status) query = query.eq('status', status)
    if (week_label) query = query.eq('week_label', week_label)

    const { data, error, count } = await query.order('submitted_at', { ascending: false }).range(offset, offset + limit - 1)
    if (error) {
      logServerError('GET /api/submissions DB error', error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to fetch submissions' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<{ submissions: unknown[]; total: number }>>({ data: { submissions: data ?? [], total: count ?? 0 }, error: null }, { status: 200 })
  } catch (err) {
    logServerError('GET /api/submissions error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

