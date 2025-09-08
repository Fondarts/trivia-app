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
  if (window.supabaseClient) {
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
    // Verificar sesión existente
    const { data: { user } } = await supabase.auth.getUser();
    
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
      
      // Suscribirse a cambios de auth
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          currentUser = null;
          localStorage.removeItem('current_user');
          if (window.updateAuthUI) window.updateAuthUI(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url || 'img/avatar_placeholder.svg',
            isGuest: false
          };
          currentUser = userData;
          localStorage.setItem('current_user', JSON.stringify(userData));
          if (window.updateAuthUI) window.updateAuthUI(userData);
        }
      });
      
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
