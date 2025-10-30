# 🚀 Migración a Vercel - Guía Completa

## ✅ Preparación Completada

Ya tienes configurado:
- ✅ `vercel.json` en la raíz del proyecto
- ✅ `vercel.json` copiado a `www/` (necesario para deploy)
- ✅ Configuración de redirects para SPA
- ✅ Headers de seguridad configurados

---

## 📋 PASO 1: Crear Cuenta en Vercel (2 minutos)

1. **Ir a:** https://vercel.com
2. **Click en:** "Sign Up" o "Login"
3. **Puedes usar:**
   - GitHub (recomendado - fácil)
   - GitLab
   - Bitbucket
   - Email

---

## 📋 PASO 2: Deploy Inicial (3 minutos)

### Opción A: Drag & Drop (MÁS RÁPIDO)

1. **En Vercel Dashboard**, click en **"Add New..."** → **"Project"**
2. **Arrastra la carpeta `www/`** directamente a Vercel
   - O usa el botón "Browse" para seleccionar la carpeta
3. **Vercel automáticamente:**
   - Detecta que es un sitio estático
   - Usa la configuración de `vercel.json`
   - Hace el deploy

4. **Espera 1-2 minutos** mientras se procesa

5. **Obtienes tu URL:**
   ```
   https://quizlo-trivia.vercel.app
   ```
   (O un nombre similar generado por Vercel)

### Opción B: Conectar Repositorio Git (Para futuros deploys)

1. **Click en:** "Add New..." → "Project"
2. **Conectar repositorio:**
   - Conecta tu cuenta de GitHub/GitLab
   - Selecciona el repositorio
   - Selecciona la carpeta `www/` como root directory
3. **Configuración:**
   - Framework Preset: "Other"
   - Root Directory: `www`
   - Build Command: (dejar vacío - es estático)
   - Output Directory: (dejar vacío - ya está en www)

---

## 📋 PASO 3: Configurar OAuth - Google Cloud Console (5 minutos)

### 1. Ir a Google Cloud Console
```
https://console.cloud.google.com/apis/credentials
```

### 2. Encontrar tu OAuth Client ID
Busca el cliente con ID: `339736953753-h9oekqkii28804iv84r5mqad61p7m4es`

### 3. Agregar Nueva URL de Vercel

**JavaScript origins:**
```
https://tu-url-de-vercel.vercel.app
https://fpjkdibubjdbskthofdp.supabase.co
```

**Redirect URIs:**
```
https://tu-url-de-vercel.vercel.app/index.html
https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback
```

⚠️ **Reemplaza `tu-url-de-vercel.vercel.app` con tu URL real de Vercel**

### 4. Guardar Cambios
- Click en "Save"
- Espera 5-10 minutos para que Google propague los cambios

---

## 📋 PASO 4: Configurar Supabase (3 minutos)

### 1. Ir a Supabase Dashboard
```
https://supabase.com/dashboard/project/fpjkdibubjdbskthofdp/auth/url-configuration
```

### 2. Actualizar URLs

**Site URL:**
```
https://tu-url-de-vercel.vercel.app
```

**Redirect URLs (agregar):**
```
https://tu-url-de-vercel.vercel.app/index.html
https://tu-url-de-vercel.vercel.app/auth-callback
```

⚠️ **Reemplaza `tu-url-de-vercel.vercel.app` con tu URL real de Vercel**

### 3. Guardar Cambios
- Click en "Save"
- Los cambios son inmediatos

---

## 📋 PASO 5: Configurar Dominio Personalizado (OPCIONAL)

Si tienes `quizlo.app`:

### 1. En Vercel Dashboard
- Ve a tu proyecto → "Settings" → "Domains"

### 2. Agregar Dominio
- Click en "Add Domain"
- Ingresa: `quizlo.app` y `www.quizlo.app`

### 3. Configurar DNS
Vercel te dará instrucciones específicas, generalmente:
- **Tipo A:** Apuntar a dirección IP de Vercel
- **CNAME:** Para `www.quizlo.app` apuntar a `cname.vercel-dns.com`

### 4. Esperar SSL
- Vercel configura SSL automáticamente (5-10 minutos)

