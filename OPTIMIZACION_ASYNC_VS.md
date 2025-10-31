# 🚀 Plan de Optimización: Sistema de Partidas Asíncronas

## 📊 Análisis de Problemas Actuales

### 🔴 **Problemas Críticos Identificados**

#### 1. **Múltiples Queries para Cargar Partidas Abiertas**
```javascript
// friends_ui.js:loadOpenMatches() - Líneas 1500-1513
// PROBLEMA: 2 queries separadas cuando podrían ser 1
const { data: player1Matches } = await supabase
  .from('async_matches')
  .select('*')
  .eq('player1_id', userId);  // Query 1

const { data: player2Matches } = await supabase
  .from('async_matches')
  .select('*')
  .eq('player2_id', userId);  // Query 2
```
**Impacto:** Doble round-trip a la BD, más lento.

#### 2. **Consulta a async_answers Después de Cada Respuesta**
```javascript
// solo.js:saveAsyncAnswerAndCheck() - Línea 658
// PROBLEMA: Consulta async_answers cada vez que alguien responde
const { data: answers } = await supabaseClient
  .from('async_answers')
  .select('player_id')
  .eq('match_id', window.currentAsyncMatchId)
  .eq('question_index', currentState.index - 1);
```
**Impacto:** Query innecesaria si tenemos campos calculados en async_matches.

#### 3. **Consulta a Perfiles de Usuarios por Separado**
```javascript
// friends_ui.js:loadOpenMatches() - Líneas 1524-1556
// PROBLEMA: Consulta user_profiles después de obtener partidas
const { data: profiles } = await supabase
  .from('user_profiles')
  .select('user_id, nickname, avatar_url')
  .in('user_id', allPlayerIds);
```
**Impacto:** Query adicional que podría evitarse con JOIN o caché.

#### 4. **Filtrado de Partidas Expiradas en Frontend**
```javascript
// friends_ui.js:loadOpenMatches() - Líneas 1591-1631
// PROBLEMA: Filtra partidas expiradas en JavaScript, no en BD
for (const match of allMatches) {
  if (match.status === 'finished' || match.current_question >= match.rounds) {
    expiredMatches.push(match);
  }
  // ... más filtros en frontend
}
```
**Impacto:** Descarga todas las partidas incluyendo expiradas, desperdicia ancho de banda.

#### 5. **Falta de Caché y Debouncing**
```javascript
// PROBLEMA: Cada vez que se abre el tab, consulta la BD
if (tabName === 'matches') loadOpenMatches();
```
**Impacto:** Múltiples queries innecesarias si el usuario cambia de tab.

#### 6. **Consultas de Debug en Producción**
```javascript
// async_vs.js:loadAsyncMatches() - Líneas 707-740
// PROBLEMA: Múltiples consultas de debug que no deberían ejecutarse
const { data: allMatchesRaw } = await sb.from('async_match_requests').select('*');
// ... más consultas de debug
```
**Impacto:** Consultas innecesarias que ralentizan el sistema.

---

## 🎯 Optimizaciones Propuestas

### **Fase 1: Optimización de Base de Datos** ⚡

#### 1.1 Agregar Campos Calculados a `async_matches`

**Problema:** Actualmente se consulta `async_answers` cada vez para saber si ambos respondieron.

**Solución:** Agregar campos calculados que se actualicen automáticamente con triggers.

