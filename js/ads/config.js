// js/ads/config.js
// Configuración de AdMob

export const AD_CONFIG = {
  // IDs de test de Google (funcionan sin restricciones)
  BANNER_ID: 'ca-app-pub-3940256099942544/6300978111', // Banner test
  INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/1033173712', // Interstitial test
  REWARDED_ID: 'ca-app-pub-3940256099942544/5224354917', // Rewarded test
  
  // Configuración
  IS_TESTING: true, // Siempre true para IDs de test
  BANNER_POSITION: 'BOTTOM_CENTER',
  BANNER_MARGIN: 0,
  INTERSTITIAL_FREQUENCY: 3, // Cada 3 rondas
  REWARDED_COOLDOWN: 300000 // 5 minutos
};

