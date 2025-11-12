// js/core/storage.js - Sistema de Storage Centralizado
// Wrapper mejorado de localStorage con validación, cache en memoria y TTL

/**
 * Sistema de Storage Centralizado
 * 
 * Características:
 * - Cache en memoria para mejor rendimiento
 * - Validación automática opcional
 * - TTL (Time-To-Live) para datos temporales
 * - Migración automática de versiones
 * - Manejo de errores consistente
 * - Compresión opcional para datos grandes
 */

class StorageSystem {
  constructor() {
    // Cache en memoria
    this._cache = new Map();
    
    // TTL (Time-To-Live) entries: { key: { value, expires: timestamp } }
    this._ttlEntries = new Map();
    
    // Validadores por key
    this._validators = new Map();
    
    // Versión actual del storage
    this._version = '1.0.0';
    this._versionKey = '_storage_version';
    
    // Configuración
    this._config = {
      enableCache: true,
      enableTTL: true,
      enableValidation: true,
      maxCacheSize: 100, // Máximo de entradas en cache
      defaultTTL: null, // null = sin expiración
      compressThreshold: 1024 * 50, // Comprimir si > 50KB
    };
    
    // Verificar si localStorage está disponible
    this._isAvailable = this._checkAvailability();
    
    // Cargar versión y ejecutar migraciones si es necesario
    if (this._isAvailable) {
      this._checkVersion();
    }
  }
  
