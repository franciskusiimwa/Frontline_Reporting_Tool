import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submissionsToCsv } from '@/lib/export-csv'
import { ApiResponse } from '@/lib/types'

export async function GET(request: Request) {
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

    const url = new URL(request.url)
    const region = url.searchParams.get('region')
    const week_label = url.searchParams.get('week_label')

    let query = supabase.from('submissions').select('*')
    if (region) query = query.eq('region', region)
    if (week_label) query = query.eq('week_label', week_label)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
      console.error('GET /api/export/csv supabase error', error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to export CSV' }, { status: 500 })
    }

    const csv = submissionsToCsv((data ?? []) as any)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="EXP-Submissions-Export.csv"',
      },
    })
  } catch (err) {
    console.error('GET /api/export/csv error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to export CSV' }, { status: 500 })
  }
}
