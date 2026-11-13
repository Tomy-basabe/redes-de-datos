/**
 * networkVisualizer.js - Visualizador Espacio-Tiempo TCP (Ladder Diagram de Kurose & Ross)
 * 
 * Implementación fiel a la Figura del libro (Image 1):
 * - Host A (PC Estudiantes, VLAN 20, 172.16.20.10) a la izquierda.
 * - Host B (Servidor Nginx, VLAN 10, 172.16.10.12:443) a la derecha.
 * - Ejes temporales verticales hacia abajo (Tiempo ⬇).
 * - Flechas diagonales con pendiente real de propagación:
 *   * Segmentos de Datos (Host A -> Host B) con sec=X, Y bytes de datos, ack=Z.
 *   * Pérdida indicada con interrupción y cruz roja (❌).
 *   * Segmentos de ACK (Host B -> Host A) con ack=X, sec=Z.
 *   * ACKs duplicados explícitos (ack=X dup #1, dup #2, dup #3).
 *   * Flecha de Retransmisión Rápida / Timeout retransmitiendo el segmento faltante.
 * 
 * Búferes 100% funcionales y pedagógicos:
 * 1. Send Buffer (Host A): Enviado y reconocido, Enviado sin reconocer (cwnd), Listo para enviar, Libre.
 * 2. Router Bottleneck Buffer (Cisco C9200): Ranuras de cola FIFO con descarte por saturación.
 * 3. Receive Buffer (Host B - Nginx): Bytes continuos entregados y paquetes fuera de orden retenidos.
 */