```sql
-- Agregar campos a async_matches
ALTER TABLE async_matches
ADD COLUMN IF NOT EXISTS player1_answered_current BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS player2_answered_current BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS current_turn_player_id UUID,
ADD COLUMN IF NOT EXISTS last_answer_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Trigger para actualizar campos cuando se inserta respuesta
CREATE OR REPLACE FUNCTION update_match_answer_status()
RETURNS TRIGGER AS $$
DECLARE
  match_record async_matches%ROWTYPE;
  player1_answered BOOLEAN;
  player2_answered BOOLEAN;
BEGIN
  -- Obtener datos de la partida
  SELECT * INTO match_record
  FROM async_matches
  WHERE id = NEW.match_id;
  
  -- Verificar si ambos jugadores respondieron
  SELECT 
    COUNT(*) FILTER (WHERE player_id = match_record.player1_id) > 0,
    COUNT(*) FILTER (WHERE player_id = match_record.player2_id) > 0
  INTO player1_answered, player2_answered
  FROM async_answers
  WHERE match_id = NEW.match_id
    AND question_index = NEW.question_index;
  
  -- Actualizar campos calculados
  UPDATE async_matches
  SET 
    player1_answered_current = player1_answered,
    player2_answered_current = player2_answered,
    last_answer_time = NEW.answered_at,
    updated_at = NOW(),
    current_turn_player_id = CASE 
      WHEN player1_answered AND NOT player2_answered THEN match_record.player2_id
      WHEN player2_answered AND NOT player1_answered THEN match_record.player1_id
      WHEN player1_answered AND player2_answered THEN NULL
      ELSE match_record.current_turn_player_id
    END
  WHERE id = NEW.match_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_match_answer_status ON async_answers;
CREATE TRIGGER trigger_update_match_answer_status
AFTER INSERT ON async_answers
FOR EACH ROW
EXECUTE FUNCTION update_match_answer_status();
```

**Beneficio:** Elimina consulta a `async_answers` al verificar respuestas. Query 50-70% más rápida.

---

#### 1.2 Crear Índice Compuesto Optimizado

**Problema:** Búsquedas frecuentes de partidas abiertas no aprovechan índices compuestos.

**Solución:** Índice que cubra la query más común.

```sql
-- Índice compuesto para cargar partidas abiertas del usuario
CREATE INDEX IF NOT EXISTS idx_async_matches_user_active 
ON async_matches(player1_id, player2_id, status, current_question)
WHERE status IN ('active', 'question_active', 'ready');

-- Índice para búsqueda de matchmaking (mejora startAsyncRandomSearch)
CREATE INDEX IF NOT EXISTS idx_async_requests_matchmaking 
ON async_match_requests(status, rounds, category, difficulty, created_at DESC)
WHERE status = 'pending';

-- Índice compuesto para verificación de respuestas
CREATE INDEX IF NOT EXISTS idx_async_answers_match_question 
ON async_answers(match_id, question_index, player_id);
```

**Beneficio:** Queries 3-5x más rápidas.

---

#### 1.3 Optimizar Query de Partidas Abiertas

**Problema:** Dos queries separadas (player1 y player2) cuando podría ser una.

**Solución:** Una sola query con OR o usando un índice GIN.

```sql
-- Función helper para obtener partidas del usuario (más eficiente)
CREATE OR REPLACE FUNCTION get_user_async_matches(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  player1_id UUID,
  player1_name TEXT,
  player2_id UUID,
  player2_name TEXT,
  status TEXT,
  current_question INTEGER,
  rounds INTEGER,
  category TEXT,
  difficulty TEXT,
  player1_answered_current BOOLEAN,
  player2_answered_current BOOLEAN,
  created_at TIMESTAMPTZ,
  question_start_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.player1_id,
    m.player1_name,
    m.player2_id,
    m.player2_name,
    m.status,
    m.current_question,
    m.rounds,
    m.category,
    m.difficulty,
    m.player1_answered_current,
    m.player2_answered_current,
    m.created_at,
    m.question_start_time
  FROM async_matches m
  WHERE (m.player1_id = p_user_id OR m.player2_id = p_user_id)
    AND m.status NOT IN ('finished', 'abandoned')
    AND (m.status != 'question_active' OR 
         m.question_start_time IS NULL OR 
         m.question_start_time > NOW() - INTERVAL '16 hours')
    AND (m.created_at > NOW() - INTERVAL '24 hours' OR m.status = 'question_active')
  ORDER BY m.updated_at DESC, m.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Beneficio:** 1 query en lugar de 2, 50% más rápido.

---

### **Fase 2: Optimización Frontend** 🎨

#### 2.1 Implementar Caché de Partidas Abiertas

**Problema:** Cada vez que se abre el tab "Partidas", consulta la BD sin caché.

**Solución:** Sistema de caché con TTL y invalidación inteligente.

```javascript
// www/js/core/async-matches-cache.js
class AsyncMatchesCache {
  constructor() {
    this.cache = new Map(); // userId -> { data, timestamp, version }
    this.ttl = 30000; // 30 segundos
    this.listeners = new Map(); // userId -> Set<callbacks>
  }
  
