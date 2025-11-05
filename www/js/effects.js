// ============================================
// QUIZLE! - SISTEMA DE EFECTOS VISUALES
// v1.0 - Mejoras de UX y animaciones
// ============================================

// Función para agregar efecto ripple a botones
export function addRippleEffect(element) {
  element.classList.add('ripple');
  element.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple-effect');
    
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    this.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
}

// Función para animar la aparición de elementos
export function animateElements() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });
  
  document.querySelectorAll('.card, .section, .badge').forEach(el => {
    observer.observe(el);
  });
}

// Función para mostrar efecto de confetti
export function showConfetti() {
  const colors = ['#8b5cf6', '#22d3ee', '#22c55e', '#f59e0b', '#ef4444'];
  const confettiCount = 50;
  const container = document.body;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}%;
      animation: confetti-fall 3s linear forwards;
      z-index: 10000;
      pointer-events: none;
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      animation-delay: ${Math.random() * 0.5}s;
    `;
    container.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3500);
  }
}

// Función para el efecto de nivel subido
export function showLevelUpEffect(element) {
  element.classList.add('level-up-effect');
  showConfetti();
  
  // Crear notificación especial
  const notification = document.createElement('div');
  notification.className = 'level-up-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: white;
      padding: 20px 40px;
      border-radius: 20px;
      font-size: 24px;
      font-weight: 800;
      z-index: 10001;
      animation: bounceIn 0.6s ease-out;
      box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);
    ">
      🎉 ¡NIVEL SUBIDO! 🎉
    </div>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.5s ease-out';
    setTimeout(() => notification.remove(), 500);
  }, 2500);
}

// Función para efectos de respuesta correcta/incorrecta
export function addAnswerEffect(element, isCorrect) {
  element.classList.add(isCorrect ? 'correct-answer-effect' : 'wrong-answer-effect');
  
  // Vibración háptica si está disponible
  if (navigator.vibrate) {
    navigator.vibrate(isCorrect ? [50, 50, 50] : [100, 50, 100]);
  }
}

// Función para mejorar la transición entre temas
export function smoothThemeTransition() {
  const root = document.documentElement;
  const themes = document.querySelectorAll('input[name="theme"]');
  
  // Pre-cargar ambos fondos
  preloadBackgrounds();
  
  themes.forEach(theme => {
    theme.addEventListener('change', (e) => {
      // Crear overlay de transición
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${e.target.value === 'dark' ? '#0f172a' : '#f0f9ff'};
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(overlay);
      
      // Animar transición
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        setTimeout(() => {
          root.setAttribute('data-theme', e.target.value);
          localStorage.setItem('theme', e.target.value);
          overlay.style.opacity = '0';
          setTimeout(() => overlay.remove(), 300);
        }, 300);
      });
    });
  });
}

// Función para pre-cargar fondos
function preloadBackgrounds() {
  const backgrounds = [
    './assets/backgrounds/bgdark.webp',
    './assets/backgrounds/bglight.webp'
  ];
  
  backgrounds.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => console.log(`✅ Fondo cargado: ${src}`);
    img.onerror = () => console.error(`❌ Error cargando fondo: ${src}`);
  });
}

// Función para efectos de hover mejorados
export function enhanceHoverEffects() {
  // Agregar clase hover-float a elementos específicos
  document.querySelectorAll('.iconbtn, .badge, .pill').forEach(el => {
    el.classList.add('hover-float');
  });
}

// Función para mostrar tooltips mejorados
export function addTooltip(element, text) {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = text;
  tooltip.style.cssText = `
    position: absolute;
    background: var(--card);
    color: var(--text);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
    backdrop-filter: blur(8px);
    border: 1px solid var(--cardBorder);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  `;
  
  element.addEventListener('mouseenter', (e) => {
    document.body.appendChild(tooltip);
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.bottom + 10}px`;
    
    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
    });
  });
  
  element.addEventListener('mouseleave', () => {
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateY(10px)';
    setTimeout(() => tooltip.remove(), 300);
  });
}

// Función para animación de carga mejorada
export function showLoadingAnimation(show = true) {
  const existingLoader = document.getElementById('loading-overlay');
  
  if (show) {
    if (existingLoader) return;
    
    const loader = document.createElement('div');
    loader.id = 'loading-overlay';
    loader.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
      ">
        <div style="
          background: var(--card);
          padding: 24px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          animation: slideUp 0.3s ease;
        ">
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div style="color: var(--text); font-weight: 600;">Cargando...</div>
        </div>
      </div>
    `;
    document.body.appendChild(loader);
  } else {
    if (existingLoader) {
      existingLoader.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => existingLoader.remove(), 300);
    }
  }
}

// Función para efectos de sonido
export function playSound(type) {
  if (!document.getElementById('optSounds')?.checked) return;
  
  const sounds = {
    correct: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
    wrong: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
    click: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
    levelUp: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
  };
  
  if (sounds[type]) {
    const audio = new Audio(sounds[type]);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }
}

// Inicializar efectos al cargar
export function initVisualEffects() {
  // Aplicar tema guardado
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeInput = document.querySelector(`input[name="theme"][value="${savedTheme}"]`);
  if (themeInput) themeInput.checked = true;
  
  // Agregar ripple a todos los botones
  document.querySelectorAll('.btn, .pill, .seg, .option').forEach(addRippleEffect);
  
  // Animar elementos al aparecer
  animateElements();
  
  // Mejorar efectos de hover
  enhanceHoverEffects();
  
  // Transiciones suaves de tema
  smoothThemeTransition();
  
  // Agregar tooltips (excluir elementos que ya tienen tooltips CSS como .mode-btn)
  document.querySelectorAll('[title]').forEach(el => {
    // No agregar tooltip dinámico si el elemento ya tiene un tooltip CSS
    if (!el.querySelector('.mode-tooltip') && !el.classList.contains('mode-btn')) {
      addTooltip(el, el.getAttribute('title'));
      el.removeAttribute('title');
    }
  });
  
  // Agregar sonidos a clicks
  document.addEventListener('click', (e) => {
    if (e.target.matches('.btn, .pill, .seg, .option')) {
      playSound('click');
    }
  });
  
  console.log('✨ Efectos visuales inicializados');
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVisualEffects);
} else {
  initVisualEffects();
}