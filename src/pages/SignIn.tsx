import { useState, type FormEvent } from 'react'
import { signIn, signInWithGoogle, signUp } from '../lib/supabase'
import { Button } from '../components/ui/Button'

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
    <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 rounded-lg obsidian-gradient flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-xl">dashboard</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E5E2E1]">WeeklyOS</h1>
          <p className="text-[10px] text-[#A1A1A1] uppercase tracking-[0.2em]">Productivity Engine</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#1C1B1B] rounded-2xl border border-white/5 p-10 shadow-2xl shadow-black/50">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#E5E2E1] mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm text-[#A1A1A1]">
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
            className="w-full flex items-center justify-between gap-3 bg-[#201F1F] border border-white/10 rounded-lg px-4 py-3 text-[#E5E2E1] hover:border-white/20 hover:bg-[#242323] transition-colors disabled:opacity-60"
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
              <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            )}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#7A7A7A]">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#A1A1A1]">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-[#201F1F] border border-white/5 rounded-lg px-4 py-3 text-sm text-[#E5E2E1] placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#2F5CFF]/50 transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#A1A1A1]">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-[#201F1F] border border-white/5 rounded-lg px-4 py-3 text-sm text-[#E5E2E1] placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#2F5CFF]/50 transition-all"
            />
          </div>

          {/* Error / Message */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 bg-[#4edea3]/10 border border-[#4edea3]/20 rounded-lg text-[#4edea3] text-sm">
              {message}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading || isOAuthLoading}
            size="lg"
            className="w-full mt-2 text-sm font-bold disabled:opacity-50"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>

        {/* Toggle mode */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#A1A1A1]">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null) }}
              className="text-[#B8C3FF] font-semibold hover:text-white transition-colors"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
