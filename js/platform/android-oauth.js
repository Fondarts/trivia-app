// js/android-oauth-handler.js
// Handler mejorado v5 para OAuth en Android Capacitor

console.log('🤖 Android OAuth Handler v5 cargado');

// Variable global para el cliente de Supabase
let globalSupabaseClient = null;

// Solo ejecutar en Capacitor Android
if (window.Capacitor && window.Capacitor.isNativePlatform) {
  console.log('📱 Plataforma Capacitor detectada');
  
  // Agregar clase al body para estilos específicos de Android
  document.body.classList.add('capacitor-app');
  
  // Escuchar el evento personalizado desde MainActivity
  window.addEventListener('capacitor-oauth-callback', async function(event) {
    console.log('🎯 OAuth callback recibido desde MainActivity:', event.detail);
    
    if (event.detail && event.detail.url) {
      const url = event.detail.url;
      console.log('📍 URL recibida:', url);
      
      // Procesar el token inmediatamente
      await processOAuthCallback(url);
    }
  });
  
  // Manejar el retorno desde el navegador (backup)
  window.addEventListener('appUrlOpen', async function(event) {
    console.log('🔗 App URL abierta (backup):', event.detail);
    
    if (event.detail && event.detail.url) {
      const url = event.detail.url;
      if (url.includes('#access_token') || url.includes('access_token=')) {
        await processOAuthCallback(url);
      }
    }
  });
  
  // Verificar sesión al cargar la página
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Verificando sesión inicial...');
    setTimeout(checkForPendingSession, 2000);
  });
  
  // Verificar cuando la app vuelve del background
  document.addEventListener('resume', function() {
    console.log('📱 App resumed - verificando sesión OAuth...');
    setTimeout(checkAndReloadSession, 1000);
  }, false);
  
  // Verificar periódicamente mientras está "Conectando..."
  let checkInterval = null;
  
  // Observar cambios en el modal para detectar cuando se muestra "Conectando..."
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      const modal = document.getElementById('simpleAuthModal');
      const btn = document.getElementById('btnGoogleLogin');
      
      if (modal && modal.classList.contains('open') && btn && btn.disabled) {
        if (!checkInterval) {
          console.log('🔄 Iniciando verificación periódica de sesión...');
          checkInterval = setInterval(checkAndReloadSession, 2000);
          
          // Detener después de 30 segundos
          setTimeout(function() {
            if (checkInterval) {
              clearInterval(checkInterval);
              checkInterval = null;
              console.log('⏹️ Deteniendo verificación automática');
            }
          }, 30000);
        }
      } else if (checkInterval && (!modal || !modal.classList.contains('open'))) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
    });
  });
  
  // Observar el body para detectar cambios en el modal
  if (document.body) {
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'disabled']
    });
  }
}

