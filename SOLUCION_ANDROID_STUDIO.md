# 🔧 Solución de Problemas - Android Studio

## ✅ Problema Resuelto: Incompatibilidad Java/Gradle

He actualizado la configuración para que sea compatible con Java 21:

1. **Gradle actualizado:** 8.0.2 → 8.5
2. **Android Gradle Plugin actualizado:** 8.0.0 → 8.1.4

## 📋 Pasos para Continuar en Android Studio

### Paso 1: Sincronizar Gradle

1. En Android Studio, haz clic en el botón **"Sync Now"** que aparece en la barra amarilla arriba
2. O ve a: `File > Sync Project with Gradle Files`
3. Espera a que termine la sincronización (puede tardar 2-5 minutos la primera vez)

### Paso 2: Verificar que Todo Esté Bien

Después de sincronizar, deberías ver:
- ✅ Sin errores en la pestaña "Build"
- ✅ El proyecto se ve correctamente en el panel izquierdo
- ✅ No hay avisos rojos

### Paso 3: Configurar el JDK (Si Aún Hay Problemas)

Si todavía ves errores de Java:

1. Ve a: `File > Settings` (o `Android Studio > Preferences` en Mac)
2. `Build, Execution, Deployment > Build Tools > Gradle`
3. En "Gradle JDK", selecciona:
   - **JDK 17** o **JDK 19** (recomendado)
   - O "Embedded JDK" si está disponible
4. Haz clic en "Apply" y "OK"
5. Sincroniza de nuevo: `File > Sync Project with Gradle Files`

### Paso 4: Probar la App

Una vez que todo esté sincronizado:

#### Opción A: En un Dispositivo Físico

1. **Habilita Modo Desarrollador en tu Android:**
   - Configuración > Acerca del teléfono
   - Toca 7 veces en "Número de compilación"
   - Configuración > Opciones de desarrollador
   - Activa "Depuración USB"

2. **Conecta tu dispositivo:**
   - Conecta el cable USB
   - Acepta el diálogo de depuración USB en el teléfono

3. **Ejecuta la app:**
   - En Android Studio, haz clic en el botón verde **"Run"** (▶️)
   - O presiona `Shift + F10`
   - Selecciona tu dispositivo de la lista

#### Opción B: En un Emulador

1. **Crear un Emulador:**
   - En Android Studio, haz clic en el ícono de dispositivo (📱) en la barra superior
   - O ve a: `Tools > Device Manager`
   - Haz clic en **"Create Device"**
   - Selecciona un dispositivo (ej: Pixel 5)
   - Selecciona una imagen del sistema (ej: Android 13 - API 33)
   - Haz clic en "Finish"

2. **Iniciar el Emulador:**
   - Haz clic en el botón **"Play"** (▶️) junto al emulador creado
   - Espera a que inicie (puede tardar 1-2 minutos la primera vez)

3. **Ejecutar la app:**
   - Haz clic en **"Run"** (▶️) en Android Studio
   - Selecciona el emulador de la lista

## 🐛 Si Aún Hay Problemas

### Error: "SDK location not found"

1. Ve a: `File > Settings > Appearance & Behavior > System Settings > Android SDK`
2. Copia la ruta del "Android SDK Location"
3. Crea o edita `android/local.properties` y agrega:
   ```
   sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
   ```
   (Reemplaza con tu ruta real)

### Error: "Gradle sync failed"

1. `File > Invalidate Caches / Restart`
2. Selecciona "Invalidate and Restart"
3. Espera a que Android Studio reinicie
4. `File > Sync Project with Gradle Files`

### La app no carga / Pantalla en blanco

1. Verifica que las rutas en `www/` usen `./` (rutas relativas)
2. Desde la terminal, ejecuta: `npm run android:sync`
3. Limpia el proyecto: `Build > Clean Project`
4. Reconstruye: `Build > Rebuild Project`

## ✅ Checklist de Verificación

Antes de ejecutar, verifica:

- [ ] Gradle se sincronizó sin errores
- [ ] No hay errores rojos en la pestaña "Build"
- [ ] Tienes un dispositivo conectado o un emulador iniciado
- [ ] El dispositivo/emulador aparece en la lista de dispositivos

## 🎯 Siguiente Paso

Una vez que la app se ejecute correctamente:

1. Prueba todas las funcionalidades
2. Verifica que las imágenes carguen
3. Prueba el modo aventura
4. Verifica el login

Si todo funciona, ¡tu app está lista! 🎉


