# ⚡ Acceso Rápido al Dashboard de Netlify

## 🔗 Enlaces Directos

### 1. Dashboard Principal
```
https://app.netlify.com
```

### 2. Usage & Billing (Ver consumo)
```
https://app.netlify.com/teams/TU_TEAM/usage
```
⚠️ Reemplaza `TU_TEAM` con el nombre de tu equipo

### 3. Deploys de tu Sitio
```
https://app.netlify.com/sites/TU_SITIO/deploys
```
⚠️ Reemplaza `TU_SITIO` con el nombre de tu sitio (ej: `quizlo-app`)

### 4. Site Settings
```
https://app.netlify.com/sites/TU_SITIO/configuration
```

---

## 🎯 Qué Buscar (Resumen)

1. **En Usage:**
   - ¿Bandwidth > 100 GB? → Problema de tráfico
   - ¿Build minutes > 300? → Problema de builds

2. **En Deploys:**
   - Builds ❌ fallidos repetidos
   - Muchos builds automáticos
   - Builds que duran mucho tiempo

3. **En Settings → Build & deploy:**
   - ¿Auto-deploy habilitado?
   - ¿Integración con Git?
   - ¿Builds de todas las branches?

---

## 📋 Checklist Rápido

- [ ] Abrir: https://app.netlify.com
- [ ] Ir a Usage (menú del equipo)
- [ ] Ver qué se excedió (bandwidth o builds)
- [ ] Ir a Deploys del sitio
- [ ] Contar builds fallidos este mes
- [ ] Revisar configuración de builds

---

**Ver guía completa:** `GUIA_REVISAR_DASHBOARD_NETLIFY.md`


