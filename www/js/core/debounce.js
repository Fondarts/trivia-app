// www/js/core/debounce.js
// Utilidades para debouncing de funciones

/**
 * Crea una función con debounce
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en milisegundos
 * @param {boolean} immediate - Si ejecutar inmediatamente en el primer call
 * @returns {Function} Función con debounce aplicado
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Crea una función con throttle (ejecuta máximo 1 vez por período)
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Tiempo límite en milisegundos
 * @returns {Function} Función con throttle aplicado
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Caché simple para funciones async
 * @param {Function} asyncFn - Función async a cachear
 * @param {number} ttl - Time to live en milisegundos
 * @returns {Function} Función cacheada
 */
export function cacheAsync(asyncFn, ttl = 30000) {
  const cache = new Map();
  
  return async function cachedFunction(...args) {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < ttl) {
      return cached.data;
    }
    
    const data = await asyncFn.apply(this, args);
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  };
}

// Exponer globalmente para compatibilidad
if (typeof window !== 'undefined') {
  window.debounce = debounce;
  window.throttle = throttle;
  window.cacheAsync = cacheAsync;
}

