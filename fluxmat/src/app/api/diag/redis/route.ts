// src/app/api/diag/redis/route.ts
import { ensureRedis } from '@/lib/redis'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const r = await ensureRedis()
    const pong = await r.ping()
    return Response.json({ ok: true, pong })
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
