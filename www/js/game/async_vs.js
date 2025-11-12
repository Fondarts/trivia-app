// js/async_vs.js — VS Asíncrono con 2 horas por pregunta
import { buildDeckSingle } from './bank.js';

const TIMER_PER_QUESTION = 15; // segundos para responder
const ASYNC_TIMEOUT_HOURS = 2; // horas para entrar a la pregunta
const ASYNC_TIMEOUT_MS = ASYNC_TIMEOUT_HOURS * 60 * 60 * 1000;

let sb = null;
let me = { id: null, name: 'Anon', pid: null };


const asyncMatch = {
  id: null,
  status: 'idle', // idle|waiting|playing|finished|timeout
  rounds: 10,
  category: 'all',
  difficulty: 'easy',
  deck: [],
  qIndex: -1,
  players: [], // [{ id, name, pid, isHost }]
  scores: {}, // { pid: { name, correct, totalTime } }
  currentQuestion: null,
  questionStartTime: null,
  questionTimeout: null,
  matchTimeout: null
};

let cb = {
  onStatus: (_)=>{},
  onQuestion: (_)=>{},
  onTimerTick: (_)=>{},
  onEnd: (_)=>{},
  onInvitation: (_)=>{},
  onMatchUpdate: (_)=>{}
};

// ===== Utils
const nowUTCms = () => Date.now();
const isoNow = () => new Date().toISOString();
const genCode = (len) => Math.random().toString(36).substring(2, 2+len).toUpperCase();

