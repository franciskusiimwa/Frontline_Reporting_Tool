'use client'

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

export function Step1BasicInfo() {
  const { register, setValue, getValues } = useFormContext()

  useEffect(() => {
    const fillDefaults = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData?.user) return

        const [{ data: profile }, { data: currentWeek }] = await Promise.all([
          supabase.from('profiles').select('full_name, region').eq('id', userData.user.id).single(),
          supabase.from('week_config').select('label').eq('is_current', true).limit(1).maybeSingle(),
        ])

        if (!getValues('region') && profile?.region) {
          setValue('region', profile.region, { shouldDirty: false, shouldValidate: true })
        }

        if (!getValues('po_names') && profile?.full_name) {
          setValue('po_names', profile.full_name, { shouldDirty: false, shouldValidate: true })
        }

        if (!getValues('week_label') && currentWeek?.label) {
          setValue('week_label', currentWeek.label, { shouldDirty: false, shouldValidate: true })
        }

        if (!getValues('submission_date')) {
          const today = new Date().toISOString().slice(0, 10)
          setValue('submission_date', today, { shouldDirty: false, shouldValidate: true })
        }
      } catch {
      }
    }

    void fillDefaults()
  }, [getValues, setValue])

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-gray-800">Basic Info</h2>
      <p className="text-sm text-gray-500">Region and PO name are auto-captured from your profile.</p>
      <div>
        <label htmlFor="region" className="block text-xs font-medium text-gray-700">Region</label>
        <Input id="region" {...register('region')} readOnly />
      </div>
      <div>
        <label htmlFor="po_names" className="block text-xs font-medium text-gray-700">PO Names</label>
        <Input id="po_names" {...register('po_names')} readOnly />
      </div>
      <div>
        <label htmlFor="week_label" className="block text-xs font-medium text-gray-700">Week Label</label>
        <Input id="week_label" {...register('week_label')} />
      </div>
      <div>
        <label htmlFor="submission_date" className="block text-xs font-medium text-gray-700">Submission Date</label>
        <Input id="submission_date" type="date" {...register('submission_date')} />
      </div>
    </section>
  )
}
