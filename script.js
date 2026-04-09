/* ════════════════════════════════════════════════════
    LÓGICA CUSTOMER RISK RADAR · TRAXIÓN 
    Actualizado: Audio, IA Predictiva, Accesibilidad y Carga Excel
════════════════════════════════════════════════════ */

// 1. VARIABLES GLOBALES
let totales = { total: 0, rojo: 0, amarillo: 0, verde: 0 };
let riskChart; 
let vozActiva = false; 
const riskForm = document.getElementById('risk-form');

// --- CONFIGURACIÓN DE AUDIO ---
const audioExito = new Audio('https://actions.google.com/sounds/v1/communication/notification_high_intensity.ogg');
audioExito.load(); 

// 2. FUNCIONES DE ACCESIBILIDAD
document.getElementById('voice-toggle').addEventListener('change', function(e) {
    vozActiva = e.target.checked;
    const icon = document.getElementById('voice-icon');
    
    if (vozActiva) {
        icon.innerText = "🔊";
        hablar("Lectura por voz activada. El sistema describirá los campos y resultados automáticamente.");
    } else {
        icon.innerText = "🔇";
        window.speechSynthesis.cancel();
    }
});

function hablar(texto) {
    if (vozActiva && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const mensaje = new SpeechSynthesisUtterance(texto);
        mensaje.lang = 'es-MX';
        mensaje.rate = 1.1; 
        window.speechSynthesis.speak(mensaje);
    }
}

function activarLecturaCampos() {
    const campos = [
        { id: 'cliente', nombre: 'Nombre de la empresa' },
        { id: 'servicio-actual', nombre: 'Calidad de servicio actual' },
        { id: 'servicio-anterior', nombre: 'Calidad de servicio anterior' },
        { id: 'nps-actual', nombre: 'Nivel de felicidad o N P S' },
        { id: 'quejas-actuales', nombre: 'Número de quejas' },
        { id: 'search-history', nombre: 'Buscador de registros' },
        { id: 'excel-file', nombre: 'Carga de archivo Excel para análisis masivo' }
    ];

    campos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        if (elemento) {
            elemento.addEventListener('focus', () => {
                if (vozActiva) hablar(`Campo: ${campo.nombre}`);
            });
        }
    });
}

// 3. LÓGICA DE EXCEL (CARGA MASIVA)
document.getElementById('excel-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length > 0) {
            hablar(`Se han detectado ${jsonData.length} clientes en el archivo. Iniciando proceso masivo.`);
            procesarLoteExcel(jsonData);
        } else {
            hablar("El archivo parece estar vacío.");
        }
    };
    reader.readAsArrayBuffer(file);
});

async function procesarLoteExcel(datos) {
    const btn = document.getElementById('btn-eval');
    btn.disabled = true;
    btn.innerHTML = '<span>⌛ Procesando Lote...</span>';

    for (const fila of datos) {
        // Mapeo flexible: intenta obtener el dato por nombre de columna exacto o similar
        const clienteNom = fila.Cliente || fila.empresa || fila.Nombre || "Cliente Excel";
        const sAct = parseFloat(fila.ServicioActual) || 0;
        const sAnt = parseFloat(fila.ServicioAnterior) || 0;
        const nps = parseFloat(fila.NPS) || 0;
        const qjs = parseInt(fila.Quejas) || 0;

        // Inyectar en inputs (reutilizando lógica visual)
        document.getElementById('cliente').value = clienteNom;
        document.getElementById('servicio-actual').value = sAct;
        document.getElementById('servicio-anterior').value = sAnt;
        document.getElementById('nps-actual').value = nps;
        document.getElementById('quejas-actuales').value = qjs;

        procesarEvaluacion(); // Ejecuta el análisis
        
        // Pausa breve para efecto visual y no saturar el habla
        await new Promise(r => setTimeout(r, 600));
    }

    btn.disabled = false;
    btn.innerHTML = '🔍 ANALIZAR RIESGO';
    document.getElementById('excel-file').value = ""; // Limpiar input
    hablar("Análisis masivo finalizado. Todos los registros han sido cargados al historial.");
}

// 4. FUNCIONES DE NAVEGACIÓN Y UBICACIÓN
function entrarAlSistema() {
    document.getElementById('splash').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    obtenerUbicacion();
    if(riskChart) riskChart.update();
    hablar("Sistema de Traxión iniciado. Listo para evaluación.");
}

