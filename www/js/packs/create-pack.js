// js/packs/create-pack.js - Sistema para crear packs de preguntas personalizados

let currentPackQuestions = [];
let questionCounter = 0;

// Inicializar el sistema de creación de packs
export function initCreatePack() {
  const btnCreatePack = document.getElementById('btnCreatePack');
  const modal = document.getElementById('createPackModal');
  const btnClose = document.getElementById('btnCloseCreatePack');
  const btnCancel = document.getElementById('btnCancelCreatePack');
  const btnAddQuestion = document.getElementById('btnAddQuestion');
  const btnSavePack = document.getElementById('btnSavePack');
  
  if (!btnCreatePack || !modal) {
    console.warn('[create-pack] Elementos del modal no encontrados');
    return;
  }
  
  // Abrir modal
  btnCreatePack.onclick = () => {
    openCreatePackModal();
  };
  
  // Función para cerrar modal (se vincula cada vez que se abre)
  window.closeCreatePackModal = function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentModal = document.getElementById('createPackModal');
    if (currentModal) {
      currentModal.classList.remove('open');
      currentModal.style.display = 'none';
    }
    resetForm();
  };
  
  // Agregar pregunta
  if (btnAddQuestion) {
    btnAddQuestion.onclick = () => {
      addQuestion();
    };
  }
  
  // Guardar pack
  if (btnSavePack) {
    btnSavePack.onclick = () => {
      savePack();
    };
  }
  
  // Exponer función globalmente para abrir desde otros lugares
  window.openCreatePackModal = openCreatePackModal;
}

// Abrir modal de creación de pack
function openCreatePackModal() {
  const modal = document.getElementById('createPackModal');
  if (!modal) return;
  
  modal.classList.add('open');
  modal.style.display = 'flex';
  modal.style.pointerEvents = 'auto';
  
  // Resetear formulario
  resetForm();
  
  // Vincular botones de cerrar cada vez que se abre el modal
  const btnClose = document.getElementById('btnCloseCreatePack');
  const btnCancel = document.getElementById('btnCancelCreatePack');
  
  if (btnClose) {
    // Remover listeners anteriores clonando el botón
    const newBtnClose = btnClose.cloneNode(true);
    btnClose.parentNode.replaceChild(newBtnClose, btnClose);
    newBtnClose.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.closeCreatePackModal(e);
    };
  }
  
  if (btnCancel) {
    // Remover listeners anteriores clonando el botón
    const newBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    newBtnCancel.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.closeCreatePackModal(e);
    };
  }
  
  // Cerrar al hacer clic fuera del modal
  // Usar una función nombrada para poder removerla si es necesario
  if (!modal._handleModalClick) {
    modal._handleModalClick = (e) => {
      if (e.target === modal) {
        window.closeCreatePackModal(e);
      }
    };
  }
  modal.addEventListener('click', modal._handleModalClick);
}

// Resetear formulario
function resetForm() {
  currentPackQuestions = [];
  questionCounter = 0;
  
  const packNameInput = document.getElementById('packNameInput');
  const questionsList = document.getElementById('questionsList');
  
  if (packNameInput) packNameInput.value = '';
  if (questionsList) questionsList.innerHTML = '';
  
  // Agregar primera pregunta por defecto
  addQuestion();
}

// Agregar nueva pregunta
function addQuestion() {
  questionCounter++;
  const questionId = `question_${questionCounter}`;
  
  const question = {
    id: questionId,
    q: '',
    options: ['', '', '', ''],
    answer: 0,
    difficulty: 'medium',
    img: null
  };
  
  currentPackQuestions.push(question);
  renderQuestionsList();
  
  // Scroll al final de la lista
  const questionsList = document.getElementById('questionsList');
  if (questionsList) {
    setTimeout(() => {
      questionsList.scrollTop = questionsList.scrollHeight;
    }, 100);
  }
}

// Eliminar pregunta
function removeQuestion(questionId) {
  currentPackQuestions = currentPackQuestions.filter(q => q.id !== questionId);
  renderQuestionsList();
}

// Renderizar lista de preguntas
function renderQuestionsList() {
  const questionsList = document.getElementById('questionsList');
  if (!questionsList) return;
  
  if (currentPackQuestions.length === 0) {
    questionsList.innerHTML = '<p style="text-align:center; color:var(--muted); padding:20px;">No hay preguntas aún. Haz clic en "Agregar Pregunta" para comenzar.</p>';
    return;
  }
  
  questionsList.innerHTML = currentPackQuestions.map((question, index) => {
    return createQuestionEditorHTML(question, index);
  }).join('');
  
  // Vincular eventos de cada pregunta
  currentPackQuestions.forEach((question) => {
    bindQuestionEditorEvents(question.id);
  });
}

