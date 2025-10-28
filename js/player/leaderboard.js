// js/leaderboard.js - Sistema de Leaderboards Local y Global
import { getGlobalLeaderboard, getLeaderboardByWinRate, getLeaderboardByStreak } from './global_leaderboard.js';

const K_ROUNDS = 'lb_rounds_local';
const K_TIMED  = 'lb_timed_local';

function read(key){
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function write(key, arr){
  localStorage.setItem(key, JSON.stringify(arr));
}

export async function saveLB(mode, score, total, username){
  const now = new Date().toISOString();
  if (mode === 'rounds'){
    const arr = read(K_ROUNDS);
    arr.push({ username: username || 'Anon', score: Number(score)||0, total: Number(total)||0, created_at: now });
    write(K_ROUNDS, arr);
  } else if (mode === 'timed'){
    const arr = read(K_TIMED);
    arr.push({ username: username || 'Anon', points: Number(score)||0, created_at: now });
    write(K_TIMED, arr);
  }
}

export async function renderLB(){
  // Verificar si hay Supabase disponible para mostrar leaderboard global
  const supabase = window.supabaseClient;
  
  if (supabase) {
    // Mostrar leaderboard global
    await renderGlobalLeaderboard(supabase);
  } else {
    // Mostrar solo leaderboard local
    renderLocalLeaderboard();
  }
}

async function renderGlobalLeaderboard(supabase) {
  const container = document.getElementById('lbRounds')?.parentElement;
  if (!container) return;
  
  // Crear estructura con tabs
  container.innerHTML = `
    <div class="lb-tabs">
      <button class="lb-tab active" data-category="global">🌍 Global</button>
      <button class="lb-tab" data-category="friends">👥 Amigos</button>

      <button class="lb-tab" data-category="local">📱 Local</button>
    </div>
    <div class="lb-content" id="lbContent">
      <div class="loading">Cargando ranking...</div>
    </div>
  `;
  
  // Agregar estilos si no existen
  if (!document.getElementById('lb-styles')) {
    const style = document.createElement('style');
    style.id = 'lb-styles';
    style.textContent = `
      .lb-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        overflow-x: auto;
        padding-bottom: 4px;
      }
      .lb-tab {
        padding: 8px 16px;
        background: var(--card);
        border: 2px solid var(--cardBorder);
        color: var(--text);
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
      }
      .lb-tab:hover {
        transform: translateY(-2px);
        border-color: var(--accent);
      }
      .lb-tab.active {
        background: var(--accent);
        color: white;
        border-color: var(--accent);
      }
      .lb-table {
        width: 100%;
        font-size: 14px;
        border-spacing: 0;
      }
      .lb-table th {
        padding: 12px 8px;
        text-align: left;
        font-weight: 700;
        color: var(--muted);
        border-bottom: 2px solid var(--cardBorder);
      }
      .lb-table td {
        padding: 10px 8px;
        border-bottom: 1px solid var(--cardBorder);
      }
      .lb-table tr:hover {
        background: rgba(139,92,246,0.05);
      }
      .lb-rank {
        font-weight: 800;
        color: var(--accent);
        width: 40px;
      }
      .lb-rank.gold { color: #FFD700; }
      .lb-rank.silver { color: #C0C0C0; }
      .lb-rank.bronze { color: #CD7F32; }
      .lb-player {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .lb-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--cardBorder);
        object-fit: cover;
      }
      .lb-name {
        font-weight: 600;
      }
      .lb-current-user {
        background: linear-gradient(90deg, rgba(139,92,246,0.1) 0%, transparent 100%);
      }
      .lb-current-user .lb-name {
        color: var(--accent);
      }
      .lb-level {
        display: inline-block;
        background: linear-gradient(135deg, var(--accent), var(--accent2));
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
      .lb-stat {
        font-weight: 700;
        color: var(--text);
      }
      .lb-divider {
        height: 2px;
        background: var(--cardBorder);
        margin: 16px 0;
      }
      .lb-your-rank {
        padding: 16px;
        background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(34,211,238,0.1));
        border: 2px solid var(--accent);
        border-radius: 12px;
        margin-top: 16px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Manejar clicks en tabs
  document.querySelectorAll('.lb-tab').forEach(tab => {
    tab.addEventListener('click', async (e) => {
      // Cambiar tab activo
      document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const category = tab.dataset.category;
      const content = document.getElementById('lbContent');
      content.innerHTML = '<div class="loading">Cargando...</div>';
      
      switch(category) {
        case 'global':
          await showGlobalRanking(supabase, content);
          break;
        case 'friends':
          await showFriendsRanking(supabase, content);
          break;

        case 'local':
          renderLocalLeaderboard(content);
          break;
      }
    });
  });
  
  // Mostrar ranking global por defecto
  await showGlobalRanking(supabase, document.getElementById('lbContent'));
}

async function showGlobalRanking(supabase, container) {
  const result = await getGlobalLeaderboard(supabase, 50);
  
  if (!result.success) {
    container.innerHTML = '<div class="error">Error al cargar el ranking</div>';
    return;
  }
  
  const players = result.data;
  
  let html = `
    <table class="lb-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Jugador</th>
          <th>Nivel</th>
          <th>XP Total</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  players.forEach(player => {
    const rankClass = player.rank === 1 ? 'gold' : player.rank === 2 ? 'silver' : player.rank === 3 ? 'bronze' : '';
    html += `
      <tr class="${player.isCurrentUser ? 'lb-current-user' : ''}">
        <td class="lb-rank ${rankClass}">#${player.rank}</td>
        <td>
          <div class="lb-player">
            <img src="${player.avatar_url || 'img/avatar_placeholder.svg'}" class="lb-avatar" alt="${player.nickname}"/>
            <span class="lb-name">${player.nickname || 'Jugador'} ${player.isCurrentUser ? '(Tú)' : ''}</span>
          </div>
        </td>
        <td><span class="lb-level">Nivel ${player.level}</span></td>
        <td class="lb-stat">${player.total_xp.toLocaleString()} XP</td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  
  // Si el usuario actual no está en el top 50, mostrar su posición
  if (result.currentUserRank) {
    html += `
      <div class="lb-your-rank">
        <strong>Tu posición:</strong> #${result.currentUserRank.rank} - 
        Nivel ${result.currentUserRank.level} - 
        ${result.currentUserRank.total_xp.toLocaleString()} XP
      </div>
    `;
  }
  
  container.innerHTML = html;
}

async function showFriendsRanking(supabase, container) {
  // Obtener amigos del usuario
  if (!window.socialManager) {
    container.innerHTML = '<div class="empty-state">Inicia sesión para ver el ranking de amigos</div>';
    return;
  }
  
  const friendsResult = await window.socialManager.getFriends();
  if (!friendsResult.success || friendsResult.data.length === 0) {
    container.innerHTML = '<div class="empty-state">No tienes amigos aún</div>';
    return;
  }
  
  // Obtener IDs de amigos más el usuario actual
  const friendIds = friendsResult.data.map(f => f.user_id);
  friendIds.push(window.socialManager.userId);
  
  // Obtener perfiles de amigos
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('user_id, nickname, level, total_xp, avatar_url')
    .in('user_id', friendIds)
    .order('total_xp', { ascending: false });
  
  if (error || !profiles) {
    container.innerHTML = '<div class="error">Error al cargar ranking de amigos</div>';
    return;
  }
  
  let html = `
    <table class="lb-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Amigo</th>
          <th>Nivel</th>
          <th>XP Total</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  profiles.forEach((player, index) => {
    const isMe = player.user_id === window.socialManager.userId;
    const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
    html += `
      <tr class="${isMe ? 'lb-current-user' : ''}">
        <td class="lb-rank ${rankClass}">#${index + 1}</td>
        <td>
          <div class="lb-player">
            <img src="${player.avatar_url || 'img/avatar_placeholder.svg'}" class="lb-avatar" alt="${player.nickname}"/>
            <span class="lb-name">${player.nickname || 'Jugador'} ${isMe ? '(Tú)' : ''}</span>
          </div>
        </td>
        <td><span class="lb-level">Nivel ${player.level}</span></td>
        <td class="lb-stat">${player.total_xp.toLocaleString()} XP</td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

async function showWinRateRanking(supabase, container) {
  const result = await getLeaderboardByWinRate(supabase, 50);
  
  if (!result.success) {
    container.innerHTML = '<div class="error">Error al cargar el ranking</div>';
    return;
  }
  
  let html = `
    <table class="lb-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Jugador</th>
          <th>Precisión</th>
          <th>Respuestas</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  result.data.forEach(player => {
    const rankClass = player.rank === 1 ? 'gold' : player.rank === 2 ? 'silver' : player.rank === 3 ? 'bronze' : '';
    html += `
      <tr class="${player.isCurrentUser ? 'lb-current-user' : ''}">
        <td class="lb-rank ${rankClass}">#${player.rank}</td>
        <td>
          <div class="lb-player">
            <img src="${player.avatar_url || 'img/avatar_placeholder.svg'}" class="lb-avatar" alt="${player.nickname}"/>
            <span class="lb-name">${player.nickname || 'Jugador'} ${player.isCurrentUser ? '(Tú)' : ''}</span>
          </div>
        </td>
        <td class="lb-stat">${player.winRate}%</td>
        <td>${player.questions_correct}/${player.questions_answered}</td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

async function showStreakRanking(supabase, container) {
  const result = await getLeaderboardByStreak(supabase, 50);
  
  if (!result.success) {
    container.innerHTML = '<div class="error">Error al cargar el ranking</div>';
    return;
  }
  
  let html = `
    <table class="lb-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Jugador</th>
          <th>Mejor Racha</th>
          <th>Nivel</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  result.data.forEach(player => {
    const rankClass = player.rank === 1 ? 'gold' : player.rank === 2 ? 'silver' : player.rank === 3 ? 'bronze' : '';
    html += `
      <tr class="${player.isCurrentUser ? 'lb-current-user' : ''}">
        <td class="lb-rank ${rankClass}">#${player.rank}</td>
        <td>
          <div class="lb-player">
            <img src="${player.avatar_url || 'img/avatar_placeholder.svg'}" class="lb-avatar" alt="${player.nickname}"/>
            <span class="lb-name">${player.nickname || 'Jugador'} ${player.isCurrentUser ? '(Tú)' : ''}</span>
          </div>
        </td>
        <td class="lb-stat">🔥 ${player.longest_correct_streak || 0}</td>
        <td><span class="lb-level">Nivel ${player.level}</span></td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

function renderLocalLeaderboard(container) {
  const containerEl = container || document.getElementById('lbRounds')?.parentElement;
  if (!containerEl) return;
  
  // Read & sort
  const rRounds = read(K_ROUNDS).sort((a,b)=> (b.score||0) - (a.score||0)).slice(0,50);
  const rTimed  = read(K_TIMED ).sort((a,b)=> (b.points||0) - (a.points||0)).slice(0,50);
  
  let html = '<h4>Partidas Locales (Solo)</h4>';
  html += '<table class="lb-table">';
  html += '<thead><tr><th>Usuario</th><th>Puntaje</th><th>De</th><th>Fecha</th></tr></thead>';
  html += '<tbody>';
  rRounds.forEach(x => {
    html += `<tr><td>${esc(x.username)}</td><td>${x.score}</td><td>${x.total}</td><td>${fmt(x.created_at)}</td></tr>`;
  });
  html += '</tbody></table>';
  
  html += '<div class="lb-divider"></div>';
  
  html += '<h4>Contrarreloj Local</h4>';
  html += '<table class="lb-table">';
  html += '<thead><tr><th>Usuario</th><th>Puntos</th><th>Fecha</th></tr></thead>';
  html += '<tbody>';
  rTimed.forEach(x => {
    html += `<tr><td>${esc(x.username)}</td><td>${x.points}</td><td>${fmt(x.created_at)}</td></tr>`;
  });
  html += '</tbody></table>';
  
  containerEl.innerHTML = html;
}

function esc(s){ 
  return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); 
}

function fmt(iso){ 
  try{ return new Date(iso).toLocaleString(); }catch{ return ''; } 
}