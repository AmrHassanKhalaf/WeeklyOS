import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const SUPABASE_URL = "https://vdbscudaljbxqcndwovp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkYnNjdWRhbGpieHFjbmR3b3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDg4MzYsImV4cCI6MjA4OTY4NDgzNn0.Jl-sMw15ummA6_FKUohvg0a8cTX3hIut0fh3hrD4VCI";

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
