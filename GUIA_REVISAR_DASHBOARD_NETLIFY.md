# 🔍 Guía Paso a Paso: Revisar Dashboard de Netlify

## 📊 PASO 1: Acceder al Dashboard de Uso

1. **Abre tu navegador** y ve a:
   ```
   https://app.netlify.com
   ```

2. **Inicia sesión** con tu cuenta de Netlify

3. **Click en tu nombre/avatar** (esquina superior derecha)
   - Selecciona el **equipo (team)** que estás usando

4. **Busca la sección "Usage & billing"** o "Usage"
   - Puede estar en el menú lateral izquierdo
   - O en: `https://app.netlify.com/teams/TU_TEAM/usage`
   - Reemplaza `TU_TEAM` con el nombre de tu equipo

---

## 📈 PASO 2: Revisar Uso de Recursos

En la página de **Usage**, deberías ver:

### Sección de Bandwidth (Ancho de Banda)
- **Total usado:** X GB de 100 GB
- **Gráfico mensual** mostrando el consumo
- **Días específicos** con mayor consumo

**¿Qué buscar?**
- ¿Hay picos súbitos de tráfico?
- ¿El consumo es constante o hay días específicos?
- ¿Se acercó a los 100 GB?

### Sección de Build Minutes
- **Total usado:** X minutos de 300 minutos
- **Gráfico** mostrando builds por día
- **Lista de builds** más recientes

**¿Qué buscar?**
- ¿Hay muchos builds?
- ¿Builds que fallan repetidamente?
- ¿Builds que duran mucho tiempo?

### Sección de Function Invocations (si aplica)
- Si usas Netlify Functions, verás el consumo aquí

---

## 🚨 PASO 3: Revisar Historial de Builds

1. **Ve a tu sitio específico:**
   - Click en el nombre de tu sitio (`quizlo.app` o similar)

2. **Click en "Deploys"** en el menú superior

3. **Revisa la lista de deploys:**
   - Busca builds marcados con ❌ (fallidos)
   - Busca builds que duran mucho tiempo
   - Busca builds que se disparan automáticamente

4. **Click en cualquier build fallido** para ver los logs:
   - ¿Qué error muestra?
   - ¿Se está reintentando automáticamente?

---

## 🔍 PASO 4: Revisar Configuración de Builds

1. **En tu sitio**, ve a **"Site settings"**

2. **Click en "Build & deploy"**

3. **Revisa:**

   **Build settings:**
   - ¿Qué comando se ejecuta?
   - ¿Cuánto tiempo suele durar?

   **Deploy settings:**
   - ¿Está habilitado "Auto publish"?
   - ¿Hay webhooks configurados?
   - ¿Hay integraciones con Git (GitHub/GitLab)?

   **Deploy contexts:**
   - ¿Se hacen builds de todas las branches?
   - ¿Solo de producción?

---

## 📋 PASO 5: Revisar Integraciones de Git

1. **En "Site settings"** → **"Build & deploy"**

2. **Revisa "Continuous deployment"**:
   - ¿Está conectado a un repositorio Git?
   - ¿Se hacen builds automáticos en cada commit?
   - ¿Hay muchas branches activas?

3. **Si está conectado a Git:**
   - Ve a tu repositorio (GitHub/GitLab)
   - Revisa cuántos commits hiciste este mes
   - Cada commit puede disparar un build

---

## 🎯 QUÉ BUSCAR ESPECÍFICAMENTE

### Señales de Problema:

1. **Builds infinitos:**
   - Builds que fallan y se reintentan automáticamente
   - Builds que nunca terminan (timeout)
   - Builds que consumen muchos minutos

2. **Tráfico inusual:**
   - Picos súbitos de bandwidth
   - Días con consumo muy alto
   - Posibles bots o crawlers

3. **Auto-deploy agresivo:**
   - Builds en cada commit pequeño
   - Builds de múltiples branches
   - Builds manuales frecuentes

---

## 📸 INFORMACIÓN ÚTIL PARA CAPTURAR

Toma screenshots o apunta:

1. **Gráfico de Usage:**
   - Bandwidth mensual
   - Build minutes mensual
   - Días con mayor consumo

2. **Lista de builds:**
   - Cuántos builds fallidos hay
   - Cuántos builds exitosos
   - Tiempo promedio de builds

3. **Configuración actual:**
   - Comando de build
   - Si hay auto-deploy
   - Si hay integración con Git

---

## ✅ CHECKLIST DE REVISIÓN

- [ ] Accedí al dashboard de Usage
- [ ] Revisé el consumo de bandwidth
- [ ] Revisé el consumo de build minutes
- [ ] Revisé el historial de deploys
- [ ] Identifiqué builds fallidos
- [ ] Revisé configuración de builds
- [ ] Revisé integraciones de Git
- [ ] Tomé notas de lo que encontré

---

## 🆘 SI NO PUEDES ACCEDER

**Alternativas:**
1. **Contactar soporte directamente:**
   - Email: support@netlify.com
   - Menciona que quieres entender qué consumió tus créditos

2. **Revisar email de Netlify:**
   - Busca emails de Netlify sobre límites
   - Pueden tener detalles del consumo

---

## 💡 DESPUÉS DE REVISAR

Una vez que hayas revisado el dashboard, comparte:

1. **¿Qué consumió más recursos?**
   - Bandwidth o Build minutes

2. **¿Hay builds fallidos?**
   - Cuántos y cuál es el error

3. **¿Hay auto-deploy configurado?**
   - Si hay integración con Git

Con esta información podremos:
- ✅ Identificar la causa exacta
- ✅ Prevenir que vuelva a pasar
- ✅ Optimizar la configuración
- ✅ Decidir si migrar o quedarse en Netlify

---

**¡Vamos a investigar juntos!** 🔍


