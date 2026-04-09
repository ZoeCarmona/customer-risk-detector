/* ════════════════════════════════════════════════════
   LÓGICA CUSTOMER RISK RADAR · TRAXIÓN
   Actualizado: Audio Precargado y Feedback de Seguridad
════════════════════════════════════════════════════ */

// 1. VARIABLES GLOBALES
let totales = { total: 0, rojo: 0, amarillo: 0, verde: 0 };
let riskChart; 
const riskForm = document.getElementById('risk-form');

// --- CONFIGURACIÓN DE AUDIO (Zero Learning) ---
// Usamos una notificación clara y ligera de Google
const audioExito = new Audio('https://actions.google.com/sounds/v1/communication/notification_high_intensity.ogg');
audioExito.load(); 

// 2. FUNCIONES DE NAVEGACIÓN
function entrarAlSistema() {
    document.getElementById('splash').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    obtenerUbicacion();
    if(riskChart) riskChart.update();
}

function volverInicio() {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('splash').classList.remove('hidden');
}

// 3. UBICACIÓN EN TIEMPO REAL
function obtenerUbicacion() {
    const locSpan = document.getElementById('user-location');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude: lat, longitude: lon } = pos.coords;
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                .then(r => r.json())
                .then(data => {
                    const ciudad = data.address.city || data.address.town || "SALTILLO, MX";
                    locSpan.innerText = ciudad.toUpperCase();
                })
                .catch(() => locSpan.innerText = "SALTILLO, MX");
        }, () => locSpan.innerText = "COAHUILA, MX");
    }
}

// 4. LÓGICA DE EVALUACIÓN
riskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-eval');
    const area = document.getElementById('resultado-area');
    
    btn.disabled = true;
    btn.innerHTML = '<span>⌛ Generando Informe IA...</span>';
    area.classList.add('loading-effect'); // Animación de parpadeo

    setTimeout(() => {
        procesarEvaluacion();
        btn.disabled = false;
        btn.innerText = 'Evaluar Riesgo Ahora';
        area.classList.remove('loading-effect');
    }, 1200);
});

// 1. Nueva función que genera un tono "beep" limpio sin archivos externos
function sonarExito() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine'; // Tono suave tipo notificación
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota La (A5)
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
        console.log("Audio no soportado");
    }
}

// 2. Modifica tu función principal para llamar al sonido justo al terminar la carga
function procesarEvaluacion() {
    const cliente = document.getElementById('cliente').value;
    const sActual = parseFloat(document.getElementById('servicio-actual').value);
    const sAnterior = parseFloat(document.getElementById('servicio-anterior').value);
    const npsActual = parseFloat(document.getElementById('nps-actual').value);
    const quejasActual = parseInt(document.getElementById('quejas-actuales').value);

    // Lógica de cálculo (mantén la que ya tienes)
    let scoreRiesgo = (100 - sActual) + (quejasActual * 8);
    if (sActual < sAnterior) scoreRiesgo += 15;
    if (npsActual < 0) scoreRiesgo += 25;

    const porcentajeFinal = Math.min(Math.max(scoreRiesgo, 5), 98); 
    let riesgo = "Bajo", colorHex = "#2ecc71", badgeClass = "badge-bajo";
    
    if (porcentajeFinal > 70) { 
        riesgo = "Alto"; colorHex = "#e8453c"; badgeClass = "badge-alto"; 
    } else if (porcentajeFinal > 40) { 
        riesgo = "Medio"; colorHex = "#f5a623"; badgeClass = "badge-amarillo"; 
    }

    // LLAMADA AL SONIDO: Esto se ejecutará cuando se genere el resultado
    sonarExito();

    mostrarResultadoPredictivo(cliente, riesgo, porcentajeFinal, colorHex);
    actualizarKPIs(riesgo);
    agregarAlHistorial(cliente, sActual, npsActual, riesgo, badgeClass);
    riskForm.reset();
}

