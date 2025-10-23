// ============================================
// SISTEMA DE AUTENTICACIÓN CON GOOGLE OAUTH
// Versión 2.0 - Reescrito desde cero
// ============================================

// Configuración OAuth simple integrada
const OAUTH_CONFIG = {
  WEB_CLIENT_ID: '339736953753-h9oekqkii28804iv84r5mqad61p7m4es.apps.googleusercontent.com',
  ANDROID_CLIENT_ID: '339736953753-shffn13ho0g92064uh7ooj95pcgebpoj.apps.googleusercontent.com',
  SUPABASE_CALLBACK_URL: 'https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback'
};

function getOAuthConfig() {
  const isAndroid = window.Capacitor && window.Capacitor.getPlatform() === 'android';
  const redirectTo = isAndroid
    ? 'com.quizle.app://oauth/callback'
    : (window.location.origin + window.location.pathname);
  return {
    clientId: isAndroid ? OAUTH_CONFIG.ANDROID_CLIENT_ID : OAUTH_CONFIG.WEB_CLIENT_ID,
    redirectTo,
    options: {
      access_type: 'offline',
      prompt: 'consent'
    }
  };
}

// Estado global de autenticación
let authState = {
  user: null,
  session: null,
  isInitialized: false
};

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Inicializa el sistema de autenticación
 */
export async function initAuth() {
  console.log('🔐 Inicializando sistema de autenticación...');
  
  // Verificar que Supabase esté disponible
  if (!window.supabaseClient) {
    console.error('❌ Supabase no está disponible');
    return null;
  }
  
  try {
    // Primero verificar si hay callback OAuth en la URL
    const hashFragment = window.location.hash;
    if (hashFragment && hashFragment.includes('access_token')) {
      console.log('🔄 Detectado callback OAuth, procesando...');
      const user = await handleOAuthCallback();
      if (user) {
        return user;
      }
    }
    
    // Verificar sesión existente
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    
    if (error) {
      console.error('❌ Error obteniendo sesión:', error);
      return null;
    }
    
    if (session) {
      console.log('✅ Sesión existente encontrada');
      const user = transformSupabaseUser(session.user);
      setAuthState(user, session);
      return user;
    }
    
    console.log('ℹ️ No hay sesión activa');
    
    // Configurar listener para cambios de autenticación
    window.supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        const user = transformSupabaseUser(session.user);
        setAuthState(user, session);
        
        // Notificar a la UI
        if (window.onAuthStateChanged) {
          window.onAuthStateChanged(user);
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthState(null, null);
        
        // Notificar a la UI
        if (window.onAuthStateChanged) {
          window.onAuthStateChanged(null);
        }
      }
    });
    
    // En Android, verificar sesión cuando la app vuelve del background
    if (window.Capacitor && window.Capacitor.getPlatform() === 'android') {
      console.log('📱 Configurando listener para Android');
      
      // Verificar si hay un login pendiente
      if (localStorage.getItem('pending_oauth') === 'true') {
        console.log('⏳ OAuth pendiente detectado, verificando...');
        localStorage.removeItem('pending_oauth');
        
        // Intentar obtener sesión varias veces
        let attempts = 0;
        const checkInterval = setInterval(async () => {
          attempts++;
          console.log(`Intento ${attempts} de verificar sesión...`);
          
          const { data: { session } } = await window.supabaseClient.auth.getSession();
          
          if (session) {
            console.log('✅ ¡Sesión encontrada!');
            clearInterval(checkInterval);
            
            const user = transformSupabaseUser(session.user);
            setAuthState(user, session);
            
            if (window.onAuthStateChanged) {
              window.onAuthStateChanged(user);
            }
            
            // Recargar para actualizar toda la UI
            setTimeout(() => window.location.reload(), 500);
          } else if (attempts >= 10) {
            console.log('⚠️ No se pudo obtener sesión después de 10 intentos');
            clearInterval(checkInterval);
          }
        }, 1000);
      }
      
      // Listener para cuando la app vuelve del background
      window.addEventListener('resume', async () => {
        console.log('📱 App resumed, verificando sesión...');
        
        // Esperar un momento para que los tokens se procesen
        setTimeout(async () => {
          const { data: { session } } = await window.supabaseClient.auth.getSession();
          
          if (session && !authState.user) {
            console.log('✅ Sesión detectada después de resume');
            const user = transformSupabaseUser(session.user);
            setAuthState(user, session);
            
            // Notificar a la UI
            if (window.onAuthStateChanged) {
              window.onAuthStateChanged(user);
            }
            
            // Recargar la página para actualizar todo
            window.location.reload();
          }
        }, 2000);
      });
      
      // También verificar en visibilitychange
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
          console.log('📱 App visible, verificando sesión...');
          const { data: { session } } = await window.supabaseClient.auth.getSession();
          
          if (session && !authState.user) {
            console.log('✅ Sesión detectada en visibility change');
            const user = transformSupabaseUser(session.user);
            setAuthState(user, session);
            
            if (window.onAuthStateChanged) {
              window.onAuthStateChanged(user);
            }
            
            window.location.reload();
          }
        }
      });
    }
    
    authState.isInitialized = true;
    return null;
    
  } catch (error) {
    console.error('❌ Error inicializando auth:', error);
    return null;
  }
}

