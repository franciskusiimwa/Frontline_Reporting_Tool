'use client'

import { useFormContext } from 'react-hook-form'
import { Textarea } from '@/components/ui/Textarea'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-600">{message}</p>
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
      <label className="block text-xs font-medium text-gray-700">What Worked</label>
      <Textarea rows={4} placeholder="What worked" {...register('what_worked')} />
      <FieldError message={reflectionErrors.what_worked?.message as string | undefined} />
      <label className="block text-xs font-medium text-gray-700">What Did Not Work</label>
      <Textarea rows={4} placeholder="What did not work" {...register('what_didnt')} />
      <FieldError message={reflectionErrors.what_didnt?.message as string | undefined} />
    </section>
  )
}
