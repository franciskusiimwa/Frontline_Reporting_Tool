import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/lib/types'
import { logServerError } from '@/lib/server-log'

export async function GET() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('week_config').select('id').limit(1)

    if (error) {
      logServerError('GET /api/health database check failed', error)
      return NextResponse.json<ApiResponse<{ status: string }>>(
        { data: null, error: 'Database health check failed' },
        { status: 503 }
      )
    }

    return NextResponse.json<ApiResponse<{ status: string }>>(
      { data: { status: 'ok' }, error: null },
      { status: 200 }
    )
  } catch (err) {
    logServerError('GET /api/health error', err)
    return NextResponse.json<ApiResponse<{ status: string }>>(
      { data: null, error: 'Health check failed' },
      { status: 503 }
    )
  }
}
