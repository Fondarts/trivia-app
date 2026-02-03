// SOLUCIÓN TEMPORAL: Interceptar el error del plugin de Google
// Agregar este script antes de que se carguen otros scripts

(function() {
  'use strict';

  // Interceptar errores relacionados con Google Auth plugin
  window.addEventListener('error', function(event) {
    const errorMessage = event.message || '';
    
    if (errorMessage.includes('plugin') && 
        (errorMessage.includes('Google') || errorMessage.includes('google'))) {

      // Prevenir que el error se muestre al usuario
      event.preventDefault();
      event.stopPropagation();
      
      // Mostrar mensaje personalizado en consola

      return false;
    }
  });
  
  // Interceptar mensajes de consola relacionados con plugins
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('plugin') && 
        (message.includes('Google') || message.includes('google'))) {

      return;
    }
    
    // Llamar al console.error original para otros errores
    originalConsoleError.apply(console, args);
  };
  
  // Crear objeto dummy para GoogleAuth si no existe (solo para evitar errores)
  if (typeof window.GoogleAuth === 'undefined') {
    window.GoogleAuth = {
      signIn: function() {

        return Promise.reject(new Error('Usar autenticación web'));
      },
      signOut: function() {

        return Promise.resolve();
      },
      initialize: function() {
        console.log('ℹ️ Google Auth inicializado (modo web)');
        return Promise.resolve();
      }
    };
  }

})();
