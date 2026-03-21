'use client'

import { useFormContext } from 'react-hook-form'
import { Textarea } from '@/components/ui/Textarea'

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} role="alert" className="text-xs text-red-600">{message}</p>
}

export function Step9Reflection() {
  const {
    register,
    formState: { errors },
  } = useFormContext()
  const reflectionErrors = errors as any

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Reflection</h2>
      <p className="text-sm text-gray-500">
        Close with honest reflection. Note what should be repeated because it worked well, and what should change because it did not produce the expected result.
      </p>
      <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
        Required in this section: both reflection boxes must be completed before you can move on to Review.
      </div>
      <label htmlFor="what_worked" className="block text-xs font-medium text-gray-700">What Worked</label>
      <Textarea id="what_worked" rows={4} placeholder="What worked" aria-invalid={!!reflectionErrors.what_worked?.message} aria-describedby={reflectionErrors.what_worked?.message ? 'what_worked_error' : undefined} {...register('what_worked')} />
      <FieldError id="what_worked_error" message={reflectionErrors.what_worked?.message as string | undefined} />
      <label htmlFor="what_didnt" className="block text-xs font-medium text-gray-700">What Did Not Work</label>
      <Textarea id="what_didnt" rows={4} placeholder="What did not work" aria-invalid={!!reflectionErrors.what_didnt?.message} aria-describedby={reflectionErrors.what_didnt?.message ? 'what_didnt_error' : undefined} {...register('what_didnt')} />
      <FieldError id="what_didnt_error" message={reflectionErrors.what_didnt?.message as string | undefined} />
    </section>
  )
}