### 5. Actualizar OAuth con nuevo dominio
- Google Cloud Console: Agregar `https://www.quizlo.app`
- Supabase: Actualizar Site URL a `https://www.quizlo.app`

---

## 📋 PASO 6: Verificar que Todo Funciona

### Checklist de Verificación:

- [ ] ✅ Sitio carga correctamente en Vercel
- [ ] ✅ Puedes hacer login con Google
- [ ] ✅ OAuth redirige correctamente
- [ ] ✅ Supabase funciona correctamente
- [ ] ✅ La app funciona igual que antes

### Probar Específicamente:

1. **Login con Google:**
   - Debe abrir popup de Google
   - Debe redirigir correctamente después del login
   - Debe guardar sesión

2. **Navegación:**
   - Verificar que todas las rutas funcionan
   - Probar en modo incógnito

3. **Supabase:**
   - Verificar que las queries funcionan
   - Verificar que auth funciona

---

## 🔧 CONFIGURACIÓN ADICIONAL EN VERCEL

### Variables de Entorno (Si las necesitas)

1. **En Vercel Dashboard** → Tu proyecto → "Settings" → "Environment Variables"
2. **Agregar variables** si tu app las necesita:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - Etc.

### Headers Personalizados (Ya configurados)

Ya están en `vercel.json`:
- ✅ X-Frame-Options
- ✅ X-XSS-Protection
- ✅ X-Content-Type-Options
- ✅ Referrer-Policy

---

## 🚀 VENTAJAS DE VERCEL vs NETLIFY

| Característica | Vercel | Netlify |
|----------------|--------|---------|
| Build minutes/mes | 6,000 | 300 |
| Bandwidth/mes | 100 GB | 100 GB |
| Deploys automáticos | ✅ Gratis | ✅ Gratis |
| SSL | ✅ Automático | ✅ Automático |
| CDN | ✅ Global | ✅ Global |
| Functions | ✅ Ilimitadas | ⚠️ 125k/mes |

---

## 📝 DEPLOYS FUTUROS

### Con Git Conectado (Automático)

1. **Hacer commit y push:**
   ```bash
   git add .
   git commit -m "update: cambios"
   git push
   ```

2. **Vercel automáticamente:**
   - Detecta el push
   - Hace build
   - Deploya automáticamente

3. **Sin consumir créditos excesivos** (6,000 minutos vs 300)

### Deploy Manual

1. **Vercel Dashboard** → Tu proyecto
2. **"Deploys"** → "Redeploy" (si es necesario)
3. O usar **Vercel CLI**:
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

---

## 🐛 TROUBLESHOOTING

### Problema: OAuth no funciona

**Solución:**
1. Verificar que agregaste la URL correcta en Google Console
2. Esperar 5-10 minutos para propagación
3. Limpiar cache del navegador
4. Probar en modo incógnito

### Problema: Rutas no funcionan (404)

**Solución:**
- Verificar que `vercel.json` tiene los redirects correctos
- Ya está configurado con:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

### Problema: Assets no cargan

**Solución:**
- Verificar paths relativos/absolutos
- Verificar que assets están en `www/`
- Revisar consola del navegador para errores

---

## ✅ CHECKLIST FINAL DE MIGRACIÓN

- [ ] ✅ Crear cuenta en Vercel
- [ ] ✅ Deploy inicial completado
- [ ] ✅ URL de Vercel obtenida
- [ ] ✅ Google OAuth configurado con nueva URL
- [ ] ✅ Supabase configurado con nueva URL
- [ ] ✅ Login probado y funcionando
- [ ] ✅ App funcionando correctamente
- [ ] ✅ (Opcional) Dominio personalizado configurado
- [ ] ✅ **Netlify auto-deploy deshabilitado** (evitar más builds)

---

## 🎯 PRÓXIMOS PASOS

1. **Completar migración** siguiendo los pasos arriba
2. **Deshabilitar auto-deploy en Netlify** (usar `DESHABILITAR_AUTO_DEPLOY.md`)
3. **Probar todo** en Vercel
4. **Cuando esté funcionando:** Cancelar/desconectar Netlify (opcional)

---

**¡Vamos a migrar ahora!** 🚀

Si encuentras algún problema durante la migración, avísame y te ayudo a resolverlo.


