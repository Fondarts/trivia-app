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
  
  // Vincular eventos de las pestañas (usar delegación de eventos para que funcione siempre)
  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('pack-tab')) {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    }
  });
  
  // Botón de importar pack
  const btnImportPack = document.getElementById('btnImportPack');
  const importPackFile = document.getElementById('importPackFile');
  if (btnImportPack && importPackFile) {
    btnImportPack.onclick = () => {
      importPackFile.click();
    };
    
    importPackFile.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        importPackFromFile(file);
      }
      // Limpiar el input para que se pueda seleccionar el mismo archivo de nuevo
      e.target.value = '';
    };
  }
}

// Abrir modal de creación de pack
function openCreatePackModal(tab = 'create') {
  const modal = document.getElementById('createPackModal');
  if (!modal) return;
  
  modal.classList.add('open');
  modal.style.display = 'flex';
  modal.style.pointerEvents = 'auto';
  
  // Cambiar a la pestaña especificada
  switchTab(tab);
  
  // Resetear formulario solo si estamos en la pestaña de crear
  if (tab === 'create') {
    resetForm();
  } else {
    loadPacksList();
  }
  
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
  
  // Limpiar índice de edición
  if (window.editingPackIndex !== undefined) {
    delete window.editingPackIndex;
  }
  
  // Restaurar texto del botón de guardar
  const btnSave = document.getElementById('btnSavePack');
  if (btnSave) {
    btnSave.textContent = '💾 Guardar Pack';
  }
  
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
  
  // Guardar en localStorage por ahora (luego se puede migrar a Supabase)
  try {
    const savedPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
    
    // Si estamos editando, actualizar el pack existente
    if (window.editingPackIndex !== undefined && window.editingPackIndex !== null) {
      const existingPack = savedPacks[window.editingPackIndex];
      // Mantener la fecha de creación original
      savedPacks[window.editingPackIndex] = {
        name: packName,
        questions: currentPackQuestions.map(q => ({
          q: q.q.trim(),
          options: q.options.map(opt => opt.trim()),
          answer: q.answer,
          difficulty: q.difficulty,
          img: q.img || null
        })),
        createdAt: existingPack?.createdAt || new Date().toISOString(),
        author: existingPack?.author || 'Usuario'
      };
      delete window.editingPackIndex;
      
      if (window.toast) {
        window.toast(`✅ Pack "${packName}" actualizado correctamente`);
      } else {
        alert(`✅ Pack "${packName}" actualizado correctamente`);
      }
    } else {
      // Si es nuevo, crear el pack con fecha de creación
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
      savedPacks.push(pack);
      
      if (window.toast) {
        window.toast(`✅ Pack "${packName}" guardado correctamente`);
      } else {
        alert(`✅ Pack "${packName}" guardado correctamente`);
      }
    }
    
    localStorage.setItem('userCreatedPacks', JSON.stringify(savedPacks));
    
    // Refrescar selector de categorías para que aparezca el nuevo pack
    if (window.refreshCategorySelect) {
      window.refreshCategorySelect();
    }
    
    // Cambiar a pestaña de administración para ver el pack guardado
    switchTab('manage');
    loadPacksList();
    
    // Resetear formulario
    resetForm();
  } catch (error) {
    console.error('[create-pack] Error guardando pack:', error);
    alert('❌ Error al guardar el pack. Por favor intenta de nuevo.');
  }
}

// Cambiar de pestaña
function switchTab(tabName) {
  // Ocultar todos los contenidos
  document.querySelectorAll('.pack-tab-content').forEach(content => {
    content.style.display = 'none';
  });
  
  // Desactivar todas las pestañas
  document.querySelectorAll('.pack-tab').forEach(tab => {
    tab.classList.remove('active');
    tab.style.borderBottomColor = 'transparent';
    tab.style.color = 'var(--text)';
  });
  
  // Activar la pestaña seleccionada
  const activeTab = document.querySelector(`.pack-tab[data-tab="${tabName}"]`);
  const activeContent = document.getElementById(`${tabName}PackTab`);
  
  if (activeTab && activeContent) {
    activeTab.classList.add('active');
    activeTab.style.borderBottomColor = 'var(--accent)';
    activeTab.style.color = 'var(--accent)';
    activeContent.style.display = 'block';
    
    // Si cambiamos a administrar, cargar la lista
    if (tabName === 'manage') {
      loadPacksList();
    }
  }
}

