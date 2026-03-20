import { ReactNode } from 'react'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-slate-50 to-white">
      <header className="bg-gradient-to-r from-cyan-700 via-sky-700 to-emerald-700 text-white px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="font-semibold">Admin & Leadership Portal</div>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="rounded-md bg-white/20 px-3 py-1.5 hover:bg-white/30">Open Dashboard</Link>
            <Link href="/submissions" className="rounded-md bg-white/20 px-3 py-1.5 hover:bg-white/30">Submissions</Link>
            <Link href="/users" className="rounded-md bg-white/20 px-3 py-1.5 hover:bg-white/30">Users</Link>
          </nav>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
