import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function SubmitSuccessPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Report Submitted Successfully</h1>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-teal-700">Submission received</h2>
          <p className="mt-1 text-sm text-gray-600">
            Your weekly report has been submitted successfully and is now visible to the admin team for review.
          </p>
        </div>

        <div className="rounded-md bg-teal-50 p-4 text-sm text-teal-900">
          You can view this report from your history immediately.
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/history">
            <Button type="button">View Submission History</Button>
          </Link>
          <Link href="/submit">
            <Button type="button" variant="secondary">Submit Another Report</Button>
          </Link>
        </div>
      </Card>
    </section>
  )
}
