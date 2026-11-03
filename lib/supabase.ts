import { createClient } from '@supabase/supabase-js'

// Quita caracteres invisibles (BOM, espacios) que se cuelan al pegar claves:
// en una cabecera HTTP hacen fallar la petición entera.
const clean = (v: string | undefined) => v?.replace(/[﻿​\s]/g, '') || undefined

const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? 'https://placeholder.supabase.co'
const anon = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ?? 'placeholder'
const service = clean(process.env.SUPABASE_SERVICE_ROLE_KEY) ?? 'placeholder'

export const supabase = createClient(url, anon)
export const supabaseAdmin = createClient(url, service)