/**
 * Inicia sesión con Google
 */
export async function signInWithGoogle() {
  console.log('🚀 Iniciando login con Google...');
  console.log('🌐 Current URL:', window.location.href);
  console.log('🌐 Origin:', window.location.origin);

  if (!window.supabaseClient) {
    throw new Error('Supabase no está disponible');
  }

  // Obtener configuración OAuth
  const oauthConfig = getOAuthConfig();
  const isAndroid = window.Capacitor && window.Capacitor.getPlatform() === 'android';
  
  console.log('📱 Plataforma detectada:', { 
    isAndroid, 
    platform: window.Capacitor?.getPlatform() || 'web' 
  });
  
  try {
    // En Android, guardar flag para detectar cuando regrese
    if (isAndroid) {
      localStorage.setItem('pending_oauth', 'true');
    }

    // Usar el flujo OAuth de Supabase
    const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: oauthConfig.redirectTo,
        queryParams: {
          ...oauthConfig.options,
          scope: 'openid email profile'
        }
      }
    });
    
    if (error) {
      if (isAndroid) {
        localStorage.removeItem('pending_oauth');
      }
      
      console.error('❌ Error en OAuth:', error);

      // Si es error 500, significa que el redirect URL no está configurado
      if (error.message && (error.message.includes('500') || error.message.includes('unexpected_failure'))) {
        throw new Error(`
Error de configuración en Supabase.

SOLUCIÓN:
1. Ve a https://supabase.com/dashboard/project/fpjkdibubjdbskthofdp/auth/url-configuration
2. En "Redirect URLs", agrega esta URL:
   ${oauthConfig.redirectTo}
3. Guarda los cambios y vuelve a intentar

URL que necesitas agregar: ${oauthConfig.redirectTo}
        `);
      }

      throw error;
    }
    
    console.log('✅ OAuth iniciado, redirigiendo...');
    return data;
    
  } catch (error) {
    console.error('❌ Error en signInWithGoogle:', error);
    throw error;
  }
}

/**
 * Login nativo para Android (requiere plugin Capacitor Google Auth)
 */
async function signInWithGoogleNative() {
  console.log('📱 Usando login nativo de Android...');
  
  try {
    const { GoogleAuth } = window.Capacitor.Plugins;
    
    // Inicializar el plugin si es necesario
    await GoogleAuth.initialize({
      clientId: AUTH_CONFIG.GOOGLE_CLIENT_ID,
      scopes: ['profile', 'email']
    });
    
    // Realizar login nativo
    const googleUser = await GoogleAuth.signIn();
    
    if (!googleUser || !googleUser.authentication) {
      throw new Error('No se obtuvo respuesta del login nativo');
    }
    
    console.log('✅ Login nativo exitoso, autenticando con Supabase...');
    
    // Autenticar con Supabase usando el token de Google
    const { data, error } = await window.supabaseClient.auth.signInWithIdToken({
      provider: 'google',
      token: googleUser.authentication.idToken,
      nonce: googleUser.authentication.nonce || 'nonce' // Algunos plugins no devuelven nonce
    });
    
    if (error) {
      console.error('❌ Error autenticando con Supabase:', error);
      throw error;
    }
    
    console.log('✅ Autenticación completa');
    return data;
    
  } catch (error) {
    console.error('❌ Error en login nativo:', error);
    // Fallback al flujo web
    console.log('⚠️ Intentando con flujo web como fallback...');
    return await signInWithGoogle();
  }
}

/**
 * Cierra la sesión actual
 */
