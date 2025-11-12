// js/friends_ui.js - Interfaz de usuario para el sistema de amigos

let socialManager = null;
let currentUserNickname = '';

export function initFriendsSystem(supabase, userId, nickname) {
  console.log('Iniciando UI de amigos con:', { userId, nickname, hasSupabase: !!supabase });
  
  // Verificar si ya existe un socialManager global
  if (window.socialManager) {
    socialManager = window.socialManager;
    console.log('SocialManager encontrado');
  } else {
    console.error('SocialManager no encontrado - debe inicializarse primero con social.js');
    return;
  }
  currentUserNickname = nickname;
  
  // Hacer socialManager disponible globalmente para integración con VS
  window.socialManager = socialManager;
  
  // Iniciar sistema de presencia
  socialManager.initPresence();
  // Refrescar lista al sincronizar presencia
  window.addEventListener('friends:presence-updated', () => {
    const panel = document.getElementById('friendsPanel');
    const friendsTab = document.querySelector('.tab-btn[data-tab="friends"]');
    if (panel?.classList.contains('open') && friendsTab?.classList.contains('active')) {
      loadFriends();
    }
  });
  
  // Crear botón de amigos en el header
  createFriendsButton();
  
  // Crear panel de amigos
  createFriendsPanel();
  
  // Cargar amigos iniciales
  loadFriends();
  
  // Suscribirse a notificaciones
  subscribeToNotifications();
  
  // Actualizar lista de amigos cada 15 segundos para reflejar cambios de presencia
  setInterval(() => {
    // Solo actualizar si el panel está abierto y en el tab de amigos
    const panel = document.getElementById('friendsPanel');
    const friendsTab = document.querySelector('.tab-btn[data-tab="friends"]');
    if (panel?.classList.contains('open') && friendsTab?.classList.contains('active')) {
      loadFriends();
    }
  }, 15000);
}

function createFriendsButton() {
  const header = document.querySelector('.header .row');
  if (!header) {
    console.error('No se encontró el header para agregar el botón de amigos');
    return;
  }
  
  // Verificar si ya existe
  let existingBtn = document.getElementById('btnFriends');
  if (existingBtn) {
    console.log('Botón de amigos ya existe, reutilizando...');
    // Si ya existe, solo asegurarse de que tenga el evento
    existingBtn.removeEventListener('click', toggleFriendsPanel); // Remover si ya existe
    existingBtn.addEventListener('click', toggleFriendsPanel);
    return;
  }
  
  console.log('Creando botón de amigos...');
  const friendsBtn = document.createElement('button');
  friendsBtn.id = 'btnFriends';
  friendsBtn.className = 'iconbtn';
  friendsBtn.title = 'Amigos';
  friendsBtn.style.position = 'relative';
  friendsBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
    <span class="notification-badge" id="friendsBadge" style="display:none">0</span>
  `;
  
  // Insertar antes del botón de perfil
  const profileBtn = document.getElementById('btnProfile');
  if (profileBtn) {
    header.insertBefore(friendsBtn, profileBtn);
  } else {
    header.appendChild(friendsBtn);
  }
  
  friendsBtn.addEventListener('click', toggleFriendsPanel);
  console.log('Botón de amigos creado y evento vinculado');
}

function createFriendsPanel() {
  // Verificar si ya existe
  if (document.getElementById('friendsPanel')) return;
  
  const panel = document.createElement('div');
  panel.id = 'friendsPanel';
  panel.className = 'friends-panel';
  panel.innerHTML = `
    <div class="friends-header">
      <h3>Amigos</h3>
      <div style="display: flex; gap: 8px;">
        <button class="iconbtn" id="btnCloseFriends">✖</button>
      </div>
    </div>
    
    <div class="friends-tabs">
      <button class="tab-btn active" data-tab="friends">Amigos</button>
      <button class="tab-btn" data-tab="search">Buscar</button>
      <button class="tab-btn" data-tab="requests">Solicitudes</button>
      <button class="tab-btn" data-tab="rankings">Historial</button>
      <button class="tab-btn" data-tab="matches">Partidas Abiertas</button>
    </div>
    
    <!-- Tab: Lista de amigos -->
    <div class="friends-tab-content active" id="tabFriends">
      <div class="friends-list" id="friendsList">
        <div class="loading">Cargando amigos...</div>
      </div>
    </div>
    
    <!-- Tab: Buscar usuarios -->
    <div class="friends-tab-content" id="tabSearch">
      <div class="search-section">
        <input type="text" id="searchInput" class="input" placeholder="Buscar por nickname..." />
        <button class="btn small" id="btnSearch">Buscar</button>
      </div>
      <div class="search-results" id="searchResults"></div>
    </div>
    
    <!-- Tab: Solicitudes pendientes -->
    <div class="friends-tab-content" id="tabRequests">
      <div class="requests-list" id="requestsList">
        <div class="empty-state">No hay solicitudes pendientes</div>
      </div>
    </div>
    
    <!-- Tab: Rankings entre amigos -->
    <div class="friends-tab-content" id="tabRankings">
      <div class="rankings-list" id="rankingsList">
        <div class="loading">Cargando historial...</div>
      </div>
    </div>
    
    <!-- Tab: Partidas Abiertas -->
    <div class="friends-tab-content" id="tabMatches">
      <div class="matches-list" id="matchesList">
        <div class="loading">Cargando partidas...</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Bind events
  bindFriendsPanelEvents();
}

function bindFriendsPanelEvents() {
  // Cerrar panel
  document.getElementById('btnCloseFriends')?.addEventListener('click', () => {
    document.getElementById('friendsPanel')?.classList.remove('open');
  });
  
  
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Cambiar tab activo
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Mostrar contenido correspondiente
      const tabName = btn.dataset.tab;
      document.querySelectorAll('.friends-tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`)?.classList.add('active');
      
      // Cargar datos si es necesario
      if (tabName === 'rankings') loadRankings();
      if (tabName === 'requests') loadRequests();
      if (tabName === 'matches') loadOpenMatches();
    });
  });
  
  // Búsqueda
  document.getElementById('btnSearch')?.addEventListener('click', searchUsers);
  document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchUsers();
  });
}

export function toggleFriendsPanel() {
  console.log('toggleFriendsPanel ejecutado');
  const panel = document.getElementById('friendsPanel');
  if (panel) {
    console.log('Panel encontrado, toggling...');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      console.log('Panel abierto, cargando amigos...');
      loadFriends();
    } else {
      console.log('Panel cerrado');
    }
  } else {
    console.error('Panel de amigos no encontrado!');
    // Intentar crear el panel si no existe
    createFriendsPanel();
    // Intentar de nuevo
    const newPanel = document.getElementById('friendsPanel');
    if (newPanel) {
      newPanel.classList.add('open');
      loadFriends();
    }
  }
}

async function loadFriends() {
  console.log('Cargando amigos...');
  
  if (!socialManager) {
    console.error('socialManager no está disponible');
    return;
  }
  
  const container = document.getElementById('friendsList');
  if (!container) {
    console.error('No se encontró el contenedor friendsList');
    return;
  }
  
  try {
    // Primero intentar reparar relaciones rotas
    console.log('Verificando y reparando relaciones de amistad...');
    await socialManager.repairFriendshipRelationships();
    
    const result = await socialManager.getFriends();
    
    if (!result || !result.success) {
      console.error('Error al obtener amigos:', result?.error);
      container.innerHTML = '<div class="error">Error al cargar amigos</div>';
      return;
    }
  
  if (result.data.length === 0) {
    container.innerHTML = '<div class="empty-state">No tienes amigos aún. ¡Busca jugadores para agregar!</div>';
    return;
  }
  
  // Separar online y offline
  const online = result.data.filter(f => f.is_online);
  const offline = result.data.filter(f => !f.is_online);
  
  container.innerHTML = `
    ${online.length > 0 ? `
      <div class="friends-group">
        <div class="group-title">Online (${online.length})</div>
        ${online.map(friend => createFriendItem(friend, true)).join('')}
      </div>
    ` : ''}
    
    ${offline.length > 0 ? `
      <div class="friends-group">
        <div class="group-title">Offline (${offline.length})</div>
        ${offline.map(friend => createFriendItem(friend, false)).join('')}
      </div>
    ` : ''}
  `;
  
  // Bind events para los botones
  bindFriendItemEvents();
  } catch (error) {
    console.error('Error en loadFriends:', error);
    container.innerHTML = '<div class="error">Error al cargar amigos</div>';
  }
}

