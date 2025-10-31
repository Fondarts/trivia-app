// js/ui/auth-ui.js - UI de autenticación
// Extraído de main.js para mejorar mantenibilidad

import { DOMUtils } from '../core/dom-utils.js';
import { Storage } from '../core/storage.js';
import { getLevelProgress } from '../player/experience.js';
import { initFriendsSystem } from '../player/social.js';
import { initFriendsSystem as initFriendsUI } from '../player/friends_ui.js';
import { initProfileSync } from '../player/profile_sync.js';
import { checkAndShowNicknameModal } from '../auth/nickname_modal.js';
import AuthSystem from '../auth/auth_v2.js';

/**
 * Obtener el nombre del jugador para el juego
 * @returns {string}
 */
export function getPlayerNameForGame() {
  const user = AuthSystem.getCurrentUser();
  if (user && !user.isGuest) {
    // Si está logueado, usar el nickname guardado
    const savedNickname = Storage.get('user_nickname_' + user.id);
    return savedNickname || user.name?.split(' ')[0] || 'Jugador';
  } else {
    // Si no está logueado, usar el valor del input
    return DOMUtils.getElement('playerName')?.value?.trim() || 'Anónimo';
  }
}

/**
 * Actualizar UI según estado de autenticación
 * @param {Object|null} user - Usuario actual o null
 * @param {Object} options - Opciones adicionales
 */
