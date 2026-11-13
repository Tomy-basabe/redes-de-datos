/**
 * tcpEngine.js - Motor de Simulación del Control de Congestión TCP
 * Basado estrictamente en:
 * Computer Networking: A Top-Down Approach (James F. Kurose & Keith W. Ross - 5ª/7ª Ed.)
 * Capítulo 3: La capa de transporte - Sección 3.7 y 3.5.4
 * Estándar RFC 2581 (TCP Congestion Control) y RFC 5681
 * 
 * Mejoras aplicadas:
 * - Números de secuencia independientes para Origen y Destino (ISN_A != ISN_B).
 * - Modelo explícito y funcional de búferes:
 *   * Send Buffer (Cliente): Enviado y reconocido, Enviado sin reconocer (cwnd), Listo para Enviar.
 *   * Router Buffer (Cisco C9200): Cola en el enlace de cuello de botella con descarte por saturación.
 *   * Receive Buffer (Servidor Nginx): Bytes entregados y paquetes fuera de orden (Out-of-order).
 * - Historial y snapshots para retroceso en el tiempo (Paso Anterior).
 */

class TCPEngine {
  constructor(config = {}) {
    this.initConfig(config);
    this.reset();
  }

  initConfig(config = {}) {
    this.config = {
      algorithm: config.algorithm || 'RENO', // 'RENO' o 'TAHOE'
      mss: config.mss !== undefined ? Number(config.mss) : 1460, // Bytes (Default 1460 B, estándar Ethernet; o 1 B didáctico)
      initialCwnd: config.initialCwnd || 1,  // En MSS (Kurose utiliza 1 MSS)
      initialSsthresh: config.initialSsthresh !== undefined ? config.initialSsthresh : null, // null al inicio: el umbral se calcula ante la 1ª congestión
      rtt: config.rtt || 50,                 // ms lógicos
      rto: config.rto || 150,                // Retransmission Timeout en ms
      bufferCapacity: config.bufferCapacity || 8, // Capacidad máxima del búfer del router C9200
      enforceBufferLimit: config.enforceBufferLimit !== undefined ? config.enforceBufferLimit : true, // Activo: descarta si la cola se satura
      
      // Extremos de la Escuela 4-025 Los Corralitos
      clientIP: '172.16.20.10',
      clientVLAN: 'VLAN 20 (Estudiantes)',
      clientPort: 51842,
      clientISN: config.clientISN || 1000,    // ISN independiente del Cliente (Host A)
      
      serverIP: '172.16.10.12',
      serverPort: 443,
      serverVLAN: 'VLAN 10 (Gestión)',
      serverISN: config.serverISN || 50000,  // ISN independiente del Servidor Nginx (Host B)
      receiverProfile: config.receiverProfile || 'NGINX_NORMAL', // 'NGINX_NORMAL', 'SAMBA_SLOW', 'BLOCKED_ZERO_WINDOW'
      
      totalDataBytes: config.totalDataBytes || 80000 // Total de datos que la aplicación quiere enviar
    };
  }

  reset() {
    const mss = this.config.mss;
    const clientISN = this.config.clientISN;
    const serverISN = this.config.serverISN;
    const hasInitialSsthresh = (this.config.initialSsthresh !== null && this.config.initialSsthresh !== undefined);

    this.state = {
      round: 1,                              // Ciclo de transmisión / RTT actual
      step: 0,                               // Número de paso atómico
      cwnd: this.config.initialCwnd,         // En unidades de MSS
      ssthresh: hasInitialSsthresh ? this.config.initialSsthresh : null, // En unidades de MSS (null hasta primera congestión)
      hasCongestionOccurred: hasInitialSsthresh, // Bandera: indica si ya se detectó la primera congestión
      phase: (hasInitialSsthresh && this.config.initialCwnd >= this.config.initialSsthresh) ? 'CONGESTION_AVOIDANCE' : 'SLOW_START',
      algorithm: this.config.algorithm,
      receiverProfile: this.config.receiverProfile || 'NGINX_NORMAL',
      mss: mss,
      
      // Espacios de secuencia independientes (Full Duplex)
      clientISN: clientISN,
      serverISN: serverISN,
      clientSendBase: clientISN,             // SendBase de A (byte más antiguo no reconocido por B)
      clientNextSeq: clientISN,              // Próximo byte a transmitir por A
      serverCurrentSeq: serverISN,           // Secuencia propia de B (crece si B envía datos, fija en ACKs puros)
      serverLastAckSent: clientISN,          // Último Ack emitido por B
      dupACKcount: 0,                        // Contador de ACKs duplicados recibidos por A
      
      // MODELO DE BÚFERES FUNCIONALES
      // 1. Buffer del Cliente (Emisor Host A):
      clientBuffer: {
        capacityBytes: 65536,
        appDataTotal: this.config.totalDataBytes,
        ackedBytes: 0,                       // Bytes transmitidos, enviados y reconocidos (liberados)
        inFlightBytes: 0,                    // Bytes enviados sin reconocer (dentro de cwnd)
        readyBytes: this.config.totalDataBytes // Bytes esperando en el búfer para salir
      },

      // 2. Buffer del Router de Cuello de Botella (Cisco Catalyst C9200):
      routerQueue: {
        capacityPkts: this.config.bufferCapacity,
        currentPkts: 0,
        queuedPackets: [],
        droppedCount: 0
      },

      // 3. Buffer del Servidor (Receptor Host B / Nginx):
      serverBuffer: {
        capacityBytes: 65536,
        deliveredBytes: 0,                   // Bytes continuos entregados a la aplicación Nginx
        expectedSeq: clientISN,              // Próximo byte que el servidor espera de forma continua
        outOfOrderSegments: []               // Segmentos recibidos fuera de orden almacenados en espera
      },

      // Historial de transmisiones para el Diagrama de Tiempo (Ladder Diagram)
      transmissionEvents: [],

      // Estadísticas acumuladas
      stats: {
        totalSegmentsSent: 0,
        totalBytesSent: 0,
        totalAcksReceived: 0,
        totalLossEvents: 0,
        tripleDupAckCount: 0,
        timeoutCount: 0,
        retransmissions: 0
      },

      // Historial para el gráfico de cwnd y ssthresh (Figura 3.53)
      historyRounds: [
        {
          round: 1,
          cwnd: this.config.initialCwnd,
          ssthresh: hasInitialSsthresh ? this.config.initialSsthresh : null,
          phase: (hasInitialSsthresh && this.config.initialCwnd >= this.config.initialSsthresh) ? 'CONGESTION_AVOIDANCE' : 'SLOW_START',
          event: 'Inicio de conexión (Handshake completado)',
          lossType: null
        }
      ],

      // Último evento para el panel de telemetría y bitácora
      lastEvent: {
        type: 'INIT',
        title: 'Conexión Establecida (3-Way Handshake)',
        description: `Cliente ISN=${clientISN} (VLAN 20) ⇄ Servidor ISN=${serverISN} (VLAN 10:443). Números de secuencia independientes inicializados.`,
        action: hasInitialSsthresh 
          ? `cwnd inicial = ${this.config.initialCwnd} MSS (${mss} B), ssthresh = ${this.config.initialSsthresh} MSS.`
          : `cwnd inicial = ${this.config.initialCwnd} MSS (${mss} B). ssthresh pendiente. Fase: Arranque Lento (Slow Start).`
      }
    };

    this.updateBufferMetrics();
    this.updateFlowControlHistory();

    // Pila de snapshots para retroceso en el tiempo (Paso Anterior / Undo)
    this.snapshots = [];
    this.saveSnapshot();
  }

