import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rqeoxruodotrgpmipivj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZW94cnVvZG90cmdwbWlwaXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MzUzMDMsImV4cCI6MjA4MjAxMTMwM30.pVbxqqqIt02axf4kmOZVY8yoLxqZqZ9oTTwTUKFfcX0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "only_driver_auth_token",
  },
});
