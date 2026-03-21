'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} role="alert" className="text-xs text-red-600">{message}</p>
}

function MetricCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className}`.trim()}>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

export function Step3Metrics() {
  const {
    register,
    formState: { errors },
  } = useFormContext()
  const metricsErrors = errors as any
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-medium">Core Delivery Metrics</h2>
      <p className="text-sm text-gray-500">
        Enter the key weekly numbers and add short explanations where trends changed. If a number stayed flat or dropped, use the insight box to explain why.
      </p>
      <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
        Required in this section: complete the four insight boxes for scholar retention, mentor retention, passbook conversations, and class size averages. If you leave any of those blank, Next will not proceed.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard title="Scholar Retention">
        <label htmlFor="scholar_retention_last_week" className="block text-xs font-medium text-gray-700">Last week count</label>
        <Input id="scholar_retention_last_week" type="number" placeholder="Last week" {...register('scholar_retention.last_week', { valueAsNumber: true })} />
        <label htmlFor="scholar_retention_this_week" className="block text-xs font-medium text-gray-700">This week count</label>
        <Input id="scholar_retention_this_week" type="number" placeholder="This week" {...register('scholar_retention.this_week', { valueAsNumber: true })} />
        <label htmlFor="scholar_retention_rate" className="block text-xs font-medium text-gray-700">Retention rate (%)</label>
        <Input id="scholar_retention_rate" type="number" placeholder="Retention rate (%)" {...register('scholar_retention.retention_rate', { valueAsNumber: true })} />
        <label htmlFor="scholar_retention_insight" className="block text-xs font-medium text-gray-700">Insight</label>
        <Textarea id="scholar_retention_insight" rows={2} placeholder="Insight" aria-invalid={!!metricsErrors.scholar_retention?.insight?.message} aria-describedby={metricsErrors.scholar_retention?.insight?.message ? 'scholar_retention_insight_error' : undefined} {...register('scholar_retention.insight')} />
        <FieldError id="scholar_retention_insight_error" message={metricsErrors.scholar_retention?.insight?.message as string | undefined} />
        </MetricCard>

        <MetricCard title="Mentor Retention">
        <label htmlFor="mentor_retention_last_week" className="block text-xs font-medium text-gray-700">Last week count</label>
        <Input id="mentor_retention_last_week" type="number" placeholder="Last week" {...register('mentor_retention.last_week', { valueAsNumber: true })} />
        <label htmlFor="mentor_retention_this_week" className="block text-xs font-medium text-gray-700">This week count</label>
        <Input id="mentor_retention_this_week" type="number" placeholder="This week" {...register('mentor_retention.this_week', { valueAsNumber: true })} />
        <label htmlFor="mentor_retention_rate" className="block text-xs font-medium text-gray-700">Retention rate (%)</label>
        <Input id="mentor_retention_rate" type="number" placeholder="Retention rate (%)" {...register('mentor_retention.retention_rate', { valueAsNumber: true })} />
        <label htmlFor="mentor_retention_insight" className="block text-xs font-medium text-gray-700">Insight</label>
        <Textarea id="mentor_retention_insight" rows={2} placeholder="Insight" aria-invalid={!!metricsErrors.mentor_retention?.insight?.message} aria-describedby={metricsErrors.mentor_retention?.insight?.message ? 'mentor_retention_insight_error' : undefined} {...register('mentor_retention.insight')} />
        <FieldError id="mentor_retention_insight_error" message={metricsErrors.mentor_retention?.insight?.message as string | undefined} />
        </MetricCard>

        <MetricCard title="Passbook Conversations">
        <label htmlFor="passbook_mentors_started" className="block text-xs font-medium text-gray-700">Mentors started</label>
        <Input id="passbook_mentors_started" type="number" placeholder="Mentors started" {...register('passbook_conversations.mentors_started', { valueAsNumber: true })} />
        <label htmlFor="passbook_pct_reached" className="block text-xs font-medium text-gray-700">Percent of scholars reached</label>
        <Input id="passbook_pct_reached" type="number" placeholder="% scholars reached" {...register('passbook_conversations.pct_scholars_reached', { valueAsNumber: true })} />
        <label htmlFor="passbook_avg_per_mentor" className="block text-xs font-medium text-gray-700">Average scholars per mentor</label>
        <Input id="passbook_avg_per_mentor" type="number" placeholder="Avg scholars per mentor" {...register('passbook_conversations.avg_scholars_per_mentor', { valueAsNumber: true })} />
        <label htmlFor="passbook_insight" className="block text-xs font-medium text-gray-700">Insight</label>
        <Textarea id="passbook_insight" rows={2} placeholder="Insight" aria-invalid={!!metricsErrors.passbook_conversations?.insight?.message} aria-describedby={metricsErrors.passbook_conversations?.insight?.message ? 'passbook_insight_error' : undefined} {...register('passbook_conversations.insight')} />
        <FieldError id="passbook_insight_error" message={metricsErrors.passbook_conversations?.insight?.message as string | undefined} />
        </MetricCard>

        <MetricCard title="Class Size Averages">
        <label htmlFor="class_size_avg_scholars" className="block text-xs font-medium text-gray-700">Average scholars</label>
        <Input id="class_size_avg_scholars" type="number" placeholder="Avg scholars" {...register('class_size_averages.avg_scholars', { valueAsNumber: true })} />
        <label htmlFor="class_size_avg_non_scholars" className="block text-xs font-medium text-gray-700">Average non-scholars</label>
        <Input id="class_size_avg_non_scholars" type="number" placeholder="Avg non-scholars" {...register('class_size_averages.avg_non_scholars', { valueAsNumber: true })} />
        <label htmlFor="class_size_insight" className="block text-xs font-medium text-gray-700">Insight</label>
        <Textarea id="class_size_insight" rows={2} placeholder="Insight" aria-invalid={!!metricsErrors.class_size_averages?.insight?.message} aria-describedby={metricsErrors.class_size_averages?.insight?.message ? 'class_size_insight_error' : undefined} {...register('class_size_averages.insight')} />
        <FieldError id="class_size_insight_error" message={metricsErrors.class_size_averages?.insight?.message as string | undefined} />
        </MetricCard>

        <div className="md:col-span-2 rounded-lg border border-gray-200 bg-slate-50 p-4">
          <button
            type="button"
            className="text-sm font-medium text-teal-700 underline"
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            {showAdvanced ? 'Hide advanced metrics' : 'Show advanced metrics (optional details)'}
          </button>
          <p className="mt-1 text-xs text-slate-600">
            You can submit without this section, but filling it gives leadership better context for planning support.
          </p>
        </div>

        {showAdvanced && (
          <>
            <MetricCard title="Class Composition">
              <label htmlFor="class_composition_exactly_45" className="block text-xs font-medium text-gray-700">Exactly 45</label>
              <Input id="class_composition_exactly_45" type="number" placeholder="Exactly 45" {...register('class_composition.exactly_45', { valueAsNumber: true })} />
              <label htmlFor="class_composition_plus_1_15" className="block text-xs font-medium text-gray-700">+1-15</label>
              <Input id="class_composition_plus_1_15" type="number" placeholder="+1-15" {...register('class_composition.plus_1_15', { valueAsNumber: true })} />
              <label htmlFor="class_composition_plus_16_30" className="block text-xs font-medium text-gray-700">+16-30</label>
              <Input id="class_composition_plus_16_30" type="number" placeholder="+16-30" {...register('class_composition.plus_16_30', { valueAsNumber: true })} />
              <label htmlFor="class_composition_plus_30_more" className="block text-xs font-medium text-gray-700">+30+</label>
              <Input id="class_composition_plus_30_more" type="number" placeholder="+30+" {...register('class_composition.plus_30_more', { valueAsNumber: true })} />
              <label htmlFor="class_composition_observations" className="block text-xs font-medium text-gray-700">Observations</label>
              <Textarea id="class_composition_observations" rows={2} placeholder="Observations" {...register('class_composition.observations')} />
            </MetricCard>

            <MetricCard title="Composition Deep Dive" className="md:col-span-2">
              <label htmlFor="deep_dive_main_reasons" className="block text-xs font-medium text-gray-700">Main reasons</label>
              <Textarea id="deep_dive_main_reasons" rows={2} placeholder="Main reasons" {...register('composition_deep_dive.main_reasons')} />
              <label htmlFor="deep_dive_affected_schools" className="block text-xs font-medium text-gray-700">Affected schools</label>
              <Textarea id="deep_dive_affected_schools" rows={2} placeholder="Affected schools" {...register('composition_deep_dive.affected_schools')} />
              <label htmlFor="deep_dive_solutions_tried" className="block text-xs font-medium text-gray-700">Solutions tried</label>
              <Textarea id="deep_dive_solutions_tried" rows={2} placeholder="Solutions tried" {...register('composition_deep_dive.solutions_tried')} />
              <label htmlFor="deep_dive_support_needed" className="block text-xs font-medium text-gray-700">Support needed</label>
              <Textarea id="deep_dive_support_needed" rows={2} placeholder="Support needed" {...register('composition_deep_dive.support_needed')} />
            </MetricCard>
          </>
        )}
      </div>
    </section>
  )
}
