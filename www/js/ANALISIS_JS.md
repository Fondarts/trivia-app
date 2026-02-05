# Análisis de archivos JS – www/js

Resumen de cada archivo, qué hace y qué se eliminó o se puede eliminar.

---

## Archivos eliminados

### `core/utils.js` — **ELIMINADO**
- **Qué hacía:** Exportaba Logger, Platform, Sounds, toast y re-exportaba DOMUtils.
- **Por qué se eliminó:** Ningún archivo importaba `utils.js`; todos usan `dom-utils.js` directamente. Código muerto.

### `core/debounce.js` — **ELIMINADO**
- **Qué hacía:** Exportaba `debounce`, `throttle` y `cacheAsync`, y los exponía en `window`.
- **Por qué se eliminó:** No hay ningún uso de `debounce`, `throttle` ni `cacheAsync` en el proyecto. Código muerto.

---

## Core

### `core/storage.js`
- **Qué hace:** Wrapper de localStorage con caché, TTL, validadores y migraciones.
- **Usado por:** `bank.js`, `player/stats.js`.
- **Estado:** Necesario. Solo se usan `get` y `set`; el resto de métodos están por si se quieren usar después.

### `core/store.js`
- **Qué hace:** Estado ligero: `SETTINGS` (sounds, autoNextRounds, groupByCategory), `STATE` (score, index, deck, wrongAnswers), `persistSettings()`.
- **Usado por:** `main.js`, `solo.js`, `ui.js`, etc.
- **Estado:** Necesario. Sin cambios.

### `core/dom-utils.js`
- **Qué hace:** Utilidades de DOM: getElement (con caché), query, create, Modal.open/close, delegate, show/hide.
- **Usado por:** `main.js`, `game-ui.js`, `event-bindings.js`.
- **Estado:** Necesario. Sin cambios.

### `core/i18n.js`
- **Qué hace:** Traducciones ES/EN y funciones `t()`, `setLanguage`, `getLanguage`, `initI18n`, `updateUI`.
- **Usado por:** Casi todos los módulos de UI y juego.
- **Estado:** Necesario. Quedan claves antiguas (p. ej. "store", "Friends") que se pueden limpiar cuando toque.

---

## Game

### `game/bank.js`
- **Qué hace:** Banco de preguntas: getBank, setBank, getCustom, warmLocalBank, buildDeckSingle, ensureBankReady, normalizeQuestion. Usa Storage y localStorage para `recent_questions_*`.
- **Usado por:** `bank_bridge.js`, `solo.js`, `ui.js`.
- **Estado:** Necesario. Sin cambios.

### `game/bank_bridge.js`
- **Qué hace:** Carga `bank.js` como módulo, expone getBank, setBank, getBankCount, buildDeckSingle, etc. en `window` y dispara `bankReady`.
- **Usado por:** Cargado por `index.html` antes de `main.js`.
- **Estado:** Necesario. Sin cambios.

### `game/solo.js`
- **Qué hace:** Lógica del modo test: startSolo, nextQuestion, endGame, renderQuestion, openSingleResult, showVerseModal, audio, HUD, XP/logros.
- **Usado por:** `main.js`, `event-bindings.js`.
- **Cambio aplicado:** Se quitó el bloque muerto `if (false) { el.classList.add('urgent'); } else { ... }` y se dejó solo `el.classList.remove('urgent');`.

### `game/ui.js`
- **Qué hace:** toast, updatePlayerXPBar, bindProfileModal, bindSettingsListeners, refreshCategorySelect, applyInitialUI, bindStatsOpen, populateCategorySelect, etc.
- **Usado por:** `main.js`, `solo.js`, `bible-study.js`.
- **Estado:** Necesario. Sin cambios.

### `game/ui_stats_translated.js`
- **Qué hace:** `renderStatsPageTranslated()`: pinta la página de estadísticas con traducciones.
- **Usado por:** Llamado desde UI (modal de perfil).
- **Cambio aplicado:** Se eliminó la referencia a VS: ya no se muestra `vsGamesWon` ni `t('vsGames')`; solo partidas solo.

