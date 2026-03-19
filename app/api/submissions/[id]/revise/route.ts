import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const reqBody = await request.json().catch(() => null)
    if (!reqBody?.note || typeof reqBody.note !== 'string') {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Note is required' }, { status: 400 })
    }

    const update = await supabase.from('submissions').update({ status: 'revision_requested' }).eq('id', id)
    if (update.error) {
      console.error('Revise update error', update.error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to request revision' }, { status: 500 })
    }

    await supabase.from('audit_log').insert({ submission_id: id, actor_id: userData.user.id, action: 'revision_requested', note: reqBody.note })

    return NextResponse.json<ApiResponse<{ submissionId: string }>>({ data: { submissionId: id }, error: null }, { status: 200 })
  } catch (err) {
    console.error('PATCH /api/submissions/[id]/revise error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to request revision' }, { status: 500 })
  }
}
