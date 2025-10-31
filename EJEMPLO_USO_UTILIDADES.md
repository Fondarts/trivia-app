# 📚 Ejemplos de Uso de las Nuevas Utilidades

## ✅ Fase 1 Completada: Utilidades Base

Se han creado dos utilidades centralizadas compatibles con el código existente:

### 1. `DOMUtils` - Utilidades de DOM

#### Ejemplos de uso:

```javascript
// Antes (código existente - sigue funcionando):
const el = document.getElementById('myElement');

// Ahora (nuevo - opcional, compatible):
import { DOMUtils } from './core/dom-utils.js';
const el = DOMUtils.getElement('myElement'); // Con caché automático

// O desde código tradicional (después de main.js):
const el = window.DOMUtils.getElement('myElement');
```

#### Funciones disponibles:

```javascript
// Obtener elementos con caché
DOMUtils.getElement('myId');
DOMUtils.query('.my-class');
DOMUtils.queryAll('.my-classes');

// Crear elementos
const btn = DOMUtils.create('button', {
  id: 'myBtn',
  className: 'btn-primary',
  textContent: 'Click me',
  listeners: {
    click: () => console.log('Clicked!')
  }
});

// Actualizar elementos sin recrear
DOMUtils.update(element, {
  textContent: 'New text',
  className: 'new-class',
  style: { color: 'red' }
});

// Toggle visibility
DOMUtils.show(element);
DOMUtils.hide(element);
DOMUtils.toggle(element);

// Modales
DOMUtils.Modal.open('myModal');
DOMUtils.Modal.close('myModal');
DOMUtils.Modal.toggle('myModal');

// Event delegation
const cleanup = DOMUtils.delegate(container, '.btn', 'click', (e, target) => {
  console.log('Button clicked:', target);
});
// cleanup(); // Para remover el listener

// Obtener múltiples elementos
const elements = DOMUtils.getElements(['id1', 'id2', 'id3']);
```

---

### 2. `StateManager` - Gestor de Estado

#### Ejemplos de uso:

```javascript
// Antes (código existente - sigue funcionando):
localStorage.setItem('myKey', JSON.stringify(value));
const value = JSON.parse(localStorage.getItem('myKey') || 'null');

// Ahora (nuevo - opcional, compatible):
import { StateManager } from './core/state-manager.js';

// Obtener/establecer estado
StateManager.set('user', { name: 'John', level: 5 });
const user = StateManager.get('user', { name: 'Guest' });

// Actualizar múltiples valores
StateManager.update({
  score: 100,
  level: 5,
  xp: 250
});

// Suscribirse a cambios
const unsubscribe = StateManager.subscribe('score', (newValue, oldValue) => {
  console.log(`Score cambió de ${oldValue} a ${newValue}`);
});

// Suscribirse a múltiples claves
const unsubscribeAll = StateManager.subscribeMultiple(
  ['score', 'level', 'xp'],
  (newValue, oldValue, key) => {
    console.log(`${key} cambió:`, { oldValue, newValue });
  }
);

// Eliminar clave
StateManager.delete('score');

// Verificar si existe
if (StateManager.has('user')) {
  console.log('Usuario existe');
}

// Obtener todas las claves
const keys = StateManager.keys();

// Limpiar todo
StateManager.clear(); // Solo memoria
StateManager.clear(true); // Memoria + localStorage
```

---

## 🔄 Migración Gradual

**NO es necesario migrar todo el código inmediatamente.**

Las utilidades están diseñadas para:
- ✅ **Coexistir** con código existente
- ✅ **No romper** funcionalidad actual
- ✅ **Usarse gradualmente** donde tenga sentido

### Ejemplo de migración gradual:

```javascript
// En un archivo nuevo o al refactorizar:
// Antes:
function updateScore(score) {
  const scoreEl = document.getElementById('score');
  if (scoreEl) {
    scoreEl.textContent = score;
  }
  localStorage.setItem('currentScore', JSON.stringify(score));
}

// Después (usando utilidades):
import { DOMUtils, StateManager } from './core/dom-utils.js';

function updateScore(score) {
  DOMUtils.update(DOMUtils.getElement('score'), {
    textContent: score
  });
  StateManager.set('currentScore', score);
}
```

---

## 📋 Próximos Pasos (Fase 2)

En la siguiente fase, empezaremos a usar estas utilidades en:
1. Refactorizar `main.js` usando `DOMUtils`
2. Migrar lógica de estado a `StateManager`
3. Reducir duplicación de código DOM

---

## ⚠️ Compatibilidad

- ✅ **Todo el código existente sigue funcionando**
- ✅ **No se rompió nada**
- ✅ **Las utilidades están disponibles globalmente** (`window.DOMUtils`, `window.StateManager`)
- ✅ **Pueden usarse en módulos ES6** o código tradicional (IIFE)

