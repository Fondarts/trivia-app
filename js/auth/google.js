// js/auth/google.js - Sistema de autenticación con Google

// Estado del usuario actual
let currentUser = null;

// Función para obtener el usuario actual
export function getCurrentUser() {
  return currentUser;
}

// Función para establecer el usuario actual
export function setCurrentUser(user) {
  currentUser = user;
  if (window.updateAuthUI) {
    window.updateAuthUI(user);
  }
}

// Función para cerrar sesión
export async function signOut() {
  // Usar el handler OAuth unificado
  if (window.handleGoogleLogout) {
    await window.handleGoogleLogout();
  } else if (window.supabaseClient) {
    try {
      await window.supabaseClient.auth.signOut();
    } catch (error) {
      console.log('Error cerrando sesión:', error);
    }
  }
  currentUser = null;
  localStorage.removeItem('current_user');
}

// Función para inicializar Google Auth
export async function initGoogleAuth(supabase) {
  if (!supabase) return null;
  
  try {
    // Verificar sesión existente usando el handler unificado
    let user = null;
    
    if (window.checkExistingSession) {
      user = await window.checkExistingSession();
    } else {
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    }
    
    if (user) {
      // Usuario autenticado con Google
      const userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        avatar: user.user_metadata?.avatar_url || 'img/avatar_placeholder.svg',
        isGuest: false
      };
      
      currentUser = userData;
      localStorage.setItem('current_user', JSON.stringify(userData));
      
      // Configurar callbacks para cambios de auth
      window.handleAuthSuccess = (user) => {
        const userData = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar: user.user_metadata?.avatar_url || 'img/avatar_placeholder.svg',
          isGuest: false
        };
        currentUser = userData;
        localStorage.setItem('current_user', JSON.stringify(userData));
        if (window.updateAuthUI) window.updateAuthUI(userData);
      };
      
      window.handleAuthLogout = () => {
        currentUser = null;
        localStorage.removeItem('current_user');
        if (window.updateAuthUI) window.updateAuthUI(null);
      };
      
      return userData;
    }
    
    return null;
  } catch (error) {
    console.log('Error verificando sesión:', error);
    return null;
  }
}

// Hacer funciones disponibles globalmente
window.getCurrentUser = getCurrentUser;
window.signOut = signOut;
window.initGoogleAuth = initGoogleAuth;