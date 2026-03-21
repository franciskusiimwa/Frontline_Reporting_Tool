'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-600">{message}</p>
}

export function Step8NextWeek() {
  const {
    register,
    formState: { errors },
  } = useFormContext()
  const nextWeekErrors = errors as any

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Next Week</h2>
      <p className="text-sm text-gray-500">
        This section is for forward planning. List the three most important actions you will focus on next week, then explain why those three matter most right now. Include actions that respond to this week&apos;s risks, missed targets, or major opportunities.
      </p>
      <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
        Required in this section: fill all three priority lines and the rationale box. This step will block Next if any of the four is blank.
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Priority 1</label>
          <Input placeholder="Priority 1" {...register('next_week_priorities.0')} />
          <FieldError message={nextWeekErrors.next_week_priorities?.[0]?.message as string | undefined} />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Priority 2</label>
          <Input placeholder="Priority 2" {...register('next_week_priorities.1')} />
          <FieldError message={nextWeekErrors.next_week_priorities?.[1]?.message as string | undefined} />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Priority 3</label>
          <Input placeholder="Priority 3" {...register('next_week_priorities.2')} />
          <FieldError message={nextWeekErrors.next_week_priorities?.[2]?.message as string | undefined} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Why these priorities</h3>
        <label className="block text-xs font-medium text-gray-700">Rationale</label>
        <Textarea rows={3} placeholder="Rationale" {...register('next_week_rationale')} />
        <FieldError message={nextWeekErrors.next_week_rationale?.message as string | undefined} />
      </div>
    </section>
  )
}
