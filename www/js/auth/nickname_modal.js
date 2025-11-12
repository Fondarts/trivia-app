// js/auth/nickname_modal.js - Modal para elegir nickname

export function injectNicknameModalStyles() {
  if (document.getElementById('nickname-modal-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'nickname-modal-styles';
  style.textContent = `
    .nickname-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10001;
      padding: 20px;
      overflow-y: auto;
    }
    
    .nickname-modal.open {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .nickname-modal-content {
      background: var(--cardBg);
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    
    .nickname-modal-header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .nickname-modal-title {
      font-size: 24px;
      font-weight: 800;
      color: var(--fg);
      margin-bottom: 8px;
    }
    
    .nickname-modal-subtitle {
      color: var(--muted);
      font-size: 14px;
    }
    
    .nickname-modal-body {
      margin-bottom: 20px;
    }
    
    .nickname-input-group {
      margin-bottom: 16px;
    }
    
    .nickname-input-label {
      display: block;
      margin-bottom: 8px;
      color: var(--fg);
      font-weight: 600;
    }
    
    .nickname-input {
      width: 100%;
      padding: 12px;
      background: var(--bg);
      border: 2px solid var(--cardBorder);
      border-radius: 8px;
      color: var(--fg);
      font-size: 16px;
      transition: border-color 0.2s;
    }
    
    .nickname-input:focus {
      outline: none;
      border-color: var(--accent);
    }
    
    .nickname-input.error {
      border-color: #e74c3c;
    }
    
    .nickname-error {
      color: #e74c3c;
      font-size: 12px;
      margin-top: 4px;
      display: none;
    }
    
    .nickname-error.show {
      display: block;
    }
    
    .nickname-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    
    .nickname-suggestion {
      padding: 6px 12px;
      background: var(--pillBg);
      border: 1px solid var(--cardBorder);
      border-radius: 16px;
      color: var(--muted);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .nickname-suggestion:hover {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }
    
    .nickname-modal-footer {
      display: flex;
      gap: 12px;
    }
    
    .nickname-btn {
      flex: 1;
      padding: 12px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: opacity 0.2s;
    }
    
    .nickname-btn-primary {
      background: var(--accent);
      color: white;
    }
    
    .nickname-btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .nickname-btn-secondary {
      background: var(--pillBg);
      color: var(--fg);
    }
  `;
  document.head.appendChild(style);
}

export function checkAndShowNicknameModal() {
  const user = window.getCurrentUser ? window.getCurrentUser() : null;
  if (!user || user.isGuest) return;
  
  // Verificar si ya tiene nickname
  const savedNickname = localStorage.getItem('user_nickname_' + user.id);
  const hasNickname = localStorage.getItem('user_has_nickname_' + user.id);
  
  if (savedNickname || hasNickname === 'true') return;
  
  showNicknameModal(true); // obligatorio = true
}

export function showNicknameModal(obligatory = false) {
  // Crear modal si no existe
  let modal = document.getElementById('nicknameModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'nicknameModal';
    modal.className = 'nickname-modal';
    modal.innerHTML = `
      <div class="nickname-modal-content">
        <div class="nickname-modal-header">
          <div class="nickname-modal-title">¡Elige tu Nickname!</div>
          <div class="nickname-modal-subtitle">Este será tu nombre en el juego y los rankings</div>
        </div>
        <div class="nickname-modal-body">
          <div class="nickname-input-group">
            <label class="nickname-input-label">Tu nickname</label>
            <input type="text" class="nickname-input" id="nicknameInput" placeholder="Ej: MasterQuiz" maxlength="20">
            <div class="nickname-error" id="nicknameError">Este nickname ya está en uso</div>
          </div>
          <div class="nickname-suggestions" id="nicknameSuggestions">
            <!-- Se llenarán dinámicamente -->
          </div>
        </div>
        <div class="nickname-modal-footer">
          ${!obligatory ? '<button class="nickname-btn nickname-btn-secondary" id="nicknameCancelBtn">Cancelar</button>' : ''}
          <button class="nickname-btn nickname-btn-primary" id="nicknameSaveBtn" disabled>Guardar Nickname</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Generar sugerencias
    const suggestions = generateNicknameSuggestions();
    const suggestionsContainer = document.getElementById('nicknameSuggestions');
    suggestions.forEach(suggestion => {
      const btn = document.createElement('button');
      btn.className = 'nickname-suggestion';
      btn.textContent = suggestion;
      btn.addEventListener('click', () => {
        document.getElementById('nicknameInput').value = suggestion;
        validateNickname();
      });
      suggestionsContainer.appendChild(btn);
    });
    
    // Validar mientras escribe
    const input = document.getElementById('nicknameInput');
    const saveBtn = document.getElementById('nicknameSaveBtn');
    const errorMsg = document.getElementById('nicknameError');
    
    let validationTimeout;
    const validateNickname = async () => {
      clearTimeout(validationTimeout);
      const value = input.value.trim();
      
      if (value.length < 3) {
        saveBtn.disabled = true;
        errorMsg.classList.remove('show');
        return;
      }
      
      // Simular validación (en producción, verificar con el servidor)
      validationTimeout = setTimeout(async () => {
        // Por ahora, aceptar cualquier nickname de 3+ caracteres
        if (value.length >= 3) {
          saveBtn.disabled = false;
          errorMsg.classList.remove('show');
          input.classList.remove('error');
        }
      }, 300);
    };
    
    input.addEventListener('input', validateNickname);
    
    // Guardar nickname
    saveBtn.addEventListener('click', async () => {
      const nickname = input.value.trim();
      if (nickname.length < 3) return;
      
      const user = window.getCurrentUser ? window.getCurrentUser() : null;
      if (!user) return;
      
      // Guardar localmente
      localStorage.setItem('user_nickname_' + user.id, nickname);
      localStorage.setItem('user_has_nickname_' + user.id, 'true');
      
      // Intentar guardar en el servidor si hay conexión
      if (window.supabaseClient) {
        try {
          await window.supabaseClient
            .from('user_profiles')
            .upsert({
              user_id: user.id,
              nickname: nickname,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });
        } catch (error) {
          console.log('Error guardando nickname en servidor:', error);
        }
      }
      
      // Actualizar UI
      const profileNicknameText = document.getElementById('profileNicknameText');
      if (profileNicknameText) profileNicknameText.textContent = nickname;
      
      // Actualizar el input de playerName
      const playerNameInput = document.getElementById('playerName');
      if (playerNameInput) playerNameInput.value = nickname;
      
      // Cerrar modal
      modal.classList.remove('open');
      
      // Mostrar toast
      if (window.toast) window.toast('✅ Nickname guardado!');
      
      // Actualizar UI de auth
      if (window.updateAuthUI) window.updateAuthUI(user);
    });
    
    // Cancelar (solo si no es obligatorio)
    if (!obligatory) {
      document.getElementById('nicknameCancelBtn')?.addEventListener('click', () => {
        modal.classList.remove('open');
      });
    }
  }
  
  // Mostrar modal
  modal.classList.add('open');
}

function generateNicknameSuggestions() {
  const adjectives = ['Master', 'Super', 'Mega', 'Ultra', 'Pro', 'Epic', 'Legend'];
  const nouns = ['Quiz', 'Brain', 'Genius', 'Mind', 'Trivia', 'Champ', 'Ace'];
  const suggestions = [];
  
  for (let i = 0; i < 6; i++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 100);
    suggestions.push(`${adj}${noun}${num}`);
  }
  
  return suggestions;
}

// Hacer funciones disponibles globalmente
window.injectNicknameModalStyles = injectNicknameModalStyles;
window.checkAndShowNicknameModal = checkAndShowNicknameModal;
window.showNicknameModal = showNicknameModal;
