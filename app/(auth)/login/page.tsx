'use client'

import { useEffect, useState } from 'react'
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
  const [postLoginTarget, setPostLoginTarget] = useState<string | null>(null)
  const [postLoginLabel, setPostLoginLabel] = useState<string | null>(null)
  const [profileError, setProfileError] = useState(false)
  const [showResendConfirm, setShowResendConfirm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setProfileError(params.get('error') === 'profile_missing')
  }, [])

  async function resolvePostLoginTarget() {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (!user) {
      return {
        target: '/submit',
        label: 'Open Submission Form',
        message: 'Login successful. Continue to the submission form.',
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role === 'admin') {
      return {
        target: '/admin',
        label: 'Open Dashboard',
        message: 'Admin login successful. Open the dashboard to review trends, submissions, and users.',
      }
    }

    return {
      target: '/submit',
      label: 'Open Submission Form',
      message: 'Login successful. Continue to the submission form.',
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)
    setPostLoginTarget(null)
    setPostLoginLabel(null)

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

        const destination = await resolvePostLoginTarget()
        setSuccessMessage(destination.message)
        setPostLoginTarget(destination.target)
        setPostLoginLabel(destination.label)
        setIsRegistering(false)
        setIsLoading(false)
        router.refresh()
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
      if (loginError.message.toLowerCase().includes('email not confirmed')) {
        setShowResendConfirm(true)
        setError('Login failed: Email not confirmed. Check your inbox, or resend the confirmation email below.')
        setIsLoading(false)
        return
      }

      setShowResendConfirm(false)
      setError(`Login failed: ${loginError.message}`)
      setIsLoading(false)
      return
    }

    const destination = await resolvePostLoginTarget()
    setSuccessMessage(destination.message)
    setPostLoginTarget(destination.target)
    setPostLoginLabel(destination.label)
    setIsLoading(false)
    router.refresh()
  }

  async function handleResendConfirmation() {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError('Enter your email first, then click resend confirmation.')
      return
    }

    const supabase = createClient()
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
    })

    if (resendError) {
      setError(`Could not resend confirmation email: ${resendError.message}`)
      return
    }

    setSuccessMessage('Confirmation email sent. Verify your email, then sign in again.')
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

          {profileError && (
            <p className="text-sm text-red-600">
              Your account is missing a role. Ask an admin to set your role in profiles (admin or field_staff), then sign in again.
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {showResendConfirm && (
            <button
              type="button"
              className="text-xs underline text-slate-700"
              onClick={handleResendConfirmation}
            >
              Resend confirmation email
            </button>
          )}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
          {postLoginTarget && postLoginLabel && (
            <div className="rounded-md border border-teal-200 bg-teal-50 p-3">
              <Button type="button" onClick={() => router.push(postLoginTarget)}>
                {postLoginLabel}
              </Button>
            </div>
          )}

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
