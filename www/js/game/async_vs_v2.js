// ==========================================
// ASYNC VS V2 - Nueva Arquitectura Simplificada
// ==========================================

import { buildDeckSingle } from './bank.js';

// ==========================================
// CONFIGURACIÓN CENTRALIZADA
// ==========================================

const ASYNC_CONFIG = {
  REQUEST_EXPIRY_HOURS: 48,      // Solicitudes expiran en 48h
  QUESTION_TIMEOUT_HOURS: 6,      // Cada pregunta tiene 6h
  MATCH_CLEANUP_HOURS: 72,        // Partidas se borran después de 72h sin actividad
};

const ASYNC_TIMEOUT_MS = ASYNC_CONFIG.QUESTION_TIMEOUT_HOURS * 60 * 60 * 1000;
const REQUEST_EXPIRY_MS = ASYNC_CONFIG.REQUEST_EXPIRY_HOURS * 60 * 60 * 1000;

// ==========================================
// ESTADO GLOBAL
// ==========================================

let sb = null;
let me = { id: null, name: 'Anon' };

let callbacks = {
  onStatus: (_) => {},
  onQuestion: (_) => {},
  onTimerTick: (_) => {},
  onEnd: (_) => {},
  onMatchUpdate: (_) => {},
};

// ==========================================
// UTILIDADES
// ==========================================

const nowUTCms = () => Date.now();
const isoNow = () => new Date().toISOString();

const generateUUID = () => {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ==========================================
// API PÚBLICA - INICIALIZACIÓN
// ==========================================

export function initAsyncVSV2({ supabase, userId, username, callbacks: userCallbacks = {} }) {
  sb = supabase;
  
  // Validar y generar UUID si es necesario
  let validUserId = userId;
  if (!validUserId || validUserId === 'null' || validUserId === 'undefined') {
    validUserId = generateUUID();
    console.log('🔧 Generando nuevo UUID:', validUserId);
  }
  
  me.id = validUserId;
  me.name = username || 'Anon';
  callbacks = { ...callbacks, ...userCallbacks };
  
  console.log('✅ Async VS V2 inicializado:', { userId: me.id, username: me.name });
  
  // Configurar suscripciones Realtime (opcional, para notificaciones)
  setupRealtimeSubscriptions();
  
  // Exponer funciones globalmente
  window.asyncVSV2 = {
    createMatch: createAsyncMatchV2,
    acceptMatch: acceptAsyncMatchV2,
    answerQuestion: answerQuestionV2,
    getCurrentQuestion: getCurrentQuestionV2,
    getMyMatches: getMyMatchesV2,
    startGame: startAsyncGameV2,
  };
}

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

// Crear nueva partida asíncrona
export async function createAsyncMatchV2({ rounds = 10, category = 'all', difficulty = 'easy' } = {}) {
  if (!sb) throw new Error('Supabase no inicializado');
  
  console.log('📝 Creando partida asíncrona V2:', { rounds, category, difficulty });
  
  // Generar deck de preguntas
  const deck = buildDeckSingle(category, rounds, difficulty);
  
  const matchData = {
    player1_id: me.id,
    player1_name: me.name,
    player2_id: null,
    player2_name: null,
    rounds,
    category,
    difficulty,
    deck: JSON.stringify(deck),
    status: 'pending',
    expires_at: new Date(Date.now() + REQUEST_EXPIRY_MS).toISOString(),
    last_activity_at: isoNow(),
    created_by: me.id,
  };
  
  const { data, error } = await sb
    .from('async_matches_v2')
    .insert([matchData])
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creando partida:', error);
    throw error;
  }
  
  console.log('✅ Partida creada:', data.id);
  
  callbacks.onStatus({
    status: 'match_created',
    matchId: data.id,
    message: 'Partida creada. Esperando que alguien acepte...'
  });
  
  return data;
}

