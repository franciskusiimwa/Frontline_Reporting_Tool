'use client'

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
  const { currentStep } = useSubmission()

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Submit Weekly Report</h1>
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
