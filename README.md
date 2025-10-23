# 🚀 FluxMat — Portail Matériaux

<div align="center">

![FluxMat Logo](https://img.shields.io/badge/FluxMat-Portail%20Matériaux-blue?style=for-the-badge&logo=recycle)

**Plateforme de gestion des flux de déchets et matériaux pour Eiffage**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.6-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat&logo=vercel)](https://vercel.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.18-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

[🌐 **Application Live**](https://fluxmat.vercel.app/) | [📚 **Documentation**](#documentation) | [🚀 **Déploiement**](#deployment)

</div>

---

## 📋 Table des matières

- [🎯 Vue d'ensemble](#-vue-densemble)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [🚀 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [📊 Utilisation](#-utilisation)
- [🔒 Sécurité](#-sécurité)
- [🌐 Déploiement](#-déploiement)
- [📈 Roadmap](#-roadmap)
- [🤝 Contribution](#-contribution)

---

## 🎯 Vue d'ensemble

**FluxMat** est une application web moderne développée pour **Eiffage** afin de gérer efficacement les flux de déchets et matériaux. L'application permet l'import, le contrôle qualité, et l'export de données provenant de fichiers Excel exportés depuis PRC/PIDOT.

### 🎪 Workflow principal
```
Import Excel → Contrôle Qualité → Sauvegarde Base → Export CSV
```

---

## ✨ Fonctionnalités

### 📥 **Import de données**
- **Support multi-formats** : `.xlsx`, `.xls`
- **Mapping intelligent** : Reconnaissance automatique des colonnes
- **Validation** : Contrôle de la structure des données
- **Prévisualisation** : Affichage des données avant traitement

### 🔍 **Contrôle qualité**
- **Détection automatique** des codes déchet manquants
- **Suggestions intelligentes** basées sur les mots-clés
- **Interface de correction** intuitive
- **Validation en temps réel**

### 💾 **Gestion des données**
- **Base Supabase** : Stockage sécurisé et scalable
- **Déduplication** : Prévention des doublons automatique
- **Historique** : Traçabilité complète des opérations
- **Synchronisation** : Données disponibles en temps réel

### 📊 **Visualisation**
- **Synthèses par exutoire** : Vue d'ensemble des flux
- **Statistiques détaillées** : Quantités, unités, nombre de lignes
- **Tableaux interactifs** : Navigation et filtrage
- **Export CSV** : Génération de rapports

---

## 🏗️ Architecture

### 🛠️ **Stack technique**

| Composant | Technologie | Version | Rôle |
|-----------|-------------|---------|------|
| **Frontend** | Next.js | 15.5.6 | Framework React full-stack |
| **Language** | TypeScript | 5.9.3 | Typage statique |
| **Styling** | Tailwind CSS | 3.4.18 | Framework CSS utilitaire |
| **Base de données** | Supabase | Latest | PostgreSQL as a Service |
| **Déploiement** | Vercel | Latest | Plateforme de déploiement |
| **Gestionnaire** | pnpm | 10.x | Gestionnaire de paquets |

### 📁 **Structure du projet**

```
Fluxmat/
├── 📁 app/                    # Pages et APIs Next.js
│   ├── 📁 api/                # Routes API
│   │   ├── 📁 db/             # APIs base de données
│   │   └── 📁 transform/      # APIs transformation
│   ├── 📄 page.tsx            # Page principale
│   └── 📄 layout.tsx          # Layout global
├── 📁 components/             # Composants React
│   ├── 📄 ControlTable.tsx    # Table de contrôle
│   ├── 📄 DBActive.tsx        # Vue base active
│   ├── 📄 ExutoireSummary.tsx # Synthèse exutoires
│   └── 📄 FileDrop.tsx        # Zone de dépôt
├── 📁 lib/                    # Logique métier
│   ├── 📄 supabaseServer.ts   # Client Supabase
│   └── 📄 transform.ts        # Transformation données
├── 📄 package.json            # Dépendances
├── 📄 vercel.json             # Config Vercel
└── 📄 README.md               # Documentation
```

---

## 🚀 Installation

### 📋 **Prérequis**
- **Node.js** : Version 18+ recommandée
- **pnpm** : Gestionnaire de paquets
- **Git** : Contrôle de version

### 🔧 **Installation locale**

```bash
# 1. Cloner le repository
git clone https://github.com/MaxCtn/Fluxmat.git
cd Fluxmat

# 2. Installer les dépendances
pnpm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# 4. Démarrer le serveur de développement
pnpm dev

# 5. Ouvrir l'application
# http://localhost:3000
```

---

## ⚙️ Configuration

### 🔑 **Variables d'environnement**

Créez un fichier `.env.local` avec les variables suivantes :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Vercel Configuration (optionnel)
VERCEL_TEAM_ID=team_xxx
VERCEL_PROJECT_ID=prj_xxx
```

### 🗄️ **Configuration Supabase**

1. **Créer un projet** sur [supabase.com](https://supabase.com)
2. **Exécuter le script SQL** :
```sql
   -- Voir create_table.sql pour le schéma complet
   ```
3. **Configurer RLS** (Row Level Security) selon vos besoins

---

## 📊 Utilisation

### 🎯 **Workflow utilisateur**

#### 1. **Import de fichier**
- Glissez-déposez un fichier Excel dans la zone d'import
- L'application analyse automatiquement la structure
- Prévisualisation des données détectées

#### 2. **Contrôle qualité**
- Vérification des codes déchet manquants
- Suggestions automatiques basées sur les libellés
- Interface de correction intuitive

#### 3. **Sauvegarde**
- Enregistrement en base Supabase
- Déduplication automatique des doublons
- Confirmation du nombre de lignes insérées

#### 4. **Visualisation**
- Synthèses par exutoire
- Statistiques détaillées
- Export CSV des données

### 🎨 **Interface utilisateur**

- **Design responsive** : Compatible mobile et desktop
- **Navigation par onglets** : Import, Contrôle, Export
- **Feedback visuel** : États de chargement et confirmations
- **Accessibilité** : Conforme aux standards WCAG

---

## 🔒 Sécurité

### 🛡️ **Mesures de sécurité**

- **Variables d'environnement** : Clés sensibles protégées
- **Row Level Security** : Contrôle d'accès au niveau base
- **Validation côté serveur** : Vérification des données
- **HTTPS obligatoire** : Communication chiffrée
- **Repository privé** : Code source protégé

### 🔐 **Bonnes pratiques**

- ✅ Ne jamais commiter de clés API
- ✅ Utiliser des variables d'environnement
- ✅ Valider toutes les entrées utilisateur
- ✅ Implémenter des logs de sécurité
- ✅ Mettre à jour régulièrement les dépendances

---

## 🌐 Déploiement

### 🚀 **Déploiement Vercel**

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Se connecter à Vercel
vercel login

# 3. Déployer
vercel --prod

# 4. Configurer les variables d'environnement
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### 🔗 **URLs de déploiement**

- **Production** : [https://fluxmat.vercel.app](https://fluxmat.vercel.app)
- **Repository** : [https://github.com/MaxCtn/Fluxmat](https://github.com/MaxCtn/Fluxmat)

---

## 📈 Roadmap

### 🎯 **Fonctionnalités futures**

- [ ] **Authentification** : Système de connexion utilisateur
- [ ] **Rôles et permissions** : Gestion des accès par équipe
- [ ] **API REST** : Endpoints pour intégrations externes
- [ ] **Notifications** : Alertes par email/SMS
- [ ] **Rapports avancés** : Graphiques et analyses
- [ ] **Import en lot** : Traitement de multiples fichiers
- [ ] **Synchronisation** : Intégration avec PRC/PIDOT
- [ ] **Mobile app** : Application native React Native

### 🔧 **Améliorations techniques**

- [ ] **Tests automatisés** : Suite de tests complète
- [ ] **CI/CD** : Pipeline de déploiement automatisé
- [ ] **Monitoring** : Surveillance des performances
- [ ] **Cache Redis** : Optimisation des performances
- [ ] **CDN** : Distribution de contenu global

---

## 🤝 Contribution

### 👥 **Équipe de développement**

- **Lead Developer** : Maxime C.
- **Architecture** : Next.js + Supabase
- **Design** : Tailwind CSS + DaisyUI

### 📝 **Guidelines de contribution**

1. **Fork** le repository
2. **Créer** une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. **Commiter** les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. **Pousser** vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. **Ouvrir** une Pull Request

### 🐛 **Signaler un bug**

Utilisez les [GitHub Issues](https://github.com/MaxCtn/Fluxmat/issues) avec :
- Description détaillée du problème
- Étapes pour reproduire
- Environnement (OS, navigateur, version)
- Captures d'écran si applicable

---

## 📞 Support

### 🆘 **Aide et support**

- **Documentation** : Ce README et les commentaires dans le code
- **Issues GitHub** : [Signaler un problème](https://github.com/MaxCtn/Fluxmat/issues)
- **Email** : Contactez l'équipe de développement

### 📚 **Ressources utiles**

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation Vercel](https://vercel.com/docs)

---

<div align="center">

**🚀 FluxMat — Gestion intelligente des flux de matériaux**

*Développé avec ❤️ pour Eiffage*

[![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-green?style=flat&logo=supabase)](https://supabase.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)](https://vercel.com/)

</div>