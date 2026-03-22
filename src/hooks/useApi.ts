// API Hooks – Placeholder implementations using mock data
// Replace these with real Supabase calls when backend is ready.

import { mockWeek, mockBrainDumpItems, mockEvaluation, mockFocusedDay } from '../data/mockData'

// ─── Week API ─────────────────────────────────────────────────────────────────
export function useWeekApi() {
  const fetchCurrentWeek = async () => {
    // TODO: supabase.from('weeks').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1)
    return mockWeek
  }

  return { fetchCurrentWeek }
}

// ─── Task API ─────────────────────────────────────────────────────────────────
export function useTaskApi() {
  const fetchTasksByWeek = async (_weekId: string) => {
    // TODO: supabase.from('tasks').select('*').eq('week_id', weekId)
    return mockWeek.days.flatMap(d => [
      ...(d.highTask ? [d.highTask] : []),
      ...d.mediumTasks,
      ...d.smallTasks,
    ])
  }

  const createTask = async (_task: object) => {
    // TODO: supabase.from('tasks').insert(task)
    console.log('[API placeholder] createTask', _task)
  }

  const updateTask = async (_id: string, _updates: object) => {
    // TODO: supabase.from('tasks').update(updates).eq('id', id)
    console.log('[API placeholder] updateTask', _id, _updates)
  }

  const deleteTask = async (_id: string) => {
    // TODO: supabase.from('tasks').delete().eq('id', id)
    console.log('[API placeholder] deleteTask', _id)
  }

  return { fetchTasksByWeek, createTask, updateTask, deleteTask }
}

// ─── Brain Dump API ───────────────────────────────────────────────────────────
export function useBrainDumpApi() {
  const fetchBrainDumpItems = async () => {
    // TODO: supabase.from('brain_dump').select('*').eq('user_id', userId)
    return mockBrainDumpItems
  }

  const addBrainDumpItem = async (_content: string) => {
    // TODO: supabase.from('brain_dump').insert({ content, user_id: userId })
    console.log('[API placeholder] addBrainDumpItem', _content)
  }

  const deleteBrainDumpItem = async (_id: string) => {
    // TODO: supabase.from('brain_dump').delete().eq('id', id)
    console.log('[API placeholder] deleteBrainDumpItem', _id)
  }

  return { fetchBrainDumpItems, addBrainDumpItem, deleteBrainDumpItem }
}

// ─── Evaluation API ───────────────────────────────────────────────────────────
export function useEvaluationApi() {
  const fetchEvaluation = async (_weekId: string) => {
    // TODO: supabase.from('daily_logs').select('*').eq('week_id', weekId)
    return mockEvaluation
  }

  return { fetchEvaluation }
}

// ─── Focused Day API ──────────────────────────────────────────────────────────
export function useFocusedDayApi() {
  const fetchFocusedDay = async (_date: string) => {
    // TODO: supabase.from('daily_logs').select('*').eq('date', date)
    return mockFocusedDay
  }

  return { fetchFocusedDay }
}

// ─── AI API ───────────────────────────────────────────────────────────────────
export function useAiApi() {
  const sendMessage = async (_type: string, _input: string, _context: object) => {
    // TODO: Call edge function that routes to OpenAI / Gemini / Grok
    console.log('[API placeholder] AI request', { type: _type, input: _input, context: _context })
    return { response: 'AI response placeholder. Backend not connected yet.' }
  }

  return { sendMessage }
}