// Crear HTML del editor de pregunta
function createQuestionEditorHTML(question, index) {
  return `
    <div class="question-editor" data-question-id="${question.id}" style="padding:16px; border:1px solid var(--cardBorder); border-radius:8px; background:var(--bg1);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="margin:0; font-size:16px; font-weight:600;">Pregunta ${index + 1}</h3>
        <button class="iconbtn" type="button" data-remove-question="${question.id}" style="color:var(--danger);">🗑️</button>
      </div>
      
      <div style="margin-bottom:12px;">
        <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:500;">Texto de la pregunta:</label>
        <textarea 
          data-field="q" 
          data-question-id="${question.id}"
          placeholder="Escribe la pregunta aquí..."
          style="width:100%; min-height:60px; padding:10px; border:1px solid var(--cardBorder); border-radius:6px; background:var(--bg2); color:var(--text); font-family:inherit; resize:vertical;"
        >${question.q || ''}</textarea>
      </div>
      
      <div style="margin-bottom:12px;">
        <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:500;">Opciones de respuesta:</label>
        ${question.options.map((opt, optIndex) => `
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <input 
              type="radio" 
              name="correct_${question.id}" 
              value="${optIndex}"
              ${question.answer === optIndex ? 'checked' : ''}
              data-question-id="${question.id}"
              data-option-index="${optIndex}"
              style="cursor:pointer;"
            >
            <input 
              type="text" 
              data-field="option" 
              data-question-id="${question.id}"
              data-option-index="${optIndex}"
              placeholder="Opción ${String.fromCharCode(65 + optIndex)}"
              value="${opt || ''}"
              style="flex:1; padding:8px; border:1px solid var(--cardBorder); border-radius:6px; background:var(--bg2); color:var(--text); font-family:inherit;"
            >
          </div>
        `).join('')}
      </div>
      
      <div>
        <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:500;">Dificultad:</label>
        <select 
          data-field="difficulty" 
          data-question-id="${question.id}"
          style="width:100%; padding:8px; border:1px solid var(--cardBorder); border-radius:6px; background:var(--bg2); color:var(--text); font-family:inherit;"
        >
          <option value="easy" ${question.difficulty === 'easy' ? 'selected' : ''}>Fácil</option>
          <option value="medium" ${question.difficulty === 'medium' ? 'selected' : ''}>Medio</option>
          <option value="hard" ${question.difficulty === 'hard' ? 'selected' : ''}>Difícil</option>
        </select>
      </div>
    </div>
  `;
}

// Vincular eventos del editor de pregunta
function bindQuestionEditorEvents(questionId) {
  const question = currentPackQuestions.find(q => q.id === questionId);
  if (!question) return;
  
  // Texto de la pregunta
  const questionText = document.querySelector(`textarea[data-field="q"][data-question-id="${questionId}"]`);
  if (questionText) {
    questionText.oninput = (e) => {
      question.q = e.target.value;
    };
  }
  
  // Opciones de respuesta
  question.options.forEach((opt, optIndex) => {
    const optionInput = document.querySelector(`input[data-field="option"][data-question-id="${questionId}"][data-option-index="${optIndex}"]`);
    if (optionInput) {
      optionInput.oninput = (e) => {
        question.options[optIndex] = e.target.value;
      };
    }
    
    // Radio button para respuesta correcta
    const radioBtn = document.querySelector(`input[type="radio"][name="correct_${questionId}"][value="${optIndex}"]`);
    if (radioBtn) {
      radioBtn.onchange = (e) => {
        if (e.target.checked) {
          question.answer = optIndex;
        }
      };
    }
  });
  
  // Dificultad
  const difficultySelect = document.querySelector(`select[data-field="difficulty"][data-question-id="${questionId}"]`);
  if (difficultySelect) {
    difficultySelect.onchange = (e) => {
      question.difficulty = e.target.value;
    };
  }
  
  // Botón eliminar
  const removeBtn = document.querySelector(`button[data-remove-question="${questionId}"]`);
  if (removeBtn) {
    removeBtn.onclick = () => {
      removeQuestion(questionId);
    };
  }
}

// Guardar pack
async function savePack() {
  const packNameInput = document.getElementById('packNameInput');
  
  const packName = packNameInput?.value.trim();
  
  // Validaciones
  if (!packName) {
    alert('Por favor ingresa un nombre para el pack');
    return;
  }
  
  if (currentPackQuestions.length === 0) {
    alert('Por favor agrega al menos una pregunta');
    return;
  }
  
  // Validar que todas las preguntas estén completas
  for (let i = 0; i < currentPackQuestions.length; i++) {
    const q = currentPackQuestions[i];
    if (!q.q || !q.q.trim()) {
      alert(`La pregunta ${i + 1} no tiene texto`);
      return;
    }
    if (q.options.some(opt => !opt || !opt.trim())) {
      alert(`La pregunta ${i + 1} tiene opciones vacías`);
      return;
    }
  }
  
  // Crear objeto del pack
  const pack = {
    name: packName,
    questions: currentPackQuestions.map(q => ({
      q: q.q.trim(),
      options: q.options.map(opt => opt.trim()),
      answer: q.answer,
      difficulty: q.difficulty,
      img: q.img || null
    })),
    createdAt: new Date().toISOString(),
    author: 'Usuario' // TODO: Obtener del usuario logueado
  };
  
  // Guardar en localStorage por ahora (luego se puede migrar a Supabase)
  try {
    const savedPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
    savedPacks.push(pack);
    localStorage.setItem('userCreatedPacks', JSON.stringify(savedPacks));
    
    if (window.toast) {
      window.toast(`✅ Pack "${packName}" guardado correctamente`);
    } else {
      alert(`✅ Pack "${packName}" guardado correctamente`);
    }
    
    // Cerrar modal
    const modal = document.getElementById('createPackModal');
    if (modal) {
      modal.classList.remove('open');
    }
    
    resetForm();
  } catch (error) {
    console.error('[create-pack] Error guardando pack:', error);
    alert('❌ Error al guardar el pack. Por favor intenta de nuevo.');
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCreatePack);
} else {
  initCreatePack();
}

