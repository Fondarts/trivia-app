// js/config.js

// Definir variables globales directamente
window.SUPABASE_URL = 'https://fpjkdibubjdbskthofdp.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwamtkaWJ1YmpkYnNrdGhvZmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MzI5NzIsImV4cCI6MjA3MDMwODk3Mn0.oYN5p3Mh_8omCGlCfVApRY_YCG-fFW5MWdeuYsNLgHc';

// Configuración de Google OAuth
window.GOOGLE_CLIENT_ID = '339736953753-h9oekqkii28804iv84r5mqad61p7m4es.apps.googleusercontent.com';
window.GOOGLE_CLIENT_ID_ANDROID = '339736953753-shffn13ho0g92064uh7ooj95pcgebpoj.apps.googleusercontent.com';

// Inicializar Supabase cuando esté disponible
document.addEventListener('DOMContentLoaded', function() {
  if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    console.log('✅ Cliente Supabase inicializado');
  } else {
    console.error('❌ No se pudo inicializar Supabase');
  }
});
