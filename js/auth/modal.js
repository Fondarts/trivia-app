// js/auth/modal.js - Modal de autenticación simple con soporte para Capacitor

export function injectSimpleAuthStyles() {
  if (document.getElementById('simple-auth-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'simple-auth-styles';
  style.textContent = `
    .simple-auth-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      padding: 20px;
      overflow-y: auto;
    }
    
    .simple-auth-modal.open {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .simple-auth-content {
      background: var(--bg2);
      background: #1a1a2e;
      border: 1px solid var(--cardBorder);
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      backdrop-filter: blur(10px);
    }
    
    :root[data-theme="light"] .simple-auth-content {
      background: #ffffff;
      background: rgba(255, 255, 255, 0.98);
    }
    
    .simple-auth-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .simple-auth-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--fg);
    }
    
    .simple-auth-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--muted);
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: background 0.2s;
    }
    
    .simple-auth-close:hover {
      background: var(--pillBg);
    }
    
    .simple-auth-body {
      text-align: center;
    }
    
    .simple-auth-description {
      color: var(--muted);
      margin-bottom: 24px;
      line-height: 1.5;
    }
    
    .google-signin-btn {
      width: 100%;
      padding: 12px 16px;
      background: #4285f4;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      transition: background 0.2s;
    }
    
    .google-signin-btn:hover {
      background: #357ae8;
    }
    
    .google-signin-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .google-icon {
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 4px;
      padding: 2px;
    }
  `;
  document.head.appendChild(style);
}

export function showSimpleAuthModal() {
  // Crear modal si no existe
  let modal = document.getElementById('simpleAuthModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'simpleAuthModal';
    modal.className = 'simple-auth-modal';
    modal.innerHTML = `
      <div class="simple-auth-content">
        <div class="simple-auth-header">
          <div class="simple-auth-title">Iniciar Sesión</div>
          <button class="simple-auth-close" id="simpleAuthClose">✖</button>
        </div>
        <div class="simple-auth-body">
          <p class="simple-auth-description">
            Inicia sesión con Google para guardar tu progreso, competir con amigos y desbloquear logros.
          </p>
          <button class="google-signin-btn" id="googleSignInBtn">
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Vincular eventos
    document.getElementById('simpleAuthClose').addEventListener('click', () => {
      modal.classList.remove('open');
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
    
    document.getElementById('googleSignInBtn').addEventListener('click', async () => {
      const btn = document.getElementById('googleSignInBtn');
      const originalContent = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = 'Iniciando sesión...';
      
      try {
        // Detectar si estamos en Capacitor
        const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
        
        if (window.handleGoogleLogin) {
          // Usar la función de login unificada que maneja tanto Capacitor como web
          console.log('Usando handleGoogleLogin unificado');
          const user = await window.handleGoogleLogin();
          
          if (user) {
            // Login exitoso inmediato (poco probable con OAuth)
            if (window.updateAuthUI) {
              window.updateAuthUI(user);
            }
            
            // Cerrar modal
            modal.classList.remove('open');
            
            // Verificar nickname
            setTimeout(() => {
              if (window.checkAndShowNicknameModal) {
                window.checkAndShowNicknameModal();
              }
            }, 500);
          }
          // Si no retorna usuario, es porque inició el flujo OAuth (redirect)
          
        } else if (window.handleCapacitorGoogleLogin) {
          // Usar la función de login que maneja tanto Capacitor como web
          console.log('Usando handleCapacitorGoogleLogin');
          const user = await window.handleCapacitorGoogleLogin();
          
          if (user) {
            // Login exitoso inmediato (poco probable con OAuth)
            if (window.updateAuthUI) {
              window.updateAuthUI(user);
            }
            
            // Cerrar modal
            modal.classList.remove('open');
            
            // Verificar nickname
            setTimeout(() => {
              if (window.checkAndShowNicknameModal) {
                window.checkAndShowNicknameModal();
              }
            }, 500);
          }
          // Si no retorna usuario, es porque inició el flujo OAuth (redirect)
          
        } else if (window.supabaseClient) {
          // Fallback al flujo web estándar
          console.log('Usando flujo web estándar de Supabase');
          
          let redirectUrl = window.location.origin + window.location.pathname;
          
          if (isCapacitor) {
            redirectUrl = 'app.quizle.trivia://oauth-callback';
          }
          
          const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl
            }
          });
          
          if (error) throw error;
          
        } else {
          throw new Error('Sistema de autenticación no disponible');
        }
        
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        
        let errorMessage = 'Error al iniciar sesión. ';
        
        if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
          errorMessage = 'Inicio de sesión cancelado.';
        } else if (error.message?.includes('network')) {
          errorMessage += 'Verifica tu conexión a internet.';
        } else {
          errorMessage += 'Por favor, intenta de nuevo.';
        }
        
        alert(errorMessage);
        
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
    });
  }
  
  // Mostrar modal
  modal.classList.add('open');
}

// Hacer funciones disponibles globalmente
window.injectSimpleAuthStyles = injectSimpleAuthStyles;
window.showSimpleAuthModal = showSimpleAuthModal;