// js/game/question-report.js - Sistema de reporte de preguntas con EmailJS

// Configuración de EmailJS
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_h51mtuv',
  TEMPLATE_ID: 'template_mtpqkjs',
  PUBLIC_KEY: 'JmI1LSf1UjD8LpjcH'
};

let emailjsReady = false;
let currentQuestionData = null;

// Inicializar EmailJS
function initEmailJS() {
  if (window.emailjs) {
    try {
      window.emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
      emailjsReady = true;
      console.log('[report] EmailJS inicializado correctamente');
    } catch (error) {
      console.error('[report] Error inicializando EmailJS:', error);
    }
  }
}

// Cargar EmailJS si no está disponible
if (!window.emailjs) {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  script.onload = () => {
    initEmailJS();
  };
  script.onerror = () => {
    console.error('[report] Error cargando EmailJS');
  };
  document.head.appendChild(script);
} else {
  initEmailJS();
}

// Guardar datos de la pregunta actual
export function setCurrentQuestionData(q) {
  // Asegurar que tenemos un objeto válido
  if (!q) {
    console.warn('[report] setCurrentQuestionData recibió un objeto vacío');
    return;
  }
  
  // Intentar obtener información adicional del contexto si no está en el objeto
  const enrichedData = {
    ...q,
    // Asegurar que tenemos el texto de la pregunta
    q: q.q || q.question || '',
    // Asegurar que tenemos las opciones
    options: q.options || [],
    // Asegurar que tenemos la respuesta correcta
    answer: q.answer !== undefined ? q.answer : (q.correct !== undefined ? q.correct : 0),
    // Intentar obtener categoría del contexto si no está en el objeto
    category: q.category || getCategoryFromContext() || 'No disponible',
    // Intentar obtener dificultad del contexto si no está en el objeto
    difficulty: q.difficulty || getDifficultyFromContext() || 'No disponible',
    // Asegurar que tenemos la imagen
    img: q.img || (q.media && q.media.src) || null
  };
  
  currentQuestionData = enrichedData;
  
  console.log('[report] Datos de pregunta guardados:', {
    question: enrichedData.q,
    category: enrichedData.category,
    difficulty: enrichedData.difficulty,
    options: enrichedData.options.length,
    answer: enrichedData.answer,
    image: enrichedData.img
  });
}

// Obtener categoría del contexto del juego
function getCategoryFromContext() {
  // Intentar obtener de los elementos del DOM
  const bCat = document.getElementById('bCat');
  if (bCat && bCat.textContent && bCat.textContent !== 'Contrarreloj') {
    return bCat.textContent.trim();
  }
  
  // Intentar obtener del estado del juego
  if (window.STATE && window.STATE.deck && window.STATE.deck.length > 0) {
    const currentIndex = window.STATE.index || 0;
    const currentQuestion = window.STATE.deck[currentIndex - 1] || window.STATE.deck[currentIndex];
    if (currentQuestion && currentQuestion.category) {
      return currentQuestion.category;
    }
  }
  
  // Intentar obtener del modo aventura
  if (window.AdventureMode && window.AdventureMode.ADVENTURE_STATE) {
    const regionKey = window.AdventureMode.ADVENTURE_STATE.currentRegion;
    if (regionKey) {
      // Mapear regionKey a nombre de categoría
      const categoryMap = {
        'ciencia': 'Ciencia',
        'historia': 'Historia',
        'geografia': 'Geografía',
        'deportes': 'Deportes',
        'cine': 'Cine',
        'anime': 'Anime',
        'testcine': 'Test cine'
      };
      return categoryMap[regionKey] || regionKey;
    }
  }
  
  return null;
}

// Obtener dificultad del contexto del juego
function getDifficultyFromContext() {
  // Intentar obtener de los elementos del DOM
  const bDiff = document.getElementById('bDiff');
  if (bDiff && bDiff.textContent && bDiff.textContent !== '—') {
    return bDiff.textContent.trim();
  }
  
  // Intentar obtener del estado del juego
  if (window.STATE && window.STATE.deck && window.STATE.deck.length > 0) {
    const currentIndex = window.STATE.index || 0;
    const currentQuestion = window.STATE.deck[currentIndex - 1] || window.STATE.deck[currentIndex];
    if (currentQuestion && currentQuestion.difficulty) {
      return currentQuestion.difficulty;
    }
  }
  
  return null;
}