  saveSnapshot() {
    const snapshot = JSON.parse(JSON.stringify(this.state));
    this.snapshots.push(snapshot);
    if (this.snapshots.length > 200) {
      this.snapshots.shift();
    }
  }

  stepBack() {
    if (this.snapshots.length > 1) {
      this.snapshots.pop();
      const previousState = this.snapshots[this.snapshots.length - 1];
      this.state = JSON.parse(JSON.stringify(previousState));
      return true;
    }
    return false;
  }

  /**
   * Actualiza el desglose exacto de los 3 búferes
   */
  updateBufferMetrics() {
    const acked = Math.max(0, this.state.clientSendBase - this.state.clientISN);
    const inFlight = Math.round(this.state.cwnd * this.state.mss);
    const ready = Math.max(0, this.config.totalDataBytes - acked - inFlight);

    this.state.clientBuffer.ackedBytes = acked;
    this.state.clientBuffer.inFlightBytes = inFlight;
    this.state.clientBuffer.readyBytes = ready;

    this.state.serverBuffer.deliveredBytes = acked;
  }

  /**
   * Modela el Control de Flujo TCP según Kurose & Ross (Capítulo 3.5.5):
   * rwnd = RcvBuffer - (LastByteRcvd - LastByteRead)
   * Límite de Envío = min(cwnd, rwnd)
   * 
   * Perfiles de Receptor basados en la red de la Escuela 4-025 Los Corralitos (VLAN 10):
   * 1. NGINX_NORMAL: Servidor Web Nginx (172.16.10.12:443). Rápido, proceso lee ágilmente. rwnd ~14-16 MSS.
   * 2. SAMBA_SLOW: Servidor de Archivos Samba (172.16.10.14:445) con sobrecarga de disco (I/O). rwnd se contrae a 2 MSS.
   * 3. BLOCKED_ZERO_WINDOW: Bloqueo de Aplicación (rwnd = 0), demostrando Sondas de 1 Byte para evitar interbloqueo.
   */
  getRwndForRound(round, cwnd, profile = null) {
    const activeProfile = profile || (this.state && this.state.receiverProfile) || this.config.receiverProfile || 'NGINX_NORMAL';
    const rcvBuffer = 16; // MSS (Capacidad total del búfer receptor, ej. 16 * 1460 B = 23.3 KB)
    let rwnd = 16;

    if (activeProfile === 'SAMBA_SLOW') {
      // Samba sufre sobrecarga en I/O de disco durante las rondas 5 a 11
      const sambaRwndMap = {
        1: 16, 2: 15, 3: 13, 4: 8, 5: 4,
        6: 2, 7: 2, 8: 2, 9: 3, 10: 2,
        11: 4, 12: 6, 13: 9, 14: 12, 15: 14, 16: 15
      };
      rwnd = sambaRwndMap[round] !== undefined ? sambaRwndMap[round] : 14;
    } else if (activeProfile === 'BLOCKED_ZERO_WINDOW') {
      // Proceso receptor bloqueado: el búfer se llena al 100% (rwnd = 0) en rondas 4 a 6
      const blockedMap = {
        1: 16, 2: 12, 3: 6, 4: 0, 5: 0,
        6: 0, 7: 3, 8: 7, 9: 12, 10: 16,
        11: 16, 12: 16, 13: 16, 14: 16, 15: 16, 16: 16
      };
      rwnd = blockedMap[round] !== undefined ? blockedMap[round] : 16;
    } else {
      // NGINX_NORMAL: Servidor optimizado, la aplicación consume a la velocidad de la red
      const nginxMap = {
        1: 16, 2: 16, 3: 15, 4: 15, 5: 16,
        6: 15, 7: 15, 8: 16, 9: 15, 10: 16,
        11: 15, 12: 15, 13: 16, 14: 15, 15: 16, 16: 16
      };
      rwnd = nginxMap[round] !== undefined ? nginxMap[round] : 16;
    }

    const effectiveWindow = Math.min(cwnd, rwnd);
    const isThrottled = rwnd < cwnd;
    const isZero = rwnd === 0;

    return {
      rcvBuffer: rcvBuffer,
      rwnd: rwnd,
      effectiveWindow: effectiveWindow,
      isThrottled: isThrottled,
      isZero: isZero
    };
  }

  setReceiverProfile(profile) {
    if (!this.state) return;
    this.state.receiverProfile = profile;
    this.updateFlowControlHistory();
  }

  updateFlowControlHistory() {
    if (!this.state || !Array.isArray(this.state.historyRounds)) return;
    const profile = this.state.receiverProfile || 'NGINX_NORMAL';
    this.state.historyRounds.forEach(entry => {
      const rwndData = this.getRwndForRound(entry.round, entry.cwnd, profile);
      entry.rwnd = rwndData.rwnd;
      entry.rcvBuffer = rwndData.rcvBuffer;
      entry.effectiveWindow = Math.min(entry.cwnd, entry.rwnd);
      entry.isThrottled = entry.rwnd < entry.cwnd;
      entry.isZero = entry.rwnd === 0;
      entry.receiverProfile = profile;
    });
  }

  getTelemetry() {
    const cwndBytes = Math.round(this.state.cwnd * this.state.mss);
    const ssthreshBytes = this.state.ssthresh !== null ? Math.round(this.state.ssthresh * this.state.mss) : null;
    const currentRound = this.state.round;
    const flowInfo = this.getRwndForRound(currentRound, this.state.cwnd, this.state.receiverProfile);

    return {
      round: this.state.round,
      step: this.state.step,
      cwndMSS: Number(this.state.cwnd.toFixed(2)),
      cwndBytes: cwndBytes,
      ssthreshMSS: this.state.ssthresh !== null ? Number(this.state.ssthresh.toFixed(2)) : null,
      ssthreshBytes: ssthreshBytes,
      hasCongestionOccurred: this.state.hasCongestionOccurred,
      phase: this.state.phase,
      algorithm: this.state.algorithm,
      mss: this.state.mss,
      rtt: this.config.rtt,
      dupACKcount: this.state.dupACKcount,
      
      // Control de Flujo (Kurose & Ross Cap 3.5.5)
      receiverProfile: this.state.receiverProfile || 'NGINX_NORMAL',
      rcvBufferMSS: flowInfo.rcvBuffer,
      rcvBufferBytes: flowInfo.rcvBuffer * this.state.mss,
      rwndMSS: flowInfo.rwnd,
      rwndBytes: flowInfo.rwnd * this.state.mss,
      effectiveWindowMSS: flowInfo.effectiveWindow,
      effectiveWindowBytes: flowInfo.effectiveWindow * this.state.mss,
      isFlowThrottled: flowInfo.isThrottled,
      isZeroWindow: flowInfo.isZero,
      limitingFactor: flowInfo.isZero ? 'ZERO_WINDOW' : (flowInfo.isThrottled ? 'FLOW_CONTROL' : 'CONGESTION_CONTROL'),

      // Números de secuencia independientes
      clientISN: this.state.clientISN,
      clientSendBase: this.state.clientSendBase,
      clientNextSeq: this.state.clientNextSeq,
      serverISN: this.state.serverISN,
      serverCurrentSeq: this.state.serverCurrentSeq,
      serverLastAckSent: this.state.serverLastAckSent,

      // Búferes
      clientBuffer: this.state.clientBuffer,
      routerQueue: this.state.routerQueue,
      serverBuffer: this.state.serverBuffer,

      lastEvent: this.state.lastEvent,
      stats: this.state.stats,
      historyRounds: this.state.historyRounds,
      transmissionEvents: this.state.transmissionEvents
    };
  }

