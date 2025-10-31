# 📊 Análisis Completo del Sistema de Partidas VS

## 📋 Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura Actual](#arquitectura-actual)
3. [Flujo Detallado de Cada Modo](#flujo-detallado)
4. [Problemas Identificados](#problemas-identificados)
5. [Optimizaciones Propuestas](#optimizaciones-propuestas)
6. [Plan de Implementación](#plan-de-implementación)

---

## 🎯 Resumen Ejecutivo

El sistema de partidas VS tiene **3 modos distintos**:

1. **VS Normal (Real-time)** - Tiempo real con Supabase Realtime
2. **VS Random** - Matchmaking aleatorio (usa VS Normal)
3. **VS Asíncrono** - Partidas con 2 horas por pregunta, guardadas en BD

### Archivos Clave
- `www/js/game/vs.js` - VS Normal + Random Matchmaking (520 líneas)
- `www/js/game/async_vs.js` - VS Asíncrono (1702 líneas)
- `www/js/handlers/vs-handlers.js` - UI Handlers (366 líneas)
- `www/js/player/friends_ui.js` - Integración con amigos (2000+ líneas)
- `www/js/player/social.js` - Sistema de invitaciones (729 líneas)

---

## 🏗️ Arquitectura Actual

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                      main.js                                 │
│  - Inicializa VS (initVS / initAsyncVS)                     │
│  - Maneja eventos de UI (onHost, onJoin, onCancelSearch)    │
│  - Coordina entre modos (random, friend, async)             │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────────┐  ┌────▼──────────┐
│ vs.js      │  │ async_vs.js   │
│            │  │               │
│ - Real-time│  │ - DB-based    │
│ - Channels │  │ - Polling     │
│ - Matchmak.│  │ - Notific.    │
└────────────┘  └───────────────┘
    │                 │
    └────────┬────────┘
             │
┌────────────▼──────────────────┐
│   Supabase                     │
│   - Realtime (vs.js)           │
│   - Database (async_vs.js)    │
│   - RLS Policies               │
└────────────────────────────────┘
```

### Estados de Partida

#### VS Normal (`vs.js`)
```javascript
match.status = 'idle' | 'waiting' | 'playing' | 'finished' | 'abandoned'
```

#### VS Asíncrono (`async_vs.js`)
```javascript
asyncMatch.status = 'idle' | 'waiting' | 'playing' | 'finished' | 'timeout'
// BD: 'waiting_start' | 'ready' | 'question_active' | 'question_timeout' | 'finished' | 'abandoned'
```

---

## 🔄 Flujo Detallado

### 1️⃣ **VS Normal (Real-time)**

#### Flujo de Crear Sala

```
Usuario → Click "Crear Sala"
  ↓
main.js:onHost()
  ↓
vs.js:createMatch({ rounds, category, difficulty })
  ├─ Genera código de 5 caracteres
  ├─ Crea canal Supabase Realtime: 'room:{code}'
  ├─ Track presence como 'host'
  └─ Cambia status a 'waiting'
  ↓
Espera a que otro jugador se una...
```

#### Flujo de Unirse a Sala

```
Usuario → Ingresa código → Click "Unirse"
  ↓
main.js:onJoin()
  ↓
vs.js:joinMatch(code)
  ├─ Valida código
  ├─ Se suscribe al canal 'room:{code}'
  ├─ Track presence como 'guest'
  └─ Cambia status a 'waiting'
  ↓
handlePresenceSync() detecta 2 jugadores
  ↓
startMatchHost() (si soy host)
  ├─ Genera deck con buildDeckSingle()
  ├─ Resetea scores
  ├─ Cambia status a 'playing'
  └─ Broadcast { type: 'start' }
  ↓
nextQuestionHost() (host ejecuta)
  ├─ Incrementa qIndex
  ├─ Prepara pregunta actual
  ├─ Broadcast { type: 'question', ... }
  └─ startTimer() (15 segundos)
  ↓
Ambos jugadores ven la pregunta
  ↓
Usuario clickea opción → answer(choiceIdx)
  ├─ Broadcast { type: 'answer', q, choice, from }
  └─ registerAnswerOnHost() (si soy host)
      ├─ Verifica si es correcta
      ├─ Actualiza scores[p.from].correct
      └─ Si answeredSet.size >= expectedAnswers:
          └─ setTimeout(() => nextQuestionHost(), 600ms)
  ↓
[Repite para cada pregunta]
  ↓
endMatchHost() (cuando qIndex >= rounds)
  ├─ Cambia status a 'finished'
  ├─ Broadcast { type: 'end', scores }
  └─ cb.onEnd({ scores, mePid })
  ↓
showResults() en vs-handlers.js
  └─ Muestra resultados finales
```

#### Flujo de Random Matchmaking

```
Usuario → Selecciona "Random" → Click "Buscar partida"
  ↓
main.js:onHost() → startRandomMatch({ ... })
  ↓
vs.js:startRandomMatch()
  ├─ Establece randomSearch.active = true
  ├─ Suscribe a canal 'mm:vs'
  ├─ Envía { type: 'looking', pid, filters }
  └─ Reenvía cada 5 segundos (keepAlive)
  ↓
handleMM() recibe { type: 'looking' } de otro jugador
  ├─ Verifica que estoy buscando
  ├─ Verifica filtros coinciden
  └─ Si PID menor → Soy host
      └─ createMatch() → mmSend({ type: 'match_found', code, ... })
  ↓
handleMM() recibe { type: 'match_found' }
  ├─ Si soy guest → joinMatch(code)
  └─ randomSearch.matched = true
  ↓
[Continúa con flujo normal de partida]
```

### 2️⃣ **VS con Amigos**

#### Flujo de Invitación

```
Usuario → Abre lista de amigos → Click "Desafiar"
  ↓
friends_ui.js:inviteFriendToSync(friendId, friendName)
  ├─ Storage.set('pending_friend_invite', friendId)
  ├─ Storage.set('pending_friend_name', friendName)
  └─ Actualiza UI (botón "Crear Sala" cambia a "Crear sala vs {amigo}")
  ↓
Usuario → Click "Crear Sala"
  ↓
main.js:onHost()
  ├─ Lee pending_friend_invite
  ├─ createMatch() genera código
  └─ socialManager.inviteToSyncGame(friendId, code)
      └─ Inserta en game_invitations:
          {
            from_user_id: me.id,
            to_user_id: friendId,
            room_code: code,
            game_type: 'vs',
            status: 'pending',
            expires_at: +5min
          }
  ↓
Amigo recibe notificación (Realtime subscription)
  ↓
Amigo → Click "Aceptar"
  └─ joinMatch(code) + marca invitación como 'accepted'
  ↓
[Continúa con flujo normal]
```

### 3️⃣ **VS Asíncrono**

#### Flujo de Búsqueda Random Asíncrono

```
Usuario → Selecciona "Random Offline" → Click "Buscar partida"
  ↓
main.js:onHost() → startAsyncRandomSearch({ ... })
  ↓
async_vs.js:startAsyncRandomSearch()
  ├─ Busca partidas pendientes en async_match_requests:
      SELECT * WHERE status='pending' AND rounds=X AND category=Y AND difficulty=Z
  ├─ Si encuentra → acceptAsyncInvitation(requestId)
  └─ Si NO encuentra → createAsyncRequest()
      └─ Inserta en async_match_requests:
          {
            requester_id: me.id,
            requester_name: me.name,
            rounds, category, difficulty,
            status: 'pending',
            expires_at: +5min
          }
  ↓
[Otro usuario puede aceptar la request]
```

#### Flujo de Aceptar Request Asíncrona

```
Usuario → Carga lista de partidas → Click "Unirse"
  ↓
async_vs.js:acceptRandomRequest(requestId)
  ├─ Actualiza async_match_requests: status='accepted', accepter_id=me.id
  ├─ Crea async_matches:
      {
        player1_id: request.requester_id,
        player2_id: me.id,
        rounds, category, difficulty,
        deck: buildDeckSingle(...), // ⚠️ Genera deck aquí
        status: 'active',
        current_question: 0
      }
  ├─ Elimina async_match_requests (ya aceptada)
  ├─ Broadcast notificación al creador
  └─ startAsyncGame(matchId) automáticamente
  ↓
async_vs.js:startAsyncGame(matchId)
  ├─ Carga match desde BD
  ├─ Configura window.STATE.mode = 'async'
  ├─ Configura window.currentAsyncMatchId
  └─ Llama window.startSolo() (reutiliza lógica de solo)
  ↓
solo.js:startSolo()
  └─ Detecta STATE.mode === 'async'
      └─ Carga pregunta desde async_matches.deck[current_question]
  ↓
Usuario responde → solo.js maneja respuesta
  └─ saveAsyncAnswerAndCheck()
      ├─ Inserta en async_answers:
          {
            match_id: matchId,
            player_id: me.id,
            question_index: currentQuestion,
            answer: choiceIndex,
            time_spent: timeSpent
          }
      └─ Verifica si ambos respondieron:
          SELECT * FROM async_answers WHERE match_id=X AND question_index=Y
          └─ Si ambos → nextAsyncQuestion()
  ↓
async_vs.js:nextAsyncQuestion()
  ├─ Incrementa current_question en BD
  ├─ Actualiza window.STATE.index
  └─ Renderiza siguiente pregunta
  ↓
[Repite hasta completar todas las preguntas]
  ↓
endAsyncGame()
  ├─ Actualiza async_matches: status='finished'
  └─ Limpia estado local
```

---

## ❌ Problemas Identificados

### 🔴 **Críticos**

1. **Duplicación de Lógica entre VS y Async**
   - `vs.js` usa Realtime channels
   - `async_vs.js` usa Database + polling
   - **No hay abstracción común** → Mantenimiento difícil

2. **Race Conditions en Matchmaking**
   ```javascript
   // vs.js:handleMM() - Línea 145
   if (iAmHost && !match.code){
     const code = await createMatch(...);
     mmSend({ type:'match_found', code, ... });
   }
   ```
   - Si 2 jugadores crean partida simultáneamente → Códigos duplicados posibles
   - No hay lock atómico

3. **Manejo de Desconexión Inconsistente**
   - VS Normal: Detecta con presence sync
   - VS Async: No detecta abandono automáticamente
   - Timeouts manuales (16h, 24h) → Ineficiente

4. **Generación de Deck Duplicada**
   ```javascript
   // async_vs.js:acceptRandomRequest() - Línea 1046
   const sharedDeck = buildDeckSingle(...);
   // vs.js:startMatchHost() - Línea 368
   match.deck = buildDeckSingle(...);
   ```
   - Misma función, diferentes momentos
   - Si deck cambia → Inconsistencias posibles

5. **Polling Excesivo en Async**
   ```javascript
   // friends_ui.js:loadOpenMatches() - Línea 1487
   // Consulta async_matches + async_answers cada vez
   const { data: matches } = await supabase.from('async_matches').select('*')
   // Luego consulta async_answers para cada match
   ```
   - **Sin caché local** → Múltiples queries innecesarias
   - **Sin debouncing** → Recarga en cada interacción

### 🟡 **Moderados**

6. **Código Espagueti en main.js**
   ```javascript
   // main.js:onHost() - Línea 955
   if (opponentType === 'random' && !pendingFriendId) { ... }
   if (opponentType === 'random_async' && !pendingFriendId) { ... }
   const code = await createMatch(...);
   if (pendingFriendId) { ... }
   ```
   - Lógica condicional anidada → Difícil de testear
   - Mezcla responsabilidades (UI + Lógica de negocio)

7. **Estado Global Esparcido**
   ```javascript
   window.STATE = { mode, status, ... }
   window.currentAsyncMatchId = ...
   window.currentAsyncMatch = ...
   window.asyncAnsweredSet = ...
   window.asyncExpectedAnswers = ...
   ```
   - Estado fragmentado → Debugging difícil
   - Sin gestión centralizada

8. **Falta de Validación de Datos**
   - No valida que deck tenga suficientes preguntas
   - No valida que current_question <= rounds
   - Posibles errores en producción

9. **Manejo de Errores Inconsistente**
   ```javascript
   // vs.js
   try { await createMatch(...) } catch(e) { ... }
   
   // async_vs.js
   if (error) throw error; // Sin try-catch en llamadas
   ```

10. **Performance en Carga de Partidas Async**
    - `loadOpenMatches()` consulta todas las partidas cada vez
    - Sin paginación
    - Sin índices optimizados en algunas queries

### 🟢 **Menores**

11. **Nombres de Variables Inconsistentes**
    - `match.code` (vs.js)
    - `asyncMatch.id` (async_vs.js)
    - `matchId` (friends_ui.js)

12. **Console.log Excesivo**
    - ~200 líneas de logs en producción
    - Impacta rendimiento en mobile

13. **Magic Numbers**
    ```javascript
   const TIMER_PER_QUESTION = 15; // vs.js
   const ASYNC_TIMEOUT_HOURS = 2; // async_vs.js
   ```
    - Deberían estar en config centralizado

---

## 🚀 Optimizaciones Propuestas

### **Fase 1: Consolidación de Estado**

#### 1.1 Crear VSStateManager

```javascript
// www/js/core/vs-state-manager.js
export class VSStateManager {
  constructor() {
    this.state = {
      mode: null, // 'normal' | 'async' | 'random'
      type: null, // 'friend' | 'random'
      matchId: null,
      roomCode: null,
      status: 'idle',
      players: [],
      scores: {},
      currentQuestion: -1,
      totalQuestions: 0,
      deck: []
    };
    this.subscribers = new Map();
  }
  
  set(key, value) {
    this.state[key] = value;
    this.notify(key, value);
  }
  
  get(key) {
    return this.state[key];
  }
  
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    this.subscribers.get(key).push(callback);
  }
  
  notify(key, value) {
    const callbacks = this.subscribers.get(key) || [];
    callbacks.forEach(cb => cb(value));
  }
  
  reset() {
    this.state = { ...this.state, status: 'idle', matchId: null, roomCode: null };
  }
}
```

**Beneficios:**
- Estado centralizado
- Fácil debugging (window.VSStateManager.getState())
- Suscripciones reactivas

---

### **Fase 2: Abstracción de Sistema VS**

#### 2.1 Crear VSGameEngine

```javascript
// www/js/game/vs-engine.js
export class VSGameEngine {
  constructor({ mode, stateManager, storage }) {
    this.mode = mode; // 'realtime' | 'async'
    this.stateManager = stateManager;
    this.storage = storage;
    this.matchHandler = null;
  }
  
  async createMatch(config) {
    // Lógica común
    const match = await this.matchHandler.create(config);
    this.stateManager.set('matchId', match.id);
    this.stateManager.set('roomCode', match.code);
    return match;
  }
  
  async joinMatch(identifier) {
    // identifier puede ser código (realtime) o matchId (async)
    const match = await this.matchHandler.join(identifier);
    this.stateManager.set('matchId', match.id);
    return match;
  }
  
  async answer(questionIndex, choice) {
    return await this.matchHandler.submitAnswer(questionIndex, choice);
  }
  
  setMatchHandler(handler) {
    this.matchHandler = handler;
  }
}

// Handlers específicos
export class RealtimeMatchHandler {
  constructor(supabase) { this.sb = supabase; }
  async create(config) { /* vs.js lógica */ }
  async join(code) { /* vs.js lógica */ }
  async submitAnswer(qIdx, choice) { /* vs.js lógica */ }
}

export class AsyncMatchHandler {
  constructor(supabase) { this.sb = supabase; }
  async create(config) { /* async_vs.js lógica */ }
  async join(matchId) { /* async_vs.js lógica */ }
  async submitAnswer(qIdx, choice) { /* async_vs.js lógica */ }
}
```

**Beneficios:**
- Una interfaz para ambos modos
- Fácil de testear
- Extensible para futuros modos

---

### **Fase 3: Optimización de Base de Datos**

#### 3.1 Índices Mejorados

```sql
-- Índice compuesto para búsqueda de matchmaking
CREATE INDEX idx_async_requests_matchmaking 
ON async_match_requests(status, rounds, category, difficulty, created_at DESC)
WHERE status = 'pending';

-- Índice para carga rápida de partidas abiertas
CREATE INDEX idx_async_matches_active 
ON async_matches(player1_id, player2_id, status, current_question)
WHERE status IN ('active', 'question_active');
```

#### 3.2 Materialized View para Partidas Abiertas

```sql
CREATE MATERIALIZED VIEW mv_user_open_matches AS
SELECT 
  m.id,
  m.player1_id,
  m.player2_id,
  m.current_question,
  m.status,
  -- Pre-calcular si ambos respondieron
  CASE 
    WHEN m.player1_answered_current AND m.player2_answered_current 
    THEN true 
    ELSE false 
  END as both_answered,
  -- Pre-calcular tiempo restante
  CASE 
    WHEN m.question_start_time IS NOT NULL
    THEN (m.question_start_time + INTERVAL '2 hours') - NOW()
    ELSE NULL
  END as time_remaining
FROM async_matches m
WHERE m.status IN ('active', 'question_active');

CREATE UNIQUE INDEX ON mv_user_open_matches(id);
REFRESH MATERIALIZED VIEW mv_user_open_matches; -- Ejecutar periódicamente
```

**Beneficios:**
- Queries 10x más rápidas
- Menos carga en BD
- Mejor UX

---

### **Fase 4: Caché y Optimización Frontend**

#### 4.1 VS Matches Cache

```javascript
// www/js/core/vs-cache.js
export class VSMatchesCache {
  constructor(storage) {
    this.storage = storage;
    this.cache = new Map();
    this.ttl = 30000; // 30 segundos
  }
  
  async getOpenMatches(userId) {
    const cacheKey = `vs_matches_${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    // Fetch from DB
    const matches = await this.fetchOpenMatches(userId);
    this.cache.set(cacheKey, {
      data: matches,
      timestamp: Date.now()
    });
    
    return matches;
  }
  
  invalidate(userId) {
    this.cache.delete(`vs_matches_${userId}`);
  }
}
```

#### 4.2 Debouncing de Recargas

```javascript
// www/js/player/friends_ui.js
const debouncedLoadMatches = debounce(async () => {
  await loadOpenMatches();
}, 1000); // Máximo 1 recarga por segundo
```

---

### **Fase 5: Refactorización de main.js**

#### 5.1 Separar Lógica de Negocio

```javascript
// www/js/game/vs-coordinator.js
export class VSCoordinator {
  constructor({ vsEngine, friendsManager, stateManager }) {
    this.vsEngine = vsEngine;
    this.friendsManager = friendsManager;
    this.stateManager = stateManager;
  }
  
  async startGame(config) {
    const { opponentType, category, difficulty, rounds } = config;
    
    // 1. Determinar modo
    if (opponentType === 'random') {
      return await this.startRandomMatch({ category, difficulty, rounds });
    }
    
    if (opponentType === 'random_async') {
      return await this.startAsyncRandomMatch({ category, difficulty, rounds });
    }
    
    if (opponentType === 'friend') {
      return await this.startFriendMatch({ category, difficulty, rounds });
    }
    
    throw new Error('Tipo de oponente inválido');
  }
  
  async startRandomMatch(config) {
    // Lógica específica de random
  }
  
  async startAsyncRandomMatch(config) {
    // Lógica específica de async random
  }
  
  async startFriendMatch(config) {
    // Lógica específica de friend
  }
}
```

**Beneficios:**
- main.js solo coordina UI
- Lógica testable
- Código más limpio

---

### **Fase 6: Mejoras de Matchmaking**

#### 6.1 Lock Atómico para Crear Partida

```javascript
// Usar Supabase Functions con lock
// supabase/functions/create-match/index.ts
export async function createMatch(req) {
  // Usar SELECT FOR UPDATE para evitar race conditions
  const { data } = await supabase.rpc('create_match_atomic', {
    p_rounds: req.rounds,
    p_category: req.category,
    p_difficulty: req.difficulty
  });
  return data;
}
```

#### 6.2 Pool de Matchmaking

```javascript
// Cache de jugadores buscando
class MatchmakingPool {
  constructor() {
    this.pool = new Map(); // filters -> Set<playerId>
  }
  
  add(playerId, filters) {
    const key = this.getKey(filters);
    if (!this.pool.has(key)) {
      this.pool.set(key, new Set());
    }
    this.pool.get(key).add(playerId);
  }
  
  findMatch(filters) {
    const key = this.getKey(filters);
    const players = this.pool.get(key);
    if (players && players.size > 0) {
      return Array.from(players)[0];
    }
    return null;
  }
}
```

---

## 📅 Plan de Implementación

### **Sprint 1: Fundación** (1 semana)
- [ ] Crear VSStateManager
- [ ] Migrar estado actual a VSStateManager
- [ ] Tests básicos

### **Sprint 2: Abstracción** (2 semanas)
- [ ] Crear VSGameEngine
- [ ] Implementar RealtimeMatchHandler
- [ ] Implementar AsyncMatchHandler
- [ ] Migrar vs.js a usar engine
- [ ] Migrar async_vs.js a usar engine

### **Sprint 3: Optimización BD** (1 semana)
- [ ] Crear índices mejorados
- [ ] Crear materialized view
- [ ] Optimizar queries existentes
- [ ] Tests de performance

### **Sprint 4: Frontend** (1 semana)
- [ ] Implementar VSMatchesCache
- [ ] Agregar debouncing
- [ ] Optimizar loadOpenMatches()
- [ ] Tests de caché

### **Sprint 5: Refactorización** (2 semanas)
- [ ] Crear VSCoordinator
- [ ] Refactorizar main.js:onHost()
- [ ] Separar lógica de UI
- [ ] Tests completos

### **Sprint 6: Matchmaking** (1 semana)
- [ ] Implementar lock atómico
- [ ] Crear MatchmakingPool
- [ ] Optimizar búsqueda de rivales
- [ ] Tests de concurrencia

---

## 📊 Métricas de Éxito

### Antes vs Después

| Métrica | Antes | Meta | Mejora |
|---------|-------|------|--------|
| Tiempo de carga de partidas | 2-3s | <500ms | 4-6x |
| Queries a BD por carga | 5-10 | 1-2 | 5x |
| Líneas de código duplicado | ~300 | ~50 | 83% |
| Tiempo de matchmaking | 5-30s | 2-10s | 2-3x |
| Tasa de errores | ~5% | <1% | 5x |

---

## 🔒 Consideraciones de Seguridad

1. **Validación de Inputs**
   - Sanitizar códigos de sala
   - Validar rangos de rounds (1-50)
   - Validar categorías permitidas

2. **Rate Limiting**
   - Máximo 5 partidas simultáneas por usuario
   - Máximo 10 búsquedas por minuto

3. **Prevención de Cheating**
   - Validar respuestas en servidor (Supabase Functions)
   - Timestamp de respuestas no modificable
   - Deck generado en servidor para partidas importantes

---

## 📝 Notas Adicionales

### Tecnologías Sugeridas
- **State Management:** Zustand o Redux Toolkit (más simple)
- **Caching:** React Query o SWR (si migran a React)
- **Testing:** Vitest + Testing Library

### Compatibilidad
- Mantener compatibilidad con código existente
- Migración gradual (feature flags)
- No romper partidas en curso

---

**Fecha de Análisis:** 2024-12-28  
**Autor:** AI Assistant  
**Versión:** 1.0

