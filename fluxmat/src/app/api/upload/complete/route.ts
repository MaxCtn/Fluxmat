// src/app/api/upload/complete/route.ts
import { NextRequest } from 'next/server'
import { ensureRedis } from '@/lib/redis'
import { getQueue } from '@/lib/queue.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { batch_id } = (await req.json()) as { batch_id?: string }
  if (!batch_id) return Response.json({ ok:false, error:'batch_id manquant' }, { status:400 })
  await ensureRedis()
  const q = getQueue()
  await q.add('parse', { batch_id }, { removeOnComplete: true, removeOnFail: true })
  return Response.json({ ok:true })
}
