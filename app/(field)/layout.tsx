import { ReactNode } from 'react'

export default function FieldLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 p-4 text-xl font-bold text-gray-900">Field Staff Portal</header>
      <main className="p-6">{children}</main>
    </div>
  )
}
