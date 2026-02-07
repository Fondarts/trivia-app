// Lightweight settings/state store replacing ../deprecated/store.js
export const SETTINGS = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem('trivia_settings') || '{}');
    return {
      sounds: saved.sounds !== undefined ? !!saved.sounds : true,
      autoNextRounds: saved.autoNextRounds !== undefined ? !!saved.autoNextRounds : false,
    };
  } catch {
    return { sounds: true, autoNextRounds: false };
  }
})();

export const STATE = {
  score: 0,
  index: 0,
  total: 0,
  mode: 'rounds',
  deck: [],
  wrongAnswers: [], // Array para rastrear preguntas incorrectas
};

export function persistSettings() {
  try { localStorage.setItem('trivia_settings', JSON.stringify(SETTINGS)); } catch {}
}

