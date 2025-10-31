# 📋 Instrucciones: Aplicar Optimizaciones a Partidas Asíncronas

## 🎯 Resumen

Se han creado los siguientes archivos y modificaciones para optimizar el sistema de partidas asíncronas:

1. **Base de Datos:** `www/supabase_async_optimizations.sql`
2. **Caché Frontend:** `www/js/core/async-matches-cache.js`
3. **Utilidades:** `www/js/core/debounce.js`
4. **Modificaciones:** Varios archivos actualizados

---

## 📝 Paso 1: Aplicar Cambios en Base de Datos

### 1.1 Ejecutar Script SQL en Supabase

1. Abre Supabase Dashboard → SQL Editor
2. Copia y pega el contenido completo de `www/supabase_async_optimizations.sql`
3. Ejecuta el script

**Qué hace este script:**
- ✅ Agrega campos calculados a `async_matches`
- ✅ Crea trigger que actualiza campos automáticamente
- ✅ Crea función RPC `get_user_async_matches()` optimizada
- ✅ Crea índices para mejor rendimiento
- ✅ Migra datos existentes

**Verificación:**
```sql
-- Verificar que los campos existen
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'async_matches' 
AND column_name IN ('player1_answered_current', 'player2_answered_current');

-- Verificar que el trigger existe
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'async_answers';

-- Verificar que la función RPC existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_user_async_matches';
```

---

## 📝 Paso 2: Verificar que los Archivos Están Cargados

### 2.1 Verificar HTML

El archivo `www/index.html` debe tener estos scripts agregados:
```html
<script type="module" src="./js/core/async-matches-cache.js"></script>
<script type="module" src="./js/core/debounce.js"></script>
```

### 2.2 Verificar que los Módulos Funcionan

Abre la consola del navegador (F12) y verifica:
```javascript
// Debe existir
window.asyncMatchesCache // Debe ser un objeto
window.debounce // Debe ser una función
```

---

## 📝 Paso 3: Probar las Optimizaciones

### 3.1 Probar Caché

1. Abre la aplicación
2. Ve a "Partidas Abiertas"
3. En consola, ejecuta:
```javascript
// Ver información del caché
window.asyncMatchesCache.getInfo()
```
4. Abre y cierra el tab "Partidas" varias veces
5. La segunda vez debería ser instantánea (usando caché)

### 3.2 Probar Campos Calculados

1. Inicia una partida asíncrona
2. Responde una pregunta
3. En consola de Supabase, verifica:
```sql
-- Ver que los campos se actualizaron automáticamente
SELECT 
  id,
  current_question,
  player1_answered_current,
  player2_answered_current,
  current_turn_player_id,
  updated_at
FROM async_matches
WHERE id = 'tu-match-id';
```

### 3.3 Probar Función RPC

1. Abre "Partidas Abiertas"
2. En consola del navegador, revisa los logs:
   - Debe decir "✅ Usando función RPC optimizada" si funciona
   - Si dice "⚠️ Función RPC no disponible", el fallback usa queries OR (también optimizado)

---

## 📝 Paso 4: Monitorear Performance

### 4.1 Verificar Tiempos de Carga

**Antes de optimizaciones:**
- Cargar partidas: 2-3 segundos
- Múltiples queries a BD

**Después de optimizaciones:**
- Primera carga: ~500ms (1 query optimizada)
- Cargas repetidas: ~50ms (caché)

### 4.2 Verificar Queries en Network Tab

1. Abre DevTools → Network
2. Filtra por "async_matches"
3. Carga partidas abiertas
4. Debe haber:
   - ✅ 1 query (no 2)
   - ✅ O usar función RPC (más rápido)

### 4.3 Verificar que los Triggers Funcionan

1. Responde una pregunta en partida asíncrona
2. Verifica en Supabase que `player1_answered_current` o `player2_answered_current` se actualizó
3. No debería haber query adicional a `async_answers` para verificar

---

## ⚠️ Solución de Problemas

### Problema: "Función RPC no disponible"

**Causa:** No se ejecutó el script SQL o falló.

**Solución:**
1. Verifica que la función existe en Supabase
2. Si no existe, ejecuta solo la parte de creación de función RPC del script SQL
3. Verifica permisos RLS

### Problema: "Campos calculados no se actualizan"

**Causa:** El trigger no está creado o no funciona.

**Solución:**
1. Verifica que el trigger existe:
```sql
SELECT * FROM information_schema.triggers WHERE event_object_table = 'async_answers';
```
2. Si no existe, ejecuta solo la parte de creación de trigger del script SQL
3. Prueba insertando una respuesta manualmente y verifica que los campos se actualizan

### Problema: "Caché no funciona"

**Causa:** El módulo no se carga correctamente.

**Solución:**
1. Verifica que `async-matches-cache.js` está en el HTML
2. Verifica que no hay errores de importación en consola
3. Verifica que `window.asyncMatchesCache` existe

### Problema: "Siguen haciendo 2 queries"

**Causa:** El código no se actualizó o hay código legacy.

**Solución:**
1. Verifica que `friends_ui.js:loadOpenMatches()` usa la función RPC o query OR
2. Busca otras llamadas a `loadOpenMatches` que no estén optimizadas
3. Limpia caché del navegador (Ctrl+F5)

---

## 📊 Métricas de Éxito

Después de aplicar las optimizaciones, deberías ver:

✅ **Tiempo de carga inicial:** < 500ms (antes: 2-3s)  
✅ **Cargas repetidas:** < 50ms (caché)  
✅ **Queries por carga:** 1 (antes: 2)  
✅ **Queries después de responder:** 1 (antes: 2)  
✅ **Campos calculados se actualizan automáticamente**

---

## 🔄 Rollback (Si hay problemas)

Si necesitas revertir los cambios:

### Revertir BD:
```sql
-- Eliminar campos calculados (si es necesario)
ALTER TABLE async_matches 
DROP COLUMN IF EXISTS player1_answered_current,
DROP COLUMN IF EXISTS player2_answered_current,
DROP COLUMN IF EXISTS current_turn_player_id,
DROP COLUMN IF EXISTS last_answer_time,
DROP COLUMN IF EXISTS updated_at;

-- Eliminar trigger
DROP TRIGGER IF EXISTS trigger_update_match_answer_status ON async_answers;

-- Eliminar función
DROP FUNCTION IF EXISTS get_user_async_matches(UUID);
DROP FUNCTION IF EXISTS update_match_answer_status();
```

### Revertir Código:
- Los cambios en código son compatibles con versiones anteriores
- Si la función RPC no existe, usa el fallback a queries OR
- El caché es opcional y no rompe nada si no está disponible

---

**Fecha:** 2024-12-28  
**Versión:** 1.0

