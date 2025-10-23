// js/vs.js — VS con auto‑avance al responder ambos y resultados
import { buildDeckSingle } from './bank.js';

const TIMER_PER_QUESTION = 15;              // segundos
const CHANNEL_PREFIX = 'room:';

let sb = null;
let me = { id: null, name: 'Anon', pid: null };
let channel = null;

const match = {
  code: null,
  isHost: false,
  status: 'idle',       // idle|waiting|playing|finished
  rounds: 10,
  category: 'all',
  difficulty: 'easy',
  deck: [],
  qIndex: -1,
  players: [],
  scores: {},             // { pid: { name, correct } }
  answeredSet: new Set(), // pids que respondieron la pregunta actual
  expectedAnswers: 2,     // cuántos esperamos por pregunta (MVP: 2)
};

let cb = {
  onStatus:    (_)=>{},
  onPresence:  (_)=>{},
  onQuestion:  (_)=>{},
  onTimerTick: (_)=>{},
  onEnd:       (_)=>{},
};

// ===== Utils
const nowUTCms = () => Date.now();
const isoNow   = () => new Date().toISOString();
const uuidish  = () => (typeof crypto !== 'undefined' && crypto.randomUUID)
  ? crypto.randomUUID()
  : (Date.now().toString(36) + Math.random().toString(36).slice(2,10));

function getOrMakePID(){
  try{
    let pid = localStorage.getItem('vs_pid');
    if (!pid) { pid = uuidish(); localStorage.setItem('vs_pid', pid); }
    return pid;
  } catch { return uuidish(); }
}

function genCode(len=5){
  const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s='';
  for (let i=0;i<len;i++) s+=A[Math.floor(Math.random()*A.length)];
  return s;
}
function setStatus(s){
  match.status = s;
  cb.onStatus({ status:s, code:match.code, isHost:match.isHost, qIndex:match.qIndex });
}

// ===== Realtime
async function ensureChannel(){
  if (!sb) throw new Error('Supabase no inicializado');
  if (!match.code) throw new Error('No hay código');
  if (channel) return channel;

  channel = sb.channel(CHANNEL_PREFIX + match.code, {
    config: { presence: { key: me.pid } }
  });

  channel
    .on('presence', { event:'sync' }, handlePresenceSync)
    .on('broadcast', { event:'vs' }, ({ payload }) => handlePacket(payload));

  await new Promise((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve();
    });
  });

  return channel;
}

function broadcast(payload){
  if (!channel) return;
  channel.send({ type:'broadcast', event:'vs', payload });
}

function handlePresenceSync(){
  if (!channel) return;
  const st = channel.presenceState();

  const players = [];
  Object.entries(st).forEach(([key, metas]) => {
    const last = metas[metas.length - 1] || {};
    players.push({ id:key, pid:key, name:last.name, role:last.role || 'player' });
  });
  const prevCount = (match.players || []).length;
  match.players = players;

  // bootstrap de scores + expectedAnswers (MVP: 2)
  players.forEach(p=>{
    if (!match.scores[p.pid]) match.scores[p.pid] = { name: p.name || 'Jugador', correct: 0 };
  });
  match.expectedAnswers = Math.max(2, Math.min(players.length, 2));

  cb.onPresence({ players, me:{ id:me.id, name:me.name, pid: me.pid } });

  if (match.isHost && match.status === 'waiting' && players.length >= 2){
    startMatchHost();
  }

  // Si alguien se va durante la partida, cerrar para ambos
  if (match.status === 'playing' && players.length < 2){
    clearTimer();
    if (match.isHost){
      // El invitado se fue; host gana por abandono
      setStatus('abandoned');
      broadcast({ type:'abandoned', scores: match.scores, ts: isoNow(), winnerPid: me.pid });
      cb.onEnd({ scores: match.scores, mePid: me.pid, reason: 'opponent_left', winnerPid: me.pid });
    } else {
      // Invitado detecta que el host o rival se fue; el que queda (yo) gana
      setStatus('peer-left');
      cb.onEnd({ scores: match.scores, mePid: me.pid, reason: 'opponent_left', winnerPid: me.pid });
    }
  }
}

// ===== Timer sincronizado
let timer = null, endAt=0;

function startTimer(startAtISO, dur){
  clearTimer();
  const startAt = new Date(startAtISO).getTime();
  const now = nowUTCms();
  const elapsed = Math.max(0, Math.floor((now - startAt)/1000));
  const remaining = Math.max(0, dur - elapsed);
  endAt = now + remaining*1000;
  cb.onTimerTick({ remaining });

  timer = setInterval(()=>{
    const rem = Math.max(0, Math.ceil((endAt - nowUTCms())/1000));
    cb.onTimerTick({ remaining: rem });
    if (rem <= 0){
      clearTimer();
      if (match.isHost) nextQuestionHost();
    }
  }, 250);
}

function clearTimer(){ if (timer) clearInterval(timer), timer=null; }

// ===== API pública
export function initVS({ supabase, userId, username, callbacks = {} }){
  sb = supabase;
  me.id = userId || uuidish();
  me.name = username || 'Anon';
  me.pid = getOrMakePID();
  cb = { ...cb, ...callbacks };
  setStatus('idle');
}

// permitir actualizar el nombre justo antes de crear/unirse
export function setVSName(name){
  me.name = (name && name.trim()) ? name.trim() : 'Anon';
}

