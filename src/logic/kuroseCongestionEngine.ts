/**
 * MOTOR PEDAGÓGICO DE CONTROL DE CONGESTIÓN TCP SEGÚN KUROSE Y ROSS
 * "Computer Networking: A Top-Down Approach" (Capítulo 3: Capa de Transporte)
 * 
 * Implementa la evolución exacta de la ventana de congestión (cwnd en segmentos y bytes),
 * el umbral (ssthresh), las fases (Inicio Rápido / Slow Start, Evitación de Congestión /
 * Congestion Avoidance, y Recuperación Rápida / Fast Recovery), comparando
 * TCP Tahoe frente a TCP Reno.
 */

export interface KuroseRttPoint {
  cycle: number; // Ciclo de transmisión (RTT) 1..N
  cwndTahoe: number; // Ventana en segmentos para TCP Tahoe
  cwndReno: number; // Ventana en segmentos para TCP Reno
  ssthreshTahoe: number; // Umbral para Tahoe
  ssthreshReno: number; // Umbral para Reno
  phaseTahoe: 'Inicio rápido' | 'Evitación de congestión';
  phaseReno: 'Inicio rápido' | 'Evitación de congestión' | 'Recuperación rápida';
  eventDescription: string;
  segmentsInFlight: number; // Cantidad de segmentos enviados en este RTT
  bytesInFlight: number; // segments * MSS (1460 B)
  seqStartByte: number; // Número de secuencia del primer byte
  seqEndByte: number; // Número de secuencia del último byte
  ladderSegments: Array<{
    segId: number;
    seqNumber: number;
    bytes: number;
    status: 'ok' | 'lost' | 'dup_ack';
    ackNumber: number;
  }>;
}

export interface KuroseScenarioConfig {
  initialSsthresh: number; // Por defecto 8 según figura Kurose
  lossCycle: number; // Ciclo donde ocurre la pérdida (8 por defecto)
  lossType: '3dup_ack' | 'timeout'; // Pérdida por 3 ACKs duplicados vs Timeout
  totalCycles: number; // 15 por defecto según figura Kurose
  mssBytes: number; // 1460 Bytes por defecto (MTU 1500)
}

/**
 * Escenario canónico predeterminado de Kurose & Ross:
 * - Ciclo 1 a 4: Inicio Rápido (cwnd = 1, 2, 4, 8)
 * - ssthresh inicial = 8
 * - Ciclo 5 a 8: Evitación de Congestión (cwnd = 9, 10, 11, 12)
 * - En Ciclo 8 (cwnd = 12): Ocurre pérdida
 *   - ssthresh nuevo = 12 / 2 = 6
 *   - TCP Tahoe: cae a 1, sube en inicio rápido (1, 2, 4, 6) y luego lineal (7, 8, 9)
 *   - TCP Reno: arranca en 6 (Fast Recovery/Avoidance) y sube lineal (6, 7, 8, 9, 10, 11, 12)
 */
export const DEFAULT_KUROSE_CONFIG: KuroseScenarioConfig = {
  initialSsthresh: 8,
  lossCycle: 8,
  lossType: '3dup_ack',
  totalCycles: 15,
  mssBytes: 1460
};

