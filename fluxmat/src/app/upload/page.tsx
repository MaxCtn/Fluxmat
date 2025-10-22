'use client'

import * as React from 'react'
import supabase from '@/lib/supabase.client'
import { useRouter } from 'next/navigation'

type InitResp = {
  batch_id: string
  bucket: 'raw'
  objectPath: string   // chemin renvoyé par createSignedUploadUrl (sans 'raw/')
  uploadToken: string
}

export default function UploadPage() {
  const [file, setFile] = React.useState<File | null>(null)
  const [status, setStatus] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [pct, setPct] = React.useState(0)
  const router = useRouter()

  async function handleUpload() {
    if (!file) return
    setBusy(true)
    setStatus('Initialisation…')
    setPct(5)

    // 1) INIT: batch + signed URL
    const initRes = await fetch('/api/upload/init', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ filename: file.name }),
    })
    if (!initRes.ok) {
      setBusy(false); setStatus(`Erreur init: ${(await initRes.json()).error ?? initRes.statusText}`)
      return
    }
    const init: InitResp = await initRes.json()
    setStatus('Téléversement…')
    setPct(35)

    // 2) Upload direct via signed URL
    const { data: up, error: upErr } = await supabase
      .storage
      .from('raw')
      .uploadToSignedUrl(init.objectPath, init.uploadToken, file)

    if (upErr) {
      setBusy(false); setStatus(`Erreur upload: ${upErr.message}`); return
    }

    setStatus('Finalisation…')
    setPct(70)

    // 3) COMPLETE: enqueue parse
    const compRes = await fetch('/api/upload/complete', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ batch_id: init.batch_id }),
    })
    if (!compRes.ok) {
      setBusy(false); setStatus(`Erreur complete: ${(await compRes.json()).error ?? compRes.statusText}`)
      return
    }

    setPct(100)
    setStatus('Lot créé et en file de traitement.')
    // Si ta page /lots/[id] existe :
    setTimeout(()=> router.push(`/lots/${init.batch_id}`), 600)
  }

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <h1 className="text-2xl font-bold">Téléverser un fichier</h1>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3">
          <label className="text-sm font-medium">Fichier Excel/CSV</label>
          <input
            type="file"
            onChange={(e)=> setFile(e.target.files?.[0] ?? null)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
          <div className="text-sm text-zinc-600">
            Upload → Parsing → Synthèse → Détails → Export
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="inline-flex items-center rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              onClick={handleUpload}
              disabled={!file || busy}
            >
              {busy ? 'En cours…' : 'Téléverser'}
            </button>
            <span className="text-sm text-zinc-600">{file?.name}</span>
          </div>

          {busy && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span>{status ?? '…'}</span>
                <span className="font-medium">{pct}%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-zinc-200">
                <div className="h-2 rounded-full bg-red-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