  /**
   * Obtener partidas del caché o de BD
   * @param {string} userId - ID del usuario
   * @param {Function} fetchFn - Función para obtener de BD si no hay caché
   * @returns {Promise<Array>} Array de partidas
   */
  async get(userId, fetchFn) {
    const cached = this.cache.get(userId);
    const now = Date.now();
    
    // Si hay caché válido, retornarlo
    if (cached && (now - cached.timestamp) < this.ttl) {
      console.log('📦 Cache HIT para usuario:', userId);
      return cached.data;
    }
    
    // Si no hay caché o expiró, obtener de BD
    console.log('📦 Cache MISS, obteniendo de BD...');
    const data = await fetchFn();
    
    // Guardar en caché
    this.cache.set(userId, {
      data,
      timestamp: now,
      version: 1
    });
    
    return data;
  }
  
  /**
   * Invalidar caché de un usuario
   * @param {string} userId - ID del usuario
   */
  invalidate(userId) {
    this.cache.delete(userId);
    // Notificar a listeners
    const callbacks = this.listeners.get(userId);
    if (callbacks) {
      callbacks.forEach(cb => cb());
    }
  }
  
  /**
   * Suscribirse a cambios en partidas
   * @param {string} userId - ID del usuario
   * @param {Function} callback - Función a ejecutar cuando cambian
   */
  subscribe(userId, callback) {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }
    this.listeners.get(userId).add(callback);
    
    // Retornar función para desuscribirse
    return () => {
      this.listeners.get(userId)?.delete(callback);
    };
  }
  
  /**
   * Actualizar caché sin invalidar (optimista)
   * @param {string} userId - ID del usuario
   * @param {Function} updateFn - Función que modifica los datos
   */
  update(userId, updateFn) {
    const cached = this.cache.get(userId);
    if (cached) {
      cached.data = updateFn(cached.data);
      cached.timestamp = Date.now(); // Actualizar timestamp
    }
  }
  
  /**
   * Limpiar todo el caché
   */
  clear() {
    this.cache.clear();
  }
}

// Exportar instancia singleton
export const asyncMatchesCache = new AsyncMatchesCache();
window.asyncMatchesCache = asyncMatchesCache; // Para compatibilidad global
```

**Uso en friends_ui.js:**

```javascript
// friends_ui.js
import { asyncMatchesCache } from '../core/async-matches-cache.js';

async function loadOpenMatches() {
  const userId = socialManager.userId;
  const container = document.getElementById('openMatchesList');
  
  // Mostrar estado de carga
  container.innerHTML = '<div class="loading">Cargando partidas...</div>';
  
  try {
    // Obtener del caché o de BD
    const matches = await asyncMatchesCache.get(userId, async () => {
      // Función para obtener de BD si no hay caché
      const { data, error } = await socialManager.supabase
        .rpc('get_user_async_matches', { p_user_id: userId });
      
      if (error) throw error;
      return data || [];
    });
    
    // Renderizar partidas
    renderMatches(matches);
    
  } catch (error) {
    console.error('Error cargando partidas:', error);
    container.innerHTML = '<div class="error">Error al cargar partidas</div>';
  }
}
```

**Beneficio:** Reduce queries a BD en 70-90% para usuarios que cambian frecuentemente de tab.

---

#### 2.2 Implementar Debouncing en Recargas

**Problema:** Si el usuario hace click múltiples veces, se ejecutan múltiples queries.

**Solución:** Debouncing y flags de "loading".

```javascript
// www/js/core/debounce.js
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Uso en friends_ui.js
let isLoadingMatches = false;
const debouncedLoadMatches = debounce(loadOpenMatches, 500);