  /**
   * Ejecuta un ciclo de transmisión completo (Round / RTT).
   * Genera las flechas de datos y de reconocimientos correspondientes al diagrama espacio-tiempo.
   * Aplica rigurosamente el modelo de ACK acumulativo y ACKs duplicados de Kurose & Ross.
   * @param {Object} roundOptions - { lossEvent: 'TRIPLE_DUP_ACK' | 'TIMEOUT' | 'QUEUE_DROP' | null, lostSegmentIndex: 1 }
   */
  executeTransmissionRound(roundOptions = {}) {
    this.saveSnapshot();
    this.state.step += 1;

    const currentRound = this.state.round;
    const roundCwnd = Math.round(this.state.cwnd);
    const numPacketsToSend = Math.max(1, roundCwnd);

    const packets = [];
    const acks = [];
    let startSeq = this.state.clientNextSeq;
    const lossType = roundOptions.lossEvent || null;
    const lostIndex = Math.min(roundOptions.lostSegmentIndex !== undefined ? roundOptions.lostSegmentIndex : 1, numPacketsToSend - 1);

    const queueCapacity = this.state.routerQueue.capacityPkts;
    const willOverflowQueue = (lossType === 'QUEUE_DROP') || (this.config.enforceBufferLimit && numPacketsToSend > queueCapacity);

    // 1. Generar Segmentos de Datos del Cliente hacia el Servidor
    for (let i = 0; i < numPacketsToSend; i++) {
      const seqA = startSeq + (i * this.state.mss);
      const endSeqA = seqA + this.state.mss;
      
      let isLost = false;
      let dropReason = null;

      if (lossType === 'TRIPLE_DUP_ACK') {
        if (i === lostIndex) {
          isLost = true;
          dropReason = 'Segmento descartado en el canal';
        }
      } else if (lossType === 'TIMEOUT') {
        if (i >= lostIndex) {
          isLost = true;
          dropReason = (i === lostIndex)
            ? 'Pérdida por corte o retardo extremo (Timeout)'
            : 'Pérdida en canal (Corte / Sin confirmaciones)';
        }
      } else if (willOverflowQueue && i >= queueCapacity) {
        isLost = true;
        dropReason = 'Descarte por saturación de cola en el búfer del Cisco C9200';
      }

      const pkt = {
        id: `PKT-R${currentRound}-${i + 1}`,
        round: currentRound,
        index: i,
        direction: 'CLIENT_TO_SERVER',
        seqA: seqA,                    // Seq propio del Cliente (A)
        ackExpectedA: endSeqA,         // Próximo byte esperado por A
        seqB: this.state.serverCurrentSeq, // Secuencia del Servidor (B)
        len: this.state.mss,
        isLost: isLost,
        dropReason: dropReason,
        status: isLost ? 'LOST' : 'DELIVERED'
      };

      packets.push(pkt);
      this.state.stats.totalSegmentsSent++;
      this.state.stats.totalBytesSent += this.state.mss;
    }

    this.state.clientNextSeq += (numPacketsToSend * this.state.mss);

    // Actualizar ocupación del búfer del router
    this.state.routerQueue.currentPkts = Math.min(numPacketsToSend, queueCapacity);
    if (willOverflowQueue) {
      const droppedInQueue = Math.max(0, numPacketsToSend - queueCapacity);
      this.state.routerQueue.droppedCount += droppedInQueue;
    }

    // 2. Procesamiento de los paquetes en el Receptor (Nginx / Host B)
    const hasAnyLoss = packets.some(p => p.isLost);
    let effectiveLossType = null;

    if (lossType === 'TIMEOUT') {
      this.handleTimeoutEvaluation(packets, lostIndex, currentRound, acks);
      effectiveLossType = 'TIMEOUT';
    } else if (lossType === 'QUEUE_DROP' || willOverflowQueue) {
      this.handleQueueDropEvaluation(packets, queueCapacity, currentRound, acks);
      effectiveLossType = 'QUEUE_DROP';
    } else if (hasAnyLoss) {
      const res = this.handleLossEvaluation(packets, currentRound, acks, lossType);
      effectiveLossType = res.lossType;
    } else {
      this.handleSuccessfulEvaluation(packets, currentRound, acks);
    }

    // Guardar en el historial de transmisiones para el Ladder Diagram
    const roundEventData = {
      round: currentRound,
      cwnd: roundCwnd,
      ssthresh: this.state.ssthresh,
      phase: this.state.phase,
      packets: packets,
      acks: acks,
      lossType: effectiveLossType
    };
    this.state.transmissionEvents.push(roundEventData);

    // Limpiar ocupación transitoria de cola del router tras el RTT
    this.state.routerQueue.currentPkts = 0;
    this.updateBufferMetrics();

    // Avanzar al siguiente ciclo RTT
    this.state.round += 1;

    this.updateFlowControlHistory();
    const telemetry = this.getTelemetry();
    telemetry.currentRoundPackets = packets;
    telemetry.currentRoundAcks = acks;
    return telemetry;
  }