function createFriendItem(friend, isOnline) {
  // Por ahora, siempre mostrar "Desafiar" ya que el sistema de presencia no está detectando bien
  // TODO: Arreglar detección de presencia online/offline
  
  // Indicador visual si el amigo necesita perfil
  const needsProfileIndicator = friend.needsProfile ? 
    '<div class="friend-status-text" style="color: #f59e0b; font-size: 10px; margin-top: 2px;">⚠️ Sin perfil</div>' : '';
  
  return `
    <div class="friend-item clickable-friend" data-friend-id="${friend.user_id}" style="cursor: pointer;">
      <div class="friend-status ${isOnline ? 'online' : 'offline'}"></div>
      <img src="${friend.avatar_url || './img/avatar_placeholder.svg'}" class="friend-avatar" alt="${friend.nickname}" onerror="this.onerror=null; this.src='./img/avatar_placeholder.svg';"/>
      <div class="friend-info">
        <div class="friend-name">${friend.nickname}</div>
        <div class="friend-level">Nivel ${friend.level || 1}</div>
        ${needsProfileIndicator}
      </div>
      <div class="friend-actions">
        <button class="btn small accent" data-action="invite-sync" data-friend="${friend.user_id}">Desafiar</button>
        <button class="iconbtn small" data-action="block" data-friend="${friend.user_id}" title="Bloquear">🚫</button>
      </div>
    </div>
  `;
}

function bindFriendItemEvents() {
  // Click en la cápsula del amigo para ver perfil
  document.querySelectorAll('.clickable-friend').forEach(item => {
    item.addEventListener('click', (e) => {
      // Solo procesar si no se hizo click en un botón
      if (!e.target.closest('button')) {
        const friendId = item.dataset.friendId;
        showFriendProfile(friendId);
      }
    });
  });
  
  // Invitar a juego síncrono
  document.querySelectorAll('[data-action="invite-sync"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // Evitar que se abra el perfil
      const friendId = e.target.dataset.friend;
      const friendName = e.target.closest('.friend-item').querySelector('.friend-name').textContent;
      
      // Simplemente configurar la partida contra el amigo
      // El código de sala se generará cuando se cree la partida
      await inviteFriendToSync(friendId, friendName);
    });
  });
  
  // Desafiar a juego asíncrono
  document.querySelectorAll('[data-action="invite-async"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // Evitar que se abra el perfil
      const friendId = e.target.dataset.friend;
      await inviteFriendToAsync(friendId);
    });
  });
  
  // Bloquear
  document.querySelectorAll('[data-action="block"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // Evitar que se abra el perfil
      const friendId = e.target.dataset.friend;
      if (confirm('¿Seguro que quieres bloquear a este usuario?')) {
        await blockFriend(friendId);
      }
    });
  });
}

async function searchUsers() {
  const input = document.getElementById('searchInput');
  const query = input?.value?.trim();
  
  if (!query || query.length < 3) {
    showToast('Ingresa al menos 3 caracteres');
    return;
  }
  
  const container = document.getElementById('searchResults');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Buscando...</div>';
  
  console.log('Buscando usuarios con query:', query);
  const result = await socialManager.searchUsers(query);
  console.log('Resultado de búsqueda:', result);
  
  if (!result.success) {
    container.innerHTML = '<div class="error">Error al buscar usuarios</div>';
    return;
  }
  
  if (result.data.length === 0) {
    container.innerHTML = '<div class="empty-state">No se encontraron usuarios</div>';
    return;
  }
  
  container.innerHTML = result.data.map(user => {
    let buttonHtml = '';
    
    if (user.relationship_status === 'accepted') {
      buttonHtml = '<span class="friend-status-text">Ya son amigos</span>';
    } else if (user.relationship_status === 'pending') {
      buttonHtml = '<span class="friend-status-text">Solicitud pendiente</span>';
    } else if (user.relationship_status === 'blocked') {
      buttonHtml = '<span class="friend-status-text">Bloqueado</span>';
    } else {
      buttonHtml = `<button class="btn small accent" data-action="add-friend" data-user="${user.user_id}">Agregar</button>`;
    }
    
    return `
      <div class="search-result-item">
        <img src="${user.avatar_url || './img/avatar_placeholder.svg'}" class="friend-avatar" alt="${user.nickname}" onerror="this.onerror=null; this.src='./img/avatar_placeholder.svg';"/>
        <div class="friend-info">
          <div class="friend-name">${user.nickname}</div>
          <div class="friend-level">Nivel ${user.level || 1}</div>
        </div>
        ${buttonHtml}
      </div>
    `;
  }).join('');
  
  // Bind events
  document.querySelectorAll('[data-action="add-friend"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetUserId = e.target.dataset.user;
      console.log('Click en agregar amigo:', targetUserId);
      
      const result = await socialManager.sendFriendRequest(targetUserId);
      console.log('Resultado de enviar solicitud:', result);
      
      if (result.success) {
        showToast('Solicitud enviada');
        e.target.disabled = true;
        e.target.textContent = 'Enviado';
      } else {
        const errorMsg = result.error?.message || result.error || 'Error al enviar solicitud';
        showToast(errorMsg);
        // Si ya son amigos o hay solicitud pendiente, deshabilitar botón
        if (typeof errorMsg === 'string' && 
            (errorMsg.includes('amigos') || errorMsg.includes('pendiente'))) {
          e.target.disabled = true;
          e.target.textContent = errorMsg.includes('amigos') ? 'Ya son amigos' : 'Pendiente';
        }
      }
    });
  });
}

async function loadRequests() {
  const container = document.getElementById('requestsList');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Cargando solicitudes...</div>';
  
  console.log('Cargando solicitudes para usuario:', socialManager.userId);
  
  try {
    // Cargar solicitudes de amistad pendientes
    const { data: friendRequests, error: friendError } = await socialManager.supabase
      .from('friendships')
      .select('*')
      .eq('friend_id', socialManager.userId)
      .eq('status', 'pending');
    
    console.log('Solicitudes de amistad encontradas:', friendRequests);
    
    if (friendError) {
      console.error('Error cargando solicitudes de amistad:', friendError);
    }
    
    // Ahora obtener los datos de los usuarios que enviaron las solicitudes
    let friendRequestsWithUsers = [];
    if (friendRequests && friendRequests.length > 0) {
      // Obtener todos los IDs de una vez
      const userIds = friendRequests.map(req => req.user_id);
      
      // Obtener todos los perfiles de una vez
      const { data: profiles } = await socialManager.supabase
        .from('user_profiles')
        .select('user_id, nickname, avatar_url, level')
        .in('user_id', userIds);
      
      // Crear mapa de perfiles
      const profileMap = {};
      (profiles || []).forEach(p => {
        profileMap[p.user_id] = p;
      });
      
      // Combinar datos
      friendRequestsWithUsers = friendRequests.map(req => ({
        ...req,
        user: profileMap[req.user_id] || {
          nickname: 'Usuario',
          avatar_url: null,
          level: 1
        }
      }));
    }
    
    // Cargar invitaciones a juegos (solo pendientes y no expiradas)
    let gameInvites = [];
    let gameError = null;
    
    try {
      if (navigator.onLine) {
        const result = await socialManager.supabase
          .from('game_invitations')
          .select('*')
          .eq('to_user_id', socialManager.userId)
          .eq('status', 'pending')
          .in('game_type', ['sync', 'vs', 'async']) // Aceptar sync, vs y async
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });
        
        gameInvites = result.data || [];
        gameError = result.error;
      } else {
        console.log('⚠️ Sin conexión - no se pueden cargar invitaciones');
      }
    } catch (error) {
      console.log('⚠️ Error de conexión cargando invitaciones:', error.message);
      gameError = error;
    }
    
    if (gameError) {
      console.error('Error cargando invitaciones de juego:', gameError);
    }
    
    // Cargar packs compartidos (solo pendientes)
    let sharedPacks = [];
    let packsError = null;
    
    try {
      if (navigator.onLine) {
        const result = await socialManager.supabase
          .from('shared_packs')
          .select('*')
          .eq('to_user_id', socialManager.userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        sharedPacks = result.data || [];
        packsError = result.error;
      }
    } catch (error) {
      // Si la tabla no existe, ignorar el error
      console.log('⚠️ Tabla shared_packs no disponible');
      packsError = null;
    }
    
    // Obtener datos de usuarios que enviaron invitaciones
    let gameInvitesWithUsers = [];
    if (gameInvites && gameInvites.length > 0) {
      // Obtener todos los IDs de una vez
      const fromUserIds = gameInvites.map(inv => inv.from_user_id);
      
      // Obtener todos los perfiles de una vez
      const { data: fromProfiles } = await socialManager.supabase
        .from('user_profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', fromUserIds);
      
      // Crear mapa de perfiles
      const fromProfileMap = {};
      (fromProfiles || []).forEach(p => {
        fromProfileMap[p.user_id] = p;
      });
      
      // Combinar datos
      gameInvitesWithUsers = gameInvites.map(inv => ({
        ...inv,
        from_user: fromProfileMap[inv.from_user_id] || {
          nickname: 'Usuario',
          avatar_url: null
        }
      }));
    }
    
    // Obtener datos de usuarios que compartieron packs
    let sharedPacksWithUsers = [];
    if (sharedPacks && sharedPacks.length > 0) {
      // Obtener todos los IDs de una vez
      const fromUserIds = sharedPacks.map(sp => sp.from_user_id);
      
      // Obtener todos los perfiles de una vez
      const { data: fromProfiles } = await socialManager.supabase
        .from('user_profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', fromUserIds);
      
      // Crear mapa de perfiles
      const fromProfileMap = {};
      (fromProfiles || []).forEach(p => {
        fromProfileMap[p.user_id] = p;
      });
      
      // Combinar datos
      sharedPacksWithUsers = sharedPacks.map(sp => ({
        ...sp,
        from_user: fromProfileMap[sp.from_user_id] || {
          nickname: 'Usuario',
          avatar_url: null
        }
      }));
    }
    
    let html = '';
    
    // Renderizar solicitudes de amistad
    if (friendRequestsWithUsers.length > 0) {
      html += '<div class="request-group"><div class="group-title">Solicitudes de amistad</div>';
      html += friendRequestsWithUsers.map(req => `
        <div class="request-item">
          <img src="${req.user?.avatar_url || './img/avatar_placeholder.svg'}" class="friend-avatar" onerror="this.onerror=null; this.src='./img/avatar_placeholder.svg';"/>
          <div class="friend-info">
            <div class="friend-name">${req.user?.nickname || 'Usuario'}</div>
            <div class="friend-level">Nivel ${req.user?.level || 1}</div>
          </div>
          <div class="friend-actions">
            <button class="btn small accent" data-action="accept-friend" data-request="${req.id}">Aceptar</button>
            <button class="btn small secondary" data-action="reject-friend" data-request="${req.id}">Rechazar</button>
          </div>
        </div>
      `).join('');
      html += '</div>';
    }
    
    // Renderizar invitaciones a juegos
    if (gameInvitesWithUsers.length > 0) {
      html += '<div class="request-group"><div class="group-title">Invitaciones a jugar</div>';
      html += gameInvitesWithUsers.map(inv => {
        const isAsync = inv.game_type === 'async';
        return `
          <div class="request-item">
            <img src="${inv.from_user?.avatar_url || './img/avatar_placeholder.svg'}" class="friend-avatar" onerror="this.onerror=null; this.src='./img/avatar_placeholder.svg';"/>
            <div class="friend-info">
              <div class="friend-name">${inv.from_user?.nickname || 'Usuario'}</div>
              <div class="friend-level">${isAsync ? 'Desafío de 24h' : 'Partida en vivo'}</div>
            </div>
            <div class="friend-actions">
              <button class="btn small accent" data-action="accept-game" data-invite="${inv.id}" data-type="${inv.game_type}" data-game="${inv.async_game_id || inv.room_code}">Jugar</button>
              <button class="btn small secondary" data-action="reject-game" data-invite="${inv.id}">Rechazar</button>
            </div>
          </div>
        `;
      }).join('');
      html += '</div>';
    }
    
    // Renderizar packs compartidos
    if (sharedPacksWithUsers.length > 0) {
      html += '<div class="request-group"><div class="group-title">Packs compartidos</div>';
      html += sharedPacksWithUsers.map(sp => {
        const questionCount = sp.pack_data?.questions?.length || 0;
        return `
          <div class="request-item">
            <img src="${sp.from_user?.avatar_url || './img/avatar_placeholder.svg'}" class="friend-avatar" onerror="this.onerror=null; this.src='./img/avatar_placeholder.svg';"/>
            <div class="friend-info">
              <div class="friend-name">${sp.from_user?.nickname || 'Usuario'}</div>
              <div class="friend-level">📦 ${sp.pack_name || 'Pack sin nombre'} (${questionCount} preguntas)</div>
            </div>
            <div class="friend-actions">
              <button class="btn small accent" data-action="accept-pack" data-pack-id="${sp.id}">Importar</button>
              <button class="btn small secondary" data-action="reject-pack" data-pack-id="${sp.id}">Rechazar</button>
            </div>
          </div>
        `;
      }).join('');
      html += '</div>';
    }
    
    if (!html) {
      html = '<div class="empty-state">No hay solicitudes pendientes</div>';
    }
    
    container.innerHTML = html;
    
    // Bind events
    bindRequestEvents();
    
  } catch (error) {
    console.error('Error cargando solicitudes:', error);
    container.innerHTML = '<div class="error">Error al cargar solicitudes</div>';
  }
}

