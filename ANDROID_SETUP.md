# 📱 Guía de Adaptación para Android - Quizlo!

Esta guía te ayudará a convertir tu aplicación web Quizlo! en una aplicación Android nativa usando Capacitor.

## 📋 Requisitos Previos

1. **Node.js** (v16 o superior)
   - Descarga desde: https://nodejs.org/

2. **Android Studio**
   - Descarga desde: https://developer.android.com/studio
   - Incluye el SDK de Android y las herramientas necesarias

3. **Java JDK** (v11 o superior)
   - Generalmente incluido con Android Studio

## 🚀 Instalación Paso a Paso

### Paso 1: Instalar Capacitor

Abre una terminal en la raíz del proyecto y ejecuta:

```bash
npm install
```

Esto instalará Capacitor y todas las dependencias necesarias.

### Paso 2: Inicializar Capacitor (si es la primera vez)

```bash
npx cap init
```

Si ya tienes `capacitor.config.json`, puedes omitir este paso.

### Paso 3: Agregar la plataforma Android

```bash
npx cap add android
```

Esto creará la carpeta `android/` con el proyecto Android nativo.

### Paso 4: Sincronizar archivos web

Cada vez que hagas cambios en la carpeta `www/`, ejecuta:

```bash
npm run android:sync
```

O directamente:
```bash
npx cap sync android
```

### Paso 5: Abrir en Android Studio

```bash
npm run android:open
```

O directamente:
```bash
npx cap open android
```

Esto abrirá el proyecto en Android Studio.

## 🔨 Compilar y Ejecutar

### Opción 1: Desde Android Studio

1. Abre Android Studio
2. Espera a que se indexen los archivos
3. Conecta un dispositivo Android o inicia un emulador
4. Haz clic en el botón "Run" (▶️) o presiona `Shift + F10`

### Opción 2: Desde la Terminal

Para compilar un APK de debug:
```bash
npm run android:build:debug
```

Para compilar un APK de release (firmado):
```bash
npm run android:build
```

El APK se encontrará en:
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

## 📦 Generar APK Firmado para Google Play

### 1. Crear un Keystore

```bash
keytool -genkey -v -keystore quizlo-release.keystore -alias quizlo -keyalg RSA -keysize 2048 -validity 10000
```

Guarda el archivo `quizlo-release.keystore` en un lugar seguro y **nunca lo subas a Git**.

### 2. Configurar el Keystore

Edita `android/app/build.gradle` y agrega:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../../quizlo-release.keystore')
            storePassword 'TU_PASSWORD'
            keyAlias 'quizlo'
            keyPassword 'TU_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

**⚠️ IMPORTANTE:** No subas el archivo `build.gradle` con las contraseñas a Git. Usa variables de entorno o un archivo local.

### 3. Compilar APK Firmado

```bash
cd android
./gradlew assembleRelease
```

El APK firmado estará en: `android/app/build/outputs/apk/release/app-release.apk`

## 🎨 Personalización

### Cambiar el Nombre de la App

Edita `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">Quizlo!</string>
</resources>
```

### Cambiar el Icono de la App

1. Genera iconos en diferentes tamaños (usando herramientas como [App Icon Generator](https://www.appicon.co/))
2. Reemplaza los iconos en:
   - `android/app/src/main/res/mipmap-*/ic_launcher.png`
   - `android/app/src/main/res/mipmap-*/ic_launcher_round.png`

### Cambiar el Splash Screen

El splash screen se configura en `capacitor.config.json`. Puedes personalizar:
- Color de fondo
- Duración
- Imagen (agregando recursos en `android/app/src/main/res/`)

## 🔧 Solución de Problemas

### Error: "SDK location not found"

1. Abre Android Studio
2. Ve a `File > Settings > Appearance & Behavior > System Settings > Android SDK`
3. Copia la ruta del "Android SDK Location"
4. Crea un archivo `local.properties` en `android/` con:
   ```
   sdk.dir=/ruta/a/tu/android/sdk
   ```

### Error: "Gradle sync failed"

1. Abre Android Studio
2. Ve a `File > Sync Project with Gradle Files`
3. Si persiste, ve a `File > Invalidate Caches / Restart`

### La app no carga correctamente

1. Verifica que todas las rutas en `www/` usen rutas relativas (`./`)
2. Ejecuta `npx cap sync android` después de cada cambio
3. Limpia el proyecto: `cd android && ./gradlew clean`

### Problemas con CORS o red

Verifica que los dominios permitidos estén en `capacitor.config.json` bajo `server.allowNavigation`.

## 📱 Probar como PWA (Sin Instalar Android Studio)

Si solo quieres probar la app como PWA instalable:

1. Sirve los archivos con un servidor HTTP:
   ```bash
   npm run serve
   ```

2. Abre Chrome en Android
3. Ve a `http://tu-ip:8080`
4. En el menú de Chrome, selecciona "Agregar a pantalla de inicio"

## 🚀 Publicar en Google Play

1. Crea una cuenta de desarrollador en [Google Play Console](https://play.google.com/console)
2. Prepara:
   - APK o AAB firmado
   - Icono de la app (512x512px)
   - Capturas de pantalla
   - Descripción de la app
3. Sigue el proceso de publicación en Google Play Console

## 📚 Recursos Adicionales

- [Documentación de Capacitor](https://capacitorjs.com/docs)
- [Guía de Android](https://capacitorjs.com/docs/android)
- [Google Play Console](https://play.google.com/console)

## ⚡ Comandos Rápidos

```bash
# Sincronizar cambios
npm run android:sync

# Abrir en Android Studio
npm run android:open

# Compilar APK de debug
npm run android:build:debug

# Servir localmente
npm run serve
```

---

¡Listo! Tu app Quizlo! ahora está lista para Android. 🎉