// Inicializar sistema de reporte
export function initQuestionReport() {
  const btnReport = document.getElementById('btnReportQuestion');
  const modal = document.getElementById('reportQuestionModal');
  const btnClose = document.getElementById('btnCloseReportModal');
  const btnCancel = document.getElementById('btnCancelReport');
  const btnSend = document.getElementById('btnSendReport');
  const radioButtons = document.querySelectorAll('input[name="reportReason"]');
  const otherSection = document.getElementById('reportOtherTextContainer');
  const otherText = document.getElementById('reportOtherText');
  
  if (!btnReport || !modal) return;
  
  // Abrir modal
  btnReport.onclick = function() {
    modal.classList.add('open');
  };
  
  // Cerrar modal
  const closeModal = () => {
    modal.classList.remove('open');
    // Resetear formulario
    radioButtons.forEach(rb => rb.checked = false);
    if (otherText) otherText.value = '';
    if (otherSection) otherSection.style.display = 'none';
  };
  
  if (btnClose) btnClose.onclick = closeModal;
  if (btnCancel) btnCancel.onclick = closeModal;
  
  // Mostrar/ocultar campo "Otro"
  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
      if (otherSection) {
        otherSection.style.display = radio.value === 'other' ? 'block' : 'none';
      }
    });
  });
  
  // Enviar reporte
  if (btnSend) {
    btnSend.onclick = async () => {
      const selectedReason = document.querySelector('input[name="reportReason"]:checked');
      if (!selectedReason) {
        alert('Por favor selecciona un motivo');
        return;
      }
      
      const reason = selectedReason.value;
      const otherDescription = reason === 'other' && otherText ? otherText.value.trim() : '';
      
      if (reason === 'other' && !otherDescription) {
        alert('Por favor describe el problema');
        return;
      }
      
      await sendReport(reason, otherDescription);
      closeModal();
    };
  }
}

// Enviar reporte por EmailJS
async function sendReport(reason, otherDescription) {
  if (!emailjsReady) {
    console.error('[report] EmailJS no está listo');
    alert('Error: El sistema de reportes no está disponible. Por favor intenta más tarde.');
    return;
  }
  
  // Verificar que el Service ID esté configurado
  if (!EMAILJS_CONFIG.SERVICE_ID || EMAILJS_CONFIG.SERVICE_ID === '') {
    console.error('[report] Service ID no configurado');
    alert('Error: El sistema de reportes no está configurado correctamente. Por favor contacta al administrador.');
    return;
  }
  
  const btnSend = document.getElementById('btnSendReport');
  if (!btnSend) {
    console.error('[report] Botón btnSendReport no encontrado');
    return;
  }
  
  const reasonText = {
    'incorrect_image': 'Imagen incorrecta',
    'incorrect_answer': 'Respuesta incorrecta',
    'other': 'Otro'
  }[reason] || reason;
  
  // Preparar información detallada de la pregunta
  const questionText = currentQuestionData?.q || currentQuestionData?.question || 'No disponible';
  const options = currentQuestionData?.options || [];
  const correctAnswerIndex = currentQuestionData?.answer !== undefined ? currentQuestionData.answer : (currentQuestionData?.correct || 0);
  const correctAnswer = options[correctAnswerIndex] || 'No disponible';
  const category = currentQuestionData?.category || 'No disponible';
  const difficulty = currentQuestionData?.difficulty || 'No disponible';
  const imageUrl = currentQuestionData?.img || currentQuestionData?.media?.src || 'No disponible';
  
  // Formatear opciones con letras
  const formattedOptions = options.map((opt, i) => 
    `${String.fromCharCode(65 + i)}. ${opt || '(vacía)'}`
  ).join('\n') || 'No disponible';
  
  // Preparar variables según el template de EmailJS
  const templateParams = {
    reason: reasonText,
    reason_detail: otherDescription || '',
    question: questionText,
    category: category,
    difficulty: difficulty,
    options: formattedOptions,
    image_url: imageUrl,
    timestamp: new Date().toLocaleString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };
  
  console.log('[report] Enviando reporte con datos:', {
    question: questionText,
    category,
    difficulty,
    options: formattedOptions,
    correctAnswer: `${String.fromCharCode(65 + correctAnswerIndex)}. ${correctAnswer}`,
    image: imageUrl
  });
  
  try {
    btnSend.disabled = true;
    btnSend.textContent = 'Enviando...';
    
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );
    
    console.log('[report] Email enviado:', response);
    if (window.toast) {
      window.toast('✅ Reporte enviado correctamente. ¡Gracias!');
    } else {
      alert('✅ Reporte enviado correctamente. ¡Gracias!');
    }
    
    btnSend.disabled = false;
    btnSend.textContent = 'Enviar reporte';
  } catch (error) {
    console.error('[report] Error enviando email:', error);
    
    // Mensaje de error más específico
    let errorMessage = '❌ Error al enviar el reporte. Por favor intenta de nuevo.';
    if (error.text && error.text.includes('service ID not found')) {
      errorMessage = '❌ Error: Service ID de EmailJS no encontrado. Por favor contacta al administrador.';
    } else if (error.text && error.text.includes('template')) {
      errorMessage = '❌ Error: Template ID de EmailJS no encontrado. Por favor contacta al administrador.';
    }
    
    alert(errorMessage);
    btnSend.disabled = false;
    btnSend.textContent = 'Enviar reporte';
  }
}

// Exponer función globalmente
window.setCurrentQuestionData = setCurrentQuestionData;
