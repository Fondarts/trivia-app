// js/ads/banner.js
// Sistema de Banner para AdMob

import { AD_CONFIG } from './config.js';

export class BannerAd {
  constructor() {
    this.isLoaded = false;
    this.isVisible = false;
    this.isInitializing = false;
    this.lastShowAttempt = 0;
  }

  // Inicializar AdMob
  async initialize() {
    // Solo funcionar en Android
    if (!window.Capacitor || window.Capacitor.getPlatform() !== 'android') {
      console.log('📱 AdMob solo funciona en Android');
      return false;
    }

    try {
      // Verificar si AdMob está disponible globalmente
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
        const AdMob = window.Capacitor.Plugins.AdMob;
        
        console.log('🔍 Inicializando AdMob con configuración:', {
          initializeForTesting: AD_CONFIG.IS_TESTING,
          appId: 'ca-app-pub-7829392929574421~4523784771'
        });

        const initResult = await AdMob.initialize({
          initializeForTesting: AD_CONFIG.IS_TESTING,
          requestTrackingAuthorization: true
        });
        
        console.log('🔍 Resultado de inicialización:', initResult);
        
        // Agregar listeners para eventos de banner
        AdMob.addListener('bannerAdLoaded', () => {
          console.log('🎉 Banner cargado exitosamente');
          this.isLoaded = true;
        });
        
        AdMob.addListener('bannerAdFailedToLoad', (error) => {
          console.error('❌ Banner falló al cargar:', error);
          console.error('🔍 Código de error:', error.code);
          console.error('🔍 Mensaje de error:', error.message);
          this.isLoaded = false;
        });
        
        AdMob.addListener('bannerAdShown', () => {
          console.log('👁️ Banner mostrado');
          this.isVisible = true;
        });
        
        AdMob.addListener('bannerAdHidden', () => {
          console.log('🙈 Banner oculto');
          this.isVisible = false;
        });
        
        AdMob.addListener('bannerAdClicked', () => {
          console.log('👆 Banner clickeado');
        });
        
        AdMob.addListener('bannerAdImpression', () => {
          console.log('👀 Banner impresión registrada');
        });
        
        console.log('✅ AdMob inicializado correctamente');
        return true;
      } else {
        console.log('⚠️ AdMob plugin no disponible');
        console.log('🔍 Plugins disponibles:', Object.keys(window.Capacitor.Plugins || {}));
        return false;
      }
    } catch (error) {
      console.error('❌ Error inicializando AdMob:', error);
      console.error('Detalles del error:', error.message);
      return false;
    }
  }

  // Mostrar Banner
  async showBanner() {
    // Solo funcionar en Android
    if (!window.Capacitor || window.Capacitor.getPlatform() !== 'android') {
      return false;
    }

    // Evitar llamadas duplicadas (máximo una cada 5 segundos)
    const now = Date.now();
    if (now - this.lastShowAttempt < 5000) {
      console.log('⚠️ Banner ya se intentó mostrar recientemente, saltando...');
      return this.isVisible;
    }
    this.lastShowAttempt = now;

    // Si ya está visible, no hacer nada
    if (this.isVisible) {
      console.log('✅ Banner ya está visible');
      return true;
    }

    try {
      // Usar AdMob desde plugins globales
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
        const AdMob = window.Capacitor.Plugins.AdMob;
        
        // Limpiar banner existente antes de mostrar uno nuevo
        try {
          await AdMob.removeBanner();
          console.log('🧹 Banner anterior removido');
        } catch (removeError) {
          console.log('ℹ️ No había banner anterior que remover');
        }
        
        console.log('🔍 Mostrando banner con configuración:', {
          adId: AD_CONFIG.BANNER_ID,
          adSize: 'BANNER',
          position: 'BOTTOM_CENTER',
          margin: 0,
          isTesting: AD_CONFIG.IS_TESTING
        });

        const result = await AdMob.showBanner({
          adId: AD_CONFIG.BANNER_ID,
          adSize: 'BANNER',
          position: 'BOTTOM_CENTER',
          margin: 0,
          isTesting: AD_CONFIG.IS_TESTING
        });
        
        console.log('🔍 Resultado de showBanner:', result);
        
        // Esperar un poco para que el banner se renderice
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar si realmente se mostró
        if (result === true) {
          this.isLoaded = true;
          this.isVisible = true;
          console.log('✅ Banner mostrado correctamente');
        } else {
          console.log('⚠️ Banner no se pudo mostrar, resultado:', result);
        }
        
        return result === true;
      } else {
        console.log('⚠️ AdMob plugin no disponible para mostrar banner');
        return false;
      }
    } catch (error) {
      console.error('❌ Error mostrando banner:', error);
      return false;
    }
  }

  // Ocultar Banner
  async hideBanner() {
    // Solo funcionar en Android
    if (!window.Capacitor || window.Capacitor.getPlatform() !== 'android') {
      return false;
    }

    try {
      // Usar AdMob desde plugins globales
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
        const AdMob = window.Capacitor.Plugins.AdMob;
        
        await AdMob.hideBanner();
        this.isVisible = false;
        console.log('✅ Banner ocultado');
        return true;
      } else {
        console.log('⚠️ AdMob plugin no disponible para ocultar banner');
        return false;
      }
    } catch (error) {
      console.error('❌ Error ocultando banner:', error);
      return false;
    }
  }

  // Remover Banner completamente
  async removeBanner() {
    // Solo funcionar en Android
    if (!window.Capacitor || window.Capacitor.getPlatform() !== 'android') {
      return false;
    }

    try {
      // Usar AdMob desde plugins globales
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
        const AdMob = window.Capacitor.Plugins.AdMob;
        
        await AdMob.removeBanner();
        this.isLoaded = false;
        this.isVisible = false;
        console.log('✅ Banner removido');
        return true;
      } else {
        console.log('⚠️ AdMob plugin no disponible para remover banner');
        return false;
      }
    } catch (error) {
      console.error('❌ Error removiendo banner:', error);
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

  // Función de test completo
  async testCompleteBanner() {
    console.log('🧪 Iniciando test completo de banner...');
    
    if (!window.Capacitor || window.Capacitor.getPlatform() !== 'android') {
      console.log('❌ No es Android, no se puede testear');
      return false;
    }

    try {
      const AdMob = window.Capacitor.Plugins.AdMob;
      
      // Test 1: Verificar que el plugin existe
      console.log('🔍 Test 1 - Plugin disponible:', !!AdMob);
      
      // Test 2: Verificar métodos disponibles
      console.log('🔍 Test 2 - Métodos disponibles:', Object.keys(AdMob));
      
      // Test 3: Verificar permisos
      console.log('🔍 Test 3 - Verificando permisos...');
      try {
        const permissions = await AdMob.checkPermissions();
        console.log('🔍 Permisos actuales:', permissions);
      } catch (error) {
        console.log('⚠️ Error verificando permisos:', error);
      }
      
      // Test 4: Solicitar permisos si es necesario
      console.log('🔍 Test 4 - Solicitando permisos...');
      try {
        const requestResult = await AdMob.requestPermissions();
        console.log('🔍 Resultado de solicitud de permisos:', requestResult);
      } catch (error) {
        console.log('⚠️ Error solicitando permisos:', error);
      }
      
      // Test 5: Verificar estado de tracking
      console.log('🔍 Test 5 - Verificando estado de tracking...');
      try {
        const trackingStatus = await AdMob.trackingAuthorizationStatus();
        console.log('🔍 Estado de tracking:', trackingStatus);
      } catch (error) {
        console.log('⚠️ Error verificando tracking:', error);
      }
      
      // Test 6: Intentar mostrar banner con diferentes configuraciones
      console.log('🔍 Test 6 - Probando diferentes configuraciones...');
      
      const testConfigs = [
        {
          name: 'Google Test ID',
          config: {
            adId: 'ca-app-pub-3940256099942544/6300978111',
            adSize: 'BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
            isTesting: true
          }
        },
        {
          name: 'Tu ID con testing',
          config: {
            adId: 'ca-app-pub-7829392929574421/5868656038',
            adSize: 'BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
            isTesting: true
          }
        },
        {
          name: 'Tu ID sin testing',
          config: {
            adId: 'ca-app-pub-7829392929574421/5868656038',
            adSize: 'BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
            isTesting: false
          }
        }
      ];
      
      for (const test of testConfigs) {
        console.log(`🔍 Probando: ${test.name}`);
        try {
          const result = await AdMob.showBanner(test.config);
          console.log(`✅ ${test.name} - Resultado:`, result);
          
          if (result === true) {
            console.log(`🎉 ${test.name} funcionó!`);
            return true;
          }
        } catch (error) {
          console.log(`❌ ${test.name} - Error:`, error);
        }
      }
      
      console.log('⚠️ Ninguna configuración funcionó');
      return false;
    } catch (error) {
      console.error('❌ Error en test completo:', error);
      return false;
    }
  }

  // Función de test con IDs de Google
  async testGoogleBanner() {
    console.log('🧪 Iniciando test con IDs de Google...');
    
    if (!window.Capacitor || window.Capacitor.getPlatform() !== 'android') {
      console.log('❌ No es Android, no se puede testear');
      return false;
    }

    try {
      const AdMob = window.Capacitor.Plugins.AdMob;
      
      // Test 1: Verificar que el plugin existe
      console.log('🔍 Test 1 - Plugin disponible:', !!AdMob);
      
      // Test 2: Verificar métodos disponibles
      console.log('🔍 Test 2 - Métodos disponibles:', Object.keys(AdMob));
      
      // Test 3: Intentar mostrar banner con ID de test de Google
      console.log('🔍 Test 3 - Mostrando banner con ID de test de Google...');
      console.log('🔍 Test 3 - Banner ID:', 'ca-app-pub-3940256099942544/6300978111');
      console.log('🔍 Test 3 - App ID en config:', 'ca-app-pub-3940256099942544~3347511713');
      
      const result = await AdMob.showBanner({
        adId: 'ca-app-pub-3940256099942544/6300978111', // ID de test de Google
        adSize: 'BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: true
      });
      
      console.log('🔍 Test 3 - Resultado:', result);
      console.log('🔍 Test 3 - Tipo de resultado:', typeof result);
      
      if (result === undefined) {
        console.log('⚠️ El plugin devuelve undefined - posible problema de configuración');
        console.log('💡 Esto puede ser normal en algunos casos, el banner puede aparecer igual');
      } else if (result === true) {
        console.log('✅ El plugin devuelve true - banner debería estar visible');
      } else if (result === false) {
        console.log('❌ El plugin devuelve false - banner falló');
      } else {
        console.log('🤔 El plugin devuelve algo inesperado:', result);
      }
      
      // Esperar un poco para ver si aparecen eventos
      console.log('🔍 Esperando eventos de banner...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return true;
    } catch (error) {
      console.error('❌ Error en test de Google:', error);
      return false;
    }
  }

  // Función de test simple
  async testSimpleBanner() {
    console.log('🧪 Iniciando test simple de banner...');
    
    if (!window.Capacitor || window.Capacitor.getPlatform() !== 'android') {
      console.log('❌ No es Android, no se puede testear');
      return false;
    }

    try {
      const AdMob = window.Capacitor.Plugins.AdMob;
      
      // Test 1: Verificar que el plugin existe
      console.log('🔍 Test 1 - Plugin disponible:', !!AdMob);
      
      // Test 2: Verificar métodos disponibles
      console.log('🔍 Test 2 - Métodos disponibles:', Object.keys(AdMob));
      
      // Test 3: Intentar mostrar banner con configuración mínima
      console.log('🔍 Test 3 - Mostrando banner con configuración mínima...');
      
      const result = await AdMob.showBanner({
        adId: 'ca-app-pub-3940256099942544/6300978111', // ID de test de Google
        adSize: 'BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: true
      });
      
      console.log('🔍 Test 3 - Resultado:', result);
      console.log('🔍 Test 3 - Tipo de resultado:', typeof result);
      
      if (result === undefined) {
        console.log('⚠️ El plugin devuelve undefined - posible problema de configuración');
        console.log('💡 Esto puede ser normal en algunos casos, el banner puede aparecer igual');
      } else if (result === true) {
        console.log('✅ El plugin devuelve true - banner debería estar visible');
      } else if (result === false) {
        console.log('❌ El plugin devuelve false - banner falló');
      } else {
        console.log('🤔 El plugin devuelve algo inesperado:', result);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error en test simple:', error);
      return false;
    }
  }

  // Función de debug para verificar estado
  async debugBannerStatus() {
    console.log('🔍 Estado del banner:', {
      isLoaded: this.isLoaded,
      isVisible: this.isVisible,
      isAndroid: window.Capacitor && window.Capacitor.getPlatform() === 'android',
      hasAdMobPlugin: !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob)
    });

    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
      try {
        const AdMob = window.Capacitor.Plugins.AdMob;
        console.log('🔍 Plugin AdMob disponible:', AdMob);
        
        // Intentar obtener el estado del banner
        if (AdMob.getBannerViewInfo) {
          const bannerInfo = await AdMob.getBannerViewInfo();
          console.log('🔍 Información del banner:', bannerInfo);
        }
      } catch (error) {
        console.error('❌ Error obteniendo estado del banner:', error);
      }
    }
  }
}
