"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* ===========================
   Types
=========================== */
type ID = string;

type Etablissement = { id: ID; label: string };
type Chantier = { id: ID; label: string; etabId: ID };
type Numero = { id: ID; numero: string; chantierId: ID };

type LastImport = {
  at: string;        // ISO
  fileName?: string;
  user?: string;
  rowCount?: number;
};

type Outstanding = {
  missingCodes: number;        // lignes sans code déchet
  incompleteChantiers: number; // chantiers non saisis / incomplets
};

type Filters = {
  etab?: ID | null;
  chantier?: ID | null;
  num?: string | null;
};

/* ===========================
   MOCK DATA (remplace par tes appels API)
   -> brancher:
      - GET /api/meta/establishments
      - GET /api/meta/chantiers?etab=...
      - GET /api/meta/numeros?chantier=...
      - GET /api/meta/last-import?etab=...&chantier=...&num=...
      - GET /api/meta/outstanding?...
=========================== */
const mockEtabs: Etablissement[] = [
  { id: "etab-1", label: "Eiffage Agence Nord" },
  { id: "etab-2", label: "Eiffage Agence Ouest" },
];

const mockChantiers: Chantier[] = [
  { id: "ch-1", label: "ZAC Les Dunes", etabId: "etab-1" },
  { id: "ch-2", label: "Avenue du Port", etabId: "etab-1" },
  { id: "ch-3", label: "RD-102 Contournement", etabId: "etab-2" },
];

const mockNumeros: Numero[] = [
  { id: "n-1", numero: "CH-2025-034", chantierId: "ch-1" },
  { id: "n-2", numero: "CH-2025-035", chantierId: "ch-1" },
  { id: "n-3", numero: "CH-2025-210", chantierId: "ch-2" },
  { id: "n-4", numero: "CH-2025-011", chantierId: "ch-3" },
];

function mockFetchLastImport(_: Filters): Promise<LastImport | null> {
  return Promise.resolve({
    at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    fileName: "export_prc_2025-10-26.xlsx",
    user: "m.dupont",
    rowCount: 842,
  });
}

function mockFetchOutstanding(_: Filters): Promise<Outstanding> {
  return Promise.resolve({ missingCodes: 37, incompleteChantiers: 2 });
}

/* ===========================
   Helpers
=========================== */
function fmtDateTime(iso?: string) {
  if (!iso) return "–";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

/* ===========================
   Page
=========================== */
export default function Page() {
  const [filters, setFilters] = useState<Filters>({ etab: null, chantier: null, num: null });

  // Cascades
  const chantiers = useMemo(
    () => (filters.etab ? mockChantiers.filter((c) => c.etabId === filters.etab) : []),
    [filters.etab]
  );
  const numeros = useMemo(
    () => (filters.chantier ? mockNumeros.filter((n) => n.chantierId === filters.chantier) : []),
    [filters.chantier]
  );

  // Data cards
  const [lastImport, setLastImport] = useState<LastImport | null>(null);
  const [outstanding, setOutstanding] = useState<Outstanding>({ missingCodes: 0, incompleteChantiers: 0 });

  useEffect(() => {
    // Remplace par fetch('/api/meta/last-import?...')
    mockFetchLastImport(filters).then(setLastImport);
    // Remplace par fetch('/api/meta/outstanding?...')
    mockFetchOutstanding(filters).then(setOutstanding);
  }, [filters.etab, filters.chantier, filters.num]);

  return (
    <main className="min-h-dvh bg-white text-black">
      {/* Header minimal */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/images/eiffage-logo-1.png" alt="Eiffage" width={120} height={32} className="h-8 w-auto" priority />
            <span className="hidden text-sm text-gray-500 md:block">Flux de matériaux — Tableau de bord</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/import" className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50">Import</Link>
            <Link href="/controle" className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50">Contrôle</Link>
            <Link href="/export" className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50">Export</Link>
          </nav>
        </div>
      </header>

      {/* Intro */}
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-10">
        <div className="grid items-center gap-6 md:grid-cols-[1.3fr,0.7fr]">
          <div>
            <h1 className="text-2xl font-bold">FluxMat — Tableau de bord</h1>
            <p className="mt-3 text-gray-700">
              Importez vos fichiers PRC/PIDOT, corrigez les lignes sans code déchet, puis exportez un registre conforme.
              Utilisez les filtres ci-dessous pour cibler un Établissement, un Chantier et un N° chantier ; accédez au dernier import et
              suivez les tâches en attente (codes manquants, chantiers incomplets).
            </p>
          </div>
          <div className="flex justify-end">
            <Image
              src="/images/Eiffage_trame_modeclair.png"
              alt="Eiffage marque"
              width={300}
              height={300}
              className="h-40 w-auto opacity-90"
              priority
            />
          </div>
        </div>
      </section>

      {/* Filtres */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Filtres</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Établissement / Agence</label>
              <select
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400"
                value={filters.etab ?? ""}
                onChange={(e) =>
                  setFilters({ etab: e.target.value || null, chantier: null, num: null })
                }
              >
                <option value="">Sélectionner</option>
                {mockEtabs.map((e) => (
                  <option key={e.id} value={e.id}>{e.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Chantier</label>
              <select
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none disabled:opacity-50 focus:ring-2 focus:ring-red-400"
                value={filters.chantier ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, chantier: e.target.value || null, num: null }))
                }
                disabled={!filters.etab}
              >
                <option value="">Sélectionner</option>
                {chantiers.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">N° chantier</label>
              <select
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none disabled:opacity-50 focus:ring-2 focus:ring-red-400"
                value={filters.num ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, num: e.target.value || null }))
                }
                disabled={!filters.chantier}
              >
                <option value="">Sélectionner</option>
                {numeros.map((n) => (
                  <option key={n.id} value={n.numero}>{n.numero}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Cartes */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Dernier import */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold">Dernier import</h3>
              <span className="text-xs text-gray-500">scope: filtres</span>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-600">Date</dt>
                <dd className="font-medium">{fmtDateTime(lastImport?.at)}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Fichier</dt>
                <dd className="truncate">{lastImport?.fileName ?? "–"}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Importé par</dt>
                <dd>{lastImport?.user ?? "–"}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Lignes</dt>
                <dd>{lastImport?.rowCount ?? "–"}</dd>
              </div>
            </dl>
            <div className="mt-4 flex gap-3">
              <Link
                href="/import"
                className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Accéder au dernier import
              </Link>
              <Link
                href="/export"
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black hover:bg-gray-50"
              >
                Aller à l'export
              </Link>
            </div>
          </div>

          {/* Tâches en attente */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-base font-semibold">Tâches en attente</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                <span>Codes déchet à renseigner</span>
                <span className="font-semibold">{outstanding.missingCodes}</span>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                <span>Chantiers incomplets / non saisis</span>
                <span className="font-semibold">{outstanding.incompleteChantiers}</span>
              </li>
            </ul>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/controle"
                className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Aller au Contrôle
              </Link>
              <Link
                href="/import"
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black hover:bg-gray-50"
              >
                Aller à l'Import
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer discret */}
      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-2 text-xs text-gray-500">
        © {new Date().getFullYear()} — FluxMat
      </footer>
    </main>
  );
}