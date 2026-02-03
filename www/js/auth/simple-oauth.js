// js/auth/simple-oauth.js
// Sistema OAuth simple y limpio para Web

// Configuración OAuth
const OAUTH_CONFIG = {
  GOOGLE_CLIENT_ID_WEB: '339736953753-h9oekqkii28804iv84r5mqad61p7m4es.apps.googleusercontent.com',
  SUPABASE_URL: 'https://fpjkdibubjdbskthofdp.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwamtkaWJ1YmpkYnNrdGhvZmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MzI5NzIsImV4cCI6MjA3MDMwODk3Mn0.oYN5p3Mh_8omCGlCfVApRY_YCG-fFW5MWdeuYsNLgHc'
};

// Función principal de login
window.simpleGoogleLogin = async function() {

  if (!window.supabaseClient) {

    alert('Error: Sistema no disponible');
    return;
  }
  
  try {
    // Redirección para web
    const redirectTo = window.location.origin + window.location.pathname;

    const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    
    if (error) {
      throw error;
    }

  } catch (error) {

    alert('Error al iniciar sesión: ' + error.message);
  }
};

// Función para manejar el callback de OAuth
async function handleOAuthCallback(url) {

  if (!url || !url.includes('#access_token')) {
    return false;
  }
  
  try {
    // Extraer tokens de la URL
    const hashFragment = url.split('#')[1];
    if (!hashFragment) {
      return false;
    }
    
    const params = new URLSearchParams(hashFragment);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    
    if (!accessToken) {

      return false;
    }

    if (!window.supabaseClient) {

      return false;
    }
    
    // Establecer sesión con los tokens
    const { data, error } = await window.supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    });
    
    if (error) {

      return false;
    }
    
    if (!data.session) {

      return false;
    }

    // Guardar datos del usuario
    const userData = {
      id: data.session.user.id,
      email: data.session.user.email,
      name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0],
      avatar: data.session.user.user_metadata?.avatar_url || 'img/avatar_placeholder.svg',
      isGuest: false
    };
    
    localStorage.setItem('current_user', JSON.stringify(userData));
    localStorage.removeItem('pending_oauth');
    
    // Notificar cambio de estado de autenticación
    if (window.onAuthStateChanged) {
      window.onAuthStateChanged(userData);
    }
    
    // Mostrar mensaje de éxito
    if (window.toast) {
      window.toast('¡Login exitoso con Google!');
    }
    
    // Recargar la página para actualizar la UI
    setTimeout(() => {
      window.location.href = './index.html';
    }, 500);
    
    return true;
  } catch (error) {

    return false;
  }
}

// Configurar listener para callbacks de OAuth (Web)
window.addEventListener('load', () => {
  const currentUrl = window.location.href;
  if (currentUrl.includes('oauth/callback') || currentUrl.includes('#access_token')) {

    handleOAuthCallback(currentUrl);
  }
});

// Exportar función para uso global
window.handleOAuthCallback = handleOAuthCallback;
