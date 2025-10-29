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

  return (
    <main className="min-h-dvh bg-gray-50">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Export Registre</h1>
          <p className="text-gray-600">Téléchargez votre registre au format CSV ou enregistrez-le dans Supabase.</p>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <p className="text-gray-700 text-sm mb-4">
            Champs exportés: dateExpedition, quantite, codeUnite, denominationUsuelle, codeDechet, 
            producteur.raisonSociale, producteur.adresse.libelle, destinataire.raisonSociale.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              className="rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={exportCSV} 
              disabled={!registre.length}
            >
              📥 Exporter CSV
            </button>
            <button 
              className="rounded-lg border-2 border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 hover:bg-blue-100 transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={saveToDB} 
              disabled={!registre.length || loading}
            >
              {loading ? '⏳ Enregistrement...' : '💾 Sauvegarder dans Supabase'}
            </button>
            <button
              className="rounded-lg border-2 border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 hover:bg-green-100 transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                setModalState({
                  isOpen: true,
                  message: 'Fonctionnalité Export GDM à implémenter'
                });
              }}
              disabled={!registre.length}
            >
              📤 Export vers GDM
            </button>
          </div>
        </div>

        {/* Stats */}
        {registre.length > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">
                {registre.length}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">Lignes prêtes à l'export</h3>
                <p className="text-sm text-green-700">Toutes les lignes ont un code déchet valide</p>
              </div>
            </div>
          </div>
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
