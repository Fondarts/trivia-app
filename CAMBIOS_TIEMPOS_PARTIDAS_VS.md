# Cambios Implementados - Tiempos de Partidas VS Asíncronas

## 📋 Resumen de Cambios

Se han implementado los siguientes cambios según los requerimientos:

### 1. ✅ Solicitudes de Partida: 48 horas para aceptar

**Antes:**
- Código: 24 horas
- BD: 5 minutos (default)
- Timeout cancelación: 5 minutos

**Ahora:**
- **48 horas** para aceptar una solicitud
- Si pasan las 48h sin aceptar, la solicitud se **BORRA** completamente de la BD (no solo se cancela)
- Se eliminó el timeout de cancelación de 5 minutos (ahora solo se usa `expires_at`)

**Archivos modificados:**
- `www/js/game/async_vs.js`: Cambiado a 48 horas, eliminado timeout de 5 minutos
- `www/supabase_async_tables.sql`: Default cambiado a 48 horas, función `cleanup_expired_requests()` ahora BORRA en lugar de cancelar

---

### 2. ✅ Partidas Aceptadas: Timer de 6 horas por pregunta

**Antes:**
- 2 horas por pregunta
- Expiración de partida activa: 12 horas desde última pregunta

**Ahora:**
- **6 horas** por pregunta (cada jugador tiene 6h desde que la pregunta está disponible)
- Cuando se acepta una partida, el reloj se resetea
- `question_start_time` se establece cuando el primer jugador entra a la primera pregunta
- Cada vez que se avanza a una nueva pregunta, `question_start_time` se resetea a `NOW()`

**Archivos modificados:**
- `www/js/game/async_vs.js`: Cambiado `ASYNC_TIMEOUT_HOURS` de 2 a 6
- `www/js/player/friends_ui.js`: Actualizado tiempo de visualización a 6 horas
- `www/supabase_async_sync_fix.sql`: Comentario actualizado a 6 horas
- `www/supabase_async_optimizations.sql`: Expiración cambiada a 6 horas

---

### 3. ✅ Timeout Automático: Marca respuesta como incorrecta

**Nuevo comportamiento:**
- Si un jugador no responde en 6 horas, se marca automáticamente como incorrecta
- La respuesta se guarda con `answer = '-1'` (valor especial que indica timeout)
- Después de marcar la respuesta automática, se avanza a la siguiente pregunta
- El otro jugador recibe notificación de que es su turno

**Implementación:**
- Función `timeoutAsyncQuestion()` mejorada en `async_vs.js`
- Nueva función SQL `check_and_process_async_timeouts()` en `supabase_async_timeout_fix.sql`
- La función SQL puede ejecutarse periódicamente (cron job) para procesar timeouts automáticamente

**Archivos nuevos:**
- `www/supabase_async_timeout_fix.sql`: Función para verificar y procesar timeouts automáticamente

---

## 🔄 Flujo Completo

### Ejemplo de Dinámica:

1. **Jugador A crea partida**
   - Solicitud creada con `expires_at = NOW() + 48 horas`
   - Si nadie acepta en 48h, la solicitud se BORRA automáticamente

2. **Jugador B acepta la partida (dentro de las 48h)**
   - Partida creada en `async_matches`
   - `question_start_time = NULL` (se establecerá cuando alguien entre)

3. **Jugador B entra inmediatamente y responde pregunta 1**
   - Si es la primera vez que alguien entra (`question_start_time IS NULL`), se establece `question_start_time = NOW()`
   - Jugador B responde → respuesta guardada
   - Jugador A recibe notificación

4. **Jugador A tiene 6 horas para responder**
   - Desde que `question_start_time` fue establecido
   - Si no responde en 6h:
     - Se guarda respuesta automática incorrecta (`answer = '-1'`)
     - Se avanza a pregunta 2
     - Jugador B recibe notificación de que es su turno

5. **Jugador B recibe notificación y responde pregunta 2**
   - Cuando ambos responden pregunta 1, `question_start_time` se resetea a `NOW()` para pregunta 2
   - Jugador B responde pregunta 2
   - Jugador A tiene 6h para responder pregunta 2
   - Y así sucesivamente...

---

## 📝 Archivos Modificados

### JavaScript:
- ✅ `www/js/game/async_vs.js`
  - Tiempo de pregunta: 2h → 6h
  - Tiempo de solicitud: 24h → 48h
  - Eliminado timeout de cancelación de 5 minutos
  - Mejorada función `timeoutAsyncQuestion()` para marcar respuesta incorrecta automáticamente
  - Agregada lógica para establecer `question_start_time` cuando el primer jugador entra

- ✅ `www/js/player/friends_ui.js`
  - Tiempo de visualización actualizado a 6 horas

### SQL:
- ✅ `www/supabase_async_tables.sql`
  - Default `expires_at`: 5 minutos → 48 horas
  - Función `cleanup_expired_requests()` ahora BORRA en lugar de cancelar

- ✅ `www/supabase_async_sync_fix.sql`
  - Comentario actualizado a 6 horas

- ✅ `www/supabase_async_optimizations.sql`
  - Expiración de partidas activas: 12h → 6h
  - Expiración de partidas inactivas: 24h → 48h

- ✅ `www/supabase_async_timeout_fix.sql` (NUEVO)
  - Función `check_and_process_async_timeouts()` para procesar timeouts automáticamente

---

## ⚙️ Configuración de Cron Jobs (Opcional)

Para que los timeouts se procesen automáticamente, puedes configurar un cron job en Supabase:

```sql
-- Verificar timeouts cada hora
SELECT cron.schedule('check-async-timeouts', '0 * * * *', 'SELECT check_and_process_async_timeouts();');

-- Limpiar solicitudes expiradas cada hora
SELECT cron.schedule('cleanup-expired-requests', '0 * * * *', 'SELECT cleanup_expired_requests();');
```

**Nota:** Requiere la extensión `pg_cron` habilitada en Supabase.

---

## 🧪 Testing Recomendado

1. **Solicitudes expiradas:**
   - Crear una solicitud
   - Esperar 48 horas (o modificar `expires_at` manualmente para testing)
   - Verificar que se borre automáticamente

2. **Timeout de preguntas:**
   - Crear y aceptar una partida
   - Un jugador responde
   - Esperar 6 horas (o modificar `question_start_time` manualmente)
   - Verificar que se guarde respuesta automática incorrecta
   - Verificar que se avance a la siguiente pregunta

3. **Reset de timer:**
   - Verificar que `question_start_time` se establece cuando el primer jugador entra
   - Verificar que se resetea cada vez que se avanza a una nueva pregunta

---

## ⚠️ Notas Importantes

1. **Respuestas automáticas:** Se guardan con `answer = '-1'` para indicar timeout. Asegúrate de que el código que procesa resultados trate este valor como incorrecto.

2. **Compatibilidad:** Las partidas existentes seguirán funcionando, pero se aplicarán los nuevos tiempos a partidas nuevas.

3. **Notificaciones:** Considera agregar notificaciones cuando queden menos de 1 hora para responder.

4. **UI/UX:** Los mensajes de tiempo restante ahora mostrarán 6 horas en lugar de 2 horas.

