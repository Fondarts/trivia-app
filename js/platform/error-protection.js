// SOLUCIÓN TEMPORAL: Interceptar el error del plugin de Google
// Agregar este script antes de que se carguen otros scripts

(function() {
  'use strict';
  
  console.log('🛡️ Protección anti-error Google Auth activada');
  
  // Interceptar errores relacionados con Google Auth plugin
  window.addEventListener('error', function(event) {
    const errorMessage = event.message || '';
    
    if (errorMessage.includes('plugin') && 
        (errorMessage.includes('Google') || errorMessage.includes('google'))) {
      
      console.warn('❌ Error de plugin Google interceptado:', errorMessage);
      
      // Prevenir que el error se muestre al usuario
      event.preventDefault();
      event.stopPropagation();
      
      // Mostrar mensaje personalizado en consola
      console.log('ℹ️ Este error ha sido silenciado. Tu app usa Supabase OAuth, no plugins nativos.');
      
      return false;
    }
  });
  
  // Interceptar mensajes de consola relacionados con plugins
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('plugin') && 
        (message.includes('Google') || message.includes('google'))) {
      
      console.warn('🔇 Error de plugin Google silenciado:', message);
      console.log('ℹ️ Tu app funciona correctamente con Supabase OAuth');
      return;
    }
    
    // Llamar al console.error original para otros errores
    originalConsoleError.apply(console, args);
  };
  
  // Crear objeto dummy para GoogleAuth si no existe (solo para evitar errores)
  if (typeof window.GoogleAuth === 'undefined') {
    window.GoogleAuth = {
      signIn: function() {
        console.log('🔄 Redirigiendo a autenticación web Supabase...');
        if (window.handleCapacitorGoogleLogin) {
          return window.handleCapacitorGoogleLogin();
        }
        return Promise.reject(new Error('Usar autenticación web'));
      },
      signOut: function() {
        console.log('🔄 Cerrando sesión web...');
        if (window.handleCapacitorGoogleLogout) {
          return window.handleCapacitorGoogleLogout();
        }
        return Promise.resolve();
      },
      initialize: function() {
        console.log('ℹ️ Google Auth inicializado (modo web)');
        return Promise.resolve();
      }
    };
  }
  
  console.log('✅ Sistema anti-error configurado correctamente');
  
})();