// Cargar lista de packs para administración
function loadPacksList() {
  const container = document.getElementById('packsListContainer');
  if (!container) return;
  
  try {
    const userPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
    
    if (userPacks.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--muted);">No has creado ningún pack aún.<br><br>Crea tu primer pack en la pestaña "Crear Pack".</div>';
      return;
    }
    
    container.style.gap = '8px';
    container.innerHTML = userPacks.map((pack, index) => {
      const questionCount = pack.questions ? pack.questions.length : 0;
      const createdDate = pack.createdAt ? new Date(pack.createdAt).toLocaleDateString('es-ES') : 'Fecha desconocida';
      
      // Extraer nombre del pack y autor si está en el formato "Nombre (de Autor)"
      let packName = pack.name || `Pack ${index + 1}`;
      let authorName = pack.author || null;
      
      // Si el nombre contiene "(de ...)", separarlo
      const authorMatch = packName.match(/^(.+?)\s*\(de\s+(.+?)\)$/);
      if (authorMatch) {
        packName = authorMatch[1].trim();
        authorName = authorMatch[2].trim();
      }
      
      return `
        <div class="pack-item" data-pack-index="${index}" style="padding:12px; border:1px solid var(--cardBorder); border-radius:8px; background:var(--bg1);">
          <div style="display:flex; justify-content:space-between; align-items:start;">
            <div style="flex:1;">
              <h3 style="margin:0 0 2px 0; font-size:16px; font-weight:600; color:var(--text); line-height:1.2;">${packName}</h3>
              ${authorName ? `<div style="font-size:11px; color:var(--muted); margin-bottom:4px; line-height:1.2;">Creado por: ${authorName}</div>` : ''}
              <div style="font-size:13px; color:var(--muted); line-height:1.3;">
                ${questionCount} pregunta${questionCount !== 1 ? 's' : ''} • Creado: ${createdDate}
              </div>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="iconbtn" data-action="edit" data-pack-index="${index}" title="Editar" style="background:rgba(139, 92, 246, 0.2); color:var(--accent);">✏️</button>
              <button class="iconbtn" data-action="download" data-pack-index="${index}" title="Descargar JSON" style="background:rgba(34, 211, 238, 0.2); color:var(--accent2);">📥</button>
              <button class="iconbtn" data-action="share" data-pack-index="${index}" title="Compartir con amigos" style="background:rgba(34, 197, 94, 0.2); color:var(--good);">🔗</button>
              <button class="iconbtn" data-action="delete" data-pack-index="${index}" title="Eliminar" style="background:rgba(239, 68, 68, 0.2); color:var(--bad);">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Vincular eventos de los botones
    container.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.onclick = () => {
        const index = parseInt(btn.dataset.packIndex, 10);
        editPack(index);
      };
    });
    
    container.querySelectorAll('[data-action="download"]').forEach(btn => {
      btn.onclick = () => {
        const index = parseInt(btn.dataset.packIndex, 10);
        downloadPack(index);
      };
    });
    
    container.querySelectorAll('[data-action="share"]').forEach(btn => {
      btn.onclick = () => {
        const index = parseInt(btn.dataset.packIndex, 10);
        sharePack(index);
      };
    });
    
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.onclick = () => {
        const index = parseInt(btn.dataset.packIndex, 10);
        deletePack(index);
      };
    });
  } catch(e) {
    console.error('[create-pack] Error cargando lista de packs:', e);
    container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--danger);">Error al cargar los packs.</div>';
  }
}

// Editar pack existente
function editPack(packIndex) {
  try {
    const userPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
    const pack = userPacks[packIndex];
    
    if (!pack) {
      alert('Pack no encontrado');
      return;
    }
    
    // Cambiar a pestaña de crear
    switchTab('create');
    
    // Cargar datos del pack en el formulario
    const packNameInput = document.getElementById('packNameInput');
    if (packNameInput) {
      packNameInput.value = pack.name || '';
    }
    
    // Cargar preguntas
    currentPackQuestions = [];
    questionCounter = 0;
    
    if (pack.questions && Array.isArray(pack.questions)) {
      pack.questions.forEach((q, idx) => {
        questionCounter++;
        const questionId = `question_${questionCounter}`;
        currentPackQuestions.push({
          id: questionId,
          q: q.q || '',
          options: q.options || ['', '', '', ''],
          answer: q.answer || 0,
          difficulty: q.difficulty || 'medium',
          img: q.img || null
        });
      });
    }
    
    // Guardar el índice del pack que estamos editando
    window.editingPackIndex = packIndex;
    
    // Renderizar preguntas
    renderQuestionsList();
    
    // Cambiar texto del botón de guardar
    const btnSave = document.getElementById('btnSavePack');
    if (btnSave) {
      btnSave.textContent = '💾 Actualizar Pack';
    }
  } catch(e) {
    console.error('[create-pack] Error editando pack:', e);
    alert('Error al cargar el pack para editar');
  }
}

// Descargar pack como JSON
function downloadPack(packIndex) {
  try {
    const userPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
    const pack = userPacks[packIndex];
    
    if (!pack) {
      alert('Pack no encontrado');
      return;
    }
    
    // Crear objeto JSON limpio para descargar
    const packToDownload = {
      name: pack.name,
      questions: pack.questions || [],
      createdAt: pack.createdAt,
      author: pack.author || 'Usuario'
    };
    
    // Convertir a JSON con formato
    const jsonString = JSON.stringify(packToDownload, null, 2);
    
    // Crear blob y descargar
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pack.name || 'pack'}_${Date.now()}.json`.replace(/[^a-z0-9._-]/gi, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (window.toast) {
      window.toast('✅ Pack descargado correctamente');
    }
  } catch(e) {
    console.error('[create-pack] Error descargando pack:', e);
    alert('Error al descargar el pack');
  }
}

// Compartir pack con amigos
function sharePack(packIndex) {
  try {
    const userPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
    const pack = userPacks[packIndex];
    
    if (!pack) {
      alert('Pack no encontrado');
      return;
    }
    
    // Verificar que el sistema de amigos esté disponible
    if (!window.socialManager || !window.socialManager.friends || window.socialManager.friends.length === 0) {
      alert('No tienes amigos agregados. Agrega amigos primero para compartir packs.');
      return;
    }
    
    // Crear modal para seleccionar amigos
    showSharePackModal(packIndex, pack);
  } catch(e) {
    console.error('[create-pack] Error compartiendo pack:', e);
    alert('Error al compartir el pack');
  }
}

// Mostrar modal para compartir pack
function showSharePackModal(packIndex, pack) {
  // Crear modal si no existe
  let shareModal = document.getElementById('sharePackModal');
  if (!shareModal) {
    shareModal = document.createElement('div');
    shareModal.id = 'sharePackModal';
    shareModal.className = 'modal';
    shareModal.style.zIndex = '10001';
    document.body.appendChild(shareModal);
  }
  
  const friends = window.socialManager?.friends || [];
  
  shareModal.innerHTML = `
    <div class="panel" style="max-width: 500px;">
      <div class="row" style="justify-content:space-between; margin-bottom: 20px;">
        <div style="font-weight:800; font-size: 18px;">🔗 Compartir Pack: ${pack.name}</div>
        <button class="iconbtn" id="btnCloseSharePack" type="button">✖</button>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display:block; margin-bottom: 12px; font-weight:600; color: var(--text);">Selecciona amigos:</label>
        <div id="shareFriendsList" style="display:flex; flex-direction:column; gap:8px; max-height:300px; overflow-y:auto;">
          ${friends.map(friend => `
            <label style="display:flex; align-items:center; gap:10px; padding:10px; border:1px solid var(--cardBorder); border-radius:8px; cursor:pointer; background:var(--bg1); transition:all 0.2s;">
              <input type="checkbox" value="${friend.user_id}" style="cursor:pointer;">
              <img src="${friend.avatar_url || './img/avatar_placeholder.svg'}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;" onerror="this.src='./img/avatar_placeholder.svg';">
              <span style="flex:1; font-weight:500;">${friend.nickname}</span>
            </label>
          `).join('')}
        </div>
      </div>
      
      <div style="display:flex; gap:10px; justify-content:flex-end;">
        <button class="btn secondary" id="btnCancelSharePack" type="button">Cancelar</button>
        <button class="btn accent" id="btnSendSharePack" type="button" data-pack-index="${packIndex}">Enviar</button>
      </div>
    </div>
  `;
  
  shareModal.classList.add('open');
  shareModal.style.display = 'flex';
  
  // Vincular eventos
  document.getElementById('btnCloseSharePack').onclick = () => {
    shareModal.classList.remove('open');
    shareModal.style.display = 'none';
  };
  
  document.getElementById('btnCancelSharePack').onclick = () => {
    shareModal.classList.remove('open');
    shareModal.style.display = 'none';
  };
  
  document.getElementById('btnSendSharePack').onclick = async () => {
    const selectedFriends = Array.from(shareModal.querySelectorAll('input[type="checkbox"]:checked'))
      .map(cb => cb.value);
    
    if (selectedFriends.length === 0) {
      alert('Selecciona al menos un amigo');
      return;
    }
    
    await sendPackToFriends(packIndex, selectedFriends);
    shareModal.classList.remove('open');
    shareModal.style.display = 'none';
  };
}

// Enviar pack a amigos
async function sendPackToFriends(packIndex, friendIds) {
  try {
    const userPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
    const pack = userPacks[packIndex];
    
    if (!pack || !window.socialManager) {
      alert('Error: Sistema no disponible');
      return;
    }
    
    // Crear mensaje con el pack
    const packData = {
      type: 'pack_share',
      pack: {
        name: pack.name,
        questions: pack.questions || [],
        createdAt: pack.createdAt,
        author: pack.author || 'Usuario'
      }
    };
    
    // Enviar a cada amigo usando una tabla de base de datos (más confiable que broadcast)
    let sentCount = 0;
    for (const friendId of friendIds) {
      try {
        // Intentar insertar en una tabla de packs compartidos
        // Si la tabla no existe, usar broadcast como fallback
        const { data, error } = await window.socialManager.supabase
          .from('shared_packs')
          .insert({
            from_user_id: window.socialManager.userId,
            to_user_id: friendId,
            pack_name: packData.pack.name,
            pack_data: packData.pack,
            status: 'pending',
            created_at: new Date().toISOString()
          })
          .select();
        
        if (!error && data) {
          console.log(`✅ Pack guardado en BD para ${friendId}`);
          sentCount++;
        } else {
          // Fallback: usar broadcast si la tabla no existe
          console.log(`⚠️ Tabla shared_packs no disponible, usando broadcast para ${friendId}`);
          try {
            const channel = window.socialManager.supabase.channel(`pack-share-${friendId}`);
            const subscribePromise = new Promise((resolve) => {
              channel.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                  resolve();
                }
              });
            });
            
            await subscribePromise;
            
            const { error: sendError } = await channel.send({
              type: 'broadcast',
              event: 'pack-share',
              payload: {
                from_user_id: window.socialManager.userId,
                pack_data: packData
              }
            });
            
            if (!sendError) {
              console.log(`✅ Pack enviado por broadcast a ${friendId}`);
              sentCount++;
            }
          } catch(broadcastError) {
            console.error(`Error enviando pack a ${friendId}:`, broadcastError);
          }
        }
      } catch(e) {
        console.error(`Error enviando pack a ${friendId}:`, e);
      }
    }
    
    if (window.toast) {
      window.toast(`✅ Pack compartido con ${sentCount} amigo${sentCount !== 1 ? 's' : ''}`);
    } else {
      alert(`✅ Pack compartido con ${sentCount} amigo${sentCount !== 1 ? 's' : ''}`);
    }
  } catch(e) {
    console.error('[create-pack] Error enviando pack:', e);
    alert('Error al compartir el pack');
  }
}

