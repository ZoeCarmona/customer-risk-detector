# Customer Risk Detector - Detección Temprana de Clientes en Riesgo

## 📌 Descripción del Proyecto
Este proyecto implementa un agente que tiene como objetivo analizar métricas operativas básicas de clientes corporativos para identificar señales tempranas de inconformidad o riesgo de cancelación del servicio. A través de reglas simples y comparaciones entre periodos, el sistema permite anticipar problemas y proponer acciones preventivas. El enfoque principal es transformar el análisis reactivo en una gestión proactiva del cliente.

## 🚀 Características Principales
* **Análisis Comparativo:** Solicita y compara información operativa del cliente en dos periodos distintos (actual y anterior) para identificar tendencias.
* **Evaluación por Semáforo:** El agente clasifica cada métrica en tres niveles mediante colores: Verde (saludable), Amarillo (deterioro moderado) y Rojo (deterioro significativo).
* **Clasificación de Riesgo:** Determina si el nivel de riesgo del cliente es Bajo, Medio o Alto a partir de la combinación de las señales de cada métrica.
* **Diagnóstico Automatizado:** Genera una explicación breve y justificada de por qué el cliente cayó en dicho nivel de riesgo.
* **Recomendaciones Accionables:** Propone acciones preventivas concretas, como planes de mejora o contacto inmediato, dependiendo de la gravedad de la situación.
* **Interfaz Conversacional:** Se basa en un flujo guiado que interactúa con el usuario para capturar únicamente los datos necesarios mediante un prototipo web.

## 📊 Métricas Evaluadas
El sistema toma en cuenta las siguientes variables para su diagnóstico:
* **Puntualidad y Nivel de servicio:** Identifica caídas en el rendimiento, marcando alertas rojas si el nivel es menor al 80% o sufre una caída de 10 puntos o más.
* **NPS (Net Promoter Score):** Monitorea variaciones en la satisfacción del cliente, alertando sobre caídas relevantes de puntuación.
* **Quejas Abiertas:** Analiza el volumen de quejas, considerando como deterioro importante un acumulado de más de 5 quejas o un aumento drástico entre periodos.

##
