# Resumen de Handicaps - Arkanoid (Boss del Reino del Cine)

## Descripción del Juego
Arkanoid es un juego estilo Breakout donde debes destruir bloques protectores y golpear al jefe (Demonio del Cine) con una pelota. El objetivo es reducir la vida del jefe a 0 antes de perder todas tus vidas.

---

## Sistema de Handicaps (4 Niveles)

El handicap se calcula según el desempeño en las 10 preguntas previas al boss.

---

### 🟢 Nivel Perfecto (10 correctas)

**Ventajas del Jugador:**
- **Vidas del Jugador:** 5 ❤️
- **Vidas del Boss (HP):** 3 💀
- **Velocidad del Paddle:** 8.0 píxeles/frame (normal)
- **Velocidad del Boss:** 3.0 píxeles/frame (normal)
- **Filas de Bloques:** 3 filas base (sin extras)

**Características:**
- Máxima ventaja: 5 vidas vs 3 del jefe
- Velocidades normales para ambos
- Mínima cantidad de bloques protectores (3 filas)
- **Mensaje:** "¡Perfecto! Tienes la ventaja máxima: 5 vidas vs 3 del jefe"

**Estrategia:**
- Con 5 vidas puedes permitirte algunos errores
- El jefe se mueve a velocidad normal, fácil de golpear
- Pocos bloques que destruir antes de llegar al jefe

---

### 🟡 Nivel Bueno (8-9 correctas)

**Ventajas del Jugador:**
- **Vidas del Jugador:** 4 ❤️
- **Vidas del Boss (HP):** 3 💀
- **Velocidad del Paddle:** 8.0 píxeles/frame (normal)
- **Velocidad del Boss:** 3.6 píxeles/frame (1.2x más rápido)
- **Filas de Bloques:** 4 filas (3 base + 1 extra)

**Características:**
- Buena ventaja: 4 vidas vs 3 del jefe
- El jefe se mueve 20% más rápido
- Una fila extra de bloques protectores
- **Mensaje:** "Muy bien: 4 vidas, jefe más rápido y 1 fila extra de bloques"

**Estrategia:**
- Aún tienes buena ventaja en vidas
- El jefe es más difícil de golpear por su velocidad
- Más bloques que destruir antes de llegar al jefe

---

### 🟠 Nivel Regular (4-7 correctas)

**Ventajas del Jugador:**
- **Vidas del Jugador:** 2 ❤️
- **Vidas del Boss (HP):** 4 💀
- **Velocidad del Paddle:** 8.0 píxeles/frame (normal)
- **Velocidad del Boss:** 4.2 píxeles/frame (1.4x más rápido)
- **Filas de Bloques:** 5 filas (3 base + 2 extras)

**Características:**
- Desventaja: 2 vidas vs 4 del jefe
- El jefe se mueve 40% más rápido
- Dos filas extra de bloques protectores
- **Mensaje:** "Regular: 2 vidas, jefe rápido y 2 filas extra de bloques"

**Estrategia:**
- Pocas vidas, debes ser más cuidadoso
- El jefe es significativamente más rápido
- Muchos bloques que destruir antes de llegar al jefe
- Necesitas precisión y paciencia

---

### 🔴 Nivel Difícil (0-3 correctas)

**Ventajas del Jugador:**
- **Vidas del Jugador:** 1 ❤️
- **Vidas del Boss (HP):** 5 💀
- **Velocidad del Paddle:** 8.0 píxeles/frame (normal)
- **Velocidad del Boss:** 4.5 píxeles/frame (1.5x más rápido)
- **Filas de Bloques:** 6 filas (3 base + 3 extras)

**Características:**
- Máxima desventaja: 1 vida vs 5 del jefe
- El jefe se mueve 50% más rápido
- Tres filas extra de bloques protectores
- **Mensaje:** "Difícil: 1 vida, jefe muy rápido y 3 filas extra de bloques"

**Estrategia:**
- Solo 1 vida: cualquier error te elimina
- El jefe es extremadamente rápido
- Máxima cantidad de bloques protectores
- Requiere máxima precisión y concentración

---

## Mecánicas Específicas del Arkanoid

### Velocidades del Juego

**Velocidad del Paddle:**
- Base: 8.0 píxeles por frame
- Multiplicador: `handicap.playerSpeed` (siempre 1.0 en todos los niveles)
- **Fórmula:** `8 * (handicap.playerSpeed || 1)`

**Velocidad del Boss:**
- Base: 3.0 píxeles por frame
- Multiplicador: `handicap.bossSpeed` (varía según nivel)
- **Fórmula:** `3 * (handicap.bossSpeed || 1)`
- El boss se mueve horizontalmente de lado a lado

