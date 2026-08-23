import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gliqcruavudrjehgbfei.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsaXFjcnVhdnVkcmplaGdiZmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzY2OTUsImV4cCI6MjEwMjk1MjY5NX0.gFiFLN9iVeqCUTjLfHU0t4CBT0bZlrqZKfIZGUAXYko'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
