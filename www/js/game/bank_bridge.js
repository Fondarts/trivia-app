// js/bank_bridge.js - Puente para exponer funciones de bank.js globalmente
(function() {
  'use strict';

  // Función helper para disparar el evento bankReady de forma segura
  function dispatchBankReady() {
    try {
      window.dispatchEvent(new Event('bankReady'));
    } catch (e) {
      // Si dispatchEvent falla, usar setTimeout como fallback
      setTimeout(() => {
        if (window.dispatchEvent) {
          window.dispatchEvent(new Event('bankReady'));
        }
      }, 100);
    }
  }

  // Importar las funciones necesarias de bank.js
  import('./bank.js').then(async function(module) {
    try {
      // Exponer todas las funciones necesarias globalmente
      window.buildDeckSingle = module.buildDeckSingle;
      window.getBank = module.getBank;
      window.setBank = module.setBank;
      window.getBankCount = module.getBankCount;
      window.ensureInitial60 = module.ensureInitial60;
      window.warmLocalBank = module.warmLocalBank;
      window.ensureBankReady = module.ensureBankReady;
      
      // Inicializar el banco automáticamente
      await module.ensureBankReady('en');
      const count = module.getBankCount();

      // Disparar evento para indicar que el banco está listo
      dispatchBankReady();
      
    } catch (error) {
      // Crear banco de fallback vacío (solo categoría bible)
      const fallbackBank = {
        bible: []
      };
      
      // Guardar banco de fallback
      try {
        localStorage.setItem('trivia_bank', JSON.stringify(fallbackBank));
      } catch (e) {
        // Ignorar errores de localStorage
      }

      // Disparar evento incluso si hay error
      dispatchBankReady();
    }
    
  }).catch(function() {
    // Fallback completo: crear funciones básicas

    // Crear banco de fallback vacío (solo categoría bible)
    const fallbackBank = {
      bible: []
    };
    
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
    
    window.buildDeckSingle = async function(categoryKey, count, diff) {

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
    try {
      window.setBank(fallbackBank);
    } catch (e) {
      // Ignorar errores
    }
    
    // Disparar evento siempre, incluso si hay errores
    dispatchBankReady();
  });
})();