function bindRequestEvents() {
  console.log('Vinculando eventos de solicitudes');
  
  // Aceptar solicitud de amistad
  document.querySelectorAll('[data-action="accept-friend"]').forEach(btn => {
    console.log('Vinculando botón aceptar para solicitud:', btn.dataset.request);
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Click en aceptar solicitud:', e.target.dataset.request);
      const requestId = e.target.dataset.request;
      const result = await socialManager.acceptFriendRequest(requestId);
      if (result.success) {
        showToast('Solicitud aceptada');
        // Actualizar notificaciones inmediatamente
        checkNotifications();
        // Esperar un momento para que la base de datos se actualice
        setTimeout(() => {
          loadRequests();
          loadFriends();
          // También cambiar al tab de amigos para ver el nuevo amigo
          document.querySelector('.tab-btn[data-tab="friends"]')?.click();
        }, 1000);
      } else {
        showToast('Error al aceptar solicitud');
        console.error('Error:', result.error);
      }
    });
  });
  
  // Rechazar solicitud de amistad
  document.querySelectorAll('[data-action="reject-friend"]').forEach(btn => {
    console.log('Vinculando botón rechazar para solicitud:', btn.dataset.request);
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Click en rechazar solicitud:', e.target.dataset.request);
      const requestId = e.target.dataset.request;
      try {
        // Eliminar la solicitud
        const { error } = await socialManager.supabase
          .from('friendships')
          .delete()
          .eq('id', requestId);
        
        if (error) {
          console.error('Error al rechazar:', error);
          showToast('Error al rechazar solicitud');
        } else {
          showToast('Solicitud rechazada');
          loadRequests();
        }
      } catch (error) {
        console.error('Error:', error);
        showToast('Error al rechazar solicitud');
      }
    });
  });
  
  // Aceptar invitación a juego
  document.querySelectorAll('[data-action="accept-game"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const inviteId = e.target.dataset.invite;
      const gameType = e.target.dataset.type;
      const gameData = e.target.dataset.game;
      
      console.log('Aceptando invitación de juego:');
      console.log('  - Invite ID:', inviteId);
      console.log('  - Game Type:', gameType);
      console.log('  - Game Data:', gameData);
      
      // Marcar invitación como aceptada
      const { error } = await socialManager.supabase
        .from('game_invitations')
        .update({ status: 'accepted' })
        .eq('id', inviteId);
      
      if (error) {
        console.error('Error al aceptar invitación:', error);
        showToast('Error al aceptar invitación');
        return;
      }
      
      if (gameType === 'async') {
        // Abrir juego asíncrono
        // TODO: Implementar juego asíncrono
        showToast('Juego asíncrono próximamente');
        // Cerrar panel de amigos
        document.getElementById('friendsPanel')?.classList.remove('open');
      } else {
        // Unirse a sala VS
        showToast('Uniéndose a sala: ' + gameData);
        
        // Cerrar panel de amigos
        document.getElementById('friendsPanel')?.classList.remove('open');
        
        // Cambiar a modo VS y a la pestaña de unirse
        const vsSeg = document.querySelector('#modeSeg .seg[data-val="vs"]');
        if (vsSeg) {
          // Activar VS
          document.querySelectorAll('#modeSeg .seg').forEach(s => s.classList.remove('active'));
          vsSeg.classList.add('active');
          vsSeg.click();
          
          // Esperar a que se muestre y cambiar a "unirse"
          setTimeout(() => {
            const joinSeg = document.querySelector('#vsModeToggle .seg[data-val="join"]');
            if (joinSeg) {
              document.querySelectorAll('#vsModeToggle .seg').forEach(s => s.classList.remove('active'));
              joinSeg.classList.add('active');
              joinSeg.click();
              
              // Poner el código en el input
              const codeInput = document.getElementById('inputVsCode');
              if (codeInput) {
                codeInput.value = gameData;
                
                // Auto-unirse después de un momento
                setTimeout(() => {
                  const btnJoin = document.getElementById('btnVsJoin');
                  if (btnJoin) {
                    btnJoin.click();
                  }
                }, 500);
              }
            }
          }, 200);
        }
      }
    });
  });
  
  // Rechazar invitación a juego
  document.querySelectorAll('[data-action="reject-game"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const inviteId = e.target.dataset.invite;
      await socialManager.supabase
        .from('game_invitations')
        .update({ status: 'rejected' })
        .eq('id', inviteId);
      showToast('Invitación rechazada');
      loadRequests();
    });
  });
  
  // Aceptar pack compartido
  document.querySelectorAll('[data-action="accept-pack"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const packId = e.target.dataset.packId;
      
      try {
        // Obtener el pack compartido
        const { data: packShare, error: fetchError } = await socialManager.supabase
          .from('shared_packs')
          .select('*')
          .eq('id', packId)
          .single();
        
        if (fetchError || !packShare) {
          showToast('Error al cargar el pack');
          return;
        }
        
        // Obtener nombre del remitente
        const { data: senderData } = await socialManager.supabase
          .from('user_profiles')
          .select('nickname')
          .eq('user_id', packShare.from_user_id)
          .single();
        
        const senderName = senderData?.nickname || 'Un amigo';
        
        // Importar el pack
        if (window.importSharedPack && packShare.pack_data) {
          window.importSharedPack(packShare.pack_data, senderName);
        }
        
        // Marcar como importado
        await socialManager.supabase
          .from('shared_packs')
          .update({ status: 'imported' })
          .eq('id', packId);
        
        showToast('✅ Pack importado correctamente');
        loadRequests();
      } catch(error) {
        console.error('Error aceptando pack:', error);
        showToast('Error al importar el pack');
      }
    });
  });
  
  // Rechazar pack compartido
  document.querySelectorAll('[data-action="reject-pack"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const packId = e.target.dataset.packId;
      
      try {
        const { error } = await socialManager.supabase
          .from('shared_packs')
          .update({ status: 'declined' })
          .eq('id', packId);
        
        if (error) {
          console.error('Error al rechazar pack:', error);
          showToast('Error al rechazar pack');
          return;
        }
        
        showToast('Pack rechazado');
        loadRequests();
      } catch(error) {
        console.error('Error rechazando pack:', error);
        showToast('Error al rechazar pack');
      }
    });
  });
}

