# 📊 Configuración Completa de Google AdSense

## ✅ Estado Actual

- ✅ AdSense Publisher ID configurado: `ca-pub-7829392929574421`
- ✅ Código JavaScript de AdSense implementado en `web-banner.js`
- ⚠️ Slot de anuncio usando placeholder: `1234567890` (necesita ser reemplazado)
- ⚠️ Falta crear unidades de anuncio en AdSense Dashboard

---

## 📋 PASO 1: Crear Cuenta y Agregar Sitio en AdSense

### ⚠️ IMPORTANTE: PRIMERO agregar el sitio, LUEGO crear unidades de anuncio

### 1. Ir a Google AdSense

```
https://www.google.com/adsense/
```

### 2. Crear Cuenta o Iniciar Sesión

- Si es tu primera vez, sigue el proceso de registro
- Necesitarás verificar tu sitio

### 3. Agregar tu Sitio (PASO CRÍTICO - HACER PRIMERO)

**En AdSense Dashboard:**

1. **Click en:** "Sites" (en el menú lateral)
2. **Click en:** "Add site" o "Agregar sitio"
3. **Ingresar URL:**
   - `quizlo.app`
   - O `www.quizlo.app`
   - O ambos (si AdSense lo permite)

4. **AdSense verificará la propiedad del sitio:**
   - Te dará un código HTML para agregar al sitio
   - O te pedirá verificar mediante DNS
   - **Puede tardar horas o días** en aprobar

### 4. Verificar Propiedad del Sitio

**Opción A: Código HTML (Recomendado)**

1. AdSense te dará un código como:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7829392929574421"
        crossorigin="anonymous"></script>
   ```

2. **Agregar al `<head>` del HTML:**
   - Archivo: `www/index.html`
   - Agregar justo después de `<meta name="viewport"...>`

**Opción B: Verificación DNS**

- Si AdSense ofrece verificación DNS, agregar un registro TXT en tu DNS

### 5. Esperar Aprobación

- **Tiempo:** 1-7 días típicamente
- **Estado:** Se mostrará como "En revisión" o "Pendiente"
- **Cuando esté aprobado:** Puedes crear unidades de anuncio

---

## 📋 PASO 2: Crear Unidad de Anuncio (Ad Unit)

**⚠️ SOLO después de que el sitio esté agregado y aprobado:**

### 1. En AdSense Dashboard

### 1. En AdSense Dashboard

- Ve a: "Ads" → "By ad unit"
- Click en: "Create ad unit" o "Nuevo"

### 2. Configurar la Unidad

**Nombre:**
```
Banner Principal - Quizlo
```

**Tipo de anuncio:**
- Seleccionar: **"Display ads"** (Anuncios de display)
- Formato: **"Responsive"** (Adaptativo)

**Tamaño:**
- Seleccionar: **"Responsive"** o **"Auto"**
- Esto permite que AdSense muestre el mejor tamaño según el dispositivo

### 3. Guardar y Obtener Slot ID

- Después de crear, AdSense te dará un **Slot ID** (Ad Unit ID)
- Ejemplo: `1234567890` (pero será tu número real)
- **Copia este número** - lo necesitarás para el código

---

## 📋 PASO 3: Actualizar Código con Slot ID Real

Una vez que tengas el Slot ID real de AdSense:

### Archivo a Modificar: `js/ads/web-banner.js`

**Línea 96:** Cambiar el slot placeholder por tu slot real:

```javascript
// ANTES (placeholder):
adSenseAd.setAttribute('data-ad-slot', '1234567890'); // Necesitarás crear un slot en AdSense

// DESPUÉS (con tu slot real):
adSenseAd.setAttribute('data-ad-slot', 'TU_SLOT_ID_REAL'); // Reemplazar con tu slot real
```

---

## 📋 PASO 4: Verificar que Todo Funciona

### Requisitos para que AdSense Funcione:

1. **Cuenta de AdSense aprobada** ✅
2. **Sitio verificado** en AdSense ✅
3. **Slot ID correcto** en el código ✅
4. **HTML sin errores** (ya está bien) ✅
5. **Dominio público** (`quizlo.app` ya está configurado) ✅

### Probar:

1. **Visitar:** `https://quizlo.app`
2. **Abrir consola del navegador** (F12)
3. **Buscar mensajes:**
   - `✅ AdSense cargado`
   - `✅ Banner AdSense mostrado`

