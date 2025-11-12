// js/ads/web-banner.js
// Sistema de Banner para Web (AdSense)

export class WebBanner {
  constructor() {
    this.isLoaded = false;
    this.isVisible = false;
    this.bannerElement = null;
    this.adSenseLoaded = false;
    this.adSenseId = 'ca-pub-7829392929574421'; // Tu AdSense Publisher ID
  }

  // Método initialize requerido por UnifiedBanner
  async initialize() {
    try {
      console.log('🌐 Inicializando WebBanner...');
      // Pre-cargar AdSense
      await this.loadAdSense();
      console.log('✅ WebBanner inicializado');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando WebBanner:', error);
      return false;
    }
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
        console.log('✅ AdSense cargado');
        resolve(true);
      };
      
      script.onerror = () => {
        console.log('ℹ️ AdSense bloqueado por cliente (normal con bloqueadores de anuncios)');
        resolve(false);
      };

      document.head.appendChild(script);
    });
  }

  // Crear banner con AdSense
  createBannerElement() {
    if (this.bannerElement) return this.bannerElement;

    const banner = document.createElement('div');
    banner.id = 'web-banner-ad';
    banner.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 90px;
      background: transparent;
      border-top: none;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Crear contenedor para el anuncio
    const adContainer = document.createElement('div');
    adContainer.style.cssText = `
      width: 100%;
      max-width: 728px;
      height: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Crear anuncio de AdSense
    const adSenseAd = document.createElement('ins');
    adSenseAd.className = 'adsbygoogle';
    adSenseAd.style.display = 'block';
    adSenseAd.setAttribute('data-ad-client', this.adSenseId);
    adSenseAd.setAttribute('data-ad-slot', '1234567890'); // Necesitarás crear un slot en AdSense
    adSenseAd.setAttribute('data-ad-format', 'auto');
    adSenseAd.setAttribute('data-full-width-responsive', 'true');

    adContainer.appendChild(adSenseAd);
    banner.appendChild(adContainer);

    this.bannerElement = banner;
    return banner;
  }

  // Mostrar Banner
  async showBanner() {
    try {
      // Cargar AdSense primero
      const adSenseLoaded = await this.loadAdSense();
      if (!adSenseLoaded) {
        console.log('⚠️ AdSense no disponible, mostrando placeholder');
        return this.showPlaceholderBanner();
      }

      const banner = this.createBannerElement();
      
      if (!document.body.contains(banner)) {
        document.body.appendChild(banner);
      }
      
      banner.style.display = 'flex';
      this.isLoaded = true;
      this.isVisible = true;
      
      // Inicializar AdSense
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log('✅ Banner AdSense mostrado');
      } catch (error) {
        console.error('❌ Error inicializando AdSense:', error);
        return this.showPlaceholderBanner();
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error mostrando banner web:', error);
      return this.showPlaceholderBanner();
    }
  }

  // Mostrar banner placeholder como fallback
  async showPlaceholderBanner() {
    try {
      const banner = document.createElement('div');
      banner.id = 'web-banner-placeholder';
      banner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 50px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Outfit', sans-serif;
        font-size: 14px;
        font-weight: 600;
        z-index: 1000;
        border-top: 2px solid #4c63d2;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
      `;
      
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>📱</span>
          <span>Publicidad</span>
          <span style="font-size: 12px; opacity: 0.8;">(AdSense en desarrollo)</span>
        </div>
      `;

      if (!document.body.contains(banner)) {
        document.body.appendChild(banner);
      }
      
      this.isLoaded = true;
      this.isVisible = true;
      console.log('✅ Banner placeholder mostrado');
      return true;
    } catch (error) {
      console.error('❌ Error mostrando banner placeholder:', error);
      return false;
    }
  }

  // Ocultar Banner
  async hideBanner() {
    try {
      if (this.bannerElement) {
        this.bannerElement.style.display = 'none';
        this.isVisible = false;
        console.log('✅ Banner web ocultado');
      }
      return true;
    } catch (error) {
      console.error('❌ Error ocultando banner web:', error);
      return false;
    }
  }

  // Remover Banner completamente
  async removeBanner() {
    try {
      if (this.bannerElement && document.body.contains(this.bannerElement)) {
        document.body.removeChild(this.bannerElement);
        this.bannerElement = null;
        this.isLoaded = false;
        this.isVisible = false;
        console.log('✅ Banner web removido');
      }
      return true;
    } catch (error) {
      console.error('❌ Error removiendo banner web:', error);
      return false;
    }
  }

  // Verificar si está visible
  isBannerVisible() {
    return this.isVisible;
  }

  // Verificar si está cargado
  isBannerLoaded() {
    return this.isLoaded;
  }
}
