'use client'

import { useEffect, useMemo, useState } from 'react'

type SubmissionStatus = 'draft' | 'submitted' | 'revision_requested' | 'approved'

type SubmissionRow = {
  id: string
  region: string
  week_label: string
  status: SubmissionStatus
  submitted_at: string | null
  submitted_by: string | null
  profile?: { full_name: string; region: string }
}

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }

const PAGE_SIZE = 15

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`/api/submissions?page=${page}&limit=${PAGE_SIZE}`)
      const payload = (await resp.json()) as ApiResponse<{ submissions: SubmissionRow[]; total: number }>
      if (payload.error) {
        setError(payload.error)
        setSubmissions([])
      } else {
        setSubmissions(payload.data?.submissions ?? [])
        setTotal(payload.data?.total ?? 0)
      }
    } catch (err) {
      setError('Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [page])

  const reload = async () => {
    setPage(1)
    await fetchData()
  }

  const doAction = async (id: string, endpoint: string, payload?: object) => {
    setActionMsg(null)
    try {
      const res = await fetch(`/api/submissions/${id}/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined,
      })
      const json = (await res.json()) as ApiResponse<any>
      if (json.error) {
        setActionMsg(`Action failed: ${json.error}`)
      } else {
        setActionMsg(`Action ${endpoint} successful`) 
        await fetchData()
      }
    } catch (err) {
      setActionMsg(`Action error: ${(err as Error).message}`)
    }
  }

  const doSummarize = async (id: string) => {
    setActionMsg(null)
    try {
      const res = await fetch(`/api/submissions/${id}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const json = (await res.json()) as ApiResponse<{ summary: string }>
      if (json.error) {
        setActionMsg(`Summarize failed: ${json.error}`)
      } else {
        setActionMsg(`Summary: ${json.data?.summary ?? 'no summary'}`)
      }
    } catch (err) {
      setActionMsg(`Summarize error: ${(err as Error).message}`)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Submissions</h1>
        <button onClick={reload} className="rounded border px-3 py-1 text-sm">Refresh</button>
      </div>

      <p className="text-sm text-gray-600">Listing {total} submissions.</p>
      {actionMsg && <p className="my-2 text-sm text-indigo-700">{actionMsg}</p>}
      {error && <p className="my-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" >
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Week</th>
                <th className="border px-2 py-1">Region</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Submitted</th>
                <th className="border px-2 py-1">By</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr><td colSpan={6} className="border p-2 text-center">No submissions found.</td></tr>
              ) : submissions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="border p-2">{s.week_label}</td>
                  <td className="border p-2">{s.region}</td>
                  <td className="border p-2 capitalize">{s.status}</td>
                  <td className="border p-2">{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'N/A'}</td>
                  <td className="border p-2">{s.profile?.full_name ?? s.submitted_by ?? '—'}</td>
                  <td className="border p-2 space-x-1">
                    <button onClick={() => void doAction(s.id, 'approve')} className="rounded bg-emerald-500 px-2 py-1 text-white text-xs">Approve</button>
                    <button onClick={() => void doAction(s.id, 'revise', { note: 'Revision requested from admin.' })} className="rounded bg-orange-500 px-2 py-1 text-white text-xs">Revise</button>
                    <button onClick={() => void doSummarize(s.id)} className="rounded bg-blue-400 px-2 py-1 text-white text-xs">Summarize</button>
                    <a className="rounded bg-gray-600 px-2 py-1 text-white text-xs" href={`/api/submissions/${s.id}/export`} target="_blank" rel="noreferrer">Export</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-sm">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded border px-2 py-1 disabled:opacity-50">Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded border px-2 py-1 disabled:opacity-50">Next</button>
      </div>
    </section>
  )
}
