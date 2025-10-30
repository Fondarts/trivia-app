# ⚠️ Configuración para Evitar Auto-Deploy en Netlify

Este archivo documenta cómo evitar que los cambios en el repositorio disparen builds automáticos en Netlify.

## 🚨 PROBLEMA

Si Netlify está configurado con **auto-deploy** conectado a Git:
- Cada commit dispara un build automático
- Cada build consume **15 créditos**
- 20 commits = 300 créditos consumidos = Límite excedido

## ✅ SOLUCIÓN

### Opción 1: Deshabilitar en Netlify Dashboard (RECOMENDADO)

1. Ir a: https://app.netlify.com/sites/TU_SITIO/configuration/deploys
2. Click en **"Stop auto-publishing"**
3. O **"Disconnect repository"** temporalmente

### Opción 2: Usar [skip netlify] en commits

Si necesitas mantener auto-deploy pero evitar algunos builds:
```
git commit -m "fix: actualizar código [skip netlify]"
```

### Opción 3: Configurar netlify.toml con builds condicionales

Crear archivo `.netlify/deploy-settings.json`:
```json
{
  "build_settings": {
    "skip_build": true
  }
}
```

---

## 📝 NOTA IMPORTANTE

**Para desarrollo/testing:** Usa deploys manuales (drag & drop)
**Para producción:** Configura auto-deploy solo de branch `main` con aprobación manual

---

**Ver guía completa:** `DESHABILITAR_AUTO_DEPLOY.md`


