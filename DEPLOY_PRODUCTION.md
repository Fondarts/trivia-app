# 🚀 Deploy de Producción para Quizlo!

> ⚠️ **NOTA:** Si Netlify está pausado por límites de crédito, consulta `SOLUCION_NETLIFY_PAUSADO.md` para soluciones inmediatas (Vercel, Firebase, etc.)

## Opción 1: Netlify (GRATIS - Puede tener límites)

### 1. Preparar el Deploy
```bash
# Ya está listo - tu carpeta www/ es estática
```

### 2. Deploy en Netlify
1. Ve a: https://netlify.com
2. Drag & Drop la carpeta `www/` completa
3. Netlify te dará una URL como: `https://amazing-name-123456.netlify.app`

### 3. Configurar Google OAuth
En Google Cloud Console, usar tu nueva URL de Netlify:

**JavaScript Origins:**
```
https://www.quizlo.app
https://fpjkdibubjdbskthofdp.supabase.co
```

**Redirect URIs:**
```
https://www.quizlo.app/index.html
https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback
```

### 4. Configurar Supabase
En Supabase Dashboard, agregar:

**Site URL:**
```
https://www.quizlo.app
```

**Redirect URLs:**
```
https://www.quizlo.app/index.html
```

---

## Opción 2: Vercel (RECOMENDADO SI NETLIFY ESTÁ PAUSADO - GRATIS)

### 1. Deploy en Vercel
1. Ve a: https://vercel.com
2. Drag & Drop la carpeta `www/`
3. Te dará: `https://tu-app.vercel.app`
4. **Ventajas:** Plan gratuito más generoso, menos problemas con límites

### 2. Configurar OAuth igual que Netlify pero con tu dominio de Vercel

**Google Cloud Console:**
- **JavaScript Origins:** `https://tu-app.vercel.app`
- **Redirect URIs:** `https://tu-app.vercel.app/index.html`

**Supabase Dashboard:**
- **Site URL:** `https://tu-app.vercel.app`
- **Redirect URLs:** `https://tu-app.vercel.app/index.html`

---

## Opción 3: Firebase Hosting (GRATIS)

### 1. Instalar Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Inicializar proyecto
```bash
firebase init hosting
# Elegir carpeta: www
# SPA: Yes
# Rewrite: index.html
```

### 3. Deploy
```bash
firebase deploy
```

---

## Dominio Personalizado (PROFESIONAL)

### 1. Comprar dominio (ej: quizlo.app)

### 2. Configurar DNS en Netlify/Vercel
- Apuntar dominio a Netlify/Vercel
- Configurar SSL automático

### 3. Actualizar configuraciones con tu dominio
```
https://www.quizlo.app
```

---

## ⚡ DEPLOY INMEDIATO (5 minutos)

1. **Comprimir carpeta `www/`** en un ZIP
2. **Ir a netlify.com**
3. **Arrastrar ZIP** al área de deploy
4. **Copiar URL** que te da (ej: `https://nostalgic-turing-123456.netlify.app`)
5. **Configurar Google OAuth** con esa URL
6. **Configurar Supabase** con esa URL
7. **¡LISTO!** Tu app está en producción

## URLs de Ejemplo que Obtienes

- Netlify: `https://quizlo-trivia-123456.netlify.app`
- Vercel: `https://quizlo-trivia.vercel.app`
- Firebase: `https://quizlo-trivia.web.app`
- Dominio propio: `https://www.quizlo.app`

## Ventajas de Producción

✅ **HTTPS automático** (requerido por Google)
✅ **CDN global** (app más rápida)
✅ **Dominio público** (funciona con OAuth)
✅ **SSL gratuito**
✅ **Escalable**
✅ **Profesional**

## ⚠️ Problemas Comunes

### Netlify Pausado por Límites de Crédito
- **Síntoma:** Error "Site not available - reached its usage limits"
- **Solución inmediata:** Usar Vercel o Firebase Hosting
- **Ver:** `SOLUCION_NETLIFY_PAUSADO.md` para guía completa

## Próximos Pasos

1. **Deploy inmediato** en Netlify/Vercel (5 minutos)
2. **Configurar OAuth** con la nueva URL
3. **Testing completo**
4. **Dominio personalizado** (opcional)
5. **¡App lista para clientes!**