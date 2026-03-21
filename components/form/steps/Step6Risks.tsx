'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} role="alert" className="text-xs text-red-600">{message}</p>
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
        <label htmlFor="risk_description" className="block text-xs font-medium text-gray-700">Risk Description</label>
        <Input id="risk_description" placeholder="Risk description" aria-invalid={!!riskErrors.risks?.[0]?.description?.message} aria-describedby={riskErrors.risks?.[0]?.description?.message ? 'risk_description_error' : undefined} {...register('risks.0.description')} />
        <FieldError id="risk_description_error" message={riskErrors.risks?.[0]?.description?.message as string | undefined} />
        <label htmlFor="risk_severity" className="block text-xs font-medium text-gray-700">Severity</label>
        <select
          id="risk_severity"
          className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
          {...register('risks.0.severity')}
        >
          <option value="H">High</option>
          <option value="M">Medium</option>
          <option value="L">Low</option>
        </select>
        <label htmlFor="risk_root_cause" className="block text-xs font-medium text-gray-700">Root Cause</label>
        <Textarea id="risk_root_cause" rows={2} placeholder="Root cause" aria-invalid={!!riskErrors.risks?.[0]?.root_cause?.message} aria-describedby={riskErrors.risks?.[0]?.root_cause?.message ? 'risk_root_cause_error' : undefined} {...register('risks.0.root_cause')} />
        <FieldError id="risk_root_cause_error" message={riskErrors.risks?.[0]?.root_cause?.message as string | undefined} />
        <label htmlFor="risk_mitigation" className="block text-xs font-medium text-gray-700">Mitigation</label>
        <Textarea id="risk_mitigation" rows={2} placeholder="Mitigation" aria-invalid={!!riskErrors.risks?.[0]?.mitigation?.message} aria-describedby={riskErrors.risks?.[0]?.mitigation?.message ? 'risk_mitigation_error' : undefined} {...register('risks.0.mitigation')} />
        <FieldError id="risk_mitigation_error" message={riskErrors.risks?.[0]?.mitigation?.message as string | undefined} />
        <label htmlFor="risk_support_needed" className="block text-xs font-medium text-gray-700">Support Needed</label>
        <Textarea id="risk_support_needed" rows={2} placeholder="Support needed" {...register('risks.0.support_needed')} />
      </div>
    </section>
  )
}
