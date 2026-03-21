'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} role="alert" className="text-xs text-red-600">{message}</p>
}

export function Step4Priorities() {
  const {
    register,
    formState: { errors },
  } = useFormContext()
  const priorityErrors = errors as any

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-medium">Priority Focus Areas</h2>
      <p className="text-sm text-gray-500">
        For each major priority from this week, describe what was planned, what was actually done, the current status, and the main learning or blocker.
      </p>
      <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
        Required in this section: for each of the three priorities, fill Planned, Actual, and Insight.
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((idx) => (
        <div key={idx} className="rounded-md border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">Priority {idx + 1}</h3>
          <label htmlFor={`priority_${idx + 1}_planned`} className="block text-xs font-medium text-gray-700">Planned</label>
          <Input id={`priority_${idx + 1}_planned`} placeholder="Planned" aria-invalid={!!priorityErrors.priorities?.[idx]?.planned?.message} aria-describedby={priorityErrors.priorities?.[idx]?.planned?.message ? `priority_${idx + 1}_planned_error` : undefined} {...register(`priorities.${idx}.planned` as const)} />
          <FieldError id={`priority_${idx + 1}_planned_error`} message={priorityErrors.priorities?.[idx]?.planned?.message as string | undefined} />
          <label htmlFor={`priority_${idx + 1}_actual`} className="block text-xs font-medium text-gray-700">Actual</label>
          <Input id={`priority_${idx + 1}_actual`} placeholder="Actual" aria-invalid={!!priorityErrors.priorities?.[idx]?.actual?.message} aria-describedby={priorityErrors.priorities?.[idx]?.actual?.message ? `priority_${idx + 1}_actual_error` : undefined} {...register(`priorities.${idx}.actual` as const)} />
          <FieldError id={`priority_${idx + 1}_actual_error`} message={priorityErrors.priorities?.[idx]?.actual?.message as string | undefined} />
          <label htmlFor={`priority_${idx + 1}_status`} className="block text-xs font-medium text-gray-700">Status</label>
          <select
            id={`priority_${idx + 1}_status`}
            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
            {...register(`priorities.${idx}.status` as const)}
          >
            <option value="on_track">On Track</option>
            <option value="at_risk">At Risk</option>
            <option value="off_track">Off Track</option>
          </select>
          <label htmlFor={`priority_${idx + 1}_insight`} className="block text-xs font-medium text-gray-700">Insight</label>
          <Textarea id={`priority_${idx + 1}_insight`} rows={2} placeholder="Insight" aria-invalid={!!priorityErrors.priorities?.[idx]?.insight?.message} aria-describedby={priorityErrors.priorities?.[idx]?.insight?.message ? `priority_${idx + 1}_insight_error` : undefined} {...register(`priorities.${idx}.insight` as const)} />
          <FieldError id={`priority_${idx + 1}_insight_error`} message={priorityErrors.priorities?.[idx]?.insight?.message as string | undefined} />
        </div>
      ))}
      </div>
    </section>
  )
}
