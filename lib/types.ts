export type UserRole = 'field_staff' | 'admin'
export type SubmissionStatus = 'draft' | 'submitted' | 'revision_requested' | 'approved'
export type TrafficLight = 'on_track' | 'at_risk' | 'off_track'
export type RiskSeverity = 'H' | 'M' | 'L'
export type AuditAction = 'created' | 'submitted' | 'approved' | 'revision_requested' | 'resubmitted'

export interface Profile {
  id: string
  full_name: string
  region: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface WeekConfig {
  id: string
  label: string
  term: string
  week_number: number
  is_current: boolean
  created_at: string
}

export interface ScholarRetention {
  last_week: number
  this_week: number
  retention_rate: number
  insight: string
}

export interface MentorRetention {
  last_week: number
  this_week: number
  retention_rate: number
  insight: string
}

export interface PassbookConversations {
  mentors_started: number
  pct_scholars_reached: number
  avg_scholars_per_mentor: number
  insight: string
}

export interface ClassComposition {
  exactly_45: number
  plus_1_15: number
  plus_16_30: number
  plus_30_more: number
  observations: string
}

export interface ClassSizeAverages {
  avg_scholars: number
  avg_non_scholars: number
  insight: string
}

export interface CompositionDeepDive {
  main_reasons: string
  affected_schools: string
  solutions_tried: string
  support_needed: string
}

export interface PriorityRow {
  label: string
  planned: string
  actual: string
  status: TrafficLight
  insight: string
}

export interface RiskRow {
  description: string
  severity: RiskSeverity
  root_cause: string
  mitigation: string
  support_needed: string
}

export interface FormData {
  region: string
  po_names: string
  week_label: string
  submission_date: string

  overall_status: TrafficLight
  top_win: string
  top_challenge: string
  confidence_next_week: 1 | 2 | 3 | 4 | 5

  scholar_retention: ScholarRetention
  mentor_retention: MentorRetention
  passbook_conversations: PassbookConversations
  class_composition: ClassComposition
  class_size_averages: ClassSizeAverages
  composition_deep_dive: CompositionDeepDive

  priorities: [PriorityRow, PriorityRow, PriorityRow]

  mentor_insights: string
  scholar_insights: string
  foa_insights: string

  risks: RiskRow[]

  decision_required: string
  clarification_needed: string
  additional_support: string

  next_week_priorities: [string, string, string]
  next_week_rationale: string

  what_worked: string
  what_didnt: string
}

export interface Submission {
  id: string
  submitted_by: string | null
  region: string
  week_label: string
  status: SubmissionStatus
  data: Partial<FormData>
  submitted_at: string | null
  created_at: string
  updated_at: string
  profile?: Pick<Profile, 'full_name' | 'region'>
}

export interface AuditLogEntry {
  id: string
  submission_id: string
  actor_id: string | null
  action: AuditAction
  note: string | null
  created_at: string
  actor?: Pick<Profile, 'full_name' | 'role'>
}

export interface RetentionDataPoint {
  week_label: string
  scholar_retention: number
  mentor_retention: number
  region?: string
}

export interface RegionalComparisonPoint {
  region: string
  scholar_retention: number
  mentor_retention: number
  passbook_pct: number
  avg_scholars: number
}

export interface StatusDistributionPoint {
  status: TrafficLight
  count: number
}

export interface RiskHeatmapPoint {
  region: string
  high: number
  medium: number
  low: number
}

export interface ClassCompositionPoint {
  region: string
  exactly_45: number
  plus_1_15: number
  plus_16_30: number
  plus_30_more: number
}

export interface PassbookPoint {
  region: string
  mentors_started: number
  pct_scholars_reached: number
}

export interface DashboardData {
  retention_trend: RetentionDataPoint[]
  regional_comparison: RegionalComparisonPoint[]
  status_distribution: StatusDistributionPoint[]
  risk_heatmap: RiskHeatmapPoint[]
  class_composition: ClassCompositionPoint[]
  passbook_progress: PassbookPoint[]
}

export interface ApiSuccess<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