4. **Verificar visualmente:**
   - Debe aparecer un banner en la parte inferior
   - Si no aparece, puede ser porque:
     - AdSense aún está revisando tu sitio
     - Hay bloqueadores de anuncios activos
     - El sitio aún no está aprobado

---

## 📋 PASO 5: Configuraciones Adicionales (Opcional)

### Optimizar Rendimiento

En `web-banner.js`, puedes ajustar:

**Tamaño del banner:**
```javascript
// Línea 71: Altura del banner
height: 90px, // Puedes cambiar a 50px, 100px, etc.
```

**Posición:**
```javascript
// Línea 68: Posición
bottom: 0, // Banner en la parte inferior
// O cambiar a top: 0 para parte superior
```

### Múltiples Slots (Opcional)

Si quieres tener múltiples tipos de anuncios:

1. **Crear más unidades** en AdSense Dashboard
2. **Asignar diferentes slots** según la página o sección
3. **Actualizar código** para usar diferentes slots según contexto

---

## ⚠️ IMPORTANTE: Proceso de Aprobación de AdSense

### Tiempo de Aprobación:

- **Primera vez:** Puede tardar **1-7 días** o más
- **Revisión:** Google revisa:
  - Contenido del sitio
  - Políticas de AdSense
  - Experiencia del usuario
  - Trafico mínimo (puede requerir algo de tráfico)

### Mientras Esperas Aprobación:

- El código ya está listo
- Los anuncios **no aparecerán** hasta que AdSense apruebe
- Puedes ver el placeholder mientras tanto

---

## 📋 CHECKLIST DE CONFIGURACIÓN

- [ ] ✅ Cuenta de AdSense creada
- [ ] ✅ Sitio `quizlo.app` agregado en AdSense
- [ ] ✅ Sitio verificado (puede tardar días)
- [ ] ⏳ Unidad de anuncio creada
- [ ] ⏳ Slot ID obtenido de AdSense
- [ ] ⏳ Código actualizado con Slot ID real
- [ ] ⏳ Probar que funciona en producción
- [ ] ⏳ Monitorear rendimiento en AdSense Dashboard

---

## 🎯 RESUMEN DE ARCHIVOS A MODIFICAR

### Cuando tengas el Slot ID de AdSense:

**Archivo:** `js/ads/web-banner.js`
**Línea:** 96
**Cambio:** Reemplazar `'1234567890'` con tu Slot ID real

**Archivo:** `www/js/ads/web-banner.js`
**Línea:** 96
**Cambio:** Reemplazar `'1234567890'` con tu Slot ID real

---

## 💡 CONSEJOS PARA ADVERTENCIA

### Mejores Prácticas:

1. **No hacer clic en tus propios anuncios** (viola políticas)
2. **Esperar aprobación** antes de esperar ingresos
3. **Monitorear en AdSense Dashboard** regularmente
4. **Optimizar posiciones** según rendimiento
5. **Respetar políticas** de Google AdSense

### Políticas Importantes:

- ✅ Contenido original y de calidad
- ✅ No manipular clicks
- ✅ Permitir que AdSense controle los anuncios
- ✅ No tener anuncios de otros proveedores simultáneos

---

## 🚀 SIGUIENTE PASO INMEDIATO

**¿Ya tienes cuenta de AdSense?**
- Si **SÍ:** Ve a AdSense Dashboard y crea una unidad de anuncio
- Si **NO:** Crea cuenta y agrega tu sitio `quizlo.app`

**Una vez que tengas el Slot ID real, avísame y actualizo el código automáticamente.**

---

**¿Tienes ya cuenta de AdSense o necesitas ayuda creándola?**

