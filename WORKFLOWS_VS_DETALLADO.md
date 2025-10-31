# 🔄 Workflows Detallados de Partidas VS

Este documento explica **paso a paso** y en lenguaje claro cómo funciona cada modo de partida VS, describiendo qué hace el sistema en cada momento, qué decisiones toma y cómo responde a las acciones del usuario.

---

## 📋 Índice de Workflows

1. [VS Normal - Crear Sala y Unirse](#1-vs-normal---crear-sala-y-unirse)
2. [VS Normal - Matchmaking Aleatorio](#2-vs-normal---matchmaking-aleatorio)
3. [VS Normal - Durante la Partida](#3-vs-normal---durante-la-partida)
4. [VS Normal - Responder Pregunta](#4-vs-normal---responder-pregunta)
5. [VS Normal - Finalizar Partida](#5-vs-normal---finalizar-partida)
6. [VS con Amigos - Invitación](#6-vs-con-amigos---invitación)
7. [VS Asíncrono - Búsqueda Random](#7-vs-asíncrono---búsqueda-random)
8. [VS Asíncrono - Aceptar Request](#8-vs-asíncrono---aceptar-request)
9. [VS Asíncrono - Iniciar Partida](#9-vs-asíncrono---iniciar-partida)
10. [VS Asíncrono - Responder y Avanzar](#10-vs-asíncrono---responder-y-avanzar)

---

## 1. VS Normal - Crear Sala y Unirse

### 🔷 Workflow: Crear Sala

#### Paso a Paso

**1. Usuario selecciona modo VS y configura partida**

**Qué ve el usuario:**
- Hace click en la pestaña "VS" en el menú principal
- Ve aparecer los controles de configuración:
  - Un selector para elegir la categoría (Películas, Ciencia, Deportes, etc.)
  - Un selector para elegir cuántas preguntas jugar (por defecto: 10)
  - Un selector para elegir la dificultad (Fácil, Medio, Difícil)
  - Un botón grande que dice "Crear Sala"

**Qué hace el sistema:**
- Muestra la interfaz de configuración de partida VS
- Pre-llena los valores por defecto
- Espera a que el usuario configure y haga click en "Crear Sala"

---

**2. Usuario hace click en "Crear Sala"**
```javascript
// main.js:onHost() - Línea 955
onHost = async () => {
  // 1. Validaciones
  if (!supabase) { 
    alert('El modo VS no está disponible sin conexión'); 
    return; 
  }
  
  // 2. Obtener configuración de UI
  const opponentType = document.querySelector('#opponentPills .pill.active')?.dataset?.val || 'random';
  const cat = document.getElementById('categorySel')?.value;
  if(!cat || cat === '') { 
    alert('Elegí una categoría'); 
    return; 
  }
  
  // 3. Tracking de inicio de juego
  const { newAchievements, leveledUp } = await trackEvent('game_start');
  updatePlayerXPBar();
  if(leveledUp) toast("🎉 ¡Subiste de Nivel! 🎉");
  
  // 4. Reset de estado VS
  resetVsState();
  setVsActive(true);
  setVSName(getPlayerNameForGame()); // Obtiene nombre del jugador
  
  // 5. Obtener configuración
  const rounds = parseInt(document.getElementById('vsRounds')?.value, 10);
  const diff = document.querySelector('#diffPills .pill.active')?.dataset.val;
  
  // 6. Verificar si hay invitación pendiente a amigo
  const pendingFriendId = Storage.get('pending_friend_invite');
  const pendingFriendName = Storage.get('pending_friend_name');
  
  // 7. Si es Random y NO hay amigo pendiente → Matchmaking
  if (opponentType === 'random' && !pendingFriendId){
    await startRandomMatch({ rounds, category: cat, difficulty: diff });
    // ... (continúa en sección de matchmaking)
    return;
  }
  
  // 8. Si NO es Random o hay amigo → Crear sala directamente
  const code = await createMatch({ rounds, category: cat, difficulty: diff });
  console.log('Sala VS creada con código:', code);
  
  // 9. Si hay invitación pendiente a amigo
  if (pendingFriendId && (window.socialManager || supabase)) {
    // Enviar invitación
    const useMgr = window.socialManager && typeof window.socialManager.inviteToSyncGame === 'function';
    const result = useMgr
      ? await window.socialManager.inviteToSyncGame(pendingFriendId, code)
      : await window.sendGameInvite(pendingFriendId, code);
    
    if (result.success) {
      toast(`Invitación enviada a ${pendingFriendName}`);
      const badge = document.getElementById('vsCodeBadge');
      if (badge) badge.textContent = `Esperando a ${pendingFriendName}...`;
      Storage.set('last_vs_friend_id', pendingFriendId);
    }
    
    // Limpiar invitación pendiente
    Storage.remove('pending_friend_invite');
    Storage.remove('pending_friend_name');
  } else {
    // Mostrar código de sala
    const badge = document.getElementById('vsCodeBadge');
    if (badge) badge.textContent = `Sala: ${code}`;
  }
  
  // 10. Configurar total de preguntas
  setVsQTotal(rounds);
}
```

**3. El sistema crea la sala**

**Qué ve el usuario:**
- Ve aparecer un código de sala en la pantalla
- Ve que el botón cambia a "Esperando oponente..." o similar

**Qué hace el sistema internamente:**

**Paso 1: Generar código único**
- Genera un código aleatorio de 5 caracteres (solo letras y números)
- Ejemplo: "ABC12" o "XK9M3"
- Este código identifica únicamente tu sala

**Paso 2: Configurar la partida localmente**
- Marca que tú eres el "host" (anfitrión) de la partida
- Guarda la configuración que elegiste:
  - Cantidad de preguntas (ej: 10)
  - Categoría (ej: "Películas")
  - Dificultad (ej: "Fácil")

**Paso 3: Conectar a Supabase Realtime**
- Abre un "canal de comunicación" en tiempo real con Supabase
- El canal se identifica con el código de tu sala: `room:ABC12`
- Se prepara para recibir y enviar mensajes instantáneos

**Paso 4: Anunciar presencia**
- El sistema anuncia que estás en la sala
- Envía tu información:
  - Tu nombre de jugador
  - Tu rol: "host" (anfitrión)
  - Tu ID de usuario (si estás autenticado)
- Cualquier otro jugador que se una verá que estás ahí

**Paso 5: Cambiar estado a "esperando"**
- Marca la partida como "waiting" (esperando)
- Notifica a la interfaz que estás esperando un oponente
- Actualiza la barra de estado superior

**Paso 6: Retornar el código**
- Devuelve el código generado para mostrarlo al usuario
- Este código es lo que otros jugadores necesitan para unirse

**4. El sistema actualiza la interfaz**

**Qué ve el usuario:**
- Ve el código de la sala aparecer en un badge o etiqueta
- Ve la barra de estado superior actualizarse

**Qué hace el sistema internamente:**

**Paso 1: Verificar el estado actual**
- Si el estado NO es "esperando", "jugando" o "buscando":
  - Restaura el botón a su texto original ("Crear Sala")
  - Limpia el código de sala mostrado
  
**Paso 2: Si el estado es "esperando"**
- Actualiza el texto del badge para mostrar el código
- Actualiza la barra de estado superior con el mensaje "VS: waiting · ABC12"
- Mantiene visible que estás en modo de espera

### 🔷 Workflow: Unirse a Sala

#### Paso a Paso

**1. Usuario ingresa código y hace click en "Unirse"**
```javascript
// main.js:onJoin() - Línea 1078
onJoin = async () => {
  // 1. Validaciones
  if (!supabase) { 
    alert('El modo VS no está disponible sin conexión'); 
    return; 
  }
  
  // 2. Obtener código de input
  const code = document.getElementById('inputVsCode')?.value?.trim();
  if (!code) { 
    alert('Ingresá un código de sala'); 
    return; 
  }
  
  // 3. Intentar unirse
  try {
    await joinMatch(code);
    setVsActive(true);
    document.getElementById('vsSection').style.display = 'none';
    document.getElementById('gameSection').style.display = 'block';
  } catch (error) {
    console.error('Error uniéndose a la sala:', error);
    alert('Error al unirse a la sala. Verificá el código.');
  }
}
```

**2. El sistema intenta unirse a la sala**

**Qué ve el usuario:**
- Ve un indicador de carga o espera
- Si funciona: ve que cambia a la pantalla de juego
- Si falla: ve un mensaje de error

**Qué hace el sistema internamente:**

**Paso 1: Normalizar el código**
- Convierte el código a mayúsculas (ej: "abc12" → "ABC12")
- Elimina espacios en blanco
- Esto asegura que "ABC12", "abc12" y "ABC 12" sean el mismo código

**Paso 2: Configurar como invitado**
- Marca que NO eres el host (anfitrión)
- Eres un "guest" (invitado) en esta sala

**Paso 3: Conectar al canal de comunicación**
- Intenta conectarse al canal de Supabase Realtime de esa sala
- El canal se identifica como: `room:ABC12`
- Si el canal existe (la sala existe), la conexión será exitosa
- Si el canal no existe (código incorrecto), fallará y mostrará error

**Paso 4: Anunciar tu presencia**
- Una vez conectado, anuncia que estás en la sala
- Envía tu información:
  - Tu nombre de jugador
  - Tu rol: "guest" (invitado)
  - Tu ID de usuario
- El host y cualquier otro jugador verán que te uniste

**Paso 5: Cambiar estado a "esperando"**
- Marca la partida como "waiting" (esperando)
- Notifica a la interfaz que estás esperando
- El sistema ahora sabe que estás en la sala y listo para jugar

**3. El sistema detecta que hay jugadores en la sala**

**Qué ve el usuario:**
- Si es el host: ve que apareció alguien en la sala
- Si es el invitado: el host ve que te uniste
- Cuando hay 2 jugadores, la partida comienza automáticamente

**Qué hace el sistema internamente:**

**Paso 1: Obtener lista de jugadores conectados**
- Supabase Realtime envía información actualizada de quién está en la sala
- El sistema recibe un objeto con todos los jugadores:
  - Cada jugador tiene un ID único
  - Su nombre
  - Su rol (host o guest)

**Paso 2: Actualizar lista local de jugadores**
- El sistema guarda la lista de jugadores en su memoria
- Compara con la lista anterior para detectar cambios
- Si entró alguien nuevo o se fue alguien, lo registra

**Paso 3: Inicializar puntuaciones**
- Para cada jugador en la sala, crea un registro de puntuación
- Todos empiezan con 0 respuestas correctas
- Guarda el nombre de cada jugador para mostrarlo después

**Paso 4: Configurar sistema de respuestas**
- Marca que necesita 2 respuestas por pregunta (para partidas de 2 jugadores)
- Esto permite que el sistema sepa cuándo avanzar a la siguiente pregunta

**Paso 5: Verificar si se puede iniciar la partida**
- Si eres el host Y el estado es "esperando" Y hay 2 o más jugadores:
  - **La partida inicia automáticamente**
  - El sistema genera las preguntas
  - Comienza la primera pregunta

**Paso 6: Detectar desconexiones**
- Si alguien se desconecta durante la partida:
  - El sistema detecta que hay menos de 2 jugadores
  - Si el host se desconecta: el invitado gana automáticamente
  - Si el invitado se desconecta: el host gana automáticamente
  - Termina la partida y muestra los resultados

**4. El sistema inicia la partida automáticamente**

**Qué ve el usuario:**
- Cuando hay 2 jugadores, la partida comienza automáticamente
- Aparece la primera pregunta en pantalla
- Los timers empiezan a contar

**Qué hace el sistema internamente:**

**Paso 1: Generar las preguntas**
- El sistema genera un "mazo" de preguntas según la configuración:
  - Usa la categoría elegida (ej: Películas)
  - Usa la cantidad de preguntas elegida (ej: 10)
  - Usa la dificultad elegida (ej: Fácil)
- Cada pregunta incluye:
  - El texto de la pregunta
  - 4 opciones de respuesta
  - El índice de la respuesta correcta

**Paso 2: Preparar el contador de preguntas**
- Inicializa el contador de preguntas en -1 (antes de empezar)
- Esto permite que la primera pregunta sea la número 0

**Paso 3: Resetear puntuaciones**
- Todos los jugadores empiezan con 0 respuestas correctas
- Crea un registro para cada jugador con su nombre

**Paso 4: Cambiar estado a "jugando"**
- Marca la partida como "playing" (jugando)
- Notifica a la interfaz que la partida ha comenzado
- Actualiza la barra de estado

**Paso 5: Anunciar inicio a todos los jugadores**
- Envía un mensaje a todos los jugadores conectados informando que la partida comenzó
- Incluye cuántas preguntas se jugarán
- Todos los jugadores reciben este mensaje al mismo tiempo

**Paso 6: Mostrar la primera pregunta**
- Llama a la función que muestra la primera pregunta
- La pregunta se muestra a ambos jugadores simultáneamente

---

## 2. VS Normal - Matchmaking Aleatorio

### 🔷 Workflow: Buscar Rival Aleatorio

#### Paso a Paso

**1. Usuario selecciona "Random" y hace click en "Buscar partida"**
```javascript
// main.js:onHost() - Línea 976
if (opponentType === 'random' && !pendingFriendId){
  try {
    await startRandomMatch({ rounds, category: cat, difficulty: diff });
    const badge = document.getElementById('vsCodeBadge');
    if (badge) badge.textContent = 'Emparejando...';
    document.getElementById('btnVsHost').style.display = 'none';
    document.getElementById('btnVsCancel').style.display = 'block';
    return; // El flujo continúa cuando se encuentre rival
  } catch (e){
    console.error('Error iniciando matchmaking:', e);
    toast('No se pudo iniciar el emparejamiento');
    return;
  }
}
```

**2. `startRandomMatch()` se ejecuta**
```javascript
// vs.js:startRandomMatch() - Línea 471
export async function startRandomMatch({ rounds=10, category='all', difficulty='easy' } = {}) {
  // 1. Activar búsqueda random
  randomSearch.active = true;
  randomSearch.matched = false;
  randomSearch.filters = { rounds, category, difficulty };
  randomSearch.startTime = Date.now();
  
  // 2. Notificar estado a UI
  cb.onStatus({ 
    status: 'searching', 
    code: null, 
    isHost: false, 
    qIndex: -1 
  });
  
  // 3. Configurar timeout de 30 segundos
  randomSearch.timeout = setTimeout(() => {
    if (randomSearch.active && !randomSearch.matched) {
      console.log('⏰ Timeout de búsqueda random - no se encontró rival');
      cancelRandomSearch();
      cb.onStatus({ 
        status: 'timeout', 
        message: 'No se encontró rival. Intenta de nuevo.' 
      });
    }
  }, 30000);
  
  // 4. Asegurar canal de matchmaking
  await ensureMMChannel();
  //   → Crea canal: sb.channel('mm:vs')
  //   → Suscribe a eventos: 'broadcast' event:'mm' → handleMM()
  
  // 5. Enviar búsqueda inicial
  console.log('📡 Enviando búsqueda inicial...', { 
    pid: me.pid, 
    filters: randomSearch.filters 
  });
  mmSend({ 
    type: 'looking', 
    pid: me.pid, 
    filters: randomSearch.filters, 
    ts: isoNow() 
  });
  //   → Todos los jugadores buscando reciben este mensaje
  
  // 6. Reenviar cada 5 segundos para mantener búsqueda activa
  const keepAlive = setInterval(() => {
    if (!randomSearch.active || randomSearch.matched) {
      clearInterval(keepAlive);
      return;
    }
    console.log('📡 Reenviando búsqueda...', { 
      pid: me.pid, 
      filters: randomSearch.filters 
    });
    mmSend({ 
      type: 'looking', 
      pid: me.pid, 
      filters: randomSearch.filters, 
      ts: isoNow() 
    });
  }, 5000);
}
```

**3. `handleMM()` procesa mensajes de matchmaking**
```javascript
// vs.js:handleMM() - Línea 119
async function handleMM(p){
  if (!p || typeof p!== 'object') return;
  
  // Ignorar si ya estamos en partida
  if (match.status === 'playing' || match.status === 'waiting') return;
  
  // ===== MENSAJE: 'looking' (alguien está buscando) =====
  if (p.type === 'looking'){
    console.log('🔍 Jugador buscando encontrado:', p);
    
    // Solo considerar mientras yo busco también
    if (!randomSearch.active || randomSearch.matched) {
      console.log('❌ No estoy buscando o ya estoy emparejado');
      return;
    }
    
    // No emparejar conmigo mismo
    if (!p.pid || p.pid === me.pid) {
      console.log('❌ Es mi propio PID o no tiene PID');
      return;
    }
    
    // Verificar que los filtros coinciden
    if (!filtersEqual(p.filters, randomSearch.filters)) {
      console.log('❌ Filtros no coinciden:', { 
        misFiltros: randomSearch.filters, 
        susFiltros: p.filters 
      });
      return;
    }
    
    console.log('✅ Jugador compatible encontrado!');
    
    // Desempate determinista: el de PID menor hostea
    const iAmHost = (String(me.pid) < String(p.pid));
    console.log('🏠 ¿Soy host?', iAmHost, { 
      miPID: me.pid, 
      suPID: p.pid 
    });
    
    // Solo si soy host Y aún no creé la partida
    if (iAmHost && !match.code){
      try{
        console.log('🎮 Creando partida...');
        
        // Crear partida
        const code = await createMatch({
          rounds: randomSearch.filters.rounds,
          category: randomSearch.filters.category,
          difficulty: randomSearch.filters.difficulty
        });
        
        randomSearch.matched = true;
        console.log('✅ Partida creada, notificando al oponente...');
        
        // Notificar al otro jugador que encontré match
        mmSend({ 
          type: 'match_found', 
          code, 
          hostPid: me.pid, 
          guestPid: p.pid, 
          filters: randomSearch.filters, 
          ts: isoNow() 
        });
      } catch(e){
        console.error('❌ Error creando partida:', e);
        // Si falla, cancelar búsqueda
        randomSearch.active = false;
        randomSearch.matched = false;
      }
    }
  }
  
  // ===== MENSAJE: 'match_found' (partida encontrada) =====
  if (p.type === 'match_found'){
    if (!p.code) return;
    
    // Verificar si es para mí
    const isForMe = (p.guestPid === me.pid || p.hostPid === me.pid);
    if (!isForMe) return;
    
    // Si NO soy el host, soy el invitado → unirme
    if (p.hostPid !== me.pid){
      try{
        await joinMatch(p.code);
        randomSearch.matched = true;
      } catch(e){
        // Error al unirse
      }
    }
  }
}
```

---

## 3. VS Normal - Durante la Partida

### 🔷 Workflow: Enviar Pregunta

#### Paso a Paso

**1. `nextQuestionHost()` se ejecuta**
```javascript
// vs.js:nextQuestionHost() - Línea 379
function nextQuestionHost(){
  // 1. Incrementar índice de pregunta
  match.qIndex++;
  // Ejemplo: -1 → 0 (primera pregunta)
  
  // 2. Limpiar timer anterior
  clearTimer();
  
  // 3. Verificar si hay más preguntas
  if (!match.deck || match.qIndex >= match.rounds || match.qIndex >= match.deck.length){
    endMatchHost();
    return;
  }
  
  // 4. Obtener pregunta actual
  const q = match.deck[match.qIndex];
  // Ejemplo:
  // {
  //   q: "¿Quién dirigió Pulp Fiction?",
  //   options: ["Steven Spielberg", "Quentin Tarantino", "Martin Scorsese", "Christopher Nolan"],
  //   answer: 1,
  //   category: "movies",
  //   difficulty: "easy",
  //   img: "https://..."
  // }
  
  // 5. Calcular timestamp de inicio (500ms en el futuro para sincronización)
  const startAt = new Date(nowUTCms() + 500).toISOString();
  
  // 6. Preparar estado de pregunta (reset answeredSet)
  prepareQuestionState();
  //   → match.answeredSet = new Set()
  //   → match.expectedAnswers = 2
  
  // 7. Broadcast pregunta a todos los jugadores
  broadcast({
    type: 'question',
    index: match.qIndex,          // Índice de pregunta (0, 1, 2, ...)
    time: TIMER_PER_QUESTION,     // 15 segundos
    startAt,                       // Timestamp ISO de inicio
    payload: { 
      q: q.q,                      // Texto de pregunta
      options: q.options,          // Array de opciones
      ans: q.answer,               // Índice de respuesta correcta
      cat: q.category,             // Categoría
      diff: q.difficulty,          // Dificultad
      img: q.img || (q.media && q.media.src) || null // Imagen (si existe)
    }
  });
  
  // 8. Mostrar pregunta localmente (si soy host)
  cb.onQuestion({
    index: match.qIndex,
    question: q.q,
    options: q.options,
    timeLeft: TIMER_PER_QUESTION,
    answer: q.answer,
    media: q.img || (q.media && q.media.src) || null
  });
  
  // 9. Iniciar timer sincronizado
  startTimer(startAt, TIMER_PER_QUESTION);
}
```

**2. `startTimer()` inicia cuenta regresiva**
```javascript
// vs.js:startTimer() - Línea 223
function startTimer(startAtISO, dur){
  clearTimer(); // Limpiar timer anterior
  
  // 1. Calcular tiempo transcurrido
  const startAt = new Date(startAtISO).getTime(); // Timestamp en ms
  const now = nowUTCms(); // Timestamp actual en ms
  const elapsed = Math.max(0, Math.floor((now - startAt) / 1000)); // Segundos transcurridos
  
  // 2. Calcular tiempo restante
  const remaining = Math.max(0, dur - elapsed);
  
  // 3. Calcular timestamp de fin
  endAt = now + remaining * 1000;
  
  // 4. Notificar callback con tiempo restante
  cb.onTimerTick({ remaining });
  
  // 5. Iniciar intervalo para actualizar cada 250ms
  timer = setInterval(() => {
    const rem = Math.max(0, Math.ceil((endAt - nowUTCms()) / 1000));
    cb.onTimerTick({ remaining: rem });
    
    // Si se agotó el tiempo
    if (rem <= 0){
      clearTimer();
      // Si soy host, avanzar a siguiente pregunta
      if (match.isHost) nextQuestionHost();
    }
  }, 250);
}
```

**3. `renderVSQuestion()` muestra pregunta en UI**
```javascript
// handlers/vs-handlers.js:renderVSQuestion() - Línea 37
export function renderVSQuestion(q) {
  setVsActive(true);
  showGameUI(); // Muestra gameArea, oculta configCard
  
  // 1. Actualizar texto de pregunta
  const qEl = DOMUtils.getElement('qText');
  if (qEl) qEl.textContent = q.question || '—';
  
  // 2. Manejar imagen (si existe)
  const mediaEl = DOMUtils.getElement('qMedia');
  if (mediaEl) {
    const img = mediaEl.querySelector('img');
    if (q.media || q.img) {
      if (!img) {
        const newImg = document.createElement('img');
        newImg.src = q.media || q.img;
        mediaEl.appendChild(newImg);
      } else {
        img.src = q.media || q.img;
      }
      mediaEl.style.display = 'block';
    } else {
      mediaEl.style.display = 'none';
    }
  }
  
  // 3. Limpiar opciones anteriores
  const optionsEl = DOMUtils.getElement('options');
  if (optionsEl) optionsEl.innerHTML = '';
  
  // 4. Crear botones de opciones
  if (q.options && optionsEl) {
    q.options.forEach((txt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = txt;
      btn.dataset.choice = i;
      
      // Event listener para responder
      btn.addEventListener('click', () => {
        answer(i); // Llama a answer() con el índice de la opción
      });
      
      optionsEl.appendChild(btn);
    });
  }
}
```

---

## 4. VS Normal - Responder Pregunta

### 🔷 Workflow: Responder y Sincronizar

#### Paso a Paso

**1. Usuario hace click en una opción**
```javascript
// Botón de opción → click event → answer(i)

// vs.js:answer() - Línea 317
export function answer(choiceIdx){
  // Verificar si estamos en modo asíncrono (edge case)
  const currentState = window.STATE || STATE;
  if (currentState && currentState.mode === 'async') {
    // Manejar en modo async (ver sección de async)
    return;
  }
  
  // Modo VS normal
  if (match.status !== 'playing') return;
  
  // 1. Broadcast respuesta a todos los jugadores
  broadcast({ 
    type: 'answer', 
    q: match.qIndex,              // Índice de pregunta actual
    choice: (typeof choiceIdx === 'number' ? choiceIdx : null), 
    from: me.pid,                 // PID del jugador que responde
    ts: isoNow()                  // Timestamp ISO
  });
  
  // 2. Si soy host, registrar mi propia respuesta localmente
  // (Por si el broadcast no vuelve a self)
  if (match.isHost){
    registerAnswerOnHost({ 
      from: me.pid, 
      q: match.qIndex, 
      choice: choiceIdx 
    });
  }
}
```

**2. `handlePacket()` procesa mensaje de respuesta**
```javascript
// vs.js:handlePacket() - Línea 433
function handlePacket(p){
  if (!p || typeof p !== 'object') return;
  
  // ... (otros tipos de mensaje)
  
  if (p.type === 'answer'){
    // El host registra cada respuesta recibida
    registerAnswerOnHost(p);
    return;
  }
  
  // ... (otros tipos)
}
```

**3. `registerAnswerOnHost()` procesa respuesta**
```javascript
// vs.js:registerAnswerOnHost() - Línea 413
function registerAnswerOnHost(p){
  // 1. Validaciones
  if (!match.isHost || match.status !== 'playing') return;
  if (!p || p.q !== match.qIndex || p.from == null) return;
  if (match.answeredSet.has(p.from)) return; // Ya respondió
  
  // 2. Registrar respuesta
  match.answeredSet.add(p.from);
  
  // 3. Obtener pregunta actual
  const q = match.deck?.[match.qIndex];
  
  // 4. Si la respuesta es correcta, actualizar score
  if (q && typeof p.choice === 'number' && p.choice === q.answer){
    match.scores[p.from] = match.scores[p.from] || { name: 'Jugador', correct: 0 };
    match.scores[p.from].correct += 1;
  }
  
  // 5. Si ambos jugadores respondieron, avanzar automáticamente
  if (match.answeredSet.size >= match.expectedAnswers){
    // Pequeño delay para que ambos vean los colores de respuesta
    setTimeout(() => nextQuestionHost(), 600);
  }
}
```

**4. UI muestra colores de respuesta**
```javascript
// handlers/vs-handlers.js - Al hacer click en opción
btn.addEventListener('click', () => {
  const correctIdx = (q.answer ?? q.correct ?? q.ans ?? null);
  
  // Marcar opción seleccionada
  btn.classList.add('selected');
  
  // Si es correcta → verde
  if (i === correctIdx) {
    btn.classList.add('correct');
    // ... efectos visuales ...
  } else {
    // Si es incorrecta → roja, y mostrar correcta en verde
    btn.classList.add('wrong');
    if (correctIdx !== null && optionsEl.children[correctIdx]) {
      optionsEl.children[correctIdx].classList.add('correct');
    }
    // ... efectos visuales ...
  }
  
  // Llamar a answer()
  answer(i);
});
```

---

## 5. VS Normal - Finalizar Partida

### 🔷 Workflow: Terminar y Mostrar Resultados

#### Paso a Paso

**1. Se agotan todas las preguntas**
```javascript
// vs.js:nextQuestionHost() - Línea 382
function nextQuestionHost(){
  match.qIndex++;
  clearTimer();
  
  // Verificar si hay más preguntas
  if (!match.deck || match.qIndex >= match.rounds || match.qIndex >= match.deck.length){
    endMatchHost(); // ← Aquí termina la partida
    return;
  }
  
  // ... mostrar siguiente pregunta
}
```

**2. `endMatchHost()` se ejecuta**
```javascript
// vs.js:endMatchHost() - Línea 405
function endMatchHost(){
  // 1. Cambiar estado a 'finished'
  setStatus('finished');
  
  // 2. Limpiar timer
  clearTimer();
  
  // 3. Obtener scores finales
  const scores = match.scores || {};
  // Ejemplo:
  // {
  //   "pid123": { name: "Jugador1", correct: 7 },
  //   "pid456": { name: "Jugador2", correct: 5 }
  // }
  
  // 4. Broadcast fin de partida
  broadcast({ 
    type: 'end', 
    scores, 
    ts: isoNow() 
  });
  
  // 5. Notificar callback local
  cb.onEnd({ 
    scores, 
    mePid: me.pid 
  });
}
```

**3. `handlePacket()` procesa mensaje de fin**
```javascript
// vs.js:handlePacket() - Línea 457
if (p.type === 'end'){
  clearTimer();
  setStatus('finished');
  cb.onEnd({ 
    scores: p.scores || null, 
    mePid: me.pid 
  });
}
```

**4. `showResults()` muestra resultados**
```javascript
// handlers/vs-handlers.js:showResults() - Línea 143
export async function showResults({ scores, mePid, reason, winnerPid }) {
  setVsActive(false);
  resetVsState();
  
  // 1. Obtener ID del amigo si es partida de amigos
  let friendId = null;
  const pendingFriendId = Storage.get('last_vs_friend_id');
  
  // 2. Limpiar invitaciones pendientes
  if (window.socialManager) {
    try {
      // Marcar invitaciones como completadas
      const { data: invitations } = await window.socialManager.supabase
        .from('game_invitations')
        .select('*')
        .or(`from_user_id.eq.${window.socialManager.userId},to_user_id.eq.${window.socialManager.userId}`)
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString());
      
      if (invitations && invitations.length > 0) {
        for (const inv of invitations) {
          await window.socialManager.supabase
            .from('game_invitations')
            .update({ status: 'completed' })
            .eq('id', inv.id);
          
          // Guardar friendId para actualizar rankings
          if (inv.from_user_id === window.socialManager.userId) {
            friendId = inv.to_user_id;
          } else {
            friendId = inv.from_user_id;
          }
        }
      }
      
      if (!friendId) friendId = pendingFriendId;
    } catch (error) {
      console.log('Error limpiando invitaciones:', error);
    }
  }
  
  // 3. Limpiar badge de espera
  const badge = DOMUtils.getElement('vsCodeBadge');
  if (badge) {
    badge.textContent = 'Sala: —';
    badge.style.color = '';
  }
  
  // 4. Convertir scores a array para ordenar
  const scoresArray = Object.entries(scores || {}).map(([pid, data]) => ({
    pid,
    ...data
  }));
  
  // 5. Ordenar por puntuación (mayor a menor)
  scoresArray.sort((a, b) => b.correct - a.correct);
  
  // 6. Determinar ganador
  const winner = scoresArray[0];
  const isWinner = winner && winner.pid === mePid;
  const isTie = scoresArray.length > 1 && 
                 scoresArray[0].correct === scoresArray[1].correct;
  
  // 7. Actualizar rankings de amigos si es partida de amigos
  if (friendId && window.socialManager) {
    await window.socialManager.updateFriendRanking(friendId, isWinner);
  }
  
  // 8. Trackear evento de fin de partida
  if (isWinner && !isTie) {
    await trackEvent('vs_win');
  } else if (!isWinner && !isTie) {
    await trackEvent('vs_loss');
  }
  
  // 9. Mostrar modal de resultados
  const fs = DOMUtils.getElement('fsVSResult');
  if (fs) {
    fs.innerHTML = `
      <div class="result-header">
        <h2>${isTie ? '🤝 Empate' : (isWinner ? '🎉 ¡Ganaste!' : '😔 Perdiste')}</h2>
      </div>
      <div class="result-scores">
        ${scoresArray.map((s, idx) => `
          <div class="score-item ${s.pid === mePid ? 'you' : ''}">
            <span class="rank">${idx + 1}</span>
            <span class="name">${s.name}</span>
            <span class="score">${s.correct}/${scoresArray.length > 0 ? Object.keys(scores).length * 10 : 0}</span>
          </div>
        `).join('')}
      </div>
      <button class="btn-primary" onclick="window.backToHome()">Volver al Menú</button>
    `;
    fs.style.display = 'block';
  }
  
  // 10. Limpiar estado
  showConfigUI();
}
```

---

## 6. VS con Amigos - Invitación

### 🔷 Workflow: Invitar Amigo a Partida

#### Paso a Paso

**1. Usuario abre panel de amigos y hace click en "Desafiar"**
```javascript
// friends_ui.js:inviteFriendToSync() - Línea 824
async function inviteFriendToSync(friendId, friendNameParam = null) {
  try {
    // 1. Obtener nombre del amigo
    let friendName = 'tu amigo';
    if (friendNameParam) {
      friendName = friendNameParam;
    } else if (socialManager && socialManager.friends) {
      const friend = socialManager.friends.find(f => f.user_id === friendId);
      friendName = friend?.nickname || 'tu amigo';
    }
    
    // 2. Cerrar panel de amigos
    const friendsPanel = document.getElementById('friendsPanel');
    if (friendsPanel) friendsPanel.classList.remove('open');
    
    // 3. Guardar invitación pendiente en Storage
    localStorage.setItem('pending_friend_invite', friendId);
    localStorage.setItem('pending_friend_name', friendName);
    
    // 4. Mostrar toast
    showToast(`Configura la partida contra ${friendName}`);
    
    // 5. Cambiar a modo VS
    const vsSeg = document.querySelector('#modeSeg .seg[data-val="vs"]');
    if (vsSeg) {
      document.querySelectorAll('#modeSeg .seg').forEach(s => s.classList.remove('active'));
      vsSeg.classList.add('active');
      vsSeg.click(); // Disparar evento de cambio de modo
      
      // 6. Pre-configurar UI después de un delay
      setTimeout(() => {
        // Asegurar que está en modo "crear"
        const hostSeg = document.querySelector('#vsModeToggle .seg[data-val="host"]');
        if (hostSeg && !hostSeg.classList.contains('active')) {
          document.querySelectorAll('#vsModeToggle .seg').forEach(s => s.classList.remove('active'));
          hostSeg.classList.add('active');
          hostSeg.click();
        }
        
        // 7. Actualizar texto del botón
        const btnHost = document.getElementById('btnVsHost');
        if (btnHost) {
          btnHost.textContent = `Crear partida contra ${friendName}`;
          btnHost.classList.add('friend-vs');
        }
        
        // 8. Actualizar badge
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
```

**2. Usuario configura partida y hace click en "Crear Sala"**
```javascript
// main.js:onHost() - Línea 1023
if (pendingFriendId && (window.socialManager || supabase)) {
  // 1. Crear partida primero (obtener código)
  const code = await createMatch({ rounds, category: cat, difficulty: diff });
  
  // 2. Enviar invitación al amigo
  const useMgr = window.socialManager && typeof window.socialManager.inviteToSyncGame === 'function';
  const result = useMgr
    ? await window.socialManager.inviteToSyncGame(pendingFriendId, code)
    : await window.sendGameInvite(pendingFriendId, code);
  
  // 3. socialManager.inviteToSyncGame() ejecuta:
  // social.js:inviteToSyncGame() - Línea 653
  async inviteToSyncGame(friendId, roomCode) {
    const { data, error } = await supabase
      .from('game_invitations')
      .insert({
        from_user_id: userId,      // Mi ID
        to_user_id: friendId,       // ID del amigo
        room_code: roomCode,        // Código de sala (ej: "ABC12")
        game_type: 'vs',            // Tipo de juego
        status: 'pending',          // Estado: pendiente
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Expira en 5 min
      })
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }
  
  // 4. Si la invitación se envió correctamente
  if (result.success) {
    toast(`Invitación enviada a ${pendingFriendName}`);
    const badge = document.getElementById('vsCodeBadge');
    if (badge) badge.textContent = `Esperando a ${pendingFriendName}...`;
    Storage.set('last_vs_friend_id', pendingFriendId);
  }
  
  // 5. Limpiar invitación pendiente
  Storage.remove('pending_friend_invite');
  Storage.remove('pending_friend_name');
}
```

**3. Amigo recibe notificación**
```javascript
// friends_ui.js - Suscripción a game_invitations (línea 1017)
// En initFriendsSystem o similar, se suscribe a cambios en tiempo real:

supabase
  .channel('friends-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'game_invitations',
    filter: `to_user_id=eq.${userId}` // Solo invitaciones para mí
  }, (payload) => {
    console.log('Nueva invitación recibida:', payload.new);
    
    // Mostrar notificación en UI
    showInvitationNotification(payload.new);
    
    // Opcional: reproducir sonido
    playSound('notification');
  })
  .subscribe();
```

**4. Amigo acepta invitación**
```javascript
// friends_ui.js - Al hacer click en "Aceptar" invitación
async function acceptInvitation(invitationId) {
  const { data: invitation } = await supabase
    .from('game_invitations')
    .select('*')
    .eq('id', invitationId)
    .single();
  
  if (!invitation) return;
  
  // 1. Actualizar estado de invitación
  await supabase
    .from('game_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitationId);
  
  // 2. Cambiar a modo VS
  const vsSeg = document.querySelector('#modeSeg .seg[data-val="vs"]');
  if (vsSeg) {
    vsSeg.click();
  }
  
  // 3. Cambiar a modo "unirse"
  const joinSeg = document.querySelector('#vsModeToggle .seg[data-val="join"]');
  if (joinSeg) {
    joinSeg.click();
  }
  
  // 4. Pre-llenar código de sala
  const inputCode = document.getElementById('inputVsCode');
  if (inputCode) {
    inputCode.value = invitation.room_code;
  }
  
  // 5. Opcional: auto-unirse
  setTimeout(() => {
    document.getElementById('btnVsJoin').click();
  }, 500);
}
```

---

## 7. VS Asíncrono - Búsqueda Random

### 🔷 Workflow: Buscar Partida Asíncrona Aleatoria

#### Paso a Paso

**1. Usuario selecciona "Random Offline" y hace click en "Buscar partida"**
```javascript
// main.js:onHost() - Línea 992
if (opponentType === 'random_async' && !pendingFriendId){
  try {
    const result = await startAsyncRandomSearch({ 
      rounds, 
      category: cat, 
      difficulty: diff 
    });
    
    const badge = document.getElementById('vsCodeBadge');
    if (result.status === 'match_created') {
      // Se encontró rival inmediatamente
      if (badge) badge.textContent = `Partida: ${result.matchId}`;
      toast(`¡Partida asíncrona creada contra ${result.opponent}!`);
    } else {
      // Esperando que alguien acepte
      if (badge) badge.textContent = 'Esperando rival...';
      toast('Solicitud enviada. Esperando que alguien acepte...');
    }
    return;
  } catch (e){
    console.error('Error iniciando matchmaking asíncrono:', e);
    toast('No se pudo iniciar el emparejamiento asíncrono');
    return;
  }
}
```

**2. `startAsyncRandomSearch()` se ejecuta**
```javascript
// async_vs.js:startAsyncRandomSearch() - Línea 1168
export async function startAsyncRandomSearch({ rounds=10, category='all', difficulty='easy' } = {}){
  if (!sb) throw new Error('Supabase no inicializado');
  
  // 1. Verificar que tenemos UUID válido
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(me.id)) {
    throw new Error('ID de usuario no es un UUID válido');
  }
  
  // 2. Buscar partidas pendientes disponibles
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
    .neq('requester_id', me.id)              // No mis propias solicitudes
    .eq('rounds', rounds)                    // Mismo número de rondas
    .eq('category', category)                // Misma categoría
    .eq('difficulty', difficulty)            // Misma dificultad
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) throw error;
  
  // 3. Si hay jugadores disponibles
  if (availablePlayers && availablePlayers.length > 0) {
    // Encontrar jugador aleatorio
    const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    console.log('🎯 Jugador encontrado:', randomPlayer);
    
    // Aceptar automáticamente la solicitud
    return await acceptAsyncInvitation(randomPlayer.id);
  } else {
    // No hay jugadores disponibles → crear nueva solicitud
    console.log('📝 No hay jugadores disponibles, creando nueva solicitud...');
    return await createAsyncRequest({ rounds, category, difficulty });
  }
}
```

**3. `createAsyncRequest()` crea solicitud**
```javascript
// async_vs.js:createAsyncRequest() - Línea 1234
export async function createAsyncRequest({ rounds=10, category='all', difficulty='easy' } = {}){
  if (!sb) throw new Error('Supabase no inicializado');
  
  // 1. Preparar datos de solicitud
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
  
  // 2. Insertar en base de datos
  const { data, error } = await sb
    .from('async_match_requests')
    .insert([requestData])
    .select()
    .single();
  
  if (error) throw error;
  
  console.log('✅ Solicitud creada:', data);
  
  // 3. Configurar timeout de 5 minutos (opcional)
  setTimeout(async () => {
    await cancelAsyncRequest(data.id);
  }, 5 * 60 * 1000);
  
  // 4. Notificar callback
  cb.onStatus({ 
    status: 'waiting_for_opponent', 
    requestId: data.id,
    message: 'Esperando que alguien acepte tu solicitud...'
  });
  
  return data;
}
```

---

## 8. VS Asíncrono - Aceptar Request

### 🔷 Workflow: Aceptar Solicitud de Partida Asíncrona

#### Paso a Paso

**1. Usuario ve lista de partidas disponibles y hace click en "Unirse"**
```javascript
// async_vs.js:joinAsyncMatch() - Línea 894
export async function joinAsyncMatch(matchId){
  if (!sb) throw new Error('Supabase no inicializado');
  
  try {
    // 1. Aceptar request (esto crea la partida)
    const result = await acceptRandomRequest(matchId);
    
    if (result.status === 'match_created') {
      // 2. Ocultar lista de partidas
      const listContainer = document.getElementById('asyncMatchesList');
      if (listContainer) listContainer.style.display = 'none';
      
      // 3. Mostrar información de partida
      const vsCodeBadge = document.getElementById('vsCodeBadge');
      if (vsCodeBadge) {
        vsCodeBadge.textContent = `Partida: ${result.matchId}`;
      }
      
      // 4. Toast de éxito
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
```

**2. `acceptRandomRequest()` se ejecuta**
```javascript
// async_vs.js:acceptRandomRequest() - Línea 931
export async function acceptRandomRequest(requestId){
  if (!sb) throw new Error('Supabase no inicializado');
  
  // 1. Verificar estado actual de la solicitud
  const { data: currentRequest, error: currentError } = await sb
    .from('async_match_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  
  if (currentError) throw currentError;
  if (!currentRequest) throw new Error('Partida no encontrada');
  
  // 2. Validaciones
  if (currentRequest.status !== 'pending') {
    throw new Error(`La partida ya no está pendiente. Estado: ${currentRequest.status}`);
  }
  if (currentRequest.accepter_id) {
    throw new Error(`La partida ya fue aceptada por: ${currentRequest.accepter_name || currentRequest.accepter_id}`);
  }
  
  // 3. Validar UUID
  if (!me.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(me.id)) {
    me.id = generateUUID();
  }
  
  // 4. Actualizar solicitud como aceptada
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
  
  if (updateError) throw updateError;
  if (!updateResult || updateResult.length === 0) {
    throw new Error('No se pudo actualizar la partida');
  }
  
  const updatedRequest = updateResult[0];
  
  // 5. Generar ID de partida
  const matchId = generateUUID();
  
  // 6. Generar deck compartido (IMPORTANTE: aquí se genera)
  const sharedDeck = buildDeckSingle(
    updatedRequest.category, 
    updatedRequest.rounds, 
    updatedRequest.difficulty
  );
  console.log('🎲 Deck generado:', sharedDeck.length, 'preguntas');
  
  // 7. Crear partida asíncrona en BD
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
      deck: sharedDeck, // ← Deck guardado en BD como JSONB
      created_at: isoNow()
    })
    .select()
    .single();
  
  if (matchError) throw matchError;
  
  // 8. Eliminar solicitud de async_match_requests
  await sb
    .from('async_match_requests')
    .delete()
    .eq('id', requestId);
  
  // 9. Notificar al creador via Realtime
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
  
  // 10. Notificar callbacks
  cb.onStatus({ 
    status: 'match_created', 
    matchId: match.id,
    opponent: updatedRequest.requester_name,
    rounds: updatedRequest.rounds,
    category: updatedRequest.category,
    difficulty: updatedRequest.difficulty
  });
  
  // 11. Iniciar automáticamente el juego para quien acepta
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
```

---

## 9. VS Asíncrono - Iniciar Partida

### 🔷 Workflow: Cargar y Mostrar Partida Asíncrona

#### Paso a Paso

**1. `startAsyncGame()` se ejecuta**
```javascript
// async_vs.js:startAsyncGame() - Línea 422
export async function startAsyncGame(matchId) {
  console.log('🎮 Iniciando juego asíncrono:', matchId);
  
  try {
    // 1. Obtener datos de la partida desde BD
    const { data: matchData, error: matchError } = await sb
      .from('async_matches')
      .select('*')
      .eq('id', matchId)
      .single();
    
    if (matchError) throw matchError;
    
    // 2. Configurar estado global
    window.currentAsyncMatchId = matchId;
    window.currentGameMode = 'async';
    window.currentAsyncMatch = matchData;
    
    // 3. Configurar window.STATE para modo asíncrono
    if (window.STATE) {
      window.STATE.mode = 'async';
      window.STATE.status = 'waiting_for_opponent_answer';
      window.STATE.category = matchData.category;
      window.STATE.difficulty = matchData.difficulty;
      window.STATE.rounds = matchData.rounds;
      window.STATE.matchId = matchId;
      
      // 4. Cargar progreso desde BD
      window.STATE.index = matchData.current_question || 0;
      window.STATE.total = matchData.rounds;
      window.STATE.score = 0;
      
      // 5. Cargar deck desde BD
      if (matchData.deck && Array.isArray(matchData.deck)) {
        window.STATE.deck = matchData.deck;
      } else if (typeof matchData.deck === 'string') {
        window.STATE.deck = JSON.parse(matchData.deck);
      }
      
      // 6. Guardar deck también en window.currentAsyncMatch para compatibilidad
      if (!window.currentAsyncMatch.deck && window.STATE.deck) {
        window.currentAsyncMatch.deck = window.STATE.deck;
      }
    }
    
    // 7. Notificar que el jugador entró a la pregunta
    await notifyQuestionStarted(matchId, matchData);
    
    // 8. Iniciar el juego usando startSolo()
    console.log('🎮 Iniciando startSolo...');
    window.startSolo(); // ← Reutiliza lógica de solo.js
    
    // 9. Toast de éxito
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
```

**2. `startSolo()` detecta modo asíncrono**
```javascript
// solo.js:startSolo() - Línea 211
export function startSolo(){
  // ... código previo ...
  
  // 1. Obtener estado actual
  const currentState = window.STATE || STATE;
  
  // 2. Si es modo asíncrono, cargar deck desde BD
  if (currentState.mode === 'async') {
    console.log('🎯 Modo asíncrono detectado en startSolo()');
    
    // Verificar que tenemos matchId
    if (!window.currentAsyncMatchId) {
      console.error('❌ No hay matchId para modo asíncrono');
      return;
    }
    
    // Cargar deck desde window.currentAsyncMatch
    if (window.currentAsyncMatch && window.currentAsyncMatch.deck && window.currentAsyncMatch.deck.length > 0) {
      currentState.deck = window.currentAsyncMatch.deck;
      console.log('✅ Deck cargado desde currentAsyncMatch:', currentState.deck.length, 'preguntas');
    } else if (currentState.deck && currentState.deck.length > 0) {
      console.log('✅ Deck ya está en currentState.deck:', currentState.deck.length, 'preguntas');
    } else {
      console.error('❌ No se encontró deck para modo asíncrono');
      return;
    }
    
    // Cargar progreso
    currentState.index = window.currentAsyncMatch?.current_question || 0;
    currentState.total = window.currentAsyncMatch?.rounds || currentState.deck.length;
    
    console.log('📊 Estado asíncrono configurado:', {
      matchId: window.currentAsyncMatchId,
      currentQuestion: currentState.index,
      totalQuestions: currentState.total,
      deckLength: currentState.deck.length
    });
  }
  
  // ... continúa con renderizado de pregunta ...
}
```

**3. Pregunta se renderiza**
```javascript
// solo.js - renderiza pregunta normalmente
// La pregunta se obtiene de: currentState.deck[currentState.index]
// El índice viene de: matchData.current_question (BD)

// Los botones de opciones tienen listeners que llaman a:
// saveAsyncAnswerAndCheck() cuando se hace click
```

---

## 10. VS Asíncrono - Responder y Avanzar

### 🔷 Workflow: Guardar Respuesta y Verificar Ambos Respondieron

#### Paso a Paso

**1. Usuario hace click en una opción**
```javascript
// solo.js - al hacer click en opción (línea 297)
async function handleOptionClick(i) {
  // ... código previo ...
  
  // Si es modo asíncrono
  if (currentState.mode === 'async') {
    await saveAsyncAnswerAndCheck(currentState, question, i === q.answer, i);
  }
  
  // ... código para modo normal ...
}
```

**2. `saveAsyncAnswerAndCheck()` se ejecuta**
```javascript
// solo.js:saveAsyncAnswerAndCheck() - Línea 565
async function saveAsyncAnswerAndCheck(currentState, question, isCorrect, selectedAnswer) {
  console.log('💾 saveAsyncAnswerAndCheck llamado:', {
    hasMatchId: !!window.currentAsyncMatchId,
    matchId: window.currentAsyncMatchId
  });
  
  // 1. Verificar que tenemos matchId
  if (!window.currentAsyncMatchId) {
    console.error('❌ No hay matchId para guardar respuesta');
    return;
  }
  
  // 2. Obtener player_id del usuario actual
  const userId = window.currentUser?.id || window.socialManager?.userId;
  const playerId = window.currentAsyncMatch?.player1_id === userId ? 
    window.currentAsyncMatch?.player1_id : 
    window.currentAsyncMatch?.player2_id;
  
  if (!playerId) {
    console.error('❌ No se pudo determinar player_id');
    return;
  }
  
  // 3. Guardar respuesta en BD
  try {
    const answerData = {
      match_id: window.currentAsyncMatchId,
      player_id: playerId,
      question_index: currentState.index - 1, // Índice de pregunta (0-based)
      answer: selectedAnswer.toString(),
      time_spent: 0
    };
    
    const { data: insertData, error } = await supabaseClient
      .from('async_answers')
      .insert([answerData])
      .select();
    
    if (error) {
      console.error('❌ Error guardando respuesta:', error);
      return;
    }
    
    console.log('✅ Respuesta guardada correctamente');
    
    // 4. Verificar si ambos jugadores respondieron
    const { data: answers, error: queryError } = await supabaseClient
      .from('async_answers')
      .select('player_id, id, answer, answered_at')
      .eq('match_id', window.currentAsyncMatchId)
      .eq('question_index', currentState.index - 1);
    
    if (queryError) {
      console.error('❌ Error consultando respuestas:', queryError);
      return;
    }
    
    // 5. Extraer IDs de jugadores que respondieron
    const answeredPlayers = answers?.map(a => a.player_id) || [];
    const allPlayers = [
      window.currentAsyncMatch.player1_id, 
      window.currentAsyncMatch.player2_id
    ];
    
    // 6. Verificar si ambos respondieron
    const bothAnswered = allPlayers.every(id => answeredPlayers.includes(id));
    
    if (bothAnswered) {
      console.log('🎉 ¡Ambos jugadores respondieron! Avanzando automáticamente...');
      
      // 7. Notificar al otro jugador via Realtime
      await notifyBothAnswered(window.currentAsyncMatchId, currentState.index - 1);
      
      // 8. Pequeño delay para que ambos vean los colores
      setTimeout(() => {
        console.log('🔄 Avanzando a siguiente pregunta...');
        if (window.nextAsyncQuestion) {
          window.nextAsyncQuestion();
        }
      }, 600);
    } else {
      console.log('⏳ Esperando a que el rival responda...');
      // Actualizar estado para mostrar "Esperando rival..."
    }
  } catch (error) {
    console.error('Error en saveAsyncAnswerAndCheck:', error);
  }
}
```

**3. `notifyBothAnswered()` notifica via Realtime**
```javascript
// solo.js:notifyBothAnswered() - Línea 877
async function notifyBothAnswered(matchId, questionIndex) {
  const supabaseClient = window.supabaseClient;
  if (!supabaseClient) return;
  
  try {
    await supabaseClient
      .channel('async_match_notifications')
      .send({
        type: 'broadcast',
        event: 'both_answered',
        payload: {
          match_id: matchId,
          question_index: questionIndex,
          timestamp: new Date().toISOString()
        }
      });
    
    console.log('📡 Notificación de ambos respondieron enviada');
  } catch (error) {
    console.error('Error enviando notificación:', error);
  }
}
```

**4. `nextAsyncQuestion()` avanza a siguiente pregunta**
```javascript
// async_vs.js:nextAsyncQuestion() - Línea 184
async function nextAsyncQuestion() {
  console.log('🔄 nextAsyncQuestion llamado');
  
  const currentState = window.STATE || STATE;
  if (!currentState || currentState.mode !== 'async') {
    console.error('❌ No hay estado async válido');
    return;
  }
  
  // 1. Limpiar set de respuestas
  if (window.asyncAnsweredSet) {
    window.asyncAnsweredSet.clear();
  }
  
  // 2. Incrementar índice de pregunta
  currentState.index++;
  
  // 3. Actualizar current_question en BD
  if (window.currentAsyncMatchId) {
    try {
      await sb
        .from('async_matches')
        .update({ current_question: currentState.index })
        .eq('id', window.currentAsyncMatchId);
      
      console.log('💾 Progreso actualizado en BD:', {
        matchId: window.currentAsyncMatchId,
        currentQuestion: currentState.index
      });
    } catch (error) {
      console.error('❌ Error actualizando progreso:', error);
    }
  }
  
  // 4. Verificar si hay más preguntas
  if (currentState.index >= currentState.total) {
    console.log('🏁 No hay más preguntas, terminando partida');
    await endAsyncGame();
    return;
  }
  
  // 5. Renderizar siguiente pregunta
  const question = currentState.deck[currentState.index];
  if (question) {
    console.log('❓ Renderizando pregunta:', currentState.index + 1);
    // startSolo() detectará el cambio de índice y renderizará automáticamente
    // O se puede llamar directamente a la función de renderizado
  } else {
    console.error('❌ No se encontró la pregunta en el índice:', currentState.index);
  }
}
```

**5. `endAsyncGame()` termina partida**
```javascript
// async_vs.js:endAsyncGame() - Línea 242
async function endAsyncGame() {
  const currentState = window.STATE || STATE;
  if (!currentState || currentState.mode !== 'async') {
    console.error('❌ No hay estado async válido');
    return;
  }
  
  // 1. Marcar partida como terminada en BD
  if (window.currentAsyncMatchId && sb) {
    try {
      await sb
        .from('async_matches')
        .update({ 
          status: 'finished',
          finished_at: isoNow()
        })
        .eq('id', window.currentAsyncMatchId);
      
      console.log('💾 Partida marcada como terminada');
    } catch (error) {
      console.error('❌ Error marcando partida como terminada:', error);
    }
  }
  
  // 2. Limpiar estado
  currentState.mode = 'idle';
  currentState.status = 'idle';
  currentState.index = 0;
  currentState.score = 0;
  currentState.deck = [];
  currentState.matchId = null;
  
  // 3. Limpiar variables globales
  window.currentAsyncMatchId = null;
  window.currentGameMode = null;
  window.currentAsyncMatch = null;
  
  // 4. Mostrar menú principal
  showConfigUI();
  setStatus('Listo', false);
  
  console.log('✅ Partida asíncrona terminada');
}
```

---

## 📊 Diagrama de Estados

### VS Normal

```
idle → waiting → playing → finished
         ↓
    (abandoned/peer-left)
```

### VS Asíncrono

```
idle → waiting_for_opponent → match_created → question_active → finished
                                      ↓
                            waiting_for_opponent_answer
                                      ↓
                                  both_answered
                                      ↓
                            (next question o finished)
```

---

## 🔍 Puntos Clave de la Lógica

### 1. **Sincronización de Timers**
- VS Normal: Timer sincronizado usando `startAt` ISO timestamp
- VS Async: Timer local de 15s por pregunta, pero el timeout real es 2 horas

### 2. **Generación de Deck**
- VS Normal: Deck generado al iniciar partida (`startMatchHost()`)
- VS Async: Deck generado al aceptar request (`acceptRandomRequest()`) y guardado en BD

### 3. **Tracking de Respuestas**
- VS Normal: Usa `answeredSet` (Set local) en el host
- VS Async: Usa tabla `async_answers` en BD, consulta cada vez

### 4. **Avance Automático**
- VS Normal: Cuando `answeredSet.size >= expectedAnswers` → `nextQuestionHost()`
- VS Async: Cuando ambos jugadores tienen entrada en `async_answers` → `nextAsyncQuestion()`

### 5. **Manejo de Desconexión**
- VS Normal: Detecta con presence sync, marca como `abandoned`
- VS Async: Usa timeouts (16h sin responder = abandono)

---

**Fecha de Documentación:** 2024-12-28  
**Última Actualización:** 2024-12-28  
**Versión:** 1.0

