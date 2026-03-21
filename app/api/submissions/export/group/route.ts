import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportSubmissionsGroupToPdf } from '@/lib/export-pdf'
import { ApiResponse } from '@/lib/types'
import { assertRateLimit } from '@/lib/rate-limit'
import { logServerError } from '@/lib/server-log'

export async function POST(request: NextRequest) {
  try {
    const rate = await assertRateLimit(request, { key: 'api-submissions-group-export', limit: 30, windowMs: 60_000 })
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

    const json = (await request.json().catch(() => null)) as { submissionIds?: string[]; groupBy?: string } | null
    const submissionIds = Array.isArray(json?.submissionIds) ? json.submissionIds.filter((id) => typeof id === 'string' && id.length > 0) : []

    if (submissionIds.length === 0) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'No submissions selected for export' }, { status: 400 })
    }

    const submissionsRes = await supabase
      .from('submissions')
      .select('*, profile:profiles(full_name, region)')
      .in('id', submissionIds)
      .order('week_label', { ascending: true })
      .order('region', { ascending: true })

    if (submissionsRes.error || !submissionsRes.data) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to load submissions for export' }, { status: 500 })
    }

    const pdf = await exportSubmissionsGroupToPdf(submissionsRes.data as any)
    const groupBy = typeof json?.groupBy === 'string' ? json.groupBy : 'all'

    return new NextResponse(pdf as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="EXP-Group-Report-${groupBy}.pdf"`,
      },
    })
  } catch (err) {
    logServerError('POST /api/submissions/export/group error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to generate group PDF export' }, { status: 500 })
  }
}
