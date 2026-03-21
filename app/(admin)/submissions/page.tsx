'use client'

import { useEffect, useState } from 'react'

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

type SubmissionsListResponse = {
  submissions: SubmissionRow[]
  total: number
  nextCursor: string | null
}

const PAGE_SIZE = 15

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [summaryOutput, setSummaryOutput] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<'all' | 'region' | 'week' | 'status'>('all')

  const fetchData = async (cursorValue: string | null = cursor) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
      if (cursorValue) params.set('cursor', cursorValue)

      const resp = await fetch(`/api/submissions?${params.toString()}`)
      const payload = (await resp.json()) as ApiResponse<SubmissionsListResponse>
      if (payload.error) {
        setError(payload.error)
        setSubmissions([])
        setNextCursor(null)
      } else {
        setSubmissions(payload.data?.submissions ?? [])
        setTotal(payload.data?.total ?? 0)
        setNextCursor(payload.data?.nextCursor ?? null)
      }
    } catch {
      setError('Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData(cursor)
  }, [cursor])

  const reload = async () => {
    setCursorHistory([])
    setCursor(null)
    if (cursor === null) {
      await fetchData(null)
    }
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
        await fetchData(cursor)
      }
    } catch (err) {
      setActionMsg(`Action error: ${(err as Error).message}`)
    }
  }

  const doSummarize = async (id: string) => {
    setActionMsg(null)
    setSummaryOutput(null)
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
        setSummaryOutput(json.data?.summary ?? 'No summary generated.')
        setActionMsg('Single response summary generated.')
      }
    } catch (err) {
      setActionMsg(`Summarize error: ${(err as Error).message}`)
    }
  }

  const doGroupSummary = async () => {
    setActionMsg(null)
    setSummaryOutput(null)
    try {
      const res = await fetch('/api/submissions/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupBy, submissionIds: submissions.map((s) => s.id) }),
      })
      const json = (await res.json()) as ApiResponse<{ summary: string }>
      if (json.error) {
        setActionMsg(`Group summarize failed: ${json.error}`)
      } else {
        setSummaryOutput(json.data?.summary ?? 'No summary generated.')
        setActionMsg('Grouped summary generated successfully.')
      }
    } catch (err) {
      setActionMsg(`Group summarize error: ${(err as Error).message}`)
    }
  }

  const doGroupPdfExport = async () => {
    setActionMsg(null)
    try {
      const res = await fetch('/api/submissions/export/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupBy, submissionIds: submissions.map((s) => s.id) }),
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as ApiResponse<null> | null
        setActionMsg(`Group PDF export failed: ${json?.error ?? 'Unknown error'}`)
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `EXP-Group-Report-${groupBy}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      setActionMsg('Group PDF export generated successfully.')
    } catch (err) {
      setActionMsg(`Group PDF export error: ${(err as Error).message}`)
    }
  }

  const pageNumber = cursorHistory.length + 1

  const goNext = () => {
    if (!nextCursor) return
    setCursorHistory((prev) => [...prev, cursor])
    setCursor(nextCursor)
  }

  const goPrev = () => {
    if (cursorHistory.length === 0) return

    const previousCursor = cursorHistory[cursorHistory.length - 1] ?? null
    setCursorHistory((prev) => prev.slice(0, -1))
    setCursor(previousCursor)
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Submissions</h1>
        <button onClick={reload} className="rounded border px-3 py-1 text-sm">Refresh</button>
      </div>

      <p className="text-sm text-gray-600">Listing {total} submissions. Page size: {PAGE_SIZE}.</p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          className="rounded border px-2 py-1 text-sm"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as 'all' | 'region' | 'week' | 'status')}
        >
          <option value="all">Group summary: all loaded submissions</option>
          <option value="region">Group summary: by region</option>
          <option value="week">Group summary: by week</option>
          <option value="status">Group summary: by status</option>
        </select>
        <button onClick={() => void doGroupSummary()} className="rounded bg-indigo-600 px-3 py-1 text-sm text-white">Generate Group Summary</button>
        <button onClick={() => void doGroupPdfExport()} className="rounded bg-slate-800 px-3 py-1 text-sm text-white">Generate Group PDF</button>
        {summaryOutput && (
          <button onClick={() => setSummaryOutput(null)} className="rounded border border-gray-400 px-3 py-1 text-sm text-gray-700">Back To Original View</button>
        )}
      </div>
      {actionMsg && <p className="my-2 text-sm text-indigo-700">{actionMsg}</p>}
      {error && <p className="my-2 text-sm text-red-600">{error}</p>}
      {summaryOutput && (
        <pre className="my-3 whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-700">{summaryOutput}</pre>
      )}

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
                    <button onClick={() => void doAction(s.id, 'approve')} disabled={s.status !== 'submitted'} className="rounded bg-emerald-500 px-2 py-1 text-white text-xs disabled:cursor-not-allowed disabled:opacity-50">Approve</button>
                    <button onClick={() => void doSummarize(s.id)} className="rounded bg-blue-400 px-2 py-1 text-white text-xs">Summarize</button>
                    <a className="rounded bg-slate-700 px-2 py-1 text-white text-xs" href={`/api/submissions/${s.id}/export?format=csv`} target="_blank" rel="noreferrer">Export CSV</a>
                    <a className="rounded bg-slate-900 px-2 py-1 text-white text-xs" href={`/api/submissions/${s.id}/export?format=pdf`} target="_blank" rel="noreferrer">Export PDF</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-sm">
        <button onClick={goPrev} disabled={cursorHistory.length === 0} className="rounded border px-2 py-1 disabled:opacity-50">Prev</button>
        <span>Page {pageNumber}</span>
        <button onClick={goNext} disabled={!nextCursor} className="rounded border px-2 py-1 disabled:opacity-50">Next</button>
      </div>
    </section>
  )
}
