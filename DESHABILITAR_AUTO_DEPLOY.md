# 🚨 URGENTE: Deshabilitar Auto-Deploy en Netlify

## ⚠️ PROBLEMA IDENTIFICADO

**20 deploys automáticos** disparados por auto-deploy consumieron **300 créditos** (todo el límite del plan gratuito).

Cada deploy consume **15 créditos**, por lo que con auto-deploy activado, cada commit pequeño dispara un build automático.

---

## 🛑 SOLUCIÓN INMEDIATA: Deshabilitar Auto-Deploy

### Paso 1: Acceder a Configuración del Sitio

1. **Ir a:** https://app.netlify.com
2. **Seleccionar tu sitio** (`quizlo.app` o el nombre que tenga)
3. **Click en:** "Site settings" o "Site configuration"

### Paso 2: Deshabilitar Continuous Deployment

1. **Ir a:** "Build & deploy" en el menú lateral
2. **Buscar:** "Continuous Deployment" o "Deploy settings"
3. **Click en:** "Stop auto-publishing" o deshabilitar auto-deploy

**Opciones disponibles:**

#### Opción A: Deshabilitar Completamente
- **"Stop auto-publishing"** → Los builds ya no se publican automáticamente
- Tendrás que hacer deploy manual cuando lo necesites

#### Opción B: Limitar a Branch Específica
- **"Deploy contexts"** → Solo builds de `main` o `master`
- Evita builds de branches de desarrollo

#### Opción C: Desconectar Git (Temporal)
- **"Continuous Deployment"** → "Disconnect repository"
- Sin integración Git = Sin builds automáticos

---

## 🔧 CONFIGURACIÓN RECOMENDADA

### Para Desarrollo (Recomendado)

1. **Deshabilitar auto-publish** completamente
2. **Hacer deploys manuales** solo cuando sea necesario:
   - Click en "Deploys" → "Trigger deploy" → "Deploy site"
   - O usar drag & drop manual de la carpeta `www/`

### Para Producción (Futuro)

Cuando estés listo para producción:
1. **Solo auto-deploy de `main` branch**
2. **Stop auto-publish** habilitado hasta que hagas testing
3. **Builds manuales** para testing antes de publicar

---

## 📋 PASOS PASO A PASO EN NETLIFY

### 1. Entrar a tu sitio
```
https://app.netlify.com/sites/TU_SITIO
```

### 2. Ir a Settings
- Click en **"Site settings"** o **"Configuration"**

### 3. Build & deploy
- Click en **"Build & deploy"** en el menú izquierdo

### 4. Encontrar Continuous Deployment
- Busca la sección **"Continuous Deployment"**
- Verás el repositorio conectado (GitHub/GitLab/etc)

### 5. Deshabilitar Auto-Deploy
**Opción recomendada:** Click en **"Stop auto-publishing"**

O:

**Opción más segura:** Click en **"Disconnect repository"** (temporalmente)

---

## ✅ VERIFICACIÓN

Después de deshabilitar:

1. **Hacer un commit de prueba** (pequeño cambio)
2. **Verificar que NO se dispara un build automático**
3. **Confirmar** que los créditos no se consumen

---

## 🎯 DEPLOYS MANUALES (Seguro)

Una vez deshabilitado auto-deploy, puedes hacer deploys manuales:

### Método 1: Drag & Drop
1. Comprimir carpeta `www/` en ZIP
2. Ir a Netlify → Drag & drop
3. Deploy manual sin consumir créditos de auto-deploy

### Método 2: Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify deploy --dir=www --prod
```

### Método 3: Trigger desde Dashboard
1. Netlify Dashboard → Deploys
2. Click en "Trigger deploy" → "Deploy site"
3. Seleccionar branch o hacer deploy manual

---

## 🚨 IMPORTANTE: Revisar Integraciones

También revisa:

1. **Webhooks** en Settings → Build & deploy
   - Deshabilitar cualquier webhook que dispare builds

2. **GitHub Actions** (si tienes)
   - Verificar que no haya workflows que disparen Netlify

3. **Otros servicios** conectados
   - Cualquier integración que haga auto-deploy

---

## 💡 PREVENCIÓN FUTURA

### Configuración Ideal para Pruebas:

```
✅ Auto-deploy: DESHABILITADO
✅ Deploys: SOLO MANUALES
✅ Builds: Solo cuando necesites actualizar producción
```

### Cuando Estés Listo para Producción:

```
✅ Auto-deploy: SOLO de branch `main`
✅ Deploy contexts: Solo producción
✅ Stop auto-publish: Habilitado (debes aprobar manualmente)
```

---

## 📞 SI NO PUEDES DESHABILITARLO

**Contactar soporte de Netlify:**
- Email: support@netlify.com
- Explicar: "Necesito deshabilitar auto-deploy para evitar consumo excesivo de créditos"

---

## ✅ CHECKLIST INMEDIATO

- [ ] Entrar a Netlify Dashboard
- [ ] Ir a Site Settings → Build & deploy
- [ ] Deshabilitar "Stop auto-publishing"
- [ ] Verificar que no hay webhooks activos
- [ ] Confirmar que los builds ya no se disparan automáticamente
- [ ] Para futuros deploys, usar método manual

---

**¡Haz esto AHORA para evitar más consumo de créditos!** 🚨


