/**
 * Logo Interactions and Easter Eggs
 * Mejora la experiencia del usuario con el logo
 */

(function() {
    'use strict';
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLogoInteractions);
    } else {
        initLogoInteractions();
    }
    
    function initLogoInteractions() {
        // Logo en el header
        const headerLogo = document.querySelector('.app-logo');
        if (headerLogo) {
            // Easter egg: Triple click para efecto arcoíris
            let clickCount = 0;
            let clickTimer = null;
            
            headerLogo.addEventListener('click', function(e) {
                clickCount++;
                
                if (clickCount === 3) {
                    this.classList.add('rainbow');
                    setTimeout(() => {
                        this.classList.remove('rainbow');
                    }, 3000);
                    clickCount = 0;
                    
                    // Mostrar mensaje divertido
                    showEasterEggMessage();
                }
                
                clearTimeout(clickTimer);
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 500);
            });
            
            // Efecto de hover mejorado
            headerLogo.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.1) rotate(5deg)';
            });
            
            headerLogo.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1) rotate(0deg)';
            });
        }
        
        // Mejorar la pantalla de carga
        const splashLogo = document.querySelector('.logo-splash');
        if (splashLogo) {
            // Efecto simple de click en el splash
            splashLogo.addEventListener('click', function() {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 200);
            });
        }
        
        // Ocultar splash screen después de cargar
        window.addEventListener('load', function() {
            setTimeout(() => {
                const loader = document.getElementById('initial-loader');
                const container = document.querySelector('.container');
                
                if (loader && container) {
                    loader.style.opacity = '0';
                    container.style.opacity = '1';
                    container.style.animation = 'fadeInUp 0.5s ease-out';
                    
                    setTimeout(() => {
                        loader.style.display = 'none';
                    }, 500);
                }
            }, 1500); // Mostrar splash por al menos 1.5 segundos
        });
        
        // Añadir sonido al hacer hover (si los sonidos están activados)
        // COMENTADO - No reproducir sonidos en el logo
        /*
        const addHoverSound = () => {
            const logos = document.querySelectorAll('.app-logo, .logo-splash');
            logos.forEach(logo => {
                logo.addEventListener('mouseenter', () => {
                    const soundsEnabled = localStorage.getItem('optSounds') !== 'false';
                    if (soundsEnabled && window.AudioContext) {
                        playHoverSound();
                    }
                });
            });
        };
        
        // Función para reproducir sonido de hover
        const playHoverSound = () => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.1;
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.05);
            } catch (e) {
                // Silenciar errores de audio
            }
        };
        */
        
        // Función para mostrar mensaje de easter egg
        const showEasterEggMessage = () => {
            const messages = [
                '🎉 ¡Encontraste el modo arcoíris!',
                '🌈 ¡Quizlo! te saluda!',
                '✨ ¡Eres increíble!',
                '🎮 ¡Modo fiesta activado!',
                '🦄 ¡Unicornios por todas partes!'
            ];
            
            const message = messages[Math.floor(Math.random() * messages.length)];
            
            // Crear elemento de notificación
            const notification = document.createElement('div');
            notification.className = 'easter-egg-notification';
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #8b5cf6, #22d3ee);
                color: white;
                padding: 12px 24px;
                border-radius: 999px;
                font-weight: 600;
                box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
                z-index: 10001;
                animation: slideDown 0.5s ease-out;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideUp 0.5s ease-out';
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }, 3000);
        };
        
        // Añadir estilos de animación si no existen
        if (!document.querySelector('#logo-interactions-styles')) {
            const style = document.createElement('style');
            style.id = 'logo-interactions-styles';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        transform: translateX(-50%) translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideUp {
                    from {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(-50%) translateY(-100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Inicializar sonidos después de un delay
        // COMENTADO - Ya no se usan sonidos en el logo
        // setTimeout(addHoverSound, 1000);
        
        // Log para confirmar que se cargó
        console.log('✨ Logo interactions initialized!');
    }
})();
