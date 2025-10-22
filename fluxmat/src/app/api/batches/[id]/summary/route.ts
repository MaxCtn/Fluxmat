import { NextResponse, NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const s = getSupabaseAdmin()
  const { data, error } = await s.rpc('fluxmat_summary_by_batch', { p_batch_id: id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
