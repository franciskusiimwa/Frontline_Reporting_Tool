import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamSummary } from '@/lib/summarize'
import { ApiResponse } from '@/lib/types'

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const stream = await streamSummary(submissionRes.data)

    return new NextResponse(stream as unknown as ReadableStream<Uint8Array>, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('POST /api/submissions/[id]/summarize error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Summary unavailable — try again' }, { status: 500 })
  }
}