// Importar pack desde archivo JSON
function importPackFromFile(file) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const packData = JSON.parse(e.target.result);
      
      // Validar estructura del pack
      if (!packData.name || !packData.questions || !Array.isArray(packData.questions)) {
        alert('El archivo JSON no tiene el formato correcto. Debe tener "name" y "questions" (array).');
        return;
      }
      
      // Validar que las preguntas tengan el formato correcto
      for (let i = 0; i < packData.questions.length; i++) {
        const q = packData.questions[i];
        if (!q.q || !Array.isArray(q.options) || q.options.length !== 4 || 
            typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) {
          alert(`La pregunta ${i + 1} no tiene el formato correcto. Debe tener "q", "options" (4 opciones) y "answer" (0-3).`);
          return;
        }
      }
      
      // Crear objeto del pack con fecha actual
      const importedPack = {
        name: packData.name,
        questions: packData.questions.map(q => ({
          q: String(q.q || '').trim(),
          options: (q.options || []).map(opt => String(opt || '').trim()).slice(0, 4),
          answer: Number.isInteger(q.answer) ? q.answer : 0,
          difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
          img: q.img || null
        })),
        createdAt: new Date().toISOString(),
        author: packData.author || 'Importado'
      };
      
      // Guardar en localStorage
      const userPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
      userPacks.push(importedPack);
      localStorage.setItem('userCreatedPacks', JSON.stringify(userPacks));
      
      // Recargar lista
      loadPacksList();
      
      // Refrescar selector de categorías
      if (window.refreshCategorySelect) {
        window.refreshCategorySelect();
      }
      
      if (window.toast) {
        window.toast(`✅ Pack "${importedPack.name}" importado correctamente`);
      } else {
        alert(`✅ Pack "${importedPack.name}" importado correctamente`);
      }
    } catch(error) {
      console.error('[create-pack] Error importando pack:', error);
      alert('Error al importar el pack. Verifica que el archivo JSON sea válido.');
    }
  };
  
  reader.onerror = () => {
    alert('Error al leer el archivo');
  };
  
  reader.readAsText(file);
}

