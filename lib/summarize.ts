import type { Submission } from './types'

type GroupBy = 'all' | 'region' | 'week' | 'status'

function pct(value: number) {
  return `${Math.round(value)}%`
}

function nonEmpty(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

function average(values: number[]) {
  if (!values.length) return 0
  return values.reduce((sum, n) => sum + n, 0) / values.length
}

export function summarizeSingleSubmission(submission: Submission): string {
  const data = submission.data ?? {}
  const risks = Array.isArray(data.risks) ? data.risks : []
  const highRisks = risks.filter((r) => r.severity === 'H')

  const topWins = [
    data.top_win,
    nonEmpty(data.what_worked) ? data.what_worked : null,
    nonEmpty(data.mentor_insights) ? data.mentor_insights : null,
  ].filter((item) => nonEmpty(item)).slice(0, 3) as string[]

  const topRiskLines = (risks.length ? risks : [{ severity: 'N/A', description: 'No risks listed', mitigation: 'N/A' }])
    .slice(0, 3)
    .map((r: any) => `- [${r.severity}] ${r.description} | Mitigation: ${r.mitigation || 'Not provided'}`)
    .join('\n')

  const decisionBlock = nonEmpty(data.decision_required)
    ? data.decision_required
    : 'No explicit decision was requested in this report.'

  const nextWeek = [
    ...(Array.isArray(data.next_week_priorities) ? data.next_week_priorities : []),
  ].filter((item) => nonEmpty(item)).slice(0, 3).join('; ')

  return [
    `Executive Summary: ${submission.region} (${submission.week_label}) reported status '${String(data.overall_status || 'unknown').replace('_', ' ')}'. ` +
      `Scholar retention was ${pct(Number(data.scholar_retention?.retention_rate || 0))} and mentor retention was ${pct(Number(data.mentor_retention?.retention_rate || 0))}. ` +
      `${highRisks.length} high-severity risk(s) were flagged.`,
    '',
    'Top 3 Wins:',
    ...(topWins.length ? topWins.map((w) => `- ${w}`) : ['- No explicit wins captured.']),
    '',
    'Top 3 Risks:',
    topRiskLines,
    '',
    'Decision Required from Leadership:',
    decisionBlock,
    '',
    'Recommended Focus for Next Week:',
    nonEmpty(nextWeek)
      ? `Prioritize: ${nextWeek}. Keep focus on closing current-week risks and maintaining retention momentum.`
      : 'No explicit priorities were provided; follow up with the field team to define top three actions.',
  ].join('\n')
}

export function summarizeSubmissionGroup(submissions: Submission[], groupBy: GroupBy): string {
  if (!submissions.length) {
    return 'No submissions were found for this summary request.'
  }

  const scholarRates = submissions.map((s) => Number(s.data?.scholar_retention?.retention_rate || 0))
  const mentorRates = submissions.map((s) => Number(s.data?.mentor_retention?.retention_rate || 0))
  const statusCounts = submissions.reduce<Record<string, number>>((acc, s) => {
    const key = String(s.data?.overall_status || 'unknown')
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const grouped = submissions.reduce<Record<string, Submission[]>>((acc, s) => {
    let key = 'All'
    if (groupBy === 'region') key = s.region || 'Unknown Region'
    if (groupBy === 'week') key = s.week_label || 'Unknown Week'
    if (groupBy === 'status') key = String(s.data?.overall_status || 'unknown')
    acc[key] = acc[key] || []
    acc[key].push(s)
    return acc
  }, {})

  const groupLines = Object.entries(grouped)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6)
    .map(([key, items]) => {
      const avgScholar = average(items.map((s) => Number(s.data?.scholar_retention?.retention_rate || 0)))
      const avgMentor = average(items.map((s) => Number(s.data?.mentor_retention?.retention_rate || 0)))
      return `- ${key}: ${items.length} submission(s), avg scholar ${pct(avgScholar)}, avg mentor ${pct(avgMentor)}`
    })

  const riskCount = submissions.reduce((sum, s) => sum + (Array.isArray(s.data?.risks) ? s.data!.risks!.length : 0), 0)

  return [
    `Executive Summary: ${submissions.length} submission(s) were analyzed with grouping by ${groupBy}. ` +
      `Average scholar retention is ${pct(average(scholarRates))} and mentor retention is ${pct(average(mentorRates))}. ` +
      `Total logged risks: ${riskCount}.`,
    '',
    'Status Mix:',
    ...Object.entries(statusCounts).map(([status, count]) => `- ${status.replace('_', ' ')}: ${count}`),
    '',
    'Group Highlights:',
    ...(groupLines.length ? groupLines : ['- No grouped highlights available.']),
    '',
    'Recommended Leadership Focus:',
    '- Prioritize groups with lower retention and higher risk volume for immediate follow-up.',
    '- Use submission review to request sharper mitigation plans where high-risk items are repeated.',
    '- Track weekly movement in on_track vs at_risk to validate whether support actions are working.',
  ].join('\n')
}
