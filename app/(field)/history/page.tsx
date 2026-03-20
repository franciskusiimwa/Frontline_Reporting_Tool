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

export default function FieldHistoryPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const resp = await fetch('/api/submissions?limit=50')
        const payload = (await resp.json()) as ApiResponse<{ submissions: SubmissionRow[]; total: number }>
        if (payload.error) {
          setError(payload.error)
          setSubmissions([])
        } else {
          setSubmissions(payload.data?.submissions ?? [])
        }
      } catch {
        setError('Failed to load submission history.')
      } finally {
        setLoading(false)
      }
    }

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
        </div>
      )}
    </section>
  )
}
