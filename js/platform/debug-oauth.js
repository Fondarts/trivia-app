// Debug script para verificar tokens OAuth
// Agregar temporalmente al HTML para debuggear

(function() {
  console.log('=== DEBUG OAUTH ===');
  console.log('URL actual:', window.location.href);
  console.log('Hash:', window.location.hash);
  console.log('Search:', window.location.search);
  
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    console.log('🎉 TOKEN ENCONTRADO EN HASH!');
    
    // Extraer token manualmente para debug
    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    console.log('Access Token:', accessToken ? accessToken.substring(0, 50) + '...' : 'No encontrado');
    console.log('Refresh Token:', refreshToken ? refreshToken.substring(0, 20) + '...' : 'No encontrado');
    
    // Intentar procesar con Supabase
    if (window.supabaseClient && accessToken) {
      console.log('Intentando procesar token con Supabase...');
      
      window.supabaseClient.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error obteniendo sesión:', error);
        } else if (session) {
          console.log('🎉 SESIÓN VÁLIDA:', session.user);
          
          // Crear datos de usuario
          const userData = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url || 'img/avatar_placeholder.svg',
            isGuest: false
          };
          
          console.log('📝 Guardando usuario:', userData);
          localStorage.setItem('current_user', JSON.stringify(userData));
          
          // Actualizar UI
          if (window.setCurrentUser) {
            console.log('🔄 Actualizando UI...');
            window.setCurrentUser(userData);
          }
          if (window.updateAuthUI) {
            window.updateAuthUI(userData);
          }
          
          // Limpiar URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Mostrar mensaje de éxito
          alert('🎉 Login exitoso! Usuario: ' + userData.name);
          
        } else {
          console.log('❌ No hay sesión válida');
        }
      });
    } else {
      console.log('❌ Supabase no disponible o no hay token');
    }
  } else {
    console.log('❓ No hay token en la URL');
  }
})();
