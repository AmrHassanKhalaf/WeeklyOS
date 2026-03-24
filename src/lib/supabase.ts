import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

export const getUser = () => supabase.auth.getUser();

// ─── Real-time helpers ────────────────────────────────────────────────────────

/**
 * Subscribe to live task changes for the authenticated user.
 * The RLS policy ensures only the user's own tasks are streamed.
 */
export const subscribeToTasks = (
  weekId: string,
  callback: (payload: unknown) => void
) =>
  supabase
    .channel("tasks-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `week_id=eq.${weekId}`,
      },
      callback
    )
    .subscribe();

/**
 * Subscribe to live week changes for the authenticated user.
 */
export const subscribeToWeeks = (callback: (payload: unknown) => void) =>
  supabase
    .channel("weeks-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "weeks" },
      callback
    )
    .subscribe();
