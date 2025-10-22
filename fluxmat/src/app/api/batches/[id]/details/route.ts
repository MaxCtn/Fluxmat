import { NextResponse, NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const url = new URL(req.url)
  const nature = url.searchParams.get('nature')
  const origine = url.searchParams.get('origine')
  const destination = url.searchParams.get('destination')

  const s = getSupabaseAdmin()
  let q = s.from('records')
    .select('id,date_operation,nature_dechet,origine,destination,tonnage,raw')
    .eq('batch_id', id)
    .order('date_operation', { ascending: true })

  if (nature) q = q.eq('nature_dechet', nature)
  if (origine) q = q.eq('origine', origine)
  if (destination) q = q.eq('destination', destination)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
