'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [region, setRegion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (isRegistering) {
      const supabase = createClient()
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName, region },
        },
      })

      if (signUpError) {
        setError(`Registration failed: ${signUpError.message}`)
        setIsLoading(false)
        return
      }

      if (signUpData.user) {
        // Attempt to sign in immediately (may require email confirmation depending on your Supabase settings)
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
        if (loginError) {
          setError(`Registration succeeded; login failed: ${loginError.message}`)
          setSuccessMessage('If your account requires email confirmation, please verify your email first and then sign in.')
          setIsRegistering(false)
          setIsLoading(false)
          return
        }

        setSuccessMessage('Registration and login successful! Redirecting...')
        setIsRegistering(false)
        setIsLoading(false)
        router.refresh()
        router.push('/submit')
        return
      }

      setSuccessMessage('Registration request successful. Please check your email for verification link and sign in.')
      setIsRegistering(false)
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(`Login failed: ${loginError.message}`)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    router.refresh()
    router.push('/submit')
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl p-8 shadow">
        <h1 className="text-2xl font-semibold mb-4">EXP Weekly Regional Update</h1>
        <p className="text-sm text-gray-600 mb-6">Sign in to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />

          <label className="block text-sm font-medium text-gray-700">Password</label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />

          {isRegistering && (
            <>
              <label className="block text-sm font-medium text-gray-700">Full name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />

              <label className="block text-sm font-medium text-gray-700">Region</label>
              <Input value={region} onChange={(e) => setRegion(e.target.value)} />
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

          <Button type="submit" disabled={isLoading}>{isLoading ? (isRegistering ? 'Registering...' : 'Signing in...') : (isRegistering ? 'Register' : 'Sign in')}</Button>

          <p className="text-xs text-slate-500 pt-2">
            {isRegistering ? (
              <>Already have an account? <button type="button" className="underline" onClick={() => { setIsRegistering(false); setError(null); setSuccessMessage(null) }}>Sign in</button></>
            ) : (
              <>Don&apos;t have an account? <button type="button" className="underline" onClick={() => { setIsRegistering(true); setError(null); setSuccessMessage(null) }}>Register</button></>
            )}
          </p>
        </form>
      </div>
    </main>
  )
}
