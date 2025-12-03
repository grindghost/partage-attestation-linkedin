# Partage d'Attestation - Application Web

Application web statique pour permettre aux participants d'une formation de partager leur diplôme sur LinkedIn.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

### Build pour production

```bash
npm run build
```

Le dossier `dist/` contiendra les fichiers prêts pour le déploiement.

### Prévisualisation du build

```bash
npm run preview
```

## 📦 Déploiement sur Vercel

1. **Installer Vercel CLI** (optionnel) :
   ```bash
   npm install -g vercel
   ```

2. **Déployer** :
   ```bash
   vercel
   ```
   
   Ou connectez votre dépôt GitHub à Vercel pour un déploiement automatique.

## 📝 Paramètres URL

L'application accepte les paramètres suivants dans l'URL :

- `org` (obligatoire) : Identifiant de l'organisation dans config.json (ex: `cas`)
- `pdf` (obligatoire) : URL encodée du PDF du diplôme
- `prenom` : Prénom du participant
- `mois` : Mois d'émission (ex: `12` ou `05`)
- `annee` : Année d'émission (ex: `2025`)
- `formation` (obligatoire) : Nom de la formation
- `certId` : Identifiant unique du certificat

**Note :** Le nom de l'organisation (`organizationName`) utilisé pour l'URL LinkedIn est maintenant chargé depuis le fichier `config.json` et ne doit plus être passé en paramètre URL.

### Exemple d'URL

```
https://mon-app.vercel.app/?org=cas&pdf=https%3A%2F%2Fexemple.com%2Fdiplome.pdf&prenom=Alexandre&mois=12&annee=2025&formation=Certification%20en%20gouvernance&certId=ASC-2024-00123
```

## ⚠️ Notes importantes

- **CORS** : Le PDF doit être servi avec des en-têtes CORS compatibles pour que le rendu fonctionne côté client.
- **LinkedIn** : Les liens générés ouvrent LinkedIn dans un nouvel onglet. L'utilisateur doit valider manuellement les actions dans LinkedIn.
- **PDF.js** : L'application utilise `pdfjs-dist` pour le rendu des PDFs. Le worker est chargé depuis un CDN.

## 🛠️ Technologies

- **Vite** : Build tool et serveur de développement
- **PDF.js** : Rendu de PDF côté client
- **Vanilla JavaScript** : Pas de framework, JavaScript pur

## 📄 Licence

Ce projet est destiné à un usage interne.

