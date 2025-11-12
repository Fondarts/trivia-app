// js/bank_bridge.js - Puente para exponer funciones de bank.js globalmente
(function() {
  'use strict';
  
  console.log('=== Bank Bridge Iniciando ===');
  
  // Importar las funciones necesarias de bank.js
  import('./bank.js').then(async function(module) {
    console.log('Bank module loaded successfully');
    
    // Exponer todas las funciones necesarias globalmente
    window.buildDeckSingle = module.buildDeckSingle;
    window.getBank = module.getBank;
    window.setBank = module.setBank;
    window.getBankCount = module.getBankCount;
    window.ensureInitial60 = module.ensureInitial60;
    window.warmLocalBank = module.warmLocalBank;
    window.ensureBankReady = module.ensureBankReady;
    window.BASE_LABELS = module.BASE_LABELS;
    window.BASE_KEYS = module.BASE_KEYS;
    
    // Inicializar el banco automáticamente
    console.log('Inicializando banco de preguntas...');
    try {
      await module.ensureBankReady('es');
      const count = module.getBankCount();
      console.log(`✅ Banco cargado. Total de preguntas: ${count}`);
      
      // Verificar que hay preguntas para movies (necesario para aventura)
      const bank = module.getBank();
      if (bank.movies && bank.movies.length > 0) {
        console.log(`✅ Categoría 'movies' disponible con ${bank.movies.length} preguntas`);
      } else {
        console.warn('⚠️ No hay preguntas en categoría movies');
      }
      
      // Disparar evento para indicar que el banco está listo
      window.dispatchEvent(new Event('bankReady'));
      
    } catch (error) {
      console.error('Error inicializando banco:', error);
      
      // Crear banco de fallback con preguntas de prueba
      const fallbackBank = {
        movies: [],
        geography: [],
        history: [],
        science: [],
        sports: []
      };
      
      // Agregar preguntas de prueba para cada categoría
      Object.keys(fallbackBank).forEach(category => {
        for (let i = 0; i < 30; i++) {
          fallbackBank[category].push({
            q: `Pregunta ${i + 1} de ${category}`,
            options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
            answer: Math.floor(Math.random() * 4),
            category: category,
            difficulty: i < 10 ? 'easy' : i < 20 ? 'medium' : 'hard'
          });
        }
      });
      
      // Guardar banco de fallback
      localStorage.setItem('trivia_bank', JSON.stringify(fallbackBank));
      console.log('✅ Banco de fallback creado con preguntas de prueba');
      
      // Disparar evento
      window.dispatchEvent(new Event('bankReady'));
    }
    
  }).catch(function(error) {
    console.error('Error cargando módulo bank.js:', error);
    
    // Fallback completo: crear funciones básicas
    console.warn('Creando funciones de banco de fallback...');
    
    // Crear banco de fallback
    const fallbackBank = {
      movies: [],
      geography: [],
      history: [],
      science: [],
      sports: []
    };
    
    // Agregar preguntas de prueba
    Object.keys(fallbackBank).forEach(category => {
      for (let i = 0; i < 30; i++) {
        fallbackBank[category].push({
          q: `Pregunta fallback ${i + 1} de ${category}`,
          options: ['Respuesta A', 'Respuesta B', 'Respuesta C', 'Respuesta D'],
          answer: Math.floor(Math.random() * 4),
          category: category,
          difficulty: i < 10 ? 'easy' : i < 20 ? 'medium' : 'hard'
        });
      }
    });
    
    window.getBank = function() {
      try {
        const saved = localStorage.getItem('trivia_bank');
        if (saved) return JSON.parse(saved);
      } catch {}
      return fallbackBank;
    };
    
    window.setBank = function(bank) {
      localStorage.setItem('trivia_bank', JSON.stringify(bank));
    };
    
    window.getBankCount = function() {
      const bank = window.getBank();
      let count = 0;
      Object.values(bank).forEach(arr => count += (arr ? arr.length : 0));
      return count;
    };
    
    window.buildDeckSingle = function(categoryKey, count, diff) {
      console.log('buildDeckSingle fallback:', categoryKey, count, diff);
      const bank = window.getBank();
      let pool = bank[categoryKey] || [];
      
      if (pool.length === 0) {
        // Si no hay preguntas en la categoría, usar todas
        pool = [];
        Object.values(bank).forEach(arr => {
          if (arr) pool.push(...arr);
        });
      }
      
      // Mezclar y tomar las que necesitamos
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, shuffled.length));
    };
    
    window.ensureInitial60 = async function() {
      return window.getBank();
    };
    
    window.ensureBankReady = async function() {
      return window.getBank();
    };
    
    window.warmLocalBank = async function() {
      return window.getBank();
    };
    
    // Guardar banco de fallback
    window.setBank(fallbackBank);
    
    console.log('✅ Funciones de banco de fallback creadas');
    console.log('Total de preguntas:', window.getBankCount());
    
    // Disparar evento
    window.dispatchEvent(new Event('bankReady'));
  });
})();