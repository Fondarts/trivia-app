@echo off
echo.
echo ================================================
echo   QUIZLE! - DEPLOY DE PRODUCCION AUTOMATICO
echo ================================================
echo.

echo [1/3] Preparando archivos para produccion...
echo.

REM Crear carpeta de build si no existe
if not exist "build" mkdir build

REM Copiar contenido de www a build
xcopy "www" "build" /E /I /Y /Q

echo ✅ Archivos preparados en carpeta 'build/'
echo.

echo [2/3] Creando archivo ZIP para deployment...
echo.

REM Crear ZIP (requiere PowerShell)
powershell -command "Compress-Archive -Path 'build\*' -DestinationPath 'quizle-production.zip' -Force"

echo ✅ Archivo ZIP creado: quizle-production.zip
echo.

echo [3/3] Instrucciones de deployment:
echo.
echo 📦 Archivo listo: quizle-production.zip
echo.
echo 🚀 DEPLOY EN NETLIFY (RECOMENDADO):
echo    1. Ve a: https://netlify.com
echo    2. Arrastra el archivo 'quizle-production.zip'
echo    3. Copia la URL que te da (ej: https://amazing-name-123456.netlify.app)
echo.
echo 🔧 CONFIGURAR OAUTH:
echo    1. Google Cloud Console: Agregar tu nueva URL
echo    2. Supabase Dashboard: Agregar tu nueva URL
echo.
echo 🎯 URLs de ejemplo que obtienes:
echo    • https://quizle-trivia-123456.netlify.app
echo    • https://quizle-game.vercel.app
echo    • https://tu-dominio.com
echo.
echo ✨ Una vez configurado, tu app funcionará perfectamente!
echo.

pause