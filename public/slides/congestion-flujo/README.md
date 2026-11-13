# Módulo Interactivo: Control de Congestión y Control de Flujo TCP (Tahoe vs. Reno · cwnd & rwnd)

Laboratorio didáctico e interactivo de **Control de Congestión y Control de Flujo en TCP**, basado rigurosamente en los modelos teóricos de **Kurose & Ross** (*Computer Networking: A Top-Down Approach*, Cap. 3.5.5 y Cap. 3.7) y **RFC 5681**.

Este módulo fue diseñado para funcionar de forma **100% autónoma (standalone)** o para ser **integrado como una sección dentro de un proyecto web más amplio** (plataformas educativas, aulas virtuales, dashboards institucionales, etc.).

---

## 📁 Estructura del Módulo

```text
├── index.html                  # Interfaz y Dashboard completo autónomo
├── README.md                   # Documentación y guía de integración
├── css/
│   └── style.css               # Estilos responsivos, variables CSS y layout
└── js/
    ├── tcpEngine.js            # Motor matemático y FSM de TCP (Reno, Tahoe, rwnd, colas L3)
    ├── chartEngine.js          # Gráfico dinámico de Congestión (cwnd / ssthresh)
    ├── flowControlChartEngine.js# Gráfico dinámico de Control de Flujo (rwnd, cwnd, min(cwnd, rwnd))
    ├── flowControlVisualizer.js# Visualizador dinámico e interactivo del Balde / Búfer Receptor
    ├── networkVisualizer.js    # Diagrama Espacio-Tiempo (Ladder SVG) y búferes interactivos
    └── uiController.js         # Orquestador de la interfaz, controles y eventos
```

---

## 🚀 Características Principales

1. **Modelado Teórico Completo:**
   * **Arranque Lento (Slow Start):** Crecimiento exponencial de `cwnd` hasta la primera pérdida. No requiere umbrales artificiales previos.
   * **Evitación de Congestión (Congestion Avoidance / AIMD):** Crecimiento lineal (+1 MSS por RTT).
   * **Recuperación Rápida (Fast Recovery - Reno):** Ante 3 ACKs duplicados, $ssthresh = \lfloor cwnd / 2 \rfloor$ y $cwnd = ssthresh + 3\text{ MSS}$, desinflando al recibir el ACK acumulativo.
   * **Pérdida por Timeout (RTO Expirado):** Medida drástica de seguridad tanto en Reno como en Tahoe; colapso incondicional a $1\text{ MSS}$ e inicio de Arranque Lento.
   * **TCP Tahoe vs. TCP Reno:** Selector de comparación lado a lado de ambas curvas dinámicas.

2. **Sector C: Control de Flujo y Modelo Interactivo del Balde (`rwnd` - Kurose & Ross Cap. 3.5.5):**
   * **Arquitectura de Transporte Real:** La conexión TCP se establece directamente entre **PC Estudiantes (172.16.20.10:51842)** en VLAN 20 y **Nginx Proxy Inverso (172.16.10.12:443)** en VLAN 10. Nginx actúa como puerta de enlace proxy hacia el backend **Samba VM (172.16.10.13:445)**.
   * **El Balde / Búfer de Recepción de Nginx:**
     - Capacidad física total: $\text{RcvBuffer} = 16\text{ MSS}$ ($23,360\text{ B}$).
     - Nivel de líquido animado: Datos retenidos en el socket de Nginx $= \text{LastByteRcvd} - \text{LastByteRead}$.
     - Espacio libre en el balde: $\mathbf{VentanaRecepcion\ (rwnd) = RcvBuffer - (LastByteRcvd - LastByteRead)}$.
     - Límite real de envío: $\text{Ventana Efectiva} = \min(cwnd, rwnd)$.
     - **Efecto Backpressure:** Si el backend Samba VM se sobrecarga por escritura lenta en disco, Nginx no puede vaciar su búfer hacia Samba. El balde de Nginx se satura, Nginx reduce su $\text{rwnd}$ anunciado a la PC y colapsa a $\text{rwnd} = 0$, frenando a los estudiantes mediante control de flujo.
   * **Interactividad Dinámica Paso a Paso:**
     - Botón `[📥 Enviar a Nginx (+2 MSS)]`: El emisor transmite datos que entran al búfer de Nginx.
     - Botón `[🔄 Nginx Reenvía a Samba (-2 MSS)]`: Nginx procesa datos del búfer y los reenvía por red interna a Samba VM.
     - Botón `[⚡ Saturar Búfer (rwnd = 0)]`: Simula congestión en backend Samba, llenando el balde de Nginx y activando la **Sonda de 1 Byte (Zero-Window Probe)**.
     - Botón `[🧹 Vaciar Búfer]`: Descongestión total por reenvío a Samba y reapertura de ventana con ACK Window Update.
     - Botón `[▶ Simulación Dinámica]`: Ejecución automática con selector de velocidad del backend Samba (Lento, Normal, Rápido, Bloqueado).