export function generateKuroseSimulation(config: KuroseScenarioConfig = DEFAULT_KUROSE_CONFIG): KuroseRttPoint[] {
  const points: KuroseRttPoint[] = [];
  const mss = config.mssBytes;

  // Variables de estado para TCP Tahoe
  let cwndTahoe = 1;
  let ssthreshTahoe = config.initialSsthresh;
  let phaseTahoe: KuroseRttPoint['phaseTahoe'] = 'Inicio rápido';

  // Variables de estado para TCP Reno
  let cwndReno = 1;
  let ssthreshReno = config.initialSsthresh;
  let phaseReno: KuroseRttPoint['phaseReno'] = 'Inicio rápido';

  let currentByteOffset = 1;

  for (let c = 1; c <= config.totalCycles; c++) {
    // Guardar valores al inicio del ciclo
    const currentCwndTahoe = cwndTahoe;
    const currentCwndReno = cwndReno;
    const currentSsthreshTahoe = ssthreshTahoe;
    const currentSsthreshReno = ssthreshReno;
    const currentPhaseTahoe = phaseTahoe;
    const currentPhaseReno = phaseReno;

    const segmentsToSend = currentCwndReno; // Usamos el flujo de Reno como referencia de envío
    const bytesToSend = segmentsToSend * mss;
    const seqStart = currentByteOffset;
    const seqEnd = currentByteOffset + bytesToSend - 1;

    // Generar paquetes para el ladder diagram
    const ladderSegments: KuroseRttPoint['ladderSegments'] = [];
    const isLossCycle = (c === config.lossCycle);

    for (let s = 0; s < segmentsToSend; s++) {
      const segSeq = seqStart + (s * mss);
      let status: 'ok' | 'lost' | 'dup_ack' = 'ok';
      let expectedAck = segSeq + mss;

      if (isLossCycle && s === 1) {
        // En el ciclo de pérdida, el segmento 2 se pierde
        status = 'lost';
      } else if (isLossCycle && s > 1) {
        // Los segmentos posteriores llegan fuera de orden y provocan ACKs duplicados
        status = 'dup_ack';
        expectedAck = seqStart + mss; // ACK repite el número del segmento 1
      }

      ladderSegments.push({
        segId: s + 1,
        seqNumber: segSeq,
        bytes: mss,
        status,
        ackNumber: expectedAck
      });
    }

    // Descripción pedagógica según la fase
    let desc = '';
    if (c === 1) {
      desc = `Ciclo 1: Inicio Rápido (Slow Start). cwnd inicial = 1 MSS (${mss} B). Se transmite 1 segmento. Al recibir su ACK, cwnd se incrementa en 1 segmento pasando a 2 MSS.`;
    } else if (c < 4) {
      desc = `Ciclo ${c}: Inicio Rápido. cwnd = ${currentCwndReno} MSS (${bytesToSend} B). Se transmiten ${segmentsToSend} segmentos en paralelo durante el RTT. Cada ACK incrementa cwnd en 1 MSS, duplicando la ventana para el siguiente ciclo.`;
    } else if (c === 4) {
      desc = `Ciclo 4: cwnd alcanza el umbral inicial ssthresh = ${currentSsthreshReno} MSS. Transición de Inicio Rápido a Evitación de Congestión. A partir de aquí, el crecimiento ya no es exponencial sino lineal (+1 MSS por RTT).`;
    } else if (c < config.lossCycle) {
      desc = `Ciclo ${c}: Evitación de Congestión (Congestion Avoidance). cwnd = ${currentCwndReno} MSS (${bytesToSend} B). Cada ACK incrementa cwnd en 1/cwnd MSS, logrando un crecimiento aditivo prudente de exactamente +1 segmento por RTT.`;
    } else if (c === config.lossCycle) {
      desc = `Ciclo ${c} [PÉRDIDA]: cwnd alcanzó ${currentCwndReno} MSS. La red se congestiona y se produce una pérdida. Se detectan 3 ACKs Duplicados. El nuevo umbral se fija a la mitad: ssthresh = 12 / 2 = 6 MSS.`;
    } else if (c === config.lossCycle + 1) {
      desc = `Ciclo ${c} [BIFURCACIÓN TAHOE vs RENO]: TCP Tahoe reacciona severamente reseteando cwnd a 1 MSS e iniciando Slow Start. TCP Reno ejecuta Recuperación Rápida (Fast Recovery): salta directamente a cwnd = ssthresh = 6 MSS y continúa en Evitación de Congestión (+1 por RTT).`;
    } else {
      desc = `Ciclo ${c}: En Reno, cwnd avanza en Evitación de Congestión (cwnd = ${currentCwndReno} MSS). En Tahoe, cwnd crece en Slow Start hasta alcanzar el nuevo umbral (6 MSS) y luego pasa a lineal.`;
    }

    points.push({
      cycle: c,
      cwndTahoe: currentCwndTahoe,
      cwndReno: currentCwndReno,
      ssthreshTahoe: currentSsthreshTahoe,
      ssthreshReno: currentSsthreshReno,
      phaseTahoe: currentPhaseTahoe,
      phaseReno: currentPhaseReno,
      eventDescription: desc,
      segmentsInFlight: segmentsToSend,
      bytesInFlight: bytesToSend,
      seqStartByte: seqStart,
      seqEndByte: seqEnd,
      ladderSegments
    });

    currentByteOffset = seqEnd + 1;

    // Calcular valores para el SIGUIENTE ciclo (c + 1)
    if (c === config.lossCycle) {
      // Evento de pérdida al finalizar este RTT
      const half = Math.max(2, Math.floor(currentCwndReno / 2));
      ssthreshTahoe = half;
      ssthreshReno = half;

      // Tahoe: siempre cae a 1 y pasa a Inicio Rápido
      cwndTahoe = 1;
      phaseTahoe = 'Inicio rápido';

      if (config.lossType === '3dup_ack') {
        // Reno: con 3 Dup ACKs entra a Fast Recovery / Congestion Avoidance desde ssthresh
        cwndReno = half;
        phaseReno = 'Evitación de congestión';
      } else {
        // Si fuera timeout, Reno también cae a 1
        cwndReno = 1;
        phaseReno = 'Inicio rápido';
      }
    } else {
      // Evolución normal para Tahoe
      if (cwndTahoe < ssthreshTahoe) {
        cwndTahoe = Math.min(ssthreshTahoe, cwndTahoe * 2);
        phaseTahoe = cwndTahoe >= ssthreshTahoe ? 'Evitación de congestión' : 'Inicio rápido';
      } else {
        cwndTahoe += 1;
        phaseTahoe = 'Evitación de congestión';
      }

      // Evolución normal para Reno
      if (cwndReno < ssthreshReno) {
        cwndReno = Math.min(ssthreshReno, cwndReno * 2);
        phaseReno = cwndReno >= ssthreshReno ? 'Evitación de congestión' : 'Inicio rápido';
      } else {
        cwndReno += 1;
        phaseReno = 'Evitación de congestión';
      }
    }
  }

  return points;
}
