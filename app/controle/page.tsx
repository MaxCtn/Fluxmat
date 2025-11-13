'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ControlTable from '../../components/ControlTable';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useRouter } from 'next/navigation';
import { AlertModal } from '../../components/Modal';
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

  function onValidateCorrections(rows: any[]) {
    const fixed = rows.filter(r => isValidCodeDechet(r.codeDechet));
    const remaining = rows.filter(r => !isValidCodeDechet(r.codeDechet));
    
    // Mettre à jour sessionStorage avec gestion d'erreur
    saveToSessionStorage('fluxmat_data', {
      registre: [...(registre), ...fixed],
      controle: remaining,
      fileName: fileName || ''
    });
    
    setControle(remaining);
    setRegistre([...registre, ...fixed]);
    
    if (remaining.length === 0) {
      setModalState({ 
        isOpen: true, 
        message: 'Toutes les lignes ont été corrigées ! Redirection vers l\'export.',
        fixed: fixed.length,
        remaining: 0 
      });
      setTimeout(() => {
        router.push('/export');
      }, 2000);
    } else {
      setModalState({ 
        isOpen: true, 
        message: `${fixed.length} lignes corrigées. ${remaining.length} lignes restent à traiter.`,
        fixed: fixed.length,
        remaining: remaining.length 
      });
    }
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

  if (!controle.length) {
    return (
      <main className="min-h-dvh bg-gray-50">
        <Header />
        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Toutes les lignes ont un code déchet valide</h2>
            <p className="text-gray-600 mb-6">Vous pouvez passer à l'export.</p>
            <Link 
              href="/export" 
              className="inline-block rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 transition shadow-md hover:shadow-lg"
            >
              Aller à l'Export →
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
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Contrôle des lignes sans code déchet</h1>
          <p className="text-gray-600">Corrigez les codes déchets manquants ou utilisez les suggestions automatiques.</p>
        </div>

        {/* Stats */}
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-lg">
                {controle.length}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">Lignes à corriger</h3>
                <p className="text-sm text-red-700">Code déchet manquant ou invalide</p>
              </div>
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
        </div>

        {/* Tableau de contrôle */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <ControlTable rows={controle} onValidate={onValidateCorrections} />
        </div>

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
    </main>
  );
}
