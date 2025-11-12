# 🔐 Solución: OAuth no regresa a la App Android

## ❌ Problema

Cuando te logueas en la app Android, después de autenticarte con Google:
- Se abre el navegador web en lugar de volver a la app
- La app se queda esperando el login
- No se completa la autenticación

## ✅ Solución Implementada

He realizado los siguientes cambios:

### 1. Deep Links Configurados en AndroidManifest.xml

Agregué los `intent-filter` necesarios para que Android reconozca el deep link:
- `app.quizlo.trivia://oauth/callback` (usando el appId correcto)
- `com.quizle.app://oauth/callback` (compatibilidad con código existente)

### 2. Código OAuth Actualizado

- Actualizado `simple-oauth.js` para usar el appId correcto
- Mejorado el manejo del callback con `handleOAuthCallback()`
- Agregado listener de `appUrlOpen` para detectar cuando regresa a la app
- Agregado verificación de `getLaunchUrl()` para cuando la app se abre con el deep link

### 3. Plugin App de Capacitor Agregado

Agregado `@capacitor/app` a las dependencias para manejar deep links.

## 📋 Pasos para Aplicar la Solución

### Paso 1: Instalar el Plugin App

En la terminal (en la raíz del proyecto):

```bash
npm install
```

Esto instalará el plugin `@capacitor/app` que falta.

### Paso 2: Sincronizar con Android

```bash
npm run android:sync
```

O directamente:
```bash
npx cap sync android
```

### Paso 3: Recompilar la App

En Android Studio:

1. **`Build > Clean Project`**
2. **`Build > Rebuild Project`**
3. **Ejecuta la app de nuevo** (botón Run ▶️)

### Paso 4: Configurar Redirect URL en Supabase

**IMPORTANTE:** Necesitas agregar el deep link en Supabase:

1. Ve a: https://supabase.com/dashboard/project/fpjkdibubjdbskthofdp/auth/url-configuration
2. En **"Redirect URLs"**, agrega:
   ```
   app.quizlo.trivia://oauth/callback
   ```
3. Haz clic en **"Save"**

### Paso 5: Probar el Login

1. Ejecuta la app en tu dispositivo
2. Haz clic en "Iniciar Sesión / Registrarse"
3. Selecciona Google
4. Completa el login en el navegador
5. **Debería regresar automáticamente a la app** y completar el login

## 🔍 Verificación

Después de los cambios, cuando te loguees deberías ver en la consola:

```
📱 Configurando listener de deep links para Android
🔗 Deep link recibido: app.quizlo.trivia://oauth/callback#access_token=...
🎯 Token detectado, procesando...
✅ Tokens encontrados, estableciendo sesión...
🎉 ¡Login exitoso! tu@email.com
```

## 🐛 Si Aún No Funciona

### Verificar que el Deep Link Está Configurado

1. En Android Studio, abre `android/app/src/main/AndroidManifest.xml`
2. Verifica que hay dos `intent-filter` con `android:scheme="app.quizlo.trivia"` y `android:scheme="com.quizle.app"`

### Verificar que Supabase Tiene la URL

1. Ve a Supabase Dashboard > Auth > URL Configuration
2. Verifica que `app.quizlo.trivia://oauth/callback` está en la lista de Redirect URLs

### Probar el Deep Link Manualmente

Puedes probar si el deep link funciona:

1. En tu dispositivo Android, abre el navegador
2. Escribe en la barra de direcciones:
   ```
   app.quizlo.trivia://oauth/callback#test=123
   ```
3. Debería abrirse la app (aunque no procese el login, confirma que el deep link funciona)

### Logs de Debug

Abre la consola de Android Studio (Logcat) y busca:
- `🔗 Deep link recibido`
- `🔄 Procesando callback OAuth`
- `✅ Tokens encontrados`

Si no ves estos mensajes, el deep link no se está recibiendo.

## 📝 Cambios Realizados

1. ✅ `AndroidManifest.xml` - Agregados intent-filters para deep links
2. ✅ `simple-oauth.js` - Mejorado manejo de callbacks
3. ✅ `auth_v2.js` - Actualizado redirectTo con appId correcto
4. ✅ `main.js` - Agregada verificación de launch URL
5. ✅ `package.json` - Agregado @capacitor/app

## 🎯 Siguiente Paso

Después de aplicar estos cambios y recompilar:

1. **Desinstala la app** del dispositivo (si ya estaba instalada)
2. **Instala de nuevo** la versión nueva
3. **Prueba el login**

El login debería funcionar correctamente y regresar a la app después de autenticarte.

---

**Nota:** Asegúrate de agregar la URL `app.quizlo.trivia://oauth/callback` en Supabase, sin esto el login no funcionará.

