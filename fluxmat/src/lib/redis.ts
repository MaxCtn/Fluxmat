import IORedis, { Redis } from 'ioredis'

declare global {
  var __fluxmat_redis__: Redis | undefined
}

export function getRedis(): Redis {
  if (!global.__fluxmat_redis__) {
    const url = process.env.REDIS_URL
    const token = process.env.REDIS_TOKEN
    if (!url || !token) {
      throw new Error('REDIS_URL/REDIS_TOKEN manquants')
    }
    global.__fluxmat_redis__ = new IORedis(url, {
      password: token,
      tls: { rejectUnauthorized: false },
      // clé: ne se connecte pas automatiquement à l'import
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      enableOfflineQueue: true,
    })
  }
  return global.__fluxmat_redis__!
}

export async function ensureRedis(): Promise<Redis> {
  const r = getRedis() as Redis & { status?: string }
  // ioredis status: 'wait' avant connect(), 'ready' après
  if (r.status !== 'ready') {
    await r.connect().catch((e) => {
      // on laisse remonter, mais message clair
      throw new Error(`Connexion Redis échouée: ${e instanceof Error ? e.message : String(e)}`)
    })
  }
  return r
}
