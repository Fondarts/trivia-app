// js/async_game_ui.js - Interfaz para partidas asíncronas

import { AsyncGameManager } from './async_game.js';

let asyncManager = null;
let currentAsyncGame = null;

export function initAsyncGame(supabase, userId, gameId) {
  asyncManager = new AsyncGameManager(supabase, userId);
  
  // Crear UI de juego asíncrono
  createAsyncGameUI();
  
  // Cargar el juego
  loadAsyncGame(gameId);
}

function createAsyncGameUI() {
  // Verificar si ya existe
  if (document.getElementById('asyncGamePanel')) return;
  
  const panel = document.createElement('div');
  panel.id = 'asyncGamePanel';
  panel.className = 'fs';
  panel.innerHTML = `
    <div class="wrap">
      <div class="titlebar">
        <div class="fs-titlebar-title">Partida Asíncrona</div>
        <button class="back" id="btnCloseAsync">✖</button>
      </div>
      
      <div class="card">
        <!-- Header del juego -->
        <div class="async-game-header">
          <div class="async-players">
            <div class="async-player">
              <img src="img/avatar_placeholder.svg" id="asyncMyAvatar" class="async-avatar"/>
              <div class="async-player-info">
                <div class="async-player-name" id="asyncMyName">Tú</div>
                <div class="async-player-score" id="asyncMyScore">0 pts</div>
              </div>
            </div>
            
            <div class="async-vs">VS</div>
            
            <div class="async-player">
              <img src="img/avatar_placeholder.svg" id="asyncOpponentAvatar" class="async-avatar"/>
              <div class="async-player-info">
                <div class="async-player-name" id="asyncOpponentName">Oponente</div>
                <div class="async-player-score" id="asyncOpponentScore">0 pts</div>
              </div>
            </div>
          </div>
          
          <div class="async-timer">
            <span id="asyncTimeRemaining">24:00:00</span> restantes
          </div>
        </div>
        
        <!-- Área de pregunta -->
        <div class="async-question-area" id="asyncQuestionArea">
          <div class="row" style="justify-content:space-between">
            <div class="badge" id="asyncQuestionNumber">Pregunta 1/15</div>
            <div class="badge" id="asyncCategory">General</div>
          </div>
          
          <div class="async-question" id="asyncQuestionText">
            Cargando pregunta...
          </div>
          
          <div class="options" id="asyncOptions"></div>
          
          <div class="progress" style="margin-top: 16px;">
            <div id="asyncProgressBar" style="width: 0%"></div>
          </div>
        </div>
        
        <!-- Área de resultados (oculta inicialmente) -->
        <div class="async-results" id="asyncResults" style="display:none">
          <div class="hero">
            <div class="big-title" id="asyncResultTitle">—</div>
            <div class="subtitle" id="asyncResultSubtitle">—</div>
            <div class="bigscore" id="asyncResultScore">0 vs 0</div>
          </div>
          
          <div class="async-answers-review" id="asyncAnswersReview"></div>
          
          <div class="row" style="margin-top: 16px;">
            <button class="btn secondary" id="btnAsyncHome">Volver al inicio</button>
          </div>
        </div>
        
        <!-- Área de espera (oculta inicialmente) -->
        <div class="async-waiting" id="asyncWaiting" style="display:none">
          <div class="empty-state">
            <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
            <h3>¡Ya completaste tu parte!</h3>
            <p>Esperando a que tu oponente complete sus respuestas...</p>
            <p class="async-timer">Tiempo restante: <span id="asyncWaitingTime">—</span></p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Bind events
  bindAsyncGameEvents();
}

function bindAsyncGameEvents() {
  document.getElementById('btnCloseAsync')?.addEventListener('click', closeAsyncGame);
  document.getElementById('btnAsyncHome')?.addEventListener('click', closeAsyncGame);
}

async function loadAsyncGame(gameId) {
  if (!asyncManager) return;
  
  const result = await asyncManager.loadAsyncGame(gameId);
  
  if (!result.success) {
    showToast(result.error || 'Error cargando partida');
    closeAsyncGame();
    return;
  }
  
  currentAsyncGame = result.data;
  
  // Mostrar panel
  document.getElementById('asyncGamePanel').style.display = 'block';
  
  // Actualizar info de jugadores
  updatePlayersInfo();
  
  // Actualizar timer
  startTimer();
  
  // Verificar estado
  if (result.completed) {
    if (result.waitingForOpponent) {
      showWaitingScreen();
    } else {
      showResults();
    }
  } else {
    showNextQuestion();
  }
}

function updatePlayersInfo() {
  if (!currentAsyncGame) return;
  
  const isPlayer1 = currentAsyncGame.player1_id === asyncManager.userId;
  
  // Mi info
  const myScore = isPlayer1 ? currentAsyncGame.player1_score : currentAsyncGame.player2_score;
  document.getElementById('asyncMyScore').textContent = `${myScore || 0} pts`;
  
  // Info del oponente
  const opponent = isPlayer1 ? currentAsyncGame.player2 : currentAsyncGame.player1;
  const opponentScore = isPlayer1 ? currentAsyncGame.player2_score : currentAsyncGame.player1_score;
  
  if (opponent) {
    document.getElementById('asyncOpponentName').textContent = opponent.nickname || 'Oponente';
    if (opponent.avatar_url) {
      document.getElementById('asyncOpponentAvatar').src = opponent.avatar_url;
    }
  }
  document.getElementById('asyncOpponentScore').textContent = `${opponentScore || 0} pts`;
}

function showNextQuestion() {
  const question = asyncManager.getCurrentQuestion();
  
  if (!question) {
    // No hay más preguntas, mostrar resultados o espera
    if (currentAsyncGame.player1_completed && currentAsyncGame.player2_completed) {
      showResults();
    } else {
      showWaitingScreen();
    }
    return;
  }
  
  // Mostrar área de pregunta
  document.getElementById('asyncQuestionArea').style.display = 'block';
  document.getElementById('asyncResults').style.display = 'none';
  document.getElementById('asyncWaiting').style.display = 'none';
  
  // Actualizar pregunta
  document.getElementById('asyncQuestionNumber').textContent = 
    `Pregunta ${question.questionNumber}/${question.totalQuestions}`;
  document.getElementById('asyncCategory').textContent = question.category;
  document.getElementById('asyncQuestionText').textContent = question.question;
  
  // Actualizar progreso
  const progress = ((question.questionNumber - 1) / question.totalQuestions) * 100;
  document.getElementById('asyncProgressBar').style.width = `${progress}%`;
  
  // Renderizar opciones
  const optionsContainer = document.getElementById('asyncOptions');
  optionsContainer.innerHTML = '';
  
  question.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = option;
    btn.addEventListener('click', () => answerQuestion(index, btn));
    optionsContainer.appendChild(btn);
  });
}

async function answerQuestion(answerIndex, buttonElement) {
  // Deshabilitar todas las opciones
  document.querySelectorAll('#asyncOptions .option').forEach(opt => {
    opt.disabled = true;
    opt.classList.add('disabled');
  });
  
  const result = await asyncManager.answerQuestion(answerIndex);
  
  if (result.success) {
    // Mostrar si era correcto o incorrecto
    const question = asyncManager.questions[asyncManager.currentQuestionIndex - 1];
    
    if (result.correct) {
      buttonElement.classList.add('correct');
    } else {
      buttonElement.classList.add('wrong');
      // Mostrar la correcta
      const correctButton = document.querySelectorAll('#asyncOptions .option')[question.correct];
      if (correctButton) correctButton.classList.add('correct');
    }
    
    // Actualizar puntuación
    updatePlayersInfo();
    
    // Esperar un momento y continuar
    setTimeout(() => {
      if (result.completed) {
        // Todas las preguntas completadas
        showWaitingScreen();
        asyncManager.saveProgress(true);
      } else {
        // Siguiente pregunta
        showNextQuestion();
      }
    }, 1500);
  }
}

function showWaitingScreen() {
  document.getElementById('asyncQuestionArea').style.display = 'none';
  document.getElementById('asyncResults').style.display = 'none';
  document.getElementById('asyncWaiting').style.display = 'block';
  
  // Actualizar tiempo restante
  updateWaitingTime();
}

function showResults() {
  const results = asyncManager.getResults();
  if (!results) return;
  
  document.getElementById('asyncQuestionArea').style.display = 'none';
  document.getElementById('asyncWaiting').style.display = 'none';
  document.getElementById('asyncResults').style.display = 'block';
  
  // Actualizar resultados
  if (results.draw) {
    document.getElementById('asyncResultTitle').textContent = '¡Empate!';
    document.getElementById('asyncResultSubtitle').textContent = 'Ambos jugaron muy bien';
  } else if (results.won) {
    document.getElementById('asyncResultTitle').textContent = '¡Victoria!';
    document.getElementById('asyncResultSubtitle').textContent = 'Has derrotado a tu oponente';
  } else {
    document.getElementById('asyncResultTitle').textContent = 'Derrota';
    document.getElementById('asyncResultSubtitle').textContent = 'Mejor suerte la próxima vez';
  }
  
  document.getElementById('asyncResultScore').textContent = 
    `${results.myScore} vs ${results.opponentScore}`;
  
  // TODO: Mostrar revisión de respuestas
}

function startTimer() {
  if (!currentAsyncGame) return;
  
  const updateTimer = () => {
    const now = new Date();
    const expires = new Date(currentAsyncGame.expires_at);
    const remaining = expires - now;
    
    if (remaining <= 0) {
      document.getElementById('asyncTimeRemaining').textContent = 'Expirado';
      clearInterval(timerInterval);
      return;
    }
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('asyncTimeRemaining').textContent = timeStr;
  };
  
  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);
  
  // Guardar para limpiar después
  window.asyncTimerInterval = timerInterval;
}

function updateWaitingTime() {
  const updateTimer = () => {
    const now = new Date();
    const expires = new Date(currentAsyncGame.expires_at);
    const remaining = expires - now;
    
    if (remaining <= 0) {
      document.getElementById('asyncWaitingTime').textContent = 'Tiempo agotado';
      clearInterval(waitingInterval);
      // Mostrar resultados parciales
      showResults();
      return;
    }
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const timeStr = hours > 1 ? `${hours} horas` : `${Math.floor(remaining / (1000 * 60))} minutos`;
    document.getElementById('asyncWaitingTime').textContent = timeStr;
  };
  
  updateTimer();
  const waitingInterval = setInterval(updateTimer, 60000); // Actualizar cada minuto
}

function closeAsyncGame() {
  document.getElementById('asyncGamePanel').style.display = 'none';
  
  // Limpiar timers
  if (window.asyncTimerInterval) {
    clearInterval(window.asyncTimerInterval);
    window.asyncTimerInterval = null;
  }
  
  // Volver al menú principal
  window.location.reload();
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

export default {
  initAsyncGame
};