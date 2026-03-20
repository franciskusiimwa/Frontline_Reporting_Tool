'use client'

import { useEffect, useState } from 'react'
import { StatusPill } from '@/components/ui/StatusPill'

type SubmissionStatus = 'draft' | 'submitted' | 'revision_requested' | 'approved'

type SubmissionRow = {
  id: string
  region: string
  week_label: string
  status: SubmissionStatus
  submitted_at: string | null
  updated_at: string
}

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }

type SubmissionsListResponse = {
  submissions: SubmissionRow[]
  total: number
  nextCursor: string | null
}

export default function FieldHistoryPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchHistory = async (cursor?: string | null) => {
    const isLoadMore = Boolean(cursor)

    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    setError(null)

    try {
      const params = new URLSearchParams({ limit: '25' })
      if (cursor) params.set('cursor', cursor)

      const resp = await fetch(`/api/submissions?${params.toString()}`)
      const payload = (await resp.json()) as ApiResponse<SubmissionsListResponse>
      if (payload.error) {
        setError(payload.error)
        if (!isLoadMore) {
          setSubmissions([])
        }
      } else {
        const rows = payload.data?.submissions ?? []
        setSubmissions((prev) => (isLoadMore ? [...prev, ...rows] : rows))
        setNextCursor(payload.data?.nextCursor ?? null)
      }
    } catch {
      setError('Failed to load submission history.')
    } finally {
      if (isLoadMore) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void fetchHistory()
  }, [])

  return (
    <section className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Submission History</h1>
        <p className="text-sm text-gray-600">
          Review the reports you have already saved or submitted. Submitted reports are read-only for now; drafts and revision requests can be used as a reference when preparing the next report.
        </p>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <p className="text-sm text-gray-600">Loading your reports...</p>
      ) : submissions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          No reports found yet. Once you save or submit a weekly report, it will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <article key={submission.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium text-gray-900">{submission.week_label}</h2>
                  <p className="text-sm text-gray-600">Region: {submission.region}</p>
                  <p className="text-sm text-gray-500">
                    Last updated {new Date(submission.updated_at).toLocaleString()}
                    {submission.submitted_at ? ` • Submitted ${new Date(submission.submitted_at).toLocaleString()}` : ''}
                  </p>
                </div>
                <StatusPill status={submission.status} />
              </div>
            </article>
          ))}

          {nextCursor && (
            <div className="flex justify-center">
              <button
                onClick={() => void fetchHistory(nextCursor)}
                disabled={loadingMore}
                className="rounded border px-4 py-2 text-sm disabled:opacity-50"
              >
                {loadingMore ? 'Loading more...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
