import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submissionsToCsv } from '@/lib/export-csv'
import { exportSubmissionToPdf } from '@/lib/export-pdf'
import { ApiResponse } from '@/lib/types'
import { assertRateLimit } from '@/lib/rate-limit'
import { logServerError } from '@/lib/server-log'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const rate = await assertRateLimit(_request, { key: 'api-submission-export', limit: 60, windowMs: 60_000 })
    if (!rate.allowed) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Too many requests. Please retry shortly.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      )
    }

    const format = new URL(_request.url).searchParams.get('format')?.toLowerCase() ?? 'pdf'
    if (format !== 'pdf' && format !== 'csv') {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Invalid export format' }, { status: 400 })
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

    if (format === 'csv') {
      const csv = submissionsToCsv([submissionRes.data as any])
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="EXP-Report-${submissionRes.data.region}-${submissionRes.data.week_label}.csv"`,
        },
      })
    }

    const pdf = await exportSubmissionToPdf(submissionRes.data as any)
    return new NextResponse(pdf as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="EXP-Report-${submissionRes.data.region}-${submissionRes.data.week_label}.pdf"`,
      },
    })
  } catch (err) {
    logServerError('GET /api/submissions/[id]/export error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to generate export' }, { status: 500 })
  }
}
