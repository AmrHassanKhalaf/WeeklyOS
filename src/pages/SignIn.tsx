import { useState, type FormEvent } from 'react'
import { signIn, signInWithGoogle, signUp } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

type Mode = 'signin' | 'signup'

export function SignIn() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsLoading(true)

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        const { error } = await signUp(email, password)
        if (error) throw error
        setMessage('Account created! Check your email for a confirmation link.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setMessage(null)
    setIsOAuthLoading(true)

    try {
      const redirectTo = new URL('/dashboard', window.location.origin).toString()
      const { error } = await signInWithGoogle(redirectTo)
      if (error) throw error
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsOAuthLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-on-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Layered ambient orbs — violet, pink, cyan */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full animate-float-soft"
        style={{
          background: 'radial-gradient(circle, rgb(124 58 237 / 0.32), transparent 65%)',
          filter: 'blur(8px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full animate-float-soft"
        style={{
          background: 'radial-gradient(circle, rgb(34 211 238 / 0.26), transparent 65%)',
          filter: 'blur(8px)',
          animationDelay: '1.4s',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-0 w-[24rem] h-[24rem] rounded-full animate-float-soft"
        style={{
          background: 'radial-gradient(circle, rgb(244 114 182 / 0.18), transparent 60%)',
          filter: 'blur(8px)',
          animationDelay: '2.6s',
        }}
      />

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 animate-fade-up relative z-10">
        <div className="w-11 h-11 rounded-2xl obsidian-gradient flex items-center justify-center shadow-[0_12px_36px_-8px_rgb(124_58_237_/_0.6)] animate-float-soft">
          <span className="material-symbols-outlined text-white text-xl">auto_awesome</span>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight gradient-text">WeeklyOS</h1>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.22em] mt-0.5">
            Productivity Engine
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 sm:p-10 animate-scale-in relative z-10">
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-on-surface mb-1.5">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {mode === 'signin'
              ? 'Sign in to access your productivity system.'
              : 'Start planning your best weeks.'}
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isOAuthLoading}
            aria-busy={isOAuthLoading}
            className="ripple-surface focus-ring w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-on-surface bg-surface-container-low/70 border border-outline-variant/40 hover:bg-surface-container/80 hover:border-primary/35 transition-all disabled:opacity-60 lift-on-hover"
          >
            <span className="inline-flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.1 0 5.9 1.1 8.1 3.2l6-6C34.4 3 29.6 1 24 1 14.9 1 7.2 6.3 3.5 13.9l7.2 5.6C12.5 13.3 17.8 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.5c0-1.7-.2-3.3-.6-4.8H24v9.1h12.3c-.5 2.8-2.1 5.2-4.5 6.8l6.9 5.4c4-3.7 6.4-9.1 6.4-16.5z" />
                <path fill="#FBBC05" d="M10.7 28.1c-1-2.8-1-5.8 0-8.6l-7.2-5.6C.7 18.5 0 21.2 0 24s.7 5.5 3.5 10.1l7.2-6z" />
                <path fill="#34A853" d="M24 47c5.6 0 10.4-1.8 13.9-4.9l-6.9-5.4c-1.9 1.3-4.3 2-7 2-6.2 0-11.5-3.8-13.3-9.2l-7.2 6C7.2 41.7 14.9 47 24 47z" />
              </svg>
              <span className="text-sm font-semibold">Continue with Google</span>
            </span>
            {isOAuthLoading && (
              <span className="material-symbols-outlined animate-spin text-lg text-primary">progress_activity</span>
            )}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-outline-variant/30" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-on-surface-variant font-bold">or</span>
            <div className="h-px flex-1 bg-outline-variant/30" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-1">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="focus-ring"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Password</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="focus-ring"
            />
          </div>

          {/* Error / Message */}
          {error && (
            <div className="p-3 bg-error/10 border border-error/25 rounded-xl text-error text-sm animate-shake flex items-start gap-2">
              <span className="material-symbols-outlined text-lg shrink-0">error</span>
              <span className="flex-1">{error}</span>
            </div>
          )}
          {message && (
            <div className="p-3 bg-tertiary/10 border border-tertiary/25 rounded-xl text-tertiary text-sm animate-fade-up flex items-start gap-2">
              <span className="material-symbols-outlined text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="flex-1">{message}</span>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            loading={isLoading}
            disabled={isOAuthLoading}
            size="lg"
            className="w-full mt-2 text-sm font-bold"
          >
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Toggle mode */}
        <div className="mt-7 text-center">
          <p className="text-sm text-on-surface-variant">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null) }}
              className="text-primary font-semibold hover:text-on-surface transition-colors underline-grow"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      <p className="mt-8 text-[11px] uppercase tracking-[0.22em] text-on-surface-variant/70 relative z-10">
        Plan your week. Focus better.
      </p>
    </div>
  )
}
