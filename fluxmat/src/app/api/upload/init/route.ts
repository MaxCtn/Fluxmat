// src/app/api/upload/init/route.ts
import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { getSupabaseAdmin } from '@/lib/supabase.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function ensureOrgId(name: string) {
  const s = getSupabaseAdmin()
  const { data: found } = await s.from('orgs').select('id').eq('name', name).maybeSingle()
  if (found?.id) return found.id
  const { data: ins, error: insErr } = await s.from('orgs').insert({ name }).select('id').single()
  if (insErr) throw insErr
  return ins!.id
}

export async function POST(req: Request) {
  try {
    const { filename } = (await req.json()) as { filename?: string }
    if (!filename) return NextResponse.json({ error: 'filename manquant' }, { status: 400 })

    const ORG_NAME = process.env.ORG_NAME || 'Eiffage'
    const s = getSupabaseAdmin()
    const org_id = await ensureOrgId(ORG_NAME)

    const { data: batch, error: berr } = await s.from('batches').insert({
      org_id, source_filename: filename, status: 'uploading', raw_file_url: ''
    }).select('*').single()
    if (berr || !batch) throw berr ?? new Error('insert batch failed')

    const hash = crypto.createHash('md5').update(`${Date.now()}-${filename}`).digest('hex').slice(0,8)
    const objectPath = `${batch.id}/${hash}-${filename}` // note: sans 'raw/' pour le SDK
    const { data: sign, error: serr } = await s.storage.from('raw').createSignedUploadUrl(objectPath)
    if (serr) throw serr

    await s.from('batches').update({ raw_file_url: `raw/${objectPath}`, status: 'pending' }).eq('id', batch.id)

    return NextResponse.json({
      batch_id: batch.id,
      bucket: 'raw',
      objectPath: sign.path,   // <uuid>/<hash>-<filename>
      uploadToken: sign.token,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'init failed' }, { status: 500 })
  }
}
