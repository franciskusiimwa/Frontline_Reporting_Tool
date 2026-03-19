import { type TrafficLight } from '@/lib/types'

interface StatusPillProps {
  status: TrafficLight | 'draft' | 'submitted' | 'revision_requested' | 'approved'
}

const statusStyles: Record<StatusPillProps['status'], string> = {
  on_track: 'bg-green-100 text-green-800',
  at_risk: 'bg-amber-100 text-amber-800',
  off_track: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-800',
  revision_requested: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
}

export function StatusPill({ status }: StatusPillProps) {
  const label = {
    on_track: '🟢 On Track',
    at_risk: '🟡 At Risk',
    off_track: '🔴 Off Track',
    draft: 'Draft',
    submitted: 'Submitted',
    revision_requested: 'Revision Requested',
    approved: 'Approved',
  }[status]

  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}>{label}</span>
}
