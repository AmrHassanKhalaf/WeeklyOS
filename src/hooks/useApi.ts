// ─── AI API (the only hook still used in the app) ────────────────────────────
// All other API hooks have been replaced by useWeekStore (Supabase-connected).
// This file now only exports useAiApi which the AIAssistant panel uses.

export function useAiApi() {
  const sendMessage = async (_type: string, input: string, _context: object) => {
    // TODO: Call Supabase edge function that routes to OpenAI / Gemini / Grok
    console.log('[AI placeholder]', { type: _type, input })
    // Simulate a short thinking delay for UX
    await new Promise(r => setTimeout(r, 600))
    const replies: Record<string, string> = {
      'Optimize my schedule': 'Based on your task load, I recommend moving your high-impact work to Tuesday morning and batching all meetings on Wednesday afternoon.',
      'Analyze my productivity': 'Your completion rate this week is strong. You tend to peak 9–11 AM. Consider protecting those hours from interruptions.',
      'Plan my week': 'Start by reviewing last week\'s incomplete tasks, then fill your High Impact slots first before adding medium and small tasks.',
    }
    return {
      response: replies[input] ?? `I received your message: "${input}". AI engine not connected yet — connect an Edge Function to process real requests.`,
    }
  }

  return { sendMessage }
}
