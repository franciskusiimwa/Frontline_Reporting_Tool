'use client'

import { useFormContext } from 'react-hook-form'
import { Textarea } from '@/components/ui/Textarea'

export function Step2Snapshot() {
  const { register } = useFormContext()

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-gray-800">Week Snapshot</h2>
      <p>Use the weekly status cards and confidence selections.</p>
      <Textarea rows={3} placeholder="Top win" {...register('top_win')} />
      <Textarea rows={3} placeholder="Top challenge" {...register('top_challenge')} />
    </section>
  )
}
