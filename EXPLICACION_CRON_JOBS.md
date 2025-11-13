# ¿Qué son los Cron Jobs?

## 📚 Concepto Básico

Un **cron job** es una tarea programada que se ejecuta automáticamente en intervalos regulares (cada hora, cada día, etc.). Es como un "recordatorio automático" que le dice al sistema: "ejecuta esta función cada X tiempo".

## 🔄 En nuestro caso

Tenemos dos funciones que necesitan ejecutarse periódicamente:

1. **`check_and_process_async_timeouts()`** - Verifica si algún jugador no respondió en 6 horas y marca su respuesta como incorrecta automáticamente
2. **`cleanup_expired_requests()`** - Borra las solicitudes de partida que expiraron (más de 48 horas sin aceptar)

## ⚠️ ¿Son necesarios los cron jobs?

**NO son estrictamente necesarios** porque:

1. ✅ **El código JavaScript ya tiene lógica de timeout** - La función `timeoutAsyncQuestion()` en `async_vs.js` se ejecuta cuando un jugador entra a una partida y detecta que pasaron 6 horas

2. ✅ **Las solicitudes expiradas se pueden limpiar manualmente** - Puedes ejecutar `cleanup_expired_requests()` cuando quieras

3. ✅ **Los timeouts se procesan cuando alguien entra a la partida** - Si un jugador entra y ve que pasaron 6 horas, se procesa automáticamente

## 🎯 ¿Cuándo SÍ son útiles?

Los cron jobs son útiles si quieres que:

- ⏰ Los timeouts se procesen **automáticamente** sin que nadie tenga que entrar a la partida
- 🧹 Las solicitudes expiradas se borren **automáticamente** sin intervención manual
- 📊 El sistema funcione de forma **completamente autónoma**

## 🛠️ Cómo configurar cron jobs en Supabase

### Opción 1: Usar pg_cron (Requiere extensión)

Si tu proyecto Supabase tiene la extensión `pg_cron` habilitada:

```sql
-- Verificar timeouts cada hora (a las :00 de cada hora)
SELECT cron.schedule(
  'check-async-timeouts',           -- Nombre del job
  '0 * * * *',                      -- Cada hora (minuto 0)
  'SELECT check_and_process_async_timeouts();'
);

-- Limpiar solicitudes expiradas cada hora
SELECT cron.schedule(
  'cleanup-expired-requests',
  '0 * * * *',
  'SELECT cleanup_expired_requests();'
);
```

**Formato del horario `'0 * * * *'`:**
- `0` = minuto 0
- `*` = cada hora
- `*` = cada día del mes
- `*` = cada mes
- `*` = cada día de la semana

### Opción 2: Ejecutar manualmente cuando necesites

Puedes ejecutar las funciones manualmente desde el SQL Editor de Supabase:

```sql
-- Procesar timeouts pendientes
SELECT check_and_process_async_timeouts();

-- Limpiar solicitudes expiradas
SELECT cleanup_expired_requests();
```

### Opción 3: Ejecutar desde el código JavaScript (Recomendado)

Puedes llamar estas funciones desde tu código cuando sea necesario:

```javascript
// En async_vs.js o donde sea apropiado
async function processTimeoutsPeriodically() {
  if (!sb) return;
  
  try {
    const { data, error } = await sb.rpc('check_and_process_async_timeouts');
    if (error) {
      console.error('Error procesando timeouts:', error);
    } else {
      console.log(`✅ Procesados ${data} timeouts`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar cada hora (opcional)
setInterval(processTimeoutsPeriodically, 60 * 60 * 1000); // Cada hora
```

## ✅ Resumen

- **Cron jobs = Opcionales** - El sistema funciona sin ellos
- **Cron jobs = Automatización completa** - Si los configuras, todo se procesa automáticamente
- **Sin cron jobs = Funciona igual** - Los timeouts se procesan cuando alguien entra a la partida

## 🎯 Recomendación

Para empezar, **NO necesitas configurar cron jobs**. El sistema ya funciona porque:

1. Cuando un jugador entra a una partida, se verifica si hay timeouts
2. Las funciones SQL están disponibles para ejecutarlas manualmente cuando quieras
3. Puedes agregar cron jobs más adelante si necesitas automatización completa

Si más adelante quieres automatización completa, puedes:
- Habilitar `pg_cron` en Supabase (si está disponible en tu plan)
- O ejecutar las funciones periódicamente desde tu código JavaScript

