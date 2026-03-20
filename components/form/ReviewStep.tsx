'use client'

import { useFormContext } from 'react-hook-form'
import { useSubmission } from '@/components/form/SubmissionProvider'
import { Button } from '@/components/ui/Button'

function SummaryBlock({
  title,
  stepIndex,
  children,
}: {
  title: string
  stepIndex: number
  children: React.ReactNode
}) {
  const { goToStep } = useSubmission()

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <Button type="button" variant="secondary" className="px-3 py-1 text-sm" onClick={() => goToStep(stepIndex)}>
          Edit
        </Button>
      </div>
      <div className="space-y-2 text-sm text-gray-600">{children}</div>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="font-medium text-gray-800">{label}: </span>
      <span>{value || 'Not provided'}</span>
    </div>
  )
}

export function ReviewStep() {
  const { getValues } = useFormContext()
  const values = getValues()

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-gray-800">Review Submission</h2>
      <p className="text-sm text-gray-600">
        This is the final checkpoint before sending your report to the admin team.
      </p>
      <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
        Confirm that the region, week, status summary, metrics, risks, and next-week priorities all reflect what actually happened on the ground.
      </div>
      <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600">
        <li>Use Back if you need to correct any section.</li>
        <li>Click Submit only when the report is ready for admin review.</li>
        <li>After submission, you should see a confirmation message on screen.</li>
      </ul>

      <div className="space-y-4">
        <SummaryBlock title="1. Basic Info" stepIndex={0}>
          <SummaryItem label="Region" value={values.region} />
          <SummaryItem label="PO Name" value={values.po_names} />
          <SummaryItem label="Week" value={values.week_label} />
          <SummaryItem label="Submission date" value={values.submission_date} />
        </SummaryBlock>

        <SummaryBlock title="2. Week Snapshot" stepIndex={1}>
          <SummaryItem label="Overall status" value={values.overall_status?.replace('_', ' ')} />
          <SummaryItem label="Top win" value={values.top_win} />
          <SummaryItem label="Top challenge" value={values.top_challenge} />
          <SummaryItem label="Confidence next week" value={values.confidence_next_week} />
        </SummaryBlock>

        <SummaryBlock title="3. Metrics" stepIndex={2}>
          <SummaryItem label="Scholar retention insight" value={values.scholar_retention?.insight} />
          <SummaryItem label="Mentor retention insight" value={values.mentor_retention?.insight} />
          <SummaryItem label="Passbook insight" value={values.passbook_conversations?.insight} />
          <SummaryItem label="Class size insight" value={values.class_size_averages?.insight} />
        </SummaryBlock>

        <SummaryBlock title="4. Priorities" stepIndex={3}>
          {(values.priorities ?? []).map((priority: any, index: number) => (
            <div key={index} className="rounded bg-slate-50 p-3">
              <SummaryItem label={`Priority ${index + 1} planned`} value={priority?.planned} />
              <SummaryItem label="Actual" value={priority?.actual} />
              <SummaryItem label="Status" value={priority?.status?.replace('_', ' ')} />
              <SummaryItem label="Insight" value={priority?.insight} />
            </div>
          ))}
        </SummaryBlock>

        <SummaryBlock title="5. Field Insights" stepIndex={4}>
          <SummaryItem label="Mentor insights" value={values.mentor_insights} />
          <SummaryItem label="Scholar insights" value={values.scholar_insights} />
          <SummaryItem label="FOA insights" value={values.foa_insights} />
        </SummaryBlock>

        <SummaryBlock title="6. Risks" stepIndex={5}>
          {(values.risks ?? []).length > 0 ? (
            (values.risks ?? []).map((risk: any, index: number) => (
              <div key={index} className="rounded bg-slate-50 p-3">
                <SummaryItem label={`Risk ${index + 1}`} value={risk?.description} />
                <SummaryItem label="Severity" value={risk?.severity} />
                <SummaryItem label="Root cause" value={risk?.root_cause} />
                <SummaryItem label="Mitigation" value={risk?.mitigation} />
              </div>
            ))
          ) : (
            <SummaryItem label="Risks" value="No risks added" />
          )}
        </SummaryBlock>

        <SummaryBlock title="7. Decisions & Support" stepIndex={6}>
          <SummaryItem label="Decision required" value={values.decision_required} />
          <SummaryItem label="Clarification needed" value={values.clarification_needed} />
          <SummaryItem label="Additional support" value={values.additional_support} />
        </SummaryBlock>

        <SummaryBlock title="8. Next Week" stepIndex={7}>
          <SummaryItem label="Priority 1" value={values.next_week_priorities?.[0]} />
          <SummaryItem label="Priority 2" value={values.next_week_priorities?.[1]} />
          <SummaryItem label="Priority 3" value={values.next_week_priorities?.[2]} />
          <SummaryItem label="Rationale" value={values.next_week_rationale} />
        </SummaryBlock>

        <SummaryBlock title="9. Reflection" stepIndex={8}>
          <SummaryItem label="What worked" value={values.what_worked} />
          <SummaryItem label="What did not work" value={values.what_didnt} />
        </SummaryBlock>
      </div>
    </section>
  )
}
