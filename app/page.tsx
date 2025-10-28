"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DashboardTable from "../components/DashboardTable";
import Link from "next/link";

type ID = string;

type Etablissement = { id: string; label: string };
type Chantier = { id: string; label: string; etabId: string };
type Numero = { id: string; numero: string; chantierId: string };

type LastImport = {
  at: string;
  fileName?: string;
  user?: string;
  rowCount?: number;
};

type Outstanding = {
  missingCodes: number;
  incompleteChantiers: number;
};

type Filters = {
  etab?: ID | null;
  chantier?: ID | null;
  num?: string | null;
};

export default function Page() {
  const [filters, setFilters] = useState<Filters>({ etab: null, chantier: null, num: null });
  const [etabs, setEtabs] = useState<Etablissement[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [numeros, setNumeros] = useState<Numero[]>([]);
  const [lastImport, setLastImport] = useState<LastImport | null>(null);
  const [outstanding, setOutstanding] = useState<Outstanding>({ missingCodes: 0, incompleteChantiers: 0 });

  // Charger les établissements au montage
  useEffect(() => {
    fetch('/api/dashboard/filters?type=etablissements')
      .then(res => res.json())
      .then(data => setEtabs(data.items || []))
      .catch(() => setEtabs([]));
  }, []);

  // Charger les chantiers quand un établissement est sélectionné
  useEffect(() => {
    if (filters.etab) {
      fetch(`/api/dashboard/filters?type=chantiers&etab=${filters.etab}`)
        .then(res => res.json())
        .then(data => setChantiers(data.items || []))
        .catch(() => setChantiers([]));
    } else {
      setChantiers([]);
    }
  }, [filters.etab]);

  // Charger les numéros quand un chantier est sélectionné
  useEffect(() => {
    if (filters.chantier && filters.etab) {
      fetch(`/api/dashboard/filters?type=numeros&etab=${filters.etab}`)
        .then(res => res.json())
        .then(data => setNumeros(data.items || []))
        .catch(() => setNumeros([]));
    } else {
      setNumeros([]);
    }
  }, [filters.chantier, filters.etab]);

  // Charger dernier import et tâches en attente
  useEffect(() => {
    // Simuler dernier import (à remplacer par vraie API imports_log)
    setLastImport({
      at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      fileName: "export_prc_2025-10-26.xlsx",
      user: "Système",
      rowCount: 842,
    });

    // Charger tâches en attente
    const params = new URLSearchParams();
    if (filters.etab) params.append('etab', filters.etab);
    if (filters.chantier) params.append('chantier', filters.chantier);

    fetch(`/api/dashboard/outstanding?${params.toString()}`)
      .then(res => res.json())
      .then(data => setOutstanding({
        missingCodes: data.missingCodes || 0,
        incompleteChantiers: data.incompleteChantiers || 0
      }))
      .catch(() => setOutstanding({ missingCodes: 0, incompleteChantiers: 0 }));
  }, [filters.etab, filters.chantier, filters.num]);

  function fmtDateTime(iso?: string) {
    if (!iso) return "–";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d);
  }

  return (
    <main className="min-h-dvh bg-gray-50">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">FluxMat — Tableau de bord</h1>
          <p className="text-gray-600 max-w-3xl">
            Importez vos fichiers PRC/PIDOT, corrigez les lignes sans code déchet, puis exportez un registre conforme.
            Utilisez les filtres pour cibler un établissement, un chantier et un numéro de chantier.
          </p>
        </div>

        {/* Filtres */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-8 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Filtres</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Établissement / Agence
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={filters.etab ?? ""}
                onChange={(e) => setFilters({ etab: e.target.value || null, chantier: null, num: null })}
              >
                <option value="">Sélectionner</option>
                {etabs.map((e) => (
                  <option key={e.id} value={e.id}>{e.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none disabled:opacity-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={filters.chantier ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, chantier: e.target.value || null, num: null }))}
                disabled={!filters.etab}
              >
                <option value="">Sélectionner</option>
                {chantiers.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° chantier</label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none disabled:opacity-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={filters.num ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, num: e.target.value || null }))}
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

        {/* Tableau principal */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-8 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Derniers imports (10 maximum)</h2>
          <DashboardTable filters={{ etab: filters.etab || undefined, chantier: filters.chantier || undefined, num: filters.num || undefined }} />
        </div>

        {/* Cartes */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Dernier import */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Dernier import</h3>
              <span className="text-xs text-gray-500">scope: filtres</span>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <dt className="text-gray-600 mb-1">Date</dt>
                <dd className="font-medium text-gray-900">{fmtDateTime(lastImport?.at)}</dd>
              </div>
              <div>
                <dt className="text-gray-600 mb-1">Fichier</dt>
                <dd className="truncate text-gray-900">{lastImport?.fileName ?? "–"}</dd>
              </div>
              <div>
                <dt className="text-gray-600 mb-1">Importé par</dt>
                <dd className="text-gray-900">{lastImport?.user ?? "Système"}</dd>
              </div>
              <div>
                <dt className="text-gray-600 mb-1">Lignes</dt>
                <dd className="font-semibold text-gray-900">{lastImport?.rowCount ?? "–"}</dd>
              </div>
            </dl>
            <div className="flex gap-3">
              <Link
                href="/import"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
              >
                Accéder au dernier import
              </Link>
              <Link
                href="/export"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Aller à l'export
              </Link>
            </div>
          </div>

          {/* Tâches en attente */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Tâches en attente</h3>
            <ul className="space-y-3 mb-4 text-sm">
              <li className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 border border-red-100">
                <span className="text-gray-700">Codes déchet à renseigner</span>
                <span className="font-bold text-red-600">{outstanding.missingCodes}</span>
              </li>
              <li className="flex items-center justify-between rounded-lg bg-orange-50 px-4 py-3 border border-orange-100">
                <span className="text-gray-700">Chantiers incomplets / non saisis</span>
                <span className="font-bold text-orange-600">{outstanding.incompleteChantiers}</span>
              </li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/controle"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
              >
                Aller au Contrôle
              </Link>
              <Link
                href="/import"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Aller à l'Import
              </Link>
            </div>
          </div>
        </div>

        {/* Section À propos */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">À propos de FluxMat</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong className="text-gray-900">FluxMat</strong> est une application de gestion des flux de matériaux 
              pour les chantiers Eiffage. Elle permet de :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Importer les données de dépenses depuis les fichiers PRC/PIDOT</li>
              <li>Corriger automatiquement ou manuellement les codes déchets manquants</li>
              <li>Suivre l'état des chantiers et leurs imports récents</li>
              <li>Exporter des registres conformes aux réglementations</li>
              <li>Gérer les exutoires et la traçabilité des matériaux</li>
            </ul>
            <p className="mt-3">
              Utilisez les filtres ci-dessus pour cibler un établissement spécifique et consulter 
              les derniers imports de vos chantiers.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
