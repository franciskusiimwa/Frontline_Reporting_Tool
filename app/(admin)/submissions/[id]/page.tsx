import { notFound } from 'next/navigation'

interface PageProps {
  params: { id: string }
}

export default function AdminSubmissionDetailPage({ params }: PageProps) {
  if (!params.id) return notFound()

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Submission Details</h1>
      <p className="text-sm text-gray-600">Detail page for ID: {params.id}</p>
    </div>
  )
}
