import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportSubmissionToDocx } from '@/lib/export-docx'
import { ApiResponse } from '@/lib/types'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const supabase = createClient()
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

    const doc = await exportSubmissionToDocx(submissionRes.data)

    return new NextResponse(doc as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="EXP-Report-${submissionRes.data.region}-${submissionRes.data.week_label}.docx"`,
      },
    })
  } catch (err) {
    console.error('GET /api/submissions/[id]/export error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to generate export' }, { status: 500 })
  }
}
