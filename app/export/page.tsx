'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Papa from 'papaparse';
import { saveAs } from '../../components/saveAsCsv';
import { useRouter } from 'next/navigation';
import Modal from '../../components/Modal';

export default function ExportPage() {
  const router = useRouter();
  const [registre, setRegistre] = useState<any[]>([]);
  const [modalState, setModalState] = useState<{ isOpen: boolean; message: string; inserted?: number; error?: string }>({ 
    isOpen: false, 
    message: '' 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('fluxmat_data');
    if (saved) {
      const data = JSON.parse(saved);
      setRegistre(data.registre || []);
    }
  }, []);

  async function saveToDB() {
    setLoading(true);
    try {
      const res = await fetch('/api/db/save-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: registre })
      });
      const data = await res.json();
      if (data.error) {
        setModalState({
          isOpen: true,
          message: `Erreur lors de la sauvegarde`,
          error: data.error
        });
      } else {
        setModalState({
          isOpen: true,
          message: `Export réussi !`,
          inserted: data.inserted || 0
        });
      }
    } catch (err: any) {
      setModalState({
        isOpen: true,
        message: `Erreur lors de la sauvegarde`,
        error: err.message || 'Erreur inconnue'
      });
    } finally {
      setLoading(false);
    }
  }

  function handleModalClose(shouldRedirect = false) {
    const hadSuccess = modalState.inserted !== undefined && modalState.inserted > 0;
    setModalState({ isOpen: false, message: '' });
    if (shouldRedirect && hadSuccess) {
      // Rediriger vers le tableau de bord après un succès
      router.push('/');
    }
  }

  function exportCSV() {
    const csv = Papa.unparse(registre);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `registre_fluxmat_${Date.now()}.csv`);
  }

  // Calculer les stats
  const totalLignes = registre.length;
  const lignesDangereuses = registre.filter(r => r.danger === true).length;
  const lignesNormales = totalLignes - lignesDangereuses;

  return (
    <main className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10">
        {/* En-tête avec animation */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-gray-900 tracking-tight">Export Registre</h1>
              <p className="text-gray-600 text-lg">Téléchargez ou sauvegardez votre registre validé</p>
            </div>
            <Link 
              href="/controle" 
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:scale-105"
            >
              ← Retour au Contrôle
            </Link>
          </div>
        </div>

        {registre.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center shadow-sm animate-fade-in">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Aucune ligne à exporter</h2>
            <p className="text-gray-600 mb-6">Importez et validez des données pour pouvoir les exporter.</p>
            <Link 
              href="/import" 
              className="inline-block rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            >
              Aller à l'Import →
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Cards avec animation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 animate-fade-in" style={{animationDelay: '0.1s'}}>
              {/* Card Total */}
              <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow hover:shadow-md transition-all duration-300 hover:scale-[1.03]">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {totalLignes}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total</p>
                    <p className="text-xl font-bold text-blue-900">{totalLignes} lignes</p>
                  </div>
                </div>
              </div>
              
              {/* Card Normales */}
              <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-4 shadow hover:shadow-md transition-all duration-300 hover:scale-[1.03]">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {lignesNormales}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Normales</p>
                    <p className="text-xl font-bold text-green-900">{lignesNormales} lignes</p>
                  </div>
                </div>
              </div>
              
              {/* Card Dangereuses */}
              <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 shadow hover:shadow-md transition-all duration-300 hover:scale-[1.03]">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {lignesDangereuses}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-700 uppercase tracking-wide">Dangereuses</p>
                    <p className="text-xl font-bold text-red-900">{lignesDangereuses} lignes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'export améliorés */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg mb-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Choisissez votre format d'export
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Export CSV */}
                <button 
                  className="group relative rounded-xl bg-gradient-to-br from-red-600 to-red-700 px-5 py-6 text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden" 
                  onClick={exportCSV} 
                  disabled={!registre.length}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex flex-col items-center gap-3">
                    <div className="text-5xl">📥</div>
                    <div className="text-lg font-bold">Exporter CSV</div>
                    <p className="text-xs text-red-100">Téléchargement local</p>
                  </div>
                </button>

                {/* Sauvegarder Supabase */}
                <button 
                  className="group relative rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-6 text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden" 
                  onClick={saveToDB} 
                  disabled={!registre.length || loading}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex flex-col items-center gap-3">
                    {loading ? (
                      <>
                        <div className="animate-spin text-5xl">⏳</div>
                        <div className="text-lg font-bold">Enregistrement...</div>
                        <p className="text-xs text-blue-100">Veuillez patienter</p>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl">💾</div>
                        <div className="text-lg font-bold">Sauvegarder</div>
                        <p className="text-xs text-blue-100">Base de données Supabase</p>
                      </>
                    )}
                  </div>
                </button>

                {/* Export GDM */}
                <button
                  className="group relative rounded-xl bg-gradient-to-br from-green-600 to-green-700 px-5 py-6 text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  onClick={() => {
                    setModalState({
                      isOpen: true,
                      message: 'Fonctionnalité Export vers GDM à implémenter'
                    });
                  }}
                  disabled={!registre.length}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex flex-col items-center gap-3">
                    <div className="text-5xl">📤</div>
                    <div className="text-lg font-bold">Export GDM</div>
                    <p className="text-xs text-green-100">Bientôt disponible</p>
                  </div>
                </button>
              </div>

              {/* Info champs exportés */}
              <div className="mt-8 rounded-lg bg-gray-50 border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Champs inclus dans l'export</p>
                    <p className="text-xs text-gray-600">
                      Date expédition, Quantité, Unité, Dénomination, Code déchet, Danger, 
                      Producteur, Adresse chantier, Destinataire
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu des données */}
            {registre.length > 0 && (
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-xl animate-fade-in" style={{animationDelay: '0.3s'}}>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Aperçu des données validées
                </h2>
                
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Dénomination</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantité</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Unité</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Code déchet</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Danger</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {registre.slice(0, 10).map((r, i) => (
                        <tr key={r.__id ?? i} className="hover:bg-blue-50 transition-colors duration-200">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.dateExpedition ?? r.Date ?? '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{r.denominationUsuelle ?? r['Libellé Ressource'] ?? '-'}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">{r.quantite ?? r.Quantité ?? '-'}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">{r.codeUnite ?? r.Unité ?? '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md font-mono text-sm font-semibold">
                              {r.codeDechet}{r.danger === true ? '*' : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.danger === true ? (
                              <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                ⚠️ Oui
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {registre.length > 10 && (
                  <p className="text-center text-sm text-gray-500 mt-4 animate-pulse">
                    ... et {registre.length - 10} autres lignes
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <Footer />

      {/* Modal de confirmation/erreur */}
      <Modal 
        isOpen={modalState.isOpen} 
        onClose={handleModalClose}
        title={modalState.error ? 'Erreur' : 'Export'}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            {modalState.error ? (
              <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            <div className="flex-1">
              <p className="text-base leading-relaxed">{modalState.message}</p>
              {modalState.inserted !== undefined && (
                <div className="mt-3 bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-sm text-gray-300">
                    <span className="text-green-400 font-semibold">{modalState.inserted}</span> lignes insérées dans la base de données
                  </p>
                </div>
              )}
              {modalState.error && (
                <div className="mt-3 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  <p className="text-sm text-red-300">{modalState.error}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            {modalState.inserted !== undefined && (
              <button
                onClick={() => {
                  handleModalClose(true);
                  router.push('/');
                }}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                Voir le tableau de bord
              </button>
            )}
            <button
              onClick={() => handleModalClose(false)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl min-w-[100px]"
            >
              {modalState.inserted !== undefined ? 'Fermer' : 'OK'}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
