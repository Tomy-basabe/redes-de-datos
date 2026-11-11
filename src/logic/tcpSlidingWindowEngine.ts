/**
 * MOTOR DE VENTANA DESLIZANTE TCP (SLIDING WINDOW ENGINE)
 * Simulación rigurosa según RFC 793 / RFC 5681
 * Modela Emisor, Receptor, rwnd, cwnd, ACKs acumulativos, ACKs duplicados, Fast Retransmit y Timeout.
 */

export interface TcpSegment {
  seq: number;
  length: number; // bytes
  data: string;
  status: 'en_espera' | 'en_vuelo' | 'recibido' | 'perdido' | 'corrupto' | 'confirmado';
  isRetransmission?: boolean;
}

export interface TcpAck {
  ackNum: number;
  isDuplicate: boolean;
  duplicateCount: number;
  status: 'en_vuelo' | 'recibido' | 'perdido';
}

export interface SlidingWindowState {
  // Parámetros
  mss: number;
  totalBytes: number;
  rwnd: number; // Ventana anunciada por receptor en bytes
  cwnd: number; // Ventana de congestión en bytes
  effectiveWindow: number; // min(rwnd, cwnd)
  
  // Emisor
  sendBase: number; // Secuencia del byte más antiguo sin confirmar
  nextSeqNum: number; // Siguiente byte a transmitir
  segments: TcpSegment[];
  acks: TcpAck[];
  
  // Receptor
  rcvNext: number; // Siguiente byte esperado en orden
  rcvBufferTotal: number;
  rcvBufferOccupied: number;
  outOfOrderBuffer: TcpSegment[];
  
  // Eventos y Estadísticas
  duplicateAckCount: number;
  fastRetransmitTriggered: boolean;
  timeoutOccurred: boolean;
  rtoTimerMs: number;
  logMessages: string[];
}

export const createInitialWindowState = (
  initialRwndBytes: number = 4380, // ~3 MSS (1460 * 3)
  initialCwndBytes: number = 4380,
  segmentCount: number = 8,
  mss: number = 1460
): SlidingWindowState => {
  const segments: TcpSegment[] = [];
  for (let i = 0; i < segmentCount; i++) {
    segments.push({
      seq: 1000 + i * mss,
      length: mss,
      data: `Bloque #${i + 1} (${mss} B)`,
      status: 'en_espera'
    });
  }

  const effectiveWindow = Math.min(initialRwndBytes, initialCwndBytes);

  return {
    mss,
    totalBytes: segmentCount * mss,
    rwnd: initialRwndBytes,
    cwnd: initialCwndBytes,
    effectiveWindow,
    sendBase: 1000,
    nextSeqNum: 1000,
    segments,
    acks: [],
    rcvNext: 1000,
    rcvBufferTotal: initialRwndBytes * 2,
    rcvBufferOccupied: 0,
    outOfOrderBuffer: [],
    duplicateAckCount: 0,
    fastRetransmitTriggered: false,
    timeoutOccurred: false,
    rtoTimerMs: 2000,
    logMessages: [
      `[INICIO] Sesión TCP lista. Secuencia inicial ISN = 1000. MSS = ${mss} B.`,
      `[VENTANA] rwnd = ${initialRwndBytes} B, cwnd = ${initialCwndBytes} B -> Ventana Efectiva = ${effectiveWindow} B (${Math.floor(effectiveWindow / mss)} segmentos en vuelo permitidos).`
    ]
  };
};

/**
 * Transmite los siguientes segmentos que quepan dentro de la ventana efectiva
 */
export const transmitWindow = (
  state: SlidingWindowState,
  scenario: 'normal' | 'loss_segment' | 'loss_ack' | 'corrupt_segment' = 'normal',
  lossIndex: number = 1 // Por defecto afecta al segundo segmento
): SlidingWindowState => {
  const newState: SlidingWindowState = JSON.parse(JSON.stringify(state));
  const { mss, effectiveWindow, sendBase } = newState;

  let transmittedThisRound = 0;

  for (let i = 0; i < newState.segments.length; i++) {
    const seg = newState.segments[i];

    // Verificar si el segmento cabe dentro de la ventana de envío [sendBase, sendBase + effectiveWindow)
    if (seg.status === 'en_espera' && seg.seq < sendBase + effectiveWindow) {
      transmittedThisRound++;
      newState.nextSeqNum = seg.seq + seg.length;

      if (scenario === 'loss_segment' && i === lossIndex) {
        seg.status = 'perdido';
        newState.logMessages.push(`[RED] Segmento Seq=${seg.seq} PERDIDO en el cable por ruido o descarte en switch.`);
      } else if (scenario === 'corrupt_segment' && i === lossIndex) {
        seg.status = 'corrupto';
        newState.logMessages.push(`[RED] Segmento Seq=${seg.seq} TRANSMITIDO pero con BITS CORRUPTOS.`);
      } else {
        seg.status = 'en_vuelo';
        newState.logMessages.push(`[EMISOR] Transmitido Seq=${seg.seq} (${seg.length} B) [En vuelo].`);
      }
    }
  }

  return newState;
};

/**
 * Procesa la recepción y genera los ACKs acumulativos o duplicados
 */
