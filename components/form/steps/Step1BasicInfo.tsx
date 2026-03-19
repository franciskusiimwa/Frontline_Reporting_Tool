'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/Input'

export function Step1BasicInfo() {
  const { register } = useFormContext()

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-gray-800">Basic Info</h2>
      <div>
        <label className="block text-xs font-medium text-gray-500">Region</label>
        <Input {...register('region')} readOnly />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">PO Names</label>
        <Input {...register('po_names')} readOnly />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">Week Label</label>
        <Input {...register('week_label')} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">Submission Date</label>
        <Input type="date" {...register('submission_date')} />
      </div>
    </section>
  )
}
