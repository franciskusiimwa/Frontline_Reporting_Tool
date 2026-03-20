import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WeekConfig, ApiResponse } from '@/lib/types'
import { logServerError } from '@/lib/server-log'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('week_config')
      .select('*')
      .order('term', { ascending: true })
      .order('week_number', { ascending: true })

    if (error) {
      logServerError('GET /api/weeks error', error)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to load weeks' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<WeekConfig[]>>({ data: data ?? [], error: null }, { status: 200 })
  } catch (err) {
    logServerError('GET /api/weeks exception', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Unexpected server error' }, { status: 500 })
  }
}

