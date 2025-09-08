// js/auth_ui.js - UI para el sistema de autenticación

import { 
  signIn, 
  signUp, 
  signInAsGuest, 
  getCurrentUser,
  convertGuestAccount,
  checkUsernameAvailability 
} from './auth.js';
import { toast } from './ui.js';

let authModal = null;
let isGuest = false;

// Crear el modal de autenticación
export function createAuthModal() {
  const modal = document.createElement('div');
  modal.id = 'authModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="panel auth-panel">
      <button class="iconbtn close-auth" id="btnCloseAuth">✖</button>
      
      <div class="auth-header">
        <h2 id="authTitle">Iniciar Sesión</h2>
        <p id="authSubtitle">Guarda tu progreso y compite con amigos</p>
      </div>
      
      <div class="auth-tabs">
        <button class="auth-tab active" data-tab="login">Iniciar Sesión</button>
        <button class="auth-tab" data-tab="register">Crear Cuenta</button>
      </div>
      
      <!-- Login Form -->
      <form id="loginForm" class="auth-form">
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="loginEmail" class="input" placeholder="tu@email.com" required>
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" id="loginPassword" class="input" placeholder="••••••••" required>
        </div>
        <button type="submit" class="btn" id="btnLogin">Iniciar Sesión</button>
        <div class="auth-divider">
          <span>o</span>
        </div>
        <button type="button" class="btn secondary" id="btnGuestLogin">Jugar como Invitado</button>
      </form>
      
      <!-- Register Form -->
      <form id="registerForm" class="auth-form" style="display:none">
        <div class="form-group">
          <label>Nombre de Usuario</label>
          <input type="text" id="registerUsername" class="input" placeholder="Tu nombre de jugador" required>
          <span class="form-hint" id="usernameHint"></span>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="registerEmail" class="input" placeholder="tu@email.com" required>
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" id="registerPassword" class="input" placeholder="Mínimo 6 caracteres" required minlength="6">
        </div>
        <button type="submit" class="btn" id="btnRegister">Crear Cuenta</button>
      </form>
      
      <!-- Convert Guest Form -->
      <form id="convertGuestForm" class="auth-form" style="display:none">
        <div class="guest-notice">
          <p>🎮 Estás jugando como invitado</p>
          <p>Crea una cuenta para guardar tu progreso permanentemente</p>
        </div>
        <div class="form-group">
          <label>Nombre de Usuario</label>
          <input type="text" id="convertUsername" class="input" placeholder="Elige tu nombre" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="convertEmail" class="input" placeholder="tu@email.com" required>
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" id="convertPassword" class="input" placeholder="Mínimo 6 caracteres" required minlength="6">
        </div>
        <button type="submit" class="btn" id="btnConvert">Crear Cuenta</button>
        <button type="button" class="btn secondary" id="btnContinueGuest">Seguir como Invitado</button>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  authModal = modal;
  bindAuthEvents();
  return modal;
}

// Vincular eventos del modal de autenticación
function bindAuthEvents() {
  // Tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      switchAuthTab(tabName);
    });
  });
  
  // Close button
  document.getElementById('btnCloseAuth')?.addEventListener('click', closeAuthModal);
  
  // Click outside to close
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });
  
  // Login form
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const btn = document.getElementById('btnLogin');
    btn.disabled = true;
    btn.textContent = 'Iniciando...';
    
    const result = await signIn(email, password);
    
    if (result.success) {
      toast('¡Bienvenido de vuelta!');
      closeAuthModal();
      updateUIForUser();
    } else {
      toast(result.error || 'Error al iniciar sesión');
    }
    
    btn.disabled = false;
    btn.textContent = 'Iniciar Sesión';
  });
  
  // Register form
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    const btn = document.getElementById('btnRegister');
    btn.disabled = true;
    btn.textContent = 'Creando cuenta...';
    
    // Verificar disponibilidad del username
    const availability = await checkUsernameAvailability(username);
    if (!availability.available) {
      toast('Ese nombre de usuario ya está en uso');
      btn.disabled = false;
      btn.textContent = 'Crear Cuenta';
      return;
    }
    
    const result = await signUp(email, password, username);
    
    if (result.success) {
      toast('¡Cuenta creada! Revisa tu email para confirmar.');
      switchAuthTab('login');
    } else {
      toast(result.error || 'Error al crear la cuenta');
    }
    
    btn.disabled = false;
    btn.textContent = 'Crear Cuenta';
  });
  
  // Guest login
  document.getElementById('btnGuestLogin')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnGuestLogin');
    btn.disabled = true;
    btn.textContent = 'Entrando...';
    
    const result = await signInAsGuest();
    
    if (result.success) {
      isGuest = true;
      toast('¡Bienvenido! Estás jugando como invitado');
      closeAuthModal();
      updateUIForUser();
      
      // Mostrar opción de convertir cuenta después de un tiempo
      setTimeout(() => {
        showConvertGuestPrompt();
      }, 60000); // 1 minuto
    } else {
      toast(result.error || 'Error al entrar como invitado');
    }
    
    btn.disabled = false;
    btn.textContent = 'Jugar como Invitado';
  });
  
  // Convert guest form
  document.getElementById('convertGuestForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('convertUsername').value;
    const email = document.getElementById('convertEmail').value;
    const password = document.getElementById('convertPassword').value;
    
    const btn = document.getElementById('btnConvert');
    btn.disabled = true;
    btn.textContent = 'Convirtiendo...';
    
    const result = await convertGuestAccount(email, password, username);
    
    if (result.success) {
      isGuest = false;
      toast('¡Cuenta creada exitosamente!');
      closeAuthModal();
      updateUIForUser();
    } else {
      toast(result.error || 'Error al convertir la cuenta');
    }
    
    btn.disabled = false;
    btn.textContent = 'Crear Cuenta';
  });
  
  // Continue as guest
  document.getElementById('btnContinueGuest')?.addEventListener('click', () => {
    closeAuthModal();
  });
  
  // Username availability check
  let usernameTimeout;
  document.getElementById('registerUsername')?.addEventListener('input', (e) => {
    clearTimeout(usernameTimeout);
    const username = e.target.value;
    const hint = document.getElementById('usernameHint');
    
    if (username.length < 3) {
      hint.textContent = 'Mínimo 3 caracteres';
      hint.className = 'form-hint';
      return;
    }
    
    hint.textContent = 'Verificando...';
    hint.className = 'form-hint checking';
    
    usernameTimeout = setTimeout(async () => {
      const availability = await checkUsernameAvailability(username);
      if (availability.available) {
        hint.textContent = '✓ Disponible';
        hint.className = 'form-hint available';
      } else {
        hint.textContent = '✗ No disponible';
        hint.className = 'form-hint unavailable';
      }
    }, 500);
  });
}