  /**
   * Manejo de Ronda Exitosa: todos los segmentos llegan en orden continuo
   */
  handleSuccessfulEvaluation(packets, currentRound, acks) {
    const oldCwnd = this.state.cwnd;

    packets.forEach((pkt, idx) => {
      this.state.stats.totalAcksReceived++;
      this.state.clientSendBase = pkt.ackExpectedA;
      this.state.serverLastAckSent = pkt.ackExpectedA;
      this.state.serverBuffer.expectedSeq = pkt.ackExpectedA;

      acks.push({
        id: `ACK-R${currentRound}-${idx + 1}`,
        direction: 'SERVER_TO_CLIENT',
        round: currentRound,
        seqB: this.state.serverCurrentSeq,
        ackA: pkt.ackExpectedA,
        isDuplicate: false,
        dupNumber: 0,
        text: `ack=${pkt.ackExpectedA}`
      });
    });

    let nextCwnd = oldCwnd;
    if (this.state.phase === 'SLOW_START') {
      if (this.state.ssthresh !== null) {
        // Ya hubo congestión previa y existe un umbral ssthresh calculado:
        nextCwnd = oldCwnd * 2;
        if (nextCwnd >= this.state.ssthresh) {
          nextCwnd = this.state.ssthresh;
          this.state.phase = 'CONGESTION_AVOIDANCE';
        }
      } else {
        // Inicialmente NO hay umbral imaginario. Arranque Lento continúa duplicando (1, 2, 4, 8, 16...)
        // hasta que ocurra la primera congestión.
        nextCwnd = oldCwnd * 2;
      }
    } else if (this.state.phase === 'CONGESTION_AVOIDANCE') {
      // Evitación de congestión: crecimiento aditivo lineal (+1 MSS por RTT)
      nextCwnd = oldCwnd + 1.0;
    } else if (this.state.phase === 'FAST_RECOVERY') {
      nextCwnd = this.state.ssthresh || oldCwnd;
      this.state.phase = 'CONGESTION_AVOIDANCE';
    }

    this.state.cwnd = nextCwnd;
    this.state.dupACKcount = 0;
    this.state.serverBuffer.outOfOrderSegments = [];

    const phaseName = this.state.phase === 'SLOW_START' ? 'Arranque Lento' : 'Evitación de Congestión';
    const ssthreshNote = this.state.ssthresh === null ? '' : ` (ssthresh = ${this.state.ssthresh} MSS)`;

    this.state.lastEvent = {
      type: 'SUCCESS_ROUND',
      title: `Ciclo ${currentRound} Completado (+${packets.length} ACKs)`,
      description: `Los ${packets.length} segmentos llegaron en orden al Servidor Nginx. SendBase avanzó a ${this.state.clientSendBase}.`,
      action: `Fase: ${phaseName}. cwnd creció de ${oldCwnd} a ${this.state.cwnd} MSS (+${this.state.cwnd - oldCwnd} MSS).${ssthreshNote}`
    };

    this.state.historyRounds.push({
      round: currentRound + 1,
      cwnd: this.state.cwnd,
      ssthresh: this.state.ssthresh,
      phase: this.state.phase,
      event: this.state.lastEvent.title,
      lossType: null
    });
  }

