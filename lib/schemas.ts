import { z } from 'zod'

const trafficLight = z.enum(['on_track', 'at_risk', 'off_track'])
const severity = z.enum(['H', 'M', 'L'])

const scholarRetentionSchema = z.object({
  last_week: z.number().min(0),
  this_week: z.number().min(0),
  retention_rate: z.number().min(0).max(100),
  insight: z.string().min(1, 'Insight is required'),
})

const mentorRetentionSchema = z.object({
  last_week: z.number().min(0),
  this_week: z.number().min(0),
  retention_rate: z.number().min(0).max(100),
  insight: z.string().min(1, 'Insight is required'),
})

const passbookSchema = z.object({
  mentors_started: z.number().min(0),
  pct_scholars_reached: z.number().min(0).max(100),
  avg_scholars_per_mentor: z.number().min(0),
  insight: z.string().min(1, 'Insight is required'),
})

const classCompositionSchema = z.object({
  exactly_45: z.number().min(0),
  plus_1_15: z.number().min(0),
  plus_16_30: z.number().min(0),
  plus_30_more: z.number().min(0),
  observations: z.string(),
})

const classSizeSchema = z.object({
  avg_scholars: z.number().min(0),
  avg_non_scholars: z.number().min(0),
  insight: z.string().min(1, 'Insight is required'),
})

const deepDiveSchema = z.object({
  main_reasons: z.string(),
  affected_schools: z.string(),
  solutions_tried: z.string(),
  support_needed: z.string(),
})

const priorityRowSchema = z.object({
  label: z.string(),
  planned: z.string().min(1, 'Required'),
  actual: z.string().min(1, 'Required'),
  status: trafficLight,
  insight: z.string().min(1, 'Required'),
})

const riskRowSchema = z.object({
  description: z.string().min(1, 'Required'),
  severity,
  root_cause: z.string().min(1, 'Required'),
  mitigation: z.string().min(1, 'Required'),
  support_needed: z.string(),
})

export const formDataSchema = z.object({
  region: z.string().min(1),
  po_names: z.string().min(1),
  week_label: z.string().min(1),
  submission_date: z.string().min(1),

  overall_status: trafficLight,
  top_win: z.string().min(1, 'Required'),
  top_challenge: z.string().min(1, 'Required'),
  confidence_next_week: z.union([
    z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)
  ]),

  scholar_retention: scholarRetentionSchema,
  mentor_retention: mentorRetentionSchema,
  passbook_conversations: passbookSchema,
  class_composition: classCompositionSchema,
  class_size_averages: classSizeSchema,
  composition_deep_dive: deepDiveSchema,

  priorities: z.tuple([priorityRowSchema, priorityRowSchema, priorityRowSchema]),

  mentor_insights: z.string().min(1, 'Required'),
  scholar_insights: z.string().min(1, 'Required'),
  foa_insights: z.string().min(1, 'Required'),

  risks: z.array(riskRowSchema).min(1, 'Add at least one risk'),

  decision_required: z.string(),
  clarification_needed: z.string(),
  additional_support: z.string(),

  next_week_priorities: z.tuple([
    z.string().min(1), z.string().min(1), z.string().min(1)
  ]),
  next_week_rationale: z.string().min(1, 'Required'),

  what_worked: z.string().min(1, 'Required'),
  what_didnt: z.string().min(1, 'Required'),
})

export const draftSchema = formDataSchema.partial()

export type FormDataInput = z.infer<typeof formDataSchema>
export type DraftInput = z.infer<typeof draftSchema>
