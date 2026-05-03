import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/Button'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<'bug' | 'suggestion' | 'question' | 'other'>('suggestion')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('user_feedback')
        .insert([{ user_id: user.id, type, message, status: 'new' }])

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setMessage('')
        onClose()
      }, 2000)
    } catch (err) {
      console.error('Error submitting feedback:', err)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1C1B1B] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#E5E2E1] flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">lightbulb</span>
              Feedback & Support
            </h2>
            <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">check</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Thank you!</h3>
              <p className="text-neutral-400 text-sm">Your feedback has been received and will be reviewed shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Type</label>
                <div className="relative">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#131313] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                  >
                    <option value="suggestion">💡 Suggestion</option>
                    <option value="bug">🐞 Report a Bug</option>
                    <option value="question">❓ Question</option>
                    <option value="other">📝 Other</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">expand_more</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we improve WeeklyOS?"
                  className="w-full bg-[#131313] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors resize-none h-32"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3"
                >
                  {isSubmitting ? (
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">send</span>
                  )}
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
