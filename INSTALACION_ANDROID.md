# 🚀 Guía de Instalación - App Nativa Android Quizlo!

Esta es una guía paso a paso para convertir tu proyecto Quizlo! en una app Android nativa.

## ✅ Checklist de Requisitos

Antes de empezar, asegúrate de tener:

- [ ] **Node.js** instalado (v16 o superior)
  - Verifica: `node --version`
  - Descarga: https://nodejs.org/

- [ ] **Android Studio** instalado
  - Descarga: https://developer.android.com/studio
  - Incluye: Android SDK, Gradle, Emulador

- [ ] **Java JDK** (v11 o superior)
  - Generalmente incluido con Android Studio
  - Verifica: `java -version`

## 📦 Paso 1: Instalar Dependencias

Abre una terminal en la raíz del proyecto (`F:\Proyectos\trivia\V03`) y ejecuta:

```bash
npm install
```

Esto instalará Capacitor y todos los plugins necesarios.

**⏱️ Tiempo estimado:** 2-5 minutos

---

## 🔧 Paso 2: Agregar Plataforma Android

Ejecuta:

```bash
npx cap add android
```

Esto creará la carpeta `android/` con todo el proyecto Android nativo.

**⏱️ Tiempo estimado:** 1-2 minutos

**✅ Verificación:** Deberías ver una carpeta `android/` en la raíz del proyecto.

---

## 🔄 Paso 3: Sincronizar Archivos Web

Cada vez que hagas cambios en `www/`, ejecuta:

```bash
npm run android:sync
```

O directamente:
```bash
npx cap sync android
```

Esto copia todos los archivos de `www/` a la app Android.

**⏱️ Tiempo estimado:** 10-30 segundos

**💡 Tip:** Ejecuta esto después de cada cambio en tu código web.

---

## 🎨 Paso 4: Abrir en Android Studio

Ejecuta:

```bash
npm run android:open
```

O directamente:
```bash
npx cap open android
```

Esto abrirá Android Studio con tu proyecto.

**⏱️ Tiempo estimado:** 30 segundos - 2 minutos (depende de tu PC)

---

## 🏗️ Paso 5: Configurar Android Studio (Primera Vez)

### 5.1 Esperar a que se Indexe

Android Studio necesita indexar los archivos. Espera a que termine (barra de progreso abajo).

### 5.2 Configurar SDK (Si es necesario)

1. Ve a `File > Settings` (o `Android Studio > Preferences` en Mac)
2. `Appearance & Behavior > System Settings > Android SDK`
3. Asegúrate de tener instalado:
   - Android SDK Platform 33 (o superior)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools

### 5.3 Sincronizar Gradle

1. Si ves un aviso "Gradle Sync", haz clic en "Sync Now"
2. O ve a `File > Sync Project with Gradle Files`

**⏱️ Tiempo estimado:** 5-10 minutos (solo la primera vez)

---

## 📱 Paso 6: Probar la App

### Opción A: En un Dispositivo Físico

1. **Habilita Modo Desarrollador en tu Android:**
   - Ve a `Configuración > Acerca del teléfono`
   - Toca 7 veces en "Número de compilación"
   - Vuelve a `Configuración > Opciones de desarrollador`
   - Activa "Depuración USB"

2. **Conecta tu dispositivo:**
   - Conecta el cable USB
   - Acepta el diálogo de depuración USB en el teléfono

3. **Ejecuta la app:**
   - En Android Studio, haz clic en el botón verde "Run" (▶️)
   - O presiona `Shift + F10`
   - Selecciona tu dispositivo de la lista

### Opción B: En un Emulador

1. **Crear un Emulador:**
   - En Android Studio, haz clic en el ícono de dispositivo (📱)
   - O ve a `Tools > Device Manager`
   - Haz clic en "Create Device"
   - Selecciona un dispositivo (ej: Pixel 5)
   - Selecciona una imagen del sistema (ej: Android 13)
   - Finaliza la creación

2. **Iniciar el Emulador:**
   - Haz clic en el botón "Play" (▶️) junto al emulador
   - Espera a que inicie (puede tardar 1-2 minutos)

3. **Ejecutar la app:**
   - Haz clic en "Run" (▶️) en Android Studio
   - Selecciona el emulador

**⏱️ Tiempo estimado:** 2-5 minutos

---

## 🔨 Paso 7: Compilar APK

### APK de Debug (Para Pruebas)

Desde la terminal:

```bash
npm run android:build:debug
```

O desde Android Studio:
1. `Build > Build Bundle(s) / APK(s) > Build APK(s)`
2. Espera a que termine
3. El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

### APK de Release (Para Publicar)

**⚠️ IMPORTANTE:** Necesitas crear un keystore primero (ver siguiente sección).

```bash
npm run android:build
```

---

## 🔐 Paso 8: Crear Keystore (Para Publicar)

Un keystore es necesario para firmar tu app y publicarla en Google Play.

### 8.1 Crear el Keystore