async function loadRankings() {
  const container = document.getElementById('rankingsList');
  if (!container) {
    console.error('No se encontró el contenedor rankingsList');
    return;
  }
  
  console.log('Cargando rankings...');
  container.innerHTML = '<div class="loading">Cargando rankings...</div>';
  
  try {
    const result = await socialManager.getFriendRankings();
    console.log('Resultado de rankings:', result);
    
    if (!result.success) {
      console.error('Error obteniendo rankings:', result.error);
      container.innerHTML = '<div class="error">Error al cargar rankings</div>';
      return;
    }
    
    if (!result.data || result.data.length === 0) {
      container.innerHTML = '<div class="empty-state">Aún no has jugado contra amigos</div>';
      return;
    }
  
  // Calcular porcentaje de victorias y ordenar por más victorias
  const rankingsWithStats = result.data.map(rank => {
    const totalGames = rank.wins + rank.losses;
    const winRate = totalGames > 0 ? Math.round((rank.wins / totalGames) * 100) : 0;
    return { ...rank, totalGames, winRate };
  }).sort((a, b) => b.wins - a.wins);
  
  container.innerHTML = `
    <div class="rankings-header">
      <div class="stats-summary">
        Total de partidas: ${rankingsWithStats.reduce((sum, r) => sum + r.totalGames, 0)}
      </div>
    </div>
    ${rankingsWithStats.map((rank, index) => {
      const isMe = rank.isCurrentUser;
      const displayName = isMe ? 'Tú' : (rank.friend?.nickname || 'Usuario');
      return `
        <div class="ranking-item ${index < 3 ? 'top-rank' : ''} ${isMe ? 'current-user' : ''} ${!isMe ? 'clickable-ranking' : ''}" data-friend-id="${rank.friend_id}" style="${!isMe ? 'cursor: pointer;' : ''}">
          <div class="ranking-position">#${index + 1}</div>
          <img src="${rank.friend?.avatar_url || './img/avatar_placeholder.svg'}" class="friend-avatar" alt="${displayName}" onerror="this.onerror=null; this.src='./img/avatar_placeholder.svg';"/>
          <div class="friend-info">
            <div class="friend-name">${displayName}</div>
            <div class="ranking-stats">
              <span class="wins">V: ${rank.wins}</span>
              <span class="losses">D: ${rank.losses}</span>
              <span class="winrate">${rank.winRate}%</span>
            </div>
            <div class="stats-bar">
              <div class="wins-bar" style="width: ${rank.winRate}%"></div>
            </div>
          </div>
          ${!isMe ? '' : '<div class="you-badge">TÚ</div>'}
        </div>
      `;
    }).join('')}
  `;
  
  // Vincular eventos para ver perfil al hacer click en el ranking
  document.querySelectorAll('.clickable-ranking').forEach(item => {
    item.addEventListener('click', (e) => {
      const friendId = item.dataset.friendId;
      if (friendId) {
        showFriendProfile(friendId);
      }
    });
  });
  
  } catch (error) {
    console.error('Error en loadRankings:', error);
    container.innerHTML = '<div class="error">Error al cargar rankings</div>';
  }
}

async function inviteFriendToSync(friendId, friendNameParam = null) {
  try {
    console.log('=== inviteFriendToSync iniciado ===');
    console.log('Friend ID:', friendId);
    console.log('Friend Name:', friendNameParam);
    console.log('socialManager disponible?', !!window.socialManager);
    
    // Verificar que socialManager existe
    if (!window.socialManager) {
      console.error('socialManager no está disponible');
      showToast('Error: Sistema de amigos no inicializado');
      return;
    }
    // Obtener datos del amigo con manejo de errores
    let friendName = 'tu amigo';
    
    // Si se pasa el nombre como parámetro, usarlo
    if (friendNameParam) {
      friendName = friendNameParam;
    } else if (socialManager && socialManager.friends) {
      // Si socialManager existe, intentar obtener el nombre
      const friend = socialManager.friends.find(f => f.user_id === friendId);
      friendName = friend?.nickname || 'tu amigo';
    } else {
      // Si no hay datos locales, intentar obtener de Supabase
      if (window.supabaseClient) {
        const { data } = await window.supabaseClient
          .from('user_profiles')
          .select('nickname')
          .eq('user_id', friendId)
          .single();
        if (data) friendName = data.nickname;
      }
    }
    
    // Cerrar panel de amigos si existe
    const friendsPanel = document.getElementById('friendsPanel');
    if (friendsPanel) friendsPanel.classList.remove('open');
    
    // Guardar el friendId para cuando se cree la sala
    localStorage.setItem('pending_friend_invite', friendId);
    localStorage.setItem('pending_friend_name', friendName);
    
    // Mostrar la interfaz de configuración VS
    showToast(`Configura la partida contra ${friendName}`);
    
    // Cambiar a modo VS
    const vsSeg = document.querySelector('#modeSeg .seg[data-val="vs"]');
    if (vsSeg) {
      // Remover active de todos los segmentos
      document.querySelectorAll('#modeSeg .seg').forEach(s => s.classList.remove('active'));
      // Activar VS
      vsSeg.classList.add('active');
      // Disparar el evento para cambiar la UI
      vsSeg.click();
      
      // Esperar a que se muestre la sección VS y pre-configurar el modo host
      setTimeout(() => {
        // Asegurarse de que está en modo "crear"
        const hostSeg = document.querySelector('#vsModeToggle .seg[data-val="host"]');
        if (hostSeg && !hostSeg.classList.contains('active')) {
          document.querySelectorAll('#vsModeToggle .seg').forEach(s => s.classList.remove('active'));
          hostSeg.classList.add('active');
          hostSeg.click();
        }
        
        // Cambiar el texto del botón para indicar que es contra un amigo
        const btnHost = document.getElementById('btnVsHost');
        if (btnHost) {
          btnHost.textContent = `Crear partida contra ${friendName}`;
          btnHost.classList.add('friend-vs');
        }
        
        // Agregar un indicador visual
        const badge = document.getElementById('vsCodeBadge');
        if (badge) {
          badge.textContent = `Configura la partida contra ${friendName}`;
          badge.style.color = 'var(--accent)';
        }
      }, 100);
    }
  } catch (error) {
    console.error('Error al invitar amigo:', error);
    showToast('Error al configurar la partida');
  }
}

async function inviteFriendToAsync(friendId) {
  // Generar preguntas para el juego asíncrono
  showToast('Creando desafío...');
  
  try {
    // Por ahora, usar preguntas del banco local
    const bank = window.getBank ? window.getBank() : {};
    const allQuestions = [];
    
    Object.values(bank).forEach(categoryQuestions => {
      if (categoryQuestions && categoryQuestions.length > 0) {
        allQuestions.push(...categoryQuestions.slice(0, 5));
      }
    });
    
    // Mezclar y tomar 15
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const questions = shuffled.slice(0, 15);
    
    // Enviar invitación
    const result = await socialManager.inviteToAsyncGame(friendId, questions);
    
    if (result.success) {
      showToast('Desafío enviado - Tu oponente tiene 24 horas para responder');
      
      // Abrir el juego asíncrono
      // TODO: Implementar juego asíncrono
      showToast('Desafío creado - Próximamente podrás jugarlo');
    } else {
      showToast('Error al crear desafío');
    }
  } catch (error) {
    console.error('Error creando juego asíncrono:', error);
    showToast('Error al crear desafío');
  }
}

async function blockFriend(friendId) {
  const result = await socialManager.blockUser(friendId);
  if (result.success) {
    showToast('Usuario bloqueado');
    loadFriends();
  }
}

