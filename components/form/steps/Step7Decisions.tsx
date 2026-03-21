'use client'

import { useFormContext } from 'react-hook-form'
import { Textarea } from '@/components/ui/Textarea'

export function Step7Decisions() {
  const { register } = useFormContext()

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Decisions & Support</h2>
      <p className="text-sm text-gray-500">
        Use this section for issues that need leadership input, policy clarification, or extra support. If nothing is needed, make that explicit rather than leaving it ambiguous.
      </p>
      <label htmlFor="decision_required" className="block text-xs font-medium text-gray-700">Decision Required</label>
      <Textarea id="decision_required" rows={3} placeholder="Decision required" {...register('decision_required')} />
      <label htmlFor="clarification_needed" className="block text-xs font-medium text-gray-700">Clarification Needed</label>
      <Textarea id="clarification_needed" rows={3} placeholder="Clarification needed" {...register('clarification_needed')} />
      <label htmlFor="additional_support" className="block text-xs font-medium text-gray-700">Additional Support</label>
      <Textarea id="additional_support" rows={3} placeholder="Additional support" {...register('additional_support')} />
    </section>
  )
}