async function loadOpenMatches() {
  // Evitar múltiples llamadas simultáneas
  if (isLoadingMatches) {
    console.log('⏳ Ya hay una carga en progreso...');
    return;
  }
  
  isLoadingMatches = true;
  try {
    // ... código de carga
  } finally {
    isLoadingMatches = false;
  }
}
```

**Beneficio:** Evita queries duplicadas, mejor UX.

---

#### 2.3 Optimizar Verificación de "Ambos Respondieron"

**Problema:** Después de guardar respuesta, consulta `async_answers` para verificar si ambos respondieron.

**Solución:** Usar campos calculados de `async_matches` que ya tienen la información.

```javascript
// solo.js:saveAsyncAnswerAndCheck() - OPTIMIZADO
async function saveAsyncAnswerAndCheck(currentState, question, isCorrect, selectedAnswer) {
  // ... código de guardar respuesta ...
  
  // En lugar de consultar async_answers, actualizar async_matches y leer los campos calculados
  const { data: updatedMatch, error: matchError } = await supabaseClient
    .from('async_matches')
    .select('player1_answered_current, player2_answered_current, current_question')
    .eq('id', window.currentAsyncMatchId)
    .single();
  
  if (matchError) {
    console.error('Error obteniendo estado de partida:', matchError);
    return;
  }
  
  // Usar campos calculados (más rápido, sin query adicional a async_answers)
  const bothAnswered = updatedMatch.player1_answered_current && 
                       updatedMatch.player2_answered_current;
  
  if (bothAnswered) {
    // Ambos respondieron, avanzar
    await notifyBothAnswered(window.currentAsyncMatchId, currentState.index - 1);
    setTimeout(() => {
      if (window.nextAsyncQuestion) {
        window.nextAsyncQuestion();
      }
    }, 600);
  }
}
```

**Beneficio:** Elimina 1 query por respuesta guardada.

---

#### 2.4 Batch de Actualizaciones

**Problema:** Si el usuario responde varias preguntas rápidamente, cada una hace un UPDATE separado.

**Solución:** Batch de actualizaciones cuando sea posible.

```javascript
// www/js/core/batch-updates.js
class BatchUpdateQueue {
  constructor() {
    this.queue = [];
    this.timeout = null;
    this.flushDelay = 100; // ms
  }
  
  add(updateFn) {
    this.queue.push(updateFn);
    
    // Si no hay timeout pendiente, crear uno
    if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), this.flushDelay);
    }
  }
  
  async flush() {
    if (this.queue.length === 0) return;
    
    const updates = [...this.queue];
    this.queue = [];
    this.timeout = null;
    
    // Ejecutar todas las actualizaciones en paralelo
    await Promise.all(updates.map(fn => fn()));
  }
  
  // Flush inmediato si es necesario
  async flushImmediate() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    await this.flush();
  }
}

export const batchUpdateQueue = new BatchUpdateQueue();
```

---

### **Fase 3: Optimización de Queries** 🔍

#### 3.1 Unificar Query de Partidas Abiertas

**Código Actual:**
```javascript
// ❌ INEFICIENTE: 2 queries
const { data: player1Matches } = await supabase
  .from('async_matches')
  .select('*')
  .eq('player1_id', userId);

const { data: player2Matches } = await supabase
  .from('async_matches')
  .select('*')
  .eq('player2_id', userId);
```

**Código Optimizado:**
```javascript
// ✅ EFICIENTE: 1 query con OR
const { data: allMatches, error } = await supabase
  .from('async_matches')
  .select('*')
  .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
  .not('status', 'in', '(finished,abandoned)')
  .order('updated_at', { ascending: false })
  .limit(50);
```

**O mejor aún, usar la función RPC:**
```javascript
// ✅ MÁS EFICIENTE: Función en BD que hace todo el filtrado
const { data: matches, error } = await supabase
  .rpc('get_user_async_matches', { p_user_id: userId });
```

**Beneficio:** 50% menos queries, más rápido.

---

#### 3.2 Eliminar Consultas de Debug en Producción

**Código Actual:**
```javascript
// ❌ Múltiples consultas de debug
const { data: allMatchesRaw } = await sb.from('async_match_requests').select('*');
// ... más consultas de debug
```

**Código Optimizado:**
```javascript
// ✅ Solo consultas necesarias
if (process.env.NODE_ENV === 'development') {
  // Consultas de debug solo en desarrollo
  console.log('Debug info...');
}

