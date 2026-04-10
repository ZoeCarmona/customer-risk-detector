/* ════════════════════════════════════════════════════
    LÓGICA CUSTOMER RISK RADAR · TRAXIÓN 
    Eje 2: Detección Temprana (Customer Health)
════════════════════════════════════════════════════ */

let totales = { total: 0, rojo: 0, amarillo: 0, verde: 0 };
let riskChart; 

// --- 1. NÚCLEO DE VOZ (TALKBACK) ---

function hablar(texto) {
    window.speechSynthesis.cancel();
    const mensaje = new SpeechSynthesisUtterance(texto);
    mensaje.lang = 'es-MX';
    mensaje.rate = 1.1; 
    window.speechSynthesis.speak(mensaje);
}

function configurarLecturaCampos() {
    const campos = document.querySelectorAll('input, button, [role="button"]');
    campos.forEach(campo => {
        campo.addEventListener('focus', () => {
            const modoVoz = document.getElementById('voice-toggle').checked;
            if (modoVoz) {
                const etiqueta = document.querySelector(`label[for="${campo.id}"]`)?.innerText 
                                || campo.placeholder 
                                || campo.getAttribute('aria-label') 
                                || "Botón";
                hablar(`Seleccionado: ${etiqueta}`);
            }
        });
    });
}

// --- 2. GEOLOCALIZACIÓN ---

async function obtenerNombreCiudad(lat, lon) {
    const badge = document.getElementById('txt-ubicacion');
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        const ciudad = data.address.city || data.address.town || data.address.village || "Saltillo";
        badge.innerHTML = ciudad;
    } catch (error) {
        badge.innerHTML = "Saltillo, Coahuila";
    }
}

function obtenerUbicacion() {
    const badge = document.getElementById('txt-ubicacion');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => obtenerNombreCiudad(pos.coords.latitude, pos.coords.longitude),
            () => { badge.innerText = "Saltillo, Coahuila"; }
        );
    }
}

// --- 3. CARGA DE EXCEL ---

document.getElementById('excel-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const modoVoz = document.getElementById('voice-toggle').checked;
    if (modoVoz) hablar("Procesando archivo Excel.");

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        jsonData.forEach(fila => {
            const cliente = fila.Cliente || fila.Empresa || "S/N";
            const sAct = parseFloat(fila.ServicioActual || fila.Actual) || 0;
            const sAnt = parseFloat(fila.ServicioAnterior || fila.Anterior) || 0;
            const periodo = fila.Periodo || "Abril 2026";
            evaluarRiesgo(cliente, sAct, sAnt, periodo, false);
        });

        if (modoVoz) hablar(`Carga completada. Se analizaron ${jsonData.length} clientes.`);
    };
    reader.readAsArrayBuffer(file);
});

// --- 4. EVALUACIÓN Y LÓGICA DE RIESGO ---

document.getElementById('risk-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const cliente = document.getElementById('cliente').value;
    const sAct = parseFloat(document.getElementById('servicio-actual').value) || 0;
    const sAnt = parseFloat(document.getElementById('servicio-anterior').value) || 0;
    const periodo = document.getElementById('periodo-actual').value;

    evaluarRiesgo(cliente, sAct, sAnt, periodo, true);
    e.target.reset();
});

function evaluarRiesgo(cliente, sAct, sAnt, periodo, debeHablar) {
    let nivel = "Bajo", color = "#2ecc71", rec = "Mantener estándar.";
    let diag = "Operación normal.";

    if ((sAnt - sAct) >= 10 || sAct < 80) {
        nivel = "Alto"; color = "#e8453c"; rec = "Intervención inmediata.";
        diag = "Caída crítica detectada.";
    } else if ((sAnt - sAct) >= 5) {
        nivel = "Medio"; color = "#f5a623"; rec = "Seguimiento preventivo.";
        diag = "Variación negativa leve.";
    }

    const data = {
        cliente,
        ubicacion: document.getElementById('txt-ubicacion').innerText,
        periodo,
        nivel, color, diagnostico: diag, recomendacion: rec
    };

    renderizarResultado(data);
    agregarAlHistorial(data);
    actualizarKPIs(data.nivel);

    if (debeHablar && document.getElementById('voice-toggle').checked) {
        hablar(`Análisis completado. Riesgo ${nivel}. ${rec}`);
    }
}

