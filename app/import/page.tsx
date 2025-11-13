'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import FileDrop from '../../components/FileDrop';
import HierarchicalTreeView from '../../components/HierarchicalTreeView';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { isValidCodeDechet } from '@/lib/wasteUtils';
import { useRouter } from 'next/navigation';

// Fonction pour nettoyer les données avant stockage dans sessionStorage
// Ne garde que les propriétés essentielles pour réduire la taille
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

export default function ImportPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | undefined>();
  const [registre, setRegistre] = useState<any[]>([]);
  const [controle, setControle] = useState<any[]>([]);
  const [allRows, setAllRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les données depuis sessionStorage au montage
  useEffect(() => {
    const saved = sessionStorage.getItem('fluxmat_data');
    if (saved) {
      const data = JSON.parse(saved);
      setRegistre(data.registre || []);
      setControle(data.controle || []);
      setAllRows(data.allRows || []);
      setFileName(data.fileName);
    }
  }, []);

  async function onUpload(file: File) {
    setLoading(true);
    setFileName(file.name);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/transform', { method: 'POST', body: form });
    const data = await res.json();
    const newRegistre = data.registre ?? [];
    const newControle = data.controle ?? [];
    const newAllRows = data.allRows ?? [];
    setRegistre(newRegistre);
    setControle(newControle);
    setAllRows(newAllRows);
    
    // Sauvegarder dans sessionStorage avec gestion d'erreur
    saveToSessionStorage('fluxmat_data', {
      registre: newRegistre,
      controle: newControle,
      fileName: file.name
    });
    
    setLoading(false);
  }

  function navigateToControle() {
    // Ne pas stocker allRows car la page contrôle ne l'utilise pas
    const success = saveToSessionStorage('fluxmat_data', {
      registre,
      controle,
      fileName
    });
    
    if (success) {
      router.push('/controle');
    }
  }

  // Toutes les lignes (pour les compteurs - toujours affichées sans filtres)
  const toutesLesLignes = useMemo(() => {
    return [...registre, ...controle];
  }, [registre, controle]);

  // Compteurs calculés à partir de toutes les lignes (non filtrées)
  const totalLignes = toutesLesLignes.length;
  const lignesValidees = toutesLesLignes.filter(r => isValidCodeDechet(r.codeDechet)).length;
  const lignesATraiter = toutesLesLignes.filter(r => !isValidCodeDechet(r.codeDechet)).length;

  return (
    <main className="min-h-dvh bg-gray-50">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-3 text-gray-900">Import Dépenses</h1>
            <p className="text-gray-600">Dépose un fichier XLSX exporté depuis PRC/PIDOT pour commencer.</p>
          </div>
          <Link 
            href="/" 
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            ← Retour au tableau de bord
          </Link>
        </div>
        
        {/* Zone de drop améliorée */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-8 shadow-sm">
          <FileDrop onFile={onUpload} existingFileName={fileName} />
          {loading && (
            <div className="mt-4 flex items-center gap-3 text-blue-600 animate-pulse">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Traitement du fichier en cours...</span>
            </div>
          )}
        </div>

        {/* Résultats séparés */}
        {totalLignes > 0 && (
          <div className="space-y-6 mb-8">
            {/* Lignes validées (vert) */}
            {lignesValidees > 0 && (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                      {lignesValidees}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">Lignes avec code déchet</h3>
                      <p className="text-sm text-green-700">Ces lignes sont prêtes à être exportées</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-semibold">
                    ✓ Validé
                  </span>
                </div>
              </div>
            )}

            {/* Lignes à traiter (rouge) */}
            {lignesATraiter > 0 && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                      {lignesATraiter}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-900">Lignes sans code déchet</h3>
                      <p className="text-sm text-red-700">Ces lignes nécessitent une correction</p>
                    </div>
                  </div>
                  <button 
                    onClick={navigateToControle}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition shadow-md hover:shadow-lg"
                  >
                    Passer au contrôle →
                  </button>
                </div>
              </div>
            )}

            {/* Bilan */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-900">
                📊 <strong>Total: {totalLignes} lignes</strong> ({lignesValidees} validées, {lignesATraiter} à traiter)
              </p>
            </div>
          </div>
        )}

        {/* Vue hiérarchique avec regroupement et tri */}
        {totalLignes > 0 && (
          <HierarchicalTreeView
            data={toutesLesLignes}
            allRows={allRows}
            onDataChange={(updatedData) => {
              // Séparer les données mises à jour en registre et controle
              const newRegistre = updatedData.filter(r => isValidCodeDechet(r.codeDechet));
              const newControle = updatedData.filter(r => !isValidCodeDechet(r.codeDechet));
              setRegistre(newRegistre);
              setControle(newControle);
              // Mettre à jour sessionStorage avec gestion d'erreur
              saveToSessionStorage('fluxmat_data', {
                registre: newRegistre,
                controle: newControle,
                fileName
              });
            }}
          />
        )}
      </section>

      <Footer />
    </main>
  );
}
