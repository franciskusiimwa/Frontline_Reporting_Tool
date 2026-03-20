import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formDataSchema } from '@/lib/schemas'
import { ApiResponse } from '@/lib/types'
import { assertRateLimit } from '@/lib/rate-limit'
import { logServerError } from '@/lib/server-log'

export async function POST(request: Request) {
  try {
    const rate = await assertRateLimit(request, { key: 'api-submit', limit: 40, windowMs: 60_000 })
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

    const payload = await request.json().catch(() => null)
    if (!payload?.submission_id) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Missing submission_id' }, { status: 400 })
    }

    const { submission_id, ...formPayload } = payload
    const validate = formDataSchema.safeParse(formPayload)
    if (!validate.success) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Submission data is invalid. Please complete required fields and try again.' }, { status: 400 })
    }

    const sub = await supabase
      .from('submissions')
      .select('*, submitted_by_profile:profiles(full_name, region)')
      .eq('id', submission_id)
      .single()

    if (sub.error) {
      logServerError('Submit lookup error', sub.error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Submission not found' }, { status: 404 })
    }

    if (sub.data.submitted_by !== userData.user.id) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    if (sub.data.status === 'submitted' || sub.data.status === 'approved') {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'This report has already been submitted.' }, { status: 409 })
    }

    const { error: updateError } = await supabase
      .from('submissions')
      .update({ data: validate.data, status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', submission_id)

    if (updateError) {
      logServerError('Submit update error', updateError)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to submit' }, { status: 500 })
    }

    await supabase.from('audit_log').insert({ submission_id, actor_id: userData.user.id, action: 'submitted', note: 'Final submission' })

    return NextResponse.json<ApiResponse<{ submission_id: string }>>({ data: { submission_id }, error: null }, { status: 200 })
  } catch (err) {
    logServerError('POST /api/submit error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to submit' }, { status: 500 })
  }
}

