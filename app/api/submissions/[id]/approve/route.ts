import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'
import { assertRateLimit } from '@/lib/rate-limit'
import { logServerError } from '@/lib/server-log'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const rate = await assertRateLimit(request, { key: 'api-submission-approve', limit: 60, windowMs: 60_000 })
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

    const current = await supabase.from('submissions').select('status').eq('id', id).single()
    if (current.error || !current.data) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Submission not found' }, { status: 404 })
    }

    if (current.data.status !== 'submitted') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Only submitted reports can be approved' },
        { status: 409 }
      )
    }

    const update = await supabase.from('submissions').update({ status: 'approved' }).eq('id', id).eq('status', 'submitted')
    if (update.error) {
      logServerError('Approve update error', update.error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to approve submission' }, { status: 500 })
    }

    await supabase.from('audit_log').insert({ submission_id: id, actor_id: userData.user.id, action: 'approved', note: null })

    return NextResponse.json<ApiResponse<{ submissionId: string }>>({ data: { submissionId: id }, error: null }, { status: 200 })
  } catch (err) {
    logServerError('PATCH /api/submissions/[id]/approve error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to approve submission' }, { status: 500 })
  }
}
