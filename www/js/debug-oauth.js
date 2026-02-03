// js/debug-oauth.js
// Herramienta de debug para OAuth

export async function debugOAuth() {

    // 1. Verificar configuración

    // 2. Verificar Supabase

    if (window.supabaseClient) {

      console.log('   - Key:', window.supabaseClient.supabaseKey?.substring(0, 20) + '...');
    }
    
    // 3. Verificar configuración OAuth

    const config = {
      clientId: '339736953753-h9oekqkii28804iv84r5mqad61p7m4es.apps.googleusercontent.com',
      redirectTo: window.location.origin + window.location.pathname,
      options: { access_type: 'offline', prompt: 'consent' }
    };

    // 4. Verificar URLs de Google Cloud

    const origin = window.location.origin;

    // 5. Verificar configuración de Supabase

  }
  
  // Función para probar OAuth paso a paso
  export async function testOAuthStepByStep() {

    try {
      // Paso 1: Verificar Supabase

      if (!window.supabaseClient) {
        throw new Error('Supabase no está disponible');
      }

      // Paso 2: Obtener configuración

      const config = {
        clientId: '339736953753-h9oekqkii28804iv84r5mqad61p7m4es.apps.googleusercontent.com',
        redirectTo: window.location.origin + window.location.pathname,
        options: { access_type: 'offline', prompt: 'consent' }
      };

      // Paso 3: Probar signInWithOAuth

      const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: config.redirectTo,
          queryParams: config.options
        }
      });
      
      if (error) {

      } else {

      }
      
    } catch (error) {

    }

  }
  
// Hacer funciones disponibles globalmente (versiones que manejan async)
window.debugOAuth = async function() {
  try {
    await debugOAuth();
  } catch (error) {

  }
};

window.testOAuthStepByStep = async function() {
  try {
    await testOAuthStepByStep();
  } catch (error) {

  }
};

// Función para procesar tokens de URL manualmente
window.processUrlTokens = function() {

  // Obtener fragmento de la URL
  const hashFragment = window.location.hash.substring(1);
  const searchParams = new URLSearchParams(hashFragment);
  
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const tokenType = searchParams.get('token_type');
  const expiresIn = searchParams.get('expires_in');
  
  console.log('Tokens encontrados:', {
    accessToken: accessToken ? accessToken.substring(0, 20) + '...' : null,
    refreshToken: refreshToken ? refreshToken.substring(0, 20) + '...' : null,
    tokenType,
    expiresIn
  });
  
  if (accessToken && refreshToken) {

    // Establecer la sesión manualmente
    window.supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    }).then(({ data, error }) => {
      if (error) {

      } else {

        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Recargar para actualizar UI
        setTimeout(() => {

          window.location.reload();
        }, 1000);
      }
    });
  } else {

  }
};

// También crear una versión simple para testing rápido
window.testOAuthSimple = function() {

  if (window.supabaseClient) {

    window.supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    }).then(({ data, error }) => {
      if (error) {

      } else {

      }
    });
  } else {

  }
};