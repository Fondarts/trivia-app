// js/debug_achievements.js
// Archivo de debug para probar el sistema de logros

export async function insertTestAchievements(userId) {
  if (!window.supabaseClient) {
    console.error('Supabase no está disponible');
    return;
  }
  
  const testAchievements = [
    'DEDICATION_FIRST_GAME',
    'ACCURACY_STREAK_10',
    'KNOWLEDGE_MOVIES',
    'KNOWLEDGE_SCIENCE',
    'PERFECT_GAME'
  ];
  
  console.log(`Insertando logros de prueba para usuario ${userId}...`);
  
  for (const achId of testAchievements) {
    try {
      const { data, error } = await window.supabaseClient
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achId
        })
        .select();
      
      if (error) {
        console.error(`Error insertando ${achId}:`, error);
      } else {
        console.log(`✓ Logro ${achId} insertado`);
      }
    } catch (err) {
      console.error(`Error con ${achId}:`, err);
    }
  }
  
  console.log('Proceso completado');
}

// Función para verificar logros de un usuario
export async function checkUserAchievements(userId) {
  if (!window.supabaseClient) {
    console.error('Supabase no está disponible');
    return;
  }
  
  const { data, error } = await window.supabaseClient
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error obteniendo logros:', error);
  } else {
    console.log('Logros del usuario:', data);
  }
  
  return data;
}

// Hacer las funciones disponibles globalmente para debug
if (typeof window !== 'undefined') {
  window.debugAchievements = {
    insertTest: insertTestAchievements,
    check: checkUserAchievements
  };
}
