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
  // Aplicar tema único (light)
  document.documentElement.setAttribute('data-theme', 'light');
  
  // Efecto ripple desactivado
  // document.querySelectorAll('.btn, .pill, .seg, .option').forEach(addRippleEffect);
  
  // Animar elementos al aparecer
  animateElements();
  
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
  
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVisualEffects);
} else {
  initVisualEffects();
}