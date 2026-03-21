'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-600">{message}</p>
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
        <label className="block text-xs font-medium text-gray-700">Last week count</label>
        <Input type="number" placeholder="Last week" {...register('scholar_retention.last_week', { valueAsNumber: true })} />
        <label className="block text-xs font-medium text-gray-700">This week count</label>
        <Input type="number" placeholder="This week" {...register('scholar_retention.this_week', { valueAsNumber: true })} />
        <label className="block text-xs font-medium text-gray-700">Retention rate (%)</label>
        <Input type="number" placeholder="Retention rate (%)" {...register('scholar_retention.retention_rate', { valueAsNumber: true })} />
        <label className="block text-xs font-medium text-gray-700">Insight</label>
        <Textarea rows={2} placeholder="Insight" {...register('scholar_retention.insight')} />
        <FieldError message={metricsErrors.scholar_retention?.insight?.message as string | undefined} />
        </MetricCard>

        <MetricCard title="Mentor Retention">
        <label className="block text-xs font-medium text-gray-700">Last week count</label>
        <Input type="number" placeholder="Last week" {...register('mentor_retention.last_week', { valueAsNumber: true })} />
        <label className="block text-xs font-medium text-gray-700">This week count</label>
        <Input type="number" placeholder="This week" {...register('mentor_retention.this_week', { valueAsNumber: true })} />
        <label className="block text-xs font-medium text-gray-700">Retention rate (%)</label>
        <Input type="number" placeholder="Retention rate (%)" {...register('mentor_retention.retention_rate', { valueAsNumber: true })} />
        <label className="block text-xs font-medium text-gray-700">Insight</label>
        <Textarea rows={2} placeholder="Insight" {...register('mentor_retention.insight')} />
        <FieldError message={metricsErrors.mentor_retention?.insight?.message as string | undefined} />
        </MetricCard>

        <MetricCard title="Passbook Conversations">
        <label className="block text-xs font-medium text-gray-700">Mentors started</label>
        <Input type="number" placeholder="Mentors started" {...register('passbook_conversations.mentors_started', { valueAsNumber: true })} />
        <label className="block text-xs font-medium text-gray-700">Percent of scholars reached</label>
        <Input type="number" placeholder="% scholars reached" {...register('passbook_conversations.pct_scholars_reached', { valueAsNumber: true })} />
        <label className="block text-xs font-medium text-gray-700">Average scholars per mentor</label>
        <Input type="number" placeholder="Avg scholars per mentor" {...register('passbook_conversations.avg_scholars_per_mentor', { valueAsNumber: true })} />
        <label className="block text-xs font-medium text-gray-700">Insight</label>
        <Textarea rows={2} placeholder="Insight" {...register('passbook_conversations.insight')} />
        <FieldError message={metricsErrors.passbook_conversations?.insight?.message as string | undefined} />
        </MetricCard>

        <MetricCard title="Class Size Averages">
        <label className="block text-xs font-medium text-gray-700">Average scholars</label>
        <Input type="number" placeholder="Avg scholars" {...register('class_size_averages.avg_scholars', { valueAsNumber: true })} />
        <label className="block text-xs font-medium text-gray-700">Average non-scholars</label>
        <Input type="number" placeholder="Avg non-scholars" {...register('class_size_averages.avg_non_scholars', { valueAsNumber: true })} />
        <label className="block text-xs font-medium text-gray-700">Insight</label>
        <Textarea rows={2} placeholder="Insight" {...register('class_size_averages.insight')} />
        <FieldError message={metricsErrors.class_size_averages?.insight?.message as string | undefined} />
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
              <Input type="number" placeholder="Exactly 45" {...register('class_composition.exactly_45', { valueAsNumber: true })} />
              <Input type="number" placeholder="+1-15" {...register('class_composition.plus_1_15', { valueAsNumber: true })} />
              <Input type="number" placeholder="+16-30" {...register('class_composition.plus_16_30', { valueAsNumber: true })} />
              <Input type="number" placeholder="+30+" {...register('class_composition.plus_30_more', { valueAsNumber: true })} />
              <Textarea rows={2} placeholder="Observations" {...register('class_composition.observations')} />
            </MetricCard>

            <MetricCard title="Composition Deep Dive" className="md:col-span-2">
              <Textarea rows={2} placeholder="Main reasons" {...register('composition_deep_dive.main_reasons')} />
              <Textarea rows={2} placeholder="Affected schools" {...register('composition_deep_dive.affected_schools')} />
              <Textarea rows={2} placeholder="Solutions tried" {...register('composition_deep_dive.solutions_tried')} />
              <Textarea rows={2} placeholder="Support needed" {...register('composition_deep_dive.support_needed')} />
            </MetricCard>
          </>
        )}
      </div>
    </section>
  )
}
