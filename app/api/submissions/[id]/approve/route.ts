import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'
import { assertRateLimit } from '@/lib/rate-limit'
import { logServerError } from '@/lib/server-log'
import { approveSubmission } from '@/lib/services/submissions'

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

    const result = await approveSubmission(supabase, id)
    if (!result.ok) {
      if (result.status >= 500) {
        logServerError('Approve RPC error', { submissionId: id, status: result.status, error: result.error })
      }

      return NextResponse.json<ApiResponse<null>>({ data: null, error: result.error }, { status: result.status })
    }

    return NextResponse.json<ApiResponse<{ submissionId: string }>>({ data: { submissionId: id }, error: null }, { status: 200 })
  } catch (err) {
    logServerError('PATCH /api/submissions/[id]/approve error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to approve submission' }, { status: 500 })
  }
}
