# Sistema de Autenticación - Trivia App

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de autenticación y gestión de usuarios para la aplicación de Trivia. Este sistema permite:

### ✅ Características Implementadas

#### **Fase 1: Sistema de Autenticación** (COMPLETADO)
- ✅ Registro con email y contraseña
- ✅ Login con credenciales
- ✅ Login como invitado (cuenta temporal)
- ✅ Conversión de cuenta invitado a cuenta permanente
- ✅ Perfil de usuario persistente en Supabase
- ✅ Sincronización de estadísticas con la nube
- ✅ Verificación de disponibilidad de username
- ✅ Modal de autenticación con diseño moderno
- ✅ Indicadores visuales para usuarios invitados

### 🔄 Próximas Fases (Pendientes)

#### **Fase 2: Sistema Social**
- Sistema de amigos
- Invitaciones a partidas
- Perfil público con estadísticas
- Ranking entre amigos

#### **Fase 3: Matchmaking Mejorado**
- Matchmaking por nivel/ranking
- Historial de partidas contra cada oponente
- Sistema de ligas/temporadas

## 🚀 Instalación y Configuración

### 1. Configurar Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Crea un nuevo proyecto o usa uno existente
3. Ve a **SQL Editor** y ejecuta la migración:
   ```sql
   -- Copiar y pegar el contenido de: 
   -- www/sql/auth_migration.sql
   ```

### 2. Configurar Variables de Entorno

El archivo `js/config.js` ya contiene las credenciales de Supabase. Si necesitas cambiarlas:

```javascript
// js/config.js
window.SUPABASE_URL = 'tu-url-de-supabase';
window.SUPABASE_ANON_KEY = 'tu-anon-key';
```

### 3. Habilitar Autenticación en Supabase

1. Ve a **Authentication** > **Providers** en Supabase
2. Habilita **Email** como proveedor
3. Configura los templates de email si lo deseas

## 📁 Archivos Nuevos Creados

```
www/
├── js/
│   ├── auth.js           # Sistema principal de autenticación
│   ├── auth_ui.js        # UI y modales de autenticación
│   └── stats_sync.js     # Sincronización de estadísticas
└── sql/
    └── auth_migration.sql # Migración de base de datos
```

## 🎮 Flujo de Usuario

### Primera Vez
1. Usuario abre la app
2. Se muestra modal de login/registro
3. Opciones:
   - **Crear Cuenta**: Registro con email
   - **Iniciar Sesión**: Login con credenciales
   - **Jugar como Invitado**: Acceso temporal

### Usuario Invitado
1. Puede jugar normalmente
2. Estadísticas se guardan localmente
3. Después de 2 minutos, se muestra prompt para crear cuenta
4. Puede convertir cuenta invitado a permanente sin perder progreso

### Usuario Registrado
1. Login automático al abrir la app
2. Estadísticas sincronizadas con la nube
3. Nombre bloqueado (no editable)
4. Acceso a todas las funciones

## 🔧 Integración con el Código Existente

### Modificaciones en Archivos Existentes

1. **main.js**
   - Importa módulos de autenticación
   - Inicializa auth al cargar
   - Muestra modal si no hay usuario

2. **stats.js**
   - Sincroniza estadísticas con el servidor
   - Guarda pendientes si falla la sincronización

3. **styles.css**
   - Nuevos estilos para modales de auth
   - Estilos para indicadores de invitado
   - Animaciones y transiciones

## 🎨 UI/UX Implementado

### Modal de Autenticación
- Tabs para Login/Registro
- Validación en tiempo real de username
- Indicadores de carga
- Mensajes de error claros

### Indicadores Visuales
- Badge de "Jugando como invitado"
- Prompt de conversión no intrusivo
- Avatar y nivel en el header

## 📊 Base de Datos

### Tablas Creadas
- `profiles`: Perfiles de usuario
- `friendships`: Relaciones de amistad (para Fase 2)
- `match_history`: Historial de partidas
- `match_invitations`: Invitaciones (para Fase 2)
- `leaderboard`: Puntuaciones globales

### Seguridad
- Row Level Security (RLS) habilitado
- Políticas de acceso configuradas
- Triggers para actualización automática

## 🔐 Características de Seguridad

- Contraseñas hasheadas (manejado por Supabase)
- Tokens JWT para autenticación
- RLS para proteger datos
- Validación server-side

## 📱 Compatibilidad

- Funciona en web y móvil (Capacitor)
- Almacenamiento local como fallback
- Sincronización automática cuando hay conexión

## 🐛 Debugging

Si hay problemas:

1. **Verificar consola del navegador** para errores
2. **Verificar Supabase Dashboard** > Logs
3. **Limpiar localStorage** si hay datos corruptos:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

## 📈 Métricas

El sistema trackea:
- Usuarios totales registrados
- Conversión invitado → registrado
- Retención de usuarios
- Estadísticas de juego por usuario

## 🎯 Próximos Pasos

1. **Testing completo** del flujo de autenticación
2. **Implementar Fase 2** (Sistema Social)
3. **Agregar login social** (Google, Facebook)
4. **Sistema de recuperación** de contraseña
5. **Avatares personalizables**

## 💡 Notas Importantes

- Las cuentas de invitado se crean con emails únicos `guest_*@guest.quizle.com`
- Las estadísticas locales se migran automáticamente al crear cuenta
- La sincronización ocurre cada 5 minutos y al cerrar la app
- Los invitados pueden jugar VS pero sus stats no se guardan permanentemente

## 🤝 Soporte

Si encuentras problemas o tienes preguntas sobre la implementación, revisa:
1. La consola del navegador para errores
2. Los logs de Supabase
3. El estado de localStorage

---

**Versión**: 1.0.0  
**Fecha**: Enero 2025  
**Autor**: Sistema de Autenticación Trivia