// Cambiar entre tabs
function switchAuthTab(tabName) {
  // Update tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  // Update forms
  document.getElementById('loginForm').style.display = tabName === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tabName === 'register' ? 'block' : 'none';
  
  // Update title
  document.getElementById('authTitle').textContent = 
    tabName === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta';
}

// Mostrar modal de autenticación
export function showAuthModal(tab = 'login') {
  if (!authModal) createAuthModal();
  
  const user = getCurrentUser();
  if (user && user.is_guest) {
    // Si es invitado, mostrar formulario de conversión
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('convertGuestForm').style.display = 'block';
    document.getElementById('authTitle').textContent = 'Crear Cuenta Permanente';
    document.querySelector('.auth-tabs').style.display = 'none';
  } else {
    // Mostrar formulario normal
    switchAuthTab(tab);
    document.getElementById('convertGuestForm').style.display = 'none';
    document.querySelector('.auth-tabs').style.display = 'flex';
  }
  
  authModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

// Cerrar modal de autenticación
export function closeAuthModal() {
  if (authModal) {
    authModal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Actualizar UI para usuario autenticado
export function updateUIForUser() {
  const user = getCurrentUser();
  
  if (user) {
    // Actualizar nombre en el input
    const nameInput = document.getElementById('playerName');
    if (nameInput) {
      nameInput.value = user.display_name || user.username || 'Jugador';
      nameInput.disabled = true; // Deshabilitar edición si está logueado
    }
    
    // Actualizar avatar
    const avatarImg = document.querySelector('.avatar-btn img');
    if (avatarImg && user.avatar_url) {
      avatarImg.src = user.avatar_url;
    }
    
    // Actualizar nivel en el perfil
    const levelBadge = document.getElementById('profileLevelBadge');
    if (levelBadge) {
      levelBadge.innerHTML = `<span data-i18n="level">Nivel</span> ${user.level || 1}`;
    }
    
    // Si es invitado, mostrar indicador
    if (user.is_guest) {
      addGuestIndicator();
    }
  }
}

// Agregar indicador de invitado
function addGuestIndicator() {
  if (document.getElementById('guestIndicator')) return;
  
  const indicator = document.createElement('div');
  indicator.id = 'guestIndicator';
  indicator.className = 'guest-indicator';
  indicator.innerHTML = `
    <span>👤 Jugando como invitado</span>
    <button class="btn-link" id="btnUpgradeAccount">Crear cuenta</button>
  `;
  
  const header = document.querySelector('.header');
  if (header) {
    header.parentNode.insertBefore(indicator, header.nextSibling);
  }
  
  document.getElementById('btnUpgradeAccount')?.addEventListener('click', () => {
    showAuthModal();
  });
}

// Mostrar prompt para convertir cuenta de invitado
export function showConvertGuestPrompt() {
  if (!isGuest) return;
  
  const prompt = document.createElement('div');
  prompt.className = 'convert-prompt';
  prompt.innerHTML = `
    <div class="convert-prompt-content">
      <h3>💾 ¿Quieres guardar tu progreso?</h3>
      <p>Crea una cuenta gratuita para no perder tus estadísticas y logros</p>
      <div class="convert-prompt-actions">
        <button class="btn small" id="btnPromptConvert">Crear Cuenta</button>
        <button class="btn secondary small" id="btnPromptLater">Más tarde</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(prompt);
  
  setTimeout(() => prompt.classList.add('show'), 100);
  
  document.getElementById('btnPromptConvert')?.addEventListener('click', () => {
    prompt.remove();
    showAuthModal();
  });
  
  document.getElementById('btnPromptLater')?.addEventListener('click', () => {
    prompt.remove();
    // Volver a mostrar en 5 minutos
    setTimeout(() => showConvertGuestPrompt(), 300000);
  });
  
  // Auto-cerrar después de 10 segundos
  setTimeout(() => {
    if (prompt.parentNode) prompt.remove();
  }, 10000);
}

// Verificar si el usuario necesita autenticación
export function requireAuth(callback) {
  const user = getCurrentUser();
  
  if (!user || user.is_guest) {
    showAuthModal();
    return false;
  }
  
  if (callback) callback(user);
  return true;
}

export default {
  createAuthModal,
  showAuthModal,
  closeAuthModal,
  updateUIForUser,
  showConvertGuestPrompt,
  requireAuth
};