function renderizarResultado(data) {
    const area = document.getElementById('resultado-area');
    area.innerHTML = `
        <div style="border-left: 6px solid ${data.color}; padding: 15px; background: rgba(255,255,255,0.05); width: 100%; border-radius: 4px;">
            <h4 style="color: ${data.color}; margin: 0; font-weight: 800;">RIESGO ${data.nivel.toUpperCase()}</h4>
            <p style="font-size: 13px; margin: 5px 0; color: #fff;">${data.cliente}: ${data.diagnostico}</p>
        </div>
    `;
}

function agregarAlHistorial(data) {
    const tabla = document.getElementById('history-body');
    const fila = document.createElement('tr');
    
    // Plantilla de correo
    const asunto = encodeURIComponent(`Seguimiento Operativo - ${data.cliente}`);
    const cuerpo = encodeURIComponent(`Hola,\n\nSe detectó Riesgo ${data.nivel} en ${data.cliente}.\nDiagnóstico: ${data.diagnostico}\nRecomendación: ${data.recomendacion}`);

    fila.innerHTML = `
        <td style="padding:12px;"><strong>${data.cliente}</strong></td>
        <td style="padding:12px;"><small>${data.ubicacion}</small></td>
        <td style="padding:12px;">${data.periodo}</td>
        <td style="padding:12px;"><span style="color:${data.color}; font-weight:bold;">${data.nivel}</span></td>
        <td style="padding:12px; text-align:center;">
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick='descargarReportePDF(${JSON.stringify(data)})' style="background:none; border:none; cursor:pointer; font-size:18px;">📄</button>
                <a href="mailto:?subject=${asunto}&body=${cuerpo}" style="text-decoration:none; font-size:18px;">📧</a>
            </div>
        </td>
    `;
    tabla.prepend(fila);
}

function actualizarKPIs(riesgo) {
    totales.total++;
    const r = riesgo.toLowerCase();
    if (r === 'alto') totales.rojo++;
    else if (r === 'medio') totales.amarillo++;
    else totales.verde++;

    document.getElementById('kpi-total').innerText = totales.total;
    document.getElementById('kpi-verde').innerText = totales.verde;
    document.getElementById('kpi-amarillo').innerText = totales.amarillo;
    document.getElementById('kpi-rojo').innerText = totales.rojo;

    if(riskChart) {
        riskChart.data.datasets[0].data = [totales.verde, totales.amarillo, totales.rojo];
        riskChart.update('active');
    }
}

// --- 5. NAVEGACIÓN Y GRÁFICAS ---

function entrarAlSistema() {
    document.getElementById('splash').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    initChart();
    obtenerUbicacion();
    configurarLecturaCampos();
}

function volverInicio() { location.reload(); }

function initChart() {
    const ctx = document.getElementById('riskChart').getContext('2d');
    if(riskChart) riskChart.destroy();
    riskChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bajo', 'Medio', 'Alto'],
            datasets: [{
                data: [totales.verde, totales.amarillo, totales.rojo],
                backgroundColor: ['#2ecc71', '#f5a623', '#e8453c'],
                borderWidth: 0
            }]
        },
        options: { cutout: '75%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function filtrarEmpresas() {
    let filter = document.getElementById("busqueda-cliente").value.toUpperCase();
    let tr = document.getElementById("history-body").getElementsByTagName("tr");
    for (let i = 0; i < tr.length; i++) {
        let td = tr[i].getElementsByTagName("td")[0];
        if (td) tr[i].style.display = td.textContent.toUpperCase().indexOf(filter) > -1 ? "" : "none";
    }
}

// --- 6. GENERACIÓN DE PDF PROFESIONAL ---
function descargarReportePDF(data) {
    const element = document.createElement('div');
    element.innerHTML = `
        <div style="padding: 40px; font-family: sans-serif; color: #1a1a1a;">
            <div style="border-bottom: 3px solid #c8e000; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="margin: 0;">REPORTE DE RIESGO</h1>
                <p style="color: #666;">Traxión Risk Agente IA</p>
            </div>
            <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p><strong>Cliente:</strong> ${data.cliente}</p>
                <p><strong>Ubicación:</strong> ${data.ubicacion}</p>
                <p><strong>Periodo:</strong> ${data.periodo}</p>
            </div>
            <div style="border: 2px solid ${data.color}; padding: 20px; border-radius: 8px;">
                <h2 style="color: ${data.color}; margin-top: 0;">ESTADO: ${data.nivel.toUpperCase()}</h2>
                <p><strong>Diagnóstico:</strong> ${data.diagnostico}</p>
                <p><strong>Recomendación:</strong> ${data.recomendacion}</p>
            </div>
        </div>
    `;
    html2pdf().set({ margin: 10, filename: `Reporte_${data.cliente}.pdf`, html2canvas: { scale: 2 } }).from(element).save();
}