  /**
   * Manejo estricto de Pérdida con Reconocimientos Acumulativos y ACKs Duplicados:
   * Sigue fielmente la Figura de Kurose & Ross (Image 1):
   * 1. Paquetes antes de la pérdida: se reconocen normalmente.
   * 2. Paquete perdido: no llega, no genera ACK.
   * 3. Paquetes posteriores: llegan desordenados, se retienen en el búfer de Nginx,
   *    y disparan ACKs DUPLICADOS que repiten el último byte continuo esperado.
   * 4. Al 3er ACK duplicado: Retransmisión Rápida y Recuperación Rápida.
   */
  handleLossEvaluation(packets, currentRound, acks, lossType) {
    const cwndAtLoss = this.state.cwnd;
    this.state.stats.totalLossEvents++;

    // Encontrar el primer paquete perdido
    const firstLostIdx = packets.findIndex(p => p.isLost);
    const lostPkt = packets[firstLostIdx];

    // 1. Paquetes previos al perdido: llegan en orden continuo y avanzan SendBase
    for (let i = 0; i < firstLostIdx; i++) {
      const pkt = packets[i];
      this.state.clientSendBase = pkt.ackExpectedA;
      this.state.serverLastAckSent = pkt.ackExpectedA;
      this.state.serverBuffer.expectedSeq = pkt.ackExpectedA;
      this.state.stats.totalAcksReceived++;

      acks.push({
        id: `ACK-R${currentRound}-${i + 1}`,
        direction: 'SERVER_TO_CLIENT',
        round: currentRound,
        seqB: this.state.serverCurrentSeq,
        ackA: pkt.ackExpectedA,
        isDuplicate: false,
        dupNumber: 0,
        text: `ack=${pkt.ackExpectedA}`
      });
    }

    // El byte que el servidor sigue esperando de forma continua (hueco en la secuencia)
    const lastValidAck = this.state.serverBuffer.expectedSeq;

    // 2. Paquetes posteriores al perdido: llegan fuera de orden (out-of-order)
    const outOfOrderPackets = [];
    let dupCount = 0;

    for (let i = firstLostIdx + 1; i < packets.length; i++) {
      const pkt = packets[i];
      if (pkt.isLost) continue; // Si también se perdió (ej. cola), no llega a Nginx

      outOfOrderPackets.push({
        seqA: pkt.seqA,
        len: pkt.len
      });
      dupCount++;

      // Regla Kurose & Ross: Nginx repite ack=lastValidAck por cada segmento posterior recibido
      acks.push({
        id: `DUPACK-R${currentRound}-${dupCount}`,
        direction: 'SERVER_TO_CLIENT',
        round: currentRound,
        seqB: this.state.serverCurrentSeq,
        ackA: lastValidAck,
        isDuplicate: true,
        dupNumber: dupCount,
        text: `ack=${lastValidAck} (dup #${dupCount})`
      });
    }

    // Almacenar en el búfer receptor para que se visualice el estado fuera de orden
    this.state.serverBuffer.outOfOrderSegments = [...outOfOrderPackets];
    this.state.dupACKcount = dupCount;

    // 3. Regla Kurose & Ross: al detectarse congestión, ssthresh se calcula como cwnd / 2
    const newSsthresh = Math.max(2, Math.floor(cwndAtLoss / 2));
    this.state.ssthresh = newSsthresh;
    this.state.hasCongestionOccurred = true;

    let effectiveLossType = 'TRIPLE_DUP_ACK';

    if (dupCount >= 3) {
      this.state.stats.tripleDupAckCount++;
      effectiveLossType = 'TRIPLE_DUP_ACK';

      // Retransmisión Rápida (Fast Retransmit): Host A envía de inmediato el paquete faltante
      const retxPkt = {
        id: `RETX-PKT-R${currentRound}`,
        round: currentRound,
        index: packets.length,
        direction: 'CLIENT_TO_SERVER',
        seqA: lostPkt.seqA,
        ackExpectedA: lostPkt.ackExpectedA,
        seqB: this.state.serverCurrentSeq,
        len: this.state.mss,
        isLost: false,
        isRetransmission: true,
        status: 'RETX_DELIVERED'
      };
      packets.push(retxPkt);
      this.state.stats.retransmissions++;

      // Al recibir el retransmitido, Nginx ensambla con los paquetes fuera de orden de su búfer
      // y emite el ACK acumulativo que cubre todos los bytes transmitidos
      const highestDelivered = packets[packets.length - 2];
      const cumulativeAck = highestDelivered ? highestDelivered.ackExpectedA : lostPkt.ackExpectedA;

      acks.push({
        id: `ACK-CUMULATIVE-R${currentRound}`,
        direction: 'SERVER_TO_CLIENT',
        round: currentRound,
        seqB: this.state.serverCurrentSeq,
        ackA: cumulativeAck,
        isDuplicate: false,
        isCumulative: true,
        dupNumber: 0,
        text: `ack=${cumulativeAck} (Acumulativo)`
      });

      this.state.clientSendBase = cumulativeAck;
      this.state.serverLastAckSent = cumulativeAck;
      this.state.serverBuffer.expectedSeq = cumulativeAck;

      if (this.state.algorithm === 'RENO') {
        // TCP Reno: entra explícitamente en el estado Recuperación Rápida (FSM Kurose & Ross Figura 3.52)
        // Regla: ssthresh = cwnd / 2 y cwnd = ssthresh + 3 MSS durante Fast Recovery
        const fastRecoveryCwnd = newSsthresh + 3;
        this.state.cwnd = newSsthresh;
        this.state.phase = 'FAST_RECOVERY';
        this.state.lastEvent = {
          type: 'TRIPLE_DUP_ACK',
          title: `3 ACKs Duplicados (Fast Retransmit & Fast Recovery - Reno)`,
          description: `Se detectó la pérdida de Seq=${lostPkt.seqA} tras recibir 3 ACKs duplicados (${lastValidAck}). TCP Reno NO baja la ventana a 1: activa Recuperación Rápida (Fast Recovery), permitiendo que la red siga fluyendo sin irse a cero.`,
          action: `FSM TCP Reno (Fig. 3.52): ssthresh = cwnd / 2 = ${newSsthresh} MSS. cwnd = ssthresh + 3 MSS = ${fastRecoveryCwnd} MSS durante Fast Recovery. Al confirmarse la retransmisión con el ACK acumulativo, cwnd deflacta a ssthresh (${newSsthresh} MSS) y pasa directamente a Evitación de la Congestión (+1 MSS por RTT).`
        };
      } else {
        // TCP Tahoe: NO POSEE Recuperación Rápida (FSM Kurose & Ross).
        // Establece incondicionalmente cwnd = 1 MSS y entra en Arranque Lento.
        this.state.cwnd = 1.0;
        this.state.phase = 'SLOW_START';
        this.state.lastEvent = {
          type: 'TRIPLE_DUP_ACK',
          title: `3 ACKs Duplicados (TCP Tahoe: Sin Recuperación Rápida)`,
          description: `Se perdió Seq=${lostPkt.seqA}. TCP Tahoe no implementa el estado de Recuperación Rápida: fija ssthresh=${newSsthresh} MSS, reduce incondicionalmente cwnd a 1 MSS y entra en Arranque Lento.`,
          action: `FSM TCP Tahoe: Estado Arranque Lento. cwnd = 1 MSS. Crecerá exponencialmente (1 ➔ 2 ➔ 4) hasta alcanzar ssthresh = ${newSsthresh} MSS, donde pasará a Evitación de Congestión.`
        };
      }
    } else {
      // Pérdida sin llegar a 3 ACKs duplicados (ej. ráfaga corta o pérdida al final de ventana):
      // En TCP, al no alcanzarse 3 ACKs duplicados, el emisor NO puede ejecutar Fast Retransmit.
      // El temporizador RTO expira provocando un TIMEOUT.
      // MEDIDA DRÁSTICA: ¡Tanto Reno como Tahoe reducen la ventana de congestión incondicionalmente a 1 MSS!
      this.state.stats.timeoutCount++;
      effectiveLossType = 'TIMEOUT';
      this.state.cwnd = 1.0;
      this.state.phase = 'SLOW_START';

      // Retransmisión tras vencimiento del temporizador RTO
      const retxPkt = {
        id: `TIMEOUT-RETX-R${currentRound}`,
        round: currentRound,
        index: packets.length,
        direction: 'CLIENT_TO_SERVER',
        seqA: lostPkt.seqA,
        ackExpectedA: lostPkt.ackExpectedA,
        seqB: this.state.serverCurrentSeq,
        len: this.state.mss,
        isLost: false,
        isRetransmission: true,
        status: 'TIMEOUT_RETX'
      };
      packets.push(retxPkt);
      this.state.stats.retransmissions++;

      // Nginx responde ÚNICAMENTE a la retransmisión
      acks.push({
        id: `ACK-TIMEOUT-R${currentRound}`,
        direction: 'SERVER_TO_CLIENT',
        round: currentRound,
        seqB: this.state.serverCurrentSeq,
        ackA: lostPkt.ackExpectedA,
        isDuplicate: false,
        isTimeoutAck: true,
        dupNumber: 0,
        text: `ack=${lostPkt.ackExpectedA} (Post-Timeout)`
      });

      this.state.clientSendBase = lostPkt.ackExpectedA;
      this.state.serverLastAckSent = lostPkt.ackExpectedA;
      this.state.serverBuffer.expectedSeq = lostPkt.ackExpectedA;
      this.state.clientNextSeq = lostPkt.ackExpectedA;

      this.state.lastEvent = {
        type: 'TIMEOUT',
        title: `Pérdida por Temporizador ➔ Timeout (RTO)`,
        description: `Se perdió Seq=${lostPkt.seqA}. Solo se recibieron ${dupCount} ACKs duplicados (insuficientes para Fast Retransmit, que requiere 3). El temporizador RTO expiró y TCP asume una congestión tan severa que también cae a 1 MSS, comportándose temporalmente de forma idéntica a TCP Tahoe.`,
        action: `Medida drástica de TCP (Reno y Tahoe): ssthresh = cwnd / 2 = ${newSsthresh} MSS. cwnd colapsa incondicionalmente a 1 MSS e inicia Arranque Lento (1 ➔ 2 ➔ 4) hasta alcanzar ssthresh.`
      };
    }

    const currentHist = this.state.historyRounds[this.state.historyRounds.length - 1];
    if (currentHist) {
      currentHist.lossType = effectiveLossType;
      currentHist.cwndBeforeLoss = cwndAtLoss;
      currentHist.cwndAfterLoss = this.state.cwnd;
      currentHist.ssthresh = newSsthresh;
      currentHist.phase = this.state.phase;
    }

    // Para la siguiente ronda:
    // Si fue 3x Dup ACK y Reno estaba en FAST_RECOVERY, pasa a CONGESTION_AVOIDANCE
    // Si fue Timeout o Tahoe, permanece en SLOW_START con cwnd = 1 MSS
    const nextRoundPhase = (this.state.algorithm === 'RENO' && effectiveLossType === 'TRIPLE_DUP_ACK')
      ? 'CONGESTION_AVOIDANCE'
      : 'SLOW_START';

    this.state.historyRounds.push({
      round: currentRound + 1,
      cwnd: this.state.cwnd,
      ssthresh: this.state.ssthresh,
      phase: nextRoundPhase,
      event: this.state.lastEvent.title,
      lossType: null
    });

    this.state.phase = nextRoundPhase;
    return { lossType: effectiveLossType };
  }