// Consulta real
const { data: matches } = await sb
  .from('async_match_requests')
  .select('id, requester_id, requester_name, rounds, category, difficulty, created_at, status')
  .eq('status', 'pending')
  .neq('requester_id', me.id)
  .order('created_at', { ascending: false })
  .limit(20);
```

**Beneficio:** Elimina 2-3 queries innecesarias por carga.

---

#### 3.3 Pre-cargar Perfiles de Usuarios

**Problema:** Se consultan perfiles después de obtener partidas.

**Solución:** JOIN o caché de perfiles.

```javascript
// Opción 1: JOIN en la query (si Supabase lo soporta)
const { data: matches, error } = await supabase
  .from('async_matches')
  .select(`
    *,
    player1_profile:user_profiles!async_matches_player1_id_fkey(nickname, avatar_url),
    player2_profile:user_profiles!async_matches_player2_id_fkey(nickname, avatar_url)
  `)
  .or(`player1_id.eq.${userId},player2_id.eq.${userId}`);

// Opción 2: Caché de perfiles (más control)
class ProfileCache {
  constructor() {
    this.profiles = new Map(); // userId -> { nickname, avatar_url }
    this.ttl = 300000; // 5 minutos
  }
  
  async get(userIds) {
    const missing = userIds.filter(id => !this.profiles.has(id));
    
    if (missing.length > 0) {
      const { data } = await supabase
        .from('user_profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', missing);
      
      data?.forEach(p => this.profiles.set(p.user_id, p));
    }
    
    return userIds.map(id => this.profiles.get(id));
  }
}

const profileCache = new ProfileCache();
```

**Beneficio:** Reduce queries y mejora velocidad de carga.

---

### **Fase 4: Optimización de Renderizado** 🎨

#### 4.1 Virtualización de Lista de Partidas

**Problema:** Si hay muchas partidas, renderizar todas ralentiza la UI.

**Solución:** Renderizar solo las visibles (virtual scrolling).

```javascript
// www/js/core/virtual-list.js
class VirtualList {
  constructor(container, items, renderFn, itemHeight = 80) {
    this.container = container;
    this.items = items;
    this.renderFn = renderFn;
    this.itemHeight = itemHeight;
    this.visibleStart = 0;
    this.visibleEnd = Math.ceil(container.clientHeight / itemHeight);
    
    this.render();
    this.container.addEventListener('scroll', () => this.handleScroll());
  }
  
  handleScroll() {
    const scrollTop = this.container.scrollTop;
    const newStart = Math.floor(scrollTop / this.itemHeight);
    const newEnd = Math.min(
      newStart + Math.ceil(this.container.clientHeight / this.itemHeight) + 2,
      this.items.length
    );
    
    if (newStart !== this.visibleStart || newEnd !== this.visibleEnd) {
      this.visibleStart = newStart;
      this.visibleEnd = newEnd;
      this.render();
    }
  }
  
