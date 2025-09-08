// Test de sonido para debugging
function testCountdownSounds() {
  console.log('Iniciando test de sonidos de cuenta regresiva...');
  
  // Crear contexto de audio
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  // Función para crear un beep simple
  function makeBeep(freq, delay) {
    setTimeout(() => {
      console.log(`Playing beep at ${freq}Hz`);
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      gain.gain.value = 0.3;
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    }, delay);
  }
  
  // Reproducir los sonidos con delays
  makeBeep(440, 0);    // 5
  makeBeep(494, 1000); // 4
  makeBeep(523, 2000); // 3
  makeBeep(587, 3000); // 2
  makeBeep(659, 4000); // 1
  makeBeep(880, 5000); // 0
}

// Agregar comando global para testing
window.testCountdown = testCountdownSounds;

console.log('Para probar los sonidos, ejecuta: testCountdown()');