  /**
   * Manejo de Descarte por Saturación de Búfer en el Router L3 (Cisco C9200)
   * Los paquetes que exceden la capacidad de la cola se descartan al final de la ráfaga.
   * Al no haber paquetes posteriores entregados, el receptor no genera 3 ACKs duplicados.
   * El emisor sufre un TIMEOUT. Tanto TCP Reno como TCP Tahoe toman la medida drástica:
   * ssthresh = cwnd / 2, cwnd = 1 MSS y entrada en Arranque Lento.
   */
  handleQueueDropEvaluation(packets, queueCapacity, currentRound, acks) {
    const cwndAtLoss = this.state.cwnd;
    this.state.stats.totalLossEvents++;
    this.state.stats.timeoutCount++;

    const newSsthresh = Math.max(2, Math.floor(cwndAtLoss / 2));
    this.state.ssthresh = newSsthresh;
    this.state.hasCongestionOccurred = true;

    // Los paquetes que cupieron en la cola (0 a queueCapacity - 1) se entregan y reconocen
    const deliveredCount = Math.min(packets.length, queueCapacity);
    for (let i = 0; i < deliveredCount; i++) {
      const pkt = packets[i];
      if (pkt.isLost) continue;
      this.state.clientSendBase = pkt.ackExpectedA;
      this.state.serverLastAckSent = pkt.ackExpectedA;
      this.state.serverBuffer.expectedSeq = pkt.ackExpectedA;
      this.state.stats.totalAcksReceived++;

      acks.push({
        id: `ACK-R${currentRound}-${i + 1}`,
        direction: 'SERVER_TO_CLIENT',
        round: currentRound,
        seqB: this.state.serverCurrentSeq,
        ackA: pkt.ackExpectedA,
        isDuplicate: false,
        dupNumber: 0,
        text: `ack=${pkt.ackExpectedA}`
      });
    }

    // El primer paquete descartado por cola
    const firstDropped = packets[deliveredCount] || packets[packets.length - 1];

    // En saturación de cola:
    // No hay paquetes posteriores entregados a Nginx, por lo que dupCount = 0 (no hay 3x dup ACK).
    // El emisor espera hasta que el timer RTO expira.
    // MEDIDA DRÁSTICA: ¡Tanto Reno como Tahoe reducen cwnd incondicionalmente a 1 MSS y entran en Arranque Lento!
    this.state.cwnd = 1.0;
    this.state.phase = 'SLOW_START';
    this.state.dupACKcount = 0;
    this.state.serverBuffer.outOfOrderSegments = [];

    // Retransmisión tras vencimiento del temporizador RTO
    const retxPkt = {
      id: `RETX-QUEUE-R${currentRound}`,
      round: currentRound,
      index: packets.length,
      direction: 'CLIENT_TO_SERVER',
      seqA: firstDropped.seqA,
      ackExpectedA: firstDropped.ackExpectedA,
      seqB: this.state.serverCurrentSeq,
      len: this.state.mss,
      isLost: false,
      isRetransmission: true,
      status: 'QUEUE_RETX_DELIVERED'
    };
    packets.push(retxPkt);
    this.state.stats.retransmissions++;

    acks.push({
      id: `ACK-QUEUE-RETX-R${currentRound}`,
      direction: 'SERVER_TO_CLIENT',
      round: currentRound,
      seqB: this.state.serverCurrentSeq,
      ackA: firstDropped.ackExpectedA,
      isDuplicate: false,
      isTimeoutAck: true,
      dupNumber: 0,
      text: `ack=${firstDropped.ackExpectedA} (Post-Timeout)`
    });

    this.state.clientSendBase = firstDropped.ackExpectedA;
    this.state.serverLastAckSent = firstDropped.ackExpectedA;
    this.state.serverBuffer.expectedSeq = firstDropped.ackExpectedA;
    this.state.clientNextSeq = firstDropped.ackExpectedA;

    this.state.lastEvent = {
      type: 'QUEUE_DROP',
      title: `Descarte por Búfer L3 Lleno ➔ Timeout`,
      description: `La ráfaga de ${packets.length} paquetes saturó el búfer del router C9200 (${queueCapacity} ranuras). Se descartaron ${packets.length - deliveredCount} paquetes. Al no haber segmentos posteriores, no hubo ACKs duplicados y el temporizador RTO expiró. El mecanismo de seguridad asume congestión severa y cae a 1 MSS, comportándose temporalmente de forma idéntica a TCP Tahoe.`,
      action: `Medida drástica de seguridad (Reno y Tahoe): ssthresh = cwnd / 2 = ${newSsthresh} MSS. cwnd colapsa incondicionalmente a 1 MSS e inicia Arranque Lento (1 ➔ 2 ➔ 4) hasta alcanzar ssthresh.`
    };

    const currentHist = this.state.historyRounds[this.state.historyRounds.length - 1];
    if (currentHist) {
      currentHist.lossType = 'QUEUE_DROP';
      currentHist.cwndBeforeLoss = cwndAtLoss;
      currentHist.cwndAfterLoss = 1.0;
      currentHist.ssthresh = newSsthresh;
      currentHist.phase = 'SLOW_START';
    }

    this.state.historyRounds.push({
      round: currentRound + 1,
      cwnd: 1.0,
      ssthresh: this.state.ssthresh,
      phase: 'SLOW_START',
      event: this.state.lastEvent.title,
      lossType: null
    });

    this.state.phase = 'SLOW_START';
  }

