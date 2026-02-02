// Estado temporal (no guardado)
let tempData = {
    monedas: {},
    billetes: {},
    yape: 0
};

// Estado de inicio (para el display de cambios)
let initialState = {
    monedas: {},
    billetes: {}
};

// Estado guardado - por denominación
let savedData = {
    monedasByValue: {},
    billetesByValue: {},
    monedas: 0,
    billetes: 0,
    yape: 0,
    total: 0
};

// Gráfico
let pieChart = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initCategorySwitch();
    initMonedas();
    initBilletes();
    initYape();
    initSaveButton();
    initChart();
    loadFromLocalStorage();
});

// Switch de categorías
function initCategorySwitch() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    const bubble = document.querySelector('.bubble-indicator');
    const contents = document.querySelectorAll('.category-content');
    
    categoryBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            categoryBtns.forEach(b => b.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            
            const btnWidth = this.offsetWidth;
            const gap = 5;
            bubble.style.left = `${5 + (index * (btnWidth + gap))}px`;
            
            const category = this.getAttribute('data-category');
            document.getElementById(category).classList.add('active');
        });
    });
}

// Inicializar Monedas
function initMonedas() {
    const monedasContainer = document.getElementById('monedas');
    const items = monedasContainer.querySelectorAll('.item-compact');
    
    items.forEach(item => {
        const value = parseFloat(item.getAttribute('data-value'));
        const btnPlus = item.querySelector('.plus');
        const btnMinus = item.querySelector('.minus');
        const changeDisplay = item.querySelector('.item-change-display');
        const savedAmountSpan = item.querySelector('.item-saved-amount');
        
        // Inicializar con el valor guardado
        const savedAmount = savedData.monedasByValue[value] || 0;
        const savedCount = Math.round(savedAmount / value);
        
        tempData.monedas[value] = 0;
        initialState.monedas[value] = savedCount;
        
        // Cargar monto guardado
        savedAmountSpan.textContent = `S/ ${savedAmount.toFixed(2)}`;
        
        btnPlus.addEventListener('click', () => {
            tempData.monedas[value]++;
            const currentCount = initialState.monedas[value] + tempData.monedas[value];
            updateChangeDisplay(changeDisplay, value, initialState.monedas[value], currentCount);
        });
        
        btnMinus.addEventListener('click', () => {
            const currentCount = initialState.monedas[value] + tempData.monedas[value];
            // Permitir restar solo si el total actual es mayor a 0
            if (currentCount > 0) {
                tempData.monedas[value]--;
                const newCurrentCount = initialState.monedas[value] + tempData.monedas[value];
                updateChangeDisplay(changeDisplay, value, initialState.monedas[value], newCurrentCount);
            }
        });
    });
}

// Inicializar Billetes
function initBilletes() {
    const billetesContainer = document.getElementById('billetes');
    const items = billetesContainer.querySelectorAll('.item-compact');
    
    items.forEach(item => {
        const value = parseFloat(item.getAttribute('data-value'));
        const btnPlus = item.querySelector('.plus');
        const btnMinus = item.querySelector('.minus');
        const changeDisplay = item.querySelector('.item-change-display');
        const savedAmountSpan = item.querySelector('.item-saved-amount');
        
        // Inicializar con el valor guardado
        const savedAmount = savedData.billetesByValue[value] || 0;
        const savedCount = Math.round(savedAmount / value);
        
        tempData.billetes[value] = 0;
        initialState.billetes[value] = savedCount;
        
        // Cargar monto guardado
        savedAmountSpan.textContent = `S/ ${savedAmount.toFixed(2)}`;
        
        btnPlus.addEventListener('click', () => {
            tempData.billetes[value]++;
            const currentCount = initialState.billetes[value] + tempData.billetes[value];
            updateChangeDisplay(changeDisplay, value, initialState.billetes[value], currentCount);
        });
        
        btnMinus.addEventListener('click', () => {
            const currentCount = initialState.billetes[value] + tempData.billetes[value];
            // Permitir restar solo si el total actual es mayor a 0
            if (currentCount > 0) {
                tempData.billetes[value]--;
                const newCurrentCount = initialState.billetes[value] + tempData.billetes[value];
                updateChangeDisplay(changeDisplay, value, initialState.billetes[value], newCurrentCount);
            }
        });
    });
}

// NUEVA: Actualizar display de cambios (manteniendo el inicial fijo)
function updateChangeDisplay(displayElement, unitValue, initialCount, currentCount) {
    const initialTotal = initialCount * unitValue;
    const currentTotal = currentCount * unitValue;
    
    if (currentCount === 0 && initialCount === 0) {
        displayElement.textContent = '';
        displayElement.style.background = 'transparent';
        return;
    }
    
    displayElement.textContent = `S/ ${initialTotal.toFixed(2)} → S/ ${currentTotal.toFixed(2)}`;
    
    if (currentTotal > initialTotal) {
        displayElement.style.background = '#10b981'; // Verde
        displayElement.style.color = 'white';
    } else if (currentTotal < initialTotal) {
        displayElement.style.background = '#ef4444'; // Rojo
        displayElement.style.color = 'white';
    } else {
        displayElement.style.background = '#6b7280'; // Gris
        displayElement.style.color = 'white';
    }
    
    // Animación
    displayElement.style.transform = 'scale(1.05)';
    setTimeout(() => {
        displayElement.style.transform = 'scale(1)';
    }, 200);
}

