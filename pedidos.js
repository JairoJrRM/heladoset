// ===== LIMPIEZA DE DATOS ANTIGUOS =====
(function() {
    const version = localStorage.getItem('pedidosVersion');
    if (version !== '4.0') {
        console.log('🧹 Detectada versión antigua, limpiando datos...');
        localStorage.removeItem('pedidosHeladosActivos');
        localStorage.removeItem('pedidosHeladosHistorial');
        localStorage.removeItem('pedidoActualId');
        localStorage.setItem('pedidosVersion', '4.0');
    }
})();

// Lista completa de sabores
const SABORES = [
    'Aguaje', 'Aguaymanto', 'Arándano', 'Café', 'Chia con Maracuyá', 'Chilcano',
    'Chocochips', 'Chocolate', 'Chocomani', 'Coco', 'E.T.', 'Fresa', 
    'Guanábana', 'Higo', 'Limón', 'Lúcuma', 'Lúcuma Chip', 'Maca',
    'Mango', 'Maracuyá', 'Menta Chip', 'Mora', 'Noni con Piña', 'Palta',
    'Piña', 'Pisco Sour', 'Plátano', 'Quinua con Maracuyá', 'Ron con Pasas',
    'Tamarindo', 'Tuna', 'Uva', 'Vainilla'
].sort();

// Tipos de envases
const ENVASES = ['Vaso', 'Vaso Galleta', 'Cono', 'Conazo', 'Sombrero'];

// Función para calcular precio según bolas y envase
function calcularPrecio(bolas, envase) {
    if (envase === 'Conazo' || envase === 'Sombrero') {
        if (bolas === 1) return 6.00;
        if (bolas === 2) return 8.00;
        if (bolas >= 3) return 12.00;
    }
    
    if (envase === 'Vaso' || envase === 'Vaso Galleta') {
        if (bolas === 1) return 4.00;
        if (bolas === 2) return 6.00;
        if (bolas >= 3) return 10.00;
    }
    
    if (envase === 'Cono') {
        if (bolas === 1) return 4.50;
        if (bolas === 2) return 7.00;
    }
    
    return 0;
}

// Validar si un envase está disponible para cierta cantidad de bolas
function envaseDisponible(bolas, envase) {
    if (bolas >= 3 && (envase === 'Cono' || envase === 'Vaso Galleta')) {
        return false;
    }
    return true;
}

// Estado de la aplicación
let pedidosActivos = [];
let historialPedidos = [];
let pedidoActualId = 1;

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación...');
    loadData();
    
    if (pedidosActivos.length === 0) {
        console.log('➕ Creando primer pedido...');
        nuevoPedido();
    }
    
    renderPedidosActivos();
    renderHistorial();
});

// Switch entre tabs
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'realizar') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('tab-realizar').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('tab-historial').classList.add('active');
        
        // Resetear fecha seleccionada a HOY cuando se abre el historial
        window.fechaSeleccionada = formatearFecha(new Date());
        renderHistorial();
    }
}

// Crear nuevo pedido
function nuevoPedido() {
    const pedido = {
        id: pedidoActualId++,
        helados: [],
        total: 0,
        fecha: new Date().toLocaleString('es-PE')
    };
    
    pedidosActivos.push(pedido);
    saveData();
    renderPedidosActivos();
}

// ===== NUEVO SISTEMA DE SABORES Y BOLAS =====

// Agregar campo de sabor
function agregarSabor(pedidoId) {
    const form = document.querySelector(`#form-${pedidoId}`);
    if (!form) return;
    
    const saboresContainer = form.querySelector('.sabores-inputs-container');
    const cantidadActual = saboresContainer.querySelectorAll('.sabor-input-wrapper').length;
    
    if (cantidadActual >= 3) {
        mostrarAlertaEnPantallaGlobal('⚠️ Máximo 3 sabores');
        return;
    }
    
    const nuevoIndex = cantidadActual;
    
    const saborDiv = document.createElement('div');
    saborDiv.className = 'sabor-input-wrapper';
    saborDiv.innerHTML = `
        <input type="text" 
               class="sabor-input" 
               placeholder="Sabor ${nuevoIndex + 1}"
               data-sabor-index="${nuevoIndex}"
               oninput="filtrarSabores(${pedidoId}, ${nuevoIndex})"
               onfocus="mostrarSugerencias(${pedidoId}, ${nuevoIndex})"
               onblur="ocultarSugerencias(${pedidoId}, ${nuevoIndex})">
        <button class="btn-borrar-sabor" onclick="eliminarSabor(${pedidoId}, ${nuevoIndex})" type="button">🗑️</button>
        <div class="sugerencias-sabores" id="sugerencias-${pedidoId}-${nuevoIndex}"></div>
    `;
    saboresContainer.appendChild(saborDiv);
    
    const nuevasBolas = cantidadActual + 1;
    cambiarBolas(pedidoId, nuevasBolas);
    
    setTimeout(() => {
        const nuevoInput = saborDiv.querySelector('.sabor-input');
        if (nuevoInput) nuevoInput.focus();
    }, 50);
    
    actualizarMultiplicadores(pedidoId);
}

// Eliminar campo de sabor
function eliminarSabor(pedidoId, saborIndex) {
    const form = document.querySelector(`#form-${pedidoId}`);
    if (!form) return;
    
    const saboresContainer = form.querySelector('.sabores-inputs-container');
    const saboresWrappers = Array.from(saboresContainer.querySelectorAll('.sabor-input-wrapper'));
    
    if (saboresWrappers.length <= 1) {
        mostrarAlertaEnPantallaGlobal('⚠️ Debe haber al menos 1 sabor');
        return;
    }
    
    const wrapperAEliminar = saboresWrappers.find(w => {
        const input = w.querySelector('.sabor-input');
        return input && parseInt(input.dataset.saborIndex) === saborIndex;
    });
    
    if (wrapperAEliminar) {
        wrapperAEliminar.remove();
    }
    
    reindexarSabores(pedidoId);
    
    const nuevaCantidadSabores = saboresContainer.querySelectorAll('.sabor-input-wrapper').length;
    const bolasActuales = parseInt(form.dataset.bolas) || 1;
    
    if (bolasActuales === nuevaCantidadSabores + 1) {
        cambiarBolas(pedidoId, nuevaCantidadSabores);
    }
    
    actualizarMultiplicadores(pedidoId);
}

// Reindexar los campos de sabores después de eliminar uno
function reindexarSabores(pedidoId) {
    const form = document.querySelector(`#form-${pedidoId}`);
    if (!form) return;
    
    const saboresWrappers = form.querySelectorAll('.sabor-input-wrapper');
    saboresWrappers.forEach((wrapper, index) => {
        const input = wrapper.querySelector('.sabor-input');
        const btnBorrar = wrapper.querySelector('.btn-borrar-sabor');
        const sugerencias = wrapper.querySelector('.sugerencias-sabores');
        
        if (input) {
            input.dataset.saborIndex = index;
            input.placeholder = `Sabor ${index + 1}`;
            input.setAttribute('oninput', `filtrarSabores(${pedidoId}, ${index})`);
            input.setAttribute('onfocus', `mostrarSugerencias(${pedidoId}, ${index})`);
            input.setAttribute('onblur', `ocultarSugerencias(${pedidoId}, ${index})`);
        }
        
        if (btnBorrar) {
            btnBorrar.setAttribute('onclick', `eliminarSabor(${pedidoId}, ${index})`);
        }
        
        if (sugerencias) {
            sugerencias.id = `sugerencias-${pedidoId}-${index}`;
        }
    });
}

// Cambiar cantidad de bolas
function cambiarBolas(pedidoId, cantidad) {
    const form = document.querySelector(`#form-${pedidoId}`);
    if (!form) return;
    
    form.dataset.bolas = cantidad;
    
    form.querySelectorAll('.bola-sphere').forEach(btn => btn.classList.remove('selected'));
    const btnSeleccionado = form.querySelector(`[data-bola-value="${cantidad}"]`);
    if (btnSeleccionado) btnSeleccionado.classList.add('selected');
    
    actualizarEnvasesDisponibles(pedidoId, cantidad);
    actualizarMultiplicadores(pedidoId);
}