  /**
   * Manejo de Pérdida por Temporizador (Timeout / RTO)
   * Medida drástica: tanto Reno como Tahoe colapsan la ventana de congestión a 1 MSS.
   */
  handleTimeoutEvaluation(packets, lostIndex, currentRound, acks) {
    const lostPkt = packets[lostIndex];
    const cwndAtLoss = this.state.cwnd;
    this.state.stats.totalLossEvents++;
    this.state.stats.timeoutCount++;

    const newSsthresh = Math.max(2, Math.floor(cwndAtLoss / 2));
    this.state.ssthresh = newSsthresh;
    this.state.hasCongestionOccurred = true;

    // Paquetes previos al perdido (si los hay) llegan y se reconocen
    for (let i = 0; i < lostIndex; i++) {
      const pkt = packets[i];
      this.state.clientSendBase = pkt.ackExpectedA;
      this.state.serverLastAckSent = pkt.ackExpectedA;
      this.state.serverBuffer.expectedSeq = pkt.ackExpectedA;
      this.state.stats.totalAcksReceived++;
      acks.push({
        id: `ACK-R${currentRound}-${i + 1}`,
        direction: 'SERVER_TO_CLIENT',
        round: currentRound,
        seqB: this.state.serverCurrentSeq,
        ackA: pkt.ackExpectedA,
        isDuplicate: false,
        dupNumber: 0,
        text: `ack=${pkt.ackExpectedA}`
      });
    }

    // En Timeout:
    // El emisor espera hasta que el timer RTO expira sin recibir reconocimientos para el paquete perdido.
    // MEDIDA DRÁSTICA: ¡Tanto Reno como Tahoe reducen incondicionalmente la ventana de congestión a 1 MSS!
    this.state.cwnd = 1.0;
    this.state.phase = 'SLOW_START';
    this.state.dupACKcount = 0;
    this.state.serverBuffer.outOfOrderSegments = [];

    // Retransmisión tras vencimiento del temporizador RTO
    const retxPkt = {
      id: `TIMEOUT-RETX-R${currentRound}`,
      round: currentRound,
      index: packets.length,
      direction: 'CLIENT_TO_SERVER',
      seqA: lostPkt.seqA,
      ackExpectedA: lostPkt.ackExpectedA,
      seqB: this.state.serverCurrentSeq,
      len: this.state.mss,
      isLost: false,
      isRetransmission: true,
      status: 'TIMEOUT_RETX'
    };
    packets.push(retxPkt);
    this.state.stats.retransmissions++;

    // Nginx responde ÚNICAMENTE a la retransmisión
    acks.push({
      id: `ACK-TIMEOUT-R${currentRound}`,
      direction: 'SERVER_TO_CLIENT',
      round: currentRound,
      seqB: this.state.serverCurrentSeq,
      ackA: lostPkt.ackExpectedA,
      isDuplicate: false,
      isTimeoutAck: true,
      dupNumber: 0,
      text: `ack=${lostPkt.ackExpectedA} (Post-Timeout)`
    });

    this.state.clientSendBase = lostPkt.ackExpectedA;
    this.state.serverLastAckSent = lostPkt.ackExpectedA;
    this.state.serverBuffer.expectedSeq = lostPkt.ackExpectedA;
    this.state.clientNextSeq = lostPkt.ackExpectedA;

    this.state.lastEvent = {
      type: 'TIMEOUT',
      title: `Pérdida por Temporizador (Timeout / RTO)`,
      description: `El segmento Seq=${lostPkt.seqA} se perdió en el canal. El temporizador de retransmisión (${this.config.rto} ms) expiró sin recibir 3 ACKs duplicados. Al no haber confirmaciones, el mecanismo de seguridad asume una congestión tan severa que también se cae a 1 MSS, comportándose temporalmente de forma idéntica a TCP Tahoe.`,
      action: `Medida drástica de seguridad (Reno y Tahoe): ssthresh = cwnd / 2 = ${newSsthresh} MSS. cwnd colapsa incondicionalmente a 1 MSS e inicia Arranque Lento (1 ➔ 2 ➔ 4) hasta alcanzar ssthresh.`
    };

    const currentHist = this.state.historyRounds[this.state.historyRounds.length - 1];
    if (currentHist) {
      currentHist.lossType = 'TIMEOUT';
      currentHist.cwndBeforeLoss = cwndAtLoss;
      currentHist.cwndAfterLoss = 1.0;
      currentHist.ssthresh = newSsthresh;
      currentHist.phase = 'SLOW_START';
    }

    this.state.historyRounds.push({
      round: currentRound + 1,
      cwnd: 1.0,
      ssthresh: this.state.ssthresh,
      phase: 'SLOW_START',
      event: this.state.lastEvent.title,
      lossType: null
    });

    this.state.phase = 'SLOW_START';
  }

