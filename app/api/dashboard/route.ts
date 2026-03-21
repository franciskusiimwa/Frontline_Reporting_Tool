import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DashboardData, ApiResponse } from '@/lib/types'
import { logServerError } from '@/lib/server-log'

const getDashboardData = async (region?: string): Promise<DashboardData> => {
  const supabase = await createClient()
  let query = supabase.from('submissions').select('region, week_label, status, data').in('status', ['submitted', 'approved'])
  if (region) query = query.eq('region', region)

  const { data, error } = await query
  if (error) {
    logServerError('Dashboard query error', error)
    return {
      retention_trend: [],
      regional_comparison: [],
      status_distribution: [],
      risk_heatmap: [],
      class_composition: [],
      passbook_progress: [],
    }
  }

  const rows = (data ?? []) as any[]

  const retentionByWeek = new Map<string, { sumScholar: number; sumMentor: number; count: number }>()
  const regionalAggregation = new Map<string, { scholar_sum: number; mentor_sum: number; passbook_sum: number; passbook_count: number; avg_scholars_sum: number; count: number; class_composition: { exactly_45:number; plus_1_15:number; plus_16_30:number; plus_30_more:number }; risk: { H:number; M:number; L:number } }>()
  const statusCount = new Map<string, number>()

  for (const row of rows) {
    const d = row.data ?? {}
    const week = row.week_label
    const regionKey = row.region

    const sr = Number(d.scholar_retention?.retention_rate ?? 0)
    const mr = Number(d.mentor_retention?.retention_rate ?? 0)
    const pb = Number(d.passbook_conversations?.pct_scholars_reached ?? 0)
    const avg_scholars = Number(d.class_size_averages?.avg_scholars ?? 0)

    const existingWeek = retentionByWeek.get(week) ?? { sumScholar: 0, sumMentor: 0, count: 0 }
    existingWeek.sumScholar += sr
    existingWeek.sumMentor += mr
    existingWeek.count += 1
    retentionByWeek.set(week, existingWeek)

    const existingRegion = regionalAggregation.get(regionKey) ?? {
      scholar_sum: 0,
      mentor_sum: 0,
      passbook_sum: 0,
      passbook_count: 0,
      avg_scholars_sum: 0,
      count: 0,
      class_composition: { exactly_45: 0, plus_1_15: 0, plus_16_30: 0, plus_30_more: 0 },
      risk: { H: 0, M: 0, L: 0 },
    }

    existingRegion.scholar_sum += sr
    existingRegion.mentor_sum += mr
    existingRegion.passbook_sum += pb
    existingRegion.passbook_count += 1
    existingRegion.avg_scholars_sum += avg_scholars
    existingRegion.count += 1

    const cc = d.class_composition ?? {}
    existingRegion.class_composition.exactly_45 += Number(cc.exactly_45 ?? 0)
    existingRegion.class_composition.plus_1_15 += Number(cc.plus_1_15 ?? 0)
    existingRegion.class_composition.plus_16_30 += Number(cc.plus_16_30 ?? 0)
    existingRegion.class_composition.plus_30_more += Number(cc.plus_30_more ?? 0)

    for (const risk of (d.risks ?? [])) {
      if (risk.severity === 'H') existingRegion.risk.H += 1
      if (risk.severity === 'M') existingRegion.risk.M += 1
      if (risk.severity === 'L') existingRegion.risk.L += 1
    }

    regionalAggregation.set(regionKey, existingRegion)

    const allowedStatuses = ['on_track', 'at_risk', 'off_track'] as const
    const statusKey = allowedStatuses.includes(d.overall_status as any) ? (d.overall_status as 'on_track' | 'at_risk' | 'off_track') : 'off_track'
    statusCount.set(statusKey, (statusCount.get(statusKey) ?? 0) + 1)
  }

  const retention_trend = Array.from(retentionByWeek.entries())
    .map(([week_label, ag]) => ({ week_label, scholar_retention: ag.sumScholar / ag.count, mentor_retention: ag.sumMentor / ag.count }))
    .sort((a, b) => a.week_label.localeCompare(b.week_label))

  const regional_comparison = Array.from(regionalAggregation.entries()).map(([region, ag]) => ({ region, scholar_retention: ag.scholar_sum / ag.count, mentor_retention: ag.mentor_sum / ag.count, passbook_pct: ag.passbook_sum / ag.passbook_count, avg_scholars: ag.avg_scholars_sum / ag.count }))

  const status_distribution = Array.from(statusCount.entries()).map(([status, count]) => ({ status: status as 'on_track' | 'at_risk' | 'off_track', count }))

  const risk_heatmap = Array.from(regionalAggregation.entries()).map(([region, ag]) => ({ region, high: ag.risk.H, medium: ag.risk.M, low: ag.risk.L }))

  const class_composition = Array.from(regionalAggregation.entries()).map(([region, ag]) => ({ region, exactly_45: ag.class_composition.exactly_45, plus_1_15: ag.class_composition.plus_1_15, plus_16_30: ag.class_composition.plus_16_30, plus_30_more: ag.class_composition.plus_30_more }))

  const passbook_progress = Array.from(regionalAggregation.entries()).map(([region, ag]) => ({ region, mentors_started: 0, pct_scholars_reached: ag.passbook_sum / Math.max(ag.passbook_count, 1) }))

  const result: DashboardData = { retention_trend, regional_comparison, status_distribution, risk_heatmap, class_composition, passbook_progress }
  return result
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
    if (profile.error || profile.data?.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const region = url.searchParams.get('region') ?? undefined

    const data = await getDashboardData(region)
    return NextResponse.json<ApiResponse<typeof data>>({ data, error: null }, { status: 200 })
  } catch (err) {
    logServerError('GET /api/dashboard error', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}