// Actualizar multiplicadores x2
function actualizarMultiplicadores(pedidoId) {
    const form = document.querySelector(`#form-${pedidoId}`);
    if (!form) return;
    
    const bolas = parseInt(form.dataset.bolas) || 1;
    const saboresWrappers = form.querySelectorAll('.sabor-input-wrapper');
    const cantidadSabores = saboresWrappers.length;
    
    form.querySelectorAll('.btn-multiplicador').forEach(btn => btn.remove());
    
    if (bolas > cantidadSabores) {
        saboresWrappers.forEach((wrapper, index) => {
            const btnMultiplicador = document.createElement('button');
            btnMultiplicador.className = 'btn-multiplicador';
            btnMultiplicador.type = 'button';
            btnMultiplicador.textContent = 'x2';
            btnMultiplicador.dataset.saborIndex = index;
            btnMultiplicador.onclick = () => toggleMultiplicador(pedidoId, index);
            
            const btnBorrar = wrapper.querySelector('.btn-borrar-sabor');
            wrapper.insertBefore(btnMultiplicador, btnBorrar);
        });
    }
}

// Toggle del multiplicador
function toggleMultiplicador(pedidoId, saborIndex) {
    const form = document.querySelector(`#form-${pedidoId}`);
    if (!form) return;
    
    const btnClickeado = form.querySelector(`.btn-multiplicador[data-sabor-index="${saborIndex}"]`);
    const todosLosBtns = form.querySelectorAll('.btn-multiplicador');
    
    if (btnClickeado.classList.contains('active')) {
        btnClickeado.classList.remove('active');
    } else {
        todosLosBtns.forEach(btn => btn.classList.remove('active'));
        btnClickeado.classList.add('active');
    }
}

// Actualizar envases disponibles según bolas
function actualizarEnvasesDisponibles(pedidoId, bolas) {
    const form = document.querySelector(`#form-${pedidoId}`);
    if (!form) return;
    
    form.querySelectorAll('.envase-btn-compact').forEach(btn => {
        const envase = btn.dataset.envase;
        if (envaseDisponible(bolas, envase)) {
            btn.classList.remove('disabled');
            btn.disabled = false;
        } else {
            btn.classList.add('disabled');
            btn.disabled = true;
            btn.classList.remove('selected');
        }
    });
}

// Cambiar envase
function cambiarEnvase(pedidoId, envase) {
    const form = document.querySelector(`#form-${pedidoId}`);
    if (!form) return;
    
    form.dataset.envase = envase;
    
    form.querySelectorAll('.envase-btn-compact').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    const btnSeleccionado = form.querySelector(`[data-envase="${envase}"]`);
    if (btnSeleccionado) {
        btnSeleccionado.classList.add('selected');
    }
}

// Guardar helado en el pedido
function guardarHelado(pedidoId) {
    const form = document.querySelector(`#form-${pedidoId}`);
    if (!form) return;
    
    const bolas = parseInt(form.dataset.bolas) || 1;
    let envase = form.dataset.envase;
    
    if (!envase) {
        envase = 'Vaso';
    }
    
    const saboresData = [];
    const inputs = form.querySelectorAll('.sabor-input');
    inputs.forEach((input, index) => {
        const sabor = input.value.trim();
        if (sabor) {
            const saborCapitalizado = sabor.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            
            const btnMultiplicador = form.querySelector(`.btn-multiplicador[data-sabor-index="${index}"]`);
            const esDoble = btnMultiplicador && btnMultiplicador.classList.contains('active');
            
            saboresData.push({
                sabor: saborCapitalizado,
                doble: esDoble
            });
        }
    });
    
    if (saboresData.length === 0) {
        mostrarAlertaEnPantalla(`⚠️ Debes ingresar al menos 1 sabor`, form);
        return;
    }
    
    const sabores = [];
    const cantidadSabores = saboresData.length;
    
    if (cantidadSabores === 1) {
        for (let i = 0; i < bolas; i++) {
            sabores.push(saboresData[0].sabor);
        }
    } else if (bolas === cantidadSabores) {
        saboresData.forEach(sd => sabores.push(sd.sabor));
    } else if (bolas > cantidadSabores) {
        const saborDoble = saboresData.find(sd => sd.doble);
        
        if (!saborDoble) {
            mostrarAlertaEnPantalla(`⚠️ Debes marcar qué sabor va x2`, form);
            return;
        }
        
        saboresData.forEach(sd => {
            if (sd.doble) {
                sabores.push(sd.sabor);
                sabores.push(sd.sabor);
            } else {
                sabores.push(sd.sabor);
            }
        });
    }
    
    const precio = calcularPrecio(bolas, envase);
    
    const helado = {
        id: Date.now(),
        bolas,
        sabores,
        envase,
        precio,
        completado: false,
        pagado: false
    };
    
    const pedido = pedidosActivos.find(p => p.id === pedidoId);
    if (pedido) {
        pedido.helados.push(helado);
        pedido.total += precio;
        
        saveData();
        renderPedidosActivos();
        
        mostrarAlertaEnPantallaGlobal('✅ Helado agregado');
    }
}

// ===== FUNCIONES DE BÚSQUEDA DE SABORES =====