// 5. RENDERIZADO Y PDF
function mostrarResultadoPredictivo(nombre, nivel, porcentaje, color) {
    const area = document.getElementById('resultado-area');
    // Capturamos valores antes de limpiar el form para el reporte
    const sActual = document.getElementById('servicio-actual').value;
    const quejas = document.getElementById('quejas-actuales').value;

    area.innerHTML = `
        <div id="informe-final" class="result-display" style="border-left: 5px solid ${color}; background: #0a0a0a; padding: 20px; border-radius: 12px; color: white;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="font-size: 0.8rem; color: #888; margin: 0;">INFORME: ${nombre.toUpperCase()}</h3>
                <span style="font-size: 10px; color: #555;">${new Date().toLocaleString()}</span>
            </div>
            
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
                    <span style="color: ${color}; font-weight: 800; font-size: 1.8rem;">${porcentaje}%</span>
                    <span style="font-size: 0.7rem; color: ${color}; font-weight: 700;">RIESGO ${nivel.toUpperCase()}</span>
                </div>
                <div style="background: #1a1a1a; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${porcentaje}%; height: 100%; background: ${color};"></div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                    <small style="color: #666; display: block; margin-bottom: 4px;">CALIDAD</small><strong>${sActual}%</strong>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                    <small style="color: #666; display: block; margin-bottom: 4px;">QUEJAS</small><strong>${quejas}</strong>
                </div>
            </div>

            <p style="font-size: 0.75rem; color: #bbb; margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px;">
                <strong>Acción:</strong> ${nivel === 'Alto' ? '🚨 Contactar al cliente ahora mismo.' : '✅ Mantener monitoreo estándar.'}
            </p>

            <button onclick="descargarPDF()" style="width: 100%; background: #c8e000; color: #000; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 900; font-size: 12px; text-transform: uppercase;">
                📥 GUARDAR REPORTE PDF
            </button>
        </div>
    `;
}

function descargarPDF() {
    const elemento = document.getElementById('informe-final'); // Usamos el ID específico del informe generado
    
    if (!elemento) {
        alert("Primero genera un diagnóstico para poder descargar el reporte.");
        return;
    }

    const opciones = {
        margin:       [10, 10], // Margen superior e inferior
        filename:     'Reporte_Riesgo_Traxion.pdf',
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { 
            scale: 3, // Mayor resolución para que no se vea pixeleado
            useCORS: true, 
            backgroundColor: '#0a0a0a', // Forzamos el color de fondo oscuro de Traxión
            letterRendering: true
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Añadimos una clase temporal para asegurar que el texto sea blanco y se vea bien en el PDF
    elemento.style.color = "white";
    
    html2pdf().set(opciones).from(elemento).save().then(() => {
        // Restauramos estilos si es necesario después de guardar
        console.log("PDF generado con éxito");
    });
}
// 6. HISTORIAL Y BUSCADOR
function agregarAlHistorial(cliente, servicio, nps, riesgo, claseBadge) {
    const tbody = document.getElementById('history-body');
    const fila = document.createElement('tr');
    fila.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
    fila.innerHTML = `
        <td style="padding: 12px;">${cliente}</td>
        <td style="padding: 12px;">${servicio}%</td>
        <td style="padding: 12px;">${nps}</td>
        <td style="padding: 12px;"><span class="badge ${claseBadge}">${riesgo}</span></td>
    `;
    tbody.insertBefore(fila, tbody.firstChild);
}

function actualizarKPIs(riesgo) {
    totales.total++;
    if (riesgo === 'Alto') totales.rojo++;
    else if (riesgo === 'Medio') totales.amarillo++;
    else {
        totales.verde++;
        const contadorDias = document.getElementById('dias-sin-incidentes');
        contadorDias.innerText = parseInt(contadorDias.innerText) + 1;
    }

    document.getElementById('kpi-total').innerText = totales.total;
    document.getElementById('kpi-rojo').innerText = totales.rojo;
    document.getElementById('kpi-amarillo').innerText = totales.amarillo;
    document.getElementById('kpi-verde').innerText = totales.verde;

    if(riskChart) {
        riskChart.data.datasets[0].data = [totales.verde, totales.amarillo, totales.rojo];
        riskChart.update();
    }
}

document.getElementById('search-history').addEventListener('keyup', function() {
    const valor = this.value.toLowerCase();
    const filas = document.querySelectorAll('#history-body tr');
    filas.forEach(fila => {
        const textoFila = fila.querySelector('td:first-child').innerText.toLowerCase();
        fila.style.display = textoFila.includes(valor) ? '' : 'none';
    });
});

// 7. INICIALIZACIÓN
function initChart() {
    const ctx = document.getElementById('riskChart').getContext('2d');
    riskChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Seguro', 'Medio', 'Crítico'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#2ecc71', '#f5a623', '#e8453c'],
                borderWidth: 0,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    obtenerUbicacion();
    initChart();
});