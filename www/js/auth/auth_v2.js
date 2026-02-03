// ============================================
// SISTEMA DE AUTENTICACIÓN CON GOOGLE OAUTH
// Versión 2.0 - Reescrito desde cero
// ============================================

// Configuración OAuth simple integrada
const OAUTH_CONFIG = {
  WEB_CLIENT_ID: '339736953753-h9oekqkii28804iv84r5mqad61p7m4es.apps.googleusercontent.com',
  SUPABASE_CALLBACK_URL: 'https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback'
};

function getOAuthConfig() {
  // Para web, usar la URL actual (funciona tanto en localhost como en producción)
  const redirectTo = window.location.origin + '/auth-callback.html';

  return {
    clientId: OAUTH_CONFIG.WEB_CLIENT_ID,
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

  // Verificar que Supabase esté disponible
  if (!window.supabaseClient) {

    return null;
  }
  
  try {
    // Primero verificar si hay callback OAuth en la URL
    const hashFragment = window.location.hash;
    if (hashFragment && hashFragment.includes('access_token')) {

      const user = await handleOAuthCallback();
      if (user) {
        return user;
      }
    }
    
    // Verificar sesión existente
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    
    if (error) {

      return null;
    }
    
    if (session) {

      const user = transformSupabaseUser(session.user);
      setAuthState(user, session);
      return user;
    }

    // Configurar listener para cambios de autenticación
    window.supabaseClient.auth.onAuthStateChange((event, session) => {

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

      // Verificar si hay un login pendiente
      if (localStorage.getItem('pending_oauth') === 'true') {

        localStorage.removeItem('pending_oauth');
        
        // Intentar obtener sesión varias veces
        let attempts = 0;
        const checkInterval = setInterval(async () => {
          attempts++;

          const { data: { session } } = await window.supabaseClient.auth.getSession();
          
          if (session) {

            clearInterval(checkInterval);
            
            const user = transformSupabaseUser(session.user);
            setAuthState(user, session);
            
            if (window.onAuthStateChanged) {
              window.onAuthStateChanged(user);
            }
            
            // Recargar para actualizar toda la UI
            setTimeout(() => window.location.reload(), 500);
          } else if (attempts >= 10) {

            clearInterval(checkInterval);
          }
        }, 1000);
      }
      
      // Listener para cuando la app vuelve del background
      window.addEventListener('resume', async () => {

        // Esperar un momento para que los tokens se procesen
        setTimeout(async () => {
          const { data: { session } } = await window.supabaseClient.auth.getSession();
          
          if (session && !authState.user) {

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

        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        if (session && !authState.user) {

          const user = transformSupabaseUser(session.user);
          setAuthState(user, session);
          
          if (window.onAuthStateChanged) {
            window.onAuthStateChanged(user);
          }
          
          window.location.reload();
        }
      }
    });
    
    authState.isInitialized = true;
    return null;
    
  } catch (error) {

    return null;
  }
}

/**
 * Inicia sesión con Google
 */
export async function signInWithGoogle() {

  if (!window.supabaseClient) {
    throw new Error('Supabase no está disponible');
  }

  // Obtener configuración OAuth
  const oauthConfig = getOAuthConfig();
  try {
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

    return data;
    
  } catch (error) {

    throw error;
  }
}

/**
 * Cierra la sesión actual
 */
export async function signOut() {

  try {
    // Cerrar sesión en Supabase
    if (window.supabaseClient) {
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) {

      }
    }
    
    // Limpiar estado local
    setAuthState(null, null);
    localStorage.removeItem('current_user');
    localStorage.removeItem('user_session');

    // Notificar a la UI
    if (window.onAuthStateChanged) {
      window.onAuthStateChanged(null);
    }
    
  } catch (error) {

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

  // Buscar avatar en múltiples campos posibles
  const avatarUrl = supabaseUser.user_metadata?.avatar_url || 
                   supabaseUser.user_metadata?.picture ||
                   supabaseUser.user_metadata?.avatar ||
                   supabaseUser.user_metadata?.photo_url ||
                   supabaseUser.user_metadata?.profile_picture ||
                   supabaseUser.user_metadata?.image ||
                   'img/avatarman.webp';

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

  // Verificar si hay fragmento en la URL (tokens)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  
  if (accessToken && refreshToken) {

    try {
      // Establecer la sesión manualmente con los tokens
      const { data, error } = await window.supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      if (error) {

        return null;
      }
      
      if (data.session && data.user) {

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

export default {
  initAuth,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  getCurrentSession,
  isAuthenticated,
  handleOAuthCallback
};