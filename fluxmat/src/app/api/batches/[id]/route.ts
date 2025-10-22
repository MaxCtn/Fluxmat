import { NextResponse, NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const s = getSupabaseAdmin()
  const { data, error } = await s.from('batches').select('*').eq('id', id).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'batch introuvable' }, { status: 404 })
  return NextResponse.json(data)
}
