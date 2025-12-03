/**
 * Module pour le rendu de PDF en image côté client
 * 
 * Utilise pdfjs-dist pour charger et rendre la première page d'un PDF
 * dans un canvas, puis convertit le canvas en image (data URL).
 * 
 * Note: Le PDF doit être servi avec des en-têtes CORS compatibles
 * pour que le chargement fonctionne depuis le navigateur.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configuration du worker PDF.js
// Utiliser le worker depuis un CDN pour éviter les problèmes de chemin
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Rend la première page d'un PDF dans un canvas et retourne l'image
 * 
 * @param {string} pdfUrl - L'URL du PDF à charger
 * @param {number} scale - Échelle de rendu (défaut: 1.5 pour une bonne qualité)
 * @returns {Promise<{dataUrl: string, width: number, height: number}>}
 */
export async function renderPdfToImage(pdfUrl, scale = 1.5) {
  try {
    // Charger le document PDF
    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      // Options pour gérer les CORS si nécessaire
      httpHeaders: {},
      withCredentials: false,
    });
    
    const pdf = await loadingTask.promise;
    
    // Récupérer la première page
    const page = await pdf.getPage(1);
    
    // Calculer la viewport avec l'échelle
    const viewport = page.getViewport({ scale });
    
    // Créer un canvas temporaire pour le rendu
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Rendre la page dans le canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
    
    // Convertir le canvas en data URL (JPEG avec qualité 0.9)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    };
  } catch (error) {
    console.error('Erreur lors du rendu du PDF:', error);
    throw error;
  }
}

/**
 * Rend le PDF directement dans un canvas existant
 * 
 * @param {string} pdfUrl - L'URL du PDF à charger
 * @param {HTMLCanvasElement} canvas - Le canvas où rendre le PDF
 * @param {number} scale - Échelle de rendu (défaut: 1.5)
 * @returns {Promise<void>}
 */
export async function renderPdfToCanvas(pdfUrl, canvas, scale = 1.5) {
  try {
    // Charger le document PDF
    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      httpHeaders: {},
      withCredentials: false,
    });
    
    const pdf = await loadingTask.promise;
    
    // Récupérer la première page
    const page = await pdf.getPage(1);
    
    // Calculer la viewport avec l'échelle
    const viewport = page.getViewport({ scale });
    
    // Ajuster la taille du canvas
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Rendre la page dans le canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
  } catch (error) {
    console.error('Erreur lors du rendu du PDF dans le canvas:', error);
    throw error;
  }
}