// Aceptar partida asíncrona
export async function acceptAsyncMatchV2(matchId) {
  if (!sb) throw new Error('Supabase no inicializado');
  
  console.log('✅ Aceptando partida:', matchId);
  
  // Verificar que la partida existe y está pendiente
  const { data: match, error: fetchError } = await sb
    .from('async_matches_v2')
    .select('*')
    .eq('id', matchId)
    .eq('status', 'pending')
    .single();
  
  if (fetchError || !match) {
    throw new Error('Partida no encontrada o ya fue aceptada');
  }
  
  // Verificar que no sea mi propia partida
  if (match.player1_id === me.id) {
    throw new Error('No puedes aceptar tu propia partida');
  }
  
  // Actualizar partida: agregar player2 y cambiar a active
  const { data: updatedMatch, error: updateError } = await sb
    .from('async_matches_v2')
    .update({
      player2_id: me.id,
      player2_name: me.name,
      status: 'active',
      expires_at: null, // Ya no expira por tiempo de aceptación
      last_activity_at: isoNow(),
    })
    .eq('id', matchId)
    .select()
    .single();
  
  if (updateError) {
    console.error('❌ Error aceptando partida:', updateError);
    throw updateError;
  }
  
  console.log('✅ Partida aceptada:', updatedMatch.id);
  
  callbacks.onStatus({
    status: 'match_accepted',
    matchId: updatedMatch.id,
    opponent: match.player1_name,
    message: `¡Partida aceptada contra ${match.player1_name}!`
  });
  
  return updatedMatch;
}

// Responder pregunta
export async function answerQuestionV2(matchId, questionIndex, answer, timeSpent) {
  if (!sb) throw new Error('Supabase no inicializado');
  
  console.log('📝 Respondiendo pregunta:', { matchId, questionIndex, answer, timeSpent });
  
  // Verificar que la partida existe y está activa
  const { data: match, error: matchError } = await sb
    .from('async_matches_v2')
    .select('*')
    .eq('id', matchId)
    .eq('status', 'active')
    .single();
  
  if (matchError || !match) {
    throw new Error('Partida no encontrada o no está activa');
  }
  
  // Verificar que el jugador es parte de la partida
  if (match.player1_id !== me.id && match.player2_id !== me.id) {
    throw new Error('No eres parte de esta partida');
  }
  
  // Verificar que no haya respondido ya esta pregunta
  const { data: existingAnswer } = await sb
    .from('async_answers_v2')
    .select('id')
    .eq('match_id', matchId)
    .eq('player_id', me.id)
    .eq('question_index', questionIndex)
    .single();
  
  if (existingAnswer) {
    throw new Error('Ya respondiste esta pregunta');
  }
  
  // Guardar respuesta
  const { error: answerError } = await sb
    .from('async_answers_v2')
    .insert([{
      match_id: matchId,
      player_id: me.id,
      question_index: questionIndex,
      answer: answer.toString(),
      time_spent: timeSpent,
      answered_at: isoNow()
    }]);
  
  if (answerError) {
    console.error('❌ Error guardando respuesta:', answerError);
    throw answerError;
  }
  
  // El trigger actualiza last_activity_at automáticamente
  
  console.log('✅ Respuesta guardada');
  
  // Verificar si ambos respondieron
  const { data: bothAnswered } = await sb.rpc('both_players_answered_v2', {
    p_match_id: matchId,
    p_question_index: questionIndex
  });
  
  let matchFinished = false;
  
  if (bothAnswered) {
    console.log('🎉 Ambos respondieron, verificando si hay más preguntas...');
    
    // Verificar si la partida terminó (si la siguiente pregunta es >= rounds)
    // questionIndex es 0-based, así que la última pregunta es rounds - 1
    // Si ambos respondieron la pregunta rounds - 1, entonces nextQuestion = rounds, y la partida terminó
    const nextQuestion = questionIndex + 1;
    
    console.log('🔍 Verificando si partida terminó:', {
      questionIndex,
      nextQuestion,
      rounds: match.rounds,
      isLastQuestion: nextQuestion >= match.rounds
    });
    
    // Verificar si es la última pregunta: questionIndex es 0-based, así que la última es rounds - 1
    // Si ambos respondieron la pregunta rounds - 1, entonces nextQuestion = rounds, y la partida terminó
    const isLastQuestion = questionIndex >= match.rounds - 1;
    
    console.log('🔍 Verificando si es última pregunta:', {
      questionIndex,
      nextQuestion,
      rounds: match.rounds,
      isLastQuestion,
      condition: nextQuestion >= match.rounds
    });
    
    if (nextQuestion >= match.rounds || isLastQuestion) {
      // Partida terminada - ambos respondieron la última pregunta
      console.log('🏁 Partida terminada - ambos respondieron la última pregunta');
      matchFinished = true;
      
      await sb
        .from('async_matches_v2')
        .update({
          status: 'finished',
          finished_at: isoNow(),
          last_activity_at: isoNow()
        })
        .eq('id', matchId);
      
      console.log('📊 Mostrando resultados...');
      // Calcular y mostrar resultados al jugador que acaba de responder
      await showAsyncResultsV2(matchId, me.id);
      
      callbacks.onEnd({ matchId, status: 'finished' });
    } else {
      // Hay más preguntas, notificar
      console.log('➡️ Hay más preguntas, notificando...');
      callbacks.onMatchUpdate({
        matchId,
        message: 'Ambos respondieron. Nueva pregunta disponible.'
      });
    }
  }
  
  return { success: true, bothAnswered, matchFinished };
}

