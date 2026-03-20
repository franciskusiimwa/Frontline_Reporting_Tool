'use client'

import Link from 'next/link'
import { SubmissionProvider, useSubmission } from '@/components/form/SubmissionProvider'
import { StepperNav } from '@/components/form/StepperNav'
import { StepperFooter } from '@/components/form/StepperFooter'
import { Step1BasicInfo } from '@/components/form/steps/Step1BasicInfo'
import { Step2Snapshot } from '@/components/form/steps/Step2Snapshot'
import { Step3Metrics } from '@/components/form/steps/Step3Metrics'
import { Step4Priorities } from '@/components/form/steps/Step4Priorities'
import { Step5FieldInsights } from '@/components/form/steps/Step5FieldInsights'
import { Step6Risks } from '@/components/form/steps/Step6Risks'
import { Step7Decisions } from '@/components/form/steps/Step7Decisions'
import { Step8NextWeek } from '@/components/form/steps/Step8NextWeek'
import { Step9Reflection } from '@/components/form/steps/Step9Reflection'
import { ReviewStep } from '@/components/form/ReviewStep'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const stepComponents = [
  <Step1BasicInfo key="step1" />,
  <Step2Snapshot key="step2" />,
  <Step3Metrics key="step3" />,
  <Step4Priorities key="step4" />,
  <Step5FieldInsights key="step5" />,
  <Step6Risks key="step6" />,
  <Step7Decisions key="step7" />,
  <Step8NextWeek key="step8" />,
  <Step9Reflection key="step9" />,
  <ReviewStep key="review" />,
]

function SubmitWizard() {
  const { currentStep, totalSteps, stepCompletion, status, stepError, submitError, submitSuccessMessage } = useSubmission()
  const completionCount = stepCompletion.filter(Boolean).length
  const completionPct = Math.round((completionCount / stepCompletion.length) * 100)

  if (status === 'submitted') {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Submit Weekly Report</h1>
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-teal-700">Submission received</h2>
            <p className="mt-1 text-sm text-gray-600">
              {submitSuccessMessage ?? 'Your weekly report has been submitted successfully.'}
            </p>
          </div>
          <div className="rounded-md bg-teal-50 p-4 text-sm text-teal-900">
            The admin team can now review this report. If revisions are requested later, the report will appear in your history.
          </div>
          <div className="flex gap-3">
            <Link href="/history">
              <Button type="button">View History</Button>
            </Link>
            <Link href="/submit">
              <Button type="button" variant="secondary">Back to Form</Button>
            </Link>
          </div>
        </Card>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="sticky top-2 z-10 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
          <span>Progress</span>
          <span>{completionPct}% complete</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${completionPct}%` }} />
        </div>
      </div>

      <h1 className="text-2xl font-semibold">Submit Weekly Report</h1>
      <div className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
        <div className="font-medium">Estimated time: 5-10 minutes</div>
        <div className="mt-1 text-teal-800">Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}. Complete only the required essentials first, then add detail where useful.</div>
      </div>
      {stepError && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {stepError}
        </div>
      )}
      {submitError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}
      <StepperNav />
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        {stepComponents[currentStep]}
      </div>
      <StepperFooter />
    </section>
  )
}

export default function FieldSubmitPage() {
  return (
    <SubmissionProvider>
      <SubmitWizard />
    </SubmissionProvider>
  )
}
