'use client'

import { useFormContext } from 'react-hook-form'
import { Textarea } from '@/components/ui/Textarea'

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} role="alert" className="text-xs text-red-600">{message}</p>
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
          <label htmlFor="mentor_insights" className="text-sm font-semibold text-gray-700">Mentor Insights</label>
          <Textarea id="mentor_insights" rows={4} placeholder="Mentor insights" aria-invalid={!!insightErrors.mentor_insights?.message} aria-describedby={insightErrors.mentor_insights?.message ? 'mentor_insights_error' : undefined} {...register('mentor_insights')} />
          <FieldError id="mentor_insights_error" message={insightErrors.mentor_insights?.message as string | undefined} />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <label htmlFor="scholar_insights" className="text-sm font-semibold text-gray-700">Scholar Insights</label>
          <Textarea id="scholar_insights" rows={4} placeholder="Scholar insights" aria-invalid={!!insightErrors.scholar_insights?.message} aria-describedby={insightErrors.scholar_insights?.message ? 'scholar_insights_error' : undefined} {...register('scholar_insights')} />
          <FieldError id="scholar_insights_error" message={insightErrors.scholar_insights?.message as string | undefined} />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <label htmlFor="foa_insights" className="text-sm font-semibold text-gray-700">FOA Insights</label>
          <Textarea id="foa_insights" rows={4} placeholder="FOA insights" aria-invalid={!!insightErrors.foa_insights?.message} aria-describedby={insightErrors.foa_insights?.message ? 'foa_insights_error' : undefined} {...register('foa_insights')} />
          <FieldError id="foa_insights_error" message={insightErrors.foa_insights?.message as string | undefined} />
        </div>
      </div>
    </section>
  )
}
