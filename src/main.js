/**
 * Point d'entrée principal de l'application
 * 
 * Gère :
 * - L'extraction et la validation des paramètres URL
 * - L'initialisation de l'interface utilisateur
 * - Le rendu du PDF en image
 * - La génération des liens LinkedIn
 */

import { buildLinkedInAddToProfileUrl, buildLinkedInShareUrl, getDefaultLinkedInMessage } from './linkedin.js';
import { renderPdfToImage, renderPdfToCanvas } from './pdfRenderer.js';

// Variable globale pour stocker la configuration
let appConfig = null;

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', async () => {
  // Afficher le loader
  showLoader();
  
  try {
    // Charger la configuration en premier
    await loadConfiguration();
    
    // Extraire les paramètres de l'URL
    const params = new URLSearchParams(window.location.search);
    
    const urlParams = {
      pdf: params.get('pdf'),
      prenom: params.get('prenom'),
      mois: params.get('mois'),
      annee: params.get('annee'),
      orgId: params.get('orgId'),
      formation: params.get('formation'),
      certId: params.get('certId'),
    };
    
    // Valider les paramètres obligatoires
    const requiredParams = {
      pdf: urlParams.pdf,
      formation: urlParams.formation,
      certId: urlParams.certId,
    };
    
    const missingParams = Object.keys(requiredParams).filter(
      key => !requiredParams[key]
    );
    
    // Vérifier que appConfig a été chargé correctement (org valide)
    if (!appConfig) {
      hideLoader();
      displaySimpleErrorPage();
      return;
    }
    
    // Afficher un message d'erreur si des paramètres manquent
    if (missingParams.length > 0) {
      hideLoader();
      displaySimpleErrorPage();
      return;
    }
    
    // Afficher le contenu principal
    const contentElement = document.getElementById('content');
    contentElement.classList.remove('hidden');
    
    // Personnaliser le titre avec le prénom si disponible
    personalizeTitle(urlParams.prenom);
    
    // Initialiser le rendu du PDF
    initializePdfPreview(urlParams.pdf);
    
    // Afficher le badge certId si disponible
    displayCertIdBadge(urlParams.certId);
    
    // Générer et configurer les liens LinkedIn
    initializeLinkedInLinks(urlParams);
    
    // Restaurer l'état de complétion depuis localStorage
    restoreCompletionState(urlParams);
    
    // Ajouter les écouteurs d'événements pour sauvegarder l'état
    setupCompletionTracking(urlParams);
    
    // Masquer le loader une fois tout chargé
    hideLoader();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    hideLoader();
    
    // Afficher la page d'erreur simple pour toutes les erreurs
    displaySimpleErrorPage();
  }
});

/**
 * Charge la configuration depuis le fichier config.json
 * Le paramètre d'URL 'org' détermine quelle configuration utiliser
 * @throws {Error} Si l'organisation spécifiée n'existe pas dans la configuration
 */
async function loadConfiguration() {
  const params = new URLSearchParams(window.location.search);
  const orgId = params.get('org');
  
  // Vérifier si le paramètre org est manquant
  if (!orgId || orgId.trim() === '') {
    // Charger la config pour obtenir la liste des organisations disponibles
    try {
      const response = await fetch('/config.json');
      if (response.ok) {
        const configData = await response.json();
        const availableOrgs = Object.keys(configData).join(', ');
        throw new Error(`CONFIG_NOT_FOUND::${availableOrgs}`);
      }
    } catch (error) {
      // Si c'est déjà notre erreur, la relancer
      if (error.message && error.message.startsWith('CONFIG_NOT_FOUND:')) {
        throw error;
      }
    }
    // Si on ne peut pas charger la config, lancer quand même l'erreur
    throw new Error('CONFIG_NOT_FOUND::');
  }
  
  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error(`Erreur de chargement de la configuration: ${response.status}`);
    }
    
    const configData = await response.json();
    
    if (!configData[orgId]) {
      // Lancer une erreur si l'organisation n'existe pas
      const availableOrgs = Object.keys(configData).join(', ');
      throw new Error(`CONFIG_NOT_FOUND:${orgId}:${availableOrgs}`);
    }
    
    appConfig = configData[orgId];
    
    // Appliquer la configuration
    applyConfiguration(appConfig);
  } catch (error) {
    // Si c'est une erreur de configuration manquante, la relancer
    if (error.message && error.message.startsWith('CONFIG_NOT_FOUND:')) {
      throw error;
    }
    // Pour les autres erreurs (réseau, etc.), lancer une erreur générique
    // pour afficher la page d'erreur simple
    throw new Error('CONFIG_NOT_FOUND::');
  }
}

