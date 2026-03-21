import { formDataSchema, draftSchema } from '@/lib/schemas'

describe('schemas', () => {
  it('accepts valid full submission data', () => {
    const result = formDataSchema.safeParse({
      region: 'Central',
      po_names: 'Jane Doe',
      week_label: 'Term 1 Week 1',
      submission_date: '2026-03-20',
      overall_status: 'on_track',
      top_win: 'Strong attendance',
      top_challenge: 'Transport delays',
      confidence_next_week: 4,
      scholar_retention: { baseline_scholars: 100, last_week: 100, this_week: 95, retention_rate: 95, insight: 'Slight dip' },
      mentor_retention: { last_week: 30, this_week: 29, retention_rate: 96.7, insight: 'Stable' },
      passbook_conversations: { mentors_started: 20, scholars_reached: 75, pct_scholars_reached: 75, avg_scholars_per_mentor: 3.8, insight: 'Improving' },
      class_composition: { exactly_45: 4, plus_1_15: 1, plus_16_30: 0, plus_30_more: 0, observations: 'Mostly balanced' },
      class_size_averages: { avg_scholars: 42, avg_non_scholars: 3, insight: 'Healthy mix' },
      composition_deep_dive: { main_reasons: 'Migration', affected_schools: '2 schools', solutions_tried: 'Outreach', support_needed: 'Transport support' },
      priorities: [
        { label: 'Priority 1', planned: 'Visit schools', actual: 'Visited 8 schools', status: 'on_track', insight: 'Good progress' },
        { label: 'Priority 2', planned: 'Mentor coaching', actual: 'Coached 12 mentors', status: 'on_track', insight: 'Good quality' },
        { label: 'Priority 3', planned: 'Data cleanup', actual: 'Completed cleanup', status: 'on_track', insight: 'Accurate data now' },
      ],
      mentor_insights: 'Mentors need transport support',
      scholar_insights: 'Scholars respond to peer sessions',
      foa_insights: 'FOA visits improved consistency',
      risks: [{ description: 'Weather disruption', severity: 'M', root_cause: 'Rain season', mitigation: 'Reschedule sessions', support_needed: 'Rain gear' }],
      decision_required: 'Approve weekend sessions',
      clarification_needed: 'None',
      additional_support: 'Additional facilitation materials',
      next_week_priorities: ['Retention calls', 'Mentor retraining', 'Attendance verification'],
      next_week_rationale: 'Addresses current bottlenecks',
      what_worked: 'Daily check-ins',
      what_didnt: 'Late transport dispatch',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid required fields', () => {
    const result = formDataSchema.safeParse({
      region: '',
      po_names: '',
      week_label: '',
      submission_date: '',
    })

    expect(result.success).toBe(false)
  })

  it('rejects whitespace-only required text inputs', () => {
    const result = formDataSchema.safeParse({
      region: '  ',
      po_names: '   ',
      week_label: '   ',
      submission_date: '   ',
      overall_status: 'on_track',
      top_win: '  ',
      top_challenge: '  ',
      confidence_next_week: 3,
      scholar_retention: { baseline_scholars: 1, last_week: 1, this_week: 1, retention_rate: 100, insight: '  ' },
      mentor_retention: { last_week: 1, this_week: 1, retention_rate: 100, insight: '  ' },
      passbook_conversations: { mentors_started: 1, scholars_reached: 1, pct_scholars_reached: 60, avg_scholars_per_mentor: 2, insight: '  ' },
      class_composition: { exactly_45: 1, plus_1_15: 0, plus_16_30: 0, plus_30_more: 0, observations: '' },
      class_size_averages: { avg_scholars: 1, avg_non_scholars: 1, insight: '  ' },
      composition_deep_dive: { main_reasons: '', affected_schools: '', solutions_tried: '', support_needed: '' },
      priorities: [
        { label: 'Priority 1', planned: '  ', actual: '  ', status: 'on_track', insight: '  ' },
        { label: 'Priority 2', planned: '  ', actual: '  ', status: 'on_track', insight: '  ' },
        { label: 'Priority 3', planned: '  ', actual: '  ', status: 'on_track', insight: '  ' },
      ],
      mentor_insights: '  ',
      scholar_insights: '  ',
      foa_insights: '  ',
      risks: [{ description: '  ', severity: 'M', root_cause: '  ', mitigation: '  ', support_needed: '' }],
      decision_required: '',
      clarification_needed: '',
      additional_support: '',
      next_week_priorities: ['  ', '  ', '  '],
      next_week_rationale: '  ',
      what_worked: '  ',
      what_didnt: '  ',
    })

    expect(result.success).toBe(false)
  })

  it('accepts partial draft payloads', () => {
    const result = draftSchema.safeParse({
      region: 'North',
      week_label: 'Term 1 Week 1',
      top_win: 'Community engagement increased',
    })

    expect(result.success).toBe(true)
  })
})
