import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'
import { assertRateLimit } from '@/lib/rate-limit'
import { logServerError } from '@/lib/server-log'
import { requestRevision } from '@/lib/services/submissions'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const rate = await assertRateLimit(request, { key: 'api-submission-revise', limit: 60, windowMs: 60_000 })
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const payload = await request.json().catch(() => ({})) as { note?: unknown }
    const note = typeof payload.note === 'string' ? payload.note.trim() : ''
    const revisionNote = note.length > 0 ? note : 'Please revise and resubmit this report.'

    const result = await requestRevision(supabase, id, revisionNote)
    if (!result.ok) {
      if (result.status >= 500) {
        logServerError('Revise RPC error', { submissionId: id, status: result.status, error: result.error })
      }
      return NextResponse.json<ApiResponse<null>>({ data: null, error: result.error }, { status: result.status })
    }

    return NextResponse.json<ApiResponse<{ submissionId: string }>>({ data: { submissionId: id }, error: null }, { status: 200 })
  } catch (err) {
    logServerError('PATCH /api/submissions/[id]/revise error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to request revision' }, { status: 500 })
  }
}
