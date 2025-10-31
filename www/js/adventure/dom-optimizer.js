// js/adventure/dom-optimizer.js - Optimización de operaciones DOM
(function(window) {
  'use strict';
  
  // Caché de referencias DOM frecuentes
  // Usa WeakMap para que el garbage collector pueda limpiar cuando el elemento desaparece
  const domCache = new Map();
  const containerCache = new WeakMap();
  
  // Obtener referencia cacheada de un elemento
  function getCachedElement(id, container = document) {
    const cacheKey = `${id}_${container === document ? 'root' : container.id || 'scoped'}`;
    
    // Si el contenedor cambió, limpiar su caché
    if (containerCache.has(container)) {
      const oldKey = containerCache.get(container);
      if (oldKey !== cacheKey) {
        // El contenedor cambió, limpiar caché antiguo
        Array.from(domCache.keys()).forEach(key => {
          if (key.startsWith(`${container.id || 'scoped'}_`)) {
            domCache.delete(key);
          }
        });
      }
    }
    containerCache.set(container, cacheKey);
    
    // Verificar si ya está en caché
    if (domCache.has(cacheKey)) {
      const cached = domCache.get(cacheKey);
      // Verificar que el elemento aún existe en el DOM
      if (cached && document.contains(cached)) {
        return cached;
      } else {
        // Elemento eliminado, quitar del caché
        domCache.delete(cacheKey);
      }
    }
    
    // Buscar elemento
    const element = container.getElementById ? container.getElementById(id) : 
                   (container.querySelector ? container.querySelector(`#${id}`) : null);
    
    if (element) {
      domCache.set(cacheKey, element);
      return element;
    }
    
    return null;
  }
  
  // Obtener o crear elemento con caché
  function getOrCreateElement(id, tagName, container, options = {}) {
    let element = getCachedElement(id, container);
    
    if (!element) {
      element = document.createElement(tagName);
      element.id = id;
      
      // Aplicar opciones
      if (options.className) element.className = options.className;
      if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }
      
      // Agregar al contenedor
      if (options.insertBefore) {
        container.insertBefore(element, options.insertBefore);
      } else if (options.appendTo) {
        options.appendTo.appendChild(element);
      } else {
        container.appendChild(element);
      }
      
      // Guardar en caché
      const cacheKey = `${id}_${container === document ? 'root' : container.id || 'scoped'}`;
      domCache.set(cacheKey, element);
      containerCache.set(container, cacheKey);
    }
    
    return element;
  }
  
  // Actualizar elemento sin recrear
  function updateElement(element, updates) {
    if (!element) return false;
    
    let changed = false;
    
    if (updates.className !== undefined && element.className !== updates.className) {
      element.className = updates.className;
      changed = true;
    }
    
    if (updates.textContent !== undefined && element.textContent !== updates.textContent) {
      element.textContent = updates.textContent;
      changed = true;
    }
    
    if (updates.innerHTML !== undefined && element.innerHTML !== updates.innerHTML) {
      element.innerHTML = updates.innerHTML;
      changed = true;
    }
    
    if (updates.style !== undefined) {
      Object.entries(updates.style).forEach(([key, value]) => {
        const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        if (element.style[camelKey] !== value) {
          element.style[camelKey] = value;
          changed = true;
        }
      });
    }
    
    if (updates.attributes !== undefined) {
      Object.entries(updates.attributes).forEach(([key, value]) => {
        if (element.getAttribute(key) !== String(value)) {
          element.setAttribute(key, value);
          changed = true;
        }
      });
    }
    
    if (updates.classList !== undefined) {
      Object.entries(updates.classList).forEach(([action, className]) => {
        if (action === 'add' && !element.classList.contains(className)) {
          element.classList.add(className);
          changed = true;
        } else if (action === 'remove' && element.classList.contains(className)) {
          element.classList.remove(className);
          changed = true;
        } else if (action === 'toggle') {
          element.classList.toggle(className);
          changed = true;
        }
      });
    }
    
    return changed;
  }
  
  // Usar DocumentFragment para operaciones masivas
  function batchDOMOperations(operations) {
    const fragment = document.createDocumentFragment();
    
    operations.forEach(op => {
      let element;
      
      if (op.type === 'create') {
        element = document.createElement(op.tag);
        
        // Aplicar propiedades
        if (op.props) {
          Object.entries(op.props).forEach(([key, value]) => {
            if (key === 'style' && typeof value === 'object') {
              Object.assign(element.style, value);
            } else if (key === 'attributes' && typeof value === 'object') {
              Object.entries(value).forEach(([attr, val]) => {
                element.setAttribute(attr, val);
              });
            } else if (key === 'className') {
              element.className = value;
            } else if (key === 'textContent') {
              element.textContent = value;
            } else if (key === 'innerHTML') {
              element.innerHTML = value;
            } else {
              element[key] = value;
            }
          });
        }
        
        // Agregar hijos
        if (op.children) {
          op.children.forEach(child => {
            if (typeof child === 'string') {
              element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
              element.appendChild(child);
            } else if (child && child.type === 'create') {
              // Recursivo para hijos
              const childOp = batchDOMOperations([child]);
              element.appendChild(childOp);
            }
          });
        }
        
        fragment.appendChild(element);
      } else if (op.type === 'append') {
        if (op.element instanceof Node) {
          fragment.appendChild(op.element);
        }
      } else if (op.type === 'text') {
        fragment.appendChild(document.createTextNode(op.text));
      }
    });
    
    return fragment;
  }
  
  // Cola de operaciones DOM para agrupar en requestAnimationFrame
  let domOperationsQueue = [];
  let domTimeout = null;
  let isProcessing = false;
  
  // Agregar operación DOM a la cola
  function queueDOMOperation(fn, priority = 'normal') {
    domOperationsQueue.push({ fn, priority });
    
    if (domTimeout) return; // Ya hay un frame programado
    
    // Procesar en el siguiente frame
    domTimeout = requestAnimationFrame(() => {
      // Ordenar por prioridad: 'high' primero
      domOperationsQueue.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return 0;
      });
      
      // Ejecutar todas las operaciones
      const operations = domOperationsQueue.slice();
      domOperationsQueue = [];
      domTimeout = null;
      
      operations.forEach(({ fn }) => {
        try {
          fn();
        } catch (error) {
          console.error('Error en operación DOM encolada:', error);
        }
      });
    });
  }
  
  // Reutilizar contenedor si existe, solo actualizar contenido
  function reuseOrCreateContainer(container, wrapperClass, createFn) {
    let wrapper = container.querySelector(`.${wrapperClass}`);
    
    if (wrapper) {
      // Ya existe, retornarlo
      return wrapper;
    }
    
    // Crear nuevo contenedor
    wrapper = document.createElement('div');
    wrapper.className = wrapperClass;
    
    // Usar DocumentFragment para agregar contenido
    const fragment = createFn();
    if (fragment) {
      wrapper.appendChild(fragment);
    }
    
    container.appendChild(wrapper);
    return wrapper;
  }
  
  // Limpiar caché de un contenedor específico
  function clearCache(container = null) {
    if (container) {
      // Limpiar solo el caché de este contenedor
      Array.from(domCache.keys()).forEach(key => {
        if (key.includes(container.id || 'scoped')) {
          domCache.delete(key);
        }
      });
      containerCache.delete(container);
    } else {
      // Limpiar todo el caché
      domCache.clear();
      containerCache.clear();
    }
  }
  
  // Debounce para operaciones que pueden ejecutarse múltiples veces
  function createDebouncedFunction(fn, delay = 150) {
    let timeout = null;
    
    return function(...args) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        fn.apply(this, args);
        timeout = null;
      }, delay);
    };
  }
  
  // Agrupar múltiples setTimeout en una sola operación
  function batchSetTimeout(callbacks, baseDelay = 0, stepDelay = 50) {
    callbacks.forEach((callback, index) => {
      if (typeof callback === 'function') {
        setTimeout(callback, baseDelay + (index * stepDelay));
      }
    });
  }
  
  window.DOMOptimizer = {
    getCachedElement,
    getOrCreateElement,
    updateElement,
    batchDOMOperations,
    queueDOMOperation,
    reuseOrCreateContainer,
    clearCache,
    createDebouncedFunction,
    batchSetTimeout
  };
  
  console.log('✅ DOMOptimizer cargado');
  
})(window);

