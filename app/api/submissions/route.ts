import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse, Submission, UserRole } from '@/lib/types'
import { assertRateLimit } from '@/lib/rate-limit'
import { logServerError } from '@/lib/server-log'
import { decodeSubmissionCursor } from '@/lib/submissions-cursor'
import { listSubmissions } from '@/lib/services/submissions'

type SubmissionsListPayload = {
  submissions: Submission[]
  total: number
  nextCursor: string | null
}

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

    const roleRes = await supabase.from('profiles').select('role, region').eq('id', userData.user.id).single()
    if (roleRes.error || !roleRes.data?.role) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const role = roleRes.data.role as UserRole
    const isAdmin = role === 'admin'
    const isFieldStaff = role === 'field_staff'
    if (!isAdmin && !isFieldStaff) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const region = url.searchParams.get('region')
    const status = url.searchParams.get('status')
    const week_label = url.searchParams.get('week_label')
    const limitParam = Number(url.searchParams.get('limit') ?? '20')
    const cursor = url.searchParams.get('cursor')

    if (!Number.isFinite(limitParam) || limitParam < 1) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Invalid limit parameter' }, { status: 400 })
    }

    const limit = Math.min(Math.floor(limitParam), 100)
    if (cursor && !decodeSubmissionCursor(cursor)) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Invalid cursor parameter' }, { status: 400 })
    }

    const data = await listSubmissions(supabase, {
      actorId: userData.user.id,
      role,
      region: isAdmin ? region : roleRes.data.region,
      status,
      weekLabel: week_label,
      limit,
      cursor,
    })

    return NextResponse.json<ApiResponse<SubmissionsListPayload>>({ data, error: null }, { status: 200 })
  } catch (err) {
    logServerError('GET /api/submissions error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

