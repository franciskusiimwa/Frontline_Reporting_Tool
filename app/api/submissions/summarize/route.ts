import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { summarizeSubmissionGroup } from '@/lib/summarize'
import type { ApiResponse, Submission } from '@/lib/types'
import { assertRateLimit } from '@/lib/rate-limit'
import { logServerError } from '@/lib/server-log'

type GroupBy = 'all' | 'region' | 'week' | 'status'

export async function POST(request: Request) {
  try {
    const rate = await assertRateLimit(request, { key: 'api-submissions-summarize', limit: 25, windowMs: 60_000 })
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

    const profile = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
    if (profile.error || profile.data?.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const payload = await request.json().catch(() => null)
    const groupByInput = payload?.groupBy
    const allowedGroups: GroupBy[] = ['all', 'region', 'week', 'status']
    const groupBy: GroupBy = allowedGroups.includes(groupByInput) ? groupByInput : 'all'
    const submissionIds: string[] = Array.isArray(payload?.submissionIds)
      ? payload.submissionIds.filter((id: unknown): id is string => typeof id === 'string')
      : []

    if (submissionIds.length > 100) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Too many submission IDs requested' }, { status: 400 })
    }

    let query = supabase
      .from('submissions')
      .select('*, profile:profiles(full_name, region)')
      .in('status', ['submitted', 'approved', 'revision_requested'])
      .order('created_at', { ascending: false })

    if (submissionIds.length > 0) {
      query = query.in('id', submissionIds)
    } else {
      query = query.limit(100)
    }

    const { data, error } = await query
    if (error) {
      logServerError('POST /api/submissions/summarize error', error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to load submissions for summary' }, { status: 500 })
    }

    const summary = summarizeSubmissionGroup((data ?? []) as Submission[], groupBy)
    return NextResponse.json<ApiResponse<{ summary: string }>>({ data: { summary }, error: null }, { status: 200 })
  } catch (err) {
    logServerError('POST /api/submissions/summarize exception', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Summary unavailable — try again' }, { status: 500 })
  }
}