// Generar UUID v4 válido
const generateUUID = () => {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback para navegadores sin crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ===== API pública
export function initAsyncVS({ supabase, userId, username, callbacks = {} }){
  sb = supabase;
  
  // Asegurar que tenemos un UUID válido - manejar el caso de "null" string
  let validUserId = userId;
  if (!validUserId || validUserId === 'null' || validUserId === 'undefined') {
    validUserId = generateUUID();
    console.log('🔧 Generando nuevo UUID porque userId no es válido:', { userId, validUserId });
  }
  
  me.id = validUserId;
  me.name = username || 'Anon';
  me.pid = me.id;
  cb = { ...cb, ...callbacks };
  
  console.log('🔧 Async VS inicializado:', { 
    userId: me.id, 
    username: me.name,
    originalUserId: userId,
    isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(me.id)
  });
  
  // Suscribirse a notificaciones de partidas aceptadas
  const channel = sb.channel('async_match_notifications');
  
  channel
    .on('broadcast', { event: 'match_accepted' }, (payload) => {
      console.log('📡 Notificación recibida:', payload);
      
      // Verificar si es para una de nuestras solicitudes
      if (payload.payload && payload.payload.requestId) {
        console.log('🎉 ¡Nuestra partida fue aceptada!', payload.payload);
        
        // Notificar al callback
        cb.onStatus({
          status: 'match_created',
          matchId: payload.payload.matchId,
          opponent: payload.payload.accepterName,
          rounds: payload.payload.rounds,
          category: payload.payload.category,
          difficulty: payload.payload.difficulty
        });
      }
    })
    .on('broadcast', { event: 'question_started' }, (payload) => {
      console.log('📡 Notificación de pregunta recibida:', payload);
      
      // Verificar si es para una de nuestras partidas
      if (payload.payload && payload.payload.matchId) {
        console.log('🎯 ¡El otro jugador entró a la pregunta!', payload.payload);
        
        // Mostrar notificación al usuario
        if (window.toast) {
          window.toast(`¡${payload.payload.playerName} entró a la pregunta ${payload.payload.currentQuestion}!`);
        }
        
        // Notificar al callback
        cb.onQuestion({
          status: 'question_started',
          matchId: payload.payload.matchId,
          currentQuestion: payload.payload.currentQuestion,
          totalQuestions: payload.payload.totalQuestions,
          playerName: payload.payload.playerName
        });
      }
    })
    .on('broadcast', { event: 'answer_submitted' }, (payload) => {
      console.log('📡 Notificación de respuesta recibida:', payload);
      
      // Verificar si es para una de nuestras partidas
      if (payload.payload && payload.payload.matchId) {
        console.log('🎯 ¡El otro jugador respondió!', payload.payload);
        
        // Mostrar notificación al usuario
        if (window.toast) {
          window.toast(`¡${payload.payload.playerName} respondió la pregunta ${payload.payload.questionIndex + 1}!`);
        }
        
        // Verificar si ambos respondieron para avanzar
        checkBothAnswered(payload.payload.matchId, payload.payload.questionIndex);
      }
    })
    .on('broadcast', { event: 'both_answered' }, async (payload) => {
      console.log('📡 Notificación de ambos respondieron:', payload);
      
      // Verificar si es para una de nuestras partidas (puede que no estemos en la partida actualmente)
      const matchId = payload.payload?.match_id || payload.payload?.matchId;
      
      if (matchId) {
        // Verificar si esta partida es nuestra
        const { data: match } = await sb
          .from('async_matches')
          .select('player1_id, player2_id')
          .eq('id', matchId)
          .single();
        
        const currentUserId = me?.id || window.currentUser?.id;
        const isMyMatch = match && (match.player1_id === currentUserId || match.player2_id === currentUserId);
        
        if (isMyMatch) {
          console.log('🎉 ¡Ambos respondieron! Nueva pregunta disponible...', payload.payload);
          
          // Mostrar notificación al usuario
          if (window.toast) {
            window.toast(`¡Ambos respondieron! Pregunta ${(payload.payload.nextQuestion || payload.payload.questionIndex) + 1} disponible`);
          }
          
          // Invalidar caché de partidas abiertas
          if (window.asyncMatchesCache && currentUserId) {
            window.asyncMatchesCache.invalidate(currentUserId);
          }
          
          // Si estamos en la partida actualmente, avanzar automáticamente
          if (window.currentAsyncMatchId === matchId && window.nextAsyncQuestion) {
            console.log('➡️ Avanzando automáticamente (jugador en partida)');
            setTimeout(() => {
              window.nextAsyncQuestion();
            }, 2000); // Esperar 2 segundos para que vean el mensaje
          } else {
            console.log('ℹ️ Jugador no está en partida actualmente, verá nueva pregunta al entrar');
          }
        }
      }
    })
    .subscribe();
  
  console.log('📡 Suscrito a notificaciones de partidas asíncronas');
  
  // El polling automático se eliminó - ahora se usa el botón "Unirse" para cargar partidas
  
  // Hacer disponible globalmente
  window.asyncMatch = asyncMatch;
  window.startAsyncRandomSearch = startAsyncRandomSearch;
  window.acceptAsyncInvitation = acceptAsyncInvitation;
  window.rejectAsyncInvitation = rejectAsyncInvitation;
  window.getAsyncInvitations = getAsyncInvitations;
  window.answerAsyncQuestion = answerAsyncQuestion;
  window.getAsyncMatchStatus = getAsyncMatchStatus;
  window.getPendingRequests = getPendingRequests;
  window.acceptRandomRequest = acceptRandomRequest;
  window.startAsyncGame = startAsyncGame;
  window.loadAsyncMatches = loadAsyncMatches;
  window.displayAsyncMatches = displayAsyncMatches;
  window.joinAsyncMatch = joinAsyncMatch;
  window.checkBothAnswered = checkBothAnswered;
  window.nextAsyncQuestion = nextAsyncQuestion;
  window.endAsyncGame = endAsyncGame;
}

// ===== Funciones para avance automático de preguntas
async function nextAsyncQuestion() {
  console.log('🔄 nextAsyncQuestion llamado');
  
  const currentState = window.STATE || STATE;
  if (!currentState || currentState.mode !== 'async') {
    console.error('❌ No hay estado async válido');
    return;
  }
  
  // Limpiar el set de respuestas para la nueva pregunta
  if (window.asyncAnsweredSet) {
    window.asyncAnsweredSet.clear();
    console.log('🧹 Set de respuestas limpiado para nueva pregunta');
  }
  
  // Incrementar índice de pregunta
  currentState.index++;
  
  // CORRECCIÓN: NO actualizar current_question aquí
  // El progreso se calcula dinámicamente desde async_answers
  // Solo actualizar si es necesario para compatibilidad con código legacy
  // NOTA: El avance real se hace en checkBothAnswered() usando advance_async_question()
  // que ya actualiza current_question cuando ambos responden
  console.log('💾 Progreso local actualizado (no se actualiza current_question en BD aquí):', {
    matchId: window.currentAsyncMatchId,
    currentQuestion: currentState.index,
    note: 'El progreso se calcula desde async_answers, no desde current_question'
  });
  
  console.log('📊 Estado actualizado:', {
    index: currentState.index,
    total: currentState.total,
    mode: currentState.mode
  });
  
  // Verificar si hay más preguntas
  if (currentState.index >= currentState.total) {
    console.log('🏁 No hay más preguntas, terminando partida');
    await endAsyncGame();
    return;
  }
  
  // Renderizar siguiente pregunta
  const question = currentState.deck[currentState.index];
  if (question) {
    console.log('❓ Renderizando pregunta:', currentState.index + 1);
    renderQuestion(question);
  } else {
    console.error('❌ No se encontró la pregunta en el índice:', currentState.index);
  }
}

async function endAsyncGame() {
  console.log('🏁 endAsyncGame llamado');
  
  const currentState = window.STATE || STATE;
  if (!currentState || currentState.mode !== 'async') {
    console.error('❌ No hay estado async válido');
    return;
  }
  
  // Mostrar resultados finales
  console.log('📊 Resultados finales:', {
    score: currentState.score,
    total: currentState.total,
    percentage: Math.round((currentState.score / currentState.total) * 100)
  });
  
  // Marcar partida como terminada en la base de datos
  if (window.currentAsyncMatchId && sb) {
    try {
      await sb
        .from('async_matches')
        .update({ 
          status: 'finished',
          finished_at: isoNow()
        })
        .eq('id', window.currentAsyncMatchId);
      
      console.log('💾 Partida marcada como terminada en BD:', window.currentAsyncMatchId);
    } catch (error) {
      console.error('❌ Error marcando partida como terminada:', error);
    }
  }
  
  // Limpiar estado
  currentState.mode = 'idle';
  currentState.status = 'idle';
  currentState.index = 0;
  currentState.score = 0;
  currentState.deck = [];
  currentState.matchId = null;
  
  // Limpiar variables globales
  window.currentAsyncMatchId = null;
  window.currentGameMode = null;
  window.currentAsyncMatch = null;
  
  // Mostrar menú principal
  showConfigUI();
  setStatus('Listo', false);
  
  console.log('✅ Partida asíncrona terminada');
}

// ===== Verificar si ambos jugadores respondieron
async function checkBothAnswered(matchId, questionIndex) {
  console.log('🔍 checkBothAnswered llamado:', { matchId, questionIndex });
  
  if (!sb) {
    console.error('❌ Supabase no disponible');
    return;
  }
  
  try {
    // Obtener todas las respuestas para esta pregunta
    const { data: answers, error } = await sb
      .from('async_answers')
      .select('player_id')
      .eq('match_id', matchId)
      .eq('question_index', questionIndex);
    
    if (error) {
      console.error('Error verificando respuestas:', error);
      return;
    }
    
    // Obtener los IDs de los jugadores de la partida
    const { data: match, error: matchError } = await sb
      .from('async_matches')
      .select('player1_id, player2_id')
      .eq('id', matchId)
      .single();
    
    if (matchError) {
      console.error('Error obteniendo datos de la partida:', matchError);
      return;
    }
    
    const playerIds = [match.player1_id, match.player2_id];
    const answeredPlayerIds = answers.map(a => a.player_id);
    
    console.log('🔍 Verificación de respuestas:', {
      playerIds,
      answeredPlayerIds,
      bothAnswered: playerIds.every(playerId => answeredPlayerIds.includes(playerId))
    });
    
    // Verificar si ambos jugadores respondieron
    const bothAnswered = playerIds.every(playerId => answeredPlayerIds.includes(playerId));
    
    if (bothAnswered) {
      console.log('🎉 ¡Ambos jugadores respondieron! Avanzando a la siguiente pregunta...');
      
      // Notificar que ambos respondieron
      await sb
        .channel('async_match_notifications')
        .send({
          type: 'broadcast',
          event: 'both_answered',
          payload: {
            matchId: matchId,
            questionIndex: questionIndex,
            nextQuestion: questionIndex + 1
          }
        });
      
      // CORRECCIÓN: Usar función RPC para avanzar pregunta y resetear campos
      const nextQuestionIndex = questionIndex + 1;
      
      // Verificar si hay más preguntas
      if (nextQuestionIndex >= (window.STATE?.total || match.rounds)) {
        console.log('🏁 ¡Partida terminada!');
        await endAsyncGame();
        return;
      }
      
      // Llamar función RPC que actualiza BD y resetea campos
      try {
        const { error: rpcError } = await sb.rpc('advance_async_question', {
          p_match_id: matchId,
          p_next_question: nextQuestionIndex
        });
        
        if (rpcError) {
          console.warn('⚠️ Función RPC no disponible, usando UPDATE directo:', rpcError);
          // Fallback: actualizar manualmente
          await sb
            .from('async_matches')
            .update({ 
              current_question: nextQuestionIndex,
              player1_answered_current: FALSE,
              player2_answered_current: FALSE,
              current_turn_player_id: NULL,
              question_start_time: new Date().toISOString(),
              status: 'question_active',
              updated_at: new Date().toISOString()
            })
            .eq('id', matchId);
        } else {
          console.log('✅ Pregunta avanzada correctamente usando RPC');
        }
      } catch (error) {
        console.error('❌ Error avanzando pregunta:', error);
      }
      
      // Avanzar SOLO para el jugador que está actualmente en la partida
      if (window.currentAsyncMatchId === matchId) {
        console.log('➡️ Avanzando a la siguiente pregunta para jugador actual...');
        setTimeout(async () => {
          console.log('🔄 Llamando a nextAsyncQuestion...');
          await nextAsyncQuestion();
        }, 1000);
      }
      
      // NOTA: El otro jugador recibirá notificación Realtime y actualizará cuando entre de nuevo
    }
    
  } catch (error) {
    console.error('Error en checkBothAnswered:', error);
  }
}

// ===== Notificar que un jugador entró a una pregunta
async function notifyQuestionStarted(matchId, matchData) {
  if (!sb) return;
  
  console.log('📡 Notificando que el jugador entró a la pregunta:', matchId);
  
  try {
    // Determinar quién es el otro jugador
    const otherPlayerId = matchData.player1_id === me.id ? matchData.player2_id : matchData.player1_id;
    const otherPlayerName = matchData.player1_id === me.id ? matchData.player2_name : matchData.player1_name;
    
    // Enviar notificación via Realtime
    await sb
      .channel('async_match_notifications')
      .send({
        type: 'broadcast',
        event: 'question_started',
        payload: {
          matchId: matchId,
          currentQuestion: matchData.current_question + 1,
          totalQuestions: matchData.rounds,
          playerName: me.name,
          otherPlayerId: otherPlayerId,
          otherPlayerName: otherPlayerName
        }
      });
    
    console.log('📡 Notificación de pregunta enviada');
  } catch (error) {
    console.error('Error enviando notificación de pregunta:', error);
  }
}

// ===== Iniciar juego asíncrono
async function startAsyncGame(matchId) {
  console.log('🎮 Iniciando juego asíncrono:', matchId);
  
  // Verificar qué funciones de juego están disponibles
  console.log('🔍 Funciones disponibles:', {
    startGame: typeof window.startGame,
    startVS: typeof window.startVS,
    startSolo: typeof window.startSolo,
    game: typeof window.game
  });
  
  // Intentar diferentes formas de iniciar el juego
  if (window.startGame) {
    console.log('🎮 Llamando a startGame con modo asíncrono');
    window.startGame({
      mode: 'async',
      matchId: matchId
    });
  } else if (window.startVS) {
    console.log('🎮 Llamando a startVS con modo asíncrono');
    window.startVS({
      mode: 'async',
      matchId: matchId
    });
  } else if (window.game && window.game.start) {
    console.log('🎮 Llamando a game.start con modo asíncrono');
    window.game.start({
      mode: 'async',
      matchId: matchId
    });
  } else {
    console.log('🎮 Iniciando juego asíncrono directamente...');
    
    // Iniciar el juego asíncrono directamente
    try {
      // Ocultar el menú principal y mostrar el juego
      const mainMenu = document.getElementById('mainMenu');
      const gameSection = document.getElementById('gameSection');
      
      if (mainMenu) mainMenu.style.display = 'none';
      if (gameSection) gameSection.style.display = 'block';
      
      // Configurar el juego asíncrono
      console.log('🎮 Configurando juego asíncrono...');
      
      // Configurar el estado del juego asíncrono
      if (window.startSolo) {
        console.log('🎮 Configurando juego asíncrono...');
        
        // Obtener datos de la partida asíncrona
        const { data: matchData, error: matchError } = await sb
          .from('async_matches')
          .select('*')
          .eq('id', matchId)
          .single();
        
        if (matchError) {
          console.error('❌ Error obteniendo datos de la partida:', matchError);
          throw new Error('No se pudieron obtener los datos de la partida');
        }
        
        console.log('🎮 Datos de la partida:', matchData);
        
        // CORRECCIÓN: Determinar qué pregunta debe ver este jugador
        // No usar current_question directamente, sino calcular según respuestas
        const currentUserId = me?.id || window.currentUser?.id;
        if (!currentUserId) {
          console.error('❌ No se pudo obtener ID del usuario actual');
          throw new Error('Usuario no identificado');
        }
        
        // Intentar usar función RPC para obtener pregunta correcta
        let questionToShow = matchData.current_question || 0;
        try {
          const { data: rpcQuestion, error: rpcError } = await sb.rpc('get_current_question_for_player', {
            p_match_id: matchId,
            p_player_id: currentUserId
          });
          
          if (!rpcError && rpcQuestion !== null) {
            questionToShow = rpcQuestion;
            console.log('✅ Pregunta determinada por RPC:', questionToShow);
          } else {
            // Fallback: calcular manualmente
            console.log('⚠️ RPC no disponible, calculando pregunta manualmente...');
            
            // Obtener todas las respuestas del jugador actual
            const { data: myAnswers } = await sb
              .from('async_answers')
              .select('question_index')
              .eq('match_id', matchId)
              .eq('player_id', currentUserId)
              .order('question_index', { ascending: true });
            
            if (myAnswers && myAnswers.length > 0) {
              // Encontrar la primera pregunta que NO respondió
              const answeredIndices = new Set(myAnswers.map(a => a.question_index));
              questionToShow = matchData.rounds; // Por defecto, asumir que terminó
              
              for (let i = 0; i < matchData.rounds; i++) {
                if (!answeredIndices.has(i)) {
                  questionToShow = i;
                  break;
                }
              }
            } else {
              // No ha respondido ninguna, empezar desde la primera disponible
              // Verificar hasta qué pregunta ambos jugadores respondieron
              let maxCompleted = -1;
              for (let i = 0; i < matchData.rounds; i++) {
                const { data: answers } = await sb
                  .from('async_answers')
                  .select('player_id')
                  .eq('match_id', matchId)
                  .eq('question_index', i);
                
                if (answers) {
                  const player1Answered = answers.some(a => a.player_id === matchData.player1_id);
                  const player2Answered = answers.some(a => a.player_id === matchData.player2_id);
                  
                  if (player1Answered && player2Answered) {
                    maxCompleted = i;
                  } else {
                    break; // Encontramos una pregunta no completada
                  }
                }
              }
              
              questionToShow = maxCompleted + 1;
            }
            
            console.log('✅ Pregunta calculada manualmente:', questionToShow);
          }
        } catch (error) {
          console.warn('⚠️ Error calculando pregunta, usando current_question de BD:', error);
          questionToShow = matchData.current_question || 0;
        }
        
        // Verificar si la partida ya terminó
        if (questionToShow >= matchData.rounds) {
          console.log('🏁 Partida ya terminada');
          if (window.toast) {
            window.toast('Esta partida ya terminó');
          }
          return; // No iniciar juego
        }
        
        // Configurar el estado global para el juego asíncrono
        window.currentAsyncMatchId = matchId;
        window.currentGameMode = 'async';
        window.currentAsyncMatch = matchData;
        
        // Configurar el estado del juego
        if (window.STATE) {
          window.STATE.mode = 'async';
          window.STATE.status = 'waiting_for_opponent_answer'; // Estado por defecto para partidas asíncronas
          window.STATE.category = matchData.category;
          window.STATE.difficulty = matchData.difficulty;
          window.STATE.rounds = matchData.rounds;
          window.STATE.matchId = matchId;
          
          // CORRECCIÓN: Usar pregunta calculada, no current_question de BD
          window.STATE.index = questionToShow;
          window.STATE.total = matchData.rounds;
          window.STATE.score = 0; // Resetear score local
          
          console.log('🎮 Estado configurado con progreso:', {
            mode: window.STATE.mode,
            status: window.STATE.status,
            category: window.STATE.category,
            difficulty: window.STATE.difficulty,
            rounds: window.STATE.rounds,
            currentQuestion: window.STATE.index,
            totalQuestions: window.STATE.total,
            note: 'Pregunta calculada según respuestas del jugador, no current_question de BD'
          });
          
          // Actualizar el estilo del botón Exit para modo asíncrono
          if (window.updateExitButtonStyle) {
            window.updateExitButtonStyle();
          }
          
          // Mostrar mensaje informativo para partidas asíncronas
          if (window.showAsyncExitMessage) {
            window.showAsyncExitMessage();
          }
        }
        
        // Notificar que el jugador entró a la pregunta
        await notifyQuestionStarted(matchId, matchData);
        
        // Iniciar el juego
        console.log('🎮 Iniciando startSolo...');
        window.startSolo();
      } else {
        console.error('❌ startSolo no está disponible');
        throw new Error('No se puede iniciar el juego');
      }
      
      // Mostrar mensaje al usuario
      if (window.toast) {
        window.toast('¡Partida asíncrona iniciada!');
      }
      
    } catch (error) {
      console.error('❌ Error iniciando juego asíncrono:', error);
      if (window.toast) {
        window.toast('Error al iniciar la partida');
      }
    }
  }
}

// Función de test para simular partidas de otros usuarios
window.testAsyncMatches = () => {
  console.log('🧪 Test: Simulando partidas de otros usuarios...');
  const testMatches = [
    {
      id: 'test-1',
      requester_id: 'other-user-1',
      requester_name: 'Jugador Test 1',
      rounds: 15,
      category: 'movies',
      difficulty: 'easy',
      created_at: new Date().toISOString(),
      status: 'pending'
    },
    {
      id: 'test-2',
      requester_id: 'other-user-2',
      requester_name: 'Jugador Test 2',
      rounds: 10,
      category: 'science',
      difficulty: 'medium',
      created_at: new Date().toISOString(),
      status: 'pending'
    }
  ];
  displayAsyncMatches(testMatches);
};

// ===== Ver solicitudes pendientes
export async function getPendingRequests(){
  if (!sb) throw new Error('Supabase no inicializado');
  
  console.log('🔍 Buscando solicitudes pendientes...');
  
  const { data: requests, error } = await sb
    .from('async_match_requests')
    .select(`
      id,
      requester_id,
      requester_name,
      rounds,
      category,
      difficulty,
      created_at,
      status
    `)
    .eq('status', 'pending')
    .neq('requester_id', me.id)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Error buscando solicitudes:', error);
    throw error;
  }
  
  console.log('📋 Solicitudes encontradas:', requests?.length || 0);
  return requests || [];
}


