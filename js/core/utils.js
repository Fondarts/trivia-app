// js/core/utils.js - Utilidades generales

// Logger simple
export const Logger = {
  log: (...args) => console.log('[Quizle]', ...args),
  error: (...args) => console.error('[Quizle Error]', ...args),
  warn: (...args) => console.warn('[Quizle Warning]', ...args)
};

// Detección de plataforma
export const Platform = {
  isAndroid: () => /android/i.test(navigator.userAgent),
  isIOS: () => /iphone|ipad|ipod/i.test(navigator.userAgent),
  isMobile: () => /android|iphone|ipad|ipod/i.test(navigator.userAgent),
  isCapacitor: () => window.Capacitor !== undefined,
  isWeb: () => !window.Capacitor
};

// Sistema de sonidos
export const Sounds = {
  enabled: true,
  
  play(sound) {
    if (!this.enabled) return;
    
    // Por ahora solo log, después se puede implementar audio real
    Logger.log('Playing sound:', sound);
  },
  
  correct() {
    this.play('correct');
  },
  
  wrong() {
    this.play('wrong');
  },
  
  levelUp() {
    this.play('levelup');
  },
  
  achievement() {
    this.play('achievement');
  }
};

// Toast ya está definido en ui.js, exportamos una referencia
export function toast(msg) {
  if (window.toast) {
    window.toast(msg);
  } else {
    // Fallback simple
    console.log('Toast:', msg);
  }
}
