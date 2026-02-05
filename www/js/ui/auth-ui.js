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
    const savedNickname = Storage.get('user_nickname_' + user.id);
    return savedNickname || user.name?.split(' ')[0] || 'Jugador';
  }
  return 'Anónimo';
}

/**
 * Actualizar UI según estado de autenticación
 * @param {Object|null} user - Usuario actual o null
 * @param {Object} options - Opciones adicionales
 */
export async function updateAuthUI(user, options = {}) {
  const {
    supabase = window.supabaseClient,
    updatePlayerXPBar = window.updatePlayerXPBar
  } = options;
  
  // Obtener elementos usando DOMUtils para caché
  const authSection = DOMUtils.getElement('authSection');
  const welcomeSection = DOMUtils.getElement('welcomeSection');
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
    DOMUtils.hide(authSection);
    
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

            // Usar la función de actualización que lee de localStorage
            if (typeof updatePlayerXPBar === 'function') {
              updatePlayerXPBar();
            }
          }
        }
      } catch (error) {

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

      if (user.avatar && user.avatar !== 'img/avatar_placeholder.svg' && user.avatar !== 'img/avatarman.webp' && !user.avatar.startsWith('img/')) {

        // Intentar cargar el avatar del usuario
        const avatarImg = new Image();
        avatarImg.onload = () => {

          profileAvatar.src = user.avatar;
        };
        avatarImg.onerror = () => {

          profileAvatar.src = './img/avatarman.webp';
        };
        avatarImg.src = user.avatar;
      } else {
        // Usar placeholder por defecto

        profileAvatar.src = './img/avatarman.webp';
      }
    }
    DOMUtils.hide(profileAuthSection);
    DOMUtils.show(profileActionsSection);
    
    // Inicializar sistema de amigos si tiene nickname
    if (savedNickname && supabase) {
      try {

        // IMPORTANTE: Primero inicializar el sistema social básico
        const socialManager = initFriendsSystem(supabase, user.id, savedNickname);
        
        // Solo inicializar la UI si el sistema social se creó correctamente
        if (socialManager) {

          // Esperar un momento para asegurar que window.socialManager esté disponible
          setTimeout(() => {
            initFriendsUI(supabase, user.id, savedNickname);
          }, 100);
        } else {

        }
      } catch (error) {

      }
    }
    
    // Inicializar sincronización de perfil
    if (supabase && user.id) {
      try {

        initProfileSync(supabase, user.id);
        
        const delay = 2000;
        
        setTimeout(() => {
          if (window.forceSyncProfile) {

            window.forceSyncProfile().catch(e => console.error('Error en sync forzada:', e));
          }
        }, delay);
      } catch (error) {

      }
    }
    
    // Actualizar avatar en el header
    const headerAvatar = document.querySelector('.avatar-btn img');
    if (headerAvatar && user.avatar && !user.avatar.startsWith('img/')) {
      headerAvatar.src = user.avatar;
    } else if (headerAvatar && (!user.avatar || user.avatar.startsWith('img/'))) {
      headerAvatar.src = './img/avatarman.webp';
    }
    

  } else if (user && user.isGuest) {
    // Usuario invitado (juega anónimo) — sin UI de login/registro
    DOMUtils.hide(authSection);
    DOMUtils.hide(welcomeSection);
    DOMUtils.hide(profileNicknameSection);
    DOMUtils.hide(profileAuthSection);
    DOMUtils.hide(profileActionsSection);
    
    // Mostrar "Invitado" como nickname
    if (profileNicknameText) profileNicknameText.textContent = 'Invitado';
    
    // Limpiar información del perfil cuando es invitado
    if (profileLevelBadge) profileLevelBadge.innerHTML = '<span data-i18n="level">Nivel</span> 1';
    if (profileXpBar) profileXpBar.style.width = '0%';
    if (profileXpText) profileXpText.textContent = '0 / 100 XP';
    
  } else {
    // No logueado — sin UI de login/registro
    DOMUtils.hide(authSection);
    DOMUtils.hide(welcomeSection);
    DOMUtils.hide(profileNicknameSection);
    DOMUtils.hide(profileAuthSection);
    DOMUtils.hide(profileActionsSection);
    
    // Sin nickname
    if (profileNicknameText) profileNicknameText.textContent = '—';
    
    // Limpiar información del perfil
    if (profileLevelBadge) profileLevelBadge.innerHTML = '<span data-i18n="level">Nivel</span> 1';
    if (profileXpBar) profileXpBar.style.width = '0%';
    if (profileXpText) profileXpText.textContent = '0 / 100 XP';
    if (profileAvatar) profileAvatar.src = './img/avatar_placeholder.svg';
    
    // Limpiar avatar del header
    const headerAvatar = document.querySelector('.avatar-btn img');
    if (headerAvatar) headerAvatar.src = './img/avatar_placeholder.svg';
  }
}

