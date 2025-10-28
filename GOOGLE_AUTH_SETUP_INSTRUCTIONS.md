# 🔐 Instrucciones para Configurar Google Authentication

## 📋 Resumen de Cambios Realizados

He actualizado el código para usar el flujo OAuth web estándar de Supabase, que funciona tanto en web como en Android. Los cambios principales incluyen:

1. ✅ Configuración centralizada de OAuth
2. ✅ Manejo correcto de URLs de redirección
3. ✅ Detección automática de plataforma
4. ✅ Sistema de callbacks mejorado

## 🔧 Configuración Requerida

### 1. **Supabase Dashboard** (https://supabase.com/dashboard/project/fpjkdibubjdbskthofdp)

#### A. Authentication → URL Configuration

**Site URL:**
```
http://localhost:8100
```

**Redirect URLs** (agregar todas estas):
```
http://localhost:8100
http://localhost:8100/index.html
http://localhost:8100/auth-callback.html
http://192.168.0.13:8100
http://192.168.0.13:8100/index.html
http://192.168.0.13:8100/auth-callback.html
https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback
com.quizlo.app://oauth/callback
https://www.quizlo.app
https://www.quizlo.app/index.html
```

#### B. Authentication → Providers → Google

**Enable Sign in with Google:** ✅ **ON**

**Client IDs:**
```
[TU_CLIENT_ID_AQUI]
```

**Client Secret (for OAuth):**
```
[TU_CLIENT_SECRET_AQUI]
```

**Skip nonce checks:** ✅ **ON** (importante para Android)

### 2. **Google Cloud Console** (https://console.cloud.google.com)

#### A. Web Client (339736953753-h9oekqkii28804iv84r5mqad61p7m4es)

**Authorized JavaScript Origins:**
```
http://localhost:8100
http://localhost:5173
http://localhost:3000
http://localhost:5500
http://127.0.0.1:5500
https://fpjkdibubjdbskthofdp.supabase.co
https://www.quizlo.app
```

**Authorized Redirect URIs:**
```
http://localhost:8100/auth-callback.html
http://localhost:8100/index.html
http://localhost:5173/auth-callback.html
http://localhost:5500/index.html
http://127.0.0.1:5500/index.html
https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback
https://www.quizlo.app/index.html
```

#### B. Android Client (339736953753-shffn13ho0g92064uh7ooj95pcgebpoj)

**Package Name:**
```
com.quizlo.app
```

**SHA-1 Certificate Fingerprint:**
```
64:BD:E7:9D:4C:FE:2E:B7:AC:12:82:AF:B5:75:24:D3:3C:CF:3C:79
```

## 🚀 Cómo Probar

### Web (Desarrollo Local)
1. Ejecuta tu servidor local en `http://localhost:8100`
2. Haz clic en "Iniciar Sesión / Registrarse"
3. Selecciona Google
4. Debería redirigir a Google, autenticar, y regresar a tu app

### Android
1. Compila la app: `npx cap build android`
2. Instala en dispositivo: `npx cap run android`
3. Haz clic en "Iniciar Sesión / Registrarse"
4. Selecciona Google
5. Se abrirá el navegador, autenticar, y regresar a la app

## 🔍 Debugging

Si hay problemas, revisa la consola del navegador para estos mensajes:

- ✅ `Cliente Supabase inicializado`
- ✅ `Sistema de autenticación v2.0 cargado`
- ✅ `OAuth iniciado, redirigiendo...`

Si ves errores de "redirect URL not configured", verifica que todas las URLs estén agregadas en Supabase.

## 📱 Notas Importantes

1. **Para desarrollo local:** Usa ` http://localhost:8100` (no IPs)
2. **Para Android:** El flujo web funciona perfectamente sin plugins nativos
3. **URLs de redirección:** Deben coincidir exactamente entre Google Cloud y Supabase
4. **Skip nonce checks:** Debe estar habilitado en Supabase para Android

## 🆘 Solución de Problemas

### Error: "redirect_uri_mismatch"
- Verifica que la URL esté en Google Cloud Console
- Asegúrate de usar `localhost` en desarrollo

### Error: "invalid_client"
- Verifica que el Client ID sea correcto
- Asegúrate de que el Client Secret sea correcto

### Error: "access_denied"
- El usuario canceló el login
- No es un error del sistema

### La app no regresa después del login
- Verifica que las URLs de redirección estén configuradas
- Revisa que `detectSessionInUrl: true` esté en la configuración de Supabase