export async function signOut() {
  console.log('👋 Cerrando sesión...');
  
  try {
    // Cerrar sesión en Supabase
    if (window.supabaseClient) {
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) {
        console.error('⚠️ Error cerrando sesión en Supabase:', error);
      }
    }
    
    // Limpiar plugin nativo si está disponible
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) {
      try {
        await window.Capacitor.Plugins.GoogleAuth.signOut();
      } catch (e) {
        console.log('⚠️ No se pudo cerrar sesión en Google nativo:', e);
      }
    }
    
    // Limpiar estado local
    setAuthState(null, null);
    localStorage.removeItem('current_user');
    localStorage.removeItem('user_session');
    
    console.log('✅ Sesión cerrada');
    
    // Notificar a la UI
    if (window.onAuthStateChanged) {
      window.onAuthStateChanged(null);
    }
    
  } catch (error) {
    console.error('❌ Error cerrando sesión:', error);
    throw error;
  }
}

/**
 * Obtiene el usuario actual
 */
export function getCurrentUser() {
  return authState.user;
}

/**
 * Obtiene la sesión actual
 */
export function getCurrentSession() {
  return authState.session;
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated() {
  return authState.user !== null && authState.session !== null;
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Transforma un usuario de Supabase al formato de la app
 */
function transformSupabaseUser(supabaseUser) {
  if (!supabaseUser) return null;
  
  // Debug: mostrar todos los metadatos disponibles
  console.log('🔍 Metadatos del usuario de Supabase:', supabaseUser.user_metadata);
  
  // Buscar avatar en múltiples campos posibles
  const avatarUrl = supabaseUser.user_metadata?.avatar_url || 
                   supabaseUser.user_metadata?.picture ||
                   supabaseUser.user_metadata?.avatar ||
                   supabaseUser.user_metadata?.photo_url ||
                   supabaseUser.user_metadata?.profile_picture ||
                   supabaseUser.user_metadata?.image ||
                   'img/avatarman.webp';
  
  console.log('🖼️ Avatar URL encontrada:', avatarUrl);
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: supabaseUser.user_metadata?.full_name || 
          supabaseUser.user_metadata?.name ||
          supabaseUser.user_metadata?.display_name ||
          supabaseUser.email?.split('@')[0] || 
          'Usuario',
    avatar: avatarUrl,
    isGuest: false,
    provider: 'google',
    metadata: supabaseUser.user_metadata
  };
}

/**
 * Actualiza el estado de autenticación
 */
function setAuthState(user, session) {
  authState.user = user;
  authState.session = session;
  
  // Forzar recarga del avatar si está disponible
  if (user && user.avatar && user.avatar !== 'img/avatarman.webp') {
    console.log('🔄 Forzando recarga de avatar:', user.avatar);
    setTimeout(() => {
      const profileAvatar = document.getElementById('profileAvatar');
      if (profileAvatar) {
        profileAvatar.src = user.avatar + '?t=' + Date.now(); // Cache busting
      }
    }, 1000);
  }
  
  // Guardar en localStorage para persistencia
  if (user) {
    localStorage.setItem('current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('current_user');
  }
  
  if (session) {
    localStorage.setItem('user_session', JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at
    }));
  } else {
    localStorage.removeItem('user_session');
  }
}

/**
 * Maneja el callback de OAuth (para web)
 */
export async function handleOAuthCallback() {
  console.log('🔄 Procesando callback de OAuth...');
  
  // Verificar si hay fragmento en la URL (tokens)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  
  if (accessToken && refreshToken) {
    console.log('✅ Tokens encontrados en URL, estableciendo sesión manualmente...');
    
    try {
      // Establecer la sesión manualmente con los tokens
      const { data, error } = await window.supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      if (error) {
        console.error('❌ Error estableciendo sesión:', error);
        return null;
      }
      
      if (data.session && data.user) {
        console.log('✅ Sesión establecida correctamente');
        const user = transformSupabaseUser(data.user);
        setAuthState(user, data.session);
        
        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Notificar a la UI
        if (window.onAuthStateChanged) {
          window.onAuthStateChanged(user);
        }
        
        return user;
      }
    } catch (error) {
      console.error('❌ Error procesando callback:', error);
    }
  }
  
  return null;
}

// ============================================
// EXPORTAR AL SCOPE GLOBAL
// ============================================

// Hacer funciones disponibles globalmente
window.AuthSystem = {
  initAuth,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  getCurrentSession,
  isAuthenticated,
  handleOAuthCallback
};

// Mantener compatibilidad con código existente
window.getCurrentUser = getCurrentUser;
window.signOut = signOut;
window.initGoogleAuth = initAuth;

console.log('✅ Sistema de autenticación v2.0 cargado');

export default {
  initAuth,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  getCurrentSession,
  isAuthenticated,
  handleOAuthCallback
};