#!/bin/bash

echo "========================================"
echo "  Setup Android - Quizlo!"
echo "========================================"
echo ""

echo "[1/4] Instalando dependencias de Node.js..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Fallo al instalar dependencias"
    exit 1
fi
echo ""

echo "[2/4] Agregando plataforma Android..."
npx cap add android
if [ $? -ne 0 ]; then
    echo "ERROR: Fallo al agregar plataforma Android"
    exit 1
fi
echo ""

echo "[3/4] Sincronizando archivos..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "ERROR: Fallo al sincronizar archivos"
    exit 1
fi
echo ""

echo "[4/4] Abriendo Android Studio..."
npx cap open android
if [ $? -ne 0 ]; then
    echo "ADVERTENCIA: No se pudo abrir Android Studio automáticamente"
    echo "Por favor, abre Android Studio manualmente y selecciona la carpeta 'android'"
fi

echo ""
echo "========================================"
echo "  Setup completado!"
echo "========================================"
echo ""
echo "Siguiente paso: Abre Android Studio y espera a que se indexen los archivos"
echo "Luego conecta un dispositivo o inicia un emulador y presiona Run"
echo ""


