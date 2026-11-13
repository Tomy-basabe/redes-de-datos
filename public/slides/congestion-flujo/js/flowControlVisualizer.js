/**
 * flowControlVisualizer.js - Visualizador Interactivo del Balde / Búfer de Recepción TCP
 * Basado estrictamente en Kurose & Ross (Capítulo 3.5.5: Control de flujo)
 * 
 * Topología escolar (Escuela 4-025 Los Corralitos):
 * - Emisor: PC Estudiantes (172.16.20.10:51842) - VLAN 20
 * - Receptor TCP Directo: Nginx Proxy Inverso (172.16.10.12:443) - VLAN 10 (Gestión)
 * - Backend Interno: Servidor Samba VM (172.16.10.13:445) - VLAN 10 (Almacenamiento CIFS/SMB)
 * - Switch Core L3: Cisco Catalyst C9200 (Enlace Inter-VLAN 20 ⇄ 10)
 * 
 * Arquitectura Teórica Real:
 * - Las PC de los estudiantes NO se conectan directamente a Samba, sino que establecen su socket TCP con NGINX (Proxy Inverso en TCP 443).
 * - El "Balde" modela el Búfer de Recepción del socket TCP de Nginx (RcvBuffer = 16 MSS = 23,360 B).
 * - Grifo Superior (Entrada desde Red) = LastByteRcvd (datos que Nginx recibe por TCP de PC Estudiantes).
 * - Grifo Inferior (Salida / Reenvío Proxy) = LastByteRead (proceso worker de Nginx lee del búfer y reenvía por red interna a Samba VM).
 * - Si Samba VM sufre sobrecarga en I/O de disco, Nginx no puede vaciar su búfer de socket hacia Samba;
 *   el balde de Nginx se llena, su rwnd colapsa a 0, y Nginx estrangula a la PC de estudiantes anunciando rwnd = 0.
 * - Regla de Envío: Límite de Envío = min(cwnd, rwnd).
 * - Si rwnd = 0: PC Estudiantes activa temporizador y envía Sondas de 1 Byte a Nginx para evitar deadlock.
 */

class FlowControlVisualizer {
  constructor(containerId = 'sector-c-flow-control') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    // Constantes TCP (Kurose & Ross Cap. 3.5.5)
    this.mss = 1460;                       // Bytes por MSS
    this.rcvBufferMSS = 16;                 // Capacidad física total del búfer (16 MSS)
    this.rcvBufferBytes = this.rcvBufferMSS * this.mss; // 23,360 B

    // Variables de secuencia y punteros
    this.initialSeq = 1000;
    this.lastByteRcvd = this.initialSeq;   // Próximo byte continuo recibido
    this.lastByteRead = this.initialSeq;   // Próximo byte leído por Nginx y reenviado a Samba

    // Estado del búfer
    this.occupiedMSS = 2;                  // Inicialmente 2 MSS en búfer (holgado)
    this.cwndMSS = 8;                      // cwnd de red de PC Estudiantes
    this.isZeroWindow = false;
    this.isThrottled = false;
    this.effectiveWindowMSS = 8;

    // Configuración de simulación
    this.diskSpeed = 'SLOW';               // 'SLOW', 'NORMAL', 'FAST', 'BLOCKED'
    this.autoPlayActive = false;
    this.autoPlayTimer = null;
    this.stepIndex = 0;

