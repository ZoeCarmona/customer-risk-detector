/* ════════════════════════════════════════════════════
    LÓGICA CUSTOMER RISK RADAR · TRAXIÓN 
    Eje 2: Detección Temprana (Customer Health)
════════════════════════════════════════════════════ */

let totales = { total: 0, rojo: 0, amarillo: 0, verde: 0 };
let riskChart; 
let vozActiva = false; 

// 1. ACCESIBILIDAD Y VOZ (AGENTE CONVERSACIONAL)
document.getElementById('voice-toggle').addEventListener('change', (e) => {
    vozActiva = e.target.checked;
    const icon = document.getElementById('voice-icon');
    icon.innerText = vozActiva ? "🔊" : "🔇";
    if (vozActiva) hablar("Agente conversacional activado. Especificaré cada campo al seleccionarlo.");
});

function hablar(texto) {
    if (vozActiva && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const msj = new SpeechSynthesisUtterance(texto);
        msj.lang = 'es-MX';
        window.speechSynthesis.speak(msj);
    }
}

// NUEVO: Función para especificar campos al presionarlos/enfocarlos
function activarLecturaGuiada() {
    const guiaCampos = [
        { id: 'cliente', txt: 'Nombre de la empresa cliente' },
        { id: 'periodo-actual', txt: 'Mes o periodo actual a evaluar' },
        { id: 'periodo-anterior', txt: 'Mes o periodo anterior para comparar' },
        { id: 'servicio-actual', txt: 'Porcentaje de nivel de servicio actual' },
        { id: 'servicio-anterior', txt: 'Porcentaje de nivel de servicio anterior' },
        { id: 'puntualidad-actual', txt: 'Porcentaje de puntualidad actual' },
        { id: 'puntualidad-anterior', txt: 'Porcentaje de puntualidad anterior' },
        { id: 'nps-actual', txt: 'Nivel de satisfacción del cliente actual' },
        { id: 'nps-anterior', txt: 'Nivel de satisfacción del cliente anterior' },
        { id: 'quejas-actuales', txt: 'Cantidad de quejas abiertas hoy' },
        { id: 'quejas-anteriores', txt: 'Cantidad de quejas del periodo pasado' },
        { id: 'btn-eval', txt: 'Botón para procesar el diagnóstico de riesgo' }
    ];

    guiaCampos.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
            el.addEventListener('focus', () => hablar(`Campo: ${item.txt}`));
        }
    });
}

// 2. LÓGICA DE EVALUACIÓN (REGLAS EJE 2)
document.getElementById('risk-form').addEventListener('submit', (e) => {
    e.preventDefault();
    procesarEvaluacion();
});

function procesarEvaluacion() {
    const cliente = document.getElementById('cliente').value;
    const pActual = document.getElementById('periodo-actual').value;
    
    // Captura de valores numéricos
    const sAct = parseFloat(document.getElementById('servicio-actual').value) || 0;
    const sAnt = parseFloat(document.getElementById('servicio-anterior').value) || 0;
    const puntAct = parseFloat(document.getElementById('puntualidad-actual').value) || 0;
    const puntAnt = parseFloat(document.getElementById('puntualidad-anterior').value) || 0;
    const npsAct = parseFloat(document.getElementById('nps-actual').value) || 0;
    const npsAnt = parseFloat(document.getElementById('nps-anterior').value) || 0;
    const qjAct = parseInt(document.getElementById('quejas-actuales').value) || 0;
    const qjAnt = parseInt(document.getElementById('quejas-anteriores').value) || 0;

    let señalesRojo = 0;
    let señalesAmarillo = 0;
    let diagnostico = [];

    // --- REGLAS DE NEGOCIO ---
    const evaluar = (act, ant, nombre) => {
        const caída = ant - act;
        if (act < 80 || caída >= 10) { señalesRojo++; diagnostico.push(`${nombre} crítico.`); }
        else if (act < 90 || caída >= 5) { señalesAmarillo++; }
    };

    evaluar(sAct, sAnt, "Servicio");
    evaluar(puntAct, puntAnt, "Puntualidad");

    if (npsAnt - npsAct >= 20 || npsAct < 0) { señalesRojo++; diagnostico.push("NPS en caída."); }
    if (qjAct - qjAnt >= 5) { señalesRojo++; diagnostico.push("Alerta de quejas."); }

    // --- CLASIFICACIÓN ---
    let nivel = "Bajo", color = "#2ecc71", recomendacion = "Mantener monitoreo.";
    if (señalesRojo >= 2) { 
        nivel = "Alto"; color = "#e8453c"; recomendacion = "Atención prioritaria inmediata."; 
    } else if (señalesRojo === 1 || señalesAmarillo >= 2) { 
        nivel = "Medio"; color = "#f5a623"; recomendacion = "Contactar al cliente."; 
    }

    renderizarResultado(cliente, nivel, color, diagnostico, recomendacion, pActual);
    hablar(`Resultado para ${cliente}: Riesgo ${nivel}. ${recomendacion}`);
}

// 3. RENDERIZADO Y KPIS
function renderizarResultado(nom, nivel, col, diag, rec, per) {
    const area = document.getElementById('resultado-area');
    const diagTexto = diag.length > 0 ? diag.join(" ") : "Salud estable.";
    
    area.innerHTML = `
        <div class="result-display" style="border-left: 6px solid ${col}; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <h4 style="color: ${col}; margin: 0;">RIESGO ${nivel.toUpperCase()}</h4>
            <p style="font-size: 11px; color: #888;">Periodo: ${per}</p>
            <p style="font-size: 13px; margin: 8px 0;"><strong>Nota:</strong> ${diagTexto}</p>
            <div style="background: ${col}22; padding: 8px; border-radius: 4px; border: 1px solid ${col}44;">
                <p style="font-size: 12px; margin: 0; color: #fff;"><strong>Acción:</strong> ${rec}</p>
            </div>
        </div>
    `;
    actualizarKPIs(nivel);
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

// 4. INICIO DE SISTEMA
function entrarAlSistema() {
    document.getElementById('splash').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    initChart();
    activarLecturaGuiada(); // Activa la voz en los campos al entrar
}

function initChart() {
    const ctx = document.getElementById('riskChart').getContext('2d');
    if (riskChart) riskChart.destroy();
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
        options: { cutout: '75%', plugins: { legend: { display: false } } }
    });
}