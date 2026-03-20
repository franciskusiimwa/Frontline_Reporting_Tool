import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/types'

export async function PATCH(_request: NextRequest, _context: { params: Promise<{ id: string }> }) {
  return NextResponse.json<ApiResponse<null>>(
    { data: null, error: 'Revision requests are disabled. Submitted responses are final.' },
    { status: 403 }
  )
}