// Función para procesar el callback de OAuth
async function processOAuthCallback(url) {
  try {
    console.log('🔄 Procesando callback de OAuth...');
    
    // Extraer el hash de la URL
    const hashIndex = url.indexOf('#');
    if (hashIndex === -1) {
      console.log('❌ No se encontró hash en la URL');
      return;
    }
    
    const hash = url.substring(hashIndex + 1);
    console.log('📝 Hash extraído:', hash.substring(0, 50) + '...');
    
    // Crear una URL temporal para parsear los parámetros
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresIn = params.get('expires_in');
    const tokenType = params.get('token_type');
    
    if (!accessToken) {
      console.log('❌ No se encontró access_token en el callback');
      return;
    }
    
    console.log('✅ Tokens encontrados');
    console.log('Access token (primeros 20 chars):', accessToken.substring(0, 20) + '...');
    console.log('Refresh token:', refreshToken ? 'Presente' : 'No presente');
    console.log('Expires in:', expiresIn);
    
    // Obtener el cliente de Supabase
    const supabaseClient = await getExistingSupabaseClient();
    
    if (!supabaseClient) {
      console.error('❌ No se pudo obtener el cliente de Supabase');
      // Guardar en localStorage para intentar más tarde
      const storageKey = 'sb-fpjkdibubjdbskthofdp-auth-token';
      const sessionData = {
        currentSession: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: parseInt(expiresIn || '3600'),
          token_type: tokenType || 'bearer'
        },
        expiresAt: Date.now() + (parseInt(expiresIn || '3600') * 1000)
      };
      
      localStorage.setItem(storageKey, JSON.stringify(sessionData));
      console.log('💾 Tokens guardados en localStorage para recuperación posterior');
      
      // Recargar la página para que se procese
      setTimeout(() => window.location.reload(), 500);
      return;
    }
    
    // Intentar establecer la sesión con los tokens
    console.log('🔐 Estableciendo sesión con los tokens...');
    
    const { data, error } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    });
    
    if (error) {
      console.error('❌ Error al establecer sesión:', error);
      
      // Guardar en localStorage como backup
      const storageKey = 'sb-fpjkdibubjdbskthofdp-auth-token';
      localStorage.setItem(storageKey, JSON.stringify({
        currentSession: {
          access_token: accessToken,
          refresh_token: refreshToken
        },
        expiresAt: Date.now() + 3600000
      }));
      
      // Recargar para intentar de nuevo
      setTimeout(() => window.location.reload(), 500);
      return;
    }
    
    if (data && data.session) {
      console.log('✅ ¡Sesión establecida exitosamente!');
      console.log('Usuario:', data.session.user.email);
      
      // Limpiar flags
      localStorage.removeItem('oauth_pending');
      localStorage.removeItem('oauth_timestamp');
      
      // Esperar un momento y recargar
      setTimeout(() => {
        console.log('🔄 Recargando página para actualizar UI...');
        window.location.reload();
      }, 500);
    }
    
  } catch (error) {
    console.error('❌ Error procesando callback:', error);
    
    // Intentar guardar los tokens en localStorage como último recurso
    try {
      const hashIndex = url.indexOf('#');
      const hash = url.substring(hashIndex + 1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      if (accessToken) {
        const storageKey = 'sb-fpjkdibubjdbskthofdp-auth-token';
        localStorage.setItem(storageKey, JSON.stringify({
          currentSession: {
            access_token: accessToken,
            refresh_token: refreshToken
          },
          expiresAt: Date.now() + 3600000
        }));
        console.log('💾 Tokens guardados en localStorage como último recurso');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (e) {
      console.error('❌ Error crítico:', e);
    }
  }
}

// Función para obtener el cliente de Supabase existente
async function getExistingSupabaseClient() {
  // Si ya tenemos uno guardado, usarlo
  if (globalSupabaseClient) {
    return globalSupabaseClient;
  }
  
  // Buscar el cliente en main.js
  let attempts = 0;
  while (attempts < 10) {
    attempts++;
    
    // Verificar si existe el cliente en window (desde main.js)
    if (window.supabaseClient) {
      console.log('✅ Cliente encontrado en window.supabaseClient');
      globalSupabaseClient = window.supabaseClient;
      return window.supabaseClient;
    }
    
    // Verificar si podemos crear uno con las credenciales
    if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
      // NO crear uno nuevo, esperar a que main.js lo cree
      console.log(`⏳ Intento ${attempts}/10 - Esperando cliente de main.js...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Si después de esperar no hay cliente, crear uno
  if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    console.log('⚠️ Creando cliente de emergencia (no ideal)');
    globalSupabaseClient = window.supabase.createClient(
      window.SUPABASE_URL, 
      window.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: 'sb-fpjkdibubjdbskthofdp-auth-token'
        }
      }
    );
    // Guardar para que otros lo puedan usar
    window.supabaseClient = globalSupabaseClient;
    return globalSupabaseClient;
  }
  
  return null;
}

// Función mejorada para verificar y recargar si hay sesión
async function checkAndReloadSession() {
  try {
    console.log('🔐 Verificando sesión con Supabase...');
    
    // Primero verificar si hay tokens guardados en localStorage
    const storageKey = 'sb-fpjkdibubjdbskthofdp-auth-token';
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        console.log('📦 Datos encontrados en localStorage');
        
        // Si hay tokens pero no hay cliente aún, esperar
        const supabaseClient = await getExistingSupabaseClient();
        if (!supabaseClient) {
          console.log('⏳ Esperando cliente de Supabase...');
          return;
        }
        
        // Verificar si ya hay sesión
        const { data: { session: existingSession } } = await supabaseClient.auth.getSession();
        
        if (!existingSession && parsed.currentSession && parsed.currentSession.access_token) {
          console.log('🔄 Intentando recuperar sesión desde localStorage...');
          
          const { data, error } = await supabaseClient.auth.setSession({
            access_token: parsed.currentSession.access_token,
            refresh_token: parsed.currentSession.refresh_token || ''
          });
          
          if (data && data.session) {
            console.log('✅ Sesión recuperada exitosamente desde localStorage');
            setTimeout(() => window.location.reload(), 500);
            return;
          } else if (error) {
            console.error('❌ Error al recuperar sesión:', error);
            // Limpiar localStorage si los tokens son inválidos
            if (error.message && error.message.includes('invalid')) {
              localStorage.removeItem(storageKey);
              console.log('🗑️ Tokens inválidos eliminados de localStorage');
            }
          }
        }
      } catch (e) {
        console.error('❌ Error parseando datos de localStorage:', e);
      }
    }
    
    // Obtener el cliente existente
    const supabaseClient = await getExistingSupabaseClient();
    
    if (!supabaseClient) {
      console.error('❌ No se pudo obtener el cliente de Supabase');
      return;
    }
    
    // Verificar si auth existe
    if (!supabaseClient.auth) {
      console.error('❌ Supabase.auth no está disponible');
      return;
    }
    
    // Intentar obtener la sesión
    console.log('📊 Obteniendo sesión...');
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error) {
      console.error('❌ Error al obtener sesión:', error);
      return;
    }
    
    if (session && session.user) {
      console.log('✅ ¡Sesión activa encontrada!');
      console.log('👤 Usuario:', session.user.email);
      console.log('🆔 ID:', session.user.id);
      
      // Verificar si el modal está visible con "Conectando..."
      const modal = document.getElementById('simpleAuthModal');
      const btn = document.getElementById('btnGoogleLogin');
      
      if (modal && modal.classList.contains('open') && btn && btn.disabled) {
        console.log('🔄 Modal detectado, recargando página...');
        
        // Guardar flag para indicar que venimos de un login exitoso
        localStorage.setItem('oauth_success', 'true');
        
        // Recargar la página para actualizar la UI
        setTimeout(function() {
          window.location.reload();
        }, 500);
      }
    } else {
      console.log('ℹ️ No hay sesión activa');
    }
  } catch (err) {
    console.error('❌ Error en checkAndReloadSession:', err);
  }
}

// Función para verificar si hay una sesión pendiente (compatibilidad)
async function checkForPendingSession() {
  return checkAndReloadSession();
}

// Función helper para manejar el retorno manual desde el navegador
window.handleOAuthReturn = function() {
  console.log('🔄 Manejando retorno manual de OAuth...');
  setTimeout(checkAndReloadSession, 500);
};

// Botón de debug mejorado
if (window.Capacitor && window.Capacitor.isNativePlatform) {
  setTimeout(() => {
    const debugBtn = document.createElement('button');
    debugBtn.textContent = 'Debug Auth';
    debugBtn.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:9999;padding:10px;background:red;color:white;border-radius:5px;';
    debugBtn.onclick = async () => {
      console.log('=== DEBUG OAUTH ===');
      
      // Ver qué hay en localStorage
      const storageKey = 'sb-fpjkdibubjdbskthofdp-auth-token';
      const storedData = localStorage.getItem(storageKey);
      console.log('Storage key:', storageKey);
      console.log('Stored data:', storedData ? 'SÍ hay datos' : 'NO hay datos');
      
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          console.log('Sesión guardada:', {
            hasCurrentSession: !!parsed.currentSession,
            hasAccessToken: !!parsed.currentSession?.access_token,
            expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt).toLocaleString() : 'N/A'
          });
        } catch (e) {
          console.error('Error parseando:', e);
        }
      }
      
      // Verificar cliente
      const client = await getExistingSupabaseClient();
      if (client) {
        const { data: { session } } = await client.auth.getSession();
        console.log('Sesión actual:', session ? 'ACTIVA' : 'NO HAY');
        if (session) {
          console.log('Email:', session.user.email);
          alert('¡Sesión encontrada! ' + session.user.email + '\n\nRecargando página...');
          window.location.reload();
        } else {
          // Intentar recuperar de localStorage
          if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed.currentSession?.access_token) {
              if (confirm('Hay tokens en localStorage. ¿Intentar recuperar sesión?')) {
                const { data, error } = await client.auth.setSession({
                  access_token: parsed.currentSession.access_token,
                  refresh_token: parsed.currentSession.refresh_token || ''
                });
                
                if (data && data.session) {
                  alert('¡Sesión recuperada! Recargando...');
                  window.location.reload();
                } else {
                  alert('Error: ' + (error?.message || 'No se pudo recuperar'));
                }
              }
            }
          } else {
            alert('No hay sesión activa ni tokens guardados');
          }
        }
      } else {
        alert('No se pudo obtener cliente de Supabase');
      }
    };
    document.body.appendChild(debugBtn);
  }, 5000);
}

// Log para debug
console.log('✅ Android OAuth Handler v5 configurado correctamente');