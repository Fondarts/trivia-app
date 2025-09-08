// Diagnóstico rápido de la aplicación
console.log('=== DIAGNÓSTICO RÁPIDO ===');

// Verificar funciones críticas
const checks = [
    { name: 'getBank', fn: () => typeof window.getBank === 'function' },
    { name: 'getBankCount', fn: () => typeof window.getBankCount === 'function' },
    { name: 'buildDeckSingle', fn: () => typeof window.buildDeckSingle === 'function' },
    { name: 'toast', fn: () => typeof window.toast === 'function' },
    { name: 'AdventureMode', fn: () => typeof window.AdventureMode === 'object' },
    { name: 'getCurrentUser', fn: () => typeof window.getCurrentUser === 'function' }
];

let allGood = true;
checks.forEach(check => {
    const result = check.fn();
    console.log(`${result ? '✅' : '❌'} ${check.name}`);
    if (!result) allGood = false;
});

// Verificar el banco
if (window.getBank) {
    const bank = window.getBank();
    const count = window.getBankCount ? window.getBankCount() : 0;
    console.log(`📦 Banco: ${count} preguntas en ${Object.keys(bank).length} categorías`);
}

// Verificar elementos DOM críticos
const domElements = [
    'configCard',
    'gameArea', 
    'btnStart',
    'categorySel',
    'modeSeg'
];

console.log('=== ELEMENTOS DOM ===');
domElements.forEach(id => {
    const el = document.getElementById(id);
    console.log(`${el ? '✅' : '❌'} #${id}`);
});

// Verificar si las categorías se cargaron
const catSelect = document.getElementById('categorySel');
if (catSelect) {
    console.log(`📝 Categorías en select: ${catSelect.options.length} opciones`);
    if (catSelect.options.length === 0) {
        console.error('❌ No hay categorías cargadas en el select!');
    }
}

// Intentar hacer click en el botón start para ver el error
console.log('=== PROBANDO CLICK ===');
const btnStart = document.getElementById('btnStart');
if (btnStart) {
    // Verificar si tiene event listeners
    const listeners = btnStart.onclick || btnStart.addEventListener;
    console.log('Event listeners en btnStart:', listeners ? 'Sí' : 'No');
    
    // Ver si startSolo está disponible
    console.log('startSolo disponible:', typeof window.startSolo);
}

if (!allGood) {
    console.error('⚠️ Hay funciones críticas que no están disponibles');
    console.log('Intentando cargar manualmente...');
    
    // Intentar importar manualmente
    import('./js/main.js').then(() => {
        console.log('✅ main.js cargado manualmente');
    }).catch(err => {
        console.error('❌ Error cargando main.js:', err);
    });
}
