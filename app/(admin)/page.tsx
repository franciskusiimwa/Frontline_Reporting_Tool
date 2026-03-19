import { Card } from '@/components/ui/Card'

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card><h2 className="text-xl font-semibold">Dashboard</h2><p className="text-sm text-gray-600">6 charts will go here.</p></Card>
      <Card><h2 className="text-xl font-semibold">Region Filter</h2><p className="text-sm text-gray-600">Region selector will go here.</p></Card>
    </div>
  )
}