export async function updateAuthUI(user, options = {}) {
  const {
    supabase = window.supabaseClient,
    unifiedBanner = null,
    updatePlayerXPBar = window.updatePlayerXPBar
  } = options;
  
  // Obtener elementos usando DOMUtils para caché
  const authSection = DOMUtils.getElement('authSection');
  const welcomeSection = DOMUtils.getElement('welcomeSection');
  const guestNameSection = DOMUtils.getElement('guestNameSection');
  const playerNameInput = DOMUtils.getElement('playerName');
  const profileNicknameSection = DOMUtils.getElement('profileNicknameSection');
  const profileNicknameMain = DOMUtils.getElement('profileNicknameMain');
  const profileNicknameText = DOMUtils.getElement('profileNicknameText');
  const profileAvatar = DOMUtils.getElement('profileAvatar');
  const profileAuthSection = DOMUtils.getElement('profileAuthSection');
  const profileActionsSection = DOMUtils.getElement('profileActionsSection');
  const profileLevelBadge = DOMUtils.getElement('profileLevelBadge');
  const profileXpBar = DOMUtils.getElement('profileXpBar');
  const profileXpText = DOMUtils.getElement('profileXpText');
  
  if (user && !user.isGuest) {
    // Usuario logueado con Google - OCULTAR sección de auth y nombre
    DOMUtils.hide(authSection);
    DOMUtils.hide(guestNameSection);
    
    // Cargar nickname desde el servidor o localmente
    let savedNickname = Storage.get('user_nickname_' + user.id);
    
    // Intentar cargar desde el servidor si hay conexión
    if (supabase && !user.isGuest) {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('nickname, level, total_xp')
          .eq('user_id', user.id)
          .single();
        
        if (profile && profile.nickname) {
          // Solo usar el nickname del servidor si no hay uno local más reciente
          const localNickname = Storage.get('user_nickname_' + user.id);
          if (!localNickname) {
            savedNickname = profile.nickname;
            // Guardar localmente para acceso offline
            Storage.set('user_nickname_' + user.id, savedNickname);
            Storage.set('user_has_nickname_' + user.id, 'true');
          } else {
            // Usar el nickname local (más reciente)
            savedNickname = localNickname;
          }
          
          // Actualizar nivel y XP si existen (solo si no hay datos locales más recientes)
          const localStats = Storage.get('trivia_stats', {});
          const hasLocalData = localStats.totalXP && localStats.totalXP > 0;
          
          if (!hasLocalData) {
            if (profile.level && profileLevelBadge) {
              profileLevelBadge.innerHTML = `<span data-i18n="level">Nivel</span> ${profile.level}`;
            }
            if (profile.total_xp !== undefined) {
              const { currentLevelXP, xpForNextLevel, progressPercent } = getLevelProgress(profile.total_xp);
              if (profileXpBar) profileXpBar.style.width = `${progressPercent}%`;
              if (profileXpText) profileXpText.textContent = `${currentLevelXP} / ${xpForNextLevel} XP`;
            }
          } else {
            console.log('📊 Usando datos locales en lugar de servidor');
            // Usar la función de actualización que lee de localStorage
            if (typeof updatePlayerXPBar === 'function') {
              updatePlayerXPBar();
            }
          }
        }
      } catch (error) {
        console.log('No se pudo cargar el perfil del servidor, usando datos locales');
      }
    }
    
    // Verificar si necesita elegir nickname (para nuevos usuarios)
    if (!savedNickname) {
      // Mostrar modal de nickname obligatorio
      setTimeout(() => {
        checkAndShowNicknameModal();
      }, 1000);
      
      // Ocultar mensaje de bienvenida mientras tanto
      DOMUtils.hide(welcomeSection);
    } else {
      DOMUtils.hide(welcomeSection);
    }
    
    // Ocultar completamente la sección de nickname en el perfil
    DOMUtils.hide(profileNicknameSection);
    
    // Mostrar el nickname en el perfil (debajo del avatar)
    if (profileNicknameText) {
      profileNicknameText.textContent = savedNickname || 'Sin nickname';
    }
    
    // Actualizar avatar
    if (profileAvatar) {
      console.log('🖼️ ===== DEBUG AVATAR =====');
      console.log('🖼️ Usuario completo:', user);
      console.log('🖼️ Avatar URL:', user.avatar);
      console.log('🖼️ Metadata completa:', user.metadata);
      console.log('🖼️ Elemento avatar encontrado:', !!profileAvatar);
      console.log('🖼️ ========================');
      
      if (user.avatar && user.avatar !== 'img/avatar_placeholder.svg' && user.avatar !== 'img/avatarman.webp') {
        console.log('🖼️ Intentando cargar avatar de Google:', user.avatar);
        // Intentar cargar el avatar del usuario
        const avatarImg = new Image();
        avatarImg.onload = () => {
          console.log('✅ Avatar de Google cargado correctamente:', user.avatar);
          profileAvatar.src = user.avatar;
        };
        avatarImg.onerror = () => {
          console.log('⚠️ Avatar de Google falló, usando placeholder');
          profileAvatar.src = 'img/avatarman.webp';
        };
        avatarImg.src = user.avatar;
      } else {
        // Usar placeholder por defecto
        console.log('🖼️ No hay avatar de Google, usando placeholder por defecto');
        profileAvatar.src = 'img/avatarman.webp';
      }
    }
    DOMUtils.hide(profileAuthSection);
    DOMUtils.show(profileActionsSection);
    
    // Inicializar sistema de amigos si tiene nickname
    if (savedNickname && supabase) {
      try {
        console.log('Inicializando sistema de amigos para:', savedNickname);
        // IMPORTANTE: Primero inicializar el sistema social básico
        const socialManager = initFriendsSystem(supabase, user.id, savedNickname);
        
        // Solo inicializar la UI si el sistema social se creó correctamente
        if (socialManager) {
          console.log('Sistema social creado, inicializando UI...');
          // Esperar un momento para asegurar que window.socialManager esté disponible
          setTimeout(() => {
            initFriendsUI(supabase, user.id, savedNickname);
          }, 100);
        } else {
          console.error('No se pudo crear el sistema social');
        }
      } catch (error) {
        console.error('Error iniciando sistema de amigos:', error);
      }
    }
    
    // Inicializar sincronización de perfil
    if (supabase && user.id) {
      try {
        console.log('🔄 Inicializando sincronización de perfil para:', user.id);
        initProfileSync(supabase, user.id);
        
        // En Android, usar sincronización forzada después de un delay mayor
        const isAndroid = window.Capacitor && window.Capacitor.getPlatform() === 'android';
        const delay = isAndroid ? 3000 : 2000;
        
        setTimeout(() => {
          if (isAndroid && window.forceFullSync) {
            console.log('🔄 Forzando sincronización completa en Android...');
            window.forceFullSync().catch(e => console.error('Error en sync completa:', e));
          } else if (window.forceSyncProfile) {
            console.log('🔄 Forzando sincronización inmediata...');
            window.forceSyncProfile().catch(e => console.error('Error en sync forzada:', e));
          }
        }, delay);
      } catch (error) {
        console.error('❌ Error iniciando sincronización de perfil:', error);
      }
    }
    
    // Actualizar avatar en el header
    const headerAvatar = document.querySelector('.avatar-btn img');
    if (headerAvatar && user.avatar) headerAvatar.src = user.avatar;
    
    // Actualizar el input oculto de playerName con el nickname
    if (playerNameInput) {
      playerNameInput.value = savedNickname || user.name?.split(' ')[0] || 'Jugador';
    }
    
    // Mostrar banner en menú principal (Android + Web)
    if (unifiedBanner) {
      // Delay para asegurar que la UI esté lista
      setTimeout(async () => {
        console.log('🔄 Intentando mostrar banner en menú principal...');
        const success = await unifiedBanner.showBanner();
        if (success) {
          console.log('✅ Banner mostrado en menú principal');
        } else {
          console.log('❌ Fallo al mostrar banner en menú principal');
        }
      }, 1000);
    }
    
  } else if (user && user.isGuest) {
    // Usuario invitado
    DOMUtils.show(authSection);
    DOMUtils.hide(welcomeSection);
    DOMUtils.show(guestNameSection);
    DOMUtils.hide(profileNicknameSection);
    if (playerNameInput) {
      playerNameInput.value = user.name || 'Invitado';
      playerNameInput.disabled = false;
    }
    DOMUtils.show(profileAuthSection);
    DOMUtils.hide(profileActionsSection);
    
    // Mostrar "Invitado" como nickname
    if (profileNicknameText) profileNicknameText.textContent = 'Invitado';
    
    // Limpiar información del perfil cuando es invitado
    if (profileLevelBadge) profileLevelBadge.innerHTML = '<span data-i18n="level">Nivel</span> 1';
    if (profileXpBar) profileXpBar.style.width = '0%';
    if (profileXpText) profileXpText.textContent = '0 / 100 XP';
    
  } else {
    // No logueado
    DOMUtils.show(authSection);
    DOMUtils.hide(welcomeSection);
    DOMUtils.show(guestNameSection);
    DOMUtils.hide(profileNicknameSection);
    if (playerNameInput) {
      playerNameInput.value = '';
      playerNameInput.disabled = false;
    }
    DOMUtils.show(profileAuthSection);
    DOMUtils.hide(profileActionsSection);
    
    // Sin nickname
    if (profileNicknameText) profileNicknameText.textContent = '—';
    
    // Limpiar información del perfil
    if (profileLevelBadge) profileLevelBadge.innerHTML = '<span data-i18n="level">Nivel</span> 1';
    if (profileXpBar) profileXpBar.style.width = '0%';
    if (profileXpText) profileXpText.textContent = '0 / 100 XP';
    if (profileAvatar) profileAvatar.src = 'img/avatar_placeholder.svg';
    
    // Limpiar avatar del header
    const headerAvatar = document.querySelector('.avatar-btn img');
    if (headerAvatar) headerAvatar.src = 'img/avatar_placeholder.svg';
  }
}

