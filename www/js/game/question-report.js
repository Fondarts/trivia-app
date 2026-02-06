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

    } catch (error) {

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

  };
  document.head.appendChild(script);
} else {
  initEmailJS();
}

// Guardar datos de la pregunta actual
export function setCurrentQuestionData(q) {
  // Asegurar que tenemos un objeto válido
  if (!q) {

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
    category: q.category || getCategoryFromContext() || 'Not available',
    // Intentar obtener dificultad del contexto si no está en el objeto
    difficulty: q.difficulty || getDifficultyFromContext() || 'Not available',
    // Asegurar que tenemos la imagen
    img: q.img || (q.media && q.media.src) || null
  };
  
  currentQuestionData = enrichedData;

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
        alert('Please describe the problem');
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

    alert('Error: The report system is not available. Please try again later.');
    return;
  }
  
  // Verificar que el Service ID esté configurado
  if (!EMAILJS_CONFIG.SERVICE_ID || EMAILJS_CONFIG.SERVICE_ID === '') {

    alert('Error: The report system is not configured correctly. Please contact the administrator.');
    return;
  }
  
  const btnSend = document.getElementById('btnSendReport');
  if (!btnSend) {

    return;
  }
  
  const reasonText = {
    'incorrect_image': 'Incorrect image',
    'incorrect_answer': 'Incorrect answer',
    'incorrect_translation': 'Incorrect translation',
    'other': 'Other'
  }[reason] || reason;
  
  // Preparar información detallada de la pregunta
  const questionText = currentQuestionData?.q || currentQuestionData?.question || 'Not available';
  const options = currentQuestionData?.options || [];
  const correctAnswerIndex = currentQuestionData?.answer !== undefined ? currentQuestionData.answer : (currentQuestionData?.correct || 0);
  const correctAnswer = options[correctAnswerIndex] || 'Not available';
  const category = currentQuestionData?.category || 'Not available';
  const difficulty = currentQuestionData?.difficulty || 'Not available';
  const imageUrl = currentQuestionData?.img || currentQuestionData?.media?.src || 'Not available';
  
  const formattedOptions = options.map((opt, i) => 
    `${String.fromCharCode(65 + i)}. ${opt || '(empty)'}`
  ).join('\n') || 'Not available';
  
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
  
  try {
    btnSend.disabled = true;
    btnSend.textContent = 'Sending...';
    
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );

    if (window.toast) {
      window.toast('✅ Report sent successfully. Thank you!');
    } else {
      alert('✅ Report sent successfully. Thank you!');
    }
    
    btnSend.disabled = false;
    btnSend.textContent = 'Send report';
  } catch (error) {

    let errorMessage = '❌ Error sending the report. Please try again.';
    if (error.text && error.text.includes('service ID not found')) {
      errorMessage = '❌ Error: EmailJS Service ID not found. Please contact the administrator.';
    } else if (error.text && error.text.includes('template')) {
      errorMessage = '❌ Error: EmailJS Template ID not found. Please contact the administrator.';
    }
    
    alert(errorMessage);
    btnSend.disabled = false;
    btnSend.textContent = 'Send report';
  }
}

// Exponer función globalmente
window.setCurrentQuestionData = setCurrentQuestionData;
