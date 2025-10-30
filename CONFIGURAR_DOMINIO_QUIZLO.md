# 🌐 Configurar Dominio quizlo.app en Vercel

## ✅ Estado Actual

- ✅ Deploy exitoso en Vercel: `https://trivia-app-blush-tau.vercel.app/`
- ⏳ Configurar dominio `quizlo.app` → Vercel
- ⏳ Actualizar OAuth con nueva URL
- ⏳ Actualizar Supabase con nueva URL

---

## 📋 PASO 1: Agregar Dominio en Vercel (3 minutos)

### 1. Ir a Settings del Proyecto

1. **En Vercel Dashboard:**
   - Ve a: https://vercel.com/dashboard
   - Click en tu proyecto **"trivia-app"**

2. **Ir a Domains:**
   - En el menú lateral, click en **"Settings"**
   - Click en **"Domains"** (en el submenú de Settings)

### 2. Agregar Dominio

1. **En el campo "Add a Domain":**
   - Escribe: `quizlo.app`
   - Click en **"Add"**

2. **Vercel te mostrará instrucciones:**
   - Te dirá qué registros DNS agregar
   - Te dará los valores específicos (IPs o CNAMEs)

3. **También agrega `www.quizlo.app`:**
   - Click en "Add" nuevamente
   - Escribe: `www.quizlo.app`
   - Vercel automáticamente configurará el subdominio

---

## 📋 PASO 2: Actualizar DNS en tu Registrador de Dominio

**⚠️ IMPORTANTE:** Necesitamos saber dónde está registrado `quizlo.app`

### Opciones Comunes:

#### Si está en Netlify:
- Netlify Dashboard → Domain settings → DNS

#### Si está en otro proveedor:
- **GoDaddy:** Sección de DNS Management
- **Namecheap:** Advanced DNS
- **Google Domains:** DNS Settings
- **Cloudflare:** DNS Records

### Qué Registros DNS Agregar:

Vercel te dará los valores exactos, pero generalmente necesitas:

#### Para `quizlo.app` (dominio raíz):

**Registro A:**
- **Tipo:** `A`
- **Nombre/Host:** `@` o `quizlo.app`
- **Valor/IP:** (Vercel te dará la IP, ej: `76.76.21.21`)
- **TTL:** 300 segundos (o automático)

#### Para `www.quizlo.app`:

**Registro CNAME:**
- **Tipo:** `CNAME`
- **Nombre/Host:** `www`
- **Valor/Apuntando a:** `cname.vercel-dns.com` 
  - O el valor específico que Vercel te dé
- **TTL:** 300 segundos (o automático)

### Pasos Detallados:

1. **Ir a tu proveedor de dominio**
   - Buscar "DNS Management" o "Zona DNS"
   - Encontrar los registros de `quizlo.app`

2. **Eliminar registros antiguos de Netlify:**
   - Si hay registros A o CNAME que apuntan a Netlify, **elimínalos**

3. **Agregar nuevos registros de Vercel:**
   - Agregar el registro A que Vercel te dio
   - Agregar el registro CNAME para `www`

4. **Guardar cambios**

---

## 📋 PASO 3: Esperar Propagación DNS

- **Tiempo:** 5 minutos a 48 horas (normalmente 10-30 minutos)
- **Verificar:** Puedes usar https://dnschecker.org
  - Buscar `quizlo.app` y verificar que apunte a la IP de Vercel

**Mientras tanto:** El sitio sigue funcionando en `trivia-app-blush-tau.vercel.app`

---

## 📋 PASO 4: Configurar OAuth - Google Cloud Console (5 minutos)

### ⚠️ IMPORTANTE: Actualizar URLs

Una vez que `quizlo.app` esté configurado y funcionando:

### 1. Ir a Google Cloud Console

```
https://console.cloud.google.com/apis/credentials
```

### 2. Encontrar tu OAuth Client ID

Busca el cliente con ID: `339736953753-h9oekqkii28804iv84r5mqad61p7m4es`

### 3. Actualizar URLs

**JavaScript origins:**
```
https://www.quizlo.app
https://quizlo.app
https://trivia-app-blush-tau.vercel.app
https://fpjkdibubjdbskthofdp.supabase.co
```

**Redirect URIs:**
```
https://www.quizlo.app/index.html
https://quizlo.app/index.html
https://trivia-app-blush-tau.vercel.app/index.html
https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback
```

⚠️ **Es importante tener TODAS las URLs** para que funcione tanto con el dominio personalizado como con la URL de Vercel.

### 4. Guardar y Esperar

- Click en **"Save"**
- Espera **5-10 minutos** para que Google propague los cambios

---

## 📋 PASO 5: Configurar Supabase (3 minutos)

### 1. Ir a Supabase Dashboard

```
https://supabase.com/dashboard/project/fpjkdibubjdbskthofdp/auth/url-configuration
```

### 2. Actualizar URLs

**Site URL:**
```
https://www.quizlo.app
```

**Redirect URLs (agregar todas):**
```
https://www.quizlo.app/index.html
https://quizlo.app/index.html
https://trivia-app-blush-tau.vercel.app/index.html
https://trivia-app-blush-tau.vercel.app/auth-callback
```

### 3. Guardar Cambios

- Click en **"Save"**
- Los cambios son inmediatos

---

## ✅ CHECKLIST COMPLETO

- [ ] ✅ Deploy en Vercel completado
- [ ] ⏳ Agregar `quizlo.app` en Vercel Dashboard
- [ ] ⏳ Actualizar DNS en proveedor de dominio
- [ ] ⏳ Esperar propagación DNS (verificar con dnschecker.org)
- [ ] ⏳ Actualizar Google OAuth con nuevas URLs
- [ ] ⏳ Actualizar Supabase con nuevas URLs
- [ ] ⏳ Probar login completo en `quizlo.app`
- [ ] ⏳ Verificar que todo funciona correctamente

---

## 🎯 ORDEN DE PASOS RECOMENDADO

1. **Primero:** Agregar dominio en Vercel y actualizar DNS
2. **Esperar:** Que DNS se propague (mientras tanto puedes hacer lo siguiente)
3. **Mientras tanto:** Actualizar OAuth y Supabase
4. **Cuando DNS esté listo:** Probar en `quizlo.app`

---

**¿Dónde tienes registrado `quizlo.app`?** (Netlify, GoDaddy, Namecheap, etc.)

Con esa información te puedo dar instrucciones más específicas para actualizar los DNS.