### `game/question-report.js`
- **Qué hace:** Reporte de preguntas con EmailJS: setCurrentQuestionData, initQuestionReport, envío por email.
- **Usado por:** `main.js` (init dinámico), `solo.js` (setCurrentQuestionData).
- **Estado:** Necesario. Sin cambios.

### `game/wordsearch.js`
- **Qué hace:** Lógica de sopa de letras: generateWordSearch, palabras ocultas, grilla, direcciones.
- **Usado por:** `wordsearch-ui.js`.
- **Estado:** Necesario. Sin cambios.

### `game/wordsearch-ui.js`
- **Qué hace:** UI de sopa de letras: renderizado de grilla y versículo, selección, validación, botones.
- **Usado por:** `main.js` (bindWordSearchButtons).
- **Estado:** Necesario. Sin cambios.

### `game/bible-study.js`
- **Qué hace:** Estudio de la Biblia: lista de libros, lectura, versículos guardados, notas, highlights, openReaderWithBook, populateBibleBookSelector.
- **Usado por:** `main.js`, `ui.js`, `wordsearch-ui.js`.
- **Estado:** Necesario. Sin cambios.

---

## UI / Init

### `ui/game-ui.js`
- **Qué hace:** showGameUI, showConfigUI, updateGameModeDescription (solo modos rounds, wordsearch, bible).
- **Usado por:** `main.js`, `event-bindings.js`.
- **Estado:** Necesario. Sin cambios.

### `init/event-bindings.js`
- **Qué hace:** bindAllEventListeners: btnStart, btnNext, btnBackHome, backSingleResult, srHome, btnExitGame.
- **Usado por:** `main.js`.
- **Estado:** Necesario. Sin cambios.

---

## Player

### `player/stats.js`
- **Qué hace:** getStats, getUnlockedAchievements, trackEvent (game_start, answer_correct, answer_wrong, game_finish), XP, rachas, checkForNewAchievements.
- **Usado por:** `main.js`, `solo.js`, `ui.js`, `ui_stats_translated.js`.
- **Estado:** Necesario. Sin cambios.

### `player/experience.js`
- **Qué hace:** calculateLevel(totalXP), getLevelProgress(totalXP) para la barra de nivel.
- **Usado por:** `main.js`, `ui.js`, `stats.js`.
- **Estado:** Necesario. Sin cambios.

### `player/achievements.js`
- **Qué hace:** ACHIEVEMENT_ICONS, ACHIEVEMENTS_LIST con condiciones (rachas, partidas perfectas, días seguidos, etc.).
- **Usado por:** `main.js`, `stats.js`, `ui.js`, `ui_stats_translated.js`.
- **Estado:** Necesario. Sin cambios.

---

## Efectos

### `effects.js`
- **Qué hace:** addRippleEffect, animateElements, showConfetti, showLevelUpEffect, addAnswerEffect, addTooltip, playSound, initVisualEffects (tema light, animaciones, tooltips, sonido en clicks).
- **Usado por:** `main.js`, `solo.js`.
- **Cambios aplicados:**
  - Eliminada `preloadBackgrounds()` (nunca se llamaba).
  - Eliminados `enhanceHoverEffects()` y su llamada (hover ya desactivado en la app).
  - Eliminada `showLoadingAnimation()` (no se usaba en ningún sitio).

---

## Resumen de cambios realizados

| Acción | Archivo / detalle |
|--------|--------------------|
| Eliminado | `core/utils.js` (nadie lo importaba) |
| Eliminado | `core/debounce.js` (debounce/throttle/cacheAsync no usados) |
| Script quitado de index.html | `debounce.js` |
| Limpieza | `solo.js`: bloque `if (false)` del HUD urgent |
| Limpieza | `ui_stats_translated.js`: quitar VS (vsGamesWon / vsGames) |
| Limpieza | `effects.js`: preloadBackgrounds, enhanceHoverEffects, showLoadingAnimation |

Si querés, el siguiente paso puede ser limpiar claves de traducción no usadas en `i18n.js` o revisar métodos de `storage.js` que no se usan.