export async function createMatch({ rounds=10, category='all', difficulty='easy' } = {}){
  match.code = genCode(5);
  match.isHost = true;
  match.rounds = rounds;
  match.category = category;
  match.difficulty = difficulty;

  await ensureChannel();
  // Incluir userId si está disponible para cargar perfil
  const userId = window.getCurrentUser ? window.getCurrentUser()?.id : null;
  await channel.track({ 
    name: me.name, 
    role:'host', 
    ts: isoNow(),
    userId: userId || null
  });
  setStatus('waiting');
  return match.code;
}

export async function joinMatch(code){
  match.code = code.toUpperCase().replace(/\s/g,'');
  match.isHost = false;

  await ensureChannel();
  // Incluir userId si está disponible para cargar perfil
  const userId = window.getCurrentUser ? window.getCurrentUser()?.id : null;
  await channel.track({ 
    name: me.name, 
    role:'guest', 
    ts: isoNow(),
    userId: userId || null
  });
  setStatus('waiting');
}

export async function leaveMatch(){
  clearTimer();
  if (channel){
    try{ await channel.untrack(); }catch{}
    try{ await sb.removeChannel(channel); }catch{}
  }
  channel = null;
  match.code=null; match.isHost=false; match.status='idle'; match.qIndex=-1; match.deck=[];
  match.scores={}; match.answeredSet=new Set(); match.expectedAnswers=2;
  setStatus('idle');
}

export function answer(choiceIdx){
  if (match.status!=='playing') return;
  // 1) Broadcast normal
  broadcast({ type:'answer', q:match.qIndex, choice:(typeof choiceIdx==='number'?choiceIdx:null), from: me.pid, ts: isoNow() });
  // 2) Asegurarnos de contar la propia respuesta en el HOST (por si broadcast no vuelve a self)
  if (match.isHost){
    registerAnswerOnHost({ from: me.pid, q: match.qIndex, choice: choiceIdx });
  }
}

// ===== Interno (host)
function prepareQuestionState(){
  match.answeredSet = new Set();
  match.expectedAnswers = Math.max(2, Math.min((match.players||[]).length, 2)); // MVP: 2
}

async function startMatchHost(){
  match.deck = buildDeckSingle(match.category, match.rounds, match.difficulty);
  match.qIndex = -1;
  match.scores = {};
  (match.players || []).forEach(p=>{
    match.scores[p.pid] = { name: p.name || 'Jugador', correct: 0 };
  });
  setStatus('playing');
  broadcast({ type:'start', rounds:match.rounds, ts: isoNow() });
  nextQuestionHost();
}

function nextQuestionHost(){
  match.qIndex++;
  clearTimer();
  if (!match.deck || match.qIndex >= match.rounds || match.qIndex >= match.deck.length){
    endMatchHost(); return;
  }
  const q = match.deck[match.qIndex];
  const startAt = new Date(nowUTCms()+500).toISOString();
  prepareQuestionState();

  broadcast({
    type:'question',
    index:match.qIndex,
    time:TIMER_PER_QUESTION,
    startAt,
    payload:{ q:q.q, options:q.options, ans:q.answer, cat:q.category, diff:q.difficulty, img: q.img || (q.media && q.media.src) || null }
  });

  cb.onQuestion({
    index:match.qIndex,
    question:q.q, options:q.options, timeLeft:TIMER_PER_QUESTION, answer:q.answer,
    media: q.img || (q.media && q.media.src) || null
  });
  startTimer(startAt, TIMER_PER_QUESTION);
}

function endMatchHost(){
  setStatus('finished');
  clearTimer();
  const scores = match.scores || {};
  broadcast({ type:'end', scores, ts: isoNow() });
  cb.onEnd({ scores, mePid: me.pid });
}

function registerAnswerOnHost(p){
  if (!match.isHost || match.status!=='playing') return;
  if (!p || p.q !== match.qIndex || p.from == null) return;
  if (match.answeredSet.has(p.from)) return;

  match.answeredSet.add(p.from);

  const q = match.deck?.[match.qIndex];
  if (q && typeof p.choice==='number' && p.choice === q.answer){
    match.scores[p.from] = match.scores[p.from] || { name:'Jugador', correct:0 };
    match.scores[p.from].correct += 1;
  }

  if (match.answeredSet.size >= match.expectedAnswers){
    // pequeño delay para que ambos vean los colores
    setTimeout(()=> nextQuestionHost(), 600);
  }
}

// ===== RX
function handlePacket(p){
  if (!p || typeof p!=='object') return;

  if (p.type === 'start'){
    match.qIndex = -1;
    setStatus('playing');
    return;
  }

  if (p.type === 'question'){
    const { index, time, startAt, payload: qp } = p;
    match.qIndex = index;
    clearTimer();
    cb.onQuestion({ index, question: qp.q, options: qp.options, timeLeft: time, answer: qp.ans, media: qp.img || (qp.media && qp.media.src) || null });
    startTimer(startAt, time);
    return;
  }

  if (p.type === 'answer'){
    // El host registra cada respuesta recibida
    registerAnswerOnHost(p);
    return;
  }

  if (p.type === 'end'){
    clearTimer();
    setStatus('finished');
    cb.onEnd({ scores: p.scores || null, mePid: me.pid });
  }

  if (p.type === 'abandoned'){
    clearTimer();
    setStatus('abandoned');
    cb.onEnd({ scores: p.scores || null, mePid: me.pid, reason: 'opponent_left', winnerPid: p.winnerPid });
  }
}
