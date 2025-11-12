// js/auth/simple-oauth.js
// Sistema OAuth simple y limpio para Android

console.log('🔐 Simple OAuth System cargado');

// Configuración OAuth
const OAUTH_CONFIG = {
  GOOGLE_CLIENT_ID_WEB: '339736953753-h9oekqkii28804iv84r5mqad61p7m4es.apps.googleusercontent.com',
  GOOGLE_CLIENT_ID_ANDROID: '339736953753-shffn13ho0g92064uh7ooj95pcgebpoj.apps.googleusercontent.com',
  SUPABASE_URL: 'https://fpjkdibubjdbskthofdp.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwamtkaWJ1YmpkYnNrdGhvZmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MzI5NzIsImV4cCI6MjA3MDMwODk3Mn0.oYN5p3Mh_8omCGlCfVApRY_YCG-fFW5MWdeuYsNLgHc'
};

// Detectar plataforma
function isAndroid() {
  return window.Capacitor && window.Capacitor.getPlatform() === 'android';
}

function isWeb() {
  return !window.Capacitor || window.Capacitor.getPlatform() === 'web';
}

// Función principal de login
window.simpleGoogleLogin = async function() {
  console.log('🚀 Iniciando Simple Google Login');
  
  if (!window.supabaseClient) {
    console.error('❌ Supabase no disponible');
    alert('Error: Sistema no disponible');
    return;
  }
  
  try {
    // Redirección dinámica: web → origin actual; Android → deep link
    // Usar el appId correcto de capacitor.config.json
    const redirectTo = isAndroid()
      ? 'app.quizlo.trivia://oauth/callback'
      : (window.location.origin + window.location.pathname);

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
    
    console.log('✅ OAuth iniciado correctamente');
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    alert('Error al iniciar sesión: ' + error.message);
  }
};

// Función para manejar el callback de OAuth (para Android)
async function handleOAuthCallback(url) {
  console.log('🔄 Procesando callback OAuth:', url);
  
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
      console.log('⚠️ No se encontró access_token en la URL');
      return false;
    }
    
    console.log('✅ Tokens encontrados, estableciendo sesión...');
    
    if (!window.supabaseClient) {
      console.error('❌ Supabase no disponible');
      return false;
    }
    
    // Establecer sesión con los tokens
    const { data, error } = await window.supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    });
    
    if (error) {
      console.error('❌ Error estableciendo sesión:', error);
      return false;
    }
    
    if (!data.session) {
      console.error('❌ No se pudo obtener la sesión');
      return false;
    }
    
    console.log('🎉 ¡Login exitoso!', data.session.user.email);
    
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
    console.error('❌ Error procesando callback:', error);
    return false;
  }
}

// Configurar listener para Android (usando Capacitor App plugin)
if (isAndroid() && window.Capacitor) {
  console.log('📱 Configurando listener de deep links para Android');
  
  // Intentar usar el plugin App de Capacitor
  if (window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.addListener('appUrlOpen', async (event) => {
      console.log('🔗 Deep link recibido:', event.url);
      
      if (event.url && (event.url.includes('oauth/callback') || event.url.includes('#access_token'))) {
        await handleOAuthCallback(event.url);
      }
    });
    
    // También verificar si la app se abrió con un deep link al iniciar
    window.Capacitor.Plugins.App.getLaunchUrl().then((result) => {
      if (result && result.url) {
        console.log('🔗 Launch URL detectada:', result.url);
        if (result.url.includes('oauth/callback') || result.url.includes('#access_token')) {
          handleOAuthCallback(result.url);
        }
      }
    }).catch(() => {
      // No hay launch URL, es normal
    });
  } else {
    console.warn('⚠️ Capacitor App plugin no disponible, usando método alternativo');
    
    // Método alternativo: verificar la URL actual al cargar
    window.addEventListener('load', () => {
      const currentUrl = window.location.href;
      if (currentUrl.includes('oauth/callback') || currentUrl.includes('#access_token')) {
        console.log('🔗 Callback detectado en URL actual:', currentUrl);
        handleOAuthCallback(currentUrl);
      }
    });
  }
}

// Exportar función para uso global
window.handleOAuthCallback = handleOAuthCallback;

console.log('✅ Simple OAuth configurado para:', isAndroid() ? 'Android' : 'Web');

