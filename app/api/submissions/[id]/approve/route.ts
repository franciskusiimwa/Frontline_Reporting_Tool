import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

export async function PATCH(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const update = await supabase.from('submissions').update({ status: 'approved' }).eq('id', id)
    if (update.error) {
      console.error('Approve update error', update.error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to approve submission' }, { status: 500 })
    }

    await supabase.from('audit_log').insert({ submission_id: id, actor_id: userData.user.id, action: 'approved', note: null })

    return NextResponse.json<ApiResponse<{ submissionId: string }>>({ data: { submissionId: id }, error: null }, { status: 200 })
  } catch (err) {
    console.error('PATCH /api/submissions/[id]/approve error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to approve submission' }, { status: 500 })
  }
}
