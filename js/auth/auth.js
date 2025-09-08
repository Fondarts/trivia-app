// js/auth.js - Sistema de autenticación con Supabase

const AUTH_KEY = 'trivia_auth_session';
const USER_KEY = 'trivia_user_profile';

let sb = null;
let currentUser = null;
let authCallbacks = {
  onAuthStateChange: () => {},
  onProfileUpdate: () => {}
};

// Inicializar el módulo de autenticación
export async function initAuth(supabase, callbacks = {}) {
  try {
    sb = supabase;
    authCallbacks = { ...authCallbacks, ...callbacks };
    
    // Verificar sesión existente
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      await loadUserProfile(session.user);
    }
    
    // Escuchar cambios de autenticación
    sb.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      
      if (event === 'SIGNED_IN' && session) {
        await loadUserProfile(session.user);
        authCallbacks.onAuthStateChange({ event, user: currentUser });
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        localStorage.removeItem(USER_KEY);
        authCallbacks.onAuthStateChange({ event, user: null });
      }
    });
    
    return currentUser;
  } catch (error) {
    console.error('Error initializing auth:', error);
    // Retornar null si hay error para no bloquear la app
    return null;
  }
}

// Cargar/crear perfil de usuario desde la base de datos
async function loadUserProfile(authUser) {
  if (!authUser) return null;
  
  try {
    // Buscar perfil existente
    let { data: profile, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No existe perfil, crear uno nuevo
      const newProfile = {
        id: authUser.id,
        email: authUser.email,
        username: authUser.email.split('@')[0],
        display_name: authUser.email.split('@')[0],
        avatar_url: null,
        level: 1,
        total_xp: 0,
        stats: {
          questionsAnswered: 0,
          questionsCorrect: 0,
          totalGamesPlayed: 0,
          vsGamesWon: 0,
          bestWinStreak: 0
        },
        achievements: [],
        friends: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error: insertError } = await sb
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();
      
      if (!insertError) {
        profile = data;
      }
    }
    
    if (profile) {
      currentUser = profile;
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
      authCallbacks.onProfileUpdate(profile);
    }
    
    return profile;
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
}

// Registro con email y contraseña
export async function signUp(email, password, username = null) {
  try {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0]
        }
      }
    });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: error.message };
  }
}

