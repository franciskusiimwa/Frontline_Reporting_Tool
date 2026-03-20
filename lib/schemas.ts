import { z } from 'zod'

const trafficLight = z.enum(['on_track', 'at_risk', 'off_track'])
const severity = z.enum(['H', 'M', 'L'])
const requiredText = (message = 'Required') => z.string().trim().min(1, message)

const scholarRetentionSchema = z.object({
  last_week: z.number().min(0),
  this_week: z.number().min(0),
  retention_rate: z.number().min(0).max(100),
  insight: requiredText('Insight is required'),
})

const mentorRetentionSchema = z.object({
  last_week: z.number().min(0),
  this_week: z.number().min(0),
  retention_rate: z.number().min(0).max(100),
  insight: requiredText('Insight is required'),
})

const passbookSchema = z.object({
  mentors_started: z.number().min(0),
  pct_scholars_reached: z.number().min(0).max(100),
  avg_scholars_per_mentor: z.number().min(0),
  insight: requiredText('Insight is required'),
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
  insight: requiredText('Insight is required'),
})

const deepDiveSchema = z.object({
  main_reasons: z.string(),
  affected_schools: z.string(),
  solutions_tried: z.string(),
  support_needed: z.string(),
})

const priorityRowSchema = z.object({
  label: z.string(),
  planned: requiredText('Required'),
  actual: requiredText('Required'),
  status: trafficLight,
  insight: requiredText('Required'),
})

const riskRowSchema = z.object({
  description: requiredText('Required'),
  severity,
  root_cause: requiredText('Required'),
  mitigation: requiredText('Required'),
  support_needed: z.string(),
})

export const formDataSchema = z.object({
  region: requiredText(),
  po_names: requiredText(),
  week_label: requiredText(),
  submission_date: requiredText(),

  overall_status: trafficLight,
  top_win: requiredText('Required'),
  top_challenge: requiredText('Required'),
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

  mentor_insights: requiredText('Required'),
  scholar_insights: requiredText('Required'),
  foa_insights: requiredText('Required'),

  risks: z.array(riskRowSchema).min(1, 'Add at least one risk'),

  decision_required: z.string(),
  clarification_needed: z.string(),
  additional_support: z.string(),

  next_week_priorities: z.tuple([
    requiredText(), requiredText(), requiredText()
  ]),
  next_week_rationale: requiredText('Required'),

  what_worked: requiredText('Required'),
  what_didnt: requiredText('Required'),
})

export const draftSchema = formDataSchema.partial()

export type FormDataInput = z.infer<typeof formDataSchema>
export type DraftInput = z.infer<typeof draftSchema>
