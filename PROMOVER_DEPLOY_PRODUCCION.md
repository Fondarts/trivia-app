# 🔄 Promover Deploy Preview a Production

## ⚠️ Problema Detectado

- ✅ Deploy exitoso en **Preview** con código de AdSense
- ⚠️ **Production** sigue con el commit anterior (3h ago)
- AdSense necesita verificar en **Production** (`www.quizlo.app`)

---

## 🎯 SOLUCIÓN: Promover Deploy a Production

### Opción 1: Promover desde Vercel Dashboard (RECOMENDADO)

1. **Ve a:** https://vercel.com/dashboard
2. **Click en:** Tu proyecto "trivia-app"
3. **Busca el deploy Preview** con commit `3633e1e` ("feat: agregar código de verificación")
4. **Click en los tres puntos (...)** del deploy Preview
5. **Selecciona:** "Promote to Production"
6. **Confirma** la promoción

### Opción 2: Esperar Auto-Deploy (Si está configurado)

Si Vercel está configurado para auto-deploy desde `main`:
- Puede tardar unos minutos
- Verifica el estado en el dashboard

---

## ✅ DESPUÉS DE PROMOVER

Una vez que Production tenga el código de AdSense:

1. **Esperar 5-10 minutos** para que los cambios se propaguen
2. **Verificar que el código está en producción:**
   - Visita: `https://www.quizlo.app`
   - Ver código fuente (Ctrl+U)
   - Buscar: `adsbygoogle.js?client=ca-pub-7829392929574421`
   - Debe aparecer en el `<head>`

3. **Intentar verificación en AdSense nuevamente:**
   - Ve a AdSense Dashboard
   - Click en "Verificar" nuevamente
   - Debe funcionar ahora

---

## 🔍 Verificar que el Código Está en Producción

**Método rápido:**

1. Abre: `https://www.quizlo.app`
2. Presiona `Ctrl+U` (ver código fuente)
3. Busca (Ctrl+F): `adsbygoogle`
4. Debe aparecer el script de AdSense en el `<head>`

Si **NO aparece**, el deploy aún no está en producción.

---

## 📋 Checklist

- [ ] ✅ Deploy en Preview completado
- [ ] ⏳ Promover deploy a Production
- [ ] ⏳ Verificar código en `www.quizlo.app`
- [ ] ⏳ Intentar verificación en AdSense nuevamente
- [ ] ⏳ Esperar aprobación de AdSense

---

**¿Puedes promover el deploy Preview a Production desde el dashboard de Vercel?**

Una vez que esté en producción, AdSense podrá verificar el código correctamente.


