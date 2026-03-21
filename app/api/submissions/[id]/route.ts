import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse, AuditLogEntry, Submission } from '@/lib/types'
import { logServerError } from '@/lib/server-log'
import { assertRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const rate = await assertRateLimit(request, { key: 'api-submission-detail', limit: 120, windowMs: 60_000 })
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

    // Fetch the caller's role before pulling submission data.
    const profile = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
    const userRole = profile.data?.role

    const submissionRes = await supabase
      .from('submissions')
      .select('*, profile:profiles(full_name, region)')
      .eq('id', id)
      .single()

    if (submissionRes.error || !submissionRes.data) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Submission not found' }, { status: 404 })
    }

    if (userRole !== 'admin' && submissionRes.data.submitted_by !== userData.user.id) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const auditRes = await supabase
      .from('audit_log')
      .select('*, actor:profiles(full_name, role)')
      .eq('submission_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json<ApiResponse<{ submission: Submission; audit_log: AuditLogEntry[] }>>({
      data: {
        submission: submissionRes.data as Submission,
        audit_log: (auditRes.data ?? []) as AuditLogEntry[],
      },
      error: null,
    }, { status: 200 })
  } catch (err) {
    logServerError('GET /api/submissions/[id] error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to fetch submission' }, { status: 500 })
  }
}