export const processReception = (
  state: SlidingWindowState,
  scenario: 'normal' | 'loss_segment' | 'loss_ack' | 'corrupt_segment' = 'normal',
  lossAckIndex: number = 0
): SlidingWindowState => {
  const newState: SlidingWindowState = JSON.parse(JSON.stringify(state));

  for (let i = 0; i < newState.segments.length; i++) {
    const seg = newState.segments[i];

    if (seg.status === 'en_vuelo') {
      // Llega al receptor
      if (seg.seq === newState.rcvNext) {
        // En orden esperado
        seg.status = 'recibido';
        newState.rcvNext += seg.length;
        newState.rcvBufferOccupied += seg.length;

        // Comprobar si hay paquetes en el buffer de desorden que ahora queden en orden
        let reassembled = true;
        while (reassembled) {
          reassembled = false;
          const nextInOrder = newState.outOfOrderBuffer.find((s) => s.seq === newState.rcvNext);
          if (nextInOrder) {
            newState.rcvNext += nextInOrder.length;
            newState.rcvBufferOccupied += nextInOrder.length;
            newState.outOfOrderBuffer = newState.outOfOrderBuffer.filter((s) => s.seq !== nextInOrder.seq);
            reassembled = true;
            newState.logMessages.push(`[RECEPTOR] Reensamblado bloque fuera de orden Seq=${nextInOrder.seq}. Nuevo RcvNext = ${newState.rcvNext}.`);
          }
        }

        // Generar ACK Acumulativo
        const willLoseAck = scenario === 'loss_ack' && newState.acks.length === lossAckIndex;
        newState.acks.push({
          ackNum: newState.rcvNext,
          isDuplicate: false,
          duplicateCount: 0,
          status: willLoseAck ? 'perdido' : 'en_vuelo'
        });

        if (willLoseAck) {
          newState.logMessages.push(`[RED] ACK=${newState.rcvNext} generado pero SE PERDIÓ en el enlace de retorno.`);
        } else {
          newState.logMessages.push(`[RECEPTOR] Recibido en orden Seq=${seg.seq}. Enviando ACK Acumulativo = ${newState.rcvNext}.`);
        }
      } else if (seg.seq > newState.rcvNext) {
        // Fuera de orden (llegó posterior mientras falta uno anterior)
        seg.status = 'recibido';
        newState.outOfOrderBuffer.push(seg);
        newState.duplicateAckCount++;

        // Genera ACK Duplicado repitiendo el último recibido en orden
        newState.acks.push({
          ackNum: newState.rcvNext,
          isDuplicate: true,
          duplicateCount: newState.duplicateAckCount,
          status: 'en_vuelo'
        });

        newState.logMessages.push(
          `[RECEPTOR] Recibido fuera de orden Seq=${seg.seq} (se esperaba ${newState.rcvNext}). Almacenado en buffer. Enviando ACK DUPLICADO #${newState.duplicateAckCount} con Ack=${newState.rcvNext}.`
        );
      }
    } else if (seg.status === 'corrupto') {
      // Checksum falló -> el receptor lo descarta en silencio sin generar confirmación para ese segmento
      newState.logMessages.push(`[RECEPTOR] Checksum inválido en Seq=${seg.seq}. ¡Segmento dañado descartado!`);
      seg.status = 'perdido';
    }
  }

  // Comprobar Fast Retransmit (3 ACKs duplicados)
  if (newState.duplicateAckCount >= 3) {
    newState.fastRetransmitTriggered = true;
    newState.logMessages.push(`[ALGORITMO] ¡Detectados 3 ACKs duplicados! Activando FAST RETRANSMIT para Seq=${newState.rcvNext} sin esperar timeout.`);
    // Buscar el segmento faltante y retransmitirlo
    const lostSeg = newState.segments.find((s) => s.seq === newState.rcvNext);
    if (lostSeg) {
      lostSeg.status = 'en_vuelo';
      lostSeg.isRetransmission = true;
      newState.duplicateAckCount = 0;
    }
  }

  return newState;
};

/**
 * Procesa la llegada de los ACKs al emisor y desplaza la ventana
 */
export const processAcksAtSender = (state: SlidingWindowState): SlidingWindowState => {
  const newState: SlidingWindowState = JSON.parse(JSON.stringify(state));

  for (let i = 0; i < newState.acks.length; i++) {
    const ack = newState.acks[i];

    if (ack.status === 'en_vuelo') {
      ack.status = 'recibido';

      if (!ack.isDuplicate) {
        // ACK Acumulativo: confirma todos los bytes hasta ackNum
        if (ack.ackNum > newState.sendBase) {
          const oldBase = newState.sendBase;
          newState.sendBase = ack.ackNum;

          // Marcar segmentos confirmados
          for (const s of newState.segments) {
            if (s.seq + s.length <= ack.ackNum) {
              s.status = 'confirmado';
            }
          }

          // Desplazamiento visual de la ventana
          newState.logMessages.push(
            `[EMISOR] Recibido ACK=${ack.ackNum}. La ventana de envío se DESPLAZA de ${oldBase} a ${newState.sendBase}. Espacio liberado en el búfer.`
          );
        }
      }
    }
  }

  return newState;
};