// Login con email y contraseña
export async function signIn(email, password) {
  try {
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// Login como invitado (anónimo)
export async function signInAsGuest() {
  try {
    // Generar credenciales únicas para invitado
    const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const guestEmail = `${guestId}@guest.quizle.com`;
    const guestPassword = Math.random().toString(36).substr(2, 20);
    
    // Intentar crear cuenta de invitado
    const { data: signUpData, error: signUpError } = await sb.auth.signUp({
      email: guestEmail,
      password: guestPassword,
      options: {
        data: {
          is_guest: true,
          username: 'Invitado_' + Math.floor(Math.random() * 9999)
        }
      }
    });
    
    if (signUpError && signUpError.message.includes('already registered')) {
      // Si ya existe, intentar login
      return await signIn(guestEmail, guestPassword);
    }
    
    if (signUpError) throw signUpError;
    
    // Auto-login después del registro
    const { data: signInData, error: signInError } = await sb.auth.signInWithPassword({
      email: guestEmail,
      password: guestPassword
    });
    
    if (signInError) throw signInError;
    
    // Guardar credenciales de invitado localmente para reconexión
    localStorage.setItem('guest_credentials', JSON.stringify({ email: guestEmail, password: guestPassword }));
    
    return { success: true, data: signInData, isGuest: true };
  } catch (error) {
    console.error('Guest login error:', error);
    return { success: false, error: error.message };
  }
}

// Cerrar sesión
export async function signOut() {
  try {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
    
    currentUser = null;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('guest_credentials');
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Obtener usuario actual
export function getCurrentUser() {
  if (currentUser) return currentUser;
  
  // Intentar cargar desde localStorage
  try {
    const cached = localStorage.getItem(USER_KEY);
    if (cached) {
      currentUser = JSON.parse(cached);
      return currentUser;
    }
  } catch {}
  
  return null;
}

// Verificar si el usuario está autenticado
export async function isAuthenticated() {
  const { data: { session } } = await sb.auth.getSession();
  return !!session;
}

// Actualizar perfil de usuario
export async function updateProfile(updates) {
  if (!currentUser) return { success: false, error: 'No user logged in' };
  
  try {
    const { data, error } = await sb
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.id)
      .select()
      .single();
    
    if (error) throw error;
    
    currentUser = data;
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    authCallbacks.onProfileUpdate(data);
    
    return { success: true, data };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
}

// Actualizar estadísticas del usuario
export async function updateUserStats(statsUpdate) {
  if (!currentUser) return { success: false, error: 'No user logged in' };
  
  try {
    // Combinar estadísticas existentes con las nuevas
    const newStats = {
      ...currentUser.stats,
      ...statsUpdate
    };
    
    const { data, error } = await sb
      .from('profiles')
      .update({
        stats: newStats,
        total_xp: statsUpdate.totalXP || currentUser.total_xp,
        level: statsUpdate.level || currentUser.level,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.id)
      .select()
      .single();
    
    if (error) throw error;
    
    currentUser = data;
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    authCallbacks.onProfileUpdate(data);
    
    return { success: true, data };
  } catch (error) {
    console.error('Update stats error:', error);
    // Si falla, guardar localmente para sincronizar después
    localStorage.setItem('pending_stats_update', JSON.stringify(statsUpdate));
    return { success: false, error: error.message };
  }
}

// Sincronizar estadísticas pendientes
export async function syncPendingStats() {
  const pending = localStorage.getItem('pending_stats_update');
  if (!pending) return;
  
  try {
    const stats = JSON.parse(pending);
    const result = await updateUserStats(stats);
    
    if (result.success) {
      localStorage.removeItem('pending_stats_update');
    }
  } catch (error) {
    console.error('Error syncing pending stats:', error);
  }
}

// Convertir cuenta de invitado a cuenta real
export async function convertGuestAccount(email, password, username) {
  if (!currentUser) return { success: false, error: 'No user logged in' };
  
  try {
    // Actualizar email y contraseña
    const { data: authData, error: authError } = await sb.auth.updateUser({
      email: email,
      password: password
    });
    
    if (authError) throw authError;
    
    // Actualizar perfil
    const { data: profileData, error: profileError } = await sb
      .from('profiles')
      .update({
        email: email,
        username: username || email.split('@')[0],
        display_name: username || email.split('@')[0],
        is_guest: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.id)
      .select()
      .single();
    
    if (profileError) throw profileError;
    
    currentUser = profileData;
    localStorage.setItem(USER_KEY, JSON.stringify(profileData));
    localStorage.removeItem('guest_credentials');
    authCallbacks.onProfileUpdate(profileData);
    
    return { success: true, data: profileData };
  } catch (error) {
    console.error('Convert guest account error:', error);
    return { success: false, error: error.message };
  }
}

// Verificar disponibilidad de username
export async function checkUsernameAvailability(username) {
  try {
    const { data, error } = await sb
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No se encontró ningún usuario con ese username
      return { available: true };
    }
    
    return { available: false };
  } catch (error) {
    console.error('Check username error:', error);
    return { available: false, error: error.message };
  }
}

// Obtener perfil público de otro usuario
export async function getPublicProfile(userId) {
  try {
    const { data, error } = await sb
      .from('profiles')
      .select('id, username, display_name, avatar_url, level, total_xp')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Get public profile error:', error);
    return { success: false, error: error.message };
  }
}

// Buscar usuarios por username
export async function searchUsers(query) {
  try {
    const { data, error } = await sb
      .from('profiles')
      .select('id, username, display_name, avatar_url, level')
      .ilike('username', `%${query}%`)
      .limit(10);
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Search users error:', error);
    return { success: false, error: error.message };
  }
}

export default {
  initAuth,
  signUp,
  signIn,
  signInAsGuest,
  signOut,
  getCurrentUser,
  isAuthenticated,
  updateProfile,
  updateUserStats,
  syncPendingStats,
  convertGuestAccount,
  checkUsernameAvailability,
  getPublicProfile,
  searchUsers
};