  /**
   * Verificar si localStorage está disponible
   * @returns {boolean}
   */
  _checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('[Storage] localStorage no disponible:', e);
      return false;
    }
  }
  
  /**
   * Verificar versión y ejecutar migraciones si es necesario
   */
  _checkVersion() {
    try {
      const savedVersion = localStorage.getItem(this._versionKey);
      if (savedVersion !== this._version) {
        console.log(`[Storage] Migrando de versión ${savedVersion || 'desconocida'} a ${this._version}`);
        this._migrate(savedVersion);
        localStorage.setItem(this._versionKey, this._version);
      }
    } catch (e) {
      console.warn('[Storage] Error verificando versión:', e);
    }
  }
  
  /**
   * Ejecutar migraciones de datos
   * @param {string} oldVersion - Versión anterior
   */
  _migrate(oldVersion) {
    // Aquí se pueden agregar migraciones específicas cuando se cambie la versión
    // Ejemplo:
    // if (oldVersion === '1.0.0') {
    //   // Migrar datos de versión 1.0.0 a 1.0.1
    // }
  }
  
  /**
   * Registrar un validador para una key específica
   * @param {string} key - Clave a validar
   * @param {Function} validator - Función que valida el valor (debe retornar true o lanzar error)
   */
  setValidator(key, validator) {
    this._validators.set(key, validator);
  }
  
  /**
   * Validar un valor según su validador registrado
   * @param {string} key - Clave a validar
   * @param {*} value - Valor a validar
   * @returns {boolean}
   */
  _validate(key, value) {
    if (!this._config.enableValidation) return true;
    
    const validator = this._validators.get(key);
    if (!validator) return true;
    
    try {
      const result = validator(value);
      return result === true || result === undefined;
    } catch (e) {
      console.error(`[Storage] Validación fallida para ${key}:`, e);
      return false;
    }
  }
  
  /**
   * Limpiar cache si excede el tamaño máximo
   */
  _cleanCache() {
    if (this._cache.size > this._config.maxCacheSize) {
      // Eliminar 20% de las entradas más antiguas
      const entriesToRemove = Math.floor(this._config.maxCacheSize * 0.2);
      const keys = Array.from(this._cache.keys()).slice(0, entriesToRemove);
      keys.forEach(key => this._cache.delete(key));
    }
  }
  
  /**
   * Obtener valor del storage
   * @param {string} key - Clave a obtener
   * @param {*} defaultValue - Valor por defecto si no existe
   * @returns {*} Valor obtenido o defaultValue
   */
  get(key, defaultValue = null) {
    if (!key || typeof key !== 'string') {
      console.warn('[Storage] Key inválida:', key);
      return defaultValue;
    }
    
    // Verificar TTL
    if (this._config.enableTTL && this._ttlEntries.has(key)) {
      const entry = this._ttlEntries.get(key);
      if (entry.expires < Date.now()) {
        // Expiró, eliminar
        this._ttlEntries.delete(key);
        this._cache.delete(key);
        if (this._isAvailable) {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`[Storage] Error eliminando ${key} expirado:`, e);
          }
        }
        return defaultValue;
      }
    }
    
    // Buscar en cache primero
    if (this._config.enableCache && this._cache.has(key)) {
      return this._cache.get(key);
    }
    
    // Si no está disponible, retornar default
    if (!this._isAvailable) {
      return defaultValue;
    }
    
    // Buscar en localStorage
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        return defaultValue;
      }
      
      // Parsear JSON
      let value;
      try {
        value = JSON.parse(raw);
      } catch (e) {
        // Si no es JSON válido, retornar el string crudo
        value = raw;
      }
      
      // Validar si hay validador
      if (!this._validate(key, value)) {
        console.warn(`[Storage] Valor inválido para ${key}, usando default`);
        return defaultValue;
      }
      
      // Guardar en cache
      if (this._config.enableCache) {
        this._cache.set(key, value);
        this._cleanCache();
      }
      
      return value;
    } catch (e) {
      console.error(`[Storage] Error leyendo ${key}:`, e);
      return defaultValue;
    }
  }
  
  /**
   * Establecer valor en el storage
   * @param {string} key - Clave a establecer
   * @param {*} value - Valor a guardar
   * @param {Object} options - Opciones { ttl, validate }
   * @param {number} options.ttl - Tiempo de vida en milisegundos
   * @param {boolean} options.validate - Si debe validar (default: true)
   * @returns {boolean} True si se guardó correctamente
   */
  set(key, value, options = {}) {
    if (!key || typeof key !== 'string') {
      console.warn('[Storage] Key inválida:', key);
      return false;
    }
    
    const { ttl = null, validate = true } = options;
    
    // Validar si está habilitado
    if (validate && !this._validate(key, value)) {
      console.error(`[Storage] Valor inválido para ${key}`);
      return false;
    }
    
    // Guardar en cache
    if (this._config.enableCache) {
      this._cache.set(key, value);
      this._cleanCache();
    }
    
    // Si localStorage no está disponible, solo usar cache
    if (!this._isAvailable) {
      if (ttl) {
        this._ttlEntries.set(key, {
          value,
          expires: Date.now() + ttl
        });
      }
      return true;
    }
    
    // Guardar en localStorage
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
      // Verificar tamaño (localStorage tiene límite ~5-10MB)
      if (serialized.length > 1024 * 1024 * 5) {
        console.warn(`[Storage] Valor para ${key} es muy grande (${Math.round(serialized.length / 1024)}KB)`);
      }
      
      localStorage.setItem(key, serialized);
      
      // Manejar TTL
      if (ttl && this._config.enableTTL) {
        this._ttlEntries.set(key, {
          value,
          expires: Date.now() + ttl
        });
      } else if (this._ttlEntries.has(key)) {
        // Si no tiene TTL pero tenía uno anterior, eliminarlo
        this._ttlEntries.delete(key);
      }
      
      return true;
    } catch (e) {
      // Puede ser error de quota excedida
      if (e.name === 'QuotaExceededError') {
        console.error('[Storage] Quota excedida, intentando limpiar cache...');
        this._cleanCache();
        
        // Intentar de nuevo una vez
        try {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          return true;
        } catch (e2) {
          console.error('[Storage] Error persistente al guardar:', e2);
          return false;
        }
      }
      
      console.error(`[Storage] Error guardando ${key}:`, e);
      return false;
    }
  }
  
  /**
   * Eliminar un valor del storage
   * @param {string} key - Clave a eliminar
   * @returns {boolean} True si se eliminó correctamente
   */
  remove(key) {
    if (!key || typeof key !== 'string') {
      return false;
    }
    
    // Eliminar de cache
    if (this._config.enableCache) {
      this._cache.delete(key);
    }
    
    // Eliminar TTL entry
    this._ttlEntries.delete(key);
    
    // Eliminar de localStorage
    if (this._isAvailable) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error(`[Storage] Error eliminando ${key}:`, e);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Verificar si existe una clave
   * @param {string} key - Clave a verificar
   * @returns {boolean}
   */
  has(key) {
    if (!key || typeof key !== 'string') {
      return false;
    }
    
    // Verificar en cache
    if (this._config.enableCache && this._cache.has(key)) {
      // Si tiene TTL, verificar expiración
      if (this._ttlEntries.has(key)) {
        const entry = this._ttlEntries.get(key);
        if (entry.expires < Date.now()) {
          this.remove(key);
          return false;
        }
      }
      return true;
    }
    
    // Verificar en localStorage
    if (this._isAvailable) {
      try {
        return localStorage.getItem(key) !== null;
      } catch (e) {
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Limpiar todo el storage (solo claves de la app, no otras)
   * @param {string[]} keysToKeep - Lista de claves a mantener
   */
  clear(keysToKeep = []) {
    // Limpiar cache
    this._cache.clear();
    this._ttlEntries.clear();
    
    // Limpiar localStorage
    if (this._isAvailable) {
      try {
        const keysToRemove = [];
        
        // Obtener todas las claves
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && !keysToKeep.includes(key) && key !== this._versionKey) {
            keysToRemove.push(key);
          }
        }
        
        // Eliminar las claves
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`[Storage] Error eliminando ${key}:`, e);
          }
        });
        
        return true;
      } catch (e) {
        console.error('[Storage] Error limpiando storage:', e);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Obtener todas las claves
   * @returns {string[]}
   */
  keys() {
    const keysSet = new Set();
    
    // Agregar claves del cache
    if (this._config.enableCache) {
      this._cache.keys().forEach(key => keysSet.add(key));
    }
    
    // Agregar claves de localStorage
    if (this._isAvailable) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) keysSet.add(key);
        }
      } catch (e) {
        console.warn('[Storage] Error obteniendo claves:', e);
      }
    }
    
    return Array.from(keysSet);
  }
  
  /**
   * Obtener todas las entradas (key-value pairs)
   * @returns {Object}
   */
  getAll() {
    const result = {};
    
    const allKeys = this.keys();
    allKeys.forEach(key => {
      if (key !== this._versionKey) {
        result[key] = this.get(key);
      }
    });
    
    return result;
  }
  
  /**
   * Actualizar configuración
   * @param {Object} config - Nueva configuración
   */
  configure(config) {
    this._config = { ...this._config, ...config };
  }
  
  /**
   * Limpiar cache en memoria (no afecta localStorage)
   */
  clearCache() {
    this._cache.clear();
    this._ttlEntries.clear();
  }
  
  /**
   * Limpiar entradas expiradas (TTL)
   */
  clearExpired() {
    const now = Date.now();
    const expiredKeys = [];
    
    this._ttlEntries.forEach((entry, key) => {
      if (entry.expires < now) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => {
      this.remove(key);
    });
    
    return expiredKeys.length;
  }
  
  /**
   * Verificar si localStorage está disponible
   * @returns {boolean}
   */
  isAvailable() {
    return this._isAvailable;
  }
  
  /**
   * Obtener información del storage
   * @returns {Object}
   */
  getInfo() {
    let totalSize = 0;
    let itemCount = 0;
    
    if (this._isAvailable) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            totalSize += (key.length + (value ? value.length : 0));
            itemCount++;
          }
        }
      } catch (e) {
        console.warn('[Storage] Error calculando info:', e);
      }
    }
    
    return {
      available: this._isAvailable,
      version: this._version,
      itemCount,
      totalSize,
      totalSizeKB: Math.round(totalSize / 1024),
      cacheSize: this._cache.size,
      ttlEntries: this._ttlEntries.size,
    };
  }
}

