// js/debug-oauth.js
// Herramienta de debug para OAuth

export async function debugOAuth() {
    console.log('🔍 === DEBUG OAUTH ===');
    
    // 1. Verificar configuración
    console.log('1. Configuración actual:');
    console.log('   - Current URL:', window.location.href);
    console.log('   - Origin:', window.location.origin);
    console.log('   - Platform:', window.Capacitor?.getPlatform() || 'web');
    
    // 2. Verificar Supabase
    console.log('2. Supabase:');
    console.log('   - Cliente disponible:', !!window.supabaseClient);
    if (window.supabaseClient) {
      console.log('   - URL:', window.supabaseClient.supabaseUrl);
      console.log('   - Key:', window.supabaseClient.supabaseKey?.substring(0, 20) + '...');
    }
    
    // 3. Verificar configuración OAuth
    console.log('3. Configuración OAuth:');
    const isAndroid = window.Capacitor && window.Capacitor.getPlatform() === 'android';
    const config = {
      clientId: isAndroid ? '339736953753-shffn13ho0g92064uh7ooj95pcgebpoj.apps.googleusercontent.com' : '339736953753-h9oekqkii28804iv84r5mqad61p7m4es.apps.googleusercontent.com',
      redirectTo: isAndroid ? 'com.quizle.app://oauth/callback' : (window.location.origin + window.location.pathname),
      options: { access_type: 'offline', prompt: 'consent' }
    };
    console.log('   - Client ID:', config.clientId);
    console.log('   - Redirect To:', config.redirectTo);
    console.log('   - Options:', config.options);
    
    // 4. Verificar URLs de Google Cloud
    console.log('4. URLs que deberían estar en Google Cloud Console:');
    const origin = window.location.origin;
    console.log('   - JavaScript Origins:');
    console.log('     * ' + origin);
    console.log('     * https://fpjkdibubjdbskthofdp.supabase.co');
    console.log('   - Redirect URIs:');
    console.log('     * https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback');
    console.log('     * ' + origin + window.location.pathname);
    
    // 5. Verificar configuración de Supabase
    console.log('5. URLs que deberían estar en Supabase:');
    console.log('   - Redirect URLs:');
    console.log('     * https://fpjkdibubjdbskthofdp.supabase.co/auth/v1/callback');
    console.log('     * http://localhost:8100');
    console.log('   - Client ID en Supabase: 339736953753-h9oekqkii28804iv84r5mqad61p7m4es.apps.googleusercontent.com');
    console.log('   - Client Secret en Supabase: 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');
    
    console.log('🔍 === FIN DEBUG ===');
  }
  
  // Función para probar OAuth paso a paso
  export async function testOAuthStepByStep() {
    console.log('🧪 === TEST OAUTH PASO A PASO ===');
    
    try {
      // Paso 1: Verificar Supabase
      console.log('Paso 1: Verificando Supabase...');
      if (!window.supabaseClient) {
        throw new Error('Supabase no está disponible');
      }
      console.log('✅ Supabase OK');
      
      // Paso 2: Obtener configuración
      console.log('Paso 2: Obteniendo configuración...');
      const isAndroid = window.Capacitor && window.Capacitor.getPlatform() === 'android';
      const config = {
        clientId: isAndroid ? '339736953753-shffn13ho0g92064uh7ooj95pcgebpoj.apps.googleusercontent.com' : '339736953753-h9oekqkii28804iv84r5mqad61p7m4es.apps.googleusercontent.com',
        redirectTo: isAndroid ? 'com.quizle.app://oauth/callback' : (window.location.origin + window.location.pathname),
        options: { access_type: 'offline', prompt: 'consent' }
      };
      console.log('✅ Configuración obtenida:', config);
      
      // Paso 3: Probar signInWithOAuth
      console.log('Paso 3: Probando signInWithOAuth...');
      console.log('   - Provider: google');
      console.log('   - RedirectTo:', config.redirectTo);
      console.log('   - QueryParams:', config.options);
      
      const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: config.redirectTo,
          queryParams: config.options
        }
      });
      
      if (error) {
        console.error('❌ Error en OAuth:', error);
        console.log('   - Código:', error.status);
        console.log('   - Mensaje:', error.message);
        console.log('   - Detalles:', error);
      } else {
        console.log('✅ OAuth iniciado correctamente:', data);
      }
      
    } catch (error) {
      console.error('❌ Error en test:', error);
    }
    
    console.log(' === FIN TEST ===');
  }
  
// Hacer funciones disponibles globalmente (versiones que manejan async)
window.debugOAuth = async function() {
  try {
    await debugOAuth();
  } catch (error) {
    console.error('Error en debugOAuth:', error);
  }
};

window.testOAuthStepByStep = async function() {
  try {
    await testOAuthStepByStep();
  } catch (error) {
    console.error('Error en testOAuthStepByStep:', error);
  }
};

// Función para procesar tokens de URL manualmente
window.processUrlTokens = function() {
  console.log('🔧 Procesando tokens de URL manualmente...');
  
  // Obtener fragmento de la URL
  const hashFragment = window.location.hash.substring(1);
  const searchParams = new URLSearchParams(hashFragment);
  
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const tokenType = searchParams.get('token_type');
  const expiresIn = searchParams.get('expires_in');
  
  console.log('Tokens encontrados:', {
    accessToken: accessToken ? accessToken.substring(0, 20) + '...' : null,
    refreshToken: refreshToken ? refreshToken.substring(0, 20) + '...' : null,
    tokenType,
    expiresIn
  });
  
  if (accessToken && refreshToken) {
    console.log('✅ Tokens válidos encontrados, estableciendo sesión...');
    
    // Establecer la sesión manualmente
    window.supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    }).then(({ data, error }) => {
      if (error) {
        console.error('❌ Error estableciendo sesión:', error);
      } else {
        console.log('✅ Sesión establecida correctamente:', data);
        
        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Recargar para actualizar UI
        setTimeout(() => {
          console.log('🔄 Recargando página...');
          window.location.reload();
        }, 1000);
      }
    });
  } else {
    console.log('❌ No se encontraron tokens válidos en la URL');
  }
};

// También crear una versión simple para testing rápido
window.testOAuthSimple = function() {
  console.log('🧪 TEST OAUTH SIMPLE');
  console.log('Supabase disponible:', !!window.supabaseClient);
  
  if (window.supabaseClient) {
    console.log('Probando OAuth...');
      window.supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
          redirectTo: (window.Capacitor && window.Capacitor.getPlatform() === 'android')
            ? 'com.quizle.app://oauth/callback'
            : (window.location.origin + window.location.pathname),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    }).then(({ data, error }) => {
      if (error) {
        console.error('❌ Error:', error);
      } else {
        console.log('✅ OAuth iniciado:', data);
      }
    });
  } else {
    console.error('❌ Supabase no disponible');
  }
};