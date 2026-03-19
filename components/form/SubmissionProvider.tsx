'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useForm, FormProvider, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { draftSchema, type DraftInput } from '@/lib/schemas'
import { useDebounce } from '@/lib/utils'
import type { SubmissionStatus } from '@/lib/types'

interface SubmissionContextValue {
  currentStep: number
  totalSteps: number
  goNext: () => Promise<void>
  goPrev: () => void
  goToStep: (n: number) => void
  submissionId: string | null
  status: SubmissionStatus | null
  lastSavedAt: Date | null
  isSaving: boolean
  isSubmitting: boolean
  handleFinalSubmit: () => Promise<void>
}

const SubmissionContext = createContext<SubmissionContextValue | undefined>(undefined)

const STEP_FIELDS: Array<Array<keyof DraftInput>> = [
  ['region', 'po_names', 'week_label', 'submission_date'],
  ['overall_status', 'top_win', 'top_challenge', 'confidence_next_week'],
  ['scholar_retention', 'mentor_retention', 'passbook_conversations', 'class_composition', 'class_size_averages', 'composition_deep_dive'],
  ['priorities'],
  ['mentor_insights', 'scholar_insights', 'foa_insights'],
  ['risks'],
  ['decision_required', 'clarification_needed', 'additional_support'],
  ['next_week_priorities', 'next_week_rationale'],
  ['what_worked', 'what_didnt'],
]

export function SubmissionProvider({ children }: { children: React.ReactNode }) {
  const methods = useForm<DraftInput>({
    resolver: zodResolver(draftSchema),
    defaultValues: {
      region: '',
      po_names: '',
      week_label: '',
      submission_date: '',
      overall_status: 'on_track',
      top_win: '',
      top_challenge: '',
      confidence_next_week: 3,
      scholar_retention: { last_week: 0, this_week: 0, retention_rate: 0, insight: '' },
      mentor_retention: { last_week: 0, this_week: 0, retention_rate: 0, insight: '' },
      passbook_conversations: { mentors_started: 0, pct_scholars_reached: 0, avg_scholars_per_mentor: 0, insight: '' },
      class_composition: { exactly_45: 0, plus_1_15: 0, plus_16_30: 0, plus_30_more: 0, observations: '' },
      class_size_averages: { avg_scholars: 0, avg_non_scholars: 0, insight: '' },
      composition_deep_dive: { main_reasons: '', affected_schools: '', solutions_tried: '', support_needed: '' },
      priorities: [
        { label: 'Priority 1', planned: '', actual: '', status: 'on_track', insight: '' },
        { label: 'Priority 2', planned: '', actual: '', status: 'on_track', insight: '' },
        { label: 'Priority 3', planned: '', actual: '', status: 'on_track', insight: '' },
      ],
      mentor_insights: '',
      scholar_insights: '',
      foa_insights: '',
      risks: [],
      decision_required: '',
      clarification_needed: '',
      additional_support: '',
      next_week_priorities: ['', '', ''],
      next_week_rationale: '',
      what_worked: '',
      what_didnt: '',
    },
  })

  const [currentStep, setCurrentStep] = useState(0)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [status, setStatus] = useState<SubmissionStatus | null>('draft')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const watchedValues = methods.watch()
  const debouncedValues = useDebounce(watchedValues, 2000)

  useEffect(() => {
    if (!debouncedValues) return
    if (isSubmitting) return

    const saveDraft = async () => {
      setIsSaving(true)
      try {
        const payload = {
          week_label: debouncedValues.week_label || '',
          data: debouncedValues,
        }

        const response = await fetch('/api/draft', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const json = await response.json()
        if (!response.ok || json.error) {
          console.error('Draft save failed', json.error)
          setIsSaving(false)
          return
        }

        if (json.data?.submission_id) {
          setSubmissionId(json.data.submission_id)
        }
        setLastSavedAt(new Date())
      } catch (err) {
        console.error('Draft save exception', err)
      } finally {
        setIsSaving(false)
      }
    }

    void saveDraft()
  }, [debouncedValues, isSubmitting])

  const goNext = async () => {
    const stepFields = STEP_FIELDS[currentStep] ?? []
    const valid = await methods.trigger(stepFields as any)

    if (!valid) {
      const firstError = Object.keys(methods.formState.errors)[0]
      if (firstError) {
        const element = document.querySelector(`[name='${firstError}']`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    if (currentStep < STEP_FIELDS.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const goPrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  const goToStep = (n: number) => {
    if (n >= 0 && n <= STEP_FIELDS.length) {
      setCurrentStep(n)
    }
  }

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    try {
      const result = methods.getValues()
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId, ...result }),
      })

      const json = await response.json()
      if (!response.ok || json.error) {
        console.error('Submit failed', json.error)
        return
      }

      setStatus('submitted')
    } catch (err) {
      console.error('Submit exception', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const value = useMemo<SubmissionContextValue>(() => ({
    currentStep,
    totalSteps: STEP_FIELDS.length + 1,
    goNext,
    goPrev,
    goToStep,
    submissionId,
    status,
    lastSavedAt,
    isSaving,
    isSubmitting,
    handleFinalSubmit,
  }), [currentStep, submissionId, status, lastSavedAt, isSaving, isSubmitting])

  return (
    <SubmissionContext.Provider value={value}>
      <FormProvider {...methods}>{children}</FormProvider>
    </SubmissionContext.Provider>
  )
}

export function useSubmission() {
  const ctx = useContext(SubmissionContext)
  if (!ctx) {
    throw new Error('useSubmission must be used within SubmissionProvider')
  }
  return ctx
}
