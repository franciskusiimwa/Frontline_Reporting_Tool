import type { Submission } from './types'

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export function submissionsToCsv(submissions: Submission[]): string {
  const headers = [
    'id', 'submitted_by', 'region', 'week_label', 'status', 'submitted_at', 'created_at', 'updated_at',
    'po_names', 'submission_date', 'overall_status', 'top_win', 'top_challenge', 'confidence_next_week',
    'mentor_insights', 'scholar_insights', 'foa_insights', 'decision_required', 'clarification_needed', 'additional_support',
    'next_week_priorities', 'next_week_rationale', 'what_worked', 'what_didnt', 'data_json'
  ]

  const rows = submissions.map((submission) => {
    const d = submission.data ?? {}
    return [
      submission.id,
      submission.submitted_by ?? '',
      submission.region,
      submission.week_label,
      submission.status,
      submission.submitted_at ?? '',
      submission.created_at,
      submission.updated_at,
      d.po_names ?? '',
      d.submission_date ?? '',
      d.overall_status ?? '',
      d.top_win ?? '',
      d.top_challenge ?? '',
      d.confidence_next_week ?? '',
      d.mentor_insights ?? '',
      d.scholar_insights ?? '',
      d.foa_insights ?? '',
      d.decision_required ?? '',
      d.clarification_needed ?? '',
      d.additional_support ?? '',
      Array.isArray(d.next_week_priorities) ? d.next_week_priorities.join(';') : '',
      d.next_week_rationale ?? '',
      d.what_worked ?? '',
      d.what_didnt ?? '',
      JSON.stringify(d),
    ]
      .map(escapeCell)
      .join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}
