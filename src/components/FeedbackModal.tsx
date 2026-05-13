import { useState } from 'react'
import { Lightbulb, X, Check, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Button } from './ui/Button'
import { Select, Textarea } from './ui/Input'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<'bug' | 'suggestion' | 'question' | 'other'>('suggestion')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="feedback-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            key="feedback-card"
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md glass-panel rounded-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <Lightbulb className="text-primary" strokeWidth={1.5} />
                  Feedback &amp; Support
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 transition-colors focus-ring"
                  aria-label="Close"
                >
                  <X className="text-[20px]" strokeWidth={1.5} />
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tertiary/15 text-tertiary flex items-center justify-center animate-bounce-in">
                    <Check className="text-3xl" style={{ fontVariationSettings: "'FILL' 1" }} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-2">Thank you!</h3>
                  <p className="text-on-surface-variant text-sm">Your feedback has been received and will be reviewed shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Type</label>
                    <div className="relative">
                      <Select
                        value={type}
                        onChange={(e) => setType(e.target.value as typeof type)}
                      >
                        <option value="suggestion">💡 Suggestion</option>
                        <option value="bug">🐞 Report a Bug</option>
                        <option value="question">❓ Question</option>
                        <option value="other">📝 Other</option>
                      </Select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" strokeWidth={1.5} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Message</label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we improve WeeklyOS?"
                      className="resize-none h-32"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !message.trim()}
                      loading={isSubmitting}
                      size="lg"
                      className="w-full"
                      leftIcon={!isSubmitting ? <Send className="w-4 h-4" strokeWidth={1.5} /> : undefined}
                    >
                      {isSubmitting ? 'Sending…' : 'Send Feedback'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