  render() {
    const visible = this.items.slice(this.visibleStart, this.visibleEnd);
    const offsetY = this.visibleStart * this.itemHeight;
    
    this.container.innerHTML = `
      <div style="height: ${this.items.length * this.itemHeight}px; position: relative;">
        <div style="transform: translateY(${offsetY}px);">
          ${visible.map((item, idx) => this.renderFn(item, this.visibleStart + idx)).join('')}
        </div>
      </div>
    `;
  }
}
```

**Beneficio:** Renderizado 10x más rápido con muchas partidas.

---

#### 4.2 Actualización Incremental de UI

**Problema:** Cada vez que cambia algo, se re-renderiza toda la lista.

**Solución:** Actualizar solo el elemento que cambió.

```javascript
// friends_ui.js
function updateMatchItem(matchId, updates) {
  const item = document.querySelector(`[data-match-id="${matchId}"]`);
  if (!item) return;
  
  // Actualizar solo campos específicos
  if (updates.status) {
    const statusEl = item.querySelector('.match-status');
    if (statusEl) statusEl.textContent = updates.status;
  }
  
  if (updates.currentQuestion !== undefined) {
    const progressEl = item.querySelector('.match-progress');
    if (progressEl) {
      progressEl.textContent = `${updates.currentQuestion}/${updates.rounds}`;
    }
  }
  
  // ... más actualizaciones específicas
}
```

**Beneficio:** Renderizado más fluido, menos trabajo del navegador.

---

### **Fase 5: Optimización de Polling** 🔄

#### 5.1 Polling Inteligente

**Problema:** No hay sistema de polling para actualizar partidas automáticamente.

**Solución:** Polling inteligente que se adapta a la actividad.

```javascript
// www/js/core/smart-polling.js
class SmartPolling {
  constructor(fetchFn, options = {}) {
    this.fetchFn = fetchFn;
    this.interval = options.interval || 10000; // 10 segundos
    this.maxInterval = options.maxInterval || 60000; // 1 minuto
    this.minInterval = options.minInterval || 5000; // 5 segundos
    this.backoffMultiplier = options.backoffMultiplier || 1.5;
    this.activeInterval = this.interval;
    this.timeoutId = null;
    this.isActive = false;
    this.lastUpdate = null;
  }
  
  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.poll();
  }
  
  stop() {
    this.isActive = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  
  async poll() {
    if (!this.isActive) return;
    
    try {
      const data = await this.fetchFn();
      const changed = this.hasDataChanged(data);
      
      if (changed) {
        // Si hay cambios, aumentar frecuencia (más polling)
        this.activeInterval = Math.max(
          this.minInterval,
          this.activeInterval / this.backoffMultiplier
        );
        this.lastUpdate = Date.now();
      } else {
        // Si no hay cambios, reducir frecuencia (menos polling)
        this.activeInterval = Math.min(
          this.maxInterval,
          this.activeInterval * this.backoffMultiplier
        );
      }
    } catch (error) {
      console.error('Error en polling:', error);
      // En caso de error, aumentar intervalo (backoff)
      this.activeInterval = Math.min(
        this.maxInterval,
        this.activeInterval * this.backoffMultiplier
      );
    }
    
    // Programar siguiente poll
    this.timeoutId = setTimeout(() => this.poll(), this.activeInterval);
  }
  
  hasDataChanged(newData) {
    // Comparar con datos anteriores (simplificado)
    return JSON.stringify(newData) !== JSON.stringify(this.lastData);
  }
}

// Uso en friends_ui.js
let matchesPoller = null;

function startMatchesPolling() {
  matchesPoller = new SmartPolling(async () => {
    const matches = await asyncMatchesCache.get(userId, fetchMatchesFromDB);
    return matches;
  }, {
    interval: 10000, // 10s inicial
    minInterval: 5000, // 5s mínimo
    maxInterval: 60000 // 60s máximo
  });
  
  matchesPoller.start();
}

function stopMatchesPolling() {
  if (matchesPoller) {
    matchesPoller.stop();
    matchesPoller = null;
  }
}
```

**Beneficio:** Actualización automática sin saturar la BD.

---

### **Fase 6: Optimización de Realtime** 📡

#### 6.1 Usar Supabase Realtime para Actualizaciones

**Problema:** Se usa polling en lugar de Realtime para detectar cambios.

**Solución:** Suscribirse a cambios en `async_matches`.

```javascript
// friends_ui.js
function setupMatchesRealtime() {
  const channel = supabase
    .channel('async_matches_updates')
    .on('postgres_changes', {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'async_matches',
      filter: `player1_id=eq.${userId} OR player2_id=eq.${userId}`
    }, (payload) => {
      console.log('📡 Cambio en partida detectado:', payload);
      
      // Invalidar caché
      asyncMatchesCache.invalidate(userId);
      
      // Actualizar UI solo si el tab está visible
      if (isMatchesTabVisible()) {
        loadOpenMatches();
      }
    })
    .subscribe();
  
  return channel;
}

