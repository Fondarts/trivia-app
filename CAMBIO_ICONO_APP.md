# 🎨 Cambiar el Icono de la App Android

## Método 1: Usando Image Asset Studio (Recomendado)

### Paso 1: Abrir Image Asset Studio

1. En Android Studio, en el panel izquierdo (Project), navega a:
   - `android > app > src > main > res`

2. **Click derecho** en la carpeta `res`

3. Selecciona: **`New > Image Asset`**

### Paso 2: Configurar el Icono

1. En la ventana "Asset Studio" que se abre:

   **Icon Type:**
   - Selecciona **"Launcher Icons (Adaptive and Legacy)"**

   **Foreground Layer:**
   - **Source Asset:** Haz clic en el ícono de carpeta 📁
   - Navega a: `www/assets/logo/logo.png`
   - Selecciónalo y haz clic en "OK"
   - **Resize:** Ajusta si es necesario (debería estar al 100%)
   - **Shape:** Selecciona **"None"** (para mantener la forma original del logo)

   **Background Layer:**
   - **Color:** Haz clic en el cuadro de color
   - Puedes usar el color de fondo de tu logo o un color sólido
   - O selecciona **"Same as foreground"** si quieres que sea transparente

   **Legacy Icon:**
   - ✅ Marca la casilla **"Generate legacy icon"** (para compatibilidad)

2. Haz clic en **"Next"**

3. Revisa la vista previa y haz clic en **"Finish"**

### Paso 3: Sincronizar

1. Android Studio reemplazará automáticamente todos los iconos
2. Si te pide sincronizar, haz clic en **"Sync Now"**

### Paso 4: Recompilar

1. **`Build > Clean Project`**
2. **`Build > Rebuild Project`**
3. Ejecuta la app de nuevo

---

## Método 2: Reemplazo Manual (Si el Método 1 no funciona)

### Paso 1: Preparar el Logo

Necesitas el logo en diferentes tamaños. Puedes usar una herramienta online como:
- https://www.appicon.co/
- https://icon.kitchen/

O usar Android Studio Image Asset Studio solo para generar los tamaños.

### Paso 2: Reemplazar los Archivos

Reemplaza estos archivos con tu logo redimensionado:

```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png (48x48px)
│   └── ic_launcher_round.png (48x48px)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72px)
│   └── ic_launcher_round.png (72x72px)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96x96px)
│   └── ic_launcher_round.png (96x96px)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144x144px)
│   └── ic_launcher_round.png (144x144px)
└── mipmap-xxxhdpi/
    ├── ic_launcher.png (192x192px)
    └── ic_launcher_round.png (192x192px)
```

### Paso 3: Limpiar y Recompilar

```bash
cd android
./gradlew clean
```

Luego en Android Studio: `Build > Rebuild Project`

---

## Método 3: Script Rápido (Avanzado)

Si tienes ImageMagick instalado, puedes usar este script:

```bash
# Desde la raíz del proyecto
cd android/app/src/main/res

# Crear iconos en todos los tamaños desde logo.png
magick convert ../../../www/assets/logo/logo.png -resize 48x48 mipmap-mdpi/ic_launcher.png
magick convert ../../../www/assets/logo/logo.png -resize 72x72 mipmap-hdpi/ic_launcher.png
magick convert ../../../www/assets/logo/logo.png -resize 96x96 mipmap-xhdpi/ic_launcher.png
magick convert ../../../www/assets/logo/logo.png -resize 144x144 mipmap-xxhdpi/ic_launcher.png
magick convert ../../../www/assets/logo/logo.png -resize 192x192 mipmap-xxxhdpi/ic_launcher.png

# Copiar para la versión round
cp mipmap-mdpi/ic_launcher.png mipmap-mdpi/ic_launcher_round.png
cp mipmap-hdpi/ic_launcher.png mipmap-hdpi/ic_launcher_round.png
cp mipmap-xhdpi/ic_launcher.png mipmap-xhdpi/ic_launcher_round.png
cp mipmap-xxhdpi/ic_launcher.png mipmap-xxhdpi/ic_launcher_round.png
cp mipmap-xxxhdpi/ic_launcher.png mipmap-xxxhdpi/ic_launcher_round.png
```

---

## ✅ Verificación

Después de cambiar el icono:

1. **Limpia el proyecto:** `Build > Clean Project`
2. **Reconstruye:** `Build > Rebuild Project`
3. **Desinstala la app** del dispositivo/emulador (si ya estaba instalada)
4. **Instala de nuevo** ejecutando la app

El nuevo icono debería aparecer en el launcher.

---

## 🎯 Recomendación

**Usa el Método 1 (Image Asset Studio)** - Es el más fácil y genera todos los tamaños automáticamente.

