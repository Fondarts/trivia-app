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
    const redirectTo = isAndroid()
      ? 'com.quizle.app://oauth/callback'
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

// Función para manejar el callback (solo para Android)
if (isAndroid() && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
  console.log('📱 Configurando listener para Android');
  
  window.Capacitor.Plugins.App.addListener('appUrlOpen', async (event) => {
    console.log('🔗 URL recibida:', event.url);
    
    if (event.url && event.url.includes('#access_token')) {
      console.log('🎯 Token detectado, procesando...');
      
      // Extraer tokens de la URL
      const hashFragment = event.url.split('#')[1];
      if (hashFragment) {
        const params = new URLSearchParams(hashFragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken) {
          console.log('✅ Tokens encontrados, estableciendo sesión...');
          
          try {
            const { data, error } = await window.supabaseClient.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (error) {
              console.error('❌ Error estableciendo sesión:', error);
              alert('Error al procesar login');
            } else if (data.session) {
              console.log('🎉 ¡Login exitoso!', data.session.user.email);
              
              // Notificar cambio de estado de autenticación antes de recargar
              if (window.onAuthStateChanged) {
                const user = {
                  id: data.session.user.id,
                  email: data.session.user.email,
                  name: data.session.user.user_metadata?.full_name || data.session.user.email,
                  avatar: data.session.user.user_metadata?.avatar_url,
                  isGuest: false
                };
                window.onAuthStateChanged(user);
              }
              
              // Recargar la página para actualizar la UI
              setTimeout(() => {
                window.location.reload();
              }, 1000); // Aumentar delay para permitir sincronización
            }
          } catch (e) {
            console.error('❌ Error crítico:', e);
            alert('Error procesando login');
          }
        }
      }
    }
  });
}

console.log('✅ Simple OAuth configurado para:', isAndroid() ? 'Android' : 'Web');