// Inicializar Yape
function initYape() {
    const yapeBtns = document.querySelectorAll('.yape-btn');
    const yapeTempTotal = document.getElementById('yapeTempTotal');
    
    yapeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const value = parseFloat(this.getAttribute('data-value'));
            tempData.yape += value;
            yapeTempTotal.textContent = tempData.yape.toFixed(2);
        });
    });
}

// Botón Guardar
function initSaveButton() {
    const btnSave = document.getElementById('btnSave');
    
    btnSave.addEventListener('click', function() {
        // Calcular el cambio total (positivo o negativo)
        let totalChange = 0;
        
        for (let value in tempData.monedas) {
            totalChange += tempData.monedas[value] * parseFloat(value);
        }
        
        for (let value in tempData.billetes) {
            totalChange += tempData.billetes[value] * parseFloat(value);
        }
        
        totalChange += tempData.yape;
        
        // Verificar si hay cambios
        const hasChanges = Object.values(tempData.monedas).some(v => v !== 0) || 
                          Object.values(tempData.billetes).some(v => v !== 0) || 
                          tempData.yape !== 0;
        
        if (hasChanges) {
            saveData();
            
            if (Math.abs(totalChange) > 0) {
                showCelebration(totalChange);
            }
            
            resetTempData();
            
            this.textContent = '✅ Guardado!';
            setTimeout(() => {
                this.textContent = '💾 Guardar Cambios';
            }, 1500);
        }
    });
}

// Calcular total temporal
function calculateTotalTemp() {
    let total = 0;
    
    // IMPORTANTE: Sumar los cambios (pueden ser positivos o negativos)
    for (let value in tempData.monedas) {
        total += tempData.monedas[value] * parseFloat(value);
    }
    
    for (let value in tempData.billetes) {
        total += tempData.billetes[value] * parseFloat(value);
    }
    
    total += tempData.yape;
    
    // Retornar el valor absoluto para la celebración
    return Math.abs(total);
}

// Guardar datos
function saveData() {
    // Actualizar monedas por denominación
    for (let value in tempData.monedas) {
        const changeAmount = tempData.monedas[value] * parseFloat(value);
        if (changeAmount !== 0) {
            if (!savedData.monedasByValue[value]) {
                savedData.monedasByValue[value] = 0;
            }
            savedData.monedasByValue[value] += changeAmount;
            
            // Si el valor queda negativo o en 0, eliminarlo
            if (savedData.monedasByValue[value] <= 0) {
                delete savedData.monedasByValue[value];
            }
        }
    }
    
    // Actualizar billetes por denominación
    for (let value in tempData.billetes) {
        const changeAmount = tempData.billetes[value] * parseFloat(value);
        if (changeAmount !== 0) {
            if (!savedData.billetesByValue[value]) {
                savedData.billetesByValue[value] = 0;
            }
            savedData.billetesByValue[value] += changeAmount;
            
            // Si el valor queda negativo o en 0, eliminarlo
            if (savedData.billetesByValue[value] <= 0) {
                delete savedData.billetesByValue[value];
            }
        }
    }
    
    // Calcular totales generales
    savedData.monedas = Object.values(savedData.monedasByValue).reduce((a, b) => a + b, 0);
    savedData.billetes = Object.values(savedData.billetesByValue).reduce((a, b) => a + b, 0);
    savedData.yape += tempData.yape;
    savedData.total = savedData.monedas + savedData.billetes + savedData.yape;
    
    updateSavedAmountsDisplay();
    updateTotalDisplay();
    updateChart();
    saveToLocalStorage();
}

// Actualizar displays de montos guardados
function updateSavedAmountsDisplay() {
    document.querySelectorAll('#monedas .item-compact').forEach(item => {
        const value = parseFloat(item.getAttribute('data-value'));
        const savedAmountSpan = item.querySelector('.item-saved-amount');
        const amount = savedData.monedasByValue[value] || 0;
        savedAmountSpan.textContent = `S/ ${amount.toFixed(2)}`;
        
        // Actualizar el initialState con el nuevo valor guardado
        const savedCount = Math.round(amount / value);
        initialState.monedas[value] = savedCount;
    });
    
    document.querySelectorAll('#billetes .item-compact').forEach(item => {
        const value = parseFloat(item.getAttribute('data-value'));
        const savedAmountSpan = item.querySelector('.item-saved-amount');
        const amount = savedData.billetesByValue[value] || 0;
        savedAmountSpan.textContent = `S/ ${amount.toFixed(2)}`;
        
        // Actualizar el initialState con el nuevo valor guardado
        const savedCount = Math.round(amount / value);
        initialState.billetes[value] = savedCount;
    });
}

