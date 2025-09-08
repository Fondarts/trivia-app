# 🚀 INSTRUCCIONES DE IMPLEMENTACIÓN

## 1️⃣ **En Android Studio**

### **Sincronizar archivos:**
```bash
# En la terminal de Android Studio (carpeta del proyecto)
npx cap sync
npx cap copy

# O hacer Clean + Rebuild:
# Build → Clean Project
# Build → Rebuild Project
```

## 2️⃣ **En Supabase Dashboard**

### **A. Habilitar Google Auth:**

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. **Authentication** → **Providers**
3. Buscar **Google** → Activar
4. Necesitas Client ID y Secret (ver paso B)

### **B. Obtener credenciales de Google:**

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crear proyecto o usar existente
3. **APIs & Services** → **Credentials**
4. Click **"+ CREATE CREDENTIALS"** → **OAuth client ID**
5. Configurar:
   - Type: **Web application**
   - Name: "Quizle App"
   - Authorized redirect URIs:
     ```
     https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback
     ```
6. Copiar **Client ID** y **Client Secret**
7. Pegar en Supabase (paso A)

### **C. Ejecutar SQL (simple):**

En Supabase **SQL Editor**, ejecutar:

```sql
-- Tabla simple para estadísticas
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar seguridad
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Política: cada usuario maneja sus stats
CREATE POLICY "Users can manage own stats" 
  ON user_stats 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger automático
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## 3️⃣ **Probar la App**

### **Lo que verás:**

1. **Botón "Iniciar Sesión / Registrarse"** visible
2. Al hacer click, modal simple con:
   - 🔷 **Continuar con Google**
   - 👤 **Jugar como Invitado**

### **Flujo de Google:**
- Click en Google
- Se abre navegador
- Login con cuenta Google
- Vuelve a la app logueado
- Stats se sincronizan automáticamente

### **Flujo de Invitado:**
- Click en Invitado
- Juega inmediatamente
- Stats solo locales
- Puede convertir a cuenta después

## ✅ **Verificación**

El sistema funciona si:
- [ ] Ves el botón de login
- [ ] El modal se abre con 2 opciones
- [ ] Google redirige y vuelve
- [ ] El nombre aparece después de login
- [ ] Modo invitado funciona sin internet

## 🔧 **Solución de Problemas**

### **"Cannot read property 'signInWithOAuth'"**
→ Supabase no cargó. Verificar conexión a internet.

### **Google login abre pero no vuelve**
→ Verificar URI de callback en Google Console

### **"Invalid request" en Google**
→ Client ID mal configurado

### **Modal no aparece**
→ Hacer Clean + Rebuild en Android Studio

## 📱 **Comandos Útiles**

```bash
# Sincronizar todo
npx cap sync

# Solo copiar archivos web
npx cap copy

# Abrir Android Studio
npx cap open android

# Ver logs en Android
adb logcat | grep Capacitor
```

## ✨ **Resultado Final**

- ✅ Sin usernames complicados
- ✅ Login con 1 click
- ✅ Funciona offline
- ✅ Stats en la nube (con Google)
- ✅ Simple y confiable

---

**¡Listo!** El sistema ahora es mucho más simple y funcional.