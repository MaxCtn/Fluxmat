// fluxmat-worker/src/index.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Worker, QueueEvents, type JobsOptions } from 'bullmq'
import IORedis from 'ioredis'
import * as XLSX from 'xlsx'
import crypto from 'node:crypto'

// ---------- ENV ----------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE
const REDIS_URL = process.env.REDIS_URL
const REDIS_TOKEN = process.env.REDIS_TOKEN

for (const [k, v] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
  REDIS_URL,
  REDIS_TOKEN,
})) {
  if (!v) throw new Error(`Missing env: ${k}`)
}

// ---------- CLIENTS ----------
const supa: SupabaseClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const redis = new IORedis(REDIS_URL!, {
  password: REDIS_TOKEN,
  tls: { rejectUnauthorized: false },
  lazyConnect: true,
  maxRetriesPerRequest: 3,
})

redis.on('error', (e) => {
  console.error('[redis] error', e?.message ?? e)
})
redis.on('connect', () => console.log('[redis] connected'))

// ---------- HELPERS ----------
const norm = (s: unknown) =>
  (s ?? '')
    .toString()
    .replace(/\u00A0/g, ' ') // NBSP -> espace
    .trim()
    .replace(/\s{2,}/g, ' ')

const parseDateISO = (v: unknown): string | null => {
  if (v == null || v === '') return null

  // Excel serial date
  const n = Number(v)
  if (Number.isFinite(n) && n > 59 && n < 60000 && (XLSX as any).SSF?.parse_date_code) {
    const d = (XLSX as any).SSF.parse_date_code(n)
    if (d) {
      const yyyy = String(d.y).padStart(4, '0')
      const mm = String(d.m).padStart(2, '0')
      const dd = String(d.d).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
  }

  // Text dd/mm/yyyy
  const s = norm(v)
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m1) {
    const [, d, m, y] = m1
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // Text yyyy-mm-dd
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m2) return s

  return null
}

const parseTonnage = (v: unknown): number | null => {
  if (v == null) return null
  const s = norm(v).replace(/\s+/g, '').replace(',', '.')
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0) return null
  // 3 décimales
  return Math.round(n * 1000) / 1000
}

const isPointagePerso = (v: unknown) => norm(v).toLowerCase() === 'pointage personnel'
const hasChapitrePersonnel = (v: unknown) => /personnel/i.test(norm(v))

// ---------- WORKER ----------
type JobData = { batch_id: string }
const QUEUE_NAME = 'fluxmat-jobs'
const JOB_OPTS: JobsOptions = { removeOnComplete: true, removeOnFail: true }

const worker = new Worker<JobData>(
  QUEUE_NAME,
  async (job) => {
    const { batch_id } = job.data

    // 1) Récupère le batch
    const { data: batch, error: batchErr } = await supa
      .from('batches')
      .select('id, org_id, raw_file_url')
      .eq('id', batch_id)
      .maybeSingle()

    if (batchErr || !batch) throw new Error(`Batch introuvable: ${batch_id}`)

    // Passe en processing
    await supa
      .from('batches')
      .update({ status: 'processing', started_at: new Date().toISOString(), error_message: null })
      .eq('id', batch_id)

    // 2) Télécharge le fichier depuis le bucket "raw"
    const rawUrl = batch.raw_file_url // ex: "raw/<uuid>/<hash>-file.xlsx"
    if (!rawUrl?.startsWith('raw/')) throw new Error(`raw_file_url invalide: ${rawUrl}`)
    const path = rawUrl.replace(/^raw\//, '')

    const dl = await supa.storage.from('raw').download(path)
    if (dl.error || !dl.data) throw new Error(`Download échoué: ${dl.error?.message ?? 'inconnue'}`)
    const buf = Buffer.from(await dl.data.arrayBuffer())

    // 3) Parse XLSX (1ère feuille)
    const wb = XLSX.read(buf, { type: 'buffer' })
    const sheetName = wb.SheetNames[0]
    if (!sheetName) throw new Error('Aucune feuille trouvée dans le XLSX')
    const ws = wb.Sheets[sheetName]
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { raw: false, defval: null })

    // 4) Transform + filtres + clé dédup
    let inCount = 0,
      okCount = 0,
      warnCount = 0,
      errCount = 0
    const toUpsert: any[] = []

    for (const r of rows) {
      inCount++

      // Filtres d'exclusion
      if (isPointagePerso(r['Origine'])) continue
      if (hasChapitrePersonnel(r['Chapitre'])) continue

      const date_operation = parseDateISO(r['Date'])
      const nature_dechet = norm(r['Libellé Ressource'])
      const origine = norm(r['Libellé Entité'])
      const destination = norm(r['Libellé Chantier'])
      const tonnage = parseTonnage(r['Quantité'])

      if (tonnage == null) {
        warnCount++
        continue // on saute les lignes sans tonnage valide
      }

      const tonFixed = tonnage.toFixed(3)
      const base = `${date_operation ?? ''}|${nature_dechet}|${origine}|${destination}|${tonFixed}`.toLowerCase()
      const dedup_key = crypto.createHash('md5').update(base).digest('hex')

      toUpsert.push({
        org_id: batch.org_id,
        batch_id: batch.id,
        date_operation,
        nature_dechet,
        origine,
        destination,
        tonnage,
        raw: r,
        dedup_key,
      })
      okCount++
    }

    const CHUNK = 500
    for (let i = 0; i < toUpsert.length; i += CHUNK) {
      const part = toUpsert.slice(i, i + CHUNK)
      const { error: upErr } = await supa
        .from('records')
        .upsert(part, { onConflict: 'org_id,dedup_key', ignoreDuplicates: false })
      if (upErr) {
        errCount += part.length
        throw upErr
      }
    }

    const status = warnCount > 0 ? 'completed_with_warnings' : 'completed'
    await supa
      .from('batches')
      .update({
        status,
        rows_in: inCount,
        rows_ok: okCount,
        rows_warn: warnCount,
        rows_err: errCount,
        finished_at: new Date().toISOString(),
      })
      .eq('id', batch_id)
  },
  {
    connection: redis,
    concurrency: 3,
  }
)

// Écouteur d’événements (debug)
const qevents = new QueueEvents(QUEUE_NAME, { connection: redis })
qevents.on('failed', async (evt) => {
  try {
    const reason = evt.failedReason ?? 'failed'
    console.error('[job failed]', evt.jobId, reason)
    // best-effort: si on peut extraire le batch_id depuis le job (pas accessible via QueueEvents sans fetch),
    // on laissera la MAJ au handler principal qui catch l'erreur et mettra le batch en failed.
  } catch {}
})

// Catch global → MAJ du batch en failed quand c'est nous qui catchons dans le handler
worker.on('failed', async (job, err) => {
  if (!job) return
  try {
    const batch_id = job.data?.batch_id
    if (batch_id) {
      await supa
        .from('batches')
        .update({ status: 'failed', error_message: err?.message ?? String(err), finished_at: new Date().toISOString() })
        .eq('id', batch_id)
    }
  } catch (e) {
    console.error('[failed-hook update error]', e)
  }
})

worker.on('ready', () => console.log('FluxMat worker démarré ✅'))