// ===== Limpiar partidas antiguas (más de 24 horas)
export async function cleanupOldMatches(){
  if (!sb) {
    console.log('⚠️ Supabase no inicializado - no se puede limpiar');
    return;
  }
  
  console.log('🧹 Limpiando partidas antiguas (más de 24 horas)...');
  
  const now = Date.now();
  const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
  
  console.log('🧹 Timestamp actual:', now);
  console.log('🧹 Timestamp límite (24h atrás):', twentyFourHoursAgo);
  console.log('🧹 Fecha actual:', new Date(now).toISOString());
  console.log('🧹 Fecha límite:', new Date(twentyFourHoursAgo).toISOString());
  
  try {
    // USAR LA MISMA LÓGICA QUE LA UI PARA OBTENER PARTIDAS
    console.log('🔍 Usando la misma lógica que la UI...');
    
    // Obtener todas las partidas (sin filtros)
    const { data: allMatches, error: allError } = await sb
      .from('async_match_requests')
      .select('*');
    
    if (allError) {
      console.error('❌ Error obteniendo todas las partidas:', allError);
      return;
    }
    
    console.log('🧹 Todas las partidas (raw):', allMatches?.length || 0);
    
    // Filtrar partidas que NO están completadas (eliminar todas las activas/abiertas)
    const activeMatches = allMatches?.filter(match => 
      match.status !== 'completed' && 
      match.status !== 'finished' && 
      match.status !== 'cancelled'
    ) || [];
    console.log('🧹 Partidas activas/abiertas encontradas:', activeMatches.length);
    
    // Mostrar todos los status únicos para debug
    const uniqueStatuses = [...new Set(allMatches?.map(match => match.status) || [])];
    console.log('🧹 Status únicos encontrados:', uniqueStatuses);
    
    // ELIMINAR TODAS LAS PARTIDAS ACTIVAS/ABIERTAS
    console.log('🚨 MODO AGRESIVO: Eliminando TODAS las partidas activas/abiertas...');
    
    if (activeMatches.length > 0) {
      let deletedCount = 0;
      for (const match of activeMatches) {
        const matchTimestamp = new Date(match.created_at).getTime();
        const hoursOld = Math.floor((now - matchTimestamp) / (1000 * 60 * 60));
        
        console.log(`🧹 Eliminando partida ${match.id}:`, {
          created_at: match.created_at,
          hoursOld: hoursOld,
          requester_name: match.requester_name,
          status: match.status
        });
        
        const { error: deleteError } = await sb
          .from('async_match_requests')
          .delete()
          .eq('id', match.id);
        
        if (deleteError) {
          console.error(`❌ Error eliminando partida ${match.id}:`, deleteError);
        } else {
          deletedCount++;
          console.log(`✅ Eliminada partida ${match.id} (${match.requester_name}) - ${hoursOld}h antigüedad`);
        }
      }
      
      console.log(`✅ ELIMINADAS ${deletedCount} de ${activeMatches.length} partidas activas/abiertas`);
    } else {
      console.log('✅ No hay partidas activas/abiertas para limpiar');
    }
  } catch (error) {
    console.error('❌ Error en limpieza de partidas:', error);
  }
}

