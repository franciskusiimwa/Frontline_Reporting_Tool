import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { summarizeSingleSubmission } from '@/lib/summarize'
import { ApiResponse } from '@/lib/types'
import { assertRateLimit } from '@/lib/rate-limit'
import { logServerError } from '@/lib/server-log'

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const rate = await assertRateLimit(_request, { key: 'api-submission-summarize', limit: 40, windowMs: 60_000 })
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

    const submissionRes = await supabase
      .from('submissions')
      .select('*, profile:profiles(full_name, region)')
      .eq('id', id)
      .single()

    if (submissionRes.error || !submissionRes.data) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Submission not found' }, { status: 404 })
    }

    const summary = summarizeSingleSubmission(submissionRes.data)
    return NextResponse.json<ApiResponse<{ summary: string }>>({ data: { summary }, error: null }, { status: 200 })
  } catch (err) {
    logServerError('POST /api/submissions/[id]/summarize error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Summary unavailable — try again' }, { status: 500 })
  }
}
