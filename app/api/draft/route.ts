import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { draftSchema } from '@/lib/schemas'
import { ApiResponse, UserRole } from '@/lib/types'

export async function PATCH(request: Request) {
  try {
    const supabase = createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const profileRes = await supabase.from('profiles').select('role, region').eq('id', userData.user.id).single()
    if (profileRes.error || !profileRes.data) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Profile not found' }, { status: 403 })
    }

    if (profileRes.data.role !== 'field_staff') {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload || !payload.week_label || !payload.data) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Invalid payload' }, { status: 400 })
    }

    const parse = draftSchema.safeParse(payload.data)
    if (!parse.success) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Invalid draft data' }, { status: 400 })
    }

    const weekLabel = String(payload.week_label)
    const existing = await supabase
      .from('submissions')
      .select('*')
      .eq('submitted_by', userData.user.id)
      .eq('week_label', weekLabel)
      .single()

    if (existing.error && existing.status !== 406) {
      console.error('Draft lookup error', existing.error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Database error' }, { status: 500 })
    }

    if (existing.data) {
      if (existing.data.status === 'submitted' || existing.data.status === 'approved') {
        return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Cannot overwrite submitted or approved report' }, { status: 403 })
      }

      const { error } = await supabase
        .from('submissions')
        .update({ data: parse.data, status: 'draft' })
        .eq('id', existing.data.id)

      if (error) {
        console.error('Draft update error', error)
        return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to save draft' }, { status: 500 })
      }

      return NextResponse.json<ApiResponse<{ submission_id: string }>>({ data: { submission_id: existing.data.id }, error: null }, { status: 200 })
    }

    const insertData = {
      submitted_by: userData.user.id,
      region: parse.data.region || profileRes.data.region || 'Unknown',
      week_label: weekLabel,
      data: parse.data,
      status: 'draft',
    }

    const inserted = await supabase.from('submissions').insert(insertData).select('id').single()
    if (inserted.error || !inserted.data) {
      console.error('Draft insert error', inserted.error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to create draft' }, { status: 500 })
    }

    await supabase.from('audit_log').insert({ submission_id: inserted.data.id, actor_id: userData.user.id, action: 'created', note: 'Draft created' })

    return NextResponse.json<ApiResponse<{ submission_id: string }>>({ data: { submission_id: inserted.data.id }, error: null }, { status: 200 })
  } catch (err) {
    console.error('PATCH /api/draft error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to save draft' }, { status: 500 })
  }
}
