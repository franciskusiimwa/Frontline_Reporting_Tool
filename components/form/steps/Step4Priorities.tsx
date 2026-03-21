'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-600">{message}</p>
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
          <label className="block text-xs font-medium text-gray-700">Planned</label>
          <Input placeholder="Planned" {...register(`priorities.${idx}.planned` as const)} />
          <FieldError message={priorityErrors.priorities?.[idx]?.planned?.message as string | undefined} />
          <label className="block text-xs font-medium text-gray-700">Actual</label>
          <Input placeholder="Actual" {...register(`priorities.${idx}.actual` as const)} />
          <FieldError message={priorityErrors.priorities?.[idx]?.actual?.message as string | undefined} />
          <label className="block text-xs font-medium text-gray-700">Status</label>
          <select
            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
            {...register(`priorities.${idx}.status` as const)}
          >
            <option value="on_track">On Track</option>
            <option value="at_risk">At Risk</option>
            <option value="off_track">Off Track</option>
          </select>
          <label className="block text-xs font-medium text-gray-700">Insight</label>
          <Textarea rows={2} placeholder="Insight" {...register(`priorities.${idx}.insight` as const)} />
          <FieldError message={priorityErrors.priorities?.[idx]?.insight?.message as string | undefined} />
        </div>
      ))}
      </div>
    </section>
  )
}
