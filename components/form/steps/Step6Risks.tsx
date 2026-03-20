'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-600">{message}</p>
}

export function Step6Risks() {
  const {
    register,
    formState: { errors },
  } = useFormContext()
  const riskErrors = errors as any

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Risks</h2>
      <p className="text-sm text-gray-500">
        Record the main risk that could affect delivery, retention, quality, or follow-through. Explain what is causing it, what is being done already, and what support may still be needed.
      </p>
      <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
        Required in this section: add at least one risk with Description, Root cause, and Mitigation.
      </div>

      <div className="rounded-md border border-gray-200 p-4 space-y-3">
        <Input placeholder="Risk description" {...register('risks.0.description')} />
        <FieldError message={riskErrors.risks?.[0]?.description?.message as string | undefined} />
        <select
          className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
          {...register('risks.0.severity')}
        >
          <option value="H">High</option>
          <option value="M">Medium</option>
          <option value="L">Low</option>
        </select>
        <Textarea rows={2} placeholder="Root cause" {...register('risks.0.root_cause')} />
        <FieldError message={riskErrors.risks?.[0]?.root_cause?.message as string | undefined} />
        <Textarea rows={2} placeholder="Mitigation" {...register('risks.0.mitigation')} />
        <FieldError message={riskErrors.risks?.[0]?.mitigation?.message as string | undefined} />
        <Textarea rows={2} placeholder="Support needed" {...register('risks.0.support_needed')} />
      </div>
    </section>
  )
}
