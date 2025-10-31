# 🧪 Guía de Pruebas del Sistema de Storage

## 📋 Instrucciones para Probar Storage

### 1. **Abrir la Consola del Navegador**

- **Chrome/Edge**: `F12` o `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
- **Firefox**: `F12` o `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
- **Safari**: `Cmd+Option+C` (necesita habilitar el menú de desarrollador)

### 2. **Ejecutar Pruebas Automáticas**

En la consola, escribe:
```javascript
testStorage()
```

Esto ejecutará todas las pruebas automáticamente y mostrará los resultados en la consola.

### 3. **Pruebas Manuales**

Puedes probar manualmente escribiendo estos comandos en la consola:

#### **Operaciones Básicas**
```javascript
// Guardar un valor
Storage.set('mi_clave', 'mi_valor');

// Obtener un valor
Storage.get('mi_clave');
// Debería retornar: "mi_valor"

// Verificar si existe
Storage.has('mi_clave');
// Debería retornar: true

// Eliminar un valor
Storage.remove('mi_clave');
Storage.get('mi_clave');
// Debería retornar: null
```

#### **Valores Complejos**
```javascript
// Guardar un objeto
Storage.set('mi_objeto', { nombre: 'Test', numero: 123 });

// Guardar un array
Storage.set('mi_array', [1, 2, 3, { nested: 'value' }]);

// Obtenerlos
Storage.get('mi_objeto');
Storage.get('mi_array');
```

#### **Valores por Defecto**
```javascript
// Si la clave no existe, retorna el valor por defecto
Storage.get('clave_inexistente', 'valor_por_defecto');
// Retorna: "valor_por_defecto"
```

#### **TTL (Time-To-Live)**
```javascript
// Guardar con expiración en 2 segundos
Storage.set('temporal', 'expira_en_2_seg', { ttl: 2000 });

// Inmediatamente debería estar disponible
Storage.get('temporal');
// Retorna: "expira_en_2_seg"

// Esperar 3 segundos y verificar
setTimeout(() => {
  Storage.get('temporal');
  // Debería retornar: null (ya expiró)
}, 3000);

// Limpiar expirados manualmente
Storage.clearExpired();
```

#### **Validación**
```javascript
// Registrar un validador
Storage.setValidator('edad', (value) => {
  if (typeof value !== 'number' || value < 0 || value > 120) {
    throw new Error('Edad debe ser un número entre 0 y 120');
  }
  return true;
});

// Intentar guardar un valor válido
Storage.set('edad', 25);
// ✅ Debería funcionar

// Intentar guardar un valor inválido
Storage.set('edad', 150);
// ❌ Debería fallar silenciosamente (retornar false)
```

#### **Información del Storage**
```javascript
// Obtener información completa
Storage.getInfo();
// Retorna: { available, version, itemCount, totalSizeKB, cacheSize, ttlEntries }
```

#### **Obtener Todas las Claves**
```javascript
// Obtener lista de claves
Storage.keys();
// Retorna: ["clave1", "clave2", ...]

// Obtener todas las entradas
Storage.getAll();
// Retorna: { clave1: valor1, clave2: valor2, ... }
```

#### **Cache en Memoria**
```javascript
// El cache es automático, pero puedes limpiarlo manualmente
Storage.clearCache();

// Verificar uso del cache
const info = Storage.getInfo();
console.log(`Cache: ${info.cacheSize} entradas`);
```

### 4. **Verificar Compatibilidad con localStorage**

El sistema Storage es compatible con localStorage existente:

```javascript
// Guardar con localStorage directamente
localStorage.setItem('legacy_key', JSON.stringify({ test: 'legacy' }));

// Leerlo con Storage
Storage.get('legacy_key');
// Debería retornar: { test: "legacy" }
```

### 5. **Verificar Funcionamiento en la App**

Después de probar manualmente, verifica que la aplicación funcione correctamente:

1. **Iniciar sesión** - Debería guardar datos del usuario
2. **Guardar progreso** - El progreso de aventura debería persistir
3. **Estadísticas** - Las estadísticas deberían guardarse y cargarse
4. **Banco de preguntas** - El banco debería cargar desde storage

### 6. **Verificar Cache**

El sistema usa cache en memoria para mejor rendimiento:

```javascript
// Obtener un valor múltiples veces (primera vez lee de localStorage, siguientes del cache)
Storage.get('trivia_stats');
Storage.get('trivia_stats'); // Esta vez desde cache
Storage.get('trivia_stats'); // Esta vez desde cache

// Ver información del cache
Storage.getInfo();
// Ver cacheSize para ver cuántas entradas están en cache
```

### 7. **Limpiar Datos de Prueba**

Después de probar, limpia los datos de prueba:

```javascript
// Eliminar claves específicas
Storage.remove('mi_clave');
Storage.remove('mi_objeto');
Storage.remove('mi_array');

// O limpiar todo (excepto claves importantes)
Storage.clear(['trivia_stats', 'trivia_bank', 'user_nickname_*']);
```

## ✅ Checklist de Pruebas

- [ ] Storage está disponible globalmente (`window.Storage`)
- [ ] Operaciones básicas funcionan (get/set/remove)
- [ ] Valores complejos se guardan y recuperan correctamente
- [ ] Valores por defecto funcionan
- [ ] TTL funciona correctamente
- [ ] Validación funciona
- [ ] Cache funciona (acceso rápido a valores)
- [ ] Compatibilidad con localStorage existente
- [ ] Información del storage es correcta
- [ ] La aplicación funciona correctamente con Storage

## 🐛 Si Algo Falla

1. **Verificar que Storage esté cargado:**
   ```javascript
   console.log(window.Storage);
   // Debería mostrar el objeto Storage
   ```

2. **Verificar la consola de errores** para ver si hay errores de carga

3. **Verificar que localStorage esté disponible:**
   ```javascript
   Storage.isAvailable();
   // Debería retornar: true
   ```

4. **Limpiar cache y probar de nuevo:**
   ```javascript
   Storage.clearCache();
   ```

## 📊 Resultados Esperados

Al ejecutar `testStorage()`, deberías ver:

```
🧪 Iniciando pruebas del sistema de Storage...

✅ Storage encontrado

📋 Test 1: Verificar disponibilidad
  Disponible: ✅ Sí

📋 Test 2: Operaciones básicas
  set/get: ✅ Correcto
  has: ✅ Correcto
  remove: ✅ Correcto

📋 Test 3: Valores complejos
  Objeto: ✅ Correcto
  Array: ✅ Correcto

📋 Test 4: Valores por defecto
  Default: ✅ Correcto

📋 Test 5: TTL (Time-To-Live)
  Antes de expirar: ✅ Correcto
  Después de expirar: ✅ Correcto
  Limpiados expirados: X entradas

📋 Test 6: Validación
  Valor válido (50): ✅ Correcto
  Valor inválido (150): ✅ Correcto (falló como esperado)

📋 Test 7: Información del storage
  Información: { disponible: true, version: "1.0.0", items: X, tamaño: "XKB", cache: X, ttl: X }

📋 Test 8: Keys y getAll
  Keys encontradas: ✅ Correcto
  getAll funciona: ✅ Correcto

📋 Test 9: Cache en memoria
  Tiempo con cache (100 operaciones): X.XXms
  Promedio: X.XXXms por operación

📋 Test 10: Compatibilidad con localStorage existente
  Leer datos legacy: ✅ Correcto

✅ Todas las pruebas completadas!
```

¡Todo debería estar ✅ Correcto!

