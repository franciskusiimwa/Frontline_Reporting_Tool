import { createClient } from '@/lib/supabase/server'
import type { Submission, UserRole } from '@/lib/types'
import { decodeSubmissionCursor, encodeSubmissionCursor } from '@/lib/submissions-cursor'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type ListSubmissionsParams = {
  actorId: string
  role: UserRole
  region?: string | null
  status?: string | null
  weekLabel?: string | null
  limit: number
  cursor?: string | null
}

type ListSubmissionsResult = {
  submissions: Submission[]
  total: number
  nextCursor: string | null
}

type MutationResult =
  | { ok: true; submissionId: string }
  | { ok: false; status: number; error: string }

function mapRpcError(message: string | undefined, fallback: string): { status: number; error: string } {
  switch (message) {
    case 'Unauthorized':
      return { status: 401, error: 'Unauthorized' }
    case 'Forbidden':
      return { status: 403, error: 'Forbidden' }
    case 'Submission not found':
      return { status: 404, error: 'Submission not found' }
    case 'Already submitted':
      return { status: 409, error: 'This report has already been submitted.' }
    case 'Only submitted reports can be approved':
      return { status: 409, error: 'Only submitted reports can be approved' }
    default:
      return { status: 500, error: fallback }
  }
}

export async function listSubmissions(
  supabase: SupabaseServerClient,
  params: ListSubmissionsParams,
): Promise<ListSubmissionsResult> {
  const decodedCursor = decodeSubmissionCursor(params.cursor ?? null)

  let query = supabase
    .from('submissions')
    .select('*, profile:profiles(full_name, region)', { count: 'exact' })

  if (params.role === 'field_staff') query = query.eq('submitted_by', params.actorId)
  if (params.region) query = query.eq('region', params.region)
  if (params.status) query = query.eq('status', params.status)
  if (params.weekLabel) query = query.eq('week_label', params.weekLabel)
  if (decodedCursor) query = query.lt('created_at', decodedCursor.createdAt)

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .limit(params.limit + 1)

  if (error) throw error

  const rows = (data ?? []) as Submission[]
  const hasMore = rows.length > params.limit
  const submissions = hasMore ? rows.slice(0, params.limit) : rows
  const last = submissions[submissions.length - 1]

  return {
    submissions,
    total: count ?? 0,
    nextCursor: hasMore && last ? encodeSubmissionCursor({ createdAt: last.created_at }) : null,
  }
}

export async function submitSubmission(
  supabase: SupabaseServerClient,
  submissionId: string,
  payload: unknown,
): Promise<MutationResult> {
  const { data, error } = await supabase.rpc('submit_submission', {
    p_submission_id: submissionId,
    p_payload: payload,
  })

  if (error) {
    const mapped = mapRpcError(error.message, 'Failed to submit')
    return { ok: false, ...mapped }
  }

  return { ok: true, submissionId: String(data ?? submissionId) }
}

export async function approveSubmission(
  supabase: SupabaseServerClient,
  submissionId: string,
): Promise<MutationResult> {
  const { data, error } = await supabase.rpc('approve_submission', {
    p_submission_id: submissionId,
  })

  if (error) {
    const mapped = mapRpcError(error.message, 'Failed to approve submission')
    return { ok: false, ...mapped }
  }

  return { ok: true, submissionId: String(data ?? submissionId) }
}