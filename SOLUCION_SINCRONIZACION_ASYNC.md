# 🔧 Solución: Problema de Sincronización en Partidas Asíncronas

## 🐛 Problema Identificado

**Síntoma:** Dos jugadores en la misma partida ven diferentes números de pregunta (ej: uno ve pregunta 2/15 y otro pregunta 3/15).

**Causa Raíz:**
1. `startAsyncGame()` usa `matchData.current_question` directamente de la BD
2. `current_question` puede estar desactualizado si un jugador sale antes de que ambos respondan
3. No hay validación de qué pregunta debe ver cada jugador según sus respuestas
4. Cuando ambos responden, solo el jugador que está en la partida ve el avance

---

## ✅ Solución Implementada

### 1. **Determinar Pregunta Correcta al Entrar**

**Antes:**
```javascript
window.STATE.index = matchData.current_question || 0; // ❌ Puede estar desincronizado
```

**Después:**
```javascript
// Usar función RPC que calcula según respuestas del jugador
const { data: rpcQuestion } = await sb.rpc('get_current_question_for_player', {
  p_match_id: matchId,
  p_player_id: currentUserId
});

window.STATE.index = rpcQuestion; // ✅ Siempre correcto
```

**Función RPC (`get_current_question_for_player`):**
- Encuentra la primera pregunta donde el jugador NO ha respondido
- Considera qué preguntas ambos jugadores completaron
- Retorna el índice correcto de la pregunta a mostrar

### 2. **Avance Sincronizado al Responder**

**Antes:**
```javascript
// Solo actualizaba current_question
await sb.from('async_matches')
  .update({ current_question: questionIndex + 1 })
  .eq('id', matchId);
// ❌ No reseteaba campos de respuesta
```

**Después:**
```javascript
// Usar función RPC que resetea campos y avanza
await sb.rpc('advance_async_question', {
  p_match_id: matchId,
  p_next_question: nextQuestionIndex
});
// ✅ Resetea player1_answered_current, player2_answered_current, etc.
```

**Función RPC (`advance_async_question`):**
- Actualiza `current_question` a la siguiente
- Resetea `player1_answered_current = FALSE`
- Resetea `player2_answered_current = FALSE`
- Actualiza `question_start_time` (timer de 12h)
- Establece `status = 'question_active'`

### 3. **Notificaciones Realtime Mejoradas**

**Antes:**
```javascript
// Solo notificaba si estabas en la partida actualmente
if (payload.payload.match_id === window.currentAsyncMatchId) {
  // Avanzar...
}
// ❌ Si saliste de la partida, no recibías la notificación
```

**Después:**
```javascript
// Verificar si la partida es tuya (aunque no estés en ella)
const { data: match } = await sb.from('async_matches')
  .select('player1_id, player2_id')
  .eq('id', matchId)
  .single();

const isMyMatch = match && (match.player1_id === currentUserId || match.player2_id === currentUserId);

if (isMyMatch) {
  // Invalidar caché y notificar
  window.asyncMatchesCache.invalidate(currentUserId);
  // Si estás en la partida, avanzar automáticamente
  // Si no estás, verás la nueva pregunta al entrar
}
```

### 4. **Prevención de Respuestas Duplicadas**

**Antes:**
```javascript
// No verificaba si ya respondió
await supabaseClient.from('async_answers').insert({...});
// ❌ Podía insertar múltiples respuestas para la misma pregunta
```

**Después:**
```javascript
// Verificar antes de insertar
const { data: existingAnswer } = await supabaseClient
  .from('async_answers')
  .select('id')
  .eq('match_id', matchId)
  .eq('player_id', userId)
  .eq('question_index', questionIndex)
  .single();

if (existingAnswer) {
  return; // Ya respondió, ignorar
}
// ✅ Solo inserta si no existe
```

### 5. **Timeout Cambiado a 12 Horas**

**Antes:** 16 horas  
**Después:** 12 horas (como solicitaste)

**Cambios:**
- `INTERVAL '16 hours'` → `INTERVAL '12 hours'` en funciones de cleanup
- Actualizado en `supabase_async_optimizations.sql`

### 6. **Limpieza de Partidas Huérfanas (24h sin aceptar)**