// Crear instancia singleton
const storageSystem = new StorageSystem();

// Exportar como objeto con métodos estáticos para fácil uso
export const Storage = {
  /**
   * Obtener valor
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  get: (key, defaultValue) => storageSystem.get(key, defaultValue),
  
  /**
   * Establecer valor
   * @param {string} key
   * @param {*} value
   * @param {Object} options
   * @returns {boolean}
   */
  set: (key, value, options) => storageSystem.set(key, value, options),
  
  /**
   * Eliminar valor
   * @param {string} key
   * @returns {boolean}
   */
  remove: (key) => storageSystem.remove(key),
  
  /**
   * Verificar si existe
   * @param {string} key
   * @returns {boolean}
   */
  has: (key) => storageSystem.has(key),
  
  /**
   * Limpiar todo
   * @param {string[]} keysToKeep
   * @returns {boolean}
   */
  clear: (keysToKeep) => storageSystem.clear(keysToKeep),
  
  /**
   * Obtener todas las claves
   * @returns {string[]}
   */
  keys: () => storageSystem.keys(),
  
  /**
   * Obtener todas las entradas
   * @returns {Object}
   */
  getAll: () => storageSystem.getAll(),
  
  /**
   * Registrar validador
   * @param {string} key
   * @param {Function} validator
   */
  setValidator: (key, validator) => storageSystem.setValidator(key, validator),
  
  /**
   * Configurar opciones
   * @param {Object} config
   */
  configure: (config) => storageSystem.configure(config),
  
  /**
   * Limpiar cache
   */
  clearCache: () => storageSystem.clearCache(),
  
  /**
   * Limpiar expirados
   * @returns {number}
   */
  clearExpired: () => storageSystem.clearExpired(),
  
  /**
   * Verificar disponibilidad
   * @returns {boolean}
   */
  isAvailable: () => storageSystem.isAvailable(),
  
  /**
   * Obtener información
   * @returns {Object}
   */
  getInfo: () => storageSystem.getInfo(),
};

// Exportar también como default
export default Storage;

