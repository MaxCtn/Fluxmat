'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ControlTable from '../../components/ControlTable';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useRouter } from 'next/navigation';
import { AlertModal, ConfirmExportModal } from '../../components/Modal';
import { isValidCodeDechet } from '@/lib/wasteUtils';

// Fonction pour nettoyer les données avant stockage dans sessionStorage
function cleanDataForStorage(rows: any[]): any[] {
  return rows.map(row => {
    const cleaned: any = {};
    
    // Propriétés essentielles à conserver
    if (row.__id !== undefined) cleaned.__id = row.__id;
    if (row.dateExpedition !== undefined) cleaned.dateExpedition = row.dateExpedition;
    if (row.Date !== undefined) cleaned.Date = row.Date;
    if (row.denominationUsuelle !== undefined) cleaned.denominationUsuelle = row.denominationUsuelle;
    if (row['Libellé Ressource'] !== undefined) cleaned['Libellé Ressource'] = row['Libellé Ressource'];
    if (row.quantite !== undefined) cleaned.quantite = row.quantite;
    if (row.Quantité !== undefined) cleaned.Quantité = row.Quantité;
    if (row.codeUnite !== undefined) cleaned.codeUnite = row.codeUnite;
    if (row.Unité !== undefined) cleaned.Unité = row.Unité;
    if (row.codeDechet !== undefined) cleaned.codeDechet = row.codeDechet;
    if (row.danger !== undefined) cleaned.danger = row.danger;
    if (row['producteur.raisonSociale'] !== undefined) cleaned['producteur.raisonSociale'] = row['producteur.raisonSociale'];
    if (row['Libellé Entité'] !== undefined) cleaned['Libellé Entité'] = row['Libellé Entité'];
    if (row['producteur.adresse.libelle'] !== undefined) cleaned['producteur.adresse.libelle'] = row['producteur.adresse.libelle'];
    if (row['Libellé Chantier'] !== undefined) cleaned['Libellé Chantier'] = row['Libellé Chantier'];
    if (row['destinataire.raisonSociale'] !== undefined) cleaned['destinataire.raisonSociale'] = row['destinataire.raisonSociale'];
    
    return cleaned;
  });
}

// Fonction helper pour sauvegarder dans sessionStorage avec gestion d'erreur
function saveToSessionStorage(key: string, data: any): boolean {
  try {
    const cleanedData = {
      registre: data.registre ? cleanDataForStorage(data.registre) : [],
      controle: data.controle ? cleanDataForStorage(data.controle) : [],
      fileName: data.fileName
    };
    const jsonString = JSON.stringify(cleanedData);
    sessionStorage.setItem(key, jsonString);
    return true;
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      console.error('Quota sessionStorage dépassé:', error);
      alert('Les données sont trop volumineuses pour être stockées localement. Veuillez utiliser la fonctionnalité "Remplir plus tard" pour sauvegarder dans la base de données.');
      return false;
    }
    console.error('Erreur lors de la sauvegarde dans sessionStorage:', error);
    return false;
  }
}

