// js/adventure_init.js - Inicialización del modo aventura
(function(window) {
  'use strict';
  
  console.log('=== Inicialización del Modo Aventura ===');
  
  // Verificar que todos los módulos necesarios estén cargados
  function checkAdventureModules() {
    const modules = {
      'AdventureMode': window.AdventureMode,
      'AdventureGame': window.AdventureGame,
      'renderRegionNodes': window.renderRegionNodes,
      'renderAdventureMap': window.renderAdventureMap
    };
    
    let allLoaded = true;
    for (const [name, module] of Object.entries(modules)) {
      if (!module) {
        console.error(`❌ Módulo ${name} no está cargado`);
        allLoaded = false;
      } else {
        console.log(`✅ Módulo ${name} cargado`);
      }
    }
    
    return allLoaded;
  }
  
  // Inicializar cuando el DOM esté listo
  function initAdventure() {
    console.log('Iniciando verificación de módulos de aventura...');
    
    if (!checkAdventureModules()) {
      console.error('No todos los módulos de aventura están cargados');
      return false;
    }
    
    // Cargar el progreso inicial
    if (window.AdventureMode) {
      try {
        window.AdventureMode.loadAdventureProgress();
        const state = window.AdventureMode.ADVENTURE_STATE;
        
        // Verificar estado
        if (!state.currentRegion) {
          console.warn('No hay región actual, estableciendo a movies');
          state.currentRegion = 'movies';
        }
        
        console.log('Estado de aventura cargado:', {
          currentRegion: state.currentRegion,
          currentNode: state.currentNode,
          regionsUnlocked: Object.values(state.regions).filter(r => r.unlocked).length
        });
        
        return true;
      } catch (error) {
        console.error('Error al cargar progreso de aventura:', error);
        return false;
      }
    }
    
    return false;
  }
  
  // Esperar a que el DOM y el banco estén listos
  let domReady = false;
  let bankReady = false;
  
  function checkAndInit() {
    if (domReady && bankReady) {
      console.log('DOM y Banco listos, inicializando aventura...');
      initAdventure();
    }
  }
  
  // Esperar al banco
  window.addEventListener('bankReady', function() {
    console.log('Evento bankReady recibido');
    bankReady = true;
    checkAndInit();
  });
  
  // Si el banco ya está listo (por si el evento ya se disparó)
  if (window.getBank && window.getBankCount) {
    const count = window.getBankCount();
    if (count > 0) {
      console.log('Banco ya estaba listo con', count, 'preguntas');
      bankReady = true;
    }
  }
  
  // Esperar al DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      domReady = true;
      checkAndInit();
    });
  } else {
    domReady = true;
    // Dar tiempo para que el banco se cargue
    setTimeout(checkAndInit, 500);
  }
  
  // Exponer función de inicialización global
  window.initAdventureMode = initAdventure;
  
})(window);
