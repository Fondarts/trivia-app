# 🚀 Configuración Live Server VS Code para Quizle!

## 📦 Instalación Live Server

### 1. Instalar extensión
1. Abrir VS Code
2. Ir a Extensions (Ctrl+Shift+X)
3. Buscar "Live Server" por Ritwick Dey
4. Instalar (el que tiene 20M+ descargas)

### 2. Configuración automática
Ya creé el archivo `.vscode/settings.json` con la configuración óptima:
- **Puerto:** 5500 (estándar de Live Server)
- **Host:** localhost
- **Root:** carpeta `/www`
- **CORS:** habilitado

## 🔧 URLs para Google OAuth

### Google Cloud Console
**Ve a:** https://console.cloud.google.com/apis/credentials
**Busca:** `339736953753-h9oekqkii28804iv84r5mqad61p7m4es`

**JavaScript Origins:**
```
http://localhost:5500
http://127.0.0.1:5500
https://fpjkdibubjdbskthofdp.supabase.co
```

**Redirect URIs:**
```
http://localhost:5500/index.html
http://127.0.0.1:5500/index.html
https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback
```

### Supabase Dashboard
**Ve a:** https://supabase.com/dashboard/project/fpjkdibubjdbskthofdp/auth/url-configuration

**Site URL:**
```
http://localhost:5500
```

**Redirect URLs:**
```
http://localhost:5500/index.html
```

## ▶️ Cómo usar Live Server

### Método 1: Click derecho
1. Abrir VS Code en la carpeta del proyecto
2. Ir a la carpeta `www/`
3. Click derecho en `index.html`
4. Seleccionar "Open with Live Server"

### Método 2: Botón Go Live
1. Abrir VS Code en la carpeta del proyecto
2. Click en "Go Live" en la barra de estado (abajo derecha)

### Método 3: Command Palette
1. Ctrl+Shift+P
2. Escribir "Live Server"
3. Seleccionar "Live Server: Open with Live Server"

## ✅ Verificar que funciona

1. **URL esperada:** `http://localhost:5500` o `http://127.0.0.1:5500`
2. **Auto-reload:** Al guardar cambios, la página se recarga automáticamente
3. **OAuth:** Debería funcionar perfectamente una vez configurado

## 🔥 Ventajas de Live Server

- ✅ **Auto-reload:** Cambios se ven instantáneamente
- ✅ **HTTPS support:** Para producción
- ✅ **Mobile testing:** Acceso desde otros dispositivos
- ✅ **Port customization:** Cambiar puerto si es necesario
- ✅ **Browser sync:** Sincroniza scroll y clicks

## 🛠️ Configuración personalizada (opcional)

Si necesitas cambiar el puerto, edita `.vscode/settings.json`:

```json
{
  "liveServer.settings.port": 3000,  // Cambiar puerto
  "liveServer.settings.host": "0.0.0.0"  // Acceso desde red
}
```

## 🚨 Troubleshooting

### Si Live Server no aparece:
- Reinstalar la extensión "Live Server"
- Reiniciar VS Code
- Verificar que estás en la carpeta correcta del proyecto

### Si OAuth sigue fallando:
- Verificar las URLs exactas en Google Console
- Limpiar cache del navegador (Ctrl+Shift+Delete)
- Esperar 5-10 minutos para que Google propague cambios

## 📱 Testing en móvil

Live Server permite testing desde tu móvil:
1. Cambiar host a `0.0.0.0` en settings
2. Usar tu IP local: `http://192.168.0.21:5500`
3. Configurar esa URL en Google OAuth también

¡Tu app ya está lista para desarrollo con Live Server! 🎉