// Reiniciar datos temporales
function resetTempData() {
    // Reiniciar contadores temporales a 0
    for (let value in tempData.monedas) {
        tempData.monedas[value] = 0;
    }
    for (let value in tempData.billetes) {
        tempData.billetes[value] = 0;
    }
    tempData.yape = 0;
    
    // CRÍTICO: Actualizar initialState con los nuevos valores guardados
    for (let value in savedData.monedasByValue) {
        const amount = savedData.monedasByValue[value] || 0;
        const count = Math.round(amount / parseFloat(value));
        initialState.monedas[value] = count;
    }
    
    for (let value in savedData.billetesByValue) {
        const amount = savedData.billetesByValue[value] || 0;
        const count = Math.round(amount / parseFloat(value));
        initialState.billetes[value] = count;
    }
    
    // Reiniciar displays de cambios
    document.querySelectorAll('.item-change-display').forEach(display => {
        display.textContent = '';
        display.style.background = 'transparent';
    });
    
    document.getElementById('yapeTempTotal').textContent = '0.00';
}

// Celebración
function showCelebration(amount) {
    const overlay = document.getElementById('celebrationOverlay');
    const message = document.getElementById('celebrationMessage');
    
    const absAmount = Math.abs(amount);
    
    // Mensaje según si se agregó o restó
    if (amount > 0) {
        message.textContent = `¡Agregaste S/ ${absAmount.toFixed(2)}!`;
    } else {
        message.textContent = `¡Restaste S/ ${absAmount.toFixed(2)}!`;
    }
    
    overlay.classList.add('active');
    
    launchConfetti();
    createFloatingMoney(Math.min(Math.floor(absAmount / 5), 50));
    
    setTimeout(() => {
        overlay.classList.remove('active');
        document.getElementById('moneyAnimation').innerHTML = '';
    }, 3000);
}

// Confeti
function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confetti = [];
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    
    for (let i = 0; i < 150; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 8 + 5,
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 2 - 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 5 - 2.5
        });
    }
    
    function animateConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confetti.forEach((piece, index) => {
            ctx.save();
            ctx.translate(piece.x, piece.y);
            ctx.rotate((piece.rotation * Math.PI) / 180);
            ctx.fillStyle = piece.color;
            ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
            ctx.restore();
            
            piece.y += piece.speedY;
            piece.x += piece.speedX;
            piece.rotation += piece.rotationSpeed;
            
            if (piece.y > canvas.height) {
                confetti.splice(index, 1);
            }
        });
        
        if (confetti.length > 0) {
            requestAnimationFrame(animateConfetti);
        }
    }
    
    animateConfetti();
}

// Billetes flotantes
function createFloatingMoney(count) {
    const container = document.getElementById('moneyAnimation');
    const moneySymbols = ['💵', '💴', '💶', '💷', '💸'];
    
    for (let i = 0; i < count; i++) {
        const bill = document.createElement('div');
        bill.className = 'money-bill';
        bill.textContent = moneySymbols[Math.floor(Math.random() * moneySymbols.length)];
        bill.style.left = `${Math.random() * 100}%`;
        bill.style.animationDelay = `${Math.random() * 0.5}s`;
        bill.style.fontSize = `${Math.random() * 30 + 30}px`;
        container.appendChild(bill);
    }
}

// Actualizar total
function updateTotalDisplay() {
    const totalAmount = document.getElementById('totalAmount');
    totalAmount.textContent = savedData.total.toFixed(2);
    
    totalAmount.style.transform = 'scale(1.2)';
    setTimeout(() => {
        totalAmount.style.transform = 'scale(1)';
    }, 300);
}

// Inicializar gráfico
function initChart() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Monedas', 'Billetes', 'Yape'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#FFD700',
                    '#4CAF50',
                    '#9C27B0'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': S/ ' + context.parsed.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Actualizar gráfico
function updateChart() {
    if (pieChart) {
        pieChart.data.datasets[0].data = [
            savedData.monedas,
            savedData.billetes,
            savedData.yape
        ];
        pieChart.update();
    }
}

// LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('contadorDinero', JSON.stringify(savedData));
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('contadorDinero');
    if (stored) {
        savedData = JSON.parse(stored);
        
        if (!savedData.monedasByValue) savedData.monedasByValue = {};
        if (!savedData.billetesByValue) savedData.billetesByValue = {};
        
        // CRÍTICO: Actualizar initialState con los valores guardados
        for (let value in savedData.monedasByValue) {
            const amount = savedData.monedasByValue[value];
            const count = Math.round(amount / parseFloat(value));
            initialState.monedas[value] = count;
        }
        
        for (let value in savedData.billetesByValue) {
            const amount = savedData.billetesByValue[value];
            const count = Math.round(amount / parseFloat(value));
            initialState.billetes[value] = count;
        }
        
        updateSavedAmountsDisplay();
        updateTotalDisplay();
        updateChart();
    }
}

// Función para resetear todo
function resetAllData() {
    if (confirm('⚠️ ¿Estás seguro? Esto borrará TODO el dinero guardado.')) {
        localStorage.removeItem('contadorDinero');
        location.reload();
    }
}