**Nueva Función:** `cleanup_orphan_async_matches()`
- Elimina partidas creadas hace >24h
- Que nunca fueron iniciadas (`current_question = 0`, sin respuestas)
- Se ejecuta periódicamente (cron job recomendado)

---

## 📋 Flujo Correcto Ahora

### Flujo Normal:

1. **Jugador A crea partida**
   - `status = 'waiting_start'`
   - `current_question = 0`

2. **Jugador B se une y responde pregunta 1**
   - Guarda respuesta en `async_answers`
   - Trigger actualiza: `player2_answered_current = TRUE`
   - Jugador B sale → ve "1/15 esperando al rival"

3. **Jugador A recibe notificación**
   - "Jugador B respondió pregunta 1 - Es tu turno"
   - Ve en lista: "1/15 tu turno"

4. **Jugador A entra a partida**
   - `get_current_question_for_player()` retorna `0` (pregunta 1)
   - Ve pregunta 1 y responde
   - Guarda respuesta → trigger actualiza: `player1_answered_current = TRUE`

5. **Ambos respondieron pregunta 1**
   - `checkBothAnswered()` detecta ambos respondieron
   - Llama `advance_async_question(..., 1)` → avanza a pregunta 2
   - Resetea campos: `player1_answered_current = FALSE`, `player2_answered_current = FALSE`
   - Notifica vía Realtime: "Ambos respondieron, pregunta 2 disponible"

6. **Jugador A (en partida)**
   - Recibe notificación Realtime
   - Avanza automáticamente a pregunta 2

7. **Jugador B (fuera de partida)**
   - Recibe notificación Realtime
   - Caché invalidado
   - Al entrar después, `get_current_question_for_player()` retorna `1` (pregunta 2)
   - Ve pregunta 2 ✅

**Resultado:** Ambos jugadores siempre ven la misma pregunta al entrar.

---

## 🔍 Validaciones Agregadas

1. ✅ **Verificar si ya respondió** antes de guardar respuesta
2. ✅ **Calcular pregunta correcta** al entrar (no usar `current_question` directamente)
3. ✅ **Resetear campos** al avanzar pregunta
4. ✅ **Notificar a ambos jugadores** aunque uno esté fuera de la partida
5. ✅ **Timeout de 12h** en lugar de 16h
6. ✅ **Limpieza de partidas huérfanas** (24h sin aceptar)

---

## 📝 Archivos Modificados

1. **`www/js/game/async_vs.js`**
   - `startAsyncGame()`: Usa RPC para calcular pregunta correcta
   - `checkBothAnswered()`: Usa RPC para avanzar pregunta y resetear campos
   - Listener `both_answered`: Verifica si es nuestra partida aunque no estemos en ella

2. **`www/js/game/solo.js`**
   - `saveAsyncAnswerAndCheck()`: Verifica respuesta duplicada antes de guardar

3. **`www/supabase_async_sync_fix.sql`** (NUEVO)
   - `advance_async_question()`: Avanza pregunta y resetea campos
   - `get_current_question_for_player()`: Calcula pregunta correcta para jugador
   - `has_player_answered()`: Verifica si jugador ya respondió
   - `cleanup_orphan_async_matches()`: Limpia partidas huérfanas

4. **`www/supabase_async_optimizations.sql`**
   - Actualizado timeout de 16h a 12h

---

## ⚠️ IMPORTANTE: Pasos para Aplicar

### Paso 1: Ejecutar Script SQL

Ejecutar `www/supabase_async_sync_fix.sql` en Supabase SQL Editor.

### Paso 2: Verificar Funciones

```sql
-- Verificar que existen las funciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'advance_async_question',
  'get_current_question_for_player',
  'has_player_answered',
  'cleanup_orphan_async_matches'
);
```

### Paso 3: Probar Flujo

1. Jugador A crea partida
2. Jugador B se une, responde pregunta 1, sale
3. Jugador A entra, responde pregunta 1
4. **Verificar:** Ambos ven pregunta 2 al entrar después

---

## 🎯 Resultado Esperado

✅ Ambos jugadores siempre ven la misma pregunta  
✅ No más desincronización entre clientes  
✅ Notificaciones funcionan aunque uno esté fuera  
✅ Timeout de 12h implementado  
✅ Partidas huérfanas se eliminan después de 24h  

---

**Fecha:** 2024-12-28  
**Versión:** 1.0

