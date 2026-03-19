import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-purple-600 text-white px-4 py-3 font-semibold">Admin & Leadership Portal</header>
      <main className="p-6">{children}</main>
    </div>
  )
}