    this.bindDOM();
    this.bindEvents();
    this.updateUI();
    this.logStep('Laboratorio Inicializado', 'Búfer de recepción en Nginx Proxy Inverso (172.16.10.12:443) listo. Espacio libre rwnd = 14 MSS. Backend: Samba VM (172.16.10.13:445).', 'info');
  }

  bindDOM() {
    // Referencias a elementos interactivos del DOM
    this.elements = {
      // Indicadores principales
      rwndBadge: document.getElementById('fc-rwnd-badge'),
      effectiveBadge: document.getElementById('fc-effective-badge'),
      statusBadge: document.getElementById('fc-status-badge'),
      
      // PC Estudiantes
      pcCwnd: document.getElementById('fc-pc-cwnd'),
      pcRwnd: document.getElementById('fc-pc-rwnd'),
      pcEffective: document.getElementById('fc-pc-effective'),
      pcState: document.getElementById('fc-pc-state'),
      
      // Samba VM & Balde
      bucketLiquid: document.getElementById('fc-bucket-liquid'),
      bucketOccupiedText: document.getElementById('fc-bucket-occupied-text'),
      bucketFreeSpace: document.getElementById('fc-bucket-free-space'),
      bucketRwndText: document.getElementById('fc-bucket-rwnd-text'),
      bucketRcvBufferText: document.getElementById('fc-bucket-rcvbuffer-text'),
      sambaDiskState: document.getElementById('fc-samba-disk-state'),
      
      // Tuberías y Canales animados
      channelDataPacket: document.getElementById('fc-packet-data'),
      channelAckPacket: document.getElementById('fc-packet-ack'),
      waterFlowIn: document.getElementById('fc-water-flow-in'),
      waterFlowOut: document.getElementById('fc-water-flow-out'),
      
      // Fórmulas
      mathRcvBuffer: document.getElementById('fc-math-rcvbuffer'),
      mathOccupancy: document.getElementById('fc-math-occupancy'),
      mathRwnd: document.getElementById('fc-math-rwnd'),
      mathEffective: document.getElementById('fc-math-effective'),
      mathLastRcvd: document.getElementById('fc-math-last-rcvd'),
      mathLastRead: document.getElementById('fc-math-last-read'),

      // Registro de pasos
      logList: document.getElementById('fc-log-list'),
      
      // Botones
      btnSend2: document.getElementById('fc-btn-send-2'),
      btnDrain2: document.getElementById('fc-btn-drain-2'),
      btnSaturate: document.getElementById('fc-btn-saturate'),
      btnFlush: document.getElementById('fc-btn-flush'),
      btnProbe: document.getElementById('fc-btn-probe'),
      btnAutoPlay: document.getElementById('fc-btn-autoplay'),
      btnReset: document.getElementById('fc-btn-reset'),
      selectDiskSpeed: document.getElementById('fc-select-disk-speed')
    };
  }

  bindEvents() {
    if (this.elements.btnSend2) {
      this.elements.btnSend2.addEventListener('click', () => this.stepSend(2));
    }
    if (this.elements.btnDrain2) {
      this.elements.btnDrain2.addEventListener('click', () => this.stepDrain(2));
    }
    if (this.elements.btnSaturate) {
      this.elements.btnSaturate.addEventListener('click', () => this.saturateBuffer());
    }
    if (this.elements.btnFlush) {
      this.elements.btnFlush.addEventListener('click', () => this.flushBuffer());
    }
    if (this.elements.btnProbe) {
      this.elements.btnProbe.addEventListener('click', () => this.sendZeroWindowProbe());
    }
    if (this.elements.btnAutoPlay) {
      this.elements.btnAutoPlay.addEventListener('click', () => this.toggleAutoPlay());
    }
    if (this.elements.btnReset) {
      this.elements.btnReset.addEventListener('click', () => this.reset());
    }
    if (this.elements.selectDiskSpeed) {
      this.elements.selectDiskSpeed.addEventListener('change', (e) => {
        this.diskSpeed = e.target.value;
        this.updateUI();
        this.logStep('Velocidad Backend Ajustada', `Tasa de reenvío y escritura a disco en Samba VM cambiada a: ${e.target.selectedOptions[0].text}.`, 'info');
      });
    }
  }

  /**
   * Paso 1: Enviar datos desde PC Estudiantes hacia el Balde del Proxy Inverso Nginx
   * @param {number} mssAmount Cantidad de MSS a enviar
   */
  stepSend(mssAmount = 2) {
    this.stepIndex++;
    const currentRwnd = this.rcvBufferMSS - this.occupiedMSS;

    // Caso 1: Búfer ya lleno al 100% (rwnd = 0)
    if (currentRwnd <= 0) {
      this.logStep(
        `Paso ${this.stepIndex}: ¡Envío Normal Bloqueado!`,
        `rwnd = 0. PC Estudiantes (172.16.20.10) NO puede enviar ráfagas de datos normales para no provocar desbordamiento del búfer del Proxy Inverso Nginx (172.16.10.12:443). En su lugar, emite una Sonda de 1 Byte (Zero-Window Probe).`,
        'warning'
      );
      this.sendZeroWindowProbe();
      return;
    }

    // Caso 2: Se envían segmentos según la ventana permitida
    const actualSent = Math.min(mssAmount, currentRwnd);
    const bytesSent = actualSent * this.mss;
    const oldOccupied = this.occupiedMSS;
    this.occupiedMSS += actualSent;
    this.lastByteRcvd += bytesSent;

    const newRwnd = this.rcvBufferMSS - this.occupiedMSS;

    // Animación de vuelo de datos y entrada de agua al balde de Nginx
    this.animatePacketToNginx(`📦 Datos: +${actualSent} MSS (${bytesSent.toLocaleString()} B)`);
    this.animateWaterIn();

    if (newRwnd === 0) {
      this.logStep(
        `Paso ${this.stepIndex}: ¡BÚFER DE NGINX SATURADO! (rwnd = 0)`,
        `PC Estudiantes envió ${actualSent} MSS. El balde de recepción de Nginx se llenó a su capacidad máxima (${this.rcvBufferMSS} MSS / 23.3 KB) porque el backend Samba no drena a tiempo. Nginx anuncia en su ACK: rwnd = 0. PC Estudiantes frena el flujo normal y queda a la espera de sondas.`,
        'danger'
      );
    } else {
      this.logStep(
        `Paso ${this.stepIndex}: Ráfaga Recibida en Balde de Nginx`,
        `PC Estudiantes envió ${actualSent} MSS a Nginx (172.16.10.12:443). Cayeron al búfer del proxy. Ocupación sube de ${oldOccupied} a ${this.occupiedMSS} MSS. Espacio libre VentanaRecepcion (rwnd) se reduce a ${newRwnd} MSS.`,
        'send'
      );
    }

    // Nginx devuelve ACK con el nuevo rwnd
    setTimeout(() => {
      this.animateAckToPC(`ACK: Seq ${this.lastByteRcvd} | rwnd = ${newRwnd} MSS`);
      this.updateUI();
    }, 400);
  }

  /**
   * Paso 2: Nginx procesa datos del balde y los reenvía al backend Samba VM (Drenado)
   * @param {number} mssAmount Cantidad de MSS leídos y reenviados
   */
  stepDrain(mssAmount = 2) {
    this.stepIndex++;
    if (this.occupiedMSS <= 0) {
      this.logStep(
        `Paso ${this.stepIndex}: Búfer de Nginx Ya Vacío`,
        `El balde de Nginx ya tiene espacio 100% libre (rwnd = 16 MSS). El proceso proxy reenvió todos los datos pendientes al backend Samba VM (172.16.10.13:445).`,
        'info'
      );
      this.updateUI();
      return;
    }

    const actualDrained = Math.min(mssAmount, this.occupiedMSS);
    const bytesDrained = actualDrained * this.mss;
    const oldOccupied = this.occupiedMSS;
    this.occupiedMSS -= actualDrained;
    this.lastByteRead += bytesDrained;

    const newRwnd = this.rcvBufferMSS - this.occupiedMSS;

    // Animación de drenado de agua por la canilla inferior hacia Samba
    this.animateWaterOut();

    const wasZero = (oldOccupied === this.rcvBufferMSS);
    if (wasZero) {
      this.logStep(
        `Paso ${this.stepIndex}: ¡Desbloqueo de Búfer! (Window Update de Nginx)`,
        `Nginx reenvió ${actualDrained} MSS a Samba VM liberando espacio en el búfer del socket. Envía de inmediato un ACK con Actualización de Ventana (rwnd = ${newRwnd} MSS) a la PC Estudiantes, desbloqueando el envío.`,
        'success'
      );
    } else {
      this.logStep(
        `Paso ${this.stepIndex}: Nginx Reenvía Datos al Backend`,
        `Nginx leyó ${actualDrained} MSS (${bytesDrained.toLocaleString()} B) de su búfer y los envió a Samba VM (172.16.10.13:445). Ocupación bajó a ${this.occupiedMSS} MSS. VentanaRecepcion (rwnd) se amplía a ${newRwnd} MSS.`,
        'drain'
      );
    }

    // Nginx emite ACK informando la ampliación de ventana
    this.animateAckToPC(`ACK Window Update: rwnd = ${newRwnd} MSS`);
    this.updateUI();
  }

  /**
   * Escenario Rápido: Saturar el búfer de Nginx al 100% (rwnd = 0)
   */
  saturateBuffer() {
    this.stepIndex++;
    const needed = this.rcvBufferMSS - this.occupiedMSS;
    if (needed <= 0) {
      this.logStep(`Paso ${this.stepIndex}: Búfer de Nginx ya saturado`, 'El balde de recepción de Nginx ya se encuentra al 100% de ocupación (rwnd = 0).', 'warning');
      return;
    }

    this.occupiedMSS = this.rcvBufferMSS;
    this.lastByteRcvd += (needed * this.mss);

    this.animatePacketToNginx(`🔥 Ráfaga Masiva (+${needed} MSS)`);
    this.animateWaterIn();

    this.logStep(
      `Paso ${this.stepIndex}: ¡Saturación por Congestión en Backend!`,
      `Múltiples alumnos subieron archivos simultáneamente a través de Nginx (172.16.10.12). El backend Samba VM (172.16.10.13) se demoró en escribir a disco y provocó backpressure: el balde de Nginx se llenó a tope (${this.rcvBufferMSS} MSS = 23,360 B). Nginx colapsa su rwnd a 0 MSS y frena el flujo de la PC Estudiantes.`,
      'danger'
    );

    setTimeout(() => {
      this.animateAckToPC(`ACK: ¡rwnd = 0 MSS! (Búfer Lleno)`);
      this.updateUI();
    }, 450);
  }

  /**
   * Escenario Rápido: Nginx vacía el búfer reenviando todo al backend Samba
   */
  flushBuffer() {
    this.stepIndex++;
    if (this.occupiedMSS === 0) {
      this.logStep(`Paso ${this.stepIndex}: Búfer Limpio`, 'El balde de Nginx ya está vacío y listo para recibir ráfagas completas.', 'info');
      return;
    }

    const drained = this.occupiedMSS;
    this.lastByteRead += (drained * this.mss);
    this.occupiedMSS = 0;

    this.animateWaterOut();
    this.animateAckToPC(`ACK Window Reopened: rwnd = 16 MSS (23.3 KB)`);

    this.logStep(
      `Paso ${this.stepIndex}: Búfer de Nginx Completamente Vaciado`,
      `Samba VM completó las escrituras a disco y Nginx vació su búfer (LastByteRead alcanzó a LastByteRcvd). rwnd vuelve a su máximo de 16 MSS. PC Estudiantes puede transmitir sin restricciones de flujo.`,
      'success'
    );

    this.updateUI();
  }

  /**
   * Sonda de 1 Byte (Zero-Window Probe): Mecanismo crucial de Kurose & Ross
   */
  sendZeroWindowProbe() {
    this.stepIndex++;
    this.animatePacketToNginx(`⚠️ Sonda de 1 Byte (Seq=${this.lastByteRcvd})`);

    const currentRwnd = this.rcvBufferMSS - this.occupiedMSS;

    setTimeout(() => {
      this.animateAckToPC(`ACK=${this.lastByteRcvd} | rwnd = ${currentRwnd} MSS`);
      if (currentRwnd === 0) {
        this.logStep(
          `Paso ${this.stepIndex}: Sonda de 1 Byte Recibida por Nginx (rwnd = 0)`,
          `PC Estudiantes envió una Sonda de 1 Byte a Nginx (172.16.10.12:443) para consultar si ya hay espacio. Nginx responde con ACK confirmando que su búfer AÚN sigue lleno (rwnd = 0) porque Samba no ha liberado espacio. La PC seguirá sondeando periódicamente sin interbloqueo.`,
          'warning'
        );
      } else {
        this.logStep(
          `Paso ${this.stepIndex}: Sonda detectó Ventana Reabierta en Nginx`,
          `La Sonda de 1 Byte fue respondida por Nginx confirmando que ya hay espacio libre (rwnd = ${currentRwnd} MSS). ¡PC Estudiantes reanuda la transmisión normal!`,
          'success'
        );
      }
      this.updateUI();
    }, 500);
  }

  /**
   * Alternar Simulación Automática Dinámica (Llenado y Vaciado en Vivo)
   */
  toggleAutoPlay() {
    this.autoPlayActive = !this.autoPlayActive;
    if (this.elements.btnAutoPlay) {
      if (this.autoPlayActive) {
        this.elements.btnAutoPlay.innerHTML = '<span>⏸</span> Pausar Simulación';
        this.elements.btnAutoPlay.classList.add('fc-btn-active');
      } else {
        this.elements.btnAutoPlay.innerHTML = '<span>▶</span> Simulación Dinámica';
        this.elements.btnAutoPlay.classList.remove('fc-btn-active');
      }
    }

    if (this.autoPlayActive) {
      this.logStep('Modo Dinámico Iniciado', 'PC Estudiantes ➔ Nginx Proxy Inverso ➔ Samba VM interactúan en tiempo real según la velocidad del backend configurada.', 'info');
      this.autoPlayTimer = setInterval(() => {
        this.runAutoPlayTick();
      }, 1600);
    } else {
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = null;
      }
      this.logStep('Modo Dinámico Pausado', 'Simulación detenida por el usuario.', 'info');
    }
  }

  runAutoPlayTick() {
    const rwnd = this.rcvBufferMSS - this.occupiedMSS;

    // 1. Tasa de entrada (Red: PC Estudiantes intenta enviar 2 MSS si rwnd > 0)
    if (rwnd > 0) {
      const sendAmt = Math.min(2, rwnd);
      this.stepSend(sendAmt);
    } else {
      // Si rwnd = 0, emite sonda
      this.sendZeroWindowProbe();
    }

    // 2. Tasa de salida (Nginx reenvía a Samba según velocidad de disco/backend)
    setTimeout(() => {
      if (this.diskSpeed === 'BLOCKED') {
        // Backend bloqueado: 0 drenado
      } else if (this.diskSpeed === 'SLOW') {
        // Lento: drena solo 1 MSS (se acumula y satura)
        if (this.occupiedMSS > 0) this.stepDrain(1);
      } else if (this.diskSpeed === 'NORMAL') {
        // Normal: drena 2 MSS (equilibrio dinámico)
        if (this.occupiedMSS > 0) this.stepDrain(2);
      } else if (this.diskSpeed === 'FAST') {
        // Rápido: drena 3 MSS (descongestiona de inmediato)
        if (this.occupiedMSS > 0) this.stepDrain(3);
      }
    }, 800);
  }

  reset() {
    if (this.autoPlayActive) {
      this.toggleAutoPlay();
    }
    this.occupiedMSS = 2;
    this.initialSeq = 1000;
    this.lastByteRcvd = this.initialSeq + (2 * this.mss);
    this.lastByteRead = this.initialSeq;
    this.stepIndex = 0;
    this.updateUI();
    this.clearLog();
    this.logStep('Balde Reiniciado', 'Búfer de recepción de Nginx restaurado al estado inicial (2 MSS ocupados, 14 MSS libres). Backend: Samba VM.', 'info');
  }

  /**
   * Actualiza todos los elementos gráficos y visuales del Balde, tuberías y métricas
   */
  updateUI() {
    const occupied = Math.max(0, Math.min(this.rcvBufferMSS, this.occupiedMSS));
    const rwnd = this.rcvBufferMSS - occupied;
    const occupiedBytes = occupied * this.mss;
    const rwndBytes = rwnd * this.mss;

    this.isZeroWindow = (rwnd === 0);
    this.isThrottled = (rwnd < this.cwndMSS);
    this.effectiveWindowMSS = Math.min(this.cwndMSS, rwnd);
    const effectiveBytes = this.effectiveWindowMSS * this.mss;

    const fillPercent = (occupied / this.rcvBufferMSS) * 100;
    const freePercent = 100 - fillPercent;

    // 1. Actualizar el BALDE DE RECEPCIÓN
    if (this.elements.bucketLiquid) {
      this.elements.bucketLiquid.style.height = `${fillPercent}%`;
      
      // Color dinámico según nivel de saturación
      this.elements.bucketLiquid.className = 'fc-bucket-liquid';
      if (fillPercent >= 100) {
        this.elements.bucketLiquid.classList.add('fc-liquid-danger');
      } else if (fillPercent >= 60) {
        this.elements.bucketLiquid.classList.add('fc-liquid-warning');
      } else {
        this.elements.bucketLiquid.classList.add('fc-liquid-safe');
      }
    }

    if (this.elements.bucketOccupiedText) {
      this.elements.bucketOccupiedText.textContent = `${occupied} MSS (${occupiedBytes.toLocaleString()} B)`;
    }

    if (this.elements.bucketFreeSpace) {
      this.elements.bucketFreeSpace.style.height = `${freePercent}%`;
    }

    if (this.elements.bucketRwndText) {
      this.elements.bucketRwndText.textContent = `${rwnd} MSS (${rwndBytes.toLocaleString()} B)`;
    }

    // 2. Insignias de Cabecera
    if (this.elements.rwndBadge) {
      this.elements.rwndBadge.textContent = `${rwnd.toFixed(1)} MSS libres`;
      this.elements.rwndBadge.className = `fc-kpi-badge ${this.isZeroWindow ? 'fc-kpi-badge-danger' : (this.isThrottled ? 'fc-kpi-badge-warning' : 'fc-kpi-badge-safe')}`;
    }

    if (this.elements.effectiveBadge) {
      this.elements.effectiveBadge.textContent = `${this.effectiveWindowMSS.toFixed(1)} MSS`;
    }

    if (this.elements.statusBadge) {
      if (this.isZeroWindow) {
        this.elements.statusBadge.textContent = '¡Búfer Lleno! (rwnd = 0) · Sondas Activas';
        this.elements.statusBadge.className = 'fc-status-pill fc-pill-danger';
      } else if (this.isThrottled) {
        this.elements.statusBadge.textContent = `Estrangulamiento por Control de Flujo (${rwnd} < ${this.cwndMSS} cwnd)`;
        this.elements.statusBadge.className = 'fc-status-pill fc-pill-warning';
      } else {
        this.elements.statusBadge.textContent = `Transmisión Normal (Limitada por Red cwnd = ${this.cwndMSS} MSS)`;
        this.elements.statusBadge.className = 'fc-status-pill fc-pill-safe';
      }
    }

    // 3. Tarjeta PC Estudiantes
    if (this.elements.pcCwnd) this.elements.pcCwnd.textContent = `${this.cwndMSS} MSS`;
    if (this.elements.pcRwnd) this.elements.pcRwnd.textContent = `${rwnd} MSS`;
    if (this.elements.pcEffective) this.elements.pcEffective.textContent = `${this.effectiveWindowMSS} MSS (${effectiveBytes.toLocaleString()} B)`;
    
    if (this.elements.pcState) {
      if (this.isZeroWindow) {
        this.elements.pcState.textContent = '⛔ Pausado por rwnd=0 (Emitiendo Sonda 1B)';
        this.elements.pcState.className = 'fc-host-state fc-state-danger';
      } else if (this.isThrottled) {
        this.elements.pcState.textContent = '⚠️ Frenado por rwnd (Proxy Nginx limita envío)';
        this.elements.pcState.className = 'fc-host-state fc-state-warning';
      } else {
        this.elements.pcState.textContent = '✅ Transmitiendo a Nginx a velocidad de red';
        this.elements.pcState.className = 'fc-host-state fc-state-safe';
      }
    }

    // 4. Tarjeta Nginx Proxy Inverso (Estado de Reenvío a Samba)
    if (this.elements.sambaDiskState) {
      if (this.diskSpeed === 'BLOCKED') {
        this.elements.sambaDiskState.textContent = '🛑 Backend Bloqueado (0 KB/s - I/O Samba Detenido)';
      } else if (this.diskSpeed === 'SLOW') {
        this.elements.sambaDiskState.textContent = '🐢 Backend Samba Lento (I/O Lento ~ 1 MSS/s)';
      } else if (this.diskSpeed === 'NORMAL') {
        this.elements.sambaDiskState.textContent = '⚖️ Reenvío Fluido a Samba (~ 2 MSS/s)';
      } else if (this.diskSpeed === 'FAST') {
        this.elements.sambaDiskState.textContent = '🚀 Reenvío Ágil a Samba SSD (~ 3 MSS/s)';
      }
    }

    // 5. Fórmulas Matemáticas en Vivo
    if (this.elements.mathRcvBuffer) this.elements.mathRcvBuffer.textContent = `${this.rcvBufferMSS} MSS (${this.rcvBufferBytes.toLocaleString()} B)`;
    if (this.elements.mathOccupancy) this.elements.mathOccupancy.textContent = `${occupied} MSS (${occupiedBytes.toLocaleString()} B)`;
    if (this.elements.mathRwnd) this.elements.mathRwnd.textContent = `${rwnd} MSS (${rwndBytes.toLocaleString()} B)`;
    if (this.elements.mathEffective) this.elements.mathEffective.textContent = `${this.effectiveWindowMSS} MSS (${effectiveBytes.toLocaleString()} B)`;
    if (this.elements.mathLastRcvd) this.elements.mathLastRcvd.textContent = this.lastByteRcvd.toLocaleString();
    if (this.elements.mathLastRead) this.elements.mathLastRead.textContent = this.lastByteRead.toLocaleString();
  }

  animatePacketToNginx(label) {
    const el = this.elements.channelDataPacket;
    if (!el) return;
    el.textContent = label;
    el.classList.remove('fc-fly-right');
    void el.offsetWidth; // Force reflow
    el.classList.add('fc-fly-right');
  }

  animatePacketToSamba(label) {
    this.animatePacketToNginx(label);
  }

  animateAckToPC(label) {
    const el = this.elements.channelAckPacket;
    if (!el) return;
    el.textContent = label;
    el.classList.remove('fc-fly-left');
    void el.offsetWidth; // Force reflow
    el.classList.add('fc-fly-left');
  }

  animateWaterIn() {
    const el = this.elements.waterFlowIn;
    if (!el) return;
    el.classList.add('fc-flow-active');
    setTimeout(() => el.classList.remove('fc-flow-active'), 600);
  }

  animateWaterOut() {
    const el = this.elements.waterFlowOut;
    if (!el) return;
    el.classList.add('fc-flow-active');
    setTimeout(() => el.classList.remove('fc-flow-active'), 600);
  }

  logStep(title, desc, type = 'info') {
    const logList = this.elements.logList;
    if (!logList) return;

    const item = document.createElement('div');
    item.className = `fc-log-entry fc-log-${type}`;
    item.innerHTML = `
      <div class="fc-log-title-row">
        <span class="fc-log-bullet"></span>
        <strong class="fc-log-title">${title}</strong>
      </div>
      <div class="fc-log-desc">${desc}</div>
    `;

    logList.prepend(item);
    while (logList.children.length > 20) {
      logList.removeChild(logList.lastChild);
    }
  }

  clearLog() {
    if (this.elements.logList) {
      this.elements.logList.innerHTML = '';
    }
  }
}

// Exportación universal para navegador o pruebas
if (typeof window !== 'undefined') {
  window.FlowControlVisualizer = FlowControlVisualizer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlowControlVisualizer;
}

