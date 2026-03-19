import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const roleRes = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
    if (roleRes.error || roleRes.data?.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const region = url.searchParams.get('region')
    const status = url.searchParams.get('status')
    const week_label = url.searchParams.get('week_label')
    const page = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '20')
    const offset = (Math.max(page, 1) - 1) * limit

    let query = supabase.from('submissions').select('*, profile:profiles(full_name, region)', { count: 'exact' })
    if (region) query = query.eq('region', region)
    if (status) query = query.eq('status', status)
    if (week_label) query = query.eq('week_label', week_label)

    const { data, error, count } = await query.order('submitted_at', { ascending: false }).range(offset, offset + limit - 1)
    if (error) {
      console.error('GET /api/submissions DB error', error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to fetch submissions' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<{ submissions: unknown[]; total: number }>>({ data: { submissions: data ?? [], total: count ?? 0 }, error: null }, { status: 200 })
  } catch (err) {
    console.error('GET /api/submissions error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to fetch submissions' }, { status: 500 })
  }
}
