// js/core/dom-utils.js - Utilidades centralizadas de DOM
// Compatible con código existente - uso gradual

/**
 * Utilidades de DOM centralizadas
 * Diseñado para ser compatible con código existente y permitir migración gradual
 */
export const DOMUtils = {
  // Cache de elementos (WeakMap para garbage collection automático)
  _cache: new WeakMap(),
  _elementCache: new Map(), // Para elementos por ID
  
  /**
   * Obtener elemento por ID con caché
   * Compatible con getElementById existente
   * @param {string} id - ID del elemento
   * @param {Document|Element} container - Contenedor (default: document)
   * @param {boolean} useCache - Usar caché (default: true)
   * @returns {Element|null}
   */
  getElement(id, container = document, useCache = true) {
    if (!id) return null;
    
    const cacheKey = `${id}_${container === document ? 'root' : container.id || 'scoped'}`;
    
    // Si el caché está habilitado y el elemento existe
    if (useCache && this._elementCache.has(cacheKey)) {
      const cached = this._elementCache.get(cacheKey);
      // Verificar que aún existe en el DOM
      if (cached && (document.contains ? document.contains(cached) : cached.isConnected)) {
        return cached;
      } else {
        // Elemento eliminado, quitar del caché
        this._elementCache.delete(cacheKey);
      }
    }
    
    // Buscar elemento
    const element = (container.getElementById ? container.getElementById(id) : null) ||
                   (container.querySelector ? container.querySelector(`#${id}`) : null);
    
    if (element && useCache) {
      this._elementCache.set(cacheKey, element);
    }
    
    return element || null;
  },
  
  /**
   * Query selector con caché opcional
   * @param {string} selector - Selector CSS
   * @param {Document|Element} container - Contenedor (default: document)
   * @returns {Element|null}
   */
  query(selector, container = document) {
    if (!selector || !container) return null;
    return container.querySelector(selector);
  },
  
  /**
   * Query selector all
   * @param {string} selector - Selector CSS
   * @param {Document|Element} container - Contenedor (default: document)
   * @returns {NodeList}
   */
  queryAll(selector, container = document) {
    if (!selector || !container) return [];
    return container.querySelectorAll(selector);
  },
  
  /**
   * Crear elemento con opciones
   * @param {string} tag - Tag del elemento
   * @param {Object} options - Opciones (id, className, attributes, textContent, etc)
   * @returns {Element}
   */
  create(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.id) element.id = options.id;
    if (options.className) element.className = options.className;
    if (options.classList) {
      options.classList.forEach(cls => element.classList.add(cls));
    }
    if (options.textContent !== undefined) element.textContent = options.textContent;
    if (options.innerHTML !== undefined) element.innerHTML = options.innerHTML;
    if (options.style) {
      Object.assign(element.style, options.style);
    }
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    if (options.dataset) {
      Object.entries(options.dataset).forEach(([key, value]) => {
        element.dataset[key] = value;
      });
    }
    if (options.listeners) {
      Object.entries(options.listeners).forEach(([event, handler]) => {
        element.addEventListener(event, handler);
      });
    }
    
    return element;
  },
  
  /**
   * Obtener o crear elemento
   * @param {string} id - ID del elemento
   * @param {string} tag - Tag si no existe
   * @param {Element} parent - Contenedor padre
   * @param {Object} options - Opciones para crear
   * @returns {Element}
   */
  getOrCreate(id, tag, parent, options = {}) {
    let element = this.getElement(id, parent);
    
    if (!element) {
      element = this.create(tag, { id, ...options });
      if (parent) {
        if (options.insertBefore) {
          parent.insertBefore(element, options.insertBefore);
        } else {
          parent.appendChild(element);
        }
      }
    }
    
    return element;
  },
  
  /**
   * Actualizar elemento (sin recrear)
   * @param {Element} element - Elemento a actualizar
   * @param {Object} updates - Actualizaciones (textContent, className, style, etc)
   * @returns {boolean} - True si se hicieron cambios
   */
  update(element, updates) {
    if (!element) return false;
    
    let changed = false;
    
    if (updates.textContent !== undefined && element.textContent !== updates.textContent) {
      element.textContent = updates.textContent;
      changed = true;
    }
    
    if (updates.innerHTML !== undefined && element.innerHTML !== updates.innerHTML) {
      element.innerHTML = updates.innerHTML;
      changed = true;
    }
    
    if (updates.className !== undefined && element.className !== updates.className) {
      element.className = updates.className;
      changed = true;
    }
    
    if (updates.classList) {
      if (updates.classList.add) {
        updates.classList.add.forEach(cls => {
          if (!element.classList.contains(cls)) {
            element.classList.add(cls);
            changed = true;
          }
        });
      }
      if (updates.classList.remove) {
        updates.classList.remove.forEach(cls => {
          if (element.classList.contains(cls)) {
            element.classList.remove(cls);
            changed = true;
          }
        });
      }
      if (updates.classList.toggle) {
        updates.classList.toggle.forEach(cls => {
          element.classList.toggle(cls);
          changed = true;
        });
      }
    }
    
    if (updates.style) {
      Object.entries(updates.style).forEach(([key, value]) => {
        if (element.style[key] !== value) {
          element.style[key] = value;
          changed = true;
        }
      });
    }
    
    if (updates.attributes) {
      Object.entries(updates.attributes).forEach(([key, value]) => {
        const current = element.getAttribute(key);
        if (current !== String(value)) {
          element.setAttribute(key, value);
          changed = true;
        }
      });
    }
    
    if (updates.dataset) {
      Object.entries(updates.dataset).forEach(([key, value]) => {
        if (element.dataset[key] !== String(value)) {
          element.dataset[key] = value;
          changed = true;
        }
      });
    }
    
    return changed;
  },
  
  /**
   * Toggle visibility
   * @param {Element} element - Elemento
   * @param {boolean} show - Mostrar (default: toggle)
   * @returns {boolean} - Estado final
   */
  toggle(element, show = undefined) {
    if (!element) return false;
    
    if (show === undefined) {
      show = element.style.display === 'none' || !element.style.display;
    }
    
    element.style.display = show ? '' : 'none';
    return show;
  },
  
  /**
   * Show element
   * @param {Element} element - Elemento
   * @param {string} display - Tipo de display (default: 'block')
   */
  show(element, display = 'block') {
    if (!element) return;
    element.style.display = display;
  },
  
  /**
   * Hide element
   * @param {Element} element - Elemento
   */
  hide(element) {
    if (!element) return;
    element.style.display = 'none';
  },
  
  /**
   * Helpers de modal (compatibles con código existente)
   */
  Modal: {
    /**
     * Abrir modal
     * @param {string} modalId - ID del modal
     * @param {Object} options - Opciones adicionales
     */
    open(modalId, options = {}) {
      const modal = DOMUtils.getElement(modalId);
      if (!modal) {
        console.warn(`Modal ${modalId} no encontrado`);
        return false;
      }
      
      modal.classList.add('open');
      
      if (options.lockScroll !== false) {
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
      }
      
      // Trigger custom event
      modal.dispatchEvent(new CustomEvent('modal:open', { detail: options }));
      
      return true;
    },
    
    /**
     * Cerrar modal
     * @param {string} modalId - ID del modal
     * @param {Object} options - Opciones adicionales
     */
    close(modalId, options = {}) {
      const modal = DOMUtils.getElement(modalId);
      if (!modal) {
        // Intentar cerrar cualquier modal abierto
        const openModal = document.querySelector('.modal.open, .fs.open');
        if (openModal) {
          openModal.classList.remove('open');
        }
      } else {
        modal.classList.remove('open');
      }
      
      // Verificar si hay otros modales abiertos
      const hasOpenModal = document.querySelector('.modal.open, .fs.open');
      if (!hasOpenModal) {
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
      }
      
      // Trigger custom event
      if (modal) {
        modal.dispatchEvent(new CustomEvent('modal:close', { detail: options }));
      }
      
      return true;
    },
    
    /**
     * Toggle modal
     * @param {string} modalId - ID del modal
     */
    toggle(modalId) {
      const modal = DOMUtils.getElement(modalId);
      if (!modal) return false;
      
      const isOpen = modal.classList.contains('open');
      return isOpen ? this.close(modalId) : this.open(modalId);
    }
  },
  
  /**
   * Event delegation helper
   * @param {Element} container - Contenedor
   * @param {string} selector - Selector de elementos target
   * @param {string} event - Tipo de evento
   * @param {Function} handler - Handler
   * @returns {Function} - Función de cleanup
   */
  delegate(container, selector, event, handler) {
    if (!container) return () => {};
    
    const listener = (e) => {
      const target = e.target.closest(selector);
      if (target) {
        handler.call(target, e, target);
      }
    };
    
    container.addEventListener(event, listener);
    
    // Retornar función de cleanup
    return () => {
      container.removeEventListener(event, listener);
    };
  },
  
  /**
   * Limpiar caché
   * @param {string} id - ID específico (opcional, limpia todo si no se especifica)
   */
  clearCache(id = null) {
    if (id) {
      // Limpiar solo este ID de todos los contenedores
      const keysToDelete = [];
      this._elementCache.forEach((element, key) => {
        if (key.startsWith(`${id}_`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this._elementCache.delete(key));
    } else {
      // Limpiar todo
      this._elementCache.clear();
    }
  },
  
  /**
   * Verificar si elemento existe
   * @param {string} id - ID del elemento
   * @returns {boolean}
   */
  exists(id) {
    return this.getElement(id) !== null;
  },
  
  /**
   * Obtener múltiples elementos
   * @param {string[]} ids - Array de IDs
   * @param {Document|Element} container - Contenedor
   * @returns {Object} - Objeto con los elementos indexados por ID
   */
  getElements(ids, container = document) {
    const elements = {};
    ids.forEach(id => {
      elements[id] = this.getElement(id, container);
    });
    return elements;
  }
};

// Exportar también como default para compatibilidad
export default DOMUtils;

