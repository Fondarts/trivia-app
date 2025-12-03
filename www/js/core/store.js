// Lightweight settings/state store replacing ../deprecated/store.js
export const SETTINGS = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem('trivia_settings') || '{}');
    return {
      theme: saved.theme || (document.documentElement.getAttribute('data-theme') || 'dark'),
      sounds: saved.sounds !== undefined ? !!saved.sounds : true,
      autoNextRounds: saved.autoNextRounds !== undefined ? !!saved.autoNextRounds : false,
      groupByCategory: saved.groupByCategory !== undefined ? !!saved.groupByCategory : true,
    };
  } catch {
    return { theme: 'dark', sounds: true, autoNextRounds: false, groupByCategory: true };
  }
})();

export const STATE = {
  score: 0,
  index: 0,
  total: 0,
  mode: 'rounds',
  deck: [],
};

export function persistSettings() {
  try { localStorage.setItem('trivia_settings', JSON.stringify(SETTINGS)); } catch {}
}


