'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { draftSchema, type DraftInput } from '@/lib/schemas'
import type { SubmissionStatus } from '@/lib/types'

interface SubmissionContextValue {
  currentStep: number
  totalSteps: number
  stepCompletion: boolean[]
  goNext: () => Promise<void>
  goPrev: () => void
  goToStep: (n: number) => void
  submissionId: string | null
  status: SubmissionStatus | null
  lastSavedAt: Date | null
  isSaving: boolean
  isSubmitting: boolean
  stepError: string | null
  submitError: string | null
  submitSuccessMessage: string | null
  handleSaveDraft: () => Promise<void>
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

const isFilled = (value: unknown) => {
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  return value !== null && value !== undefined
}

function computeStepCompletion(values: DraftInput): boolean[] {
  const priorities = values.priorities ?? []
  const risks = values.risks ?? []

  return [
    isFilled(values.region) && isFilled(values.po_names) && isFilled(values.week_label) && isFilled(values.submission_date),
    isFilled(values.overall_status) && isFilled(values.top_win) && isFilled(values.top_challenge) && isFilled(values.confidence_next_week),
    isFilled(values.scholar_retention?.insight)
      && isFilled(values.mentor_retention?.insight)
      && isFilled(values.passbook_conversations?.insight)
      && isFilled(values.class_size_averages?.insight),
    priorities.length >= 3
      && isFilled(priorities[0]?.planned) && isFilled(priorities[0]?.actual) && isFilled(priorities[0]?.insight)
      && isFilled(priorities[1]?.planned) && isFilled(priorities[1]?.actual) && isFilled(priorities[1]?.insight)
      && isFilled(priorities[2]?.planned) && isFilled(priorities[2]?.actual) && isFilled(priorities[2]?.insight),
    isFilled(values.mentor_insights) && isFilled(values.scholar_insights) && isFilled(values.foa_insights),
    risks.length >= 1 && isFilled(risks[0]?.description) && isFilled(risks[0]?.root_cause) && isFilled(risks[0]?.mitigation),
    true,
    isFilled(values.next_week_priorities?.[0]) && isFilled(values.next_week_priorities?.[1]) && isFilled(values.next_week_priorities?.[2]) && isFilled(values.next_week_rationale),
    isFilled(values.what_worked) && isFilled(values.what_didnt),
  ]
}

function findFirstErrorPath(errorValue: unknown, parentPath = ''): string | null {
  if (!errorValue || typeof errorValue !== 'object') {
    return parentPath || null
  }

  const entries = Object.entries(errorValue as Record<string, unknown>)
  for (const [key, value] of entries) {
    const nextPath = parentPath ? `${parentPath}.${key}` : key

    if (value && typeof value === 'object' && 'message' in (value as Record<string, unknown>)) {
      return nextPath
    }

    const nestedPath = findFirstErrorPath(value, nextPath)
    if (nestedPath) {
      return nestedPath
    }
  }

  return parentPath || null
}

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
  const [stepError, setStepError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null)

  const watchedValues = methods.watch()
  const stepCompletion = useMemo(() => computeStepCompletion((watchedValues ?? {}) as DraftInput), [watchedValues])
  const hasUnsavedChanges = methods.formState.isDirty

