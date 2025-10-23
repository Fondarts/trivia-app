// Sistema simplificado de amigos - Se agrega al main.js existente
import { t } from './core/i18n.js';

// Función para agregar el botón de amigos al header
function addFriendsButton() {
  const header = document.querySelector('.header .row');
  if (!header) return;
  
  // Verificar si ya existe
  if (document.getElementById('btnFriends')) return;
  
  const friendsBtn = document.createElement('button');
  friendsBtn.id = 'btnFriends';
  friendsBtn.className = 'iconbtn';
  friendsBtn.title = t('friendsSystem');
  friendsBtn.style.position = 'relative';
  friendsBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" style="width: 22px; height: 22px;">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
    <span class="notification-badge" id="friendsBadge" style="
      display: none;
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ff0d7a;
      color: white;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: bold;
      min-width: 18px;
      text-align: center;
    ">0</span>
  `;
  
  // Insertar antes del botón de DLC
  const dlcBtn = document.getElementById('btnDLC');
  if (dlcBtn) {
    header.insertBefore(friendsBtn, dlcBtn);
  } else {
    // Si no hay DLC, insertar antes del perfil
    const profileBtn = document.getElementById('btnProfile');
    if (profileBtn) {
      header.insertBefore(friendsBtn, profileBtn);
    } else {
      header.appendChild(friendsBtn);
    }
  }
  
  // Agregar evento click
  friendsBtn.addEventListener('click', toggleFriendsPanel);
}

// Panel simplificado de amigos y notificaciones
function createSimpleFriendsPanel() {
  if (document.getElementById('simpleFriendsPanel')) return;
  
  const panel = document.createElement('div');
  panel.id = 'simpleFriendsPanel';
  panel.style.cssText = `
    position: fixed;
    top: 60px;
    right: 10px;
    width: 320px;
    max-height: 500px;
    background: var(--cardBg);
    border: 2px solid var(--cardBorder);
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    z-index: 9999;
    display: none;
    overflow: hidden;
  `;
  
  panel.innerHTML = `
    <div style="padding: 15px; border-bottom: 1px solid var(--cardBorder);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 18px;">Notificaciones</h3>
        <button id="closeFriendsPanel" style="
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--muted);
          padding: 0;
        ">✖</button>
      </div>
    </div>
    
    <div id="notificationsContent" style="
      padding: 15px;
      max-height: 400px;
      overflow-y: auto;
    ">
      <div style="text-align: center; color: var(--muted); padding: 20px;">
        <p>Sistema de amigos temporalmente deshabilitado</p>
        <p style="font-size: 14px; margin-top: 10px;">
          Próximamente podrás:<br>
          • Agregar amigos<br>
          • Desafiar a otros jugadores<br>
          • Ver rankings globales
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Evento para cerrar
  document.getElementById('closeFriendsPanel')?.addEventListener('click', () => {
    panel.style.display = 'none';
  });
  
  // Cerrar al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !document.getElementById('btnFriends')?.contains(e.target)) {
      panel.style.display = 'none';
    }
  });
}

// Toggle del panel
function toggleFriendsPanel() {
  const panel = document.getElementById('simpleFriendsPanel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }
}

// Función para mostrar notificaciones de ejemplo
function showExampleNotifications() {
  const badge = document.getElementById('friendsBadge');
  if (badge) {
    // Simular algunas notificaciones
    badge.textContent = '3';
    badge.style.display = 'flex';
    
    // Actualizar contenido del panel
    const content = document.getElementById('notificationsContent');
    if (content) {
      content.innerHTML = `
        <div style="padding: 10px; background: var(--pillBg); border-radius: 8px; margin-bottom: 10px;">
          <div style="font-weight: bold; margin-bottom: 5px;">🎮 Nuevo desafío</div>
          <div style="font-size: 14px; color: var(--muted);">PlayerOne te desafió a una partida VS</div>
          <button class="btn small accent" style="margin-top: 8px; width: 100%;">Aceptar Desafío</button>
        </div>
        
        <div style="padding: 10px; background: var(--pillBg); border-radius: 8px; margin-bottom: 10px;">
          <div style="font-weight: bold; margin-bottom: 5px;">👥 Solicitud de amistad</div>
          <div style="font-size: 14px; color: var(--muted);">QuizMaster quiere ser tu amigo</div>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button class="btn small accent" style="flex: 1;">Aceptar</button>
            <button class="btn small secondary" style="flex: 1;">Rechazar</button>
          </div>
        </div>
        
        <div style="padding: 10px; background: var(--pillBg); border-radius: 8px;">
          <div style="font-weight: bold; margin-bottom: 5px;">🏆 Nuevo récord</div>
          <div style="font-size: 14px; color: var(--muted);">Tu amigo SuperBrain batió tu récord en Geografía</div>
        </div>
      `;
    }
  }
}

// Inicializar el sistema de amigos simplificado
function initSimpleFriendsSystem() {
  console.log('Inicializando sistema de amigos simplificado...');
  
  // Agregar botón al header
  addFriendsButton();
  
  // Crear panel
  createSimpleFriendsPanel();
  
  // Por ahora, mostrar notificaciones de ejemplo después de 2 segundos
  // En el futuro, esto se conectará con el sistema real de Supabase
  setTimeout(() => {
    // showExampleNotifications(); // Comentado por ahora
  }, 2000);
}

// Exportar para uso global
window.initSimpleFriendsSystem = initSimpleFriendsSystem;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSimpleFriendsSystem);
} else {
  // Si el DOM ya está listo, inicializar directamente
  setTimeout(initSimpleFriendsSystem, 100);
}
