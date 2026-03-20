'use client'

import { useFormContext } from 'react-hook-form'
import { Textarea } from '@/components/ui/Textarea'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-600">{message}</p>
}

export function Step5FieldInsights() {
  const {
    register,
    formState: { errors },
  } = useFormContext()
  const insightErrors = errors as any

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Field Insights</h2>
      <p className="text-sm text-gray-500">
        Capture what you are seeing and hearing from the field. Focus on patterns, behavior changes, or issues that numbers alone do not explain.
      </p>
      <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
        Required in this section: complete all three insight boxes so the report captures mentor, scholar, and FOA perspective.
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Mentor Insights</h3>
          <Textarea rows={4} placeholder="Mentor insights" {...register('mentor_insights')} />
          <FieldError message={insightErrors.mentor_insights?.message as string | undefined} />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Scholar Insights</h3>
          <Textarea rows={4} placeholder="Scholar insights" {...register('scholar_insights')} />
          <FieldError message={insightErrors.scholar_insights?.message as string | undefined} />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">FOA Insights</h3>
          <Textarea rows={4} placeholder="FOA insights" {...register('foa_insights')} />
          <FieldError message={insightErrors.foa_insights?.message as string | undefined} />
        </div>
      </div>
    </section>
  )
}