function normalizarTexto(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function distanciaLevenshtein(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[len1][len2];
}

function calcularSimilitud(palabra1, palabra2) {
    const distancia = distanciaLevenshtein(palabra1, palabra2);
    const maxLen = Math.max(palabra1.length, palabra2.length);
    return 1 - (distancia / maxLen);
}

function buscarSaboresInteligente(busqueda) {
    const busquedaNormalizada = normalizarTexto(busqueda.trim());
    
    if (busquedaNormalizada.length === 0) {
        return SABORES;
    }

    const saboresConPuntuacion = SABORES.map(sabor => {
        const saborNormalizado = normalizarTexto(sabor);
        let puntuacion = 0;

        if (saborNormalizado.startsWith(busquedaNormalizada)) {
            puntuacion = 1000;
        } else if (saborNormalizado.includes(busquedaNormalizada)) {
            puntuacion = 500;
        } else {
            const palabrasBusqueda = busquedaNormalizada.split(' ');
            const palabrasSabor = saborNormalizado.split(' ');
            
            palabrasBusqueda.forEach(palabraBusqueda => {
                palabrasSabor.forEach(palabraSabor => {
                    if (palabraSabor.startsWith(palabraBusqueda)) {
                        puntuacion += 100;
                    } else {
                        const similitud = calcularSimilitud(palabraBusqueda, palabraSabor);
                        if (similitud > 0.6) {
                            puntuacion += similitud * 50;
                        }
                    }
                });
            });
        }

        return { sabor, puntuacion };
    });

    const saboresFiltrados = saboresConPuntuacion
        .filter(item => item.puntuacion > 0)
        .sort((a, b) => b.puntuacion - a.puntuacion)
        .map(item => item.sabor);

    if (saboresFiltrados.length === 0 && busquedaNormalizada.length >= 3) {
        return SABORES.filter(sabor => {
            const saborNorm = normalizarTexto(sabor);
            const similitud = calcularSimilitud(busquedaNormalizada, saborNorm);
            return similitud > 0.5;
        }).sort((a, b) => {
            const simA = calcularSimilitud(busquedaNormalizada, normalizarTexto(a));
            const simB = calcularSimilitud(busquedaNormalizada, normalizarTexto(b));
            return simB - simA;
        });
    }

    return saboresFiltrados.slice(0, 10);
}

function mostrarSugerencias(pedidoId, saborIndex) {
    const input = document.querySelector(`#form-${pedidoId} [data-sabor-index="${saborIndex}"]`);
    const sugerencias = document.getElementById(`sugerencias-${pedidoId}-${saborIndex}`);
    
    if (!input || !sugerencias) return;
    
    const busqueda = input.value.trim();
    
    if (busqueda.length === 0) {
        sugerencias.classList.remove('active');
        return;
    }
    
    const saboresFiltrados = buscarSaboresInteligente(busqueda);
    
    if (saboresFiltrados.length > 0) {
        sugerencias.innerHTML = saboresFiltrados.map(sabor => {
            const saborNorm = normalizarTexto(sabor);
            const busquedaNorm = normalizarTexto(busqueda);
            
            let saborHTML = sabor;
            
            if (saborNorm.startsWith(busquedaNorm)) {
                const inicio = sabor.substring(0, busqueda.length);
                const resto = sabor.substring(busqueda.length);
                saborHTML = `<strong>${inicio}</strong>${resto}`;
            } else if (saborNorm.includes(busquedaNorm)) {
                const index = saborNorm.indexOf(busquedaNorm);
                const antes = sabor.substring(0, index);
                const coincidencia = sabor.substring(index, index + busqueda.length);
                const despues = sabor.substring(index + busqueda.length);
                saborHTML = `${antes}<strong>${coincidencia}</strong>${despues}`;
            }
            
            return `
                <div class="sugerencia-item" onmousedown="seleccionarSaborSugerencia(${pedidoId}, ${saborIndex}, '${sabor}')">
                    ${saborHTML}
                </div>
            `;
        }).join('');
        sugerencias.classList.add('active');
    } else {
        sugerencias.innerHTML = '<div class="sugerencia-item no-resultados">No se encontraron coincidencias</div>';
        sugerencias.classList.add('active');
    }
}

function filtrarSabores(pedidoId, saborIndex) {
    mostrarSugerencias(pedidoId, saborIndex);
}

function ocultarSugerencias(pedidoId, saborIndex) {
    setTimeout(() => {
        const sugerencias = document.getElementById(`sugerencias-${pedidoId}-${saborIndex}`);
        if (sugerencias) {
            sugerencias.classList.remove('active');
        }
    }, 200);
}

function seleccionarSaborSugerencia(pedidoId, saborIndex, sabor) {
    const input = document.querySelector(`#form-${pedidoId} [data-sabor-index="${saborIndex}"]`);
    if (input) {
        input.value = sabor;
    }
}

// ===== UTILIDADES =====

function mostrarAlertaEnPantalla(mensaje, elementoReferencia) {
    const alertasAnteriores = document.querySelectorAll('.alerta-pantalla');
    alertasAnteriores.forEach(a => a.remove());
    
    const alerta = document.createElement('div');
    alerta.className = 'alerta-pantalla';
    alerta.textContent = mensaje;
    
    elementoReferencia.parentNode.insertBefore(alerta, elementoReferencia.nextSibling);
    
    setTimeout(() => alerta.classList.add('active'), 10);
    
    setTimeout(() => {
        alerta.classList.remove('active');
        setTimeout(() => alerta.remove(), 300);
    }, 3000);
}

function mostrarAlertaEnPantallaGlobal(mensaje) {
    const alertasAnteriores = document.querySelectorAll('.alerta-global');
    alertasAnteriores.forEach(a => a.remove());
    
    const alerta = document.createElement('div');
    alerta.className = 'alerta-global';
    alerta.textContent = mensaje;
    
    document.body.appendChild(alerta);
    
    setTimeout(() => alerta.classList.add('active'), 10);
    
    setTimeout(() => {
        alerta.classList.remove('active');
        setTimeout(() => alerta.remove(), 300);
    }, 2500);
}

function eliminarHelado(pedidoId, heladoId) {
    const pedido = pedidosActivos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const helado = pedido.helados.find(h => h.id === heladoId);
    if (!helado) return;
    
    pedido.total -= helado.precio;
    pedido.helados = pedido.helados.filter(h => h.id !== heladoId);
    
    saveData();
    renderPedidosActivos();
}

// ===== FUNCIONES PARA EDICIÓN RÁPIDA DE HELADOS EN LISTA =====

// Cambiar envase de un helado específico en la lista
function cambiarEnvaseHelado(pedidoId, heladoId, nuevoEnvase) {
    const pedido = pedidosActivos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const helado = pedido.helados.find(h => h.id === heladoId);
    if (!helado) return;
    
    // Verificar que el envase sea válido para esa cantidad de bolas
    if (!envaseDisponible(helado.bolas, nuevoEnvase)) {
        mostrarAlertaEnPantallaGlobal('⚠️ Este envase no está disponible para esa cantidad de bolas');
        return;
    }
    
    // Cambiar envase
    helado.envase = nuevoEnvase;
    
    // Recalcular precio
    helado.precio = calcularPrecio(helado.bolas, nuevoEnvase);
    
    // Recalcular total del pedido
    pedido.total = pedido.helados.reduce((sum, h) => sum + h.precio, 0);
    
    saveData();
    renderPedidosActivos();
}

// Editar sabores de un helado específico
function editarSaboresHelado(pedidoId, heladoId) {
    const pedido = pedidosActivos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const helado = pedido.helados.find(h => h.id === heladoId);
    if (!helado) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-pedido modal-editar-sabores';
    modal.innerHTML = `
        <div class="modal-content-pedido modal-sabores-rapido">
            <div class="modal-header-pedido">
                <h2>✏️ Editar Sabores</h2>
                <button class="btn-cerrar-modal" onclick="cerrarModalEdicionSabores()">✕</button>
            </div>
            <div class="modal-body-editar-sabores">
                <div class="info-helado-edit">
                    <strong>${helado.bolas} ${helado.bolas === 1 ? 'bola' : 'bolas'}</strong> - ${helado.envase}
                </div>
                
                <div class="sabores-edit-rapido" id="sabores-edit-rapido">
                    ${helado.sabores.map((sabor, idx) => `
                        <div class="sabor-edit-row">
                            <input type="text" 
                                   class="sabor-edit-input" 
                                   value="${sabor}"
                                   data-idx="${idx}"
                                   placeholder="Sabor ${idx + 1}"
                                   list="sabores-list-${idx}">
                            <datalist id="sabores-list-${idx}">
                                ${SABORES.map(s => `<option value="${s}">`).join('')}
                            </datalist>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer-pedido">
                <button class="btn-guardar-sabores-rapido" onclick="guardarSaboresEditados(${pedidoId}, ${heladoId})">
                    💾 Guardar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

function guardarSaboresEditados(pedidoId, heladoId) {
    const pedido = pedidosActivos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const helado = pedido.helados.find(h => h.id === heladoId);
    if (!helado) return;
    
    // Obtener los nuevos sabores de los inputs
    const inputs = document.querySelectorAll('.sabor-edit-input');
    const nuevosSabores = Array.from(inputs).map(input => input.value.trim()).filter(s => s !== '');
    
    if (nuevosSabores.length === 0) {
        mostrarAlertaEnPantallaGlobal('⚠️ Debes tener al menos un sabor');
        return;
    }
    
    // Actualizar sabores
    helado.sabores = nuevosSabores;
    
    saveData();
    cerrarModalEdicionSabores();
    renderPedidosActivos();
    mostrarAlertaEnPantallaGlobal('✅ Sabores actualizados');
}

function cerrarModalEdicionSabores() {
    const modal = document.querySelector('.modal-editar-sabores');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Toggle del menú de Extras para Conazo y Sombrero
function toggleExtrasEnvase(pedidoId, heladoId, event) {
    // Prevenir que el evento se propague
    if (event) {
        event.stopPropagation();
    }
    
    const menu = document.getElementById(`extras-menu-${pedidoId}-${heladoId}`);
    const btn = document.getElementById(`extras-btn-${pedidoId}-${heladoId}`);
    
    // Cerrar todos los demás extras abiertos
    document.querySelectorAll('.envase-extras-menu.show').forEach(m => {
        if (m.id !== `extras-menu-${pedidoId}-${heladoId}`) {
            m.classList.remove('show');
        }
    });
    
    document.querySelectorAll('.envase-extras-btn.expanded').forEach(b => {
        if (b.id !== `extras-btn-${pedidoId}-${heladoId}`) {
            b.classList.remove('expanded');
        }
    });
    
    if (menu && btn) {
        const estabaAbierto = menu.classList.contains('show');
        menu.classList.toggle('show');
        btn.classList.toggle('expanded');
        
        // Si acabamos de abrir, añadir listener para cerrar al hacer click fuera
        if (!estabaAbierto) {
            setTimeout(() => {
                document.addEventListener('click', cerrarExtrasAlClickFuera);
            }, 10);
        } else {
            document.removeEventListener('click', cerrarExtrasAlClickFuera);
        }
    }
}

// Función para cerrar extras al hacer click fuera
function cerrarExtrasAlClickFuera(event) {
    const clickDentroDeExtras = event.target.closest('.envase-extras-menu') || 
                                 event.target.closest('.envase-extras-btn');
    
    if (!clickDentroDeExtras) {
        document.querySelectorAll('.envase-extras-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
        document.querySelectorAll('.envase-extras-btn.expanded').forEach(btn => {
            btn.classList.remove('expanded');
        });
        document.removeEventListener('click', cerrarExtrasAlClickFuera);
    }
}

function finalizarPedido(pedidoId) {
    const pedido = pedidosActivos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    if (pedido.helados.length === 0) {
        mostrarAlertaEnPantallaGlobal('⚠️ El pedido está vacío');
        return;
    }
    
    mostrarModalConfirmacion(pedido);
}

function mostrarModalConfirmacion(pedido) {
    const modal = document.createElement('div');
    modal.className = 'modal-pedido';
    modal.innerHTML = `
        <div class="modal-content-pedido modal-confirmacion">
            <div class="modal-header-pedido">
                <h2>¿Ver Pedido #${pedido.id}?</h2>
                <button class="btn-cerrar-modal" onclick="cerrarModalPedido()">✕</button>
            </div>
            <div class="modal-body-confirmacion">
                <p>Total: <strong>S/ ${pedido.total.toFixed(2)}</strong></p>
                <p>¿Deseas ver los detalles del pedido antes de finalizarlo?</p>
            </div>
            <div class="modal-footer-confirmacion">
                <button class="btn-confirmar-si" onclick="confirmarConVer(${pedido.id})">
                    Sí, ver pedido
                </button>
                <button class="btn-confirmar-no" onclick="confirmarSinVer(${pedido.id})">
                    No, finalizar directo
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

function confirmarConVer(pedidoId) {
    const pedido = pedidosActivos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    cerrarModalPedido();
    
    setTimeout(() => {
        mostrarModalPedido(pedido);
    }, 300);
    
    finalizarPedidoDefinitivo(pedidoId);
}

function confirmarSinVer(pedidoId) {
    cerrarModalPedido();
    finalizarPedidoDefinitivo(pedidoId);
    mostrarAlertaEnPantallaGlobal('✅ Pedido finalizado');
}

function finalizarPedidoDefinitivo(pedidoId) {
    const pedido = pedidosActivos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const fechaActual = new Date();
    historialPedidos.unshift({
        ...pedido,
        fechaFinalizado: fechaActual.toLocaleString('es-PE'),
        fechaOrden: fechaActual.getTime()
    });
    
    pedidosActivos = pedidosActivos.filter(p => p.id !== pedidoId);
    
    saveData();
    renderPedidosActivos();
    renderHistorial();
}

function mostrarModalPedido(pedido) {
    // Calcular totales
    const totalPagado = pedido.helados
        .filter(h => h.pagado)
        .reduce((sum, h) => sum + h.precio, 0);
    const porPagar = pedido.total - totalPagado;
    
    const modal = document.createElement('div');
    modal.className = 'modal-pedido';
    modal.innerHTML = `
        <div class="modal-content-pedido">
            <div class="modal-header-pedido">
                <h2>${pedido.nombre || `Pedido #${pedido.id}`}</h2>
                <button class="btn-cerrar-modal" onclick="cerrarModalPedido()">✕</button>
            </div>
            <div class="modal-body-pedido">
                ${pedido.helados.map(helado => {
                    const colorEnvase = getColorEnvaseSolido(helado.envase);
                    const saboresAgrupados = agruparSaboresRepetidos(helado.sabores);
                    return `
                    <div class="modal-helado-card-compact ${helado.completado ? 'completado' : ''}" 
                         style="background: ${getColorEnvase(helado.envase)};"
                         data-pedido-id="${pedido.id}"
                         data-helado-id="${helado.id}"
                         data-pagado="${helado.pagado}">
                        <div class="modal-card-content-new">
                            <div class="envase-row">
                                <div class="modal-helado-envase-compact" style="background: ${colorEnvase};">${helado.envase}</div>
                                ${helado.pagado ? '<div class="badge-pagado">PAGADO</div>' : ''}
                            </div>
                            <div class="modal-sabores-lista-new">
                                ${saboresAgrupados.map(item => `
                                    <div class="modal-sabor-text">${item}</div>
                                `).join('')}
                            </div>
                            <div class="modal-precio-box">S/ ${helado.precio.toFixed(2)}</div>
                        </div>
                    </div>
                `}).join('')}
            </div>
            <div class="modal-footer-pedido">
                <div class="desglose-total">
                    <div class="linea-total total-general">
                        <span class="label-total">Total:</span>
                        <span class="valor-total">S/ ${pedido.total.toFixed(2)}</span>
                    </div>
                    ${totalPagado > 0 ? `
                    <div class="linea-total total-pagado">
                        <span class="label-total">Pagado:</span>
                        <span class="valor-total">S/ ${totalPagado.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="linea-total total-por-pagar ${porPagar === 0 ? 'completado' : ''}">
                        <span class="label-total">Por Pagar:</span>
                        <span class="valor-total">S/ ${porPagar.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Inicializar eventos de touch para cada tarjeta
    inicializarSwipeYTap();
}

function inicializarSwipeYTap() {
    const cards = document.querySelectorAll('.modal-helado-card-compact');
    
    cards.forEach(card => {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let isDragging = false;
        let isTap = true;
        let isScrolling = false; // Nueva bandera para scroll
        let tapTimeout = null;
        const SWIPE_THRESHOLD = 100; // Distancia mínima para activar swipe
        const VERTICAL_THRESHOLD = 20; // Umbral más bajo para detectar scroll
        const HORIZONTAL_THRESHOLD = 15; // Mínimo movimiento horizontal
        
        card.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            currentX = startX;
            currentY = startY;
            isDragging = true;
            isTap = true;
            isScrolling = false;
            
            // Timeout para detectar tap rápido
            tapTimeout = setTimeout(() => {
                isTap = false;
            }, 200);
        });
        
        card.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - startX;
            const deltaY = touchY - startY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            
            // Detectar si es scroll vertical
            if (!isScrolling && absDeltaY > VERTICAL_THRESHOLD) {
                if (absDeltaY > absDeltaX) {
                    // Es definitivamente un scroll vertical
                    isScrolling = true;
                    isDragging = false;
                    isTap = false;
                    clearTimeout(tapTimeout);
                    // Resetear transform si había alguno
                    card.style.transition = 'transform 0.3s ease';
                    card.style.transform = 'translateX(0)';
                    card.style.opacity = '1';
                    return;
                }
            }
            
            // Si ya se determinó que es scroll, no hacer nada más
            if (isScrolling) return;
            
            currentX = touchX;
            currentY = touchY;
            
            // Si se está moviendo horizontalmente de forma clara
            if (absDeltaX > HORIZONTAL_THRESHOLD && absDeltaX > absDeltaY) {
                isTap = false;
                clearTimeout(tapTimeout);
                e.preventDefault();
                
                // Mostrar preview del swipe
                const maxTranslate = 150;
                const translate = Math.max(Math.min(deltaX, maxTranslate), -maxTranslate);
                
                card.style.transition = 'none';
                card.style.transform = `translateX(${translate}px)`;
                
                // Efecto visual de resistencia
                const resistance = Math.abs(translate) / maxTranslate;
                card.style.opacity = 1 - (resistance * 0.2);
            }
        });
        
        card.addEventListener('touchend', (e) => {
            if (!isDragging && !isScrolling) return;
            
            // Si fue scroll, no hacer nada
            if (isScrolling) {
                isScrolling = false;
                return;
            }
            
            isDragging = false;
            clearTimeout(tapTimeout);
            
            const deltaX = currentX - startX;
            
            // Restaurar opacidad
            card.style.opacity = '1';
            
            // Si es un tap (no se movió mucho)
            if (isTap && Math.abs(deltaX) < 10) {
                // Restaurar transición suave para el tap
                card.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                card.style.transform = 'translateX(0)';
                
                // Pequeño delay para que se vea la animación antes de cambiar el estado
                setTimeout(() => {
                    toggleCompletadoCard(card);
                }, 50);
                return;
            }
            
            // Si es un swipe hacia la IZQUIERDA o DERECHA y superó el umbral
            if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
                // Transición rápida y fluida de vuelta
                card.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                card.style.transform = 'translateX(0)';
                
                // Toggle inmediato del estado (sin esperar animación)
                togglePagadoSwipe(card);
            } else {
                // No alcanzó el umbral, regresar con transición suave
                card.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                card.style.transform = 'translateX(0)';
            }
        });
        
        // Cancelar si se interrumpe el touch
        card.addEventListener('touchcancel', (e) => {
            isDragging = false;
            isScrolling = false;
            clearTimeout(tapTimeout);
            card.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            card.style.transform = 'translateX(0)';
            card.style.opacity = '1';
        });
    });
}

function toggleCompletadoCard(card) {
    const pedidoId = parseInt(card.dataset.pedidoId);
    const heladoId = parseInt(card.dataset.heladoId);
    
    const pedido = pedidosActivos.find(p => p.id === pedidoId) || 
                   historialPedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const helado = pedido.helados.find(h => h.id === heladoId);
    if (helado) {
        helado.completado = !helado.completado;
        saveData();
        
        if (helado.completado) {
            card.classList.add('completado');
        } else {
            card.classList.remove('completado');
        }
    }
}

function togglePagadoSwipe(card) {
    const pedidoId = parseInt(card.dataset.pedidoId);
    const heladoId = parseInt(card.dataset.heladoId);
    
    const pedido = pedidosActivos.find(p => p.id === pedidoId) || 
                   historialPedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const helado = pedido.helados.find(h => h.id === heladoId);
    if (helado) {
        helado.pagado = !helado.pagado;
        saveData();
        
        const envaseRow = card.querySelector('.envase-row');
        
        if (helado.pagado) {
            card.dataset.pagado = 'true';
            
            if (!envaseRow.querySelector('.badge-pagado')) {
                const badge = document.createElement('div');
                badge.className = 'badge-pagado';
                badge.textContent = 'PAGADO';
                envaseRow.appendChild(badge);
            }
        } else {
            card.dataset.pagado = 'false';
            
            const badge = envaseRow.querySelector('.badge-pagado');
            if (badge) {
                badge.remove();
            }
        }
        
        // Actualizar el desglose de totales con animación
        actualizarDesgloseTotales(pedido);
    }
}

// Nueva función para actualizar el desglose con animación
function actualizarDesgloseTotales(pedido) {
    const totalPagado = pedido.helados
        .filter(h => h.pagado)
        .reduce((sum, h) => sum + h.precio, 0);
    const porPagar = pedido.total - totalPagado;
    
    const desglose = document.querySelector('.desglose-total');
    if (!desglose) return;
    
    // Animar el cambio
    desglose.style.transform = 'scale(0.98)';
    desglose.style.opacity = '0.7';
    
    setTimeout(() => {
        // Actualizar valores
        const valorPagado = desglose.querySelector('.total-pagado .valor-total');
        const lineaPagado = desglose.querySelector('.total-pagado');
        const valorPorPagar = desglose.querySelector('.total-por-pagar .valor-total');
        const lineaPorPagar = desglose.querySelector('.total-por-pagar');
        
        if (totalPagado > 0) {
            if (!lineaPagado) {
                // Crear línea de pagado si no existe
                const totalGeneral = desglose.querySelector('.total-general');
                const nuevaLinea = document.createElement('div');
                nuevaLinea.className = 'linea-total total-pagado';
                nuevaLinea.innerHTML = `
                    <span class="label-total">Pagado:</span>
                    <span class="valor-total">S/ ${totalPagado.toFixed(2)}</span>
                `;
                totalGeneral.after(nuevaLinea);
            } else {
                valorPagado.textContent = `S/ ${totalPagado.toFixed(2)}`;
            }
        } else {
            if (lineaPagado) {
                lineaPagado.remove();
            }
        }
        
        if (valorPorPagar) {
            valorPorPagar.textContent = `S/ ${porPagar.toFixed(2)}`;
        }
        
        // Actualizar clase de completado
        if (porPagar === 0) {
            lineaPorPagar.classList.add('completado');
        } else {
            lineaPorPagar.classList.remove('completado');
        }
        
        // Restaurar animación
        desglose.style.transform = 'scale(1)';
        desglose.style.opacity = '1';
    }, 150);
}

// Agrupar sabores repetidos y mostrar con x2, x3, etc.
function agruparSaboresRepetidos(sabores) {
    const contador = {};
    const orden = [];
    
    // Contar ocurrencias manteniendo el orden
    sabores.forEach(sabor => {
        if (!contador[sabor]) {
            contador[sabor] = 0;
            orden.push(sabor);
        }
        contador[sabor]++;
    });
    
    // Crear array con formato "Sabor x2" si se repite
    return orden.map(sabor => {
        if (contador[sabor] > 1) {
            return `${sabor} x${contador[sabor]}`;
        }
        return sabor;
    });
}

function getTextColorForBackground(envase) {
    // Determinar si el fondo es claro u oscuro para elegir el color del texto
    const coloresClaros = ['Vaso', 'Vaso Galleta', 'Sombrero'];
    return coloresClaros.includes(envase) ? '#000000' : '#ffffff';
}

function getColorEnvase(envase) {
    const colores = {
        'Vaso': 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',           // Verde más oscuro y saturado
        'Vaso Galleta': 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)',  // Naranja más oscuro
        'Cono': 'linear-gradient(135deg, #d4822a 0%, #b8691e 100%)',          // Café/naranja más oscuro
        'Conazo': 'linear-gradient(135deg, #8e6f3e 0%, #6d5228 100%)',        // Café más oscuro
        'Sombrero': 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)'       // Morado más oscuro y saturado
    };
    return colores[envase] || 'linear-gradient(135deg, #7f8c8d 0%, #5d6d7e 100%)';
}

function getColorEnvaseSolido(envase) {
    const colores = {
        'Vaso': '#27ae60',          // Verde oscuro
        'Vaso Galleta': '#d35400',  // Naranja oscuro
        'Cono': '#b8691e',          // Café/naranja
        'Conazo': '#6d5228',        // Café oscuro
        'Sombrero': '#8e44ad'       // Morado oscuro
    };
    return colores[envase] || '#5d6d7e';
}

function cerrarModalPedido() {
    const modal = document.querySelector('.modal-pedido');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

function toggleCompletado(pedidoId, heladoId) {
    const pedido = pedidosActivos.find(p => p.id === pedidoId) || 
                   historialPedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const helado = pedido.helados.find(h => h.id === heladoId);
    if (helado) {
        helado.completado = !helado.completado;
        saveData();
        
        const btn = event.target;
        if (helado.completado) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
}

// Funciones antiguas eliminadas - ahora se usa swipe y tap

function cancelarPedido(pedidoId) {
    if (confirm('¿Cancelar este pedido?')) {
        pedidosActivos = pedidosActivos.filter(p => p.id !== pedidoId);
        saveData();
        renderPedidosActivos();
    }
}

function renderPedidosActivos() {
    const container = document.getElementById('pedidosActivos');
    
    if (pedidosActivos.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay pedidos activos.</div>';
        return;
    }
    
    container.innerHTML = pedidosActivos.map(pedido => `
        <div class="pedido-card">
            <div class="pedido-header">
                <span class="pedido-numero">Pedido #${pedido.id}</span>
                <span class="pedido-total">Total: S/ ${pedido.total.toFixed(2)}</span>
            </div>
            
            <div class="helado-form" id="form-${pedido.id}" data-bolas="1" data-envase="">
                <h3 class="form-subtitle">Agregar Helado</h3>
                
                <div class="form-section">
                    <label class="form-label">Bolas</label>
                    <div class="bolas-selector">
                        ${[1, 2, 3].map(num => `
                            <button class="bola-sphere ${num === 1 ? 'selected' : ''}" 
                                    data-bola-value="${num}"
                                    onclick="cambiarBolas(${pedido.id}, ${num})">
                                ${num}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-section">
                    <div class="form-label-con-boton">
                        <label class="form-label">Sabores</label>
                        <button class="btn-agregar-sabor" onclick="agregarSabor(${pedido.id})" type="button">
                            ➕ Agregar Sabor
                        </button>
                    </div>
                    <div class="sabores-inputs-container">
                        <div class="sabor-input-wrapper">
                            <input type="text" 
                                   class="sabor-input" 
                                   placeholder="Sabor 1"
                                   data-sabor-index="0"
                                   oninput="filtrarSabores(${pedido.id}, 0)"
                                   onfocus="mostrarSugerencias(${pedido.id}, 0)"
                                   onblur="ocultarSugerencias(${pedido.id}, 0)">
                            <button class="btn-borrar-sabor" onclick="eliminarSabor(${pedido.id}, 0)" type="button">🗑️</button>
                            <div class="sugerencias-sabores" id="sugerencias-${pedido.id}-0"></div>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <label class="form-label">Envase</label>
                    <div class="envases-compact">
                        ${ENVASES.map(env => `
                            <button class="envase-btn-compact" 
                                    data-envase="${env}"
                                    onclick="cambiarEnvase(${pedido.id}, '${env}')">
                                ${env}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <button class="btn-guardar-helado" onclick="guardarHelado(${pedido.id})">
                    💾 Guardar Helado
                </button>
            </div>
            
            ${pedido.helados.length > 0 ? `
                <div class="helados-lista">
                    <h3 class="lista-titulo">Helados en este pedido:</h3>
                    ${pedido.helados.map(helado => {
                        // Separar envases normales de extras
                        const envasesNormales = ['Vaso', 'Vaso Galleta', 'Cono'];
                        const envasesExtras = ['Conazo', 'Sombrero'];
                        
                        // Determinar qué mostrar según las bolas
                        const mostrarExtras = helado.bolas >= 1 && helado.bolas <= 2;
                        
                        return `
                        <div class="helado-item-mejorado" id="helado-${pedido.id}-${helado.id}">
                            <div class="helado-info-top">
                                <div class="helado-detalle">
                                    <strong>${helado.bolas} ${helado.bolas === 1 ? 'bola' : 'bolas'}</strong>
                                </div>
                                <div class="helado-acciones-top">
                                    <button class="btn-editar-sabores-mini" onclick="editarSaboresHelado(${pedido.id}, ${helado.id})" title="Editar sabores">✏️</button>
                                    <span class="helado-precio-mini">S/ ${helado.precio.toFixed(2)}</span>
                                    <button class="btn-eliminar-mini-lista" onclick="eliminarHelado(${pedido.id}, ${helado.id})">🗑️</button>
                                </div>
                            </div>
                            <div class="helado-sabores-display">${helado.sabores.join(', ')}</div>
                            
                            <div class="envase-switch-container">
                                <div class="envase-switch-buttons">
                                    ${envasesNormales.map(env => {
                                        const disponible = envaseDisponible(helado.bolas, env);
                                        return `
                                            <button class="envase-switch-btn ${helado.envase === env ? 'active' : ''} ${!disponible ? 'disabled' : ''}" 
                                                    onclick="cambiarEnvaseHelado(${pedido.id}, ${helado.id}, '${env}')"
                                                    ${!disponible ? 'disabled' : ''}>
                                                ${env}
                                            </button>
                                        `;
                                    }).join('')}
                                    
                                    ${mostrarExtras ? `
                                        <button class="envase-extras-btn ${envasesExtras.includes(helado.envase) ? 'expanded' : ''}" 
                                                onclick="toggleExtrasEnvase(${pedido.id}, ${helado.id}, event)"
                                                id="extras-btn-${pedido.id}-${helado.id}">
                                            Extras
                                        </button>
                                        <div class="envase-extras-menu ${envasesExtras.includes(helado.envase) ? 'show' : ''}" 
                                             id="extras-menu-${pedido.id}-${helado.id}">
                                            ${envasesExtras.map(env => `
                                                <button class="envase-extra-item ${helado.envase === env ? 'active' : ''}" 
                                                        onclick="cambiarEnvaseHelado(${pedido.id}, ${helado.id}, '${env}'); event.stopPropagation();">
                                                    ${env}
                                                </button>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                    
                                    ${helado.bolas >= 3 ? envasesExtras.map(env => {
                                        const disponible = envaseDisponible(helado.bolas, env);
                                        return `
                                            <button class="envase-switch-btn ${helado.envase === env ? 'active' : ''} ${!disponible ? 'disabled' : ''}" 
                                                    onclick="cambiarEnvaseHelado(${pedido.id}, ${helado.id}, '${env}')"
                                                    ${!disponible ? 'disabled' : ''}>
                                                ${env}
                                            </button>
                                        `;
                                    }).join('') : ''}
                                </div>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            ` : ''}
            
            <div class="pedido-footer">
                <button class="btn-finalizar-pedido" onclick="finalizarPedido(${pedido.id})">
                    ✅ Finalizar Pedido
                </button>
                <button class="btn-cancelar-pedido" onclick="cancelarPedido(${pedido.id})">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    `).join('');
}

function renderHistorial() {
    const container = document.getElementById('historialList');
    
    // Generar todos los días con pedidos Y los últimos 7 días sin pedidos
    const pedidosPorDia = agruparPorDia(historialPedidos);
    const fechasConPedidos = Object.keys(pedidosPorDia);
    const todasLasFechas = generarFechasConHistorial(fechasConPedidos);
    
    // Obtener fecha de hoy
    const hoy = formatearFecha(new Date());
    
    // Si no hay fecha seleccionada, seleccionar HOY SIEMPRE
    if (!window.fechaSeleccionada) {
        window.fechaSeleccionada = hoy;
    }
    
    // Verificar si la fecha seleccionada existe en el array, sino usar hoy
    if (!todasLasFechas.includes(window.fechaSeleccionada)) {
        window.fechaSeleccionada = hoy;
    }
    
    const pedidosDelDia = pedidosPorDia[window.fechaSeleccionada] || [];
    
    container.innerHTML = `
        <div class="historial-selector">
            <div class="fechas-scroll-container">
                <div class="fechas-horizontal">
                    ${todasLasFechas.map(fecha => {
                        const tienePedidos = pedidosPorDia[fecha] && pedidosPorDia[fecha].length > 0;
                        return `
                        <div class="fecha-chip ${fecha === window.fechaSeleccionada ? 'selected' : ''} ${!tienePedidos ? 'empty' : ''}" 
                             onclick="seleccionarFecha('${fecha}')">
                            <div class="fecha-chip-label">${obtenerEtiquetaDiaCorta(fecha)}</div>
                            <div class="fecha-chip-numero">${obtenerDiaMes(fecha)}</div>
                            <div class="fecha-chip-count">${tienePedidos ? pedidosPorDia[fecha].length : '0'}</div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
        
        <div class="historial-pedidos-dia">
            ${pedidosDelDia.length === 0 ? `
                <div class="empty-state-day">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">Sin pedidos este día</div>
                </div>
            ` : pedidosDelDia.map(pedido => `
                <div class="historial-item">
                    <div class="historial-header">
                        <div class="historial-info">
                            <span class="historial-numero">${pedido.nombre || `Pedido #${pedido.id}`}</span>
                        </div>
                        <div class="historial-acciones">
                            <button class="btn-icono btn-editar" onclick="editarPedidoHistorial(${pedido.id})" title="Editar pedido">✏️</button>
                            <button class="btn-icono btn-config" onclick="editarConfigPedido(${pedido.id})" title="Configuración">⚙️</button>
                            <button class="btn-icono" onclick="verPedidoHistorial(${pedido.id})" title="Ver pedido">👁️</button>
                            <button class="btn-icono btn-eliminar-historial" onclick="eliminarPedidoHistorial(${pedido.id})" title="Eliminar pedido">🗑️</button>
                        </div>
                    </div>
                    <div class="historial-fecha">${pedido.fechaFinalizado}</div>
                    <div class="historial-helados">
                        ${pedido.helados.map(h => `
                            <div class="historial-helado">
                                • ${h.bolas} ${h.bolas === 1 ? 'bola' : 'bolas'} - ${h.envase}: ${h.sabores.join(', ')} - S/ ${h.precio.toFixed(2)}
                            </div>
                        `).join('')}
                    </div>
                    <div class="historial-total">Total: S/ ${pedido.total.toFixed(2)}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Hacer scroll INMEDIATO al chip seleccionado
    requestAnimationFrame(() => {
        scrollToSelectedChip();
    });
}

function seleccionarFecha(fecha) {
    const fechaAnterior = window.fechaSeleccionada;
    window.fechaSeleccionada = fecha;
    
    // Si es la misma fecha, no hacer nada
    if (fechaAnterior === fecha) return;
    
    // Guardar referencia al contenedor antes de renderizar
    const container = document.querySelector('.fechas-scroll-container');
    const scrollAntes = container ? container.scrollLeft : 0;
    
    // Renderizar el nuevo contenido
    renderHistorial();
    
    // Después del renderizado, hacer scroll animado personalizado
    requestAnimationFrame(() => {
        const containerNuevo = document.querySelector('.fechas-scroll-container');
        const selectedChip = document.querySelector('.fecha-chip.selected');
        
        if (containerNuevo && selectedChip) {
            // Restaurar scroll anterior temporalmente
            containerNuevo.scrollLeft = scrollAntes;
            
            requestAnimationFrame(() => {
                const containerRect = containerNuevo.getBoundingClientRect();
                const chipRect = selectedChip.getBoundingClientRect();
                
                // Calcular posición exacta para centrar
                const containerCenter = containerRect.width / 2;
                const chipCenter = chipRect.left - containerRect.left + containerNuevo.scrollLeft + (chipRect.width / 2);
                const scrollDestino = Math.max(0, chipCenter - containerCenter);
                
                // Animación personalizada con duración fija (más lenta)
                animarScrollPersonalizado(containerNuevo, scrollAntes, scrollDestino, 500); // 500ms duración
            });
        }
    });
}

// Función de animación personalizada con easing suave
function animarScrollPersonalizado(elemento, inicio, fin, duracion) {
    const distancia = fin - inicio;
    const tiempoInicio = performance.now();
    
    function animar(tiempoActual) {
        const tiempoTranscurrido = tiempoActual - tiempoInicio;
        const progreso = Math.min(tiempoTranscurrido / duracion, 1);
        
        // Easing suave (ease-in-out)
        const easing = progreso < 0.5
            ? 4 * progreso * progreso * progreso
            : 1 - Math.pow(-2 * progreso + 2, 3) / 2;
        
        elemento.scrollLeft = inicio + (distancia * easing);
        
        if (progreso < 1) {
            requestAnimationFrame(animar);
        }
    }
    
    requestAnimationFrame(animar);
}

function scrollToSelectedChip() {
    const container = document.querySelector('.fechas-scroll-container');
    const selectedChip = document.querySelector('.fecha-chip.selected');
    
    if (container && selectedChip) {
        // Forzar recálculo del layout
        container.offsetHeight;
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const containerRect = container.getBoundingClientRect();
                const chipRect = selectedChip.getBoundingClientRect();
                const scrollContainer = container;
                
                // Calcular posición exacta para centrar
                const containerCenter = containerRect.width / 2;
                const chipCenter = chipRect.left - containerRect.left + scrollContainer.scrollLeft + (chipRect.width / 2);
                const scrollPosition = chipCenter - containerCenter;
                
                // Aplicar scroll instantáneo
                scrollContainer.scrollLeft = Math.max(0, scrollPosition);
            });
        });
    }
}

function agruparPorDia(pedidos) {
    const grupos = {};
    pedidos.forEach(pedido => {
        let fecha = pedido.fechaFinalizado.split(',')[0].trim();
        
        // Normalizar formato de fecha (asegurar que tenga ceros: 01/02 en lugar de 1/2)
        const partes = fecha.split('/');
        if (partes.length === 3) {
            const dia = partes[0].padStart(2, '0');
            const mes = partes[1].padStart(2, '0');
            const año = partes[2];
            fecha = `${dia}/${mes}/${año}`;
        }
        
        if (!grupos[fecha]) grupos[fecha] = [];
        grupos[fecha].push(pedido);
    });
    return grupos;
}

// Generar lista de fechas incluyendo días sin pedidos (últimos 30 días)
function generarFechasConHistorial(fechasConPedidos) {
    const fechasSet = new Set();
    
    // Agregar todas las fechas con pedidos
    fechasConPedidos.forEach(fecha => fechasSet.add(fecha));
    
    // Agregar los últimos 15 días y próximos 15 días
    const hoy = new Date();
    for (let i = -15; i <= 15; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() + i);
        const fechaStr = formatearFecha(fecha);
        fechasSet.add(fechaStr);
    }
    
    // Convertir a array y ordenar de más antigua a más reciente (izquierda a derecha)
    return Array.from(fechasSet).sort((a, b) => {
        const dateA = parsearFecha(a);
        const dateB = parsearFecha(b);
        return dateA - dateB; // Orden ascendente: pasado a la izquierda, futuro a la derecha
    });
}

function formatearFecha(date) {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const año = date.getFullYear();
    return `${dia}/${mes}/${año}`;
}

function parsearFecha(fechaStr) {
    const partes = fechaStr.split('/');
    return new Date(partes[2], partes[1] - 1, partes[0]);
}

function obtenerEtiquetaDiaCorta(fecha) {
    const partes = fecha.split('/');
    const fechaObj = new Date(partes[2], partes[1] - 1, partes[0]);
    const dias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    return dias[fechaObj.getDay()];
}

function obtenerDiaMes(fecha) {
    const partes = fecha.split('/');
    return `${partes[0]}/${partes[1]}`;
}

function verPedidoHistorial(pedidoId) {
    const pedido = historialPedidos.find(p => p.id === pedidoId);
    if (pedido) mostrarModalPedido(pedido);
}

function eliminarPedidoHistorial(pedidoId) {
    if (confirm('¿Eliminar este pedido del historial?')) {
        historialPedidos = historialPedidos.filter(p => p.id !== pedidoId);
        saveData();
        renderHistorial();
    }
}

// ===== NUEVAS FUNCIONES DE EDICIÓN =====

// Editar helados del pedido (sabores, bolas, envase)
function editarPedidoHistorial(pedidoId) {
    const pedido = historialPedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-pedido';
    modal.innerHTML = `
        <div class="modal-content-pedido modal-editar">
            <div class="modal-header-pedido">
                <h2>✏️ Editar ${pedido.nombre || `Pedido #${pedido.id}`}</h2>
                <button class="btn-cerrar-modal" onclick="cerrarModalEdicion()">✕</button>
            </div>
            <div class="modal-body-editar">
                ${pedido.helados.map((helado, idx) => `
                    <div class="helado-editar-card" id="helado-edit-${idx}">
                        <div class="helado-editar-header">
                            <span>Helado ${idx + 1}</span>
                            <button class="btn-eliminar-mini" onclick="eliminarHeladoEdicion(${pedidoId}, ${helado.id})">🗑️</button>
                        </div>
                        
                        <div class="form-section-mini">
                            <label>Bolas</label>
                            <div class="bolas-selector-mini">
                                ${[1, 2, 3].map(num => `
                                    <button class="bola-mini ${helado.bolas === num ? 'selected' : ''}" 
                                            onclick="cambiarBolasEdicion(${idx}, ${num})">
                                        ${num}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="form-section-mini">
                            <label>Sabores</label>
                            <div class="sabores-edit-container" id="sabores-edit-${idx}">
                                ${helado.sabores.map((sabor, sIdx) => `
                                    <input type="text" 
                                           class="sabor-input-mini" 
                                           value="${sabor}"
                                           data-helado="${idx}"
                                           data-sabor="${sIdx}"
                                           oninput="actualizarSaborEdicion(${idx}, ${sIdx}, this.value)">
                                `).join('')}
                            </div>
                            <button class="btn-agregar-sabor-mini" onclick="agregarSaborEdicion(${idx})">+ Sabor</button>
                        </div>
                        
                        <div class="form-section-mini">
                            <label>Envase</label>
                            <div class="envases-edit">
                                ${ENVASES.map(env => `
                                    <button class="envase-btn-mini ${helado.envase === env ? 'selected' : ''}" 
                                            onclick="cambiarEnvaseEdicion(${idx}, '${env}')">
                                        ${env}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="precio-preview">Precio: S/ <span id="precio-${idx}">${helado.precio.toFixed(2)}</span></div>
                    </div>
                `).join('')}
                
                <button class="btn-agregar-helado-edit" onclick="agregarHeladoEdicion(${pedidoId})">
                    ➕ Agregar Helado
                </button>
            </div>
            <div class="modal-footer-pedido">
                <button class="btn-guardar-edicion" onclick="guardarEdicionPedido(${pedidoId})">
                    💾 Guardar Cambios
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Guardar copia temporal para editar
    window.pedidoEnEdicion = JSON.parse(JSON.stringify(pedido));
}

// Editar configuración del pedido (nombre, fecha, hora)
function editarConfigPedido(pedidoId) {
    const pedido = historialPedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    // Parsear fecha actual
    const fechaActual = pedido.fechaFinalizado || new Date().toLocaleString('es-PE');
    const partes = fechaActual.split(', ');
    const fechaParte = partes[0] || '';
    const horaParte = partes[1] || '';
    
    // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD para el input
    const fechaSplit = fechaParte.split('/');
    const fechaInput = fechaSplit.length === 3 ? `${fechaSplit[2]}-${fechaSplit[1]}-${fechaSplit[0]}` : '';
    
    const modal = document.createElement('div');
    modal.className = 'modal-pedido';
    modal.innerHTML = `
        <div class="modal-content-pedido modal-config">
            <div class="modal-header-pedido">
                <h2>⚙️ Configuración del Pedido</h2>
                <button class="btn-cerrar-modal" onclick="cerrarModalConfig()">✕</button>
            </div>
            <div class="modal-body-config">
                <div class="config-field">
                    <label>Nombre del Pedido</label>
                    <input type="text" 
                           id="config-nombre" 
                           class="config-input" 
                           placeholder="Pedido #${pedido.id}"
                           value="${pedido.nombre || ''}">
                </div>
                
                <div class="config-field">
                    <label>Fecha</label>
                    <input type="date" 
                           id="config-fecha" 
                           class="config-input"
                           value="${fechaInput}">
                </div>
                
                <div class="config-field">
                    <label>Hora</label>
                    <input type="time" 
                           id="config-hora" 
                           class="config-input"
                           value="${horaParte}">
                </div>
            </div>
            <div class="modal-footer-pedido">
                <button class="btn-guardar-config" onclick="guardarConfigPedido(${pedidoId})">
                    💾 Guardar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

// Funciones auxiliares para edición de helados
function cambiarBolasEdicion(heladoIdx, bolas) {
    if (!window.pedidoEnEdicion) return;
    
    window.pedidoEnEdicion.helados[heladoIdx].bolas = bolas;
    
    // Actualizar UI
    document.querySelectorAll(`#helado-edit-${heladoIdx} .bola-mini`).forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Recalcular precio
    const helado = window.pedidoEnEdicion.helados[heladoIdx];
    helado.precio = calcularPrecio(helado.bolas, helado.envase);
    document.getElementById(`precio-${heladoIdx}`).textContent = helado.precio.toFixed(2);
}

function actualizarSaborEdicion(heladoIdx, saborIdx, valor) {
    if (!window.pedidoEnEdicion) return;
    window.pedidoEnEdicion.helados[heladoIdx].sabores[saborIdx] = valor;
}

function agregarSaborEdicion(heladoIdx) {
    if (!window.pedidoEnEdicion) return;
    
    const helado = window.pedidoEnEdicion.helados[heladoIdx];
    if (helado.sabores.length >= 3) {
        mostrarAlertaEnPantallaGlobal('⚠️ Máximo 3 sabores');
        return;
    }
    
    helado.sabores.push('');
    
    // Re-renderizar solo ese helado
    const container = document.getElementById(`sabores-edit-${heladoIdx}`);
    container.innerHTML = helado.sabores.map((sabor, sIdx) => `
        <input type="text" 
               class="sabor-input-mini" 
               value="${sabor}"
               data-helado="${heladoIdx}"
               data-sabor="${sIdx}"
               oninput="actualizarSaborEdicion(${heladoIdx}, ${sIdx}, this.value)">
    `).join('');
}

function cambiarEnvaseEdicion(heladoIdx, envase) {
    if (!window.pedidoEnEdicion) return;
    
    window.pedidoEnEdicion.helados[heladoIdx].envase = envase;
    
    // Actualizar UI
    document.querySelectorAll(`#helado-edit-${heladoIdx} .envase-btn-mini`).forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Recalcular precio
    const helado = window.pedidoEnEdicion.helados[heladoIdx];
    helado.precio = calcularPrecio(helado.bolas, helado.envase);
    document.getElementById(`precio-${heladoIdx}`).textContent = helado.precio.toFixed(2);
}

function eliminarHeladoEdicion(pedidoId, heladoId) {
    if (!window.pedidoEnEdicion) return;
    
    if (window.pedidoEnEdicion.helados.length <= 1) {
        mostrarAlertaEnPantallaGlobal('⚠️ El pedido debe tener al menos 1 helado');
        return;
    }
    
    window.pedidoEnEdicion.helados = window.pedidoEnEdicion.helados.filter(h => h.id !== heladoId);
    
    // Cerrar y reabrir modal para actualizar
    cerrarModalEdicion();
    setTimeout(() => editarPedidoHistorial(pedidoId), 300);
}

function agregarHeladoEdicion(pedidoId) {
    if (!window.pedidoEnEdicion) return;
    
    const nuevoHelado = {
        id: Date.now(),
        bolas: 1,
        sabores: [''],
        envase: 'Vaso',
        precio: 4.00,
        completado: false,
        pagado: false
    };
    
    window.pedidoEnEdicion.helados.push(nuevoHelado);
    
    // Cerrar y reabrir modal
    cerrarModalEdicion();
    setTimeout(() => editarPedidoHistorial(pedidoId), 300);
}

function guardarEdicionPedido(pedidoId) {
    if (!window.pedidoEnEdicion) return;
    
    // Validar que todos los sabores estén llenos
    let todosCompletos = true;
    window.pedidoEnEdicion.helados.forEach(helado => {
        helado.sabores = helado.sabores.filter(s => s.trim() !== '');
        if (helado.sabores.length === 0) todosCompletos = false;
    });
    
    if (!todosCompletos) {
        mostrarAlertaEnPantallaGlobal('⚠️ Completa todos los sabores');
        return;
    }
    
    // Recalcular total
    window.pedidoEnEdicion.total = window.pedidoEnEdicion.helados.reduce((sum, h) => sum + h.precio, 0);
    
    // Guardar en historial
    const idx = historialPedidos.findIndex(p => p.id === pedidoId);
    if (idx !== -1) {
        historialPedidos[idx] = window.pedidoEnEdicion;
    }
    
    saveData();
    cerrarModalEdicion();
    renderHistorial();
    mostrarAlertaEnPantallaGlobal('✅ Pedido actualizado');
}

function guardarConfigPedido(pedidoId) {
    const pedido = historialPedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const nombre = document.getElementById('config-nombre').value.trim();
    const fecha = document.getElementById('config-fecha').value;
    const hora = document.getElementById('config-hora').value;
    
    if (!fecha || !hora) {
        mostrarAlertaEnPantallaGlobal('⚠️ Completa fecha y hora');
        return;
    }
    
    // Convertir fecha de YYYY-MM-DD a DD/MM/YYYY
    const fechaSplit = fecha.split('-');
    const fechaFormateada = `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`;
    
    pedido.nombre = nombre || `Pedido #${pedido.id}`;
    pedido.fechaFinalizado = `${fechaFormateada}, ${hora}`;
    
    // Actualizar fechaOrden para el ordenamiento
    const dateObj = new Date(`${fecha}T${hora}`);
    pedido.fechaOrden = dateObj.getTime();
    
    saveData();
    cerrarModalConfig();
    renderHistorial();
    mostrarAlertaEnPantallaGlobal('✅ Configuración guardada');
}

function cerrarModalEdicion() {
    const modal = document.querySelector('.modal-pedido');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            window.pedidoEnEdicion = null;
        }, 300);
    }
}

function cerrarModalConfig() {
    const modal = document.querySelector('.modal-pedido');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

function saveData() {
    localStorage.setItem('pedidosHeladosActivos', JSON.stringify(pedidosActivos));
    localStorage.setItem('pedidosHeladosHistorial', JSON.stringify(historialPedidos));
    localStorage.setItem('pedidoActualId', pedidoActualId.toString());
}

function loadData() {
    const activosGuardados = localStorage.getItem('pedidosHeladosActivos');
    const historialGuardado = localStorage.getItem('pedidosHeladosHistorial');
    const idGuardado = localStorage.getItem('pedidoActualId');
    
    if (activosGuardados) pedidosActivos = JSON.parse(activosGuardados);
    if (historialGuardado) historialPedidos = JSON.parse(historialGuardado);
    if (idGuardado) pedidoActualId = parseInt(idGuardado);
}
