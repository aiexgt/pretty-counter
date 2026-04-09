/**
 * Pretty Counter App
 * Logic for Dynamic Counter, Theming, and History Persistence
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements Reference
    const counterDisplay = document.getElementById('counter-value');
    
    // Main Action Buttons
    const btnSubtract = document.getElementById('btn-subtract');
    const btnAdd = document.getElementById('btn-add');
    const btnReset = document.getElementById('btn-reset');
    
    // Settings Settings
    const stepInput = document.getElementById('step-input');
    const initialInput = document.getElementById('initial-input');
    const btnSetInitial = document.getElementById('btn-set-initial');
    
    // History Panel
    const historyList = document.getElementById('history-list');
    const btnClearHistory = document.getElementById('btn-clear-history');
    
    // Theme Switch
    const themeCheckbox = document.getElementById('checkbox');

    // PiP Elements
    const btnPip = document.getElementById('btn-pip');
    const appContainer = document.querySelector('.app-container');
    let pipWindow = null;

    // 2. Application State
    const defaultState = {
        counter: 0,
        history: [],
        theme: 'minimalist' // Puede ser 'minimalist' o 'coquette'
    };

    let state = { ...defaultState };

    // 3. Initialization Function
    function init() {
        loadState();
        applyTheme(state.theme);
        updateDisplay(false); // Sin animar la carga inicial
        renderHistory();
        
        // Sincronizar el input inicial con el estado al cargar
        initialInput.value = state.counter;

        // Validar soporte Document PiP
        if ('documentPictureInPicture' in window) {
            btnPip.style.display = 'inline-flex';
        }
    }

    // 4. LocalStorage Management
    function saveState() {
        try {
            localStorage.setItem('prettyCounterState', JSON.stringify(state));
        } catch (e) {
            console.error("Error al guardar en localStorage", e);
        }
    }

    function loadState() {
        try {
            const savedState = localStorage.getItem('prettyCounterState');
            if (savedState) {
                state = JSON.parse(savedState);
                if (!Array.isArray(state.history)) {
                    state.history = [];
                }
            }
        } catch (e) {
            console.error("Error al cargar estado. Usando valores por defecto.", e);
            state = { ...defaultState };
        }
    }

    // 5. Core Logic Functions
    function getStep() {
        const val = parseInt(stepInput.value, 10);
        // Si el valor no es un número o es menor a 1, devolver 1 como comodín preventivo
        return isNaN(val) || val < 1 ? 1 : val;
    }

    function handleCounterChange(isAdd) {
        const step = getStep();
        const previousValue = state.counter;
        
        if (isAdd) {
            state.counter += step;
        } else {
            state.counter -= step;
        }
        
        updateDisplay(true);
        addToHistory(isAdd ? 'add' : 'subtract', previousValue, state.counter);
        saveState();
    }

    function resetCounter() {
        const previousValue = state.counter;
        if (previousValue !== 0) {
            state.counter = 0;
            updateDisplay(true);
            addToHistory('reset', previousValue, state.counter);
            saveState();
            
            // También restablecemos el input del valor inicial
            initialInput.value = 0;
        }
    }

    function setInitialValue() {
        const val = parseInt(initialInput.value, 10);
        // Si borraron el input o hay algo raro, se toma como 0
        const newValue = isNaN(val) ? 0 : val;
        const previousValue = state.counter;
        
        if (previousValue !== newValue) {
            state.counter = newValue;
            updateDisplay(true);
            addToHistory('set_initial', previousValue, state.counter);
            saveState();
        }
        
        // Volvemos a colocar el valor en input para reflejar el valor por defecto si estaba vacío
        initialInput.value = newValue;
    }

    function addToHistory(actionType, previousVal, newVal) {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        let label = '';
        let typeClass = '';
        const step = Math.abs(newVal - previousVal);
        
        switch (actionType) {
            case 'add':
                label = `+${step}`;
                typeClass = 'add';
                break;
            case 'subtract':
                label = `-${step}`;
                typeClass = 'subtract';
                break;
            case 'reset':
                label = 'Reinicio absoluto';
                typeClass = 'reset';
                break;
            case 'set_initial':
                label = `Nuevo inicial: ${newVal}`;
                typeClass = 'initial';
                break;
        }

        const historyEntry = {
            id: Date.now().toString(), // Helper para key unica si es necesario después
            label,
            type: typeClass,
            newValue: newVal,
            time: timeString
        };

        // Añadimos al inicio para ver las más recientes primero
        state.history.unshift(historyEntry);
        
        // Para no llenar la memoria en uso extremo, limitamos a 50 eventos
        if (state.history.length > 50) {
            state.history.length = 50; 
        }

        renderHistory();
    }

    // 6. UI Updates
    function updateDisplay(animate = false) {
        counterDisplay.textContent = state.counter;
        
        if (animate) {
            // Animación suave del cambio de número
            counterDisplay.style.transform = 'scale(1.1)';
            setTimeout(() => {
                counterDisplay.style.transform = 'scale(1)';
            }, 150);
        }
    }

    function renderHistory() {
        historyList.innerHTML = ''; // Limpiamos la lista

        if (state.history.length === 0) {
            const emptyLi = document.createElement('li');
            emptyLi.className = 'history-item';
            emptyLi.innerHTML = '<span class="empty-state">No hay movimientos recientes</span>';
            historyList.appendChild(emptyLi);
            return;
        }

        // Usamos DocumentFragment para mejor performance (Senior best practice)
        const fragment = document.createDocumentFragment();

        state.history.forEach(item => {
            const li = document.createElement('li');
            li.className = `history-item ${item.type}`;
            
            li.innerHTML = `
                <span class="history-action">${item.label}</span>
                <div style="display:flex; align-items:center; gap: 8px;">
                    <span class="history-time">${item.time}</span>
                    <span class="history-value">= ${item.newValue}</span>
                </div>
            `;
            fragment.appendChild(li);
        });

        historyList.appendChild(fragment);
    }

    function applyTheme(themeName) {
        if (themeName === 'coquette') {
            document.body.setAttribute('data-theme', 'coquette');
            if (pipWindow) pipWindow.document.body.setAttribute('data-theme', 'coquette');
            themeCheckbox.checked = true;
        } else {
            document.body.removeAttribute('data-theme');
            if (pipWindow) pipWindow.document.body.removeAttribute('data-theme');
            themeCheckbox.checked = false;
        }
        state.theme = themeName;
    }

    // 7. Event Listeners
    btnAdd.addEventListener('click', () => handleCounterChange(true));
    
    btnSubtract.addEventListener('click', () => handleCounterChange(false));
    
    btnReset.addEventListener('click', resetCounter);
    
    btnSetInitial.addEventListener('click', setInitialValue);
    
    btnClearHistory.addEventListener('click', () => {
        state.history = [];
        saveState();
        renderHistory();
    });

    themeCheckbox.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'coquette' : 'minimalist';
        applyTheme(newTheme);
        saveState();
    });

    // Handle input validation on blur or enter key
    stepInput.addEventListener('change', () => {
        const val = parseInt(stepInput.value, 10);
        if (isNaN(val) || val < 1) {
            stepInput.value = 1;
        }
    });

    // Permitir configurar inicial usando la tecla "Enter"
    initialInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            setInitialValue();
            initialInput.blur(); // Quitar focus para cerrar teclado movil
        }
    });

    // Toggle Picture-in-Picture logic
    if (btnPip) {
        btnPip.addEventListener('click', async () => {
            if (pipWindow) {
                pipWindow.close();
                return;
            }

            try {
                pipWindow = await window.documentPictureInPicture.requestWindow({
                    width: 480,
                    height: 650
                });

                // Copiar las hojas de estilo importantes al head de PiP
                [...document.styleSheets].forEach((styleSheet) => {
                    try {
                        let link;
                        if (styleSheet.href) {
                            link = document.createElement('link');
                            link.rel = 'stylesheet';
                            link.href = styleSheet.href;
                            pipWindow.document.head.appendChild(link);
                        }
                    } catch (e) {
                        console.warn(e);
                    }
                });

                // Sincronizar clases globales para estilos (Ej: font-family del body)
                pipWindow.document.body.style.display = 'flex';
                pipWindow.document.body.style.flexDirection = 'column';
                pipWindow.document.body.style.alignItems = 'center';
                pipWindow.document.body.style.justifyContent = 'center';
                pipWindow.document.body.style.backgroundColor = getComputedStyle(document.body).backgroundColor;

                // Sincronizar el tema actual
                if (document.body.hasAttribute('data-theme')) {
                    pipWindow.document.body.setAttribute('data-theme', 'coquette');
                }

                // Ocultar el botón temporalmente mientras estamos en modo PiP
                btnPip.style.display = 'none';

                // Mover contenedor y notificar
                pipWindow.document.body.appendChild(appContainer);

                // Escuchar el evento de cerrado natural
                pipWindow.addEventListener('pagehide', () => {
                    document.body.appendChild(appContainer);
                    btnPip.style.display = 'inline-flex';
                    pipWindow = null;
                });
            } catch (err) {
                console.error("Fallo al iniciar Document PiP", err);
                alert("Tu navegador no soporta o bloqueó la ventana flotante.");
            }
        });
    }

    // 8. Bootstrap Application
    init();
});
