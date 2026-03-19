import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formDataSchema, type FormDataInput } from '@/lib/schemas'
import { ApiResponse } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload?.submission_id) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Missing submission_id' }, { status: 400 })
    }

    const sub = await supabase
      .from('submissions')
      .select('*, submitted_by_profile:profiles(full_name, region)')
      .eq('id', payload.submission_id)
      .single()

    if (sub.error) {
      console.error('Submit lookup error', sub.error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Submission not found' }, { status: 404 })
    }

    if (sub.data.submitted_by !== userData.user.id) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const formData = sub.data.data as FormDataInput
    const validate = formDataSchema.safeParse(formData)
    if (!validate.success) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Submission data is invalid: ' + JSON.stringify(validate.error.format()) }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('submissions')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', payload.submission_id)

    if (updateError) {
      console.error('Submit update error', updateError)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to submit' }, { status: 500 })
    }

    await supabase.from('audit_log').insert({ submission_id: payload.submission_id, actor_id: userData.user.id, action: 'submitted', note: 'Final submission' })

    return NextResponse.json<ApiResponse<{ submission_id: string }>>({ data: { submission_id: payload.submission_id }, error: null }, { status: 200 })
  } catch (err) {
    console.error('POST /api/submit error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to submit' }, { status: 500 })
  }
}
