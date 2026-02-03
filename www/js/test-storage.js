// js/test-storage.js - Script de prueba para el sistema de Storage
// Ejecutar en la consola del navegador después de cargar la página

/**
 * Pruebas del sistema de Storage
 */
async function testStorage() {

  // Importar Storage (ya está expuesto globalmente como window.Storage)
  const Storage = window.Storage;
  
  if (!Storage) {

    return;
  }

  // Test 1: Verificar disponibilidad

  const isAvailable = Storage.isAvailable();

  // Test 2: Operaciones básicas (get/set/remove)

  try {
    Storage.set('test_key', 'test_value');
    const value = Storage.get('test_key');

    const hasKey = Storage.has('test_key');

    Storage.remove('test_key');
    const afterRemove = Storage.get('test_key');

  } catch (e) {

  }
  
  // Test 3: Valores complejos (objetos, arrays)

  try {
    const testObj = { name: 'Test', value: 123, nested: { data: 'test' } };
    const testArray = [1, 2, 3, { nested: 'value' }];
    
    Storage.set('test_obj', testObj);
    Storage.set('test_array', testArray);
    
    const retrievedObj = Storage.get('test_obj');
    const retrievedArray = Storage.get('test_array');
    
    const objMatch = JSON.stringify(retrievedObj) === JSON.stringify(testObj);
    const arrayMatch = JSON.stringify(retrievedArray) === JSON.stringify(testArray);

    Storage.remove('test_obj');
    Storage.remove('test_array');

  } catch (e) {

  }
  
  // Test 4: Valores por defecto

  try {
    const defaultValue = Storage.get('non_existent_key', 'default');

  } catch (e) {

  }
  
  // Test 5: TTL (Time-To-Live)
  console.log('📋 Test 5: TTL (Time-To-Live)');
  try {
    Storage.set('test_ttl', 'expires_soon', { ttl: 1000 }); // 1 segundo
    const beforeExpire = Storage.get('test_ttl');

    // Esperar a que expire
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const afterExpire = Storage.get('test_ttl');
    console.log(`  Después de expirar: ${afterExpire === null ? '✅ Correcto' : '❌ Error (puede estar en cache)'}`);
    
    // Limpiar expirados manualmente
    const cleared = Storage.clearExpired();

  } catch (e) {

  }
  
  // Test 6: Validación

  try {
    // Registrar validador
    Storage.setValidator('test_validated', (value) => {
      if (typeof value !== 'number' || value < 0 || value > 100) {
        throw new Error('Valor debe ser un número entre 0 y 100');
      }
      return true;
    });
    
    // Intentar guardar valor válido
    const valid1 = Storage.set('test_validated', 50);
    console.log(`  Valor válido (50): ${valid1 ? '✅ Correcto' : '❌ Error'}`);
    
    // Intentar guardar valor inválido
    const valid2 = Storage.set('test_validated', 150);
    console.log(`  Valor inválido (150): ${valid2 ? '❌ Error (debería fallar)' : '✅ Correcto (falló como esperado)'}`);
    
    Storage.remove('test_validated');

  } catch (e) {

  }
  
  // Test 7: Información del storage

  try {
    const info = Storage.getInfo();

  } catch (e) {

  }
  
  // Test 8: Keys y getAll

  try {
    Storage.set('test_key1', 'value1');
    Storage.set('test_key2', 'value2');
    
    const keys = Storage.keys();
    const hasTestKeys = keys.includes('test_key1') && keys.includes('test_key2');

    const all = Storage.getAll();
    const hasTestValues = all.test_key1 === 'value1' && all.test_key2 === 'value2';

    Storage.remove('test_key1');
    Storage.remove('test_key2');

  } catch (e) {

  }
  
  // Test 9: Cache

  try {
    Storage.set('test_cache', 'cached_value');
    // Obtener múltiples veces (debería usar cache)
    const start1 = performance.now();
    for (let i = 0; i < 100; i++) {
      Storage.get('test_cache');
    }
    const end1 = performance.now();
    const cacheTime = end1 - start1;
    
    console.log(`  Tiempo con cache (100 operaciones): ${cacheTime.toFixed(2)}ms`);
    console.log(`  Promedio: ${(cacheTime / 100).toFixed(3)}ms por operación`);
    
    Storage.remove('test_cache');

  } catch (e) {

  }
  
  // Test 10: Compatibilidad con datos existentes

  try {
    // Guardar algo con localStorage directamente
    localStorage.setItem('legacy_key', JSON.stringify({ test: 'legacy' }));
    
    // Intentar leerlo con Storage
    const legacy = Storage.get('legacy_key');

    localStorage.removeItem('legacy_key');

  } catch (e) {

  }
  
  // Limpiar datos de prueba

  Storage.remove('test_key');
  Storage.remove('test_obj');
  Storage.remove('test_array');
  Storage.remove('test_ttl');
  Storage.remove('test_validated');
  Storage.remove('test_cache');
  Storage.remove('test_key1');
  Storage.remove('test_key2');
  Storage.remove('legacy_key');
}

// Exponer función globalmente
window.testStorage = testStorage;

// Ejecutar automáticamente si estamos en modo de prueba
if (window.runStorageTests === true) {
  testStorage();
}