// ===== Cargar partidas asíncronas disponibles
export async function loadAsyncMatches(){
  if (!sb) {
    console.log('⚠️ Supabase no inicializado - retornando array vacío');
    return [];
  }
  
  // OPTIMIZACIÓN: Eliminado cleanupOldMatches() aquí - debería ejecutarse en un cron job
  // OPTIMIZACIÓN: Eliminadas todas las consultas de debug en producción
  
  console.log('🔍 Cargando partidas asíncronas disponibles...');
  
  // Query optimizada: una sola consulta con filtros en BD (no en frontend)
  const { data: allMatches, error: allError } = await sb
    .from('async_match_requests')
    .select('id, requester_id, requester_name, rounds, category, difficulty, created_at, status')
    .eq('status', 'pending')
    .neq('requester_id', me.id) // Filtrar en BD, no en frontend
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (allError) {
    console.error('Error cargando partidas:', allError);
    throw allError;
  }
  
  const matches = allMatches || [];
  console.log('📋 Partidas disponibles:', matches.length);
  
  // Si no hay partidas, mensaje útil
  if (matches.length === 0) {
    console.log('ℹ️ No hay partidas disponibles. Crea una partida y espera que alguien se una.');
  }
  
  return matches;
}

// ===== Mostrar lista de partidas en UI
export function displayAsyncMatches(matches){
  console.log('🎨 displayAsyncMatches ejecutado con:', matches);
  
  const container = document.getElementById('asyncMatchesContainer');
  const listContainer = document.getElementById('asyncMatchesList');
  
  console.log('🎨 Elementos encontrados:', {
    container: !!container,
    listContainer: !!listContainer
  });
  
  if (!container || !listContainer) {
    console.error('Contenedores de partidas no encontrados');
    return;
  }
  
  // Limpiar contenedor
  container.innerHTML = '';
  
  if (matches.length === 0) {
    console.log('📭 No hay partidas, mostrando mensaje');
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #ccc;">
        <p>No hay partidas disponibles</p>
        <p style="font-size: 0.9em; margin-top: 10px;">
          Pide a un amigo que cree una partida con "Random Offline"
        </p>
      </div>
    `;
    listContainer.style.display = 'block';
    return;
  }
  
  // Mostrar lista
  console.log('📋 Mostrando lista con', matches.length, 'partidas');
  listContainer.style.display = 'block';
  
  matches.forEach((match, index) => {
    const matchElement = document.createElement('div');
    matchElement.className = 'match-item';
    matchElement.dataset.matchId = match.id;
    
    // Traducir categoría
    const categoryNames = {
      'all': 'Todas las categorías',
      'movies': 'Películas',
      'science': 'Ciencia',
      'sports': 'Deportes',
      'geography': 'Geografía',
      'history': 'Historia',
      'anime': 'Anime'
    };
    
    const categoryName = categoryNames[match.category] || match.category;
    
    // Calcular tiempo restante
    const createdAt = new Date(match.created_at);
    const now = new Date();
    const timeDiff = now - createdAt;
    const hoursRemaining = Math.max(0, 24 - Math.floor(timeDiff / (1000 * 60 * 60)));
    const minutesRemaining = Math.max(0, 60 - Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)));
    
    let timeRemainingText = '';
    if (hoursRemaining > 0) {
      timeRemainingText = `Cierra en ${hoursRemaining}h ${minutesRemaining}m`;
    } else if (minutesRemaining > 0) {
      timeRemainingText = `Cierra en ${minutesRemaining}m`;
    } else {
      timeRemainingText = 'Cierra pronto';
    }
    
    matchElement.innerHTML = `
      <div class="match-info">
        <div class="match-category">${categoryName}</div>
        <div class="match-details">${match.rounds} preguntas • ${match.difficulty}</div>
        <div class="match-time" style="font-size: 0.8em; color: #888; margin-top: 2px;">${timeRemainingText}</div>
      </div>
      <button class="match-join" data-match-id="${match.id}">Unirse</button>
    `;
    
    // Agregar evento de clic
    matchElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('match-join')) {
        e.stopPropagation();
        joinAsyncMatch(match.id);
      } else {
        joinAsyncMatch(match.id);
      }
    });
    
    container.appendChild(matchElement);
  });
}

// ===== Unirse a partida asíncrona
export async function joinAsyncMatch(matchId){
  if (!sb) throw new Error('Supabase no inicializado');
  
  console.log('🎮 Uniéndose a partida asíncrona:', matchId);
  
  try {
    const result = await acceptRandomRequest(matchId);
    
    if (result.status === 'match_created') {
      // Ocultar lista de partidas
      const listContainer = document.getElementById('asyncMatchesList');
      if (listContainer) {
        listContainer.style.display = 'none';
      }
      
      // Mostrar información de la partida
      const vsCodeBadge = document.getElementById('vsCodeBadge');
      if (vsCodeBadge) {
        vsCodeBadge.textContent = `Partida: ${result.matchId}`;
      }
      
      if (window.toast) {
        window.toast(`¡Te uniste a la partida contra ${result.opponent}!`);
      }
      
      return result;
    }
  } catch (error) {
    console.error('Error uniéndose a partida:', error);
    if (window.toast) {
      window.toast('Error al unirse a la partida');
    }
    throw error;
  }
}

// ===== Aceptar solicitud random
export async function acceptRandomRequest(requestId){
  if (!sb) throw new Error('Supabase no inicializado');
  
  console.log('✅ Aceptando solicitud:', requestId);
  
  // Debug: verificar el estado actual de la partida
  console.log('🔍 Verificando estado actual de la partida...');
  const { data: currentRequest, error: currentError } = await sb
    .from('async_match_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  
  console.log('🔍 Estado actual:', currentRequest);
  console.log('🔍 Error al obtener estado:', currentError);
  
  if (currentError) {
    throw new Error(`Error obteniendo estado de la partida: ${currentError.message}`);
  }
  
  if (!currentRequest) {
    throw new Error('Partida no encontrada');
  }
  
  console.log('🔍 Estado de la partida:', currentRequest.status);
  console.log('🔍 Requester ID:', currentRequest.requester_id);
  console.log('🔍 Accepter ID:', currentRequest.accepter_id);
  console.log('🔍 Mi ID actual:', me.id);
  console.log('🔍 Mi ID es válido:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(me.id));
  
  if (currentRequest.status !== 'pending') {
    throw new Error(`La partida ya no está pendiente. Estado actual: ${currentRequest.status}`);
  }
  
  if (currentRequest.accepter_id) {
    throw new Error(`La partida ya fue aceptada por: ${currentRequest.accepter_name || currentRequest.accepter_id}`);
  }
  
  // Validar que me.id sea un UUID válido antes de continuar
  if (!me.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(me.id)) {
    console.error('❌ me.id no es válido:', me.id);
    me.id = generateUUID();
    console.log('🔧 Generando nuevo UUID para me.id:', me.id);
  }
  
  console.log('🔍 Intentando actualizar partida...');
  console.log('🔍 Usando me.id:', me.id);
  
  // Usar una transacción atómica para evitar condiciones de carrera
  console.log('🔍 Intentando actualizar partida con transacción atómica...');
  
  // Intentar actualizar directamente - simplificar filtros para debug
  console.log('🔍 Intentando UPDATE simplificado...');
  const { data: updateResult, error: updateError } = await sb
    .from('async_match_requests')
    .update({
      status: 'accepted',
      accepter_id: me.id,
      accepter_name: me.name,
      accepted_at: isoNow()
    })
    .eq('id', requestId)
    .select();
  
  console.log('🔍 Resultado del update:', updateResult);
  console.log('🔍 Error del update:', updateError);
  
  if (updateError) {
    console.error('Error aceptando solicitud:', updateError);
    console.error('🔍 Detalles del error:', {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint
    });
    throw updateError;
  }
  
  if (!updateResult || updateResult.length === 0) {
    // Verificar el estado actual de la partida después del UPDATE fallido
    console.log('🔍 UPDATE falló - verificando estado actual de la partida...');
    const { data: postUpdateCheck, error: postUpdateError } = await sb
      .from('async_match_requests')
      .select('id, status, accepter_id, accepter_name')
      .eq('id', requestId)
      .single();
    
    console.log('🔍 Estado después del UPDATE fallido:', postUpdateCheck);
    console.log('🔍 Error en post-check:', postUpdateError);
    
    if (postUpdateCheck) {
      if (postUpdateCheck.status !== 'pending') {
        throw new Error(`La partida cambió de estado. Estado actual: ${postUpdateCheck.status}`);
      }
      if (postUpdateCheck.accepter_id) {
        throw new Error(`La partida ya fue aceptada por: ${postUpdateCheck.accepter_name || postUpdateCheck.accepter_id}`);
      }
    }
    
    throw new Error('No se pudo actualizar la partida. Puede que ya haya sido aceptada por otro usuario.');
  }
  
  const updatedRequest = updateResult[0];
  
  if (!updatedRequest) {
    throw new Error('Solicitud no encontrada o ya fue aceptada');
  }
  
  console.log('✅ Solicitud aceptada:', updatedRequest);
  
  // Crear la partida asíncrona
  const matchId = generateUUID();
  
  // Generar el deck de preguntas una sola vez
  console.log('🎲 Generando deck compartido...');
  const sharedDeck = buildDeckSingle(updatedRequest.category, updatedRequest.rounds, updatedRequest.difficulty);
  console.log('🎲 Deck generado:', sharedDeck.length, 'preguntas');
  
  const { data: match, error: matchError } = await sb
    .from('async_matches')
    .insert({
      id: matchId,
      request_id: requestId,
      player1_id: updatedRequest.requester_id,
      player1_name: updatedRequest.requester_name,
      player2_id: me.id,
      player2_name: me.name || 'Jugador',
      rounds: updatedRequest.rounds,
      category: updatedRequest.category,
      difficulty: updatedRequest.difficulty,
      current_question: 0,
      status: 'active',
      deck: sharedDeck, // Guardar el deck en la base de datos
      created_at: isoNow()
    })
    .select()
    .single();
  
  if (matchError) {
    console.error('Error creando partida:', matchError);
    throw matchError;
  }
  
  console.log('🎮 Partida creada:', match);
  
  // Eliminar la solicitud de async_match_requests ya que fue aceptada y se creó la partida
  try {
    const { error: deleteError } = await sb
      .from('async_match_requests')
      .delete()
      .eq('id', requestId);
    
    if (deleteError) {
      console.error('⚠️ Error eliminando solicitud aceptada:', deleteError);
    } else {
      console.log('✅ Solicitud eliminada de async_match_requests (fue aceptada)');
    }
  } catch (error) {
    console.error('⚠️ Error eliminando solicitud:', error);
  }
  
  // Notificar al creador de la partida via Realtime
  try {
    await sb
      .channel('async_match_notifications')
      .send({
        type: 'broadcast',
        event: 'match_accepted',
        payload: {
          requestId: requestId,
          matchId: match.id,
          accepterName: me.name,
          accepterId: me.id,
          requesterId: updatedRequest.requester_id,
          rounds: updatedRequest.rounds,
          category: updatedRequest.category,
          difficulty: updatedRequest.difficulty
        }
      });
    console.log('📡 Notificación enviada al creador');
    
    // También crear una notificación en la tabla de notificaciones si existe
    try {
      await sb
        .from('notifications')
        .insert({
          user_id: updatedRequest.requester_id,
          type: 'match_accepted',
          title: '¡Partida Aceptada!',
          message: `${me.name || 'Un jugador'} aceptó tu partida de ${updatedRequest.rounds} preguntas`,
          data: {
            matchId: match.id,
            accepterId: me.id,
            accepterName: me.name
          },
          created_at: isoNow()
        });
      console.log('✅ Notificación guardada en base de datos');
    } catch (notifError) {
      console.log('ℹ️ Tabla notifications no disponible o error:', notifError);
      // No es crítico si no existe la tabla de notificaciones
    }
  } catch (error) {
    console.error('Error enviando notificación:', error);
  }
  
  // Notificar callbacks
  cb.onStatus({ 
    status: 'match_created', 
    matchId: match.id,
    opponent: updatedRequest.requester_name,
    rounds: updatedRequest.rounds,
    category: updatedRequest.category,
    difficulty: updatedRequest.difficulty
  });
  
  // Invalidar caché de partidas abiertas para ambos jugadores
  if (window.asyncMatchesCache) {
    window.asyncMatchesCache.invalidate(updatedRequest.requester_id);
    window.asyncMatchesCache.invalidate(me.id);
    console.log('📦 Caché invalidado para ambos jugadores');
  }
  
  // Iniciar automáticamente el juego para quien acepta
  console.log('🎮 Iniciando juego automáticamente para quien acepta...');
  setTimeout(() => {
    if (window.startAsyncGame) {
      window.startAsyncGame(match.id).catch(error => {
        console.error('❌ Error iniciando juego automático:', error);
      });
    }
  }, 1000);
  
  return {
    status: 'match_created',
    matchId: match.id,
    opponent: updatedRequest.requester_name,
    rounds: updatedRequest.rounds,
    category: updatedRequest.category,
    difficulty: updatedRequest.difficulty
  };
}

// ===== Búsqueda random asíncrona
export async function startAsyncRandomSearch({ rounds=10, category='all', difficulty='easy' } = {}){
  if (!sb) throw new Error('Supabase no inicializado');
  
  console.log('🔍 Iniciando búsqueda asíncrona random...', { 
    rounds, 
    category, 
    difficulty, 
    userId: me.id,
    isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(me.id)
  });
  
  // Verificar que tenemos un UUID válido
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(me.id)) {
    console.error('❌ ID de usuario no es un UUID válido:', me.id);
    throw new Error('ID de usuario no es un UUID válido');
  }
  
  // Buscar jugadores aleatorios disponibles para partidas asíncronas
  const { data: availablePlayers, error } = await sb
    .from('async_match_requests')
    .select(`
      id,
      requester_id,
      requester_name,
      rounds,
      category,
      difficulty,
      created_at,
      status
    `)
    .eq('status', 'pending')
    .neq('requester_id', me.id)
    .eq('rounds', rounds)
    .eq('category', category)
    .eq('difficulty', difficulty)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error buscando jugadores:', error);
    console.error('Query details:', { 
      table: 'async_match_requests',
      status: 'pending',
      requester_id: me.id,
      rounds,
      category,
      difficulty
    });
    throw error;
  }
  
  if (availablePlayers && availablePlayers.length > 0) {
    // Encontrar jugador aleatorio
    const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    console.log('🎯 Jugador encontrado:', randomPlayer);
    
    // Aceptar automáticamente la solicitud
    return await acceptAsyncInvitation(randomPlayer.id);
  } else {
    // No hay jugadores disponibles, crear nueva solicitud
    console.log('📝 No hay jugadores disponibles, creando nueva solicitud...');
    return await createAsyncRequest({ rounds, category, difficulty });
  }
}

// ===== Crear solicitud asíncrona
export async function createAsyncRequest({ rounds=10, category='all', difficulty='easy' } = {}){
  if (!sb) throw new Error('Supabase no inicializado');
  
  const requestData = {
    requester_id: me.id,
    requester_name: me.name,
    rounds,
    category,
    difficulty,
    status: 'pending',
    created_at: isoNow(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
  };
  
  console.log('📝 Creando solicitud asíncrona:', requestData);
  
  const { data, error } = await sb
    .from('async_match_requests')
    .insert([requestData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creando solicitud:', error);
    throw error;
  }
  
  console.log('✅ Solicitud creada:', data);
  
  // Configurar timeout para cancelar solicitud si no hay respuesta
  setTimeout(async () => {
    await cancelAsyncRequest(data.id);
  }, 5 * 60 * 1000); // 5 minutos timeout
  
  
  cb.onStatus({ 
    status: 'waiting_for_opponent', 
    requestId: data.id,
    message: 'Esperando que alguien acepte tu solicitud...'
  });
  
  return data;
}

// ===== Aceptar invitación asíncrona
export async function acceptAsyncInvitation(requestId){
  if (!sb) throw new Error('Supabase no inicializado');
  
  console.log('✅ Aceptando invitación:', requestId);
  
  // Obtener la solicitud
  const { data: request, error: fetchError } = await sb
    .from('async_match_requests')
    .select('*')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single();
  
  if (fetchError || !request) {
    console.error('Error obteniendo solicitud:', fetchError);
    throw new Error('Solicitud no encontrada o ya procesada');
  }
  
  // Marcar solicitud como aceptada
  const { error: updateError } = await sb
    .from('async_match_requests')
    .update({ 
      status: 'accepted',
      accepter_id: me.id,
      accepter_name: me.name,
      accepted_at: isoNow()
    })
    .eq('id', requestId);
  
  if (updateError) {
    console.error('Error actualizando solicitud:', updateError);
    throw updateError;
  }
  
  // Crear partida asíncrona
  const matchData = {
    request_id: requestId,
    player1_id: request.requester_id,
    player1_name: request.requester_name,
    player2_id: me.id,
    player2_name: me.name || 'Jugador',
    rounds: request.rounds,
    category: request.category,
    difficulty: request.difficulty,
    status: 'waiting_start',
    current_question: 0,
    created_at: isoNow()
  };
  
  const { data: match, error: matchError } = await sb
    .from('async_matches')
    .insert([matchData])
    .select()
    .single();
  
  if (matchError) {
    console.error('Error creando partida:', matchError);
    throw matchError;
  }
  
  console.log('🎮 Partida asíncrona creada:', match);
  
  // Generar deck de preguntas
  const deck = await buildDeckSingle(request.category, request.difficulty, request.rounds);
  
  // Guardar deck en la partida
  await sb
    .from('async_matches')
    .update({ 
      deck: JSON.stringify(deck),
      status: 'ready'
    })
    .eq('id', match.id);
  
  // Configurar partida local
  asyncMatch.id = match.id;
  asyncMatch.status = 'ready';
  asyncMatch.rounds = request.rounds;
  asyncMatch.category = request.category;
  asyncMatch.difficulty = request.difficulty;
  asyncMatch.deck = deck;
  asyncMatch.players = [
    { id: request.requester_id, name: request.requester_name, pid: request.requester_id, isHost: true },
    { id: me.id, name: me.name, pid: me.id, isHost: false }
  ];
  
  cb.onStatus({ 
    status: 'match_created', 
    matchId: match.id,
    opponent: request.requester_name,
    message: `Partida creada contra ${request.requester_name}!`
  });
  
  return match;
}

// ===== Rechazar invitación asíncrona
export async function rejectAsyncInvitation(requestId){
  if (!sb) throw new Error('Supabase no inicializado');
  
  const { error } = await sb
    .from('async_match_requests')
    .update({ 
      status: 'rejected',
      accepter_id: me.id,
      accepter_name: me.name,
      rejected_at: isoNow()
    })
    .eq('id', requestId);
  
  if (error) {
    console.error('Error rechazando solicitud:', error);
    throw error;
  }
  
  console.log('❌ Invitación rechazada:', requestId);
}

// ===== Obtener invitaciones pendientes
export async function getAsyncInvitations(){
  if (!sb) throw new Error('Supabase no inicializado');
  
  const { data, error } = await sb
    .from('async_match_requests')
    .select('*')
    .eq('status', 'pending')
    .neq('requester_id', me.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error obteniendo invitaciones:', error);
    return [];
  }
  
  return data || [];
}

// ===== Cancelar solicitud
async function cancelAsyncRequest(requestId){
  if (!sb) return;
  
  await sb
    .from('async_match_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId);
  
  console.log('⏰ Solicitud cancelada por timeout:', requestId);
}

// ===== Obtener estado de partida asíncrona
export async function getAsyncMatchStatus(matchId){
  if (!sb) throw new Error('Supabase no inicializado');
  
  const { data, error } = await sb
    .from('async_matches')
    .select('*')
    .eq('id', matchId)
    .single();
  
  if (error) {
    console.error('Error obteniendo estado de partida:', error);
    throw error;
  }
  
  return data;
}

// ===== Responder pregunta asíncrona
export async function answerAsyncQuestion(matchId, questionIndex, answer, timeSpent){
  if (!sb) throw new Error('Supabase no inicializado');
  
  console.log('📝 Respondiendo pregunta asíncrona:', { matchId, questionIndex, answer, timeSpent });
  
  // Obtener partida actual
  const match = await getAsyncMatchStatus(matchId);
  if (!match) throw new Error('Partida no encontrada');
  
  // Verificar que es la pregunta actual
  if (questionIndex !== match.current_question) {
    throw new Error('No es la pregunta actual');
  }
  
  // Verificar que no ha expirado
  const questionStartTime = new Date(match.question_start_time).getTime();
  const now = nowUTCms();
  if (now - questionStartTime > ASYNC_TIMEOUT_MS) {
    throw new Error('Tiempo agotado para esta pregunta');
  }
  
  // Guardar respuesta
  const { error } = await sb
    .from('async_answers')
    .insert([{
      match_id: matchId,
      player_id: me.id,
      question_index: questionIndex,
      answer: answer,
      time_spent: timeSpent,
      answered_at: isoNow()
    }]);
  
  if (error) {
    console.error('Error guardando respuesta:', error);
    throw error;
  }
  
  console.log('✅ Respuesta guardada');
  
  // Verificar si ambos jugadores respondieron
  const { data: answers } = await sb
    .from('async_answers')
    .select('player_id')
    .eq('match_id', matchId)
    .eq('question_index', questionIndex);
  
  const answeredPlayers = answers?.map(a => a.player_id) || [];
  const allPlayers = [match.player1_id, match.player2_id];
  const bothAnswered = allPlayers.every(id => answeredPlayers.includes(id));
  
  if (bothAnswered) {
    // Ambos respondieron, avanzar a siguiente pregunta
    await advanceAsyncQuestion(matchId, questionIndex + 1);
  } else {
    // Esperar al otro jugador
    cb.onStatus({ 
      status: 'waiting_for_opponent_answer',
      message: 'Esperando que tu rival responda...'
    });
    
    // Actualizar el estilo del botón Exit (no rojo en modo asíncrono)
    if (window.updateExitButtonStyle) {
      window.updateExitButtonStyle();
    }
  }
  
  return { success: true, bothAnswered };
}

// ===== Avanzar a siguiente pregunta asíncrona
async function advanceAsyncQuestion(matchId, nextQuestionIndex){
  if (!sb) return;
  
  const match = await getAsyncMatchStatus(matchId);
  if (!match) return;
  
  if (nextQuestionIndex >= match.rounds) {
    // Partida terminada
    await sb
      .from('async_matches')
      .update({ 
        status: 'finished',
        finished_at: isoNow()
      })
      .eq('id', matchId);
    
    cb.onEnd({ matchId, status: 'finished' });
    return;
  }
  
  // Avanzar a siguiente pregunta
  await sb
    .from('async_matches')
    .update({ 
      current_question: nextQuestionIndex,
      question_start_time: isoNow(),
      status: 'question_active'
    })
    .eq('id', matchId);
  
  // Configurar timeout para la pregunta
  setTimeout(async () => {
    await timeoutAsyncQuestion(matchId, nextQuestionIndex);
  }, ASYNC_TIMEOUT_MS);
  
  // Notificar nueva pregunta
  const deck = JSON.parse(match.deck || '[]');
  const question = deck[nextQuestionIndex];
  
  if (question) {
    cb.onQuestion({
      matchId,
      questionIndex: nextQuestionIndex,
      question: question.question,
      options: question.options,
      timeLimit: ASYNC_TIMEOUT_MS,
      isAsync: true
    });
  }
}

// ===== Timeout de pregunta asíncrona
async function timeoutAsyncQuestion(matchId, questionIndex){
  if (!sb) return;
  
  const match = await getAsyncMatchStatus(matchId);
  if (!match || match.current_question !== questionIndex) return;
  
  // Marcar pregunta como timeout
  await sb
    .from('async_matches')
    .update({ 
      status: 'question_timeout',
      current_question: questionIndex + 1
    })
    .eq('id', matchId);
  
  // Avanzar a siguiente pregunta
  await advanceAsyncQuestion(matchId, questionIndex + 1);
}

// ===== Iniciar partida asíncrona
export async function startAsyncMatch(matchId){
  if (!sb) throw new Error('Supabase no inicializado');
  
  const match = await getAsyncMatchStatus(matchId);
  if (!match) throw new Error('Partida no encontrada');
  
  // Actualizar estado
  await sb
    .from('async_matches')
    .update({ 
      status: 'question_active',
      question_start_time: isoNow()
    })
    .eq('id', matchId);
  
  // Configurar partida local
  asyncMatch.id = matchId;
  asyncMatch.status = 'playing';
  asyncMatch.rounds = match.rounds;
  asyncMatch.category = match.category;
  asyncMatch.difficulty = match.difficulty;
  asyncMatch.deck = JSON.parse(match.deck || '[]');
  asyncMatch.players = [
    { id: match.player1_id, name: match.player1_name, pid: match.player1_id, isHost: true },
    { id: match.player2_id, name: match.player2_name, pid: match.player2_id, isHost: false }
  ];
  
  // Iniciar primera pregunta
  await advanceAsyncQuestion(matchId, 0);
  
  cb.onStatus({ 
    status: 'match_started', 
    matchId,
    message: 'Partida asíncrona iniciada!'
  });
}

// ===== Limpiar TODAS las partidas pendientes (función de emergencia)
export async function cleanupAllPendingMatches(){
  if (!sb) {
    console.log('⚠️ Supabase no inicializado - no se puede limpiar');
    return;
  }
  
  console.log('🚨 LIMPIEZA DE EMERGENCIA: Eliminando TODAS las partidas...');
  
  try {
    // Obtener TODAS las partidas (sin filtros)
    const { data: allMatches, error: allError } = await sb
      .from('async_match_requests')
      .select('*');
    
    if (allError) {
      console.error('❌ Error obteniendo todas las partidas:', allError);
      return;
    }
    
    console.log(`🚨 Encontradas ${allMatches?.length || 0} partidas totales:`, allMatches);
    
    if (allMatches && allMatches.length > 0) {
      let deletedCount = 0;
      let errorCount = 0;
      
      for (const match of allMatches) {
        console.log(`🧹 Intentando eliminar partida ${match.id}:`, {
          created_at: match.created_at,
          status: match.status,
          requester_name: match.requester_name
        });
        
        const { error: deleteError } = await sb
          .from('async_match_requests')
          .delete()
          .eq('id', match.id);
        
        if (deleteError) {
          errorCount++;
          console.error(`❌ Error eliminando partida ${match.id}:`, deleteError);
          console.error(`❌ Detalles del error:`, {
            message: deleteError.message,
            details: deleteError.details,
            hint: deleteError.hint,
            code: deleteError.code
          });
        } else {
          deletedCount++;
          console.log(`✅ Eliminada partida ${match.id} (${match.requester_name})`);
        }
      }
      
      console.log(`🚨 RESULTADO FINAL:`);
      console.log(`✅ Eliminadas: ${deletedCount}`);
      console.log(`❌ Errores: ${errorCount}`);
      console.log(`📊 Total procesadas: ${allMatches.length}`);
      
      if (errorCount > 0) {
        console.log('🚨 HAY ERRORES DE PERMISOS - Revisar RLS en Supabase');
      }
    } else {
      console.log('✅ No hay partidas para limpiar');
    }
  } catch (error) {
    console.error('❌ Error en limpieza de emergencia:', error);
  }
}

// Hacer disponible globalmente
window.initAsyncVS = initAsyncVS;
window.loadAsyncMatches = loadAsyncMatches;
window.displayAsyncMatches = displayAsyncMatches;
window.cleanupOldMatches = cleanupOldMatches;
window.cleanupAllPendingMatches = cleanupAllPendingMatches;
