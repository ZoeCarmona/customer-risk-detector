// script.js

// 1. FUNCIONES DE NAVEGACIÓN (Cambio de pantallas)
function entrarAlSistema() {
    document.getElementById('splash').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
}

function volverInicio() {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('splash').classList.remove('hidden');
}

// 2. LÓGICA DE EVALUACIÓN
const riskForm = document.getElementById('risk-form');

riskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Obtener valores
    const cliente = document.getElementById('cliente').value;
    const sActual = parseFloat(document.getElementById('servicio-actual').value);
    const sAnterior = parseFloat(document.getElementById('servicio-anterior').value);
    const npsActual = parseFloat(document.getElementById('nps-actual').value);
    const quejasActual = parseInt(document.getElementById('quejas-actuales').value);

    // Lógica simple de semáforo
    let riesgo = "Bajo";
    let colorClass = "status--green";
    let icono = "🟢";

    // Condición de Riesgo Alto: Servicio bajo o NPS muy negativo o muchas quejas
    if (sActual < 80 || npsActual < 0 || quejasActual > 5 || sActual < sAnterior) {
        riesgo = "Alto";
        colorClass = "status--red";
        icono = "🔴";
    } 
    // Condición de Riesgo Medio
    else if (sActual < 90 || npsActual < 30 || quejasActual > 2) {
        riesgo = "Medio";
        colorClass = "status--amber";
        icono = "🟡";
    }

    mostrarResultado(cliente, riesgo, colorClass, icono);
    actualizarKPIs(riesgo);
});

// 3. RENDERIZADO DE RESULTADOS
function mostrarResultado(nombre, nivel, clase, icono) {
    const area = document.getElementById('resultado-area');
    
    area.innerHTML = `
        <div class="result-display ${clase}">
            <div class="result-badge">${icono} Riesgo ${nivel}</div>
            <h3>Análisis para: ${nombre}</h3>
            <p>El Agente de IA ha detectado que el cliente se encuentra en un estado de <strong>riesgo ${nivel.toLowerCase()}</strong>.</p>
            
            <div class="recommendations">
                <h4>Acciones sugeridas:</h4>
                <ul>
                    ${nivel === 'Alto' ? 
                        '<li>Agendar visita presencial urgente.</li><li>Revisar cuellos de botella en operación.</li>' : 
                        nivel === 'Medio' ? 
                        '<li>Llamada de seguimiento de CS.</li><li>Enviar reporte de mejoras.</li>' : 
                        '<li>Mantener monitoreo estándar.</li><li>Solicitar testimonial.</li>'}
                </ul>
            </div>
        </div>
    `;
}

// 4. CONTADORES (KPIs)
let totales = { total: 0, rojo: 0, amarillo: 0, verde: 0 };

function actualizarKPIs(riesgo) {
    totales.total++;
    if (riesgo === 'Alto') totales.rojo++;
    else if (riesgo === 'Medio') totales.amarillo++;
    else totales.verde++;

    document.getElementById('kpi-total').innerText = totales.total;
    document.getElementById('kpi-rojo').innerText = totales.rojo;
    document.getElementById('kpi-amarillo').innerText = totales.amarillo;
    document.getElementById('kpi-verde').innerText = totales.verde;
}