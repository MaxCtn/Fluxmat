// src/lib/supabase.client.ts
'use client'

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Client public — OK côté client uniquement */
export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
})

export default supabase
