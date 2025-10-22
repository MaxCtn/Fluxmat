import { Queue } from 'bullmq'
import type { QueueOptions } from 'bullmq'
import { getRedis } from './redis'

declare global {
  // eslint-disable-next-line no-var
  var __fluxmat_queue__: Queue | undefined
}

/** Queue BullMQ singleton (connexion fournie par getRedis, lazy) */
export function getQueue(): Queue {
  if (!global.__fluxmat_queue__) {
    const opts: QueueOptions = { connection: getRedis() }
    global.__fluxmat_queue__ = new Queue('fluxmat-jobs', opts)
  }
  return global.__fluxmat_queue__!
}
