// js/auth/oauth-handler.js
// Manejador unificado para el callback de OAuth en Capacitor (Android/iOS)

(function() {
  'use strict';
  
  // Solo ejecutar en Capacitor
  if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) {
    return;
  }
  
  console.log(' Módulo OAuth Handler para Capacitor activado.');
  
  const { App } = window.Capacitor.Plugins;
  
  // Escuchar el evento 'appUrlOpen' que Capacitor dispara cuando se abre la app con una URL
  App.addListener('appUrlOpen', async (event) => {
    console.log('Evento appUrlOpen recibido:', event.url);
    
    // Verificar si la URL contiene el token de Supabase
    if (event.url && event.url.includes('#access_token')) {
      // Indicar que estamos procesando para evitar recargas múltiples
      if (sessionStorage.getItem('oauth_processing')) {
        console.log('Ya se está procesando un callback de OAuth.');
        return;
      }
      sessionStorage.setItem('oauth_processing', 'true');
      
      try {
        // Supabase maneja el hash de la URL para establecer la sesión
        // Esperamos a que el cliente de Supabase esté disponible
        const supabase = await getSupabaseClientWithRetry();
        
        // La librería de Supabase debería detectar el hash y establecer la sesión automáticamente.
        // Forzamos una verificación para asegurarnos.
        
        // Esperamos un momento para que la librería JS de Supabase procese el hash
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error obteniendo la sesión después del redirect:', error);
          alert('Hubo un error al iniciar sesión. Por favor, intenta de nuevo.');
        } else if (session) {
          console.log('¡Sesión establecida con éxito!', session.user.email);
          
          // Guardamos un flag para que main.js sepa que el login fue exitoso
          localStorage.setItem('auth_success', 'true');
          
          // Redirigir a la página principal para refrescar el estado de la UI
          // Usamos un pequeño delay para asegurar que la sesión se guarde
          setTimeout(() => {
            // No recargar la página completa, sino notificar a la app principal
            if (window.onAuthStateChanged) {
              const user = window.AuthSystem.getCurrentUser();
              window.onAuthStateChanged(user);
            }
             // Recargar la página para que el estado se actualice en toda la app
            window.location.replace(window.location.origin + window.location.pathname);
          }, 200);
          
        } else {
          console.warn('No se pudo establecer la sesión después del redirect.');
          alert('No se pudo completar el inicio de sesión. Intenta de nuevo.');
        }
      } catch (e) {
        console.error('Error crítico en el manejador de OAuth:', e);
        alert('Ocurrió un error inesperado durante el inicio de sesión.');
      } finally {
        sessionStorage.removeItem('oauth_processing');
      }
    }
  });

  // Función para obtener el cliente de Supabase con reintentos
  async function getSupabaseClientWithRetry(retries = 5, delay = 500) {
    for (let i = 0; i < retries; i++) {
      if (window.supabaseClient) {
        return window.supabaseClient;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error('El cliente de Supabase no está disponible.');
  }

})();