function subscribeToNotifications() {
  // Verificar notificaciones inmediatamente
  checkNotifications();
  
  // MÉTODO ALTERNATIVO: Suscribirse a canal de broadcast directo
  // (usar mientras se arreglan los permisos RLS)
  const broadcastChannel = socialManager.supabase
    .channel(`friend-invite-${socialManager.userId}`)
    .on('broadcast', { event: 'game-invite' }, async (payload) => {
      console.log('Invitación recibida por canal alternativo:', payload);
      
      const invite = payload.payload;
      if (invite && invite.to_user_id === socialManager.userId) {
        // Obtener el nombre del usuario que envía
        const { data: senderData } = await socialManager.supabase
          .from('user_profiles')
          .select('nickname')
          .eq('user_id', invite.from_user_id)
          .single();
        
        const senderName = senderData?.nickname || 'Un amigo';
        showToast(`${senderName} te invitó a jugar VS! Código: ${invite.room_code}`);
        
        // Vibrar si está disponible
        if (window.navigator?.vibrate) {
          window.navigator.vibrate([200, 100, 200]);
        }
        
        // Actualizar manualmente las solicitudes
        loadRequests();
        checkNotifications();
      }
    })
    .subscribe();
  
  // Suscribirse a cambios en tiempo real de shared_packs (packs compartidos)
  const packShareChannel = socialManager.supabase
    .channel(`shared-packs-${socialManager.userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'shared_packs',
        filter: `to_user_id=eq.${socialManager.userId}`
      },
      async (payload) => {
        console.log('Nuevo pack compartido detectado:', payload);
        if (payload.new.status === 'pending') {
          await handleReceivedPack(payload.new);
        }
      }
    )
    .subscribe();
  
  // También escuchar broadcasts como fallback
  const packBroadcastChannel = socialManager.supabase
    .channel(`pack-share-${socialManager.userId}`)
    .on('broadcast', { event: 'pack-share' }, async (payload) => {
      console.log('Pack compartido recibido por broadcast:', payload);
      
      const packShare = payload.payload;
      if (packShare && packShare.pack_data) {
        await handleReceivedPack({
          from_user_id: packShare.from_user_id,
          pack_name: packShare.pack_data.pack?.name,
          pack_data: packShare.pack_data.pack
        });
      }
    })
    .subscribe();
  
  // Función para manejar packs recibidos (solo notificación, no importar automáticamente)
  async function handleReceivedPack(packShare) {
    try {
      // Obtener el nombre del usuario que envía
      const { data: senderData } = await socialManager.supabase
        .from('user_profiles')
        .select('nickname')
        .eq('user_id', packShare.from_user_id)
        .single();
      
      const senderName = senderData?.nickname || 'Un amigo';
      const packName = packShare.pack_name || packShare.pack_data?.name || 'Pack sin nombre';
      
      // Mostrar notificación toast
      showToast(`📦 ${senderName} te compartió el pack "${packName}"`);
      
      // Vibrar si está disponible
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([200, 100, 200]);
      }
      
      // Actualizar badge de notificaciones
      checkNotifications();
      
      // Si el panel de solicitudes está abierto, recargarlo
      const requestsTab = document.querySelector('.tab-btn[data-tab="requests"]');
      if (requestsTab?.classList.contains('active')) {
        loadRequests();
      }
    } catch(error) {
      console.error('Error manejando pack recibido:', error);
    }
  }
  
  // Verificar packs pendientes al iniciar (solo para notificar, no importar)
  checkPendingPacks();
  
  async function checkPendingPacks() {
    try {
      const { data: pendingPacks } = await socialManager.supabase
        .from('shared_packs')
        .select('*')
        .eq('to_user_id', socialManager.userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (pendingPacks && pendingPacks.length > 0) {
        // Solo notificar, no importar automáticamente
        const latestPack = pendingPacks[0];
        await handleReceivedPack(latestPack);
      }
    } catch(error) {
      // Si la tabla no existe, ignorar el error
      console.log('Tabla shared_packs no disponible, usando solo broadcast');
    }
  }
  
  // MÉTODO NORMAL: Suscribirse a cambios en tiempo real de friendships (solicitudes de amistad)
  const friendshipsChannel = socialManager.supabase
    .channel(`friendships-${socialManager.userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'friendships',
        filter: `friend_id=eq.${socialManager.userId}`
      },
      (payload) => {
        console.log('Nueva solicitud de amistad detectada:', payload);
        if (payload.new.status === 'pending') {
          showToast('¡Nueva solicitud de amistad!');
          checkNotifications();
          // Si el tab de solicitudes está activo, actualizarlo
          const requestsTab = document.querySelector('.tab-btn[data-tab="requests"]');
          if (requestsTab?.classList.contains('active')) {
            loadRequests();
          }
        }
      }
    )
    .subscribe();
  
  // Suscribirse a cambios en tiempo real de game_invitations (invitaciones a juegos)
  const invitationsChannel = socialManager.supabase
    .channel(`invitations-${socialManager.userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'game_invitations',
        filter: `to_user_id=eq.${socialManager.userId}`
      },
      async (payload) => {
        console.log('Nueva invitación de juego detectada:', payload);
        if (payload.new.status === 'pending') {
          // Obtener el nombre del usuario que envía la invitación
          const { data: senderData } = await socialManager.supabase
            .from('user_profiles')
            .select('nickname')
            .eq('user_id', payload.new.from_user_id)
            .single();
          
          const senderName = senderData?.nickname || 'Un amigo';
          const gameType = payload.new.game_type;
          
          if (gameType === 'sync') {
            showToast(`${senderName} te invitó a jugar VS!`);
          } else {
            showToast(`${senderName} te envió un desafío de 24h!`);
          }
          
          // Vibrar si está disponible
          if (window.navigator?.vibrate) {
            window.navigator.vibrate([200, 100, 200]);
          }
          
          // Actualizar notificaciones y solicitudes
          checkNotifications();
          
          // Si el tab de solicitudes está activo, actualizarlo
          const requestsTab = document.querySelector('.tab-btn[data-tab="requests"]');
          if (requestsTab?.classList.contains('active')) {
            loadRequests();
          }
        }
      }
    )
    .subscribe();
  
  // También verificar periódicamente por si acaso
  setInterval(() => {
    checkNotifications();
  }, 30000);
}

async function checkNotifications() {
  try {
    // Verificar solicitudes de amistad pendientes
    const { data: friendRequests, error: friendError } = await socialManager.supabase
      .from('friendships')
      .select('id')
      .eq('friend_id', socialManager.userId)
      .eq('status', 'pending');
    
    // Verificar invitaciones a juegos
    const { data: gameInvites, error: gameError } = await socialManager.supabase
      .from('game_invitations')
      .select('id')
      .eq('to_user_id', socialManager.userId)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString());
    
    // Verificar packs compartidos pendientes
    let sharedPacksCount = 0;
    try {
      const { data: sharedPacks } = await socialManager.supabase
        .from('shared_packs')
        .select('id')
        .eq('to_user_id', socialManager.userId)
        .eq('status', 'pending');
      sharedPacksCount = sharedPacks ? sharedPacks.length : 0;
    } catch(e) {
      // Si la tabla no existe, ignorar
    }
    
    const totalNotifications = 
      (friendRequests ? friendRequests.length : 0) + 
      (gameInvites ? gameInvites.length : 0) +
      sharedPacksCount;
    
    // Actualizar badge
    updateNotificationBadge(totalNotifications);
    
    // Si hay nuevas notificaciones, mostrar un toast
    const lastCount = parseInt(localStorage.getItem('last_notification_count') || '0');
    if (totalNotifications > lastCount) {
      const diff = totalNotifications - lastCount;
      if (diff === 1) {
        showToast('Tienes una nueva notificación');
      } else {
        showToast(`Tienes ${diff} nuevas notificaciones`);
      }
      
      // Vibrar el dispositivo si está disponible
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(200);
      }
    }
    
    localStorage.setItem('last_notification_count', totalNotifications.toString());
    
  } catch (error) {
    console.error('Error verificando notificaciones:', error);
  }
}

function updateNotificationBadge(count) {
  const badge = document.getElementById('friendsBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  
  // También actualizar el tab de solicitudes con un indicador
  const requestsTab = document.querySelector('.tab-btn[data-tab="requests"]');
  if (requestsTab) {
    if (count > 0) {
      requestsTab.innerHTML = `Solicitudes <span class="tab-badge">${count}</span>`;
    } else {
      requestsTab.innerHTML = 'Solicitudes';
    }
  }
}

function showToast(message) {
  const toast = document.querySelector('.toast') || createToast();
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function createToast() {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    display: none;
  `;
  document.body.appendChild(toast);
  return toast;
}

async function showFriendProfile(friendId) {
  // Crear modal de perfil si no existe
  let profileModal = document.getElementById('friendProfileModal');
  
  if (!profileModal) {
    profileModal = document.createElement('div');
    profileModal.id = 'friendProfileModal';
    profileModal.className = 'modal';
    profileModal.innerHTML = `
      <div class="panel friend-profile-panel">
        <div class="row" style="justify-content:space-between">
          <div style="font-weight:800">Perfil del Jugador</div>
          <button class="iconbtn" id="btnCloseFriendProfile" type="button">✖</button>
        </div>
        
        <!-- Header reorganizado con avatar a la izquierda -->
        <div class="profile-header-horizontal">
          <img src="./img/avatar_placeholder.svg" alt="Avatar" class="profile-avatar-large" id="friendProfileAvatar"/>
          <div class="profile-info">
            <div class="profile-nickname" id="friendProfileNickname">—</div>
            <div class="level-badge" id="friendProfileLevel">Nivel 1</div>
            <div class="xp-bar-container">
              <div class="xp-bar" id="friendProfileXpBar"></div>
              <div class="xp-text" id="friendProfileXpText">0 / 100 XP</div>
            </div>
          </div>
        </div>
        
        <!-- Acciones -->
        <div class="profile-section">
          <div class="row" style="gap: 8px;">
            <button class="btn accent" id="btnChallengeFriend" style="flex:1">Desafiar</button>
            <button class="btn secondary danger" id="btnRemoveFriend" style="flex:1">Eliminar Amigo</button>
          </div>
        </div>
        
        <!-- Estadísticas contra este amigo (más compacto) -->
        <div class="profile-section compact">
          <h4>Estadísticas VS</h4>
          <div id="friendVsStats" class="stats-row">
            <div class="stat-compact">
              <span class="stat-value" id="vsWins">0</span>
              <span class="stat-label">V</span>
            </div>
            <div class="stat-compact">
              <span class="stat-value" id="vsLosses">0</span>
              <span class="stat-label">D</span>
            </div>
            <div class="stat-compact">
              <span class="stat-value" id="vsWinRate">0%</span>
              <span class="stat-label">Win%</span>
            </div>
          </div>
        </div>
        
        <!-- Estadísticas generales del amigo (más compacto) -->
        <div class="profile-section compact">
          <h4>Estadísticas Globales</h4>
          <div id="friendGlobalStats" class="stats-row">
            <div class="stat-compact">
              <span class="stat-value" id="friendTotalGames">0</span>
              <span class="stat-label">Partidas</span>
            </div>
            <div class="stat-compact">
              <span class="stat-value" id="friendCorrectRate">0%</span>
              <span class="stat-label">Aciertos</span>
            </div>
            <div class="stat-compact">
              <span class="stat-value" id="friendBestStreak">0</span>
              <span class="stat-label">Racha</span>
            </div>
          </div>
        </div>
        
        <!-- Logros del amigo -->
        <div class="profile-section">
          <h4>Logros Desbloqueados</h4>
          <div id="friendAchievements" class="achievements-grid-icons">
            <div class="loading">Cargando logros...</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(profileModal);
    
    // Vincular evento de cerrar
    document.getElementById('btnCloseFriendProfile')?.addEventListener('click', () => {
      profileModal.classList.remove('open');
    });
  }
  
  // Cargar datos del usuario
  try {
    console.log('Cargando perfil del usuario:', friendId);
    
    // Verificar si ya es amigo
    const { data: friendships } = await socialManager.supabase
      .from('friendships')
      .select('status')
      .or(`and(user_id.eq.${socialManager.userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${socialManager.userId})`)
      .limit(1);
    
    const isFriend = friendships && friendships.length > 0 && friendships[0].status === 'accepted';
    const hasPendingRequest = friendships && friendships.length > 0 && friendships[0].status === 'pending';
    
    console.log('Relación de amistad:', { isFriend, hasPendingRequest, friendships });
    
    // Actualizar el botón según la relación
    const btnRemove = document.getElementById('btnRemoveFriend');
    if (btnRemove) {
      if (isFriend) {
        btnRemove.textContent = 'Eliminar Amigo';
        btnRemove.className = 'btn secondary danger';
      } else if (hasPendingRequest) {
        btnRemove.textContent = 'Solicitud Pendiente';
        btnRemove.className = 'btn secondary';
        btnRemove.disabled = true;
      } else {
        btnRemove.textContent = 'Agregar Amigo';
        btnRemove.className = 'btn secondary accent';
        btnRemove.disabled = false;
      }
    }
    
    // Obtener perfil completo del usuario incluyendo XP y nivel actualizados
    const { data: profile, error: profileError } = await socialManager.supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', friendId)
      .single();
    
    console.log('Perfil obtenido:', profile);
    if (profileError) console.error('Error obteniendo perfil:', profileError);
    
    if (profile) {
      document.getElementById('friendProfileNickname').textContent = profile.nickname || 'Usuario';
      document.getElementById('friendProfileLevel').innerHTML = `Nivel ${profile.level || 1}`;
      const friendAvatar = document.getElementById('friendProfileAvatar');
      if (friendAvatar) {
        friendAvatar.src = profile.avatar_url || './img/avatar_placeholder.svg';
        friendAvatar.onerror = function() {
          this.onerror = null;
          this.src = './img/avatar_placeholder.svg';
        };
      }
      
      // Calcular y mostrar XP usando los datos reales del perfil
      const totalXp = profile.total_xp || 0;
      let currentLevelXP = 0, xpForNextLevel = 100, progressPercent = 0;
      
      if (window.getLevelProgress) {
        const progress = window.getLevelProgress(totalXp);
        currentLevelXP = progress.currentLevelXP;
        xpForNextLevel = progress.xpForNextLevel;
        progressPercent = progress.progressPercent;
      }
      
      console.log('XP del amigo:', { totalXp, currentLevelXP, xpForNextLevel, progressPercent });
      
      const xpBar = document.getElementById('friendProfileXpBar');
      const xpText = document.getElementById('friendProfileXpText');
      if (xpBar) xpBar.style.width = `${progressPercent}%`;
      if (xpText) xpText.textContent = `${currentLevelXP} / ${xpForNextLevel} XP`;
    }
    
    // Obtener rankings VS
    const { data: ranking } = await socialManager.supabase
      .from('friend_rankings')
      .select('*')
      .eq('user_id', socialManager.userId)
      .eq('friend_id', friendId)
      .single();
    
    if (ranking) {
      const totalGames = ranking.wins + ranking.losses;
      const winRate = totalGames > 0 ? Math.round((ranking.wins / totalGames) * 100) : 0;
      
      document.getElementById('vsWins').textContent = ranking.wins;
      document.getElementById('vsLosses').textContent = ranking.losses;
      document.getElementById('vsWinRate').textContent = winRate + '%';
    } else {
      document.getElementById('vsWins').textContent = '0';
      document.getElementById('vsLosses').textContent = '0';
      document.getElementById('vsWinRate').textContent = '0%';
    }
    
    // Obtener estadísticas globales del amigo desde la tabla correcta
    const { data: stats, error: statsError } = await socialManager.supabase
      .from('user_stats')
      .select('total_games_played, questions_correct, questions_answered, best_win_streak')
      .eq('user_id', friendId)
      .single();
    
    console.log('Stats del amigo:', stats);
    if (statsError) console.error('Error obteniendo stats:', statsError);
    
    if (stats) {
      document.getElementById('friendTotalGames').textContent = stats.total_games_played || 0;
      const correctRate = (stats.questions_answered > 0)
        ? Math.round((stats.questions_correct / stats.questions_answered) * 100)
        : 0;
      document.getElementById('friendCorrectRate').textContent = correctRate + '%';
      document.getElementById('friendBestStreak').textContent = stats.best_win_streak || 0;
    } else {
      document.getElementById('friendTotalGames').textContent = '0';
      document.getElementById('friendCorrectRate').textContent = '0%';
      document.getElementById('friendBestStreak').textContent = '0';
    }
    
    // Obtener logros del amigo directamente de user_achievements
    console.log('Obteniendo logros del amigo:', friendId);
    
    // Usar la lista de logros global si está disponible
    const ACHIEVEMENTS_LIST = window.ACHIEVEMENTS_LIST || [];
    
    // Obtener los logros desbloqueados del amigo
    const unlockedAchievements = new Set();
    
    // Obtener directamente de user_achievements
    const { data: achievements, error: achError } = await socialManager.supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', friendId);
    
    console.log('Logros obtenidos:', achievements);
    if (achError) console.error('Error obteniendo logros:', achError);
    
    if (achievements && Array.isArray(achievements)) {
      achievements.forEach(ach => {
        unlockedAchievements.add(ach.achievement_id);
      });
    }
    
    // Renderizar logros con iconos
    const achievementsContainer = document.getElementById('friendAchievements');
    if (achievementsContainer) {
      achievementsContainer.innerHTML = ACHIEVEMENTS_LIST.map(ach => {
        const isUnlocked = unlockedAchievements.has(ach.id);
        const iconPath = ach.icon ? `Icons/${ach.icon}` : '';
        return `
          <div class="achievement-icon-item ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-tooltip">${ach.description}</div>
            <div class="achievement-icon-wrapper">
              ${iconPath ? 
                `<img src="${iconPath}" alt="${ach.title}" onerror="this.style.display='none'; this.parentElement.innerHTML='${isUnlocked ? '🏆' : '🔒'}';" />` : 
                (isUnlocked ? '🏆' : '🔒')
              }
            </div>
            <div class="achievement-icon-name">${ach.title}</div>
          </div>
        `;
      }).join('');
      
      if (ACHIEVEMENTS_LIST.length === 0) {
        achievementsContainer.innerHTML = '<div class="empty-state">Sin logros aún</div>';
      }
    }
    
    // Vincular eventos de los botones
    document.getElementById('btnChallengeFriend')?.addEventListener('click', () => {
      profileModal.classList.remove('open');
      document.getElementById('friendsPanel')?.classList.remove('open');
      inviteFriendToSync(friendId);
    }, { once: true });
    
    document.getElementById('btnRemoveFriend')?.addEventListener('click', async () => {
      if (isFriend) {
        // Eliminar amigo
        if (confirm('¿Seguro que quieres eliminar a este amigo?')) {
          const result = await socialManager.removeFriend(friendId);
          
          if (result.success) {
            showToast('Amigo eliminado');
            profileModal.classList.remove('open');
            loadFriends();
          } else {
            showToast('Error al eliminar amigo');
          }
        }
      } else if (!hasPendingRequest) {
        // Agregar amigo (enviar solicitud)
        const result = await socialManager.sendFriendRequest(friendId);
        
        if (result.success) {
          showToast('Solicitud enviada');
          profileModal.classList.remove('open');
          // Actualizar el botón
          const btnRemove = document.getElementById('btnRemoveFriend');
          if (btnRemove) {
            btnRemove.textContent = 'Solicitud Pendiente';
            btnRemove.className = 'btn secondary';
            btnRemove.disabled = true;
          }
        } else {
          showToast(result.error || 'Error al enviar solicitud');
        }
      }
    }, { once: true });
    
    // Mostrar modal
    profileModal.classList.add('open');
    
  } catch (error) {
    console.error('Error cargando perfil del amigo:', error);
    showToast('Error al cargar el perfil');
  }
}

// Función para cargar partidas abiertas
async function loadOpenMatches() {
  console.log('Cargando partidas abiertas...');
  
  const container = document.getElementById('matchesList');
  if (!container) {
    console.error('No se encontró el contenedor matchesList');
    return;
  }
  
  if (!socialManager) {
    console.error('socialManager no está disponible');
    container.innerHTML = '<div class="error">Sistema de amigos no inicializado</div>';
    return;
  }
  
  try {
    // Obtener partidas asíncronas del usuario actual
    console.log('🔍 Buscando partidas para usuario:', socialManager.userId);
    
    // Primero verificar que la tabla existe y tiene datos
    const { data: testData, error: testError } = await socialManager.supabase
      .from('async_matches')
      .select('id')
      .limit(1);
    
    console.log('🔍 Test de tabla async_matches:', { testData, testError });
    
    if (testError) {
      console.error('Error accediendo a la tabla async_matches:', testError);
      container.innerHTML = '<div class="error">Error: Tabla async_matches no disponible</div>';
      return;
    }
    
    // Obtener partidas donde el usuario es player1
    const { data: player1Matches, error: player1Error } = await socialManager.supabase
      .from('async_matches')
      .select('*')
      .eq('player1_id', socialManager.userId)
      .order('created_at', { ascending: false });
    
    console.log('🔍 Partidas como player1:', { player1Matches, player1Error });
    
    // Obtener partidas donde el usuario es player2
    const { data: player2Matches, error: player2Error } = await socialManager.supabase
      .from('async_matches')
      .select('*')
      .eq('player2_id', socialManager.userId)
      .order('created_at', { ascending: false });
    
    console.log('🔍 Partidas como player2:', { player2Matches, player2Error });
    
    // Combinar ambas listas y ordenar por fecha (más recientes primero)
    const allMatches = [...(player1Matches || []), ...(player2Matches || [])]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const hasError = player1Error || player2Error;
    
    console.log('📊 Todas las partidas del usuario:', { allMatches, hasError });
    
    // Obtener perfiles de los jugadores para mostrar nombres y avatares reales
    if (allMatches.length > 0) {
      const allPlayerIds = [...new Set([
        ...allMatches.map(m => m.player1_id),
        ...allMatches.map(m => m.player2_id)
      ])];
      
      console.log('👥 IDs de jugadores únicos:', allPlayerIds);
      
      const { data: profiles, error: profilesError } = await socialManager.supabase
        .from('user_profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', allPlayerIds);
      
      console.log('👥 Perfiles obtenidos:', { profiles, profilesError });
      
      // Crear mapa de perfiles para búsqueda rápida
      const profileMap = {};
      if (profiles) {
        profiles.forEach(profile => {
          profileMap[profile.user_id] = {
            nickname: profile.nickname || 'Usuario',
            avatar_url: profile.avatar_url
          };
        });
      }
      
      // Actualizar partidas con datos de perfiles
      allMatches.forEach(match => {
        const player1Profile = profileMap[match.player1_id];
        const player2Profile = profileMap[match.player2_id];
        
        if (player1Profile) {
          match.player1_name = player1Profile.nickname;
          match.player1_avatar = player1Profile.avatar_url;
        }
        if (player2Profile) {
          match.player2_name = player2Profile.nickname;
          match.player2_avatar = player2Profile.avatar_url;
        }
      });
      
      console.log('📊 Partidas actualizadas con perfiles:', allMatches);
    }
    
    if (hasError) {
      console.error('Error obteniendo partidas:', { player1Error, player2Error });
      
      // Mostrar error más específico
      let errorMessage = 'Error al cargar partidas';
      if (player1Error?.code === 'PGRST301' || player2Error?.code === 'PGRST301') {
        errorMessage = 'Error: Políticas de seguridad bloquean el acceso';
      } else if (player1Error?.code === 'PGRST116' || player2Error?.code === 'PGRST116') {
        errorMessage = 'Error: Tabla no encontrada o sin permisos';
      } else if (player1Error?.status === 400 || player2Error?.status === 400) {
        errorMessage = 'Error 400: Consulta inválida - Verificar políticas RLS';
      }
      
      container.innerHTML = `
        <div class="error">
          ${errorMessage}
          <br><small>Revisar políticas de Supabase</small>
        </div>
      `;
      return;
    }
    
    // Si la función RPC ya filtró las partidas, usar directamente
    // Si no, usar las que vienen de allMatches (ya filtradas arriba si es fallback)
    const validMatches = allMatches;
    
    console.log('🎯 Partidas válidas:', validMatches.length);
    
    if (validMatches.length === 0) {
      container.innerHTML = '<div class="empty-state">No tienes partidas abiertas</div>';
      return;
    }
    
    // CORRECCIÓN: Calcular progreso real basado en respuestas, no current_question
    // Esto asegura que ambos jugadores vean el mismo progreso
    for (const match of validMatches) {
      const meId = socialManager.userId;
      const isPlayer1 = match.player1_id === meId;
      
      // Calcular cuántas preguntas completó el jugador actual (donde ambos respondieron)
      // y cuántas respondió solo él (esperando al rival)
      try {
        // Obtener todas las respuestas de la partida para calcular progreso real
        const { data: allAnswers } = await socialManager.supabase
          .from('async_answers')
          .select('question_index, player_id')
          .eq('match_id', match.id)
          .order('question_index', { ascending: true });
        
        if (allAnswers && allAnswers.length > 0) {
          // Agrupar respuestas por pregunta
          const answersByQuestion = {};
          allAnswers.forEach(answer => {
            if (!answersByQuestion[answer.question_index]) {
              answersByQuestion[answer.question_index] = [];
            }
            answersByQuestion[answer.question_index].push(answer.player_id);
          });
          
          // Calcular: cuántas preguntas completó (ambos respondieron)
          let completedQuestions = 0;
          let myAnsweredQuestions = 0;
          
          for (let i = 0; i < match.rounds; i++) {
            const questionAnswers = answersByQuestion[i] || [];
            const player1Answered = questionAnswers.includes(match.player1_id);
            const player2Answered = questionAnswers.includes(match.player2_id);
            
            if (player1Answered && player2Answered) {
              completedQuestions++;
            }
            
            if ((isPlayer1 && player1Answered) || (!isPlayer1 && player2Answered)) {
              myAnsweredQuestions++;
            }
          }
          
          // Actualizar match con progreso real calculado
          match._realCompletedQuestions = completedQuestions;
          match._myAnsweredQuestions = myAnsweredQuestions;
          match._displayQuestion = completedQuestions; // Mostrar preguntas completadas
          
          console.log(`📊 Partida ${match.id}: Progreso calculado = ${completedQuestions}/${match.rounds} (completadas: ${completedQuestions}, yo respondí: ${myAnsweredQuestions})`);
          
          // Determinar si ya respondió la pregunta actual
          const currentQuestionIndex = completedQuestions; // La siguiente pregunta a responder
          const answersForCurrent = answersByQuestion[currentQuestionIndex] || [];
          match._meAnswered = answersForCurrent.includes(meId);
          match._opponentAnswered = answersForCurrent.includes(isPlayer1 ? match.player2_id : match.player1_id);
        } else {
          // No hay respuestas aún
          match._realCompletedQuestions = 0;
          match._myAnsweredQuestions = 0;
          match._displayQuestion = 0;
          match._meAnswered = false;
          match._opponentAnswered = false;
        }
      } catch (error) {
        console.warn('⚠️ Error calculando progreso real, usando current_question:', error);
        // Fallback a current_question si falla el cálculo
        match._displayQuestion = match.current_question || 0;
        
        // Usar campos calculados como fallback
        if (match.player1_answered_current !== undefined && match.player2_answered_current !== undefined) {
          match._meAnswered = isPlayer1 ? match.player1_answered_current : match.player2_answered_current;
          match._opponentAnswered = isPlayer1 ? match.player2_answered_current : match.player1_answered_current;
        } else {
          match._meAnswered = false;
          match._opponentAnswered = false;
        }
      }
      
      // También usar campos calculados para determinar turno
      if (match.current_turn_player_id !== null && match.current_turn_player_id !== undefined) {
        // Campo directo: más simple y rápido
        match._finalIsMyTurn = match.current_turn_player_id === meId;
      } else {
        // Fallback: usar campos calculados
        match._finalIsMyTurn = match._opponentAnswered && !match._meAnswered;
      }
    }

    // Para partidas sin question_start_time, obtener el timestamp de la primera respuesta como fallback
    // Esto solo se hace para partidas que realmente lo necesitan (question_start_time es null)
    const matchesWithoutStartTime = validMatches.filter(m => !m.question_start_time && m.status === 'question_active');
    if (matchesWithoutStartTime.length > 0) {
      try {
        const matchIds = matchesWithoutStartTime.map(m => m.id);
        const currentQ = matchesWithoutStartTime[0].current_question || 0; // Todas deberían tener la misma pregunta actual
        
        // Consulta optimizada: obtener todas las respuestas y filtrar el MIN por match_id en frontend
        const { data: firstAnswers, error: answersError } = await socialManager.supabase
          .from('async_answers')
          .select('match_id, created_at')
          .in('match_id', matchIds)
          .eq('question_index', currentQ)
          .order('created_at', { ascending: true });
        
        if (!answersError && Array.isArray(firstAnswers)) {
          // Crear un mapa con el primer timestamp (mínimo) por match_id
          const firstAnswerMap = {};
          firstAnswers.forEach(a => {
            const existing = firstAnswerMap[a.match_id];
            if (!existing || new Date(a.created_at) < new Date(existing)) {
              firstAnswerMap[a.match_id] = a.created_at;
            }
          });
          
          // Asignar fallback a las partidas que lo necesitan
          matchesWithoutStartTime.forEach(match => {
            if (firstAnswerMap[match.id]) {
              match._questionStartFallback = firstAnswerMap[match.id];
            }
          });
        }
      } catch (e) {
        console.warn('⚠️ No se pudo obtener timestamp de primera respuesta para fallback:', e);
      }
    }

    // Renderizar partidas
    container.innerHTML = validMatches.map(match => createMatchItem(match)).join('');
    
    // Bind events para los botones de partidas
    bindMatchItemEvents();
    
  } catch (error) {
    console.error('Error en loadOpenMatches:', error);
    container.innerHTML = '<div class="error">Error al cargar partidas</div>';
  }
}

// Función para crear un item de partida
function createMatchItem(match) {
  console.log('🎮 Creando item para partida:', match);
  
  const isPlayer1 = match.player1_id === socialManager.userId;
  const opponentId = isPlayer1 ? match.player2_id : match.player1_id;
  let opponentName = isPlayer1 ? match.player2_name : match.player1_name;
  
  console.log('👤 Datos originales:', { 
    isPlayer1, 
    opponentId, 
    originalName: opponentName,
    player1_name: match.player1_name,
    player2_name: match.player2_name
  });
  
  // Si el nombre está vacío o es "Anon", usar un nombre genérico mejor
  if (!opponentName || opponentName === 'Anon' || opponentName.trim() === '') {
    opponentName = `Jugador ${opponentId.substring(0, 4)}`;
    console.log('🔄 Usando nombre genérico:', opponentName);
  }
  
  // Usar avatar real si está disponible, sino generar uno
  let opponentAvatar;
  if (isPlayer1 && match.player2_avatar) {
    opponentAvatar = match.player2_avatar;
  } else if (!isPlayer1 && match.player1_avatar) {
    opponentAvatar = match.player1_avatar;
  } else {
    // Generar avatar con iniciales
    opponentAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(opponentName)}&background=random&color=fff&size=40`;
  }
  
  // Calcular tiempo transcurrido
  const now = new Date();
  const matchTime = new Date(match.created_at);
  const diffMs = now - matchTime;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  let timeAgo;
  if (diffHours > 0) {
    timeAgo = `hace ${diffHours}h ${diffMinutes}m`;
  } else if (diffMinutes > 0) {
    timeAgo = `hace ${diffMinutes}m`;
  } else {
    timeAgo = 'ahora';
  }
  // Calcular estado (tu turno / esperando) y, si existe, el tiempo restante
  const ASYNC_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 horas por pregunta
  let statusLine = '';
  
  // Usar turno calculado previamente en loadOpenMatches
  const meId = socialManager.userId;
  let finalIsMyTurn = match._finalIsMyTurn !== undefined 
    ? match._finalIsMyTurn 
    : (match.current_turn_player_id === meId);
  
  // Para el tiempo: usar question_start_time o fallback con la primera respuesta
  // Los triggers mantienen question_start_time actualizado, pero para partidas antiguas usamos fallback
  const startIso = match.question_start_time || match._questionStartFallback;
  
  if (startIso) {
    const elapsedMs = now - new Date(startIso);
    const remainingMs = Math.max(0, ASYNC_TIMEOUT_MS - elapsedMs);
    const remH = Math.floor(remainingMs / (1000 * 60 * 60));
    const remM = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const remainingFmt = remH > 0 ? `${remH}h ${remM}m` : `${remM}m`;
    const isDanger = remainingMs <= (60 * 60 * 1000);
    statusLine = finalIsMyTurn
      ? `<span>te quedan <span class="${isDanger ? 'time-danger' : ''}">${remainingFmt}</span></span>`
      : `<span>esperando al rival • <span class="${isDanger ? 'time-danger' : ''}">${remainingFmt}</span></span>`;
  } else {
    // Sin tiempo de inicio conocido, solo mostrar el estado del turno
    statusLine = finalIsMyTurn ? '<span>tu turno</span>' : '<span>esperando al rival</span>';
  }

  return `
    <div class="match-item clickable-match" data-match-id="${match.id}" data-opponent-id="${opponentId}" style="cursor: pointer;">
      <div class="match-status ${isPlayer1 ? 'player1' : 'player2'}"></div>
      <img src="${opponentAvatar}" class="match-avatar" alt="${opponentName}" onerror="this.onerror=null; this.src='./img/avatar_placeholder.svg'"/>
      <div class="match-info">
        <div class="match-opponent">vs ${opponentName}</div>
        <div class="match-details">
          ${match._displayQuestion !== undefined ? match._displayQuestion : (match.current_question || 0)}/${match.rounds} preguntas • ${match.category} • ${match.difficulty}
          <!-- DEBUG: ${match._realCompletedQuestions !== undefined ? `(calculado: ${match._realCompletedQuestions}, BD: ${match.current_question || 0})` : ''} -->
        </div>
        <div class="match-time">${timeAgo} • ${statusLine}</div>
      </div>
      <div class="match-actions">
        <button class="btn small accent" onclick="event.stopPropagation(); window.startAsyncGame('${match.id}')">
          Entrar
        </button>
      </div>
    </div>
  `;
}

// Función para bindear eventos de los items de partida
function bindMatchItemEvents() {
  // Click en la cápsula de partida para ver perfil del oponente
  document.querySelectorAll('.clickable-match').forEach(item => {
    item.addEventListener('click', (e) => {
      // Solo procesar si no se hizo click en un botón
      if (!e.target.closest('button')) {
        const opponentId = item.dataset.opponentId;
        if (opponentId) {
          showFriendProfile(opponentId);
        }
      }
    });
  });
  
  // Eventos legacy para botones con data-action
  document.querySelectorAll('[data-action="join-match"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const matchId = e.target.dataset.match;
      console.log('Entrando a partida:', matchId);
      
      try {
        // Cerrar panel de amigos
        const panel = document.getElementById('friendsPanel');
        if (panel) panel.classList.remove('open');
        
        // Iniciar el juego asíncrono
        if (window.startAsyncGame) {
          await window.startAsyncGame(matchId);
          
          // Recargar la lista de partidas abiertas después de aceptar
          // (esto hará que la partida aceptada desaparezca del listado)
          setTimeout(() => {
            if (window.loadOpenMatches) {
              window.loadOpenMatches();
            }
          }, 1000);
        } else {
          showToast('Error: Función de juego no disponible');
        }
      } catch (error) {
        console.error('Error entrando a partida:', error);
        showToast('Error al entrar a la partida');
      }
    });
  });
}

// Exponer funciones globalmente
window.loadOpenMatches = loadOpenMatches;

// Invalidar caché cuando se crea/acepta/responde en una partida
if (window.asyncMatchesCache) {
  // Invalidar caché cuando se acepta una partida
  const originalLoadMatches = loadOpenMatches;
  window.loadOpenMatches = async function() {
    await originalLoadMatches();
  };
  
  // Exponer función para invalidar caché manualmente
  window.invalidateAsyncMatchesCache = function() {
    if (window.asyncMatchesCache && socialManager?.userId) {
      window.asyncMatchesCache.invalidate(socialManager.userId);
      console.log('📦 Caché de partidas invalidado manualmente');
    }
  };
}
window.showFriendProfile = showFriendProfile;

export default {
  initFriendsSystem,
  showFriendProfile,
  toggleFriendsPanel
};