// Obtener pregunta actual para un jugador
export async function getCurrentQuestionV2(matchId, playerId) {
  if (!sb) throw new Error('Supabase no inicializado');
  
  const { data, error } = await sb.rpc('get_current_question_v2', {
    p_match_id: matchId,
    p_player_id: playerId || me.id
  });
  
  if (error) {
    console.error('❌ Error obteniendo pregunta actual:', error);
    return null;
  }
  
  return data;
}

// Obtener partidas del usuario
export async function getMyMatchesV2() {
  if (!sb) throw new Error('Supabase no inicializado');
  
  const { data, error } = await sb
    .from('async_matches_v2')
    .select('*')
    .or(`player1_id.eq.${me.id},player2_id.eq.${me.id}`)
    .order('last_activity_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error obteniendo partidas:', error);
    return [];
  }
  
  return data || [];
}

// Iniciar juego asíncrono
export async function startAsyncGameV2(matchId) {
  if (!sb) throw new Error('Supabase no inicializado');
  
  console.log('🎮 Iniciando juego asíncrono V2:', matchId);
  
  // Obtener datos de la partida
  const { data: match, error: matchError } = await sb
    .from('async_matches_v2')
    .select('*')
    .eq('id', matchId)
    .single();
  
  if (matchError || !match) {
    throw new Error('Partida no encontrada');
  }
  
  // Si la partida está pending y el usuario NO es el creador, aceptarla primero
  if (match.status === 'pending' && match.player1_id !== me.id) {
    console.log('✅ Partida pendiente detectada, aceptando...');
    await acceptAsyncMatchV2(matchId);
    
    // Recargar datos de la partida después de aceptar
    const { data: updatedMatch } = await sb
      .from('async_matches_v2')
      .select('*')
      .eq('id', matchId)
      .single();
    
    if (updatedMatch) {
      Object.assign(match, updatedMatch);
    }
  }
  
  // Verificar que el usuario es parte de la partida
  if (match.player1_id !== me.id && match.player2_id !== me.id) {
    throw new Error('No eres parte de esta partida');
  }
  
  // Verificar que la partida está activa o terminada
  if (match.status !== 'active' && match.status !== 'finished') {
    throw new Error(`La partida no está activa (status: ${match.status})`);
  }
  
  // Verificar si la partida está terminada
  if (match.status === 'finished') {
    console.log('🏁 Partida terminada, mostrando resultados...');
    await showAsyncResultsV2(matchId, me.id);
    return;
  }
  
  // Obtener pregunta actual
  const currentQuestion = await getCurrentQuestionV2(matchId, me.id);
  
  if (currentQuestion === null) {
    // Partida terminada (ambos respondieron todas las preguntas)
    console.log('🏁 Partida terminada (getCurrentQuestionV2 retornó null), mostrando resultados...');
    await showAsyncResultsV2(matchId, me.id);
    return;
  }
  
  // Parsear deck
  let deck;
  if (typeof match.deck === 'string') {
    deck = JSON.parse(match.deck || '[]');
  } else {
    deck = match.deck || [];
  }
  
  const question = deck[currentQuestion];
  
  if (!question) {
    throw new Error(`Pregunta no encontrada en el deck (índice ${currentQuestion}, deck tiene ${deck.length} preguntas)`);
  }
  
  // Verificar si el jugador ya respondió esta pregunta
  const { data: myAnswer } = await sb
    .from('async_answers_v2')
    .select('answer')
    .eq('match_id', matchId)
    .eq('player_id', me.id)
    .eq('question_index', currentQuestion)
    .single();
  
  const alreadyAnswered = !!myAnswer;
  const myAnswerIndex = myAnswer ? parseInt(myAnswer.answer) : null;
  
  console.log('🔍 Verificando si ya respondió:', {
    currentQuestion,
    alreadyAnswered,
    myAnswerIndex,
    answer: myAnswer?.answer
  });
  
  // Configurar estado global
  if (window.STATE) {
    window.STATE.mode = 'async_v2';
    window.STATE.status = alreadyAnswered ? 'waiting_for_opponent_answer' : 'playing';
    window.STATE.category = match.category;
    window.STATE.difficulty = match.difficulty;
    window.STATE.rounds = match.rounds;
    window.STATE.matchId = matchId;
    window.STATE.index = currentQuestion;
    window.STATE.total = match.rounds;
    window.STATE.deck = deck;
    window.STATE.score = 0;
    // Guardar si ya respondió y qué respondió
    window.STATE.alreadyAnswered = alreadyAnswered;
    window.STATE.myAnswerIndex = myAnswerIndex;
  }
  
  // Guardar referencia global (con deck parseado)
  window.currentAsyncMatchId = matchId;
  window.currentAsyncMatch = {
    ...match,
    deck: deck // Asegurar que el deck esté parseado
  };
  window.currentGameMode = 'async_v2';
  
  console.log('🎮 Estado configurado:', {
    mode: window.STATE?.mode,
    index: window.STATE?.index,
    total: window.STATE?.total,
    deckLength: window.STATE?.deck?.length,
    currentQuestion: currentQuestion,
    questionExists: !!question
  });
  
  // Actualizar last_activity_at (jugador entró a la partida)
  await sb
    .from('async_matches_v2')
    .update({ last_activity_at: isoNow() })
    .eq('id', matchId);
  
  // Configurar estilo del botón Exit y mensaje para modo asíncrono
  if (window.updateExitButtonStyle) {
    window.updateExitButtonStyle();
  }
  
  // Iniciar juego
  if (window.startSolo) {
    // startSolo configurará el estado y renderizará la pregunta
    // Si ya respondió, renderQuestion mostrará la respuesta marcada
    window.startSolo();
  } else {
    throw new Error('startSolo no está disponible');
  }
}