class NetworkVisualizer {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      mss: options.mss || 1460,
      clientIP: '172.16.20.10',
      clientVLAN: 'VLAN 20 (Estudiantes)',
      clientPort: 51842,
      serverIP: '172.16.10.12',
      serverPort: 443,
      serverVLAN: 'VLAN 10 (Gestión)'
    };

    this.selectedItem = null;
    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="ladder-diagram-wrapper">
        <!-- Encabezado de Extremos Lógicos -->
        <div class="ladder-header-bar">
          <div class="host-pill host-a-pill">
            <div class="host-avatar">💻</div>
            <div class="host-meta">
              <span class="host-name">Host A · PC Estudiantes</span>
              <span class="host-ip">${this.options.clientIP} (${this.options.clientVLAN})</span>
              <span class="host-isn">ISN Origen: <strong id="lbl-client-isn">1000</strong> · Puerto: ${this.options.clientPort}</span>
            </div>
          </div>

          <div class="channel-core-info">
            <span class="core-title">Canal L3 Inter-VLAN · Cisco Catalyst C9200</span>
            <span class="core-sub">Diagrama Espacio-Tiempo</span>
          </div>

          <div class="host-pill host-b-pill">
            <div class="host-avatar">🛡️</div>
            <div class="host-meta">
              <span class="host-name">Host B · Servidor Nginx</span>
              <span class="host-ip">${this.options.serverIP}:${this.options.serverPort} (${this.options.serverVLAN})</span>
              <span class="host-isn">ISN Destino: <strong id="lbl-server-isn">50000</strong> · HTTPS</span>
            </div>
          </div>
        </div>

        <!-- Área de Dibujo del Diagrama de Tiempo (SVG Ladder) -->
        <div class="ladder-canvas-container" id="ladder-scroll-area">
          <svg class="ladder-svg" id="ladder-svg" viewBox="0 0 1100 400" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <!-- Marcador de flecha de Datos (Azul cielo oscuro) -->
              <marker id="arrow-data" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
              </marker>
              <!-- Marcador de Retransmisión (Violeta/Indigo) -->
              <marker id="arrow-retx" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#7c3aed" />
              </marker>
              <!-- Marcador de ACK Válido (Verde) -->
              <marker id="arrow-ack" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
              </marker>
              <!-- Marcador de ACK Duplicado (Ámbar) -->
              <marker id="arrow-dupack" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#d97706" />
              </marker>
            </defs>

            <!-- Ejes de Tiempo Verticales Dotted (Host A en x=240, Host B en x=860, Canvas Ancho=1100) -->
            <g id="ladder-timeline-axes">
              <!-- Eje Host A -->
              <line x1="240" y1="25" x2="240" y2="2000" stroke="#94a3b8" stroke-width="2" stroke-dasharray="3,3" />
              <text x="240" y="16" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700" fill="#64748b">Host A (Tiempo ⬇)</text>

              <!-- Eje Host B -->
              <line x1="860" y1="25" x2="860" y2="2000" stroke="#94a3b8" stroke-width="2" stroke-dasharray="3,3" />
              <text x="860" y="16" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700" fill="#64748b">Host B (Tiempo ⬇)</text>
            </g>

            <!-- Capa dinámica de flechas y etiquetas de transmisión -->
            <g id="ladder-arrows-layer"></g>
          </svg>

          <!-- Marcador de inicio cuando no hay transmisiones -->
          <div class="ladder-empty-placeholder" id="ladder-empty">
            <span>Presioná <strong>"Iniciar Simulación"</strong> o <strong>"Paso +"</strong> para observar las líneas diagonales de transmisión.</span>
          </div>
        </div>

        <!-- Inspector de Línea / Paquete Seleccionado -->
        <div class="ladder-inspector-box" id="ladder-inspector">
          <div class="ins-title">Inspector de Transmisión TCP (Click en cualquier flecha para analizar)</div>
          <div class="ins-content" id="ladder-inspector-content">
            <span class="ins-placeholder">Hacé click en cualquier flecha diagonal para inspeccionar los números de secuencia y reconocimientos independientes en bytes.</span>
          </div>
        </div>
      </div>
    `;

    this.renderRouterSlots(8, 0);
  }

  renderRouterSlots(capacity, used, state = 'normal') {
    const container = document.getElementById('router-queue-slots');
    if (!container) return;

    let html = '';
    const safeCap = Math.max(4, Math.min(24, capacity));
    const fillClass = state === 'danger' ? 'r-slot-danger' : state === 'warn' ? 'r-slot-warn' : 'r-slot-filled';
    for (let i = 0; i < safeCap; i++) {
      const isFilled = i < used;
      html += `<div class="r-slot ${isFilled ? fillClass : ''}"></div>`;
    }
    container.innerHTML = html;
  }

  updateTelemetry(telemetry) {
    const {
      clientISN,
      serverISN,
      cwndMSS,
      cwndBytes,
      mss,
      clientBuffer,
      routerQueue,
      serverBuffer,
      transmissionEvents
    } = telemetry;

    const lblClientISN = document.getElementById('lbl-client-isn');
    if (lblClientISN) lblClientISN.textContent = clientISN;

    const lblServerISN = document.getElementById('lbl-server-isn');
    if (lblServerISN) lblServerISN.textContent = serverISN;

    // 1. Actualizar Búfer Emisor (Cliente Host A)
    const currentMss = mss || 1460;
    const currentInFlight = Math.round(cwndBytes);
    const ackedBytes = clientBuffer.ackedBytes || 0;

    // Escala adaptativa para que el búfer emisor sea perfectamente reactivo y visible con cualquier MSS (1 B o 1460 B):
    const displayWindowMax = Math.max(16 * currentMss, (ackedBytes + currentInFlight) * 1.35);
    const inFlightPct = Math.min(65, Math.max(10, (currentInFlight / displayWindowMax) * 100));
    const ackedPct = ackedBytes > 0 
      ? Math.min(100 - inFlightPct - 5, Math.max(8, (ackedBytes / displayWindowMax) * 100))
      : 0;
    const readyPct = Math.max(0, 100 - ackedPct - inFlightPct);

    const bClientAcked = document.getElementById('b-client-acked');
    if (bClientAcked) bClientAcked.style.width = `${ackedPct}%`;

    const bClientInflight = document.getElementById('b-client-inflight');
    if (bClientInflight) bClientInflight.style.width = `${inFlightPct}%`;

    const bClientReady = document.getElementById('b-client-ready');
    if (bClientReady) bClientReady.style.width = `${readyPct}%`;

    const bClientStatus = document.getElementById('b-client-status');
    if (bClientStatus) {
      bClientStatus.textContent = `${currentInFlight.toLocaleString()} B enviados sin reconocer (${cwndMSS} MSS)`;
    }

    // 2. Actualizar Búfer de Cola del Router
    const qCap = routerQueue.capacityPkts || 8;
    const lastRoundEvent = transmissionEvents && transmissionEvents.length > 0 
      ? transmissionEvents[transmissionEvents.length - 1] 
      : null;
    const isQueueCongested = lastRoundEvent && lastRoundEvent.lossType === 'QUEUE_DROP';
    const pktsSent = lastRoundEvent 
      ? lastRoundEvent.packets.filter(p => !p.isRetransmission).length 
      : Math.round(cwndMSS);
    const qUsed = Math.min(pktsSent, qCap);
    const slotState = isQueueCongested ? 'danger' : qUsed >= qCap ? 'warn' : 'normal';
    this.renderRouterSlots(qCap, qUsed, slotState);

    const bRouterStatus = document.getElementById('b-router-status');
    if (bRouterStatus) {
      if (isQueueCongested) {
        const droppedCount = Math.max(1, pktsSent - qCap);
        bRouterStatus.textContent = `¡COLA SATURADA! (${qCap} / ${qCap}) ➔ ${droppedCount} descarte(s) por desbordamiento`;
        bRouterStatus.style.color = '#ef4444';
      } else if (qUsed >= qCap) {
        bRouterStatus.textContent = `Cola Llena (${qUsed} / ${qCap} Paquetes)`;
        bRouterStatus.style.color = '#ea580c';
      } else {
        bRouterStatus.textContent = `${qUsed} / ${qCap} Paquetes`;
        bRouterStatus.style.color = '#0284c7';
      }
    }

    // 3. Actualizar Búfer Receptor (Servidor Nginx Host B)
    const oooSegments = serverBuffer.outOfOrderSegments || [];
    const oooCount = oooSegments.length;
    const bServerDelivered = document.getElementById('b-server-delivered');
    const bServerOoo = document.getElementById('b-server-ooo');
    const bServerStatus = document.getElementById('b-server-status');

    if (oooCount > 0) {
      const oooPct = Math.min(60, Math.max(25, oooCount * 12));
      const deliveredPct = Math.max(15, Math.min(100 - oooPct, ackedPct > 0 ? ackedPct : 35));
      if (bServerDelivered) bServerDelivered.style.width = `${deliveredPct}%`;
      if (bServerOoo) bServerOoo.style.width = `${oooPct}%`;
      if (bServerStatus) {
        bServerStatus.textContent = `¡${oooCount} segm. fuera de orden retenidos en búfer!`;
        bServerStatus.style.color = '#ea580c';
      }
    } else {
      const deliveredPct = Math.min(100, Math.max(10, ackedPct > 0 ? ackedPct : 15));
      if (bServerDelivered) bServerDelivered.style.width = `${deliveredPct}%`;
      if (bServerOoo) bServerOoo.style.width = '0%';
      if (bServerStatus) {
        bServerStatus.textContent = '0 desordenados (Flujo continuo entregado a Nginx)';
        bServerStatus.style.color = '#059669';
      }
    }

    // Dibujar el Ladder Diagram
    this.renderLadderDiagram(transmissionEvents || []);
  }

  /**
   * Genera el Diagrama Espacio-Tiempo (Ladder Diagram) con pendientes realistas
   * según la Figura de Kurose & Ross (Image 1).
   */
  renderLadderDiagram(events) {
    const svgLayer = document.getElementById('ladder-arrows-layer');
    const emptyNotice = document.getElementById('ladder-empty');
    const svgEl = document.getElementById('ladder-svg');
    const scrollArea = document.getElementById('ladder-scroll-area');
    if (!svgLayer || !svgEl) return;

    svgLayer.innerHTML = '';

    if (!events || events.length === 0) {
      if (emptyNotice) emptyNotice.style.display = 'flex';
      svgEl.setAttribute('viewBox', '0 0 1100 400');
      return;
    }

    if (emptyNotice) emptyNotice.style.display = 'none';

    // Parámetros espaciales óptimos para ubicar los textos en el espacio en blanco (Kurose & Ross)
    const xHostA = 240; // Eje temporal Host A (Margen izquierdo 0-240 px para ACKs, RTT y Timers)
    const xHostB = 860; // Eje temporal Host B (Margen derecho 860-1100 px para Segmentos de Datos y Retx)
    const arrowDx = xHostB - xHostA; // 620 px ancho del canal
    const propY = 50; // Caída vertical (pendiente de propagación)

    let currentY = 35;
    let lastRoundStartY = 35;

    events.forEach((roundEvent) => {
      const packets = roundEvent.packets || [];
      const acks = roundEvent.acks || [];
      const numPackets = packets.length;

      const roundStartY = currentY;
      lastRoundStartY = roundStartY;
      const pktSpacing = 24; // Espaciado óptimo entre salidas de paquetes dentro de la ráfaga

      // Etiqueta visual de RTT a la izquierda (en el margen blanco x < 240)
      const rttLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      rttLabel.setAttribute('x', '16');
      rttLabel.setAttribute('y', roundStartY + 14);
      rttLabel.setAttribute('font-family', "'JetBrains Mono', monospace");
      rttLabel.setAttribute('font-size', '11');
      rttLabel.setAttribute('font-weight', '800');
      rttLabel.setAttribute('fill', roundEvent.lossType ? '#ef4444' : '#0284c7');
      rttLabel.textContent = `RTT ${roundEvent.round}`;
      svgLayer.appendChild(rttLabel);

      // Separar paquetes iniciales de la retransmisión
      const initialPackets = packets.filter(p => !p.isRetransmission);
      const retxPacket = packets.find(p => p.isRetransmission);

      // Separar ACKs iniciales del ACK posterior a la retransmisión
      const initialAcks = acks.filter(a => !a.isCumulative && !a.isTimeoutAck && !a.text.includes('(Acumulativo)') && !a.text.includes('(Post-Timeout)'));
      const postRetxAck = acks.find(a => a.isCumulative || a.isTimeoutAck || a.text.includes('(Acumulativo)') || a.text.includes('(Post-Timeout)'));

      // Mapa para rastrear tiempos de llegada de paquetes a Host B y ACKs a Host A
      const packetArriveTimes = [];
      let yDup3ArrivalAtA = null;
      let maxYReached = roundStartY;

      // 1. Trazar paquetes iniciales de la ráfaga (Host A -> Host B)
      initialPackets.forEach((pkt, idx) => {
        const yLaunch = roundStartY + (idx * pktSpacing);
        const yArrive = yLaunch + propY;
        packetArriveTimes[idx] = yArrive;
        if (yArrive > maxYReached) maxYReached = yArrive;

        if (pkt.isLost) {
          // Paquete perdido: flecha interrumpida en el canal con círculo y cruz roja (Kurose & Ross)
          const isQueueDrop = pkt.dropReason && (pkt.dropReason.includes('cola') || pkt.dropReason.includes('C9200'));
          const midRatio = isQueueDrop ? 0.50 : 0.52;
          const xDrop = xHostA + (arrowDx * midRatio);
          const yDrop = yLaunch + (propY * midRatio);

          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', xHostA);
          line.setAttribute('y1', yLaunch);
          line.setAttribute('x2', xDrop);
          line.setAttribute('y2', yDrop);
          line.setAttribute('stroke', '#ef4444');
          line.setAttribute('stroke-width', '2.2');
          line.setAttribute('stroke-dasharray', '5,3');
          line.setAttribute('cursor', 'pointer');
          svgLayer.appendChild(line);

          // Círculo rojo y cruz blanca '✕' SVG garantizada
          const gCross = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', xDrop);
          circle.setAttribute('cy', yDrop);
          circle.setAttribute('r', '7.5');
          circle.setAttribute('fill', '#ef4444');
          circle.setAttribute('stroke', '#ffffff');
          circle.setAttribute('stroke-width', '1.5');
          gCross.appendChild(circle);

          const cross1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          cross1.setAttribute('x1', xDrop - 3.5);
          cross1.setAttribute('y1', yDrop - 3.5);
          cross1.setAttribute('x2', xDrop + 3.5);
          cross1.setAttribute('y2', yDrop + 3.5);
          cross1.setAttribute('stroke', '#ffffff');
          cross1.setAttribute('stroke-width', '2');
          cross1.setAttribute('stroke-linecap', 'round');
          gCross.appendChild(cross1);

          const cross2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          cross2.setAttribute('x1', xDrop + 3.5);
          cross2.setAttribute('y1', yDrop - 3.5);
          cross2.setAttribute('x2', xDrop - 3.5);
          cross2.setAttribute('y2', yDrop + 3.5);
          cross2.setAttribute('stroke', '#ffffff');
          cross2.setAttribute('stroke-width', '2');
          cross2.setAttribute('stroke-linecap', 'round');
          gCross.appendChild(cross2);
          svgLayer.appendChild(gCross);

          // Etiqueta en la punta del descarte (donde se interrumpe el segmento con la cruz roja)
          let dropTag = '[DESCARTE EN CANAL]';
          if (isQueueDrop) {
            dropTag = '[COLA LLENA EN C9200]';
          } else if (pkt.dropReason && (pkt.dropReason.includes('Timeout') || pkt.dropReason.includes('Corte') || pkt.dropReason.includes('retardo'))) {
            dropTag = '[TIMEOUT / CORTE]';
          }

          // Rótulo descriptivo completo en la punta de la flecha cortada (en el canal)
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x', xDrop + 14);
          label.setAttribute('y', yDrop + 4);
          label.setAttribute('font-family', "ui-monospace, 'SF Mono', 'JetBrains Mono', monospace");
          label.setAttribute('font-size', '10.8');
          label.setAttribute('font-weight', '700');
          label.setAttribute('fill', '#ef4444');
          label.setAttribute('paint-order', 'stroke fill');
          label.setAttribute('stroke', '#ffffff');
          label.setAttribute('stroke-width', '4px');
          label.setAttribute('stroke-linejoin', 'round');
          label.setAttribute('cursor', 'pointer');
          label.textContent = `sec=${pkt.seqA}, ${pkt.len} B ${dropTag}`;
          svgLayer.appendChild(label);

          line.addEventListener('click', () => this.inspectItem(pkt, 'PACKET'));
          label.addEventListener('click', () => this.inspectItem(pkt, 'PACKET'));
        } else {
          // Segmento entregado correctamente: flecha diagonal limpia Host A -> Host B
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', xHostA);
          line.setAttribute('y1', yLaunch);
          line.setAttribute('x2', xHostB);
          line.setAttribute('y2', yArrive);
          line.setAttribute('stroke', '#0284c7');
          line.setAttribute('stroke-width', '2');
          line.setAttribute('marker-end', 'url(#arrow-data)');
          line.setAttribute('cursor', 'pointer');
          svgLayer.appendChild(line);

          // Rótulo posicionado en la PUNTA DE LA FLECHA (Host B) ocupando el ESPACIO EN BLANCO DERECHO (x > xHostB)
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x', xHostB + 14);
          label.setAttribute('y', yArrive + 4);
          label.setAttribute('text-anchor', 'start');
          label.setAttribute('font-family', "ui-monospace, 'SF Mono', 'JetBrains Mono', monospace");
          label.setAttribute('font-size', '10.8');
          label.setAttribute('font-weight', '700');
          label.setAttribute('fill', '#0071e3');
          label.setAttribute('cursor', 'pointer');
          label.textContent = `sec=${pkt.seqA}, ${pkt.len} B`;
          svgLayer.appendChild(label);

          line.addEventListener('click', () => this.inspectItem(pkt, 'PACKET'));
          label.addEventListener('click', () => this.inspectItem(pkt, 'PACKET'));
        }
      });

      // 2. Trazar cada ACK inicial de respuesta (Host B -> Host A)
      initialAcks.forEach((ack, ackIdx) => {
        // Encontrar el paquete entregado correspondiente para que el ACK salga exactamente cuando el paquete llega a Host B
        const deliveredPackets = initialPackets.filter(p => !p.isLost);
        const correspondingPkt = deliveredPackets[ackIdx];
        const pktOriginalIdx = correspondingPkt ? initialPackets.indexOf(correspondingPkt) : ackIdx;
        const yAckLaunch = (pktOriginalIdx >= 0 && packetArriveTimes[pktOriginalIdx])
          ? packetArriveTimes[pktOriginalIdx]
          : roundStartY + propY + (ackIdx * pktSpacing);

        const yAckArrive = yAckLaunch + propY;
        if (yAckArrive > maxYReached) maxYReached = yAckArrive;

        // Si es el 3er ACK duplicado, registrar su llegada a Host A para disparar Fast Retransmit
        if (ack.dupNumber === 3) {
          yDup3ArrivalAtA = yAckArrive;
        }

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', xHostB);
        line.setAttribute('y1', yAckLaunch);
        line.setAttribute('x2', xHostA);
        line.setAttribute('y2', yAckArrive);

        if (ack.isDuplicate) {
          line.setAttribute('stroke', '#d97706');
          line.setAttribute('stroke-width', ack.dupNumber >= 3 ? '2.8' : '2');
          line.setAttribute('marker-end', 'url(#arrow-dupack)');
        } else {
          line.setAttribute('stroke', '#059669');
          line.setAttribute('stroke-width', '2');
          line.setAttribute('marker-end', 'url(#arrow-ack)');
        }
        line.setAttribute('cursor', 'pointer');
        svgLayer.appendChild(line);

        // Rótulo posicionado en la PUNTA DE LA FLECHA (Host A) ocupando el ESPACIO EN BLANCO IZQUIERDO (x < xHostA)
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', xHostA - 14);
        label.setAttribute('y', yAckArrive + 4);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('font-family', "'JetBrains Mono', monospace");
        label.setAttribute('font-size', '10');
        label.setAttribute('font-weight', '700');
        label.setAttribute('cursor', 'pointer');
        
        let ackLabelText = ack.text;
        if (ack.dupNumber === 3) {
          ackLabelText = `ack=${ack.ackA} (dup #3) ➔ ¡3 DUP ACKs!`;
          label.setAttribute('fill', '#b45309');
          label.setAttribute('font-weight', '800');
        } else if (ack.isDuplicate) {
          label.setAttribute('fill', '#d97706');
        } else {
          label.setAttribute('fill', '#059669');
        }
        label.textContent = ackLabelText;
        svgLayer.appendChild(label);

        line.addEventListener('click', () => this.inspectItem(ack, 'ACK'));
        label.addEventListener('click', () => this.inspectItem(ack, 'ACK'));
      });

      // Indicador visual de espera de temporizador RTO en Host A (para eventos Timeout o Cola Llena)
      if (roundEvent.lossType === 'TIMEOUT' || roundEvent.lossType === 'QUEUE_DROP') {
        const yTimeoutStart = roundStartY + propY;
        const yTimeoutEnd = (maxYReached > roundStartY + 10 ? maxYReached : roundStartY + propY + 30) + 16;
        
        const timerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        timerLine.setAttribute('x1', xHostA - 16);
        timerLine.setAttribute('y1', yTimeoutStart);
        timerLine.setAttribute('x2', xHostA - 16);
        timerLine.setAttribute('y2', yTimeoutEnd);
        timerLine.setAttribute('stroke', '#dc2626');
        timerLine.setAttribute('stroke-width', '2.5');
        timerLine.setAttribute('stroke-dasharray', '4,2');
        svgLayer.appendChild(timerLine);

        const timerLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        timerLabel.setAttribute('x', xHostA - 22);
        timerLabel.setAttribute('y', (yTimeoutStart + yTimeoutEnd) / 2 + 4);
        timerLabel.setAttribute('text-anchor', 'end');
        timerLabel.setAttribute('font-family', "ui-monospace, 'SF Mono', 'JetBrains Mono', monospace");
        timerLabel.setAttribute('font-size', '10.5');
        timerLabel.setAttribute('font-weight', '800');
        timerLabel.setAttribute('fill', '#dc2626');
        timerLabel.textContent = '⏱️ RTO EXPIRADO';
        svgLayer.appendChild(timerLabel);
      }

      // 3. Trazar Retransmisión Rápida o por Timeout (Host A -> Host B) y el ACK Acumulativo POSTERIOR (Host B -> Host A)
      if (retxPacket) {
        let yRetxLaunch;
        if (roundEvent.lossType === 'TIMEOUT' || roundEvent.lossType === 'QUEUE_DROP') {
          yRetxLaunch = Math.max(maxYReached + 18, roundStartY + (initialPackets.length * pktSpacing) + propY + 18);
        } else if (yDup3ArrivalAtA !== null) {
          yRetxLaunch = yDup3ArrivalAtA + 4;
        } else {
          yRetxLaunch = maxYReached + 6;
        }

        const yRetxArrive = yRetxLaunch + propY;
        if (yRetxArrive > maxYReached) maxYReached = yRetxArrive;

        const retxLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        retxLine.setAttribute('x1', xHostA);
        retxLine.setAttribute('y1', yRetxLaunch);
        retxLine.setAttribute('x2', xHostB);
        retxLine.setAttribute('y2', yRetxArrive);
        retxLine.setAttribute('stroke', '#7c3aed');
        retxLine.setAttribute('stroke-width', '2.6');
        retxLine.setAttribute('stroke-dasharray', '5,3');
        retxLine.setAttribute('marker-end', 'url(#arrow-retx)');
        retxLine.setAttribute('cursor', 'pointer');
        svgLayer.appendChild(retxLine);

        // Rótulo completo en la PUNTA DE LA FLECHA (Host B) en el ESPACIO EN BLANCO DERECHO (x > xHostB)
        const retxLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        retxLabel.setAttribute('x', xHostB + 14);
        retxLabel.setAttribute('y', yRetxArrive + 4);
        retxLabel.setAttribute('text-anchor', 'start');
        retxLabel.setAttribute('font-family', "'JetBrains Mono', monospace");
        retxLabel.setAttribute('font-size', '10');
        retxLabel.setAttribute('font-weight', '800');
        retxLabel.setAttribute('fill', '#7c3aed');
        retxLabel.setAttribute('cursor', 'pointer');
        let retxName = ' (Retransmisión Rápida)';
        if (roundEvent.lossType === 'TIMEOUT') retxName = ' (Retransmisión por Timeout)';
        else if (roundEvent.lossType === 'QUEUE_DROP') retxName = ' (Retransmisión Cola Llena)';
        retxLabel.textContent = `sec=${retxPacket.seqA}, ${retxPacket.len} B${retxName}`;
        svgLayer.appendChild(retxLabel);

        retxLine.addEventListener('click', () => this.inspectItem(retxPacket, 'PACKET'));
        retxLabel.addEventListener('click', () => this.inspectItem(retxPacket, 'PACKET'));

        // 4. El ACK Acumulativo sale de Host B estricta y visualmente POSTERIOR a la llegada de la retransmisión
        if (postRetxAck) {
          const yCumLaunch = yRetxArrive + 8; // Host B recibe primero la retransmisión, y luego emite el ACK acumulativo
          const yCumArrive = yCumLaunch + propY;
          if (yCumArrive > maxYReached) maxYReached = yCumArrive;

          const cumLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          cumLine.setAttribute('x1', xHostB);
          cumLine.setAttribute('y1', yCumLaunch);
          cumLine.setAttribute('x2', xHostA);
          cumLine.setAttribute('y2', yCumArrive);
          cumLine.setAttribute('stroke', '#059669');
          cumLine.setAttribute('stroke-width', '3');
          cumLine.setAttribute('marker-end', 'url(#arrow-ack)');
          cumLine.setAttribute('cursor', 'pointer');
          svgLayer.appendChild(cumLine);

          // Rótulo completo en la PUNTA DE LA FLECHA (Host A) en el ESPACIO EN BLANCO IZQUIERDO (x < xHostA)
          const cumLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          cumLabel.setAttribute('x', xHostA - 14);
          cumLabel.setAttribute('y', yCumArrive + 4);
          cumLabel.setAttribute('text-anchor', 'end');
          cumLabel.setAttribute('font-family', "'JetBrains Mono', monospace");
          cumLabel.setAttribute('font-size', '10');
          cumLabel.setAttribute('font-weight', '800');
          cumLabel.setAttribute('fill', '#059669');
          cumLabel.setAttribute('cursor', 'pointer');
          cumLabel.textContent = postRetxAck.text;
          svgLayer.appendChild(cumLabel);

          cumLine.addEventListener('click', () => this.inspectItem(postRetxAck, 'ACK'));
          cumLabel.addEventListener('click', () => this.inspectItem(postRetxAck, 'ACK'));
        }
      }

      // Calcular el avance vertical para el siguiente ciclo
      const roundHeight = (maxYReached - roundStartY) + 28;
      currentY += roundHeight;
    });

    const totalHeight = Math.max(460, currentY + 40);
    svgEl.setAttribute('viewBox', `0 0 1100 ${totalHeight}`);
    svgEl.style.height = `${totalHeight}px`;

    // Actualizar longitud de los ejes verticales dotted
    const axisA = document.querySelector('#ladder-timeline-axes line:nth-child(1)');
    const axisB = document.querySelector('#ladder-timeline-axes line:nth-child(2)');
    if (axisA && axisB) {
      axisA.setAttribute('y2', totalHeight);
      axisB.setAttribute('y2', totalHeight);
    }

    // Auto-scroll suave centrado en la ronda más reciente para máxima comodidad
    if (scrollArea && events.length > 0) {
      const targetScroll = Math.max(0, lastRoundStartY - 15);
      setTimeout(() => {
        scrollArea.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }, 40);
    }
  }

  inspectItem(item, type) {
    const inspectorEl = document.getElementById('ladder-inspector-content');
    if (!inspectorEl) return;

    if (type === 'PACKET') {
      inspectorEl.innerHTML = `
        <div class="ins-grid">
          <div class="ins-col">
            <div><strong>Tipo:</strong> Segmento TCP de Datos</div>
            <div><strong>Emisor:</strong> ${this.options.clientIP}:${this.options.clientPort} (Cliente VLAN 20)</div>
            <div><strong>Receptor:</strong> ${this.options.serverIP}:${this.options.serverPort} (Nginx VLAN 10)</div>
            <div><strong>Seq Cliente (Host A):</strong> <span class="badge-blue font-mono">${item.seqA}</span></div>
          </div>
          <div class="ins-col">
            <div><strong>Ack Servidor (Host B):</strong> <span class="badge-gray font-mono">${item.seqB}</span></div>
            <div><strong>Longitud de Datos:</strong> ${item.len} Bytes (MSS)</div>
            <div><strong>Bytes Transportados:</strong> [${item.seqA} - ${item.seqA + item.len - 1}]</div>
            <div><strong>Estado:</strong> <span class="${item.isLost ? 'badge-red' : 'badge-green'}">${item.isLost ? '❌ DESCARTADO (' + item.dropReason + ')' : '✔️ ENTREGADO CON ÉXITO'}</span></div>
          </div>
        </div>
        <div class="ins-note">
          <strong>Diferenciación de Números de Secuencia (Full Duplex):</strong> 
          Este segmento utiliza la secuencia propia del cliente (${item.seqA}), iniciada en ISN=1000. El campo ACK confirma la secuencia propia del servidor (${item.seqB}, ISN=50000). Esto demuestra que cada sentido de la conexión mantiene un espacio de numeración independiente de 32 bits.
        </div>
      `;
    } else {
      inspectorEl.innerHTML = `
        <div class="ins-grid">
          <div class="ins-col">
            <div><strong>Tipo:</strong> ${item.isDuplicate ? `ACK DUPLICADO #${item.dupNumber}` : 'ACK ACUMULATIVO NORMAL'}</div>
            <div><strong>Emisor del ACK:</strong> ${this.options.serverIP}:443 (Nginx VLAN 10)</div>
            <div><strong>Receptor del ACK:</strong> ${this.options.clientIP} (Estudiantes VLAN 20)</div>
          </div>
          <div class="ins-col">
            <div><strong>Acknowledgment Number:</strong> <span class="badge-green font-mono">${item.ackA}</span></div>
            <div><strong>Secuencia Propia de Nginx:</strong> <span class="badge-gray font-mono">${item.seqB}</span></div>
            <div><strong>Significado:</strong> ${item.isDuplicate ? `Sigue solicitando el byte ${item.ackA}` : `Confirma todos los bytes hasta ${item.ackA - 1}`}</div>
          </div>
        </div>
        <div class="ins-note">
          <strong>Comportamiento del Búfer Receptor:</strong> 
          ${item.isDuplicate ? `El servidor Nginx recibió un segmento posterior pero detectó una brecha en la secuencia. Retiene los segmentos fuera de orden en su búfer receptor y vuelve a emitir ack=${item.ackA}. Al tercer ACK duplicado, TCP dispara Retransmisión Rápida (Fast Retransmit) sin esperar al timeout.` : `El servidor confirma la recepción ordenada y continua. Los bytes reconocidos se liberan del Send Buffer del emisor y se avanza SendBase.`}
        </div>
      `;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetworkVisualizer;
} else {
  window.NetworkVisualizer = NetworkVisualizer;
}
