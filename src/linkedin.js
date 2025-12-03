/**
 * Helper pour construire l'URL LinkedIn "Add to profile" pour les certifications
 * 
 * Note: LinkedIn utilise un formulaire pour ajouter des certifications au profil.
 * L'URL exacte peut varier selon les versions de LinkedIn. Cette implémentation
 * utilise la structure standard avec les paramètres de query string.
 * 
 * @param {Object} params - Les paramètres de la certification
 * @param {string} params.organizationName - Le nom de l'organisation LinkedIn
 * @param {string} params.formation - Le nom de la formation/certification
 * @param {string} params.certId - L'identifiant unique du certificat
 * @param {string} params.annee - L'année d'émission
 * @param {string} params.mois - Le mois d'émission (format: "01" à "12")
 * @param {string} params.pdfUrl - L'URL du PDF du diplôme
 * @returns {string} L'URL complète pour ajouter la certification au profil LinkedIn
 */
export function buildLinkedInAddToProfileUrl({ organizationName, formation, certId, annee, mois, pdfUrl }) {
  // LinkedIn utilise généralement cette structure pour ajouter des certifications
  // L'URL peut nécessiter que l'utilisateur soit connecté et redirigé vers le formulaire
  const baseUrl = 'https://www.linkedin.com/profile/add';
  
  const params = new URLSearchParams();
  
  // Paramètres obligatoires pour les certifications LinkedIn
  if (organizationName) {
    params.append('organizationName', organizationName);
  }
  
  if (formation) {
    params.append('name', formation);
  }
  
  if (certId) {
    params.append('certId', certId);
  }
  
  if (annee) {
    params.append('issueYear', annee);
  }
  
  if (mois) {
    // S'assurer que le mois est au format "01" à "12"
    const moisFormate = mois.padStart(2, '0');
    params.append('issueMonth', moisFormate);
  }
  
  if (pdfUrl) {
    params.append('certUrl', pdfUrl);
  }
  
  // Ajouter le type de tâche pour indiquer qu'il s'agit d'une certification
  params.append('startTask', 'CERTIFICATION_NAME');
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Génère le message par défaut pour le partage LinkedIn
 * 
 * @param {string} formation - Le nom de la formation
 * @param {string} organisationName - Le nom de l'organisation
 * @returns {string} Le message par défaut (sans l'URL du PDF)
 */
export function getDefaultLinkedInMessage(formation, organisationName) {
  return `Félicitations à moi! J'ai complété la formation « ${formation} » 🎓

Merci à ${organisationName} pour cette expérience enrichissante.`;
}

/**
 * Helper pour construire l'URL LinkedIn de partage de publication
 * 
 * @param {Object} params - Les paramètres du message
 * @param {string} params.message - Le message personnalisé à partager
 * @param {string} params.pdfUrl - L'URL du PDF à ajouter au message (optionnel)
 * @returns {string} L'URL complète pour partager sur LinkedIn
 */
export function buildLinkedInShareUrl({ message, pdfUrl }) {
  // Ajouter l'URL du PDF au message si fournie
  let finalMessage = message;
  if (pdfUrl) {
    // finalMessage = `${message}\n\n${pdfUrl}\n\nhttps://raw.githubusercontent.com/grindghost/partage-attestation-linkedin/refs/heads/main/src/assets/certificat.png`;
    finalMessage = `${message}\n\nhttps://raw.githubusercontent.com/grindghost/partage-attestation-linkedin/refs/heads/main/src/assets/certificat.png`;
  }
  
  // Encoder le texte pour l'URL
  const encodedText = encodeURIComponent(finalMessage);
  
  // Retourner l'URL de partage LinkedIn
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodedText}`;
}

