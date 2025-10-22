export default function Page() {
  return (
    <main className="mx-auto max-w-4xl p-8 space-y-6">
      <header className="flex items-baseline gap-3">
        <h1 className="text-2xl font-black">FluxMat</h1>
        <p className="text-sm text-zinc-600">
          Passerelle Excel → Stockage / Analyse
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Bienvenue</h2>
        <p className="mt-2 text-zinc-700">
          Téléversez vos fichiers sur la page <code className="font-mono">/upload</code>.
        </p>
        <div className="mt-4">
          <a
            href="/upload"
            className="inline-flex items-center rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Aller à l’upload
          </a>
        </div>
      </section>
    </main>
  )
}
