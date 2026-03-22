import { useState, type FormEvent } from 'react'
import { signIn, signUp } from '../lib/supabase'

type Mode = 'signin' | 'signup'

export function SignIn() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center p-6 font-['Inter']">
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
          <button
            type="submit"
            disabled={isLoading}
            className="w-full obsidian-gradient py-3.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-[#2F5CFF]/20 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>
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
