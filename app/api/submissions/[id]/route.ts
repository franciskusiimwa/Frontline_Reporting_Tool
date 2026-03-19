import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const supabase = createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const submissionRes = await supabase
      .from('submissions')
      .select('*, profile:profiles(full_name, region)')
      .eq('id', id)
      .single()

    if (submissionRes.error || !submissionRes.data) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Submission not found' }, { status: 404 })
    }

    const profile = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
    const userRole = profile.data?.role

    if (userRole !== 'admin' && submissionRes.data.submitted_by !== userData.user.id) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const auditRes = await supabase
      .from('audit_log')
      .select('*, actor:profiles(full_name, role)')
      .eq('submission_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json<ApiResponse<{ submission: any; audit_log: any[] }>>({ data: { submission: submissionRes.data, audit_log: auditRes.data ?? [] }, error: null }, { status: 200 })
  } catch (err) {
    console.error('GET /api/submissions/[id] error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to fetch submission' }, { status: 500 })
  }
}
