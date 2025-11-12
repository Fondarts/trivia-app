// js/auth/modal.js - Modal de autenticación mejorado v2.0

export function injectSimpleAuthStyles() {
  if (document.getElementById('auth-modal-styles-v2')) return;
  
  const styles = document.createElement('style');
  styles.id = 'auth-modal-styles-v2';
  styles.innerHTML = `
    .auth-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
    }
    
    .auth-modal-overlay.open {
      opacity: 1;
      visibility: visible;
    }
    
    .auth-modal {
      background: var(--card);
      border: 2px solid var(--cardBorder);
      border-radius: 20px;
      padding: 32px;
      max-width: 420px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      transform: scale(0.9);
      transition: transform 0.3s;
    }
    
    .auth-modal-overlay.open .auth-modal {
      transform: scale(1);
    }
    
    .auth-modal-header {
      text-align: center;
      margin-bottom: 24px;
    }
    
    .auth-modal-logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 16px;
      animation: bounceIn 0.6s;
    }
    
    @keyframes bounceIn {
      0% { transform: scale(0); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    .auth-modal-title {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 8px;
      color: var(--text);
    }
    
    .auth-modal-subtitle {
      font-size: 14px;
      color: var(--muted);
      line-height: 1.5;
    }
    
    .auth-modal-body {
      margin: 24px 0;
    }
    
    .auth-btn-google {
      width: 100%;
      padding: 14px 20px;
      background: white;
      color: #333;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
    }
    
    .auth-btn-google:hover {
      background: #f8f8f8;
      border-color: #4285f4;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
    }
    
    .auth-btn-google:active {
      transform: translateY(0);
    }
    
    .auth-btn-google svg {
      width: 20px;
      height: 20px;
    }
    
    .auth-loading {
      display: none;
      text-align: center;
      padding: 20px;
    }
    
    .auth-loading.active {
      display: block;
    }
    
    .auth-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--cardBorder);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .auth-loading-text {
      color: var(--muted);
      font-size: 14px;
    }
    
    .auth-error {
      display: none;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 16px;
    }
    
    .auth-error.active {
      display: block;
    }
    
    .auth-modal-footer {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--cardBorder);
      text-align: center;
    }
    
    .auth-modal-close {
      color: var(--muted);
      font-size: 14px;
      cursor: pointer;
      text-decoration: underline;
      background: none;
      border: none;
      padding: 8px;
    }
    
    .auth-modal-close:hover {
      color: var(--text);
    }
    
    .auth-features {
      margin: 24px 0;
      padding: 16px;
      background: rgba(139, 92, 246, 0.1);
      border-radius: 12px;
      border: 1px solid rgba(139, 92, 246, 0.2);
    }
    
    .auth-feature {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 12px 0;
      font-size: 14px;
      color: var(--text);
    }
    
    .auth-feature-icon {
      font-size: 18px;
    }
    
    [data-theme="light"] .auth-btn-google {
      background: white;
      color: #333;
      border-color: #dadce0;
    }
    
    [data-theme="light"] .auth-btn-google:hover {
      background: #f8f9fa;
      border-color: #4285f4;
    }
  `;
  
  document.head.appendChild(styles);
}

export function showSimpleAuthModal() {
  // Inyectar estilos si no existen
  injectSimpleAuthStyles();
  
  // Verificar si el modal ya existe
  let modal = document.getElementById('authModalOverlay');
  if (modal) {
    modal.classList.add('open');
    return;
  }
  
  // Crear el modal
  modal = document.createElement('div');
  modal.id = 'authModalOverlay';
  modal.className = 'auth-modal-overlay';
  
  modal.innerHTML = `
    <div class="auth-modal">
      <div class="auth-modal-header">
        <img src="./assets/logo/logo.png" alt="Quizlo!" class="auth-modal-logo">
        <h2 class="auth-modal-title">¡Bienvenido a Quizlo!</h2>
        <p class="auth-modal-subtitle">
          Inicia sesión para guardar tu progreso y competir con amigos
        </p>
      </div>
      
      <div class="auth-features">
        <div class="auth-feature">
          <span class="auth-feature-icon">💾</span>
          <span>Guarda tu progreso y estadísticas</span>
        </div>
        <div class="auth-feature">
          <span class="auth-feature-icon">🏆</span>
          <span>Desbloquea logros y sube de nivel</span>
        </div>
        <div class="auth-feature">
          <span class="auth-feature-icon">👥</span>
          <span>Agrega amigos y compite</span>
        </div>
        <div class="auth-feature">
          <span class="auth-feature-icon">📊</span>
          <span>Aparece en los rankings globales</span>
        </div>
      </div>
      
      <div class="auth-modal-body">
        <button class="auth-btn-google" id="authBtnGoogle">
          <svg viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>
        
        <div class="auth-loading" id="authLoading">
          <div class="auth-spinner"></div>
          <p class="auth-loading-text">Conectando con Google...</p>
        </div>
        
        <div class="auth-error" id="authError"></div>
      </div>
      
      <div class="auth-modal-footer">
        <button class="auth-modal-close" id="authModalClose">
          Seguir como invitado
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Mostrar con animación
  setTimeout(() => modal.classList.add('open'), 10);
  
  // Event listeners
  document.getElementById('authBtnGoogle').addEventListener('click', handleGoogleLogin);
  document.getElementById('authModalClose').addEventListener('click', closeAuthModal);
  
  // Cerrar al hacer click fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeAuthModal();
    }
  });
}

function closeAuthModal() {
  const modal = document.getElementById('authModalOverlay');
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 300);
  }
}

async function handleGoogleLogin() {
  const btnGoogle = document.getElementById('authBtnGoogle');
  const loading = document.getElementById('authLoading');
  const errorDiv = document.getElementById('authError');
  
  // Mostrar loading
  btnGoogle.style.display = 'none';
  loading.classList.add('active');
  errorDiv.classList.remove('active');
  
  try {
    // Usar la función simple de OAuth
    if (window.simpleGoogleLogin) {
      await window.simpleGoogleLogin();
      console.log('✅ OAuth iniciado desde modal con función simple');
      // El redireccionamiento lo maneja la función simple
    } else {
      throw new Error('Sistema de autenticación no disponible');
    }
  } catch (error) {
    console.error('Error en login:', error);
    
    // Mostrar error
    btnGoogle.style.display = 'flex';
    loading.classList.remove('active');
    errorDiv.classList.add('active');
    
    let errorMessage = 'Error al iniciar sesión. Por favor intenta de nuevo.';

    if (error.message?.includes('Error de configuración en Supabase')) {
      // Cerrar modal y mostrar alert con instrucciones detalladas
      closeAuthModal();
      setTimeout(() => {
        alert(`⚙️ Configuración Requerida\n\n${error.message}`);
      }, 300);
      return;
    } else if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
      errorMessage = 'Inicio de sesión cancelado.';
    } else if (error.message?.includes('network')) {
      errorMessage = 'Error de conexión. Verifica tu internet.';
    } else if (error.message?.includes('not available')) {
      errorMessage = 'Sistema de autenticación no disponible. Recarga la página.';
    } else if (error.message?.includes('500') || error.message?.includes('unexpected_failure')) {
      errorMessage = 'Error del servidor. Verifica la configuración de Supabase.';
    }

    errorDiv.textContent = errorMessage;
  }
}

// Exportar funciones
window.showSimpleAuthModal = showSimpleAuthModal;
window.closeAuthModal = closeAuthModal;