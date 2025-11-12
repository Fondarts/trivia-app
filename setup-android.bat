@echo off
echo ========================================
echo   Setup Android - Quizlo!
echo ========================================
echo.

echo [1/4] Instalando dependencias de Node.js...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Fallo al instalar dependencias
    pause
    exit /b 1
)
echo.

echo [2/4] Agregando plataforma Android...
call npx cap add android
if %errorlevel% neq 0 (
    echo ERROR: Fallo al agregar plataforma Android
    pause
    exit /b 1
)
echo.

echo [3/4] Sincronizando archivos...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Fallo al sincronizar archivos
    pause
    exit /b 1
)
echo.

echo [4/4] Abriendo Android Studio...
call npx cap open android
if %errorlevel% neq 0 (
    echo ADVERTENCIA: No se pudo abrir Android Studio automáticamente
    echo Por favor, abre Android Studio manualmente y selecciona la carpeta 'android'
)

echo.
echo ========================================
echo   Setup completado!
echo ========================================
echo.
echo Siguiente paso: Abre Android Studio y espera a que se indexen los archivos
echo Luego conecta un dispositivo o inicia un emulador y presiona Run (F10)
echo.
pause