// ==========================================
// SUSCRIPCIONES REALTIME (OPCIONAL)
// ==========================================

function setupRealtimeSubscriptions() {
  if (!sb) return;
  
  const channel = sb.channel('async_matches_v2_notifications');
  
  channel
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'async_matches_v2',
      filter: `player1_id=eq.${me.id} OR player2_id=eq.${me.id}`
    }, (payload) => {
      console.log('📡 Cambio en partida:', payload);
      callbacks.onMatchUpdate(payload.new);
    })
    .subscribe();
  
  console.log('📡 Suscripciones Realtime configuradas');
}

// ==========================================
// INTEGRACIÓN CON SISTEMA EXISTENTE
// ==========================================

// Función para guardar respuesta desde solo.js
export async function saveAsyncAnswerV2(currentState, question, isCorrect, selectedAnswer, timeSpent = 0) {
  if (!window.currentAsyncMatchId) {
    console.error('❌ No hay matchId para guardar respuesta');
    return;
  }
  
  // En modo async_v2, el índice ya está en la pregunta correcta (no se incrementa después de renderizar)
  // En otros modos async, el índice se incrementa después de renderizar, así que hay que restar 1
  const questionIndex = currentState.mode === 'async_v2' 
    ? currentState.index  // Índice ya correcto
    : currentState.index - 1;  // Modo async V1: índice ya incrementado
  
  console.log('💾 Guardando respuesta V2:', {
    questionIndex,
    currentIndex: currentState.index,
    total: currentState.total,
    mode: currentState.mode,
    isLastQuestion: questionIndex >= currentState.total - 1
  });
  
  try {
    const result = await answerQuestionV2(
      window.currentAsyncMatchId,
      questionIndex,
      selectedAnswer,
      timeSpent
    );
    
    console.log('✅ Respuesta guardada en sistema V2:', result);
    console.log('🔍 Estado de partida:', {
      matchFinished: result?.matchFinished,
      bothAnswered: result?.bothAnswered,
      questionIndex,
      total: currentState.total
    });
    
    // Si la partida terminó, no hacer nada más (ya se mostraron resultados)
    if (result?.matchFinished) {
      console.log('🏁 Partida terminada, no avanzar a siguiente pregunta');
      // Limpiar estado para evitar que se muestre la siguiente pregunta
      currentState.status = 'finished';
      return;
    }
    
    // Si ambos respondieron y la partida NO terminó, avanzar a siguiente pregunta
    if (result?.bothAnswered && !result?.matchFinished) {
      // Verificar una vez más que no sea la última pregunta antes de avanzar
      const isLastQuestion = questionIndex >= currentState.total - 1;
      
      if (isLastQuestion) {
        console.log('⚠️ Es la última pregunta, no debería avanzar. Verificando estado...');
        // Verificar estado de la partida en la base de datos
        const { data: checkMatch } = await sb
          .from('async_matches_v2')
          .select('status')
          .eq('id', window.currentAsyncMatchId)
          .single();
        
        if (checkMatch?.status === 'finished') {
          console.log('🏁 Partida terminada en DB, mostrando resultados...');
          await showAsyncResultsV2(window.currentAsyncMatchId, me.id);
          return;
        }
      }
      
      console.log('➡️ Ambos respondieron, avanzando a siguiente pregunta...');
      setTimeout(async () => {
        // Verificar una vez más antes de avanzar
        const { data: finalCheck } = await sb
          .from('async_matches_v2')
          .select('status')
          .eq('id', window.currentAsyncMatchId)
          .single();
        
        if (finalCheck?.status === 'finished') {
          console.log('🏁 Partida terminada antes de avanzar, mostrando resultados...');
          await showAsyncResultsV2(window.currentAsyncMatchId, me.id);
          return;
        }
        
        if (window.nextAsyncQuestionV2) {
          await window.nextAsyncQuestionV2();
        }
      }, 600);
    }
  } catch (error) {
    console.error('❌ Error guardando respuesta V2:', error);
  }
}

