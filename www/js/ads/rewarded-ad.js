// js/ads/rewarded-ad.js
// Sistema de Anuncios de Recompensa (Rewarded Ads) con AdSense

(function(window) {
  'use strict';

  class RewardedAd {
  constructor() {
    this.adSenseLoaded = false;
    this.adSenseId = 'ca-pub-7829392929574421'; // Tu AdSense Publisher ID
    this.rewardedAdSlot = null; // Se configurará cuando se cree el slot en AdSense
    this.isShowing = false;
  }

  // Cargar AdSense
  async loadAdSense() {
    if (this.adSenseLoaded) return true;

    return new Promise((resolve) => {
      // Verificar si ya está cargado
      if (window.adsbygoogle) {
        this.adSenseLoaded = true;
        resolve(true);
        return;
      }

      // Crear script de AdSense
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.adSenseId}`;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        this.adSenseLoaded = true;
        console.log('✅ AdSense cargado para anuncios de recompensa');
        resolve(true);
      };
      
      script.onerror = () => {
        console.log('ℹ️ AdSense bloqueado por cliente (normal con bloqueadores de anuncios)');
        resolve(false);
      };

      document.head.appendChild(script);
    });
  }

  // Mostrar anuncio de recompensa
  async showRewardedAd(onRewarded, onError) {
    try {
      // Cargar AdSense primero
      const adSenseLoaded = await this.loadAdSense();
      
      if (!adSenseLoaded) {
        console.log('⚠️ AdSense no disponible, simulando recompensa');
        // Simular recompensa si AdSense no está disponible (para desarrollo)
        setTimeout(() => {
          if (onRewarded) onRewarded();
        }, 1000);
        return;
      }

      // Crear modal para mostrar el anuncio
      const modal = this.createAdModal();
      document.body.appendChild(modal);

      // Crear contenedor para el anuncio
      const adContainer = document.createElement('div');
      adContainer.id = 'rewarded-ad-container';
      adContainer.style.cssText = `
        width: 100%;
        max-width: 600px;
        min-height: 400px;
        margin: 20px auto;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #1a1a2e;
        border-radius: 8px;
        padding: 20px;
      `;

      // Crear anuncio intersticial de AdSense
      // NOTA: AdSense no tiene anuncios de recompensa nativos como AdMob
      // Usaremos un anuncio intersticial que se muestra en modal
      const adSenseAd = document.createElement('ins');
      adSenseAd.className = 'adsbygoogle';
      adSenseAd.style.display = 'block';
      adSenseAd.setAttribute('data-ad-client', this.adSenseId);
      // TODO: Reemplazar con un slot ID real cuando se cree en AdSense
      // Por ahora usamos un placeholder
      adSenseAd.setAttribute('data-ad-slot', this.rewardedAdSlot || '1234567890');
      adSenseAd.setAttribute('data-ad-format', 'auto');
      adSenseAd.setAttribute('data-full-width-responsive', 'true');

      adContainer.appendChild(adSenseAd);
      modal.querySelector('.ad-content').appendChild(adContainer);

      // Mostrar modal
      modal.style.display = 'flex';
      this.isShowing = true;

      // Inicializar AdSense
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log('✅ Anuncio de recompensa mostrado');
        
        // Simular que el usuario vio el anuncio completo después de 5 segundos
        // En producción, esto debería detectarse cuando el anuncio se cierra
        setTimeout(() => {
          this.closeAdModal(modal);
          if (onRewarded) {
            onRewarded();
          }
        }, 5000); // 5 segundos para simular visualización completa

      } catch (error) {
        console.error('❌ Error inicializando anuncio de recompensa:', error);
        this.closeAdModal(modal);
        if (onError) onError(error);
      }
      
    } catch (error) {
      console.error('❌ Error mostrando anuncio de recompensa:', error);
      if (onError) onError(error);
    }
  }

  // Crear modal para el anuncio
  createAdModal() {
    const modal = document.createElement('div');
    modal.id = 'rewarded-ad-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 30000;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Arial', sans-serif;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      color: #fff;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
      text-align: center;
    `;
    header.textContent = '📺 Mira un anuncio para obtener vidas extra';

    const content = document.createElement('div');
    content.className = 'ad-content';
    content.style.cssText = `
      width: 100%;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      align-items: center;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Cerrar';
    closeBtn.style.cssText = `
      margin-top: 20px;
      padding: 10px 20px;
      background: #e74c3c;
      color: #fff;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
    `;
    closeBtn.onclick = () => {
      this.closeAdModal(modal);
    };

    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(closeBtn);

    return modal;
  }

  // Cerrar modal del anuncio
  closeAdModal(modal) {
    if (modal && modal.parentNode) {
      modal.style.display = 'none';
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
    }
    this.isShowing = false;
  }

  // Verificar si está mostrando un anuncio
  isShowingAd() {
    return this.isShowing;
  }
  }

  // Exponer clase globalmente
  window.RewardedAd = RewardedAd;

})(window);