// Eliminar pack
function deletePack(packIndex) {
  if (!confirm('¿Estás seguro de que quieres eliminar este pack? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    const userPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
    userPacks.splice(packIndex, 1);
    localStorage.setItem('userCreatedPacks', JSON.stringify(userPacks));
    
    // Recargar lista
    loadPacksList();
    
    // Refrescar selector de categorías
    if (window.refreshCategorySelect) {
      window.refreshCategorySelect();
    }
    
    if (window.toast) {
      window.toast('✅ Pack eliminado correctamente');
    }
  } catch(e) {
    console.error('[create-pack] Error eliminando pack:', e);
    alert('Error al eliminar el pack');
  }
}

// Importar pack compartido por un amigo
function importSharedPack(packData, senderName) {
  try {
    if (!packData || !packData.name || !packData.questions) {
      alert('El pack compartido no tiene el formato correcto');
      return;
    }
    
    // Crear objeto del pack con fecha actual y nombre del remitente
    const importedPack = {
      name: `${packData.name} (de ${senderName})`,
      questions: packData.questions.map(q => ({
        q: String(q.q || '').trim(),
        options: (q.options || []).map(opt => String(opt || '').trim()).slice(0, 4),
        answer: Number.isInteger(q.answer) ? q.answer : 0,
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
        img: q.img || null
      })),
      createdAt: new Date().toISOString(),
      author: senderName || 'Amigo'
    };
    
    // Guardar en localStorage
    const userPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
    userPacks.push(importedPack);
    localStorage.setItem('userCreatedPacks', JSON.stringify(userPacks));
    
    // Refrescar selector de categorías
    if (window.refreshCategorySelect) {
      window.refreshCategorySelect();
    }
    
    if (window.toast) {
      window.toast(`✅ Pack "${importedPack.name}" importado correctamente`);
    } else {
      alert(`✅ Pack "${importedPack.name}" importado correctamente`);
    }
    
    // Si el modal de packs está abierto, recargar la lista
    const manageTab = document.getElementById('managePackTab');
    if (manageTab && manageTab.style.display !== 'none') {
      loadPacksList();
    }
  } catch(error) {
    console.error('[create-pack] Error importando pack compartido:', error);
    alert('Error al importar el pack compartido');
  }
}

// Exponer función globalmente para que pueda ser llamada desde friends_ui.js
if (typeof window !== 'undefined') {
  window.importSharedPack = importSharedPack;
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCreatePack);
} else {
  initCreatePack();
}

