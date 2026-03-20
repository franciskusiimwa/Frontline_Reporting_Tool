'use client'

import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

type UserRole = 'field_staff' | 'admin'

type Profile = {
  id: string
  full_name: string
  region: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }

const API_USERS = '/api/users'

const roleOptions: UserRole[] = ['field_staff', 'admin']

const createUserSchema = z.object({
  full_name: z.string().min(3, 'Must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
  region: z.string().optional(),
  role: z.enum(['field_staff', 'admin']),
})

const updateUserSchema = z.object({
  full_name: z.string().min(3, 'Must be at least 3 characters'),
  region: z.string().optional(),
  role: z.enum(['field_staff', 'admin']),
})

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 8
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState('')

  const [createData, setCreateData] = useState({ full_name: '', email: '', password: '', region: '', role: 'field_staff' as UserRole })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ full_name: string; region: string; role: UserRole }>({ full_name: '', region: '', role: 'field_staff' })

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(API_USERS)
      const payload = (await r.json()) as ApiResponse<Profile[]>
      if (payload.error) {
        setError(payload.error)
      } else if (payload.data) {
        setUsers(payload.data)
      }
    } catch {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const q = filter.toLowerCase().trim()
    return users
      .filter((u) =>
        u.full_name.toLowerCase().includes(q) ||
        (u.region ?? '').toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      )
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [users, filter])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const currentPageUsers = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, page])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setActionMessage(null)

    const parsed = createUserSchema.safeParse(createData)
    if (!parsed.success) {
      setActionMessage(parsed.error.issues.map((issue) => issue.message).join('; '))
      return
    }

    try {
      const r = await fetch(API_USERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      })
      const payload = (await r.json()) as ApiResponse<{ user_id: string }>
      if (payload.error) {
        setActionMessage(`Create failed: ${payload.error}`)
      } else {
        setActionMessage('User created successfully.')
        setCreateData({ full_name: '', email: '', password: '', region: '', role: 'field_staff' })
        setPage(1)
        await loadUsers()
      }
    } catch {
      setActionMessage('Create failed: network error')
    }
  }

  const startEdit = (u: Profile) => {
    setEditingId(u.id)
    setEditData({ full_name: u.full_name, region: u.region ?? '', role: u.role })
    setActionMessage(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setActionMessage(null)
  }

  const submitEdit = async (id: string) => {
    setActionMessage(null)

    const parsed = updateUserSchema.safeParse(editData)
    if (!parsed.success) {
      setActionMessage(parsed.error.issues.map((issue) => issue.message).join('; '))
      return
    }

    try {
      const r = await fetch(`${API_USERS}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      const payload = (await r.json()) as ApiResponse<{ user_id: string }>
      if (payload.error) {
        setActionMessage(`Update failed: ${payload.error}`)
      } else {
        setActionMessage('User updated successfully.')
        setEditingId(null)
        await loadUsers()
      }
    } catch {
      setActionMessage('Update failed: network error')
    }
  }

  const confirmDelete = (id: string) => setConfirmDeleteId(id)
  const doDelete = async () => {
    const id = confirmDeleteId
    if (!id) return

    setActionMessage(null)
    setConfirmDeleteId(null)
    try {
      const r = await fetch(`${API_USERS}/${encodeURIComponent(id)}`, { method: 'DELETE' })
      const payload = (await r.json()) as ApiResponse<{ user_id: string }>
      if (payload.error) {
        setActionMessage(`Delete failed: ${payload.error}`)
      } else {
        setActionMessage('User deleted successfully.')
        await loadUsers()
      }
    } catch {
      setActionMessage('Delete failed: network error')
    }
  }

  const confirmReset = (id: string) => {
    setConfirmResetId(id)
    setResetPassword('')
    setActionMessage(null)
  }

  const doResetPassword = async () => {
    const id = confirmResetId
    if (!id) return
    if (!resetPassword) {
      setActionMessage('New password is required for reset.')
      return
    }

    setActionMessage(null)
    setConfirmResetId(null)
    try {
      const r = await fetch(`${API_USERS}/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: resetPassword }),
      })
      const payload = (await r.json()) as ApiResponse<{ user_id: string }>
      if (payload.error) {
        setActionMessage(`Password reset failed: ${payload.error}`)
      } else {
        setActionMessage('Password reset successfully.')
        setResetPassword('')
      }
    } catch {
      setActionMessage('Password reset failed: network error')
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">User Manager</h1>
      <p className="text-sm text-gray-600 mb-4">
        Manage field staff/admin user accounts. Create new accounts, edit details, reset password and delete.
      </p>

      <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Create User</h2>
        <form onSubmit={handleCreate} className="grid gap-2 md:grid-cols-5 mt-2">
          <input value={createData.full_name} onChange={(e) => setCreateData((prev) => ({ ...prev, full_name: e.target.value }))} placeholder="Full Name" className="input" />
          <input value={createData.email} onChange={(e) => setCreateData((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" type="email" className="input" />
          <input value={createData.password} onChange={(e) => setCreateData((prev) => ({ ...prev, password: e.target.value }))} placeholder="Password" type="password" className="input" />
          <input value={createData.region} onChange={(e) => setCreateData((prev) => ({ ...prev, region: e.target.value }))} placeholder="Region" className="input" />
          <select value={createData.role} onChange={(e) => setCreateData((prev) => ({ ...prev, role: e.target.value as UserRole }))} className="input">
            {roleOptions.map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
          <button type="submit" className="mt-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 md:col-span-5">Create User</button>
        </form>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1) }} placeholder="Search by name, region, role" className="input w-full md:w-1/3" />
        <span className="text-xs text-gray-500">{filteredUsers.length} users</span>
      </div>

      {actionMessage && <p className="mb-4 text-sm text-indigo-700">{actionMessage}</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Region</th>
                  <th className="border p-2">Role</th>
                  <th className="border p-2">Created</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPageUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="border p-2">
                      {editingId === u.id ? (
                        <input value={editData.full_name} onChange={(e) => setEditData((p) => ({ ...p, full_name: e.target.value }))} className="input" />
                      ) : (
                        u.full_name
                      )}
                    </td>
                    <td className="border p-2">
                      {editingId === u.id ? (
                        <input value={editData.region} onChange={(e) => setEditData((p) => ({ ...p, region: e.target.value }))} className="input" />
                      ) : (
                        u.region || '—'
                      )}
                    </td>
                    <td className="border p-2">
                      {editingId === u.id ? (
                        <select value={editData.role} onChange={(e) => setEditData((p) => ({ ...p, role: e.target.value as UserRole }))} className="input">
                          {roleOptions.map((r) => (<option key={r} value={r}>{r}</option>))}
                        </select>
                      ) : (
                        u.role
                      )}
                    </td>
                    <td className="border p-2">{new Date(u.created_at).toLocaleString()}</td>
                    <td className="border p-2 space-x-2">
                      {editingId === u.id ? (
                        <>
                          <button onClick={() => submitEdit(u.id)} className="rounded bg-green-600 px-2 py-1 text-white">Save</button>
                          <button onClick={cancelEdit} className="rounded border px-2 py-1">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(u)} className="rounded border px-2 py-1">Edit</button>
                          <button onClick={() => confirmDelete(u.id)} className="rounded border bg-red-500 px-2 py-1 text-white">Delete</button>
                          <button onClick={() => confirmReset(u.id)} className="rounded border px-2 py-1">Reset PW</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="space-x-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border px-2 py-1 disabled:opacity-50">Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded border px-2 py-1 disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">Confirm Delete</h3>
            <p className="mb-4">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="rounded border px-3 py-1">Cancel</button>
              <button onClick={doDelete} className="rounded bg-red-600 px-3 py-1 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

      {confirmResetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">Reset Password</h3>
            <p className="mb-2">New password for user ID: {confirmResetId}</p>
            <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="New password" className="input mb-4 w-full" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmResetId(null)} className="rounded border px-3 py-1">Cancel</button>
              <button onClick={doResetPassword} className="rounded bg-orange-600 px-3 py-1 text-white">Reset</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