export default function ControlePage() {
  const router = useRouter();
  const [controle, setControle] = useState<any[]>([]);
  const [registre, setRegistre] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string | undefined>();
  const [modalState, setModalState] = useState({ isOpen: false, message: '', fixed: 0, remaining: 0 });
  const [showConfirmExport, setShowConfirmExport] = useState(false);

  // Charger les données depuis sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('fluxmat_data');
    if (saved) {
      const data = JSON.parse(saved);
      setControle(data.controle || []);
      setRegistre(data.registre || []);
      setFileName(data.fileName);
    }
  }, []);

  // Fonction pour gérer les changements de lignes en temps réel
  function handleRowsChange(updatedRows: any[]) {
    // On ne fait plus de validation automatique ici
    // On met simplement à jour le controle sans déplacer vers le registre
    setControle(updatedRows);
    
    // Mettre à jour sessionStorage
    saveToSessionStorage('fluxmat_data', {
      registre: registre,
      controle: updatedRows,
      fileName: fileName || ''
    });
  }
  
  // Fonction pour valider manuellement une ou plusieurs lignes
  function handleValidateRows(rowsToValidate: any[]) {
    const newlyValid = rowsToValidate.filter(r => isValidCodeDechet(r.codeDechet));
    const remainingControle = controle.filter(c => !newlyValid.some(v => v.__id === c.__id));
    const updatedRegistre = [...registre, ...newlyValid.filter(v => !registre.some(r => r.__id === v.__id))];
    
    setRegistre(updatedRegistre);
    setControle(remainingControle);
    
    saveToSessionStorage('fluxmat_data', {
      registre: updatedRegistre,
      controle: remainingControle,
      fileName: fileName || ''
    });
  }
  
  // Fonction pour dé-valider une ligne (remonter du registre vers controle)
  function handleUnvalidateRow(row: any) {
    const updatedRegistre = registre.filter(r => r.__id !== row.__id);
    const updatedControle = [...controle, row];
    
    setRegistre(updatedRegistre);
    setControle(updatedControle);
    
    saveToSessionStorage('fluxmat_data', {
      registre: updatedRegistre,
      controle: updatedControle,
      fileName: fileName || ''
    });
  }

  function handleConfirmExport() {
    const newlyValidInControle = controle.filter(r => isValidCodeDechet(r.codeDechet));
    const pendingControle = controle.filter(r => !isValidCodeDechet(r.codeDechet));
    const safeRegistre = [
      ...registre,
      ...newlyValidInControle.filter(row => !registre.some(existing => existing.__id === row.__id))
    ];

    setRegistre(safeRegistre);
    setControle(pendingControle);

    // Mettre à jour sessionStorage avec les données actuelles
    saveToSessionStorage('fluxmat_data', {
      registre: safeRegistre,
      controle: pendingControle,
      fileName: fileName || ''
    });
    
    // Fermer la modal et rediriger
    setShowConfirmExport(false);
    router.push('/export');
  }

  function onValidateCorrections(rows: any[]) {
    const fixed = rows.filter(r => isValidCodeDechet(r.codeDechet));
    const remaining = rows.filter(r => !isValidCodeDechet(r.codeDechet));
    
    const updatedRegistre = [...(registre), ...fixed];
    
    // Mettre à jour sessionStorage avec gestion d'erreur
    saveToSessionStorage('fluxmat_data', {
      registre: updatedRegistre,
      controle: remaining,
      fileName: fileName || ''
    });
    
    setControle(remaining);
    setRegistre(updatedRegistre);
    
    // Calculer les compteurs pour le message
    const withCode = updatedRegistre.length;
    const withoutCode = remaining.length;
    const total = withCode + withoutCode;
    
    if (remaining.length === 0) {
      setModalState({ 
        isOpen: true, 
        message: `Toutes les lignes exportables ont un code déchet (${withCode} lignes). Redirection vers l'export...`,
        fixed: fixed.length,
        remaining: 0 
      });
    } else {
      setModalState({ 
        isOpen: true, 
        message: `${withCode} lignes avec code seront exportées. ${withoutCode} lignes restent sans code. Redirection vers l'export...`,
        fixed: fixed.length,
        remaining: remaining.length 
      });
    }
    
    // Toujours rediriger vers l'export après 2 secondes
    setTimeout(() => {
      router.push('/export');
    }, 2000);
  }

  async function handleReportLater() {
    try {
      const dataToSave = {
        file_name: fileName || 'sans-nom.xlsx',
        user_name: 'Maxime Contino',
        registre: registre || [],
        controle: controle || [],
      };

      const res = await fetch('/api/pending-imports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        // Afficher un message plus informatif selon le type d'erreur
        let errorMessage = data.error || 'Erreur lors de la sauvegarde';
        if (data.type === 'missing_env_vars') {
          errorMessage = 'Configuration Supabase manquante. Veuillez configurer les variables d\'environnement dans .env.local';
        }
        throw new Error(errorMessage);
      }

      setModalState({ 
        isOpen: true, 
        message: 'Fichier enregistré pour être complété plus tard.',
        fixed: 0,
        remaining: 0 
      });
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      console.error('Erreur handleReportLater:', err);
      setModalState({ 
        isOpen: true, 
        message: `Erreur: ${err.message}`,
        fixed: 0,
        remaining: 0 
      });
    }
  }

  // Calculer les stats
  const lignesAvecCode = registre.length;
  const lignesSansCode = controle.length;
  const totalLignes = lignesAvecCode + lignesSansCode;

  if (!controle.length && !registre.length) {
    return (
      <main className="min-h-dvh bg-gray-50">
        <Header />
        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Aucune ligne à contrôler</h2>
            <p className="text-gray-600 mb-6">Importez un fichier pour commencer.</p>
            <Link 
              href="/import" 
              className="inline-block rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 transition shadow-md hover:shadow-lg"
            >
              ← Retour à l'Import
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gray-50">
      <Header />

      <section className="mx-auto max-w-[90vw] px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Contrôle des lignes</h1>
          <p className="text-gray-600">Corrigez les codes déchets manquants ou utilisez les suggestions automatiques.</p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div className="flex gap-3 items-center">
            {/* Pill 1 - Avec code */}
            <div className="rounded-full border-2 border-green-200 bg-green-50 px-5 py-2 flex items-center gap-2 hover:scale-105 transition-transform shadow-sm">
              <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Avec code</span>
              <span className="text-lg font-bold text-green-900">{lignesAvecCode}</span>
            </div>
            
            {/* Pill 2 - Sans code */}
            <div className="rounded-full border-2 border-red-200 bg-red-50 px-5 py-2 flex items-center gap-2 hover:scale-105 transition-transform shadow-sm">
              <span className="text-xs font-medium text-red-700 uppercase tracking-wide">Sans code</span>
              <span className="text-lg font-bold text-red-900">{lignesSansCode}</span>
            </div>
            
            {/* Pill 3 - Total */}
            <div className="rounded-full border-2 border-blue-200 bg-blue-50 px-5 py-2 flex items-center gap-2 hover:scale-105 transition-transform shadow-sm">
              <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total</span>
              <span className="text-lg font-bold text-blue-900">{totalLignes}</span>
            </div>

            {/* Bouton Exporter */}
            <button
              onClick={() => setShowConfirmExport(true)}
              disabled={lignesAvecCode === 0}
              className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ml-4"
            >
              Exporter les lignes avec codes →
            </button>
          </div>
          
          <div className="flex gap-3">
            <Link 
              href="/import" 
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              ← Retour à l'Import
            </Link>
          </div>
        </div>

        {/* Tableau de contrôle */}
        {controle.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <ControlTable 
              rows={controle} 
              onValidate={onValidateCorrections} 
              onRowsChange={handleRowsChange}
              onValidateRows={handleValidateRows}
            />
          </div>
        )}

        {/* Tableau des lignes validées */}
        {registre.length > 0 && (
          <div className="rounded-xl border-2 border-green-200 bg-white p-6 shadow-sm mt-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold transition-all duration-300">
                {registre.length}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">{registre.length} Lignes avec code déchet validé</h3>
                <p className="text-sm text-green-700">Ces lignes sont prêtes pour l'export</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-green-50">
                  <tr className="border-b-2 border-green-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dénomination</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Quantité</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Unité</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Code déchet</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Danger</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-200">
                  {registre.map((r, i) => (
                    <tr key={r.__id ?? `registre-${i}`} className="bg-white hover:bg-green-50 transition-colors duration-200">
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{r.dateExpedition ?? r.Date ?? '-'}</td>
                      <td className="px-3 py-2 text-sm">{r.denominationUsuelle ?? r['Libellé Ressource'] ?? '-'}</td>
                      <td className="px-3 py-2 text-center text-sm">{r.quantite ?? r.Quantité ?? '-'}</td>
                      <td className="px-3 py-2 text-center text-sm">{r.codeUnite ?? r.Unité ?? '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-mono text-sm">
                          {r.codeDechet}{r.danger === true ? '*' : ''}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {r.danger === true ? (
                          <span className="text-red-600 font-semibold">⚠️</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleUnvalidateRow(r)}
                          className="rounded-lg px-3 py-1 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all duration-200 border border-orange-200 hover:scale-105 active:scale-95"
                          title="Replacer dans les suggestions"
                        >
                          ↑ Replacer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions footer */}
        {controle.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => handleReportLater()}
              className="rounded-lg border-2 border-gray-300 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm hover:shadow-md"
            >
              Remplir plus tard
            </button>
            <Link
              href="/"
              className="rounded-lg border-2 border-gray-300 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm hover:shadow-md"
            >
              ← Retour au tableau de bord
            </Link>
          </div>
        )}
      </section>

      <Footer />

      {/* Modal d'alerte */}
      <AlertModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        message={modalState.message}
        fixed={modalState.fixed}
        remaining={modalState.remaining}
      />

      {/* Modal de confirmation d'export */}
      <ConfirmExportModal
        isOpen={showConfirmExport}
        onClose={() => setShowConfirmExport(false)}
        onConfirm={handleConfirmExport}
        withCode={lignesAvecCode}
        withoutCode={lignesSansCode}
        total={totalLignes}
      />
    </main>
  );
}
