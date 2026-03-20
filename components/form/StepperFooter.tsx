'use client'

import { useSubmission } from '@/components/form/SubmissionProvider'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/Button'

export function StepperFooter() {
  const { currentStep, totalSteps, goPrev, goNext, lastSavedAt, isSaving, isSubmitting, handleFinalSubmit } = useSubmission()

  const lastSavedText = lastSavedAt ? formatDistanceToNow(lastSavedAt, { addSuffix: true }) : 'Not saved yet'

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-3 shadow-lg md:relative md:border-none md:bg-transparent md:shadow-none">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Button variant="secondary" onClick={() => {}} disabled>
            {isSaving ? 'Saving…' : 'Save Draft'}
          </Button>
          <span>{isSaving ? 'Saving...' : `Saved ${lastSavedText}`}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={goPrev} disabled={currentStep === 0 || isSubmitting}>
            Back
          </Button>
          {currentStep < totalSteps - 1 ? (
            <Button onClick={goNext} disabled={isSubmitting}>
              Next
            </Button>
          ) : (
            <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
