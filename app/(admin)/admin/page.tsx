'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'

type DashboardData = {
  retention_trend: Array<{ week_label: string; scholar_retention: number; mentor_retention: number }>
  regional_comparison: Array<{ region: string; scholar_retention: number; mentor_retention: number; passbook_pct: number; avg_scholars: number }>
  status_distribution: Array<{ status: 'on_track' | 'at_risk' | 'off_track'; count: number }>
  risk_heatmap: Array<{ region: string; high: number; medium: number; low: number }>
  class_composition: Array<{ region: string; exactly_45: number; plus_1_15: number; plus_16_30: number; plus_30_more: number }>
  passbook_progress: Array<{ region: string; mentors_started: number; pct_scholars_reached: number }>
}

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }

function formatPct(value: number) {
  return `${Math.round(value)}%`
}

export default function AdminHomePage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/dashboard')
      const json = (await response.json()) as ApiResponse<DashboardData>
      if (!response.ok || json.error || !json.data) {
        setError(json.error ?? 'Failed to load dashboard')
        return
      }
      setDashboard(json.data)
    } catch {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const summary = useMemo(() => {
    if (!dashboard) return null

    const totalRegions = dashboard.regional_comparison.length
    const avgScholar = totalRegions
      ? dashboard.regional_comparison.reduce((sum, row) => sum + row.scholar_retention, 0) / totalRegions
      : 0
    const avgMentor = totalRegions
      ? dashboard.regional_comparison.reduce((sum, row) => sum + row.mentor_retention, 0) / totalRegions
      : 0
    const topRiskRegion = [...dashboard.risk_heatmap].sort((a, b) => b.high - a.high)[0]
    const totalStatuses = dashboard.status_distribution.reduce((sum, row) => sum + row.count, 0)

    return {
      totalRegions,
      avgScholar,
      avgMentor,
      topRiskRegion,
      totalStatuses,
    }
  }, [dashboard])

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-cyan-700 via-sky-700 to-amber-600 p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Leadership View</p>
        <h1 className="mt-2 text-3xl font-semibold">Admin Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm text-cyan-100">
          Monitor overall reporting health, compare regions quickly, and move straight into submission review or user management.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-sky-800 hover:bg-cyan-50"
          >
            Refresh Dashboard
          </button>
          <Link href="/api/export/csv" target="_blank" className="rounded-md bg-slate-900/25 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900/40">
            Export CSV
          </Link>
          <Link href="/submissions" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-sky-800 hover:bg-cyan-50">
            Review Submissions
          </Link>
          <Link href="/users" className="rounded-md border border-white/50 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
            Manage Users
          </Link>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-32 animate-pulse bg-slate-100">
              <div />
            </Card>
          ))}
        </div>
      ) : summary && dashboard ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <p className="text-xs uppercase tracking-wide text-cyan-700">Regions reporting</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.totalRegions}</p>
              <p className="mt-2 text-sm text-gray-600">Regions currently represented in the reporting dataset.</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-sky-700">Avg scholar retention</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{formatPct(summary.avgScholar)}</p>
              <p className="mt-2 text-sm text-gray-600">Average scholar retention across reporting regions.</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-emerald-700">Avg mentor retention</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{formatPct(summary.avgMentor)}</p>
              <p className="mt-2 text-sm text-gray-600">Average mentor retention across reporting regions.</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-amber-700">Top high-risk region</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.topRiskRegion?.region ?? 'None'}</p>
              <p className="mt-2 text-sm text-gray-600">High-severity risks logged: {summary.topRiskRegion?.high ?? 0}</p>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Regional Comparison</h2>
                <span className="text-xs text-gray-500">Live from reporting data</span>
              </div>
              <div className="space-y-3">
                {dashboard.regional_comparison.length === 0 ? (
                  <p className="text-sm text-gray-600">No regional data available yet.</p>
                ) : dashboard.regional_comparison.map((row) => (
                  <div key={row.region} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{row.region}</h3>
                      <span className="text-xs text-gray-500">Passbook reach {formatPct(row.passbook_pct)}</span>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm text-gray-600">
                      <div>Scholar retention: <span className="font-medium text-gray-900">{formatPct(row.scholar_retention)}</span></div>
                      <div>Mentor retention: <span className="font-medium text-gray-900">{formatPct(row.mentor_retention)}</span></div>
                      <div>Avg scholars: <span className="font-medium text-gray-900">{row.avg_scholars.toFixed(1)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900">Status Distribution</h2>
                <div className="mt-4 space-y-3">
                  {dashboard.status_distribution.length === 0 ? (
                    <p className="text-sm text-gray-600">No status data available yet.</p>
                  ) : dashboard.status_distribution.map((item) => (
                    <div key={item.status} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="capitalize text-gray-700">{item.status.replace('_', ' ')}</span>
                      <span className="font-semibold text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">Total classified reports: {summary.totalStatuses}</p>
              </Card>

              <Card>
                <h2 className="text-lg font-semibold text-gray-900">Risk Watchlist</h2>
                <div className="mt-4 space-y-3">
                  {dashboard.risk_heatmap.length === 0 ? (
                    <p className="text-sm text-gray-600">No risk data available yet.</p>
                  ) : [...dashboard.risk_heatmap]
                    .sort((a, b) => b.high - a.high)
                    .slice(0, 5)
                    .map((risk) => (
                      <div key={risk.region} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{risk.region}</span>
                          <span className="text-red-600">High: {risk.high}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">Medium: {risk.medium} • Low: {risk.low}</div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}