function volverInicio() {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('splash').classList.remove('hidden');
    window.speechSynthesis.cancel();
}

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

// 5. LÓGICA DE EVALUACIÓN
riskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-eval');
    const area = document.getElementById('resultado-area');
    
    btn.disabled = true;
    btn.innerHTML = '<span>⌛ Analizando con IA...</span>';
    area.classList.add('loading-effect');
    
    hablar("Evaluando métricas. Espere un momento.");

    setTimeout(() => {
        procesarEvaluacion();
        btn.disabled = false;
        btn.innerHTML = '🔍 ANALIZAR RIESGO';
        area.classList.remove('loading-effect');
    }, 1200);
});

function sonarExito() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); 
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) { }
}

function procesarEvaluacion() {
    const cliente = document.getElementById('cliente').value;
    const sActual = parseFloat(document.getElementById('servicio-actual').value) || 0;
    const sAnterior = parseFloat(document.getElementById('servicio-anterior').value) || 0;
    const npsActual = parseFloat(document.getElementById('nps-actual').value) || 0;
    const quejasActual = parseInt(document.getElementById('quejas-actuales').value) || 0;

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

    sonarExito();
    mostrarResultadoPredictivo(cliente, riesgo, porcentajeFinal, colorHex);
    actualizarKPIs(riesgo);
    agregarAlHistorial(cliente, sActual, npsActual, riesgo, badgeClass);
    
    if (!document.getElementById('btn-eval').disabled) { // Evitar hablar doble en carga masiva
        const accion = riesgo === 'Alto' ? 'Alerta crítica.' : 'Resultado estable.';
        hablar(`Cliente ${cliente}. Riesgo ${riesgo}. ${accion}`);
    }

    riskForm.reset();
}

// 6. RENDERIZADO Y PDF
function mostrarResultadoPredictivo(nombre, nivel, porcentaje, color) {
    const area = document.getElementById('resultado-area');
    area.innerHTML = `
        <div id="informe-final" class="result-display" style="border-left: 5px solid ${color}; background: #0a0a0a; padding: 20px; border-radius: 12px; color: white;">
            <div style="margin-bottom: 10px;">
                <h3 style="font-size: 0.75rem; color: #888; margin: 0;">CLIENTE: ${nombre.toUpperCase()}</h3>
            </div>
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <span style="color: ${color}; font-weight: 800; font-size: 2rem;">${porcentaje}%</span>
                    <span style="font-size: 0.8rem; color: ${color}; font-weight: 700;">RIESGO ${nivel.toUpperCase()}</span>
                </div>
                <div style="background: #222; height: 6px; border-radius: 3px; margin-top: 8px; overflow: hidden;">
                    <div style="width: ${porcentaje}%; height: 100%; background: ${color};"></div>
                </div>
            </div>
            <button onclick="descargarPDF()" style="width: 100%; background: #c8e000; color: #000; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 800; font-size: 11px;">
                📥 DESCARGAR REPORTE PDF
            </button>
        </div>
    `;
}

function descargarPDF() {
    const elemento = document.getElementById('informe-final');
    if (!elemento) return;
    html2pdf().from(elemento).save('Reporte_Riesgo.pdf');
    hablar("Descargando PDF.");
}

// 7. HISTORIAL Y KPIS
function agregarAlHistorial(cliente, servicio, nps, riesgo, claseBadge) {
    const tbody = document.getElementById('history-body');
    const fila = document.createElement('tr');
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
    else totales.verde++;

    document.getElementById('kpi-total').innerText = totales.total;
    document.getElementById('kpi-rojo').innerText = totales.rojo;
    document.getElementById('kpi-amarillo').innerText = totales.amarillo;
    document.getElementById('kpi-verde').innerText = totales.verde;

    if(riskChart) {
        riskChart.data.datasets[0].data = [totales.verde, totales.amarillo, totales.rojo];
        riskChart.update();
    }
}

// 8. INICIALIZACIÓN
function initChart() {
    const canvas = document.getElementById('riskChart');
    if(!canvas) return;
    riskChart = new Chart(canvas.getContext('2d'), {
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
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    obtenerUbicacion();
    initChart();
    activarLecturaCampos();
});