  const saveDraft = async (values: DraftInput) => {
    const payload = {
      week_label: values.week_label || '',
      data: values,
    }

    const response = await fetch('/api/draft', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const json = await response.json().catch(() => null)
    if (!response.ok || json?.error) {
      throw new Error(json?.error || 'Draft save failed')
    }

    if (json.data?.submission_id) {
      setSubmissionId(json.data.submission_id)
      return json.data.submission_id as string
    }

    throw new Error('Draft save did not return a submission id')
  }

  const saveCurrentDraft = async () => {
    const values = methods.getValues()
    const weekLabel = values.week_label?.trim()

    if (!weekLabel) {
      throw new Error('Set Week Label in Step 1 before saving draft.')
    }

    const savedSubmissionId = await saveDraft(values)
    setLastSavedAt(new Date())
    methods.reset(values)
    return savedSubmissionId
  }

  const handleSaveDraft = async () => {
    setSubmitError(null)
    setSubmitSuccessMessage(null)
    setIsSaving(true)
    try {
      await saveCurrentDraft()
      setSubmitSuccessMessage('Draft saved successfully.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Draft save failed'
      setSubmitError(message)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (status === 'submitted') return

    const shouldPromptOnLeave = () => hasUnsavedChanges && !isSubmitting

    const promptToLeave = async (onLeave: () => void) => {
      if (!shouldPromptOnLeave()) {
        onLeave()
        return
      }

      const shouldLeave = window.confirm('You have unsaved changes. Do you want to leave this page?')
      if (!shouldLeave) return

      const saveBeforeLeaving = window.confirm('Save draft before leaving? Click OK to save draft, or Cancel to leave without saving.')
      if (saveBeforeLeaving) {
        setIsSaving(true)
        try {
          await saveCurrentDraft()
        } catch {
          const leaveWithoutSaving = window.confirm('Draft save failed. Leave without saving?')
          if (!leaveWithoutSaving) {
            setIsSaving(false)
            return
          }
        } finally {
          setIsSaving(false)
        }
      }

      onLeave()
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!shouldPromptOnLeave()) return
      event.preventDefault()
      event.returnValue = ''
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return

      const nextUrl = new URL(anchor.href, window.location.href)
      const currentUrl = new URL(window.location.href)
      if (nextUrl.href === currentUrl.href) return

      if (!shouldPromptOnLeave()) return
      event.preventDefault()
      void promptToLeave(() => {
        window.location.assign(anchor.href)
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleDocumentClick, true)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [hasUnsavedChanges, isSubmitting, methods, status])

  const goNext = async () => {
    setStepError(null)
    const stepFields = STEP_FIELDS[currentStep] ?? []
    const valid = await methods.trigger(stepFields as any)

    if (!valid) {
      setStepError('Some required fields in this section are still missing or invalid. Review the highlighted inputs below.')
      const firstErrorPath = findFirstErrorPath(methods.formState.errors)
      if (firstErrorPath) {
        methods.setFocus(firstErrorPath as any)
        const element = document.querySelector(`[name='${firstErrorPath}']`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    if (currentStep < STEP_FIELDS.length) {
      setStepError(null)
      setCurrentStep((prev) => prev + 1)
    }
  }

  const goPrev = () => {
    setStepError(null)
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  const goToStep = (n: number) => {
    if (n >= 0 && n <= STEP_FIELDS.length) {
      setStepError(null)
      setCurrentStep(n)
    }
  }

  const handleFinalSubmit = async () => {
    setSubmitError(null)
    setSubmitSuccessMessage(null)
    setIsSubmitting(true)
    try {
      const result = methods.getValues()
      const isValid = await methods.trigger()
      if (!isValid) {
        setSubmitError('Some required fields are still incomplete. Review the form and try again.')
        return
      }

      let currentSubmissionId = submissionId
      currentSubmissionId = await saveCurrentDraft()

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: currentSubmissionId, ...result }),
      })

      const json = await response.json().catch(() => null)
      if (!response.ok || json.error) {
        const message = json?.error || 'Submit failed'
        setSubmitError(message)
        return
      }

      setStatus('submitted')
      methods.reset(result)
      setSubmitSuccessMessage('Report submitted successfully. Your entry has been received and is now available for admin review.')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const value = useMemo<SubmissionContextValue>(() => ({
    currentStep,
    totalSteps: STEP_FIELDS.length + 1,
    stepCompletion,
    goNext,
    goPrev,
    goToStep,
    submissionId,
    status,
    lastSavedAt,
    isSaving,
    isSubmitting,
    stepError,
    submitError,
    submitSuccessMessage,
    handleSaveDraft,
    handleFinalSubmit,
  }), [currentStep, submissionId, status, lastSavedAt, isSaving, isSubmitting, stepError, submitError, submitSuccessMessage, stepCompletion])

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
