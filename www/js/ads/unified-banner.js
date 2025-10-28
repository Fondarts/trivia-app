// www/js/ads/unified-banner.js
// Manager unificado para banners (Web y Android)

import { BannerAd } from './banner.js';
import { WebBanner } from './web-banner.js';

export class UnifiedBanner {
  constructor() {
    this.isAndroid = window.Capacitor && window.Capacitor.getPlatform() === 'android';
    this.androidBanner = null;
    this.webBanner = null;
    
    if (this.isAndroid) {
      this.androidBanner = new BannerAd();
      console.log('📱 Inicializando banner para Android');
    } else {
      this.webBanner = new WebBanner();
      console.log('🌐 Inicializando banner para Web');
    }
  }

  // Inicializar el sistema de banners
  async initialize() {
    if (this.isAndroid && this.androidBanner) {
      return await this.androidBanner.initialize();
    } else if (this.webBanner) {
      return await this.webBanner.initialize();
    }
    return false;
  }

  // Mostrar banner
  async showBanner() {
    if (this.isAndroid && this.androidBanner) {
      return await this.androidBanner.showBanner();
    } else if (this.webBanner) {
      return await this.webBanner.showBanner();
    }
    return false;
  }

  // Verificar si el banner está visible
  isBannerVisible() {
    if (this.isAndroid && this.androidBanner) {
      return this.androidBanner.isVisible;
    } else if (this.webBanner) {
      return this.webBanner.isVisible;
    }
    return false;
  }

  // Ocultar banner
  async hideBanner() {
    if (this.isAndroid && this.androidBanner) {
      return await this.androidBanner.hideBanner();
    } else if (this.webBanner) {
      return await this.webBanner.hideBanner();
    }
    return false;
  }

  // Remover banner
  async removeBanner() {
    if (this.isAndroid && this.androidBanner) {
      return await this.androidBanner.removeBanner();
    } else if (this.webBanner) {
      return await this.webBanner.removeBanner();
    }
    return false;
  }

  // Verificar si está visible
  isBannerVisible() {
    if (this.isAndroid && this.androidBanner) {
      return this.androidBanner.isBannerVisible();
    } else if (this.webBanner) {
      return this.webBanner.isBannerVisible();
    }
    return false;
  }

  // Verificar si está cargado
  isBannerLoaded() {
    if (this.isAndroid && this.androidBanner) {
      return this.androidBanner.isBannerLoaded();
    } else if (this.webBanner) {
      return this.webBanner.isBannerLoaded();
    }
    return false;
  }

  // Función de test completo
  async testCompleteBanner() {
    if (this.isAndroid && this.androidBanner) {
      return await this.androidBanner.testCompleteBanner();
    } else {
      console.log('🧪 Test completo solo disponible en Android');
      return false;
    }
  }

  // Función de test con IDs de Google
  async testGoogleBanner() {
    if (this.isAndroid && this.androidBanner) {
      return await this.androidBanner.testGoogleBanner();
    } else {
      console.log('🧪 Test de Google solo disponible en Android');
      return false;
    }
  }

  // Función de test simple
  async testSimpleBanner() {
    if (this.isAndroid && this.androidBanner) {
      return await this.androidBanner.testSimpleBanner();
    } else {
      console.log('🧪 Test solo disponible en Android');
      return false;
    }
  }

  // Función de debug
  async debugBannerStatus() {
    if (this.isAndroid && this.androidBanner) {
      return await this.androidBanner.debugBannerStatus();
    } else if (this.webBanner) {
      console.log('🔍 Banner web - Estado:', {
        isLoaded: this.webBanner.isLoaded,
        isVisible: this.webBanner.isVisible,
        hasElement: !!this.webBanner.bannerElement
      });
    }
  }
}