function isMatchesTabVisible() {
  const tab = document.querySelector('.tab-btn[data-tab="matches"]');
  return tab?.classList.contains('active');
}
```

**Beneficio:** Actualizaciones instantáneas sin polling.

---

## 📊 Métricas Esperadas

### Antes vs Después

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Tiempo de carga de partidas | 2-3s | <500ms | **4-6x** |
| Queries a BD por carga | 3-5 | 1-2 | **50-70%** |
| Queries después de respuesta | 2 | 1 | **50%** |
| Queries por cambio de tab | 3-5 | 0 (cache hit) | **100%** |
| Ancho de banda por carga | ~50KB | ~20KB | **60%** |
| Renderizado de lista (100 partidas) | 500ms | 50ms | **10x** |

---

## 🎯 Priorización de Implementación

### **Fase 1: Quick Wins** (1-2 días)
1. ✅ Agregar campos calculados a `async_matches` (triggers)
2. ✅ Unificar query de partidas abiertas (OR en lugar de 2 queries)
3. ✅ Eliminar consultas de debug en producción
4. ✅ Implementar caché básico

**Impacto:** Mejora inmediata de 50-70% en velocidad.

### **Fase 2: Optimizaciones Medias** (3-5 días)
5. ✅ Crear función RPC `get_user_async_matches`
6. ✅ Implementar debouncing
7. ✅ Optimizar verificación de "ambos respondieron"
8. ✅ Pre-cargar perfiles con caché

**Impacto:** Mejora adicional de 30-40%.

### **Fase 3: Optimizaciones Avanzadas** (1 semana)
9. ✅ Implementar Realtime subscriptions
10. ✅ Virtualización de lista
11. ✅ Polling inteligente
12. ✅ Batch updates

**Impacto:** Mejora final de 20-30%, experiencia premium.

---

## 🔧 Plan de Implementación Detallado

### **Sprint 1: Base de Datos** (2 días)

**Día 1:**
- [ ] Agregar campos calculados a `async_matches`
- [ ] Crear trigger `update_match_answer_status`
- [ ] Crear función `get_user_async_matches`
- [ ] Agregar índices compuestos
- [ ] Testing de triggers y funciones

**Día 2:**
- [ ] Migrar código existente a usar nuevos campos
- [ ] Eliminar queries a `async_answers` donde sea posible
- [ ] Testing de rendimiento
- [ ] Validar que todo sigue funcionando

---

### **Sprint 2: Frontend Básico** (2 días)

**Día 1:**
- [ ] Crear `AsyncMatchesCache`
- [ ] Implementar en `loadOpenMatches()`
- [ ] Unificar query de partidas (usar OR o RPC)
- [ ] Eliminar consultas de debug

**Día 2:**
- [ ] Implementar debouncing
- [ ] Optimizar `saveAsyncAnswerAndCheck()` para usar campos calculados
- [ ] Testing
- [ ] Medir mejoras

---

### **Sprint 3: Frontend Avanzado** (3 días)

**Día 1:**
- [ ] Crear `ProfileCache`
- [ ] Pre-cargar perfiles
- [ ] Actualización incremental de UI

**Día 2:**
- [ ] Implementar Realtime subscriptions
- [ ] Integrar con caché

**Día 3:**
- [ ] Virtualización de lista (si hay muchas partidas)
- [ ] Polling inteligente (opcional)
- [ ] Testing completo

---

## ✅ Checklist de Validación

### Funcionalidad
- [ ] Todas las partidas se cargan correctamente
- [ ] Las partidas se actualizan en tiempo real
- [ ] Los perfiles se muestran correctamente
- [ ] El estado de "ambos respondieron" funciona
- [ ] Las partidas expiradas se filtran correctamente

### Performance
- [ ] Tiempo de carga < 500ms
- [ ] Máximo 2 queries por carga
- [ ] Caché funciona correctamente
- [ ] No hay queries duplicadas

### UX
- [ ] No hay "flickering" al cambiar de tab
- [ ] Actualizaciones son suaves
- [ ] Lista se renderiza rápidamente

---

## 📝 Notas Finales

1. **Compatibilidad:** Las optimizaciones son compatibles con el código existente, se pueden implementar gradualmente.

2. **Testing:** Cada fase debe tener tests antes de continuar.

3. **Rollback:** Cada cambio debe ser fácil de revertir si hay problemas.

4. **Monitoreo:** Agregar logs de performance para medir mejoras reales.

---

**Fecha de Creación:** 2024-12-28  
**Versión:** 1.0  
**Autor:** AI Assistant