3. **Diagrama Espacio-Tiempo (Ladder Diagram Kurose & Ross):**
   * Líneas diagonales de transmisión con pendientes realistas de propagación.
   * Flechas con puntas direccionales explícitas (`sec=...` en el margen derecho de Host B y `ack=...` en el margen izquierdo de Host A).
   * Señalización de pérdidas con interrupción diagonal y cruz roja ❌.
   * ACKs duplicados diferenciados (dup #1, dup #2, dup #3 ➔ Fast Retransmit) y ACK acumulativo posterior a la retransmisión.
   * Inspector interactivo: click sobre cualquier segmento para ver cabeceras y números de secuencia independientes (Full Duplex).

4. **Búferes TCP Funcionales e Interactivos:**
   * **Búfer Emisor (Host A):** Segmentos reconocidos, en vuelo (`cwnd`) y por enviar.
   * **Cola del Router L3 (Cisco Catalyst C9200):** Búfer FIFO configurable (8, 16, 24 paquetes). Si la ráfaga supera la capacidad, los paquetes excedentes se descartan físicamente (`[COLA LLENA EN C9200]`), forzando la reacción de TCP.
   * **Búfer Receptor (Host B):** Bytes entregados continuamente a la aplicación y segmentos fuera de orden retenidos.

5. **Tecnología Ligera y sin Dependencias:**
   * **Cero dependencias externas:** No requiere Node.js, npm, Webpack ni librerías pesadas.
   * Funciona directamente abriendo `index.html` en cualquier navegador web moderno (Chrome, Edge, Firefox, Safari).

---

## 🛠️ Guía de Integración en un Proyecto Más Amplio

Dependiendo de la arquitectura del proyecto receptor, existen dos métodos recomendados:

### Opción 1: Integración rápida y aislada mediante `<iframe>` (Recomendada)
Es la solución más limpia y robusta si el proyecto principal ya posee su propio framework (React, Vue, Angular, Laravel, Django, WordPress) o estilos globales que podrían interferir:

```html
<!-- En la página o sección donde quieras mostrar el simulador -->
<div class="modulo-tcp-container" style="width: 100%; max-width: 1600px; margin: 0 auto;">
  <iframe 
    src="ruta/al/modulo/index.html" 
    width="100%" 
    height="1200px" 
    style="border: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);"
    title="Simulador de Control de Congestión y Flujo TCP">
  </iframe>
</div>
```

---

### Opción 2: Integración Nativa en el DOM

Si deseas fusionar el código directamente dentro de una vista o componente del proyecto principal:

1. **Incluir los estilos:**
   Enlaza `css/style.css` en tu encabezado o impórtalo en tu archivo SASS/CSS principal:
   ```html
   <link rel="stylesheet" href="css/style.css">
   ```

2. **Copiar el contenedor HTML:**
   Copia el bloque `<div class="dashboard-layout"> ... </div>` de `index.html` dentro de la sección o página correspondiente de tu aplicación.

3. **Cargar los scripts al final de la página (o importarlos como módulos):**
   ```html
   <script src="js/tcpEngine.js"></script>
   <script src="js/chartEngine.js"></script>
   <script src="js/flowControlChartEngine.js"></script>
   <script src="js/networkVisualizer.js"></script>
   <script src="js/uiController.js"></script>
   ```

4. **Uso como módulo JavaScript (API Programática):**
   Cada clase exporta su módulo de forma compatible tanto con navegadores (`window.TCPEngine`) como con Node.js / ES Modules (`module.exports`).
   
   Ejemplo de inicialización manual:
   ```javascript
   // Crear motor de simulación con configuración personalizada
   const engine = new TCPEngine({
     algorithm: 'RENO',       // 'RENO' o 'TAHOE'
     mss: 1460,               // Tamaño de segmento en bytes
     bufferCapacity: 8,       // Ranuras del router cuello de botella
     enforceBufferLimit: true, // Descarte físico ante cola llena
     receiverProfile: 'NGINX_NORMAL' // 'NGINX_NORMAL', 'SAMBA_SLOW', 'BLOCKED_ZERO_WINDOW'
   });

   // Ejecutar una ronda de transmisión
   const telemetria = engine.executeTransmissionRound();
   console.log('cwnd actual:', telemetria.cwndMSS, 'rwnd actual:', telemetria.rwndMSS, 'efectiva:', telemetria.effectiveWindowMSS);
   ```

---

## ⚙️ Escenarios Guiados Preconfigurados

El simulador cuenta con 4 escenarios educativos listos para usar:
1. **Crecimiento y 3 ACKs Duplicados:** Arranque Lento hasta $\text{cwnd}=8$, pérdida de un paquete, 3 ACKs duplicados, creación de $\text{ssthresh}=4$ y Fast Recovery (Kurose Fig. 3.53).
2. **Pérdida por Timeout (RTO):** Demostración de la medida drástica de seguridad ante expiración del temporizador; colapso a $1\text{ MSS}$ en ambos algoritmos.
3. **Diente de Sierra (AIMD Permanente):** Sondeo lineal (+1 MSS por RTT) y reducción multiplicativa ($cwnd/2$) periódica (Kurose Fig. 3.54).
4. **Descarte por Búfer L3 Lleno:** Saturación física de la cola del router Cisco C9200 y reacción de control de flujo.

---

## 📄 Licencia y Créditos
* **Cátedra:** Redes de Datos · Universidad Tecnológica Nacional (FRM).
* **Proyecto Didáctico:** Escuela 4-025 Los Corralitos.
* **Estándar Teórico:** Kurose & Ross (*Computer Networking: A Top-Down Approach*) y RFC 5681.

