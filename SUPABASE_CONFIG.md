# Configuración de Supabase para Autenticación

## Error: "unexpected_failure" (código 500)

Este error ocurre porque las URLs de redirección no están configuradas en tu proyecto de Supabase.

## Solución Paso a Paso:

### 1. Accede a tu Dashboard de Supabase
- Ve a: https://supabase.com/dashboard/project/fpjkdibubjdbskthofdp/auth/url-configuration

### 2. Configura las URLs de Redirección
Agrega estas URLs en la sección "Redirect URLs":

```
http://192.168.0.21:8100/index.html
http://127.0.0.1:8100/index.html
http://localhost:8100/index.html
https://www.quizlo.app
https://www.quizlo.app/index.html
```

### 3. URLs del Site (opcional pero recomendado)
En "Site URL" puedes poner:
```
http://192.168.0.21:8100
https://www.quizlo.app
```

### 4. Guardar Cambios
- Haz clic en "Save" o "Guardar"
- Espera unos segundos para que los cambios se apliquen

## Verificar que Funciona:

1. Recarga la página de tu aplicación
2. Intenta hacer login con Google
3. Deberías ser redirigido correctamente después de la autenticación

## Notas Importantes:

- **Desarrollo**: Usa las URLs con tu IP local (`192.168.0.21:8100`)
- **Producción**: Cambia por tu dominio real cuando subas a producción
- **Android**: Para la app nativa, necesitarás agregar también: `com.quizlo.app://oauth/callback`

## URLs Actuales del Servidor:
- Local: http://127.0.0.1:8100
- Red: http://192.168.0.21:8100

Ambas deben estar configuradas en Supabase.