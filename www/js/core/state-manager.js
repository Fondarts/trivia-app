// js/core/state-manager.js - Gestor de estado centralizado
// Compatible con localStorage existente - uso gradual

/**
 * Gestor de estado centralizado
 * Diseñado para trabajar junto con localStorage existente sin romper nada
 */
export const StateManager = {
  // Estado en memoria
  _state: {},
  
  // Observers por key
  _observers: new Map(),
  
  // Prefijo para localStorage
  _storagePrefix: 'quizlo_state_',
  
  /**
   * Obtener valor del estado
   * @param {string} key - Clave del estado
   * @param {*} defaultValue - Valor por defecto
   * @returns {*}
   */
  get(key, defaultValue = undefined) {
    // Primero intentar en memoria
    if (this._state.hasOwnProperty(key)) {
      return this._state[key];
    }
    
    // Si no está en memoria, intentar localStorage (si está habilitado)
    try {
      const stored = localStorage.getItem(this._storagePrefix + key);
      if (stored !== null) {
        const value = JSON.parse(stored);
        // Cargar en memoria para siguiente acceso
        this._state[key] = value;
        return value;
      }
    } catch (e) {
      console.warn(`Error leyendo estado ${key} de localStorage:`, e);
    }
    
    return defaultValue;
  },
  
  /**
   * Establecer valor del estado
   * @param {string} key - Clave del estado
   * @param {*} value - Valor a establecer
   * @param {Object} options - Opciones (persist, notify)
   * @returns {boolean} - True si se actualizó
   */
  set(key, value, options = {}) {
    const {
      persist = true,      // Guardar en localStorage
      notify = true,      // Notificar a observers
      silent = false      // No loggear cambios
    } = options;
    
    const oldValue = this._state[key];
    const changed = oldValue !== value;
    
    // Actualizar estado en memoria
    this._state[key] = value;
    
    // Persistir en localStorage si está habilitado
    if (persist) {
      try {
        if (value === undefined || value === null) {
          localStorage.removeItem(this._storagePrefix + key);
        } else {
          localStorage.setItem(this._storagePrefix + key, JSON.stringify(value));
        }
      } catch (e) {
        console.warn(`Error guardando estado ${key} en localStorage:`, e);
      }
    }
    
    // Notificar a observers
    if (notify && changed) {
      this._notify(key, value, oldValue);
    }
    
    if (!silent && changed) {
      console.debug(`[StateManager] ${key} actualizado:`, { oldValue, newValue: value });
    }
    
    return changed;
  },
  
  /**
   * Actualizar múltiples valores a la vez
   * @param {Object} updates - Objeto con las actualizaciones
   * @param {Object} options - Opciones
   */
  update(updates, options = {}) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value, { ...options, silent: true });
    });
    
    // Notificar una sola vez si hay observers
    if (options.notify !== false && this._observers.size > 0) {
      Object.keys(updates).forEach(key => {
        this._notify(key, this._state[key]);
      });
    }
  },
  
  /**
   * Suscribirse a cambios de una clave
   * @param {string} key - Clave a observar
   * @param {Function} callback - Callback (newValue, oldValue, key)
   * @returns {Function} - Función de unsubscribe
   */
  subscribe(key, callback) {
    if (!this._observers.has(key)) {
      this._observers.set(key, new Set());
    }
    
    this._observers.get(key).add(callback);
    
    // Retornar función de unsubscribe
    return () => {
      const callbacks = this._observers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this._observers.delete(key);
        }
      }
    };
  },
  
  /**
   * Suscribirse a múltiples claves
   * @param {string[]} keys - Claves a observar
   * @param {Function} callback - Callback
   * @returns {Function} - Función de unsubscribe
   */
  subscribeMultiple(keys, callback) {
    const unsubscribes = keys.map(key => this.subscribe(key, callback));
    return () => {
      unsubscribes.forEach(fn => fn());
    };
  },
  
  /**
   * Notificar a observers
   * @private
   */
  _notify(key, newValue, oldValue = undefined) {
    const callbacks = this._observers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (e) {
          console.error(`Error en observer de ${key}:`, e);
        }
      });
    }
    
    // Notificar a wildcard observers (observan todas las claves)
    const wildcardCallbacks = this._observers.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(callback => {
        try {
          callback(key, newValue, oldValue);
        } catch (e) {
          console.error(`Error en wildcard observer:`, e);
        }
      });
    }
  },
  
  /**
   * Eliminar clave del estado
   * @param {string} key - Clave a eliminar
   */
  delete(key) {
    delete this._state[key];
    
    try {
      localStorage.removeItem(this._storagePrefix + key);
    } catch (e) {
      console.warn(`Error eliminando estado ${key} de localStorage:`, e);
    }
    
    // Notificar eliminación
    this._notify(key, undefined, this._state[key]);
  },
  
  /**
   * Limpiar todo el estado
   * @param {boolean} clearPersisted - Limpiar también localStorage
   */
  clear(clearPersisted = false) {
    const keys = Object.keys(this._state);
    
    this._state = {};
    
    if (clearPersisted) {
      try {
        keys.forEach(key => {
          localStorage.removeItem(this._storagePrefix + key);
        });
      } catch (e) {
        console.warn('Error limpiando localStorage:', e);
      }
    }
    
    // Notificar a todos los observers
    keys.forEach(key => {
      this._notify(key, undefined);
    });
  },
  
  /**
   * Cargar estado desde localStorage
   * @param {string[]} keys - Claves a cargar (opcional, carga todo si no se especifica)
   */
  load(keys = null) {
    try {
      if (keys) {
        // Cargar solo las claves especificadas
        keys.forEach(key => {
          const stored = localStorage.getItem(this._storagePrefix + key);
          if (stored !== null) {
            this._state[key] = JSON.parse(stored);
          }
        });
      } else {
        // Cargar todo desde localStorage
        const prefix = this._storagePrefix;
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i);
          if (storageKey.startsWith(prefix)) {
            const key = storageKey.substring(prefix.length);
            try {
              this._state[key] = JSON.parse(localStorage.getItem(storageKey));
            } catch (e) {
              console.warn(`Error parseando estado ${key}:`, e);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error cargando estado desde localStorage:', e);
    }
  },
  
  /**
   * Obtener todo el estado
   * @returns {Object}
   */
  getAll() {
    return { ...this._state };
  },
  
  /**
   * Verificar si existe una clave
   * @param {string} key - Clave a verificar
   * @returns {boolean}
   */
  has(key) {
    return this._state.hasOwnProperty(key) || 
           localStorage.getItem(this._storagePrefix + key) !== null;
  },
  
  /**
   * Obtener claves disponibles
   * @returns {string[]}
   */
  keys() {
    const memoryKeys = Object.keys(this._state);
    const storageKeys = [];
    
    try {
      const prefix = this._storagePrefix;
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey.startsWith(prefix)) {
          const key = storageKey.substring(prefix.length);
          if (!memoryKeys.includes(key)) {
            storageKeys.push(key);
          }
        }
      }
    } catch (e) {
      console.warn('Error obteniendo claves de localStorage:', e);
    }
    
    return [...new Set([...memoryKeys, ...storageKeys])];
  }
};

// Exportar también como default
export default StateManager;

