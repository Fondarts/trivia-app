// Debug script para diagnosticar el problema del perfil
console.log('=== DEBUG PROFILE INICIADO ===');

// Función para verificar elementos y eventos
function debugProfile() {
    console.log('\n--- Verificando elementos del DOM ---');
    
    // Verificar modal
    const modal = document.getElementById('profileModal');
    console.log('Modal encontrado:', !!modal);
    if (modal) {
        console.log('Clases del modal:', modal.className);
        console.log('Display del modal:', window.getComputedStyle(modal).display);
        console.log('Pointer-events del modal:', window.getComputedStyle(modal).pointerEvents);
        console.log('Z-index del modal:', window.getComputedStyle(modal).zIndex);
    }
    
    // Verificar panel
    const panel = modal?.querySelector('.panel');
    console.log('Panel encontrado:', !!panel);
    if (panel) {
        console.log('Pointer-events del panel:', window.getComputedStyle(panel).pointerEvents);
        console.log('Z-index del panel:', window.getComputedStyle(panel).zIndex);
    }
    
    // Verificar botones
    const btnProfile = document.getElementById('btnProfile');
    const btnClose = document.getElementById('btnCloseProfile');
    const btnStats = document.getElementById('profileBtnStats');
    
    console.log('\n--- Estado de los botones ---');
    console.log('btnProfile existe:', !!btnProfile);
    console.log('btnCloseProfile existe:', !!btnClose);
    console.log('profileBtnStats existe:', !!btnStats);
    
    // Verificar event listeners
    if (typeof getEventListeners !== 'undefined') {
        console.log('\n--- Event Listeners ---');
        if (btnClose) console.log('Listeners en btnClose:', getEventListeners(btnClose));
        if (btnStats) console.log('Listeners en btnStats:', getEventListeners(btnStats));
    }
    
    // Verificar inputs de settings
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    const optSounds = document.getElementById('optSounds');
    const optAutoNext = document.getElementById('optAutoNextRounds');
    
    console.log('\n--- Controles de Settings ---');
    console.log('Radio buttons de tema:', themeRadios.length);
    console.log('Checkbox de sonidos existe:', !!optSounds);
    console.log('Checkbox de auto-next existe:', !!optAutoNext);
    
    // Agregar listeners de prueba temporales
    console.log('\n--- Agregando listeners de prueba ---');
    
    if (btnClose) {
        btnClose.addEventListener('click', function(e) {
            console.log('CLICK EN CLOSE - Event:', e);
            console.log('Target:', e.target);
            console.log('CurrentTarget:', e.currentTarget);
            console.log('Propagación detenida:', e.defaultPrevented);
        }, true); // Captura
        console.log('Listener de prueba agregado a btnClose');
    }
    
    if (btnStats) {
        btnStats.addEventListener('click', function(e) {
            console.log('CLICK EN STATS - Event:', e);
            console.log('Target:', e.target);
            console.log('CurrentTarget:', e.currentTarget);
            console.log('Propagación detenida:', e.defaultPrevented);
        }, true); // Captura
        console.log('Listener de prueba agregado a btnStats');
    }
    
    // Verificar si hay algo bloqueando los clicks
    if (modal) {
        modal.addEventListener('click', function(e) {
            console.log('CLICK EN MODAL - Target:', e.target);
            console.log('Target ID:', e.target.id);
            console.log('Target Class:', e.target.className);
        }, true); // Captura
    }
    
    // Verificar z-index de todos los elementos
    console.log('\n--- Verificando capas (z-index) ---');
    document.querySelectorAll('*').forEach(el => {
        const zIndex = window.getComputedStyle(el).zIndex;
        if (zIndex !== 'auto' && zIndex !== '0') {
            console.log(`${el.tagName}#${el.id || '(sin id)'}: z-index = ${zIndex}`);
        }
    });
}

// Función para testear clicks programáticos
function testProgrammaticClicks() {
    console.log('\n=== TESTEANDO CLICKS PROGRAMÁTICOS ===');
    
    const btnClose = document.getElementById('btnCloseProfile');
    const btnStats = document.getElementById('profileBtnStats');
    
    if (btnClose) {
        console.log('Disparando click programático en btnClose...');
        btnClose.click();
    }
    
    setTimeout(() => {
        if (btnStats) {
            console.log('Disparando click programático en btnStats...');
            btnStats.click();
        }
    }, 1000);
}

// Ejecutar debug cuando el modal se abra
const originalOpen = window.bindProfileModal;
if (originalOpen) {
    window.bindProfileModal = function() {
        console.log('bindProfileModal llamado');
        const result = originalOpen.apply(this, arguments);
        
        // Esperar a que el modal se abra
        const checkModal = setInterval(() => {
            const modal = document.getElementById('profileModal');
            if (modal && modal.classList.contains('open')) {
                clearInterval(checkModal);
                setTimeout(debugProfile, 100);
            }
        }, 100);
        
        return result;
    };
}

// Función para inspeccionar el problema en tiempo real
window.debugProfileLive = function() {
    const modal = document.getElementById('profileModal');
    if (!modal || !modal.classList.contains('open')) {
        console.log('Primero abre el modal de perfil');
        return;
    }
    
    debugProfile();
    
    // Test de clicks
    console.log('\n=== Test manual: Haz click en los botones y mira la consola ===');
};

// Agregar comando global
window.testProfileButtons = testProgrammaticClicks;

console.log('Debug cargado. Comandos disponibles:');
console.log('- debugProfileLive(): Inspeccionar con el modal abierto');
console.log('- testProfileButtons(): Testear clicks programáticos');
