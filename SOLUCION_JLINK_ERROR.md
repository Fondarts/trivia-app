# 🔧 Solución: Error de jlink.exe

## ❌ Problema

El error `Error while executing process jlink.exe` ocurre porque Android Studio está usando Java 21 (JBR) que tiene problemas con algunas versiones de Gradle.

## ✅ Solución Rápida (3 Pasos)

### Paso 1: Configurar JDK en Android Studio

1. En Android Studio, ve a: **`File > Settings`** (o `Ctrl + Alt + S`)
2. Navega a: **`Build, Execution, Deployment > Build Tools > Gradle`**
3. En **"Gradle JDK"**, cambia a:
   - **JDK 17** (recomendado)
   - O **JDK 19**
   - O **"Embedded JDK"** si está disponible
4. Haz clic en **"Apply"** y **"OK"**

### Paso 2: Limpiar Caché de Gradle

En Android Studio:

1. Ve a: **`File > Invalidate Caches / Restart`**
2. Selecciona: **"Invalidate and Restart"**
3. Espera a que Android Studio reinicie

### Paso 3: Sincronizar de Nuevo

1. Después de que Android Studio reinicie, espera a que se indexen los archivos
2. Ve a: **`File > Sync Project with Gradle Files`**
3. Espera a que termine la sincronización

## 🔄 Solución Alternativa: Limpiar Caché Manualmente

Si el problema persiste, limpia la caché de Gradle manualmente:

### Desde la Terminal (en la raíz del proyecto):

```bash
cd android
./gradlew clean
./gradlew --stop
```

Luego elimina la caché de Gradle:

**Windows:**
```bash
rmdir /s /q "%USERPROFILE%\.gradle\caches"
```

**Linux/Mac:**
```bash
rm -rf ~/.gradle/caches
```

Luego vuelve a sincronizar en Android Studio.

## 🎯 Verificación

Después de estos pasos, deberías ver:

- ✅ Sin errores en la pestaña "Build"
- ✅ La sincronización de Gradle completa exitosamente
- ✅ Puedes ejecutar la app sin problemas

## 📝 Cambios Realizados

He actualizado `android/gradle.properties` con:

1. **Más memoria para Gradle:** `-Xmx2048m`
2. **Deshabilitado JDK Image Transform:** `android.experimental.disableJdkImageTransform=true`

Esto evita el problema con `jlink.exe`.

## 🚀 Siguiente Paso

Una vez que la sincronización funcione:

1. Conecta un dispositivo Android o inicia un emulador
2. Haz clic en el botón **"Run"** (▶️) en Android Studio
3. ¡Tu app debería compilar y ejecutarse!

## 🐛 Si Aún Hay Problemas

### Opción 1: Instalar JDK 17 Manualmente

1. Descarga JDK 17 desde: https://adoptium.net/
2. Instálalo
3. En Android Studio: `File > Settings > Build Tools > Gradle`
4. En "Gradle JDK", selecciona el JDK 17 que acabas de instalar

### Opción 2: Usar JDK Embebido de Android Studio

1. En Android Studio: `File > Settings > Build Tools > Gradle`
2. En "Gradle JDK", selecciona **"Embedded JDK"**
3. Sincroniza de nuevo

---

**Nota:** El cambio en `gradle.properties` que deshabilita `jdkImageTransform` debería resolver el problema inmediatamente. Si no, sigue los pasos de configuración del JDK.

