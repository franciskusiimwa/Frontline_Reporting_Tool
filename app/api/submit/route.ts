import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formDataSchema } from '@/lib/schemas'
import { ApiResponse } from '@/lib/types'
import { assertRateLimit } from '@/lib/rate-limit'
import { logServerError } from '@/lib/server-log'
import { submitSubmission } from '@/lib/services/submissions'

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

    const result = await submitSubmission(supabase, submission_id, validate.data)
    if (!result.ok) {
      if (result.status >= 500) {
        logServerError('Submit RPC error', { submissionId: submission_id, status: result.status, error: result.error })
      }

      return NextResponse.json<ApiResponse<null>>({ data: null, error: result.error }, { status: result.status })
    }

    return NextResponse.json<ApiResponse<{ submission_id: string }>>({ data: { submission_id }, error: null }, { status: 200 })
  } catch (err) {
    logServerError('POST /api/submit error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to submit' }, { status: 500 })
  }
}