**Velocidad de la Pelota:**
- Velocidad inicial: 4 píxeles/frame en X e Y
- Se ajusta dinámicamente según dónde golpea el paddle
- Ángulo máximo: ±8 píxeles/frame en X

### Sistema de Bloques

**Configuración Base:**
- **Filas Base:** 3 filas
- **Filas Totales:** `3 + (handicap.extraRows || 0)`
- **Columnas:** Mínimo 12, calculadas según ancho del canvas
- **Tamaño de Bloques:** Responsivo, mínimo 30px de ancho
- **Espaciado:** Gutter mínimo de 2px entre bloques
- **Colores:** 5 colores rotativos (rojo, naranja, azul, morado, verde)

**Distribución de Bloques:**
- Los bloques se generan en una cuadrícula
- Cada fila tiene el mismo número de columnas
- Los bloques están más juntos en niveles difíciles (más columnas)

### Sistema de Vidas y HP

**Vidas del Jugador:**
- Se pierde una vida cuando la pelota cae por debajo del paddle
- La pelota se resetea pegada al paddle después de perder una vida
- El juego termina cuando las vidas llegan a 0

**HP del Boss:**
- El boss tiene HP igual a `handicap.bossLives`
- Cada golpe de la pelota reduce 1 HP
- Hay un cooldown de 30 frames (~0.5 segundos) entre golpes
- El juego termina cuando el HP del boss llega a 0

### Detección de Colisiones

**Colisión con el Boss:**
- Solo cuenta si la pelota viene desde abajo
- Hitbox expandido con padding de 2px para mejor detección
- Cooldown de 30 frames después de cada golpe
- La pelota rebota hacia arriba al golpear al boss

**Colisión con Bloques:**
- Detección mejorada con swept collision (detección de trayectoria)
- Solo se destruye un bloque por frame (el más cercano)
- Rebote realista según el lado golpeado
- La pelota rebota en dirección opuesta

**Colisión con el Paddle:**
- Solo cuenta si la pelota viene desde arriba
- El ángulo de rebote depende de dónde golpea el paddle
- Ángulo máximo: ±8 píxeles/frame en X

---

## Comparación de Dificultades

| Nivel | Vidas Jugador | HP Boss | Vel. Boss | Filas Bloques | Dificultad |
|-------|---------------|---------|-----------|---------------|------------|
| Perfecto | 5 ❤️ | 3 💀 | 1.0x | 3 | ⭐ Muy Fácil |
| Bueno | 4 ❤️ | 3 💀 | 1.2x | 4 | ⭐⭐ Fácil |
| Regular | 2 ❤️ | 4 💀 | 1.4x | 5 | ⭐⭐⭐ Medio |
| Difícil | 1 ❤️ | 5 💀 | 1.5x | 6 | ⭐⭐⭐⭐ Difícil |

---

## Consejos por Nivel

### Nivel Perfecto
- ✅ Puedes permitirte errores, tienes 5 vidas
- ✅ Enfócate en destruir bloques rápidamente
- ✅ El jefe es lento, fácil de golpear

### Nivel Bueno
- ⚠️ Ten cuidado, solo 4 vidas
- ⚠️ El jefe se mueve más rápido, ajusta tu timing
- ⚠️ Más bloques que destruir

### Nivel Regular
- 🔴 Solo 2 vidas, sé muy cuidadoso
- 🔴 El jefe es rápido, requiere precisión
- 🔴 Muchos bloques, prioriza abrir caminos al jefe

### Nivel Difícil
- ⛔ Solo 1 vida, cualquier error es fatal
- ⛔ El jefe es extremadamente rápido
- ⛔ Máxima cantidad de bloques
- ⛔ Requiere máxima concentración y precisión

---

## Notas Técnicas

- **Cooldown del Boss:** 30 frames (~0.5 segundos a 60fps)
- **Tamaño del Paddle:** 100px de ancho, 10px de alto
- **Tamaño de la Pelota:** Radio de 8px
- **Tamaño del Boss:** Responsivo, mínimo 100px ancho x 120px alto
- **Posición del Boss:** Parte superior del canvas, se mueve horizontalmente
- **Posición del Paddle:** Parte inferior del canvas, controlado por el jugador

---

## Resumen Ejecutivo

El Arkanoid es un juego de precisión donde el handicap afecta principalmente:
1. **Número de vidas** (5 → 4 → 2 → 1)
2. **HP del boss** (3 → 3 → 4 → 5)
3. **Velocidad del boss** (1.0x → 1.2x → 1.4x → 1.5x)
4. **Cantidad de bloques protectores** (3 → 4 → 5 → 6 filas)

A peor desempeño en las preguntas, más difícil se vuelve el boss, con menos vidas, más HP del jefe, mayor velocidad y más bloques que destruir.

