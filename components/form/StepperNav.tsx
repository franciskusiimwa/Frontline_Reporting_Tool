'use client'

import { useSubmission } from '@/components/form/SubmissionProvider'
import { CheckCircle } from 'lucide-react'

const STEP_LABELS = [
  'Basic Info',
  'Snapshot',
  'Metrics',
  'Priorities',
  'Field Insights',
  'Risks',
  'Decisions',
  'Next Week',
  'Reflection',
]

export function StepperNav() {
  const { currentStep, goToStep } = useSubmission()

  return (
    <nav className="flex items-center justify-between overflow-x-auto py-3">
      {STEP_LABELS.map((label, index) => {
        const status = index < currentStep ? 'completed' : index === currentStep ? 'current' : 'upcoming'

        return (
          <button
            key={label}
            type="button"
            onClick={() => index < currentStep && goToStep(index)}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${
              status === 'current'
                ? 'bg-teal-600 text-white'
                : status === 'completed'
                ? 'bg-teal-100 text-teal-700'
                : 'bg-gray-100 text-gray-500'
            }`}
            aria-current={status === 'current' ? 'step' : undefined}
          >
            {status === 'completed' ? <CheckCircle className="h-3.5 w-3.5" /> : index + 1}
            <span className="hidden md:inline">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
