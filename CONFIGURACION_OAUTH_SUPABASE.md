# 🔐 Configuración Completa de OAuth y Supabase

## ✅ Estado Actual

- ✅ Deploy en Vercel completado
- ✅ Dominio `quizlo.app` agregado en Vercel
- ✅ DNS configurado correctamente
- ⏳ Esperando propagación DNS (10-30 minutos)
- ⏳ Configurar OAuth en Google Cloud Console
- ⏳ Configurar Supabase

---

## 📋 PASO 1: Configurar Google OAuth (5 minutos)

### 1. Ir a Google Cloud Console

```
https://console.cloud.google.com/apis/credentials
```

### 2. Encontrar tu OAuth Client ID

Busca el cliente con ID: `339736953753-h9oekqkii28804iv84r5mqad61p7m4es`

### 3. Click en el cliente para editarlo

### 4. Actualizar JavaScript Origins

**Agregar TODAS estas URLs:**

```
https://www.quizlo.app
https://quizlo.app
https://trivia-app-blush-tau.vercel.app
https://fpjkdibubjdbskthofdp.supabase.co
```

⚠️ **Importante:** Tener todas las URLs permite que funcione tanto con el dominio personalizado como con la URL de Vercel.

### 5. Actualizar Redirect URIs

**Agregar TODAS estas URLs:**

```
https://www.quizlo.app/index.html
https://quizlo.app/index.html
https://trivia-app-blush-tau.vercel.app/index.html
https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback
```

### 6. Guardar Cambios

- Click en **"Save"** (parte inferior de la página)
- Espera **5-10 minutos** para que Google propague los cambios

---

## 📋 PASO 2: Configurar Supabase (3 minutos)

### 1. Ir a Supabase Dashboard

```
https://supabase.com/dashboard/project/fpjkdibubjdbskthofdp/auth/url-configuration
```

### 2. Actualizar Site URL

**Site URL:**
```
https://www.quizlo.app
```

Si `quizlo.app` aún no funciona (DNS propagándose), puedes usar temporalmente:
```
https://trivia-app-blush-tau.vercel.app
```
Y luego cambiar a `quizlo.app` cuando funcione.

### 3. Actualizar Redirect URLs

**Redirect URLs (agregar TODAS):**

```
https://www.quizlo.app/index.html
https://quizlo.app/index.html
https://trivia-app-blush-tau.vercel.app/index.html
https://trivia-app-blush-tau.vercel.app/auth-callback
```

### 4. Guardar Cambios

- Click en **"Save"** (parte inferior)
- Los cambios son **inmediatos** (no necesitas esperar)

---

## 📋 PASO 3: Verificar que Todo Funciona

### Checklist de Verificación:

- [ ] ✅ DNS propagado (verificar que `quizlo.app` carga)
- [ ] ✅ OAuth configurado en Google Cloud Console
- [ ] ✅ Supabase configurado con nuevas URLs
- [ ] ⏳ Probar login completo

### Probar Login:

1. **Ir a:** `https://quizlo.app` (o `https://trivia-app-blush-tau.vercel.app` mientras esperas DNS)
2. **Click en:** "Iniciar Sesión / Registrarse"
3. **Login con Google:**
   - Debe abrir popup de Google
   - Debe redirigir correctamente después del login
   - Debe guardar sesión y mostrar tu avatar

### Si hay problemas:

- **Esperar 5-10 minutos** después de configurar OAuth (Google necesita tiempo)
- **Limpiar cache** del navegador
- **Probar en modo incógnito**
- **Verificar URLs** exactas en Google Console

---

## ✅ ORDEN RECOMENDADO DE PASOS

1. **Ahora:** Configurar OAuth en Google Cloud Console
2. **Ahora:** Configurar Supabase
3. **Esperar:** 5-10 minutos (propagación de cambios de Google)
4. **Probar:** Login completo en `quizlo.app` o `trivia-app-blush-tau.vercel.app`
5. **Verificar:** Que todo funciona correctamente

---

## 🎯 RESUMEN DE URLS A CONFIGURAR

### Google OAuth:
**JavaScript Origins:**
- `https://www.quizlo.app`
- `https://quizlo.app`
- `https://trivia-app-blush-tau.vercel.app`
- `https://fpjkdibubjdbskthofdp.supabase.co`

**Redirect URIs:**
- `https://www.quizlo.app/index.html`
- `https://quizlo.app/index.html`
- `https://trivia-app-blush-tau.vercel.app/index.html`
- `https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback`

### Supabase:
**Site URL:**
- `https://www.quizlo.app`

**Redirect URLs:**
- `https://www.quizlo.app/index.html`
- `https://quizlo.app/index.html`
- `https://trivia-app-blush-tau.vercel.app/index.html`
- `https://trivia-app-blush-tau.vercel.app/auth-callback`

---

**¡Vamos a configurar OAuth y Supabase ahora!** 🔐

Comenzamos con Google Cloud Console o prefieres que te guíe paso a paso en tiempo real?


