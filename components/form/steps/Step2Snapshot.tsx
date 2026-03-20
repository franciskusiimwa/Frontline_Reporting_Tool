'use client'

import { useFormContext } from 'react-hook-form'
import { Textarea } from '@/components/ui/Textarea'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-600">{message}</p>
}

export function Step2Snapshot() {
  const {
    register,
    formState: { errors },
  } = useFormContext()
  const snapshotErrors = errors as any

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-gray-800">Week Snapshot</h2>
      <p className="text-sm text-gray-500">
        Give a high-level picture of the week. Choose the overall status that best reflects delivery this week, then explain the biggest win and the biggest challenge.
      </p>
      <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
        Required in this section: Top win and Top challenge. If Next does not move, one of those fields is still empty.
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">Overall Status</label>
        <select
          className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
          {...register('overall_status')}
        >
          <option value="on_track">On Track</option>
          <option value="at_risk">At Risk</option>
          <option value="off_track">Off Track</option>
        </select>
      </div>
      <Textarea rows={3} placeholder="Top win" {...register('top_win')} />
      <FieldError message={snapshotErrors.top_win?.message as string | undefined} />
      <Textarea rows={3} placeholder="Top challenge" {...register('top_challenge')} />
      <FieldError message={snapshotErrors.top_challenge?.message as string | undefined} />
      <div>
        <label className="block text-xs font-medium text-gray-500">Confidence Next Week (1-5)</label>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          className="w-full"
          {...register('confidence_next_week', { valueAsNumber: true })}
        />
      </div>
    </section>
  )
}
