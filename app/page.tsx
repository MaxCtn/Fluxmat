"use client";

import { useEffect, useState, useMemo } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SortDirection = 'asc' | 'desc' | null;

type FileItem = {
  id: string;
  file_name: string;
  created_at: string;
  user_name: string;
  libelle_entite: string | null;
  code_entite: string | null;
  exutoire: string | null;
  lines_completed: number;
  lines_remaining: number;
  source: 'pending' | 'registre';
  pending_id?: string;
};

type SortField = 'file_name' | 'created_at' | 'lines_completed' | 'lines_remaining' | 'user_name' | 'libelle_entite' | 'exutoire';

export default function Page() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortState, setSortState] = useState<{ key: SortField; direction: SortDirection }>({
    key: 'created_at',
    direction: 'desc'
  });

  // Charger les fichiers au montage
  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/files-list');
      const data = await res.json();
      if (data.ok) {
        setFiles(data.items || []);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error('Erreur chargement fichiers:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  // Fonction de tri
  const sortedFiles = useMemo(() => {
    if (!sortState.key || !sortState.direction) {
      return [...files];
    }

    const sorted = [...files].sort((a, b) => {
      let comparison = 0;

      switch (sortState.key) {
        case 'file_name':
          comparison = (a.file_name || '').localeCompare(b.file_name || '');
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'lines_completed':
          comparison = a.lines_completed - b.lines_completed;
          break;
        case 'lines_remaining':
          comparison = a.lines_remaining - b.lines_remaining;
          break;
        case 'user_name':
          comparison = (a.user_name || '').localeCompare(b.user_name || '');
          break;
        case 'libelle_entite':
          comparison = (a.libelle_entite || '').localeCompare(b.libelle_entite || '');
          break;
        case 'exutoire':
          comparison = (a.exutoire || '').localeCompare(b.exutoire || '');
          break;
        default:
          return 0;
      }

      return sortState.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [files, sortState]);

  function handleSort(key: SortField) {
    setSortState(prev => {
      if (prev.key === key) {
        // Cycle: asc -> desc -> asc
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return { key, direction: 'asc' };
        }
      }
      return { key, direction: 'asc' };
    });
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortState.key !== field) {
      return <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">⇅</span>;
    }
    return (
      <span className="text-red-600 dark:text-red-400 text-xs ml-1">
        {sortState.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  }

  function fmtDateTime(iso: string) {
    if (!iso) return "–";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d);
  }

  async function handleFileClick(file: FileItem) {
    if (file.source === 'pending' && file.pending_id) {
      // Charger depuis pending_imports
      try {
        const res = await fetch(`/api/pending-imports/load/${file.pending_id}`);
        const data = await res.json();
        if (data.ok) {
          sessionStorage.setItem('fluxmat_data', JSON.stringify({
            registre: data.registre || [],
            controle: data.controle || [],
            fileName: data.file_name
          }));
          router.push('/controle');
        } else {
          alert('Erreur lors du chargement du fichier');
        }
      } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur lors du chargement du fichier');
      }
    } else {
      // Afficher les données depuis registre_flux
      // Pour l'instant, rediriger vers le tableau de bord complet
      router.push(`/dashboard/full?source=${encodeURIComponent(file.file_name)}`);
    }
  }

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-[#1C1C1C] transition-colors">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10">
        {/* En-tête avec animations */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-5xl font-extrabold mb-4 title-gradient animate-slide-up">
            FluxMat — Tableau de bord
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl animate-fade-in-delay">
            Gérez vos imports, suivez l'avancement de vos fichiers et exportez vos registres en toute simplicité.
          </p>
        </div>

        {/* Liste des fichiers importés */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1C1C1C] p-6 mb-8 shadow-sm transition-colors animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">📋 Fichiers importés</h2>
            <Link
              href="/import"
              className="rounded-lg bg-red-600 dark:bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 transition shadow-md hover:shadow-lg"
            >
              + Nouvel import
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="mt-4">Chargement des fichiers...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">Aucun fichier importé</p>
              <p className="text-sm mb-4">Commencez par importer un fichier PRC/PIDOT</p>
              <Link
                href="/import"
                className="inline-block rounded-lg bg-red-600 dark:bg-red-700 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 transition shadow-md"
              >
                Importer un fichier
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-slate-900">
                  <tr>
                    <th
                      className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition"
                      onClick={() => handleSort('file_name')}
                    >
                      Nom du fichier <SortIcon field="file_name" />
                    </th>
                    <th
                      className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition"
                      onClick={() => handleSort('created_at')}
                    >
                      Date d'import <SortIcon field="created_at" />
                    </th>
                    <th
                      className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition"
                      onClick={() => handleSort('lines_completed')}
                    >
                      Complété <SortIcon field="lines_completed" />
                    </th>
                    <th
                      className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition"
                      onClick={() => handleSort('lines_remaining')}
                    >
                      Restant <SortIcon field="lines_remaining" />
                    </th>
                    <th
                      className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition"
                      onClick={() => handleSort('user_name')}
                    >
                      Importé par <SortIcon field="user_name" />
                    </th>
                    <th
                      className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition"
                      onClick={() => handleSort('libelle_entite')}
                    >
                      Établissement <SortIcon field="libelle_entite" />
                    </th>
                    <th
                      className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition"
                      onClick={() => handleSort('exutoire')}
                    >
                      Exutoire <SortIcon field="exutoire" />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {sortedFiles.map((file) => (
                    <tr
                      key={file.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-900/50 transition cursor-pointer"
                      onClick={() => handleFileClick(file)}
                    >
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                        {file.file_name}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {fmtDateTime(file.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-semibold">
                          {file.lines_completed} lignes
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {file.lines_remaining > 0 ? (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-xs font-semibold">
                            {file.lines_remaining} lignes
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 rounded text-xs">
                            Terminé
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {file.user_name}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {file.libelle_entite || '–'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {file.exutoire || '–'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileClick(file);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                        >
                          {file.source === 'pending' && file.lines_remaining > 0 ? 'Reprendre' : 'Voir'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