  static getScenarioScript(scenarioId, customParams = {}) {
    switch (scenarioId) {
      case 'SCENARIO_1_KUROSE_FIG_353':
        return {
          id: 'SCENARIO_1_KUROSE_FIG_353',
          name: 'Crecimiento en Slow Start, Pérdida y 3 ACKs Duplicados (Fast Retransmit)',
          bookReference: 'Kurose & Ross 5ª Ed. - Cap. 3.7 (Figuras 3.37 y 3.53)',
          description: 'Arranque lento puro (1 ➔ 2 ➔ 4 ➔ 8 MSS) sin umbrales imaginarios. En cwnd=8 MSS se pierde un segmento, se generan 3 ACKs duplicados, se crea ssthresh=4 MSS por primera vez, y TCP Reno continúa en Evitación de Congestión (4 ➔ 5 ➔ 6...).',
          config: {
            algorithm: customParams.algorithm || 'RENO',
            initialCwnd: 1,
            initialSsthresh: null,           // ssthresh NO existe al inicio; se genera ante la 1ª congestión
            bufferCapacity: customParams.bufferCapacity || 8,
            enforceBufferLimit: true,
            mss: customParams.mss || 1460,
            rtt: 50,
            clientISN: 1000,
            serverISN: 50000
          },
          roundsPlan: [
            { round: 1, lossEvent: null }, // cwnd: 1 -> 2 (Slow Start)
            { round: 2, lossEvent: null }, // cwnd: 2 -> 4 (Slow Start)
            { round: 3, lossEvent: null }, // cwnd: 4 -> 8 (Slow Start)
            { round: 4, lossEvent: 'TRIPLE_DUP_ACK', lostSegmentIndex: 1 }, // Pérdida en cwnd=8. Genera DUP ACKs. ssthresh=4 MSS. Reno pasa a 4 en CA. Tahoe pasa a 1 en SS.
            { round: 5, lossEvent: null }, // Reno: 4 -> 5 (CA lineal). Tahoe: 1 -> 2 (SS)
            { round: 6, lossEvent: null }, // Reno: 5 -> 6 (CA lineal). Tahoe: 2 -> 4 (SS hits ssthresh=4)
            { round: 7, lossEvent: null }, // Reno: 6 -> 7 (CA lineal). Tahoe: 4 -> 5 (CA lineal)
            { round: 8, lossEvent: null }, // Reno: 7 -> 8 (CA lineal). Tahoe: 5 -> 6 (CA lineal)
            { round: 9, lossEvent: null }, // Reno: 8 -> 9 (CA lineal). Tahoe: 6 -> 7 (CA lineal)
            { round: 10, lossEvent: null }, // Reno: 9 -> 10 (CA lineal). Tahoe: 7 -> 8 (CA lineal)
            { round: 11, lossEvent: null }, // Reno: 10 -> 11 (CA lineal)
            { round: 12, lossEvent: null }, // Reno: 11 -> 12 (CA lineal)
            { round: 13, lossEvent: null }, // Reno: 12 -> 13 (CA lineal)
            { round: 14, lossEvent: null }, // Reno: 13 -> 14 (CA lineal)
            { round: 15, lossEvent: null }, // Reno: 14 -> 15 (CA lineal)
            { round: 16, lossEvent: null }  // Reno: 15 -> 16 (CA lineal)
          ]
        };

      case 'SCENARIO_2_TIMEOUT':
        return {
          id: 'SCENARIO_2_TIMEOUT',
          name: 'Pérdida por Temporizador (Timeout / RTO) y Caída a 1 MSS',
          bookReference: 'Kurose & Ross 5ª Ed. - Cap. 3.7 (Figuras 3.52 y 3.53)',
          description: 'Arranque lento exponencial hasta cwnd=8 MSS. Pérdida severa con expiración del temporizador RTO sin ACKs. Se calcula ssthresh=4 MSS y cwnd colapsa a 1 MSS en ambos algoritmos (Reno y Tahoe), reiniciando en Arranque Lento hasta ssthresh.',
          config: {
            algorithm: customParams.algorithm || 'RENO',
            initialCwnd: 1,
            initialSsthresh: null,           // ssthresh NO existe al inicio
            bufferCapacity: customParams.bufferCapacity || 8,
            enforceBufferLimit: true,
            mss: customParams.mss || 1460,
            rtt: 50,
            clientISN: 1000,
            serverISN: 50000
          },
          roundsPlan: [
            { round: 1, lossEvent: null }, // cwnd: 1 -> 2 (Slow Start)
            { round: 2, lossEvent: null }, // cwnd: 2 -> 4 (Slow Start)
            { round: 3, lossEvent: null }, // cwnd: 4 -> 8 (Slow Start)
            { round: 4, lossEvent: 'TIMEOUT', lostSegmentIndex: 0 }, // Timeout en cwnd=8. ssthresh=4 MSS. cwnd colapsa a 1 MSS en SS (tanto en Reno como en Tahoe).
            { round: 5, lossEvent: null }, // cwnd: 1 -> 2 (Slow Start)
            { round: 6, lossEvent: null }, // cwnd: 2 -> 4 (Slow Start alcanza ssthresh=4)
            { round: 7, lossEvent: null }, // cwnd: 4 -> 5 (Evitación de Congestión lineal)
            { round: 8, lossEvent: null }, // cwnd: 5 -> 6 (CA lineal)
            { round: 9, lossEvent: null }, // cwnd: 6 -> 7 (CA lineal)
            { round: 10, lossEvent: null }, // cwnd: 7 -> 8 (CA lineal)
            { round: 11, lossEvent: null }, // cwnd: 8 -> 9 (CA lineal)
            { round: 12, lossEvent: null }, // cwnd: 9 -> 10 (CA lineal)
            { round: 13, lossEvent: null }, // cwnd: 10 -> 11 (CA lineal)
            { round: 14, lossEvent: null }, // cwnd: 11 -> 12 (CA lineal)
            { round: 15, lossEvent: null }, // cwnd: 12 -> 13 (CA lineal)
            { round: 16, lossEvent: null }  // cwnd: 13 -> 14 (CA lineal)
          ]
        };

      case 'SCENARIO_3_SAWTOOTH_AIMD':
        return {
          id: 'SCENARIO_3_SAWTOOTH_AIMD',
          name: 'Figura 3.54: Régimen Permanente AIMD (Diente de Sierra)',
          bookReference: 'Kurose & Ross 5ª Ed. - Cap. 3.7, Página 272, Figura 3.54',
          description: 'Comportamiento macroscópico cíclico de TCP Reno: sondeo lineal del ancho de banda (+1 MSS por RTT) seguido de reducción multiplicativa (cwnd/2) ante eventos periódicos de congestión.',
          config: {
            algorithm: 'RENO',
            initialCwnd: 4,
            initialSsthresh: 4,              // Régimen permanente: ssthresh ya activo
            bufferCapacity: customParams.bufferCapacity || 8,
            enforceBufferLimit: true,
            mss: customParams.mss || 1460,
            rtt: 50,
            clientISN: 1000,
            serverISN: 50000
          },
          roundsPlan: [
            { round: 1, lossEvent: null }, // cwnd: 4 -> 5 (CA lineal)
            { round: 2, lossEvent: null }, // cwnd: 5 -> 6 (CA lineal)
            { round: 3, lossEvent: null }, // cwnd: 6 -> 7 (CA lineal)
            { round: 4, lossEvent: null }, // cwnd: 7 -> 8 (CA lineal)
            { round: 5, lossEvent: 'TRIPLE_DUP_ACK', lostSegmentIndex: 1 }, // Pérdida en cwnd=8. ssthresh=4 MSS. cwnd=4 MSS.
            { round: 6, lossEvent: null }, // cwnd: 4 -> 5 (CA lineal)
            { round: 7, lossEvent: null }, // cwnd: 5 -> 6 (CA lineal)
            { round: 8, lossEvent: null }, // cwnd: 6 -> 7 (CA lineal)
            { round: 9, lossEvent: 'TRIPLE_DUP_ACK', lostSegmentIndex: 1 }, // Pérdida en cwnd=7. ssthresh=3 MSS. cwnd=3 MSS.
            { round: 10, lossEvent: null }, // cwnd: 3 -> 4 (CA lineal)
            { round: 11, lossEvent: null }, // cwnd: 4 -> 5 (CA lineal)
            { round: 12, lossEvent: null }, // cwnd: 5 -> 6 (CA lineal)
            { round: 13, lossEvent: 'TRIPLE_DUP_ACK', lostSegmentIndex: 1 }, // Pérdida en cwnd=6. ssthresh=3 MSS. cwnd=3 MSS.
            { round: 14, lossEvent: null }, // cwnd: 3 -> 4 (CA lineal)
            { round: 15, lossEvent: null }, // cwnd: 4 -> 5 (CA lineal)
            { round: 16, lossEvent: null }  // cwnd: 5 -> 6 (CA lineal)
          ]
        };

      case 'SCENARIO_4_QUEUE_CONGESTION':
        return {
          id: 'SCENARIO_4_QUEUE_CONGESTION',
          name: 'Saturación de Cola en Enlace Cuello de Botella (Búfer L3 Lleno)',
          bookReference: 'Kurose & Ross 5ª Ed. - Cap. 3.6 y 3.7, Página 266',
          description: 'Demostración de cómo la acumulación de paquetes en el router de interconexión (Cisco C9200) supera el tamaño del búfer (8 paquetes), forzando el descarte por saturación y la reacción de TCP.',
          config: {
            algorithm: 'RENO',
            initialCwnd: 1,
            initialSsthresh: null,           // ssthresh NO existe al inicio
            bufferCapacity: 8,
            enforceBufferLimit: true,
            mss: customParams.mss || 1460,
            rtt: 50,
            clientISN: 1000,
            serverISN: 50000
          },
          roundsPlan: [
            { round: 1, lossEvent: null }, // cwnd: 1 (router: 1/8)
            { round: 2, lossEvent: null }, // cwnd: 2 (router: 2/8)
            { round: 3, lossEvent: null }, // cwnd: 4 (router: 4/8)
            { round: 4, lossEvent: null }, // cwnd: 8 (router: 8/8 ¡Lleno!)
            { round: 5, lossEvent: 'QUEUE_DROP' }, // cwnd: 16 -> supera 8 slots. Descarte en cola ➔ Timeout. ssthresh=8 MSS. cwnd colapsa a 1 MSS.
            { round: 6, lossEvent: null }, // cwnd: 1 -> 2 (SS)
            { round: 7, lossEvent: null }, // cwnd: 2 -> 4 (SS)
            { round: 8, lossEvent: null }, // cwnd: 4 -> 8 (SS, alcanza ssthresh=8 MSS)
            { round: 9, lossEvent: null }, // cwnd: 8 -> 9 (CA lineal)
            { round: 10, lossEvent: null }, // cwnd: 9 -> 10 (CA lineal)
            { round: 11, lossEvent: null }, // cwnd: 10 -> 11 (CA lineal)
            { round: 12, lossEvent: null }, // cwnd: 11 -> 12 (CA lineal)
            { round: 13, lossEvent: null }, // cwnd: 12 -> 13 (CA lineal)
            { round: 14, lossEvent: null }, // cwnd: 13 -> 14 (CA lineal)
            { round: 15, lossEvent: null }, // cwnd: 14 -> 15 (CA lineal)
            { round: 16, lossEvent: null }  // cwnd: 15 -> 16 (CA lineal)
          ]
        };

      default:
        return TCPEngine.getScenarioScript('SCENARIO_1_KUROSE_FIG_353', customParams);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TCPEngine;
} else {
  window.TCPEngine = TCPEngine;
}
