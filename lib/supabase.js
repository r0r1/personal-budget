// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Your Supabase URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Your Supabase Anon Key

const isSupabaseStorage = process.env.STORAGE_TYPE === "supabase"
console.log('isSupabaseStorage', isSupabaseStorage)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
console.log('supabase', supabase)