/**
 * Applique la configuration chargée à l'interface
 * 
 * @param {Object} config - La configuration à appliquer
 */
function applyConfiguration(config) {
  // Mettre à jour le favicon
  const favicon = document.getElementById('favicon');
  if (config.favicon && favicon) {
    favicon.href = `/${config.favicon}`;
  }
  
  // Mettre à jour le logo dans le header
  const headerLogo = document.getElementById('header-logo');
  if (config.logo && headerLogo) {
    headerLogo.src = `/${config.logo}`;
  }
  
  // Mettre à jour le lien du header avec l'URL du site de l'organisation
  const headerLink = document.getElementById('header-link');
  if (config.websiteUrl && headerLink) {
    headerLink.href = config.websiteUrl;
  }
  
  // Mettre à jour le titre de la page
  const pageTitle = document.getElementById('page-title');
  if (config.organizationName && pageTitle) {
    pageTitle.textContent = `Partage de Certification - ${config.organizationName}`;
  }
}

/**
 * Affiche le loader
 */
function showLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.classList.remove('hidden');
  }
}

/**
 * Masque le loader
 */
function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.classList.add('hidden');
  }
}

/**
 * Masque le favicon en le remplaçant par un favicon transparent
 */
function hideFavicon() {
  const favicon = document.getElementById('favicon');
  if (favicon) {
    // Créer un SVG transparent en data URI pour remplacer le favicon
    // Utiliser un SVG 16x16 avec un fond transparent
    const transparentSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16"%3E%3Crect width="16" height="16" fill="transparent"/%3E%3C/svg%3E';
    
    // Retirer l'ancien favicon
    favicon.remove();
    
    // Créer un nouveau lien favicon transparent
    const newFavicon = document.createElement('link');
    newFavicon.id = 'favicon';
    newFavicon.rel = 'icon';
    newFavicon.type = 'image/svg+xml';
    newFavicon.href = transparentSvg;
    
    // Ajouter au head
    document.head.appendChild(newFavicon);
    
    // Forcer la mise à jour en changeant à nouveau l'href avec un timestamp
    setTimeout(() => {
      newFavicon.href = transparentSvg + '?t=' + Date.now();
    }, 10);
  }
}

/**
 * Retire le lien du header en transformant le <a> en <div>
 * Utilisé sur les pages d'erreur pour désactiver le lien
 */
function removeHeaderLink() {
  const headerLink = document.getElementById('header-link');
  if (headerLink && headerLink.tagName === 'A') {
    // Créer un div avec les mêmes classes et contenu
    const div = document.createElement('div');
    div.className = headerLink.className;
    div.id = headerLink.id;
    
    // Copier tous les enfants
    while (headerLink.firstChild) {
      div.appendChild(headerLink.firstChild);
    }
    
    // Remplacer le lien par le div
    headerLink.parentNode.replaceChild(div, headerLink);
  }
}

/**
 * Affiche une page d'erreur simple (fond gris, message au centre, pas de header)
 * Utilisée quand des paramètres manquent ou que l'organisation est invalide
 */
function displaySimpleErrorPage() {
  // Masquer tous les éléments existants
  const header = document.querySelector('header');
  const main = document.querySelector('main');
  const footer = document.querySelector('footer');
  const loader = document.getElementById('loader');
  
  if (header) header.style.display = 'none';
  if (main) main.style.display = 'none';
  if (footer) footer.style.display = 'none';
  if (loader) loader.style.display = 'none';
  
  // Masquer le favicon dans l'onglet
  hideFavicon();
  
  // Changer le fond du body en gris
  document.body.style.backgroundColor = '#808080';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  
  // Créer et afficher le message d'erreur
  const errorPage = document.createElement('div');
  errorPage.className = 'error-page-simple';
  errorPage.innerHTML = '<div class="error-page-simple-message">Cette page n\'existe pas</div>';
  
  document.body.appendChild(errorPage);
}

/**
 * Affiche un message d'erreur si des paramètres sont manquants
 * 
 * @param {string[]} missingParams - Liste des paramètres manquants
 */
function displayErrorMessage(missingParams) {
  // Utiliser la page d'erreur simple au lieu du message détaillé
  displaySimpleErrorPage();
}

/**
 * Affiche un message d'erreur si l'organisation spécifiée n'existe pas
 * 
 * @param {string} orgId - L'identifiant de l'organisation demandée
 * @param {string} availableOrgs - Liste des organisations disponibles (séparées par des virgules)
 */
function displayConfigNotFoundError(orgId, availableOrgs) {
  // Utiliser la page d'erreur simple au lieu du message détaillé
  displaySimpleErrorPage();
}

/**
 * Personnalise le titre avec le prénom de l'utilisateur
 * 
 * @param {string} prenom - Le prénom de l'utilisateur (optionnel)
 */
function personalizeTitle(prenom) {
  const greetingElement = document.getElementById('title-greeting');
  const subtitleElement = document.getElementById('title-subtitle');
  
  if (prenom && prenom.trim()) {
    // Capitaliser la première lettre du prénom
    const prenomCapitalized = prenom.trim().charAt(0).toUpperCase() + prenom.trim().slice(1).toLowerCase();
    greetingElement.textContent = `Bonjour ${prenomCapitalized}!`;
    subtitleElement.classList.remove('hidden');
  } else {
    // Garder le message par défaut si pas de prénom
    greetingElement.textContent = 'Partagez votre réussite sur LinkedIn';
    subtitleElement.classList.add('hidden');
  }
}

/**
 * Affiche le badge avec le certId dans le coin supérieur droit de l'aperçu
 * 
 * @param {string} certId - L'identifiant du certificat (optionnel)
 */
function displayCertIdBadge(certId) {
  const badge = document.getElementById('cert-id-badge');
  const certIdValue = document.getElementById('cert-id-value');
  
  if (certId && certId.trim()) {
    certIdValue.textContent = certId;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

/**
 * Initialise le rendu du PDF en image
 * 
 * @param {string} pdfUrl - L'URL du PDF à afficher
 */
async function initializePdfPreview(pdfUrl) {
  const canvas = document.getElementById('pdf-canvas');
  const image = document.getElementById('certificate-image');
  const fallbackMessage = document.getElementById('fallback-message');
  const pdfLink = document.getElementById('pdf-link');
  const pdfLinkPreview = document.getElementById('pdf-link-preview');
  
  // Configurer le lien sous l'image pour ouvrir le PDF
  pdfLinkPreview.href = pdfUrl;
  
  try {
    // Option 1: Rendre directement dans le canvas
    await renderPdfToCanvas(pdfUrl, canvas, 1.5);
    canvas.classList.remove('hidden');
    
    // Option alternative: Convertir en image (décommenter si préféré)
    // const { dataUrl } = await renderPdfToImage(pdfUrl, 1.5);
    // image.src = dataUrl;
    // image.classList.remove('hidden');
    
  } catch (error) {
    console.error('Erreur lors du chargement du PDF:', error);
    
    // Afficher le message de fallback
    canvas.classList.add('hidden');
    image.classList.add('hidden');
    pdfLinkPreview.classList.add('hidden');
    fallbackMessage.classList.remove('hidden');
    
    // Configurer le lien vers le PDF
    pdfLink.href = pdfUrl;
  }
}

/**
 * Initialise les liens LinkedIn (Add to profile et Share)
 * 
 * @param {Object} urlParams - Les paramètres extraits de l'URL
 */
function initializeLinkedInLinks(urlParams) {
  // Étape 1: Lien "Add to profile"
  const addToProfileButton = document.getElementById('add-to-profile');
  const organizationName = appConfig?.organizationName || 'Collège des administrateurs de sociétés';
  const addToProfileUrl = buildLinkedInAddToProfileUrl({
    organizationName: organizationName,
    formation: urlParams.formation,
    certId: urlParams.certId,
    annee: urlParams.annee,
    mois: urlParams.mois,
    pdfUrl: urlParams.pdf,
  });
  addToProfileButton.href = addToProfileUrl;
  
  // Étape 2: Lien "Share post" - Initialiser le textarea et le gestionnaire
  initializeMessageEditor(urlParams);
}

/**
 * Initialise l'éditeur de message pour le partage LinkedIn
 * 
 * @param {Object} urlParams - Les paramètres extraits de l'URL
 */
function initializeMessageEditor(urlParams) {
  const textarea = document.getElementById('linkedin-message');
  const charCount = document.getElementById('char-count');
  const resetLink = document.getElementById('reset-message');
  const shareButton = document.getElementById('share-on-linkedin');
  const organisationName = appConfig?.organizationName || 'Collège des administrateurs de sociétés';
  
  // Générer le message par défaut (sans l'URL du PDF)
  const defaultMessage = getDefaultLinkedInMessage(
    urlParams.formation,
    organisationName
  );
  
  // Initialiser le textarea avec le message par défaut
  textarea.value = defaultMessage;
  updateCharCount(textarea, charCount);
  // Ne pas mettre à jour l'URL ici, elle sera construite au clic avec l'URL du PDF
  
  // Mettre à jour le compteur lors de la saisie (mais pas l'URL)
  textarea.addEventListener('input', () => {
    updateCharCount(textarea, charCount);
  });
  
  // Réinitialiser au message par défaut
  resetLink.addEventListener('click', (e) => {
    e.preventDefault();
    textarea.value = defaultMessage;
    updateCharCount(textarea, charCount);
    textarea.focus();
  });
  
  // Construire l'URL de partage avec l'URL du PDF au moment du clic
  shareButton.addEventListener('click', (e) => {
    const messageWithUrl = buildLinkedInShareUrl({
      message: textarea.value,
      pdfUrl: urlParams.pdf,
    });
    shareButton.href = messageWithUrl;
    // Laisser le lien s'ouvrir normalement
  });
}

/**
 * Met à jour le compteur de caractères
 * 
 * @param {HTMLTextAreaElement} textarea - Le textarea
 * @param {HTMLElement} charCount - L'élément affichant le compteur
 */
function updateCharCount(textarea, charCount) {
  const current = textarea.value.length;
  const max = parseInt(textarea.getAttribute('maxlength')) || 3000;
  const remaining = max - current;
  
  charCount.textContent = `${current} / ${max} caractères`;
  
  // Changer la couleur si on approche de la limite
  if (remaining < 100) {
    charCount.classList.add('char-count-warning');
  } else {
    charCount.classList.remove('char-count-warning');
  }
  
  if (remaining < 0) {
    charCount.classList.add('char-count-error');
  } else {
    charCount.classList.remove('char-count-error');
  }
}


/**
 * Génère une clé unique pour le localStorage basée sur les paramètres du certificat
 * 
 * @param {Object} urlParams - Les paramètres extraits de l'URL
 * @returns {string} La clé unique pour ce certificat
 */
function getStorageKey(urlParams) {
  // Utiliser certId si disponible, sinon combiner plusieurs paramètres
  if (urlParams.certId) {
    return `cert_completion_${urlParams.certId}`;
  }
  // Fallback: combiner pdf + formation + organizationName pour créer une clé unique
  const organizationName = appConfig?.organizationName || 'Collège des administrateurs de sociétés';
  const keyParts = [
    urlParams.pdf,
    urlParams.formation,
    organizationName,
  ].filter(Boolean);
  return `cert_completion_${btoa(keyParts.join('|')).replace(/[+/=]/g, '')}`;
}

/**
 * Restaure l'état de complétion depuis le localStorage
 * 
 * @param {Object} urlParams - Les paramètres extraits de l'URL
 */
function restoreCompletionState(urlParams) {
  const storageKey = getStorageKey(urlParams);
  const savedState = localStorage.getItem(storageKey);
  
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      
      // Gérer la compatibilité avec l'ancien format (step1/step2 comme booléens)
      // et le nouveau format (step1/step2 comme objets)
      let step1Completed = false;
      let step2Completed = false;
      let step1Timestamp = null;
      let step2Timestamp = null;
      
      if (typeof state.step1 === 'object' && state.step1 !== null) {
        // Nouveau format : objet avec completed et timestamp
        step1Completed = state.step1.completed || false;
        step1Timestamp = state.step1.timestamp || null;
      } else if (typeof state.step1 === 'boolean') {
        // Ancien format : booléen simple
        step1Completed = state.step1;
        step1Timestamp = state.step1Timestamp || null;
      }
      
      if (typeof state.step2 === 'object' && state.step2 !== null) {
        // Nouveau format : objet avec completed et timestamp
        step2Completed = state.step2.completed || false;
        step2Timestamp = state.step2.timestamp || null;
      } else if (typeof state.step2 === 'boolean') {
        // Ancien format : booléen simple
        step2Completed = state.step2;
        step2Timestamp = state.step2Timestamp || null;
      }
      
      // Afficher les indicateurs de complétion
      if (step1Completed) {
        const step1Indicator = document.getElementById('step1-complete');
        step1Indicator.classList.remove('hidden');
      }
      
      if (step2Completed) {
        const step2Indicator = document.getElementById('step2-complete');
        step2Indicator.classList.remove('hidden');
      }
      
      // Vérifier si l'utilisateur a déjà partagé (step1 ou step2)
      const hasShared = step1Completed || step2Completed;
      
      // Trouver le timestamp le plus récent
      const timestamps = [];
      if (step1Timestamp) {
        timestamps.push(parseInt(step1Timestamp));
      }
      if (step2Timestamp) {
        timestamps.push(parseInt(step2Timestamp));
      }
      
      // Vérifier le délai depuis le dernier timestamp si l'utilisateur a partagé
      if (hasShared && timestamps.length > 0) {
        const mostRecentTimestamp = Math.max(...timestamps);
        const now = Date.now();
        const timeElapsed = now - mostRecentTimestamp;
        const twoMinutesInMs = 2 * 60 * 1000; // 2 minutes en millisecondes
        
        // Si plus de 2 minutes se sont écoulées depuis le dernier partage, masquer les étapes
        if (timeElapsed > twoMinutesInMs) {
          const stepsElement = document.querySelector('.steps');
          const titleBanner = document.querySelector('.title-banner');
          
          if (stepsElement) {
            stepsElement.classList.add('hidden');
          }
          
          if (titleBanner) {
            titleBanner.classList.add('hidden');
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la restauration de l\'état:', error);
    }
  }
}

/**
 * Configure le suivi de complétion des étapes
 * 
 * @param {Object} urlParams - Les paramètres extraits de l'URL
 */
function setupCompletionTracking(urlParams) {
  const storageKey = getStorageKey(urlParams);
  const addToProfileButton = document.getElementById('add-to-profile');
  const shareButton = document.getElementById('share-on-linkedin');
  const step1Indicator = document.getElementById('step1-complete');
  const step2Indicator = document.getElementById('step2-complete');
  
  // Fonction pour sauvegarder l'état
  const saveState = (step, completed) => {
    const currentState = localStorage.getItem(storageKey);
    let state = {};
    
    if (currentState) {
      try {
        state = JSON.parse(currentState);
      } catch (error) {
        console.error('Erreur lors de la lecture de l\'état:', error);
      }
    }
    
    // Convertir l'ancien format en nouveau format si nécessaire
    if (typeof state.step1 === 'boolean') {
      state.step1 = {
        completed: state.step1,
        timestamp: state.step1Timestamp || null
      };
      delete state.step1Timestamp;
    }
    if (typeof state.step2 === 'boolean') {
      state.step2 = {
        completed: state.step2,
        timestamp: state.step2Timestamp || null
      };
      delete state.step2Timestamp;
    }
    
    // Initialiser l'objet de l'étape si nécessaire
    if (!state[step] || typeof state[step] !== 'object') {
      state[step] = {
        completed: false,
        timestamp: null
      };
    }
    
    // Mettre à jour l'état de l'étape
    state[step].completed = completed;
    
    // Sauvegarder le timestamp pour cette étape lors du clic
    if (completed && (step === 'step1' || step === 'step2')) {
      state[step].timestamp = Date.now();
    }
    
    // Nettoyer l'ancien format timestamp global si présent
    if (state.timestamp) {
      delete state.timestamp;
    }
    
    localStorage.setItem(storageKey, JSON.stringify(state));
  };
  
  // Écouteur pour l'étape 1
  addToProfileButton.addEventListener('click', () => {
    // Délai pour permettre l'ouverture du lien
    setTimeout(() => {
      step1Indicator.classList.remove('hidden');
      saveState('step1', true);
    }, 100);
  });
  
  // Écouteur pour l'étape 2
  shareButton.addEventListener('click', () => {
    // Délai pour permettre l'ouverture du lien
    setTimeout(() => {
      step2Indicator.classList.remove('hidden');
      saveState('step2', true);
    }, 100);
  });
}

