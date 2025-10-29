"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DashboardTable from "../components/DashboardTable";
import Link from "next/link";
import Modal from "../components/Modal";
import { useRouter } from "next/navigation";

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

type PendingImport = {
  id: string;
  file_name: string;
  user_name: string;
  created_at: string;
  lines_to_complete: number;
};

type Filters = {
  etab?: ID | null;
  chantier?: ID | null;
  num?: string | null;
};

type IncompleteChantier = {
  code_chantier: string | null;
  libelle_chantier: string | null;
  libelle_entite: string | null;
  exutoire: string | null;
  count: number;
  last_date: string | null;
};

export default function Page() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>({ etab: null, chantier: null, num: null });
  const [etabs, setEtabs] = useState<Etablissement[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [numeros, setNumeros] = useState<Numero[]>([]);
  const [lastImport, setLastImport] = useState<LastImport | null>(null);
  const [outstanding, setOutstanding] = useState<Outstanding>({ missingCodes: 0, incompleteChantiers: 0 });
  const [pendingImports, setPendingImports] = useState<PendingImport[]>([]);
  const [incompleteChantiers, setIncompleteChantiers] = useState<IncompleteChantier[]>([]);
  const [showChantiersModal, setShowChantiersModal] = useState(false);
  const [loadingChantiers, setLoadingChantiers] = useState(false);

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
    // Charger le dernier import depuis l'API
    const params = new URLSearchParams();
    if (filters.etab) params.append('etab', filters.etab);
    if (filters.chantier) params.append('chantier', filters.chantier);

    fetch(`/api/dashboard/recent-imports?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.items && data.items.length > 0) {
          const firstImport = data.items[0];
          setLastImport({
            at: firstImport.dateLastImport || new Date().toISOString(),
            fileName: firstImport.numChantier || 'Import récent',
            user: "Système",
            rowCount: undefined,
          });
        } else {
          setLastImport(null);
        }
      })
      .catch(() => setLastImport(null));

    // Charger tâches en attente
    fetch(`/api/dashboard/outstanding?${params.toString()}`)
      .then(res => res.json())
      .then(data => setOutstanding({
        missingCodes: data.missingCodes || 0,
        incompleteChantiers: data.incompleteChantiers || 0
      }))
      .catch(() => setOutstanding({ missingCodes: 0, incompleteChantiers: 0 }));
  }, [filters.etab, filters.chantier, filters.num]);

  // Charger les imports en attente
  useEffect(() => {
    fetch('/api/pending-imports/list')
      .then(res => res.json())
      .then(data => setPendingImports(data.items || []))
      .catch(() => setPendingImports([]));
  }, []);

  function fmtDateTime(iso?: string) {
    if (!iso) return "–";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d);
  }

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-[#1C1C1C] transition-colors">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">FluxMat — Tableau de bord</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            Importez vos fichiers PRC/PIDOT, corrigez les lignes sans code déchet, puis exportez un registre conforme.
            Utilisez les filtres pour cibler un établissement, un chantier et un numéro de chantier.
          </p>
        </div>

        {/* Filtres */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1C1C1C] p-6 mb-8 shadow-sm transition-colors">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Filtres</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Établissement / Agence
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 transition-colors"
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
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none disabled:opacity-50 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 transition-colors"
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
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none disabled:opacity-50 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 transition-colors"
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
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1C1C1C] p-6 mb-8 shadow-sm transition-colors">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Registre de flux</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Données exportées depuis la base de données. Cliquez sur les en-têtes pour trier.</p>
          <DashboardTable filters={{ etab: filters.etab || undefined, chantier: filters.chantier || undefined, num: filters.num || undefined }} />
        </div>

        {/* Cartes */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Dernier import */}
          <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1C1C1C] p-6 shadow-sm hover:shadow-md transition-all">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Dernier import</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">scope: filtres</span>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <dt className="text-gray-600 dark:text-gray-400 mb-1">Date</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{fmtDateTime(lastImport?.at)}</dd>
              </div>
              <div>
                <dt className="text-gray-600 dark:text-gray-400 mb-1">Fichier</dt>
                <dd className="truncate text-gray-900 dark:text-gray-100">{lastImport?.fileName ?? "–"}</dd>
              </div>
              <div>
                <dt className="text-gray-600 dark:text-gray-400 mb-1">Importé par</dt>
                <dd className="text-gray-900 dark:text-gray-100">{lastImport?.user ?? "Système"}</dd>
              </div>
              <div>
                <dt className="text-gray-600 dark:text-gray-400 mb-1">Lignes</dt>
                <dd className="font-semibold text-gray-900 dark:text-gray-100">{lastImport?.rowCount ?? "–"}</dd>
              </div>
            </dl>
            <div className="flex gap-3">
              <Link
                href="/import"
                className="rounded-lg bg-red-600 dark:bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 transition"
              >
                Accéder au dernier import
              </Link>
              <Link
                href="/export"
                className="rounded-lg border border-gray-300 dark:border-slate-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-900 transition"
              >
                Aller à l'export
              </Link>
            </div>
          </div>

          {/* Tâches en attente */}
          <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1C1C1C] p-6 shadow-sm hover:shadow-md transition-all">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Tâches en attente</h3>
            <ul className="space-y-3 mb-4 text-sm">
              <li className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 border border-red-100 dark:border-red-900/30">
                <span className="text-gray-700 dark:text-gray-300">Codes déchet à renseigner</span>
                <span className="font-bold text-red-600 dark:text-red-400">{outstanding.missingCodes}</span>
              </li>
              <li 
                className="flex items-center justify-between rounded-lg bg-orange-50 dark:bg-orange-900/20 px-4 py-3 border border-orange-100 dark:border-orange-900/30 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition"
                onClick={async () => {
                  setShowChantiersModal(true);
                  setLoadingChantiers(true);
                  try {
                    const params = new URLSearchParams();
                    if (filters.etab) params.append('etab', filters.etab);
                    const res = await fetch(`/api/dashboard/incomplete-chantiers?${params.toString()}`);
                    const data = await res.json();
                    setIncompleteChantiers(data.items || []);
                  } catch (err) {
                    console.error('Erreur chargement chantiers:', err);
                    setIncompleteChantiers([]);
                  } finally {
                    setLoadingChantiers(false);
                  }
                }}
              >
                <span className="text-gray-700 dark:text-gray-300">Chantiers incomplets / non saisis</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">{outstanding.incompleteChantiers}</span>
              </li>
            </ul>

            {/* Fichiers à compléter (intégré dans Tâches en attente) */}
            {pendingImports.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">📋 Fichiers à compléter</h4>
                <div className="space-y-2">
                  {pendingImports.map((pending) => (
                    <div
                      key={pending.id}
                      className="flex items-center justify-between rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 hover:shadow-md transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-xs">{pending.file_name}</span>
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold">
                            {pending.lines_to_complete} lignes
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(pending.created_at).toLocaleDateString('fr-FR')} par {pending.user_name}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/pending-imports/load/${pending.id}`);
                            const data = await res.json();
                            if (data.ok) {
                              sessionStorage.setItem('fluxmat_data', JSON.stringify({
                                registre: data.registre,
                                controle: data.controle,
                                fileName: data.file_name
                              }));
                              window.location.href = '/controle';
                            } else {
                              alert('Erreur lors du chargement du fichier');
                            }
                          } catch (err) {
                            console.error('Erreur:', err);
                            alert('Erreur lors du chargement du fichier');
                          }
                        }}
                        className="ml-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition"
                      >
                        Reprendre →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-4">
              <Link
                href="/controle"
                className="rounded-lg bg-red-600 dark:bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 transition"
              >
                Aller au Contrôle
              </Link>
              <Link
                href="/import"
                className="rounded-lg border border-gray-300 dark:border-slate-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-900 transition"
              >
                Aller à l'Import
              </Link>
            </div>
          </div>
        </div>


        {/* Section À propos */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1C1C1C] p-6 shadow-sm transition-colors">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">À propos de FluxMat</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">FluxMat</strong> est une application de gestion des flux de matériaux 
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

      {/* Modal pour les chantiers incomplets */}
      <Modal 
        isOpen={showChantiersModal} 
        onClose={() => setShowChantiersModal(false)}
        title="Chantiers incomplets"
      >
        <div className="flex flex-col gap-4">
          {loadingChantiers ? (
            <div className="text-center py-8 text-gray-400">
              Chargement...
            </div>
          ) : incompleteChantiers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Aucun chantier incomplet trouvé
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-300 mb-4">
                Cliquez sur un chantier pour reprendre les lignes à compléter
              </p>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {incompleteChantiers.map((chantier, idx) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      setLoadingChantiers(true);
                      try {
                        const params = new URLSearchParams();
                        if (chantier.code_chantier) {
                          params.append('code_chantier', chantier.code_chantier);
                        } else if (chantier.libelle_chantier) {
                          params.append('libelle_chantier', chantier.libelle_chantier);
                        }
                        if (filters.etab) params.append('etab', filters.etab);

                        const res = await fetch(`/api/dashboard/load-chantier?${params.toString()}`);
                        const data = await res.json();

                        if (data.ok && data.controle) {
                          sessionStorage.setItem('fluxmat_data', JSON.stringify({
                            registre: [],
                            controle: data.controle,
                            fileName: `Chantier ${chantier.libelle_chantier || chantier.code_chantier || 'inconnu'}`
                          }));
                          setShowChantiersModal(false);
                          router.push('/controle');
                        } else {
                          alert(data.error || 'Erreur lors du chargement du chantier');
                        }
                      } catch (err: any) {
                        console.error('Erreur:', err);
                        alert('Erreur lors du chargement du chantier');
                      } finally {
                        setLoadingChantiers(false);
                      }
                    }}
                    className="w-full text-left rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-4 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-white mb-1">
                          {chantier.libelle_chantier || chantier.code_chantier || 'Chantier sans nom'}
                        </div>
                        <div className="text-xs text-gray-400 space-y-1">
                          {chantier.libelle_entite && <div>Agence: {chantier.libelle_entite}</div>}
                          {chantier.exutoire && <div>Exutoire: {chantier.exutoire}</div>}
                          {chantier.code_chantier && (
                            <div>Code: {chantier.code_chantier}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-orange-400 font-bold text-lg">{chantier.count}</div>
                        <div className="text-xs text-gray-400">lignes</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowChantiersModal(false)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl min-w-[100px]"
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