Ejecuta en la terminal (en la raíz del proyecto):

```bash
keytool -genkey -v -keystore quizlo-release.keystore -alias quizlo -keyalg RSA -keysize 2048 -validity 10000
```

Te pedirá:
- **Contraseña del keystore:** (guárdala bien, la necesitarás siempre)
- **Confirmar contraseña**
- **Nombre y apellidos:** Tu nombre o nombre de la empresa
- **Unidad organizativa:** (puedes dejarlo vacío)
- **Organización:** Quizlo! (o tu organización)
- **Ciudad:** Tu ciudad
- **Estado/Provincia:** Tu estado
- **Código de país:** ES (o tu país)

**⚠️ IMPORTANTE:**
- Guarda el archivo `quizlo-release.keystore` en un lugar SEGURO
- **NUNCA** lo subas a Git
- Guarda las contraseñas en un lugar seguro
- Si pierdes el keystore, NO podrás actualizar tu app en Google Play

### 8.2 Configurar el Keystore en Android

1. Mueve `quizlo-release.keystore` a la carpeta `android/app/`

2. Crea o edita `android/key.properties`:

```properties
storePassword=TU_PASSWORD_DEL_KEYSTORE
keyPassword=TU_PASSWORD_DEL_KEY
keyAlias=quizlo
storeFile=quizlo-release.keystore
```

3. Edita `android/app/build.gradle` y agrega al inicio:

```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

4. Y en la sección `android`, agrega:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
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

---

## 📤 Paso 9: Generar APK/AAB para Google Play

### Opción A: APK (Más simple, pero limitado)

```bash
cd android
./gradlew assembleRelease
```

El APK estará en: `android/app/build/outputs/apk/release/app-release.apk`

### Opción B: AAB (Recomendado por Google Play)

```bash
cd android
./gradlew bundleRelease
```

El AAB estará en: `android/app/build/outputs/bundle/release/app-release.aab`

**✅ Recomendación:** Usa AAB, Google Play lo prefiere y genera APKs optimizados automáticamente.

---

## 🎯 Paso 10: Publicar en Google Play

1. **Crear cuenta de desarrollador:**
   - Ve a https://play.google.com/console
   - Paga la tarifa única de $25 USD
   - Completa el perfil de desarrollador

2. **Crear la app:**
   - Haz clic en "Crear aplicación"
   - Completa la información básica
   - Selecciona "Gratis" o "De pago"

3. **Subir el AAB:**
   - Ve a "Producción" > "Crear versión"
   - Sube tu archivo `.aab`
   - Completa las notas de la versión

4. **Completar la tienda:**
   - Icono (512x512px)
   - Capturas de pantalla (mínimo 2)
   - Descripción
   - Categoría
   - Política de privacidad (si es necesario)

5. **Enviar para revisión:**
   - Revisa todo
   - Haz clic en "Enviar para revisión"
   - Espera 1-3 días para la aprobación

---

## 🔄 Flujo de Trabajo Diario

Cada vez que hagas cambios:

1. **Modifica tu código** en `www/`
2. **Sincroniza:**
   ```bash
   npm run android:sync
   ```
3. **Abre Android Studio:**
   ```bash
   npm run android:open
   ```
4. **Ejecuta la app** (botón Run ▶️)
5. **Prueba los cambios**

---

## 🐛 Solución de Problemas Comunes

### Error: "SDK location not found"

Crea `android/local.properties`:

```properties
sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
```

(Reemplaza con tu ruta real del SDK)

### Error: "Gradle sync failed"

1. `File > Invalidate Caches / Restart`
2. `File > Sync Project with Gradle Files`

### La app no carga / Pantalla en blanco

1. Verifica que las rutas en `www/` usen `./` (rutas relativas)
2. Ejecuta `npm run android:sync`
3. Limpia el proyecto: `cd android && ./gradlew clean`

### Error de permisos en Android

Edita `android/app/src/main/AndroidManifest.xml` y agrega los permisos necesarios:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## 📚 Comandos Útiles

```bash
# Sincronizar cambios
npm run android:sync

# Abrir en Android Studio
npm run android:open

# Compilar APK debug
npm run android:build:debug

# Compilar APK release
npm run android:build

# Limpiar proyecto
cd android && ./gradlew clean
```

---

## ✅ Checklist Final

Antes de publicar, verifica:

- [ ] La app funciona correctamente en un dispositivo
- [ ] Todas las imágenes cargan correctamente
- [ ] Los anuncios funcionan (si aplica)
- [ ] El login funciona
- [ ] El modo aventura funciona
- [ ] El APK/AAB está firmado correctamente
- [ ] Tienes icono de 512x512px
- [ ] Tienes capturas de pantalla
- [ ] Tienes descripción de la app
- [ ] Has leído las políticas de Google Play

---

## 🎉 ¡Listo!

Tu app Quizlo! está lista para Android. Si tienes problemas, consulta la documentación de Capacitor: https://capacitorjs.com/docs/android


