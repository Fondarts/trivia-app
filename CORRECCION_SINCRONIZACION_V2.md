# 🔧 Corrección de Sincronización V2

## 🐛 Problema Identificado

El progreso mostrado en la lista de partidas (`X/15 preguntas`) estaba usando `match.current_question` directamente de la BD, lo que causaba desincronización porque:

1. **`current_question` puede estar desactualizado** si un jugador sale antes de que ambos respondan
2. **Race conditions** cuando ambos jugadores avanzan simultáneamente
3. **El avance local** en `nextAsyncQuestion()` actualizaba `current_question` pero solo para el jugador que estaba en la partida

## ✅ Solución Implementada

### 1. **Calcular Progreso Real desde `async_answers`**

**Antes:**
```javascript
// Usaba current_question directamente
${match.current_question || 0}/${match.rounds} preguntas
```

**Después:**
```javascript
// Calcula cuántas preguntas completó (ambos respondieron)
const { data: allAnswers } = await supabase
  .from('async_answers')
  .select('question_index, player_id')
  .eq('match_id', match.id);

// Contar preguntas donde ambos respondieron
let completedQuestions = 0;
for (let i = 0; i < match.rounds; i++) {
  const player1Answered = answers.includes(player1_id);
  const player2Answered = answers.includes(player2_id);
  if (player1Answered && player2Answered) {
    completedQuestions++;
  }
}

match._displayQuestion = completedQuestions; // Usar este valor

// Mostrar en UI
${match._displayQuestion}/${match.rounds} preguntas
```

### 2. **No Actualizar `current_question` en `nextAsyncQuestion()`**

**Antes:**
```javascript
// Actualizaba current_question localmente
currentState.index++;
await sb.from('async_matches')
  .update({ current_question: currentState.index })
  .eq('id', matchId);
```

**Después:**
```javascript
// Solo avanza localmente, no actualiza BD
// El avance en BD se hace en checkBothAnswered() usando advance_async_question()
currentState.index++;
// NO actualizar current_question aquí
```

**Razón:** El progreso debe calcularse desde `async_answers`, no desde `current_question`. Solo `advance_async_question()` debe actualizar `current_question` cuando ambos responden.

### 3. **Calcular Estado de Turno Correctamente**

**Antes:**
```javascript
// Usaba current_question para determinar turno
if (match.current_turn_player_id === meId) {
  // Es mi turno
}
```

**Después:**
```javascript
// Calcula desde respuestas reales
// En loadOpenMatches:
const answersForCurrent = answersByQuestion[completedQuestions] || [];
match._meAnswered = answersForCurrent.includes(meId);
match._opponentAnswered = answersForCurrent.includes(opponentId);

match._finalIsMyTurn = match._opponentAnswered && !match._meAnswered;

// En createMatchItem:
const finalIsMyTurn = match._finalIsMyTurn;
```

---

## 📋 Flujo Correcto Ahora

### Cálculo de Progreso:

1. **Al cargar lista de partidas:**
   ```javascript
   // Para cada partida:
   // 1. Obtener todas las respuestas
   const allAnswers = await getAnswers(matchId);
   
   // 2. Contar preguntas completadas (ambos respondieron)
   let completed = 0;
   for (question 0..rounds-1) {
     if (player1Responded && player2Responded) {
       completed++;
     }
   }
   
   // 3. Mostrar progreso real
   match._displayQuestion = completed; // Ej: 2/15
   ```

2. **Al entrar a partida:**
   ```javascript
   // Usar función RPC get_current_question_for_player()
   // que calcula según respuestas del jugador
   const questionToShow = await rpc('get_current_question_for_player', {
     matchId,
     playerId
   });
   ```

3. **Al avanzar pregunta:**
   ```javascript
   // Solo cuando ambos responden
   // Usar advance_async_question() que:
   // - Actualiza current_question
   // - Resetea campos de respuesta
   // - Notifica a ambos jugadores
   ```

---

## 🎯 Resultado

✅ **Ambos jugadores ven el mismo progreso** (calculado desde `async_answers`)  
✅ **No más desincronización** por `current_question` desactualizado  
✅ **Progreso siempre correcto** aunque un jugador salga y vuelva a entrar  

---

**Fecha:** 2024-12-28  
**Versión:** 2.0