// Función para avanzar a siguiente pregunta
export async function nextAsyncQuestionV2() {
  if (!window.currentAsyncMatchId) {
    console.error('❌ No hay matchId');
    return;
  }
  
  const currentState = window.STATE;
  if (!currentState || currentState.mode !== 'async_v2') {
    console.error('❌ No hay estado async_v2 válido');
    return;
  }
  
  // Verificar primero si la partida está terminada
  const { data: match } = await sb
    .from('async_matches_v2')
    .select('status, rounds')
    .eq('id', window.currentAsyncMatchId)
    .single();
  
  if (match?.status === 'finished') {
    console.log('🏁 Partida terminada (status=finished), mostrando resultados...');
    await endAsyncGameV2();
    return;
  }
  
  // Obtener siguiente pregunta
  const nextQuestion = await getCurrentQuestionV2(window.currentAsyncMatchId, me.id);
  
  console.log('🔍 Verificando siguiente pregunta:', {
    nextQuestion,
    total: currentState.total,
    rounds: match?.rounds,
    isFinished: nextQuestion === null || nextQuestion >= currentState.total
  });
  
  if (nextQuestion === null || nextQuestion >= currentState.total) {
    // Partida terminada
    console.log('🏁 Partida terminada, todas las preguntas completadas (getCurrentQuestionV2)');
    await endAsyncGameV2();
    return;
  }
  
  // Verificar que el índice no exceda el total
  if (nextQuestion >= currentState.total) {
    console.error('❌ Error: nextQuestion >= total:', { nextQuestion, total: currentState.total });
    await endAsyncGameV2();
    return;
  }
  
  // Validar que el índice no exceda el total ANTES de actualizar
  if (nextQuestion >= currentState.total) {
    console.error('❌ ERROR CRÍTICO: nextQuestion >= total:', {
      nextQuestion,
      total: currentState.total,
      rounds: match?.rounds
    });
    await endAsyncGameV2();
    return;
  }
  
  // Actualizar estado local
  currentState.index = nextQuestion;
  
  // Validar que el índice esté dentro del rango del deck
  const deck = currentState.deck || [];
  if (nextQuestion >= deck.length) {
    console.error('❌ ERROR: nextQuestion >= deck.length:', {
      nextQuestion,
      deckLength: deck.length
    });
    await endAsyncGameV2();
    return;
  }
  
  const question = deck[nextQuestion];
  
  if (question) {
    console.log('➡️ Avanzando a pregunta:', nextQuestion + 1, 'de', currentState.total);
    
    // Actualizar estado: ya no está esperando, está jugando
    currentState.status = 'playing';
    
    // Ocultar mensaje de salir (ya no está esperando al rival)
    const messageEl = document.getElementById('asyncExitMessage');
    if (messageEl) {
      messageEl.style.display = 'none';
    }
    
    // Renderizar pregunta (usar función existente)
    // NO usar nextQuestion() porque incrementa el índice incorrectamente
    if (window.renderQuestion) {
      window.renderQuestion(question);
      // Actualizar HUD y progreso
      if (window.hud) window.hud();
      if (window.setProgress) {
        window.setProgress((nextQuestion + 1) / currentState.total);
      }
    } else {
      console.error('❌ renderQuestion no está disponible');
    }
  } else {
    console.error('❌ Pregunta no encontrada en el deck:', { nextQuestion, deckLength: deck.length });
    // Si no hay pregunta, la partida terminó
    await endAsyncGameV2();
  }
}

