// js/platform/capacitor-google-auth.js
// Solución simple de OAuth para Capacitor sin plugins adicionales

(function() {
  'use strict';
  
  // Detectar si estamos en Capacitor
  const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  
  console.log('Capacitor Auth - Plataforma detectada:', {
    isCapacitor,
    platform: window.Capacitor?.getPlatform?.(),
    isNative: window.Capacitor?.isNativePlatform?.()
  });
  
  // Función para manejar el login con Google usando el flujo web estándar
  window.handleCapacitorGoogleLogin = async function() {
    console.log('Iniciando Google Login...');
    // Siempre usar el flujo web de Supabase para login
    if (!window.supabaseClient) {
      console.error('Supabase no está disponible');
      alert('Error: Sistema de autenticación no disponible');
      return null;
    }
    try {
      const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://fpjkdibubjdbskthofdp.supabase.co/oauth-callback.html'
        }
      });
      if (error) {
        throw error;
      }
      console.log('OAuth iniciado correctamente');
      return null;
    } catch (error) {
      console.error('Error en Google Login:', error);
      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        console.log('Login cancelado por el usuario');
        return null;
      }
      alert('Error al iniciar sesión con Google: ' + (error.message || 'Error desconocido'));
      return null;
    }
  };
  
  // Función para cerrar sesión
  window.handleCapacitorGoogleLogout = async function() {
    console.log('Cerrando sesión...');
    
    try {
      if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
        console.log('Sesión cerrada en Supabase');
      }
      
      localStorage.removeItem('current_user');
      
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };
  
  console.log('Sistema de autenticación configurado correctamente');
  
})();