// Función para calcular y mostrar resultados de partida async_v2
export async function showAsyncResultsV2(matchId, playerId) {
  if (!sb) throw new Error('Supabase no inicializado');
  
  console.log('📊 Calculando resultados de partida:', matchId);
  
  // Obtener datos de la partida
  const { data: match, error: matchError } = await sb
    .from('async_matches_v2')
    .select('*')
    .eq('id', matchId)
    .single();
  
  if (matchError || !match) {
    console.error('❌ Error obteniendo partida:', matchError);
    return;
  }
  
  // Parsear deck
  let deck;
  if (typeof match.deck === 'string') {
    deck = JSON.parse(match.deck || '[]');
  } else {
    deck = match.deck || [];
  }
  
  // Obtener todas las respuestas del jugador
  const { data: myAnswers, error: myAnswersError } = await sb
    .from('async_answers_v2')
    .select('question_index, answer')
    .eq('match_id', matchId)
    .eq('player_id', playerId)
    .order('question_index', { ascending: true });
  
  if (myAnswersError) {
    console.error('❌ Error obteniendo respuestas del jugador:', myAnswersError);
    return;
  }
  
  // Calcular score del jugador
  let myScore = 0;
  myAnswers?.forEach(answer => {
    const questionIndex = answer.question_index;
    const question = deck[questionIndex];
    if (question) {
      const myAnswerIndex = parseInt(answer.answer);
      // -1 indica timeout, cualquier otro número es la respuesta elegida
      if (myAnswerIndex >= 0 && myAnswerIndex === question.answer) {
        myScore++;
      }
    }
  });
  
  // Obtener todas las respuestas del oponente
  const opponentId = match.player1_id === playerId ? match.player2_id : match.player1_id;
  const { data: opponentAnswers } = await sb
    .from('async_answers_v2')
    .select('question_index, answer')
    .eq('match_id', matchId)
    .eq('player_id', opponentId)
    .order('question_index', { ascending: true });
  
  // Calcular score del oponente
  let opponentScore = 0;
  opponentAnswers?.forEach(answer => {
    const questionIndex = answer.question_index;
    const question = deck[questionIndex];
    if (question) {
      const opponentAnswerIndex = parseInt(answer.answer);
      if (opponentAnswerIndex >= 0 && opponentAnswerIndex === question.answer) {
        opponentScore++;
      }
    }
  });
  
  console.log('📊 Resultados calculados:', {
    myScore,
    opponentScore,
    total: match.rounds
  });
  
  // Determinar título y subtítulo según resultado
  let title, subtitle;
  if (myScore > opponentScore) {
    title = '¡Ganaste!';
    subtitle = `Ganaste ${myScore}-${opponentScore}`;
  } else if (myScore < opponentScore) {
    title = '¡Buen intento!';
    subtitle = `Perdiste ${myScore}-${opponentScore}`;
  } else {
    title = '¡Empate!';
    subtitle = `Empataste ${myScore}-${opponentScore}`;
  }
  
  // Obtener nombre de dificultad para mostrar
  const difficultyNames = {
    'easy': '★',
    'medium': '★★',
    'hard': '★★★',
    'any': '★'
  };
  const difficultyStars = difficultyNames[match.difficulty?.toLowerCase()] || '★';
  const details = `Respondiste correctamente ${myScore}/${match.rounds} en dificultad ${difficultyStars}`;
  
  // Mostrar resultados usando la función existente
  if (window.openSingleResult) {
    window.openSingleResult({
      title,
      subtitle,
      scoreText: `${myScore} / ${match.rounds}`,
      details,
      matchId: match.id,
      opponentId: opponentId,
      rounds: match.rounds,
      category: match.category,
      difficulty: match.difficulty
    });
  } else {
    console.error('❌ openSingleResult no está disponible');
  }
  
  // Limpiar estado
  window.currentAsyncMatchId = null;
  window.currentAsyncMatch = null;
  window.currentGameMode = null;
  
  if (window.STATE) {
    window.STATE.mode = 'idle';
    window.STATE.status = 'idle';
  }
  
  // Ocultar juego
  if (window.showGame) {
    window.showGame(false);
  }
}

// Función para terminar partida
export async function endAsyncGameV2() {
  if (!window.currentAsyncMatchId) {
    return;
  }
  
  // Marcar partida como terminada
  if (sb) {
    await sb
      .from('async_matches_v2')
      .update({
        status: 'finished',
        finished_at: isoNow(),
        last_activity_at: isoNow()
      })
      .eq('id', window.currentAsyncMatchId);
  }
  
  // Calcular y mostrar resultados
  await showAsyncResultsV2(window.currentAsyncMatchId, me.id);
  
  callbacks.onEnd({ matchId: window.currentAsyncMatchId, status: 'finished' });
}

// Exponer funciones globalmente para integración
window.saveAsyncAnswerV2 = saveAsyncAnswerV2;
window.nextAsyncQuestionV2 = nextAsyncQuestionV2;
window.endAsyncGameV2 = endAsyncGameV2;
window.answerQuestionV2 = answerQuestionV2;
window.getCurrentQuestionV2 = getCurrentQuestionV2;
window.showAsyncResultsV2 = showAsyncResultsV2;

// ==========================================
// EXPORTAR CONFIGURACIÓN
// ==========================================

export { ASYNC_CONFIG };

