/**
 * MOTOR DE CONTROL DE CONGESTIÓN TCP Y FENÓMENO DE SIERRA (TCP RENO RFC 5681)
 * Simula RTT a RTT la evolución de cwnd y ssthresh, diferenciando 3 Dup ACKs de Timeout.
 */

export interface CongestionDataPoint {
  rtt: number;
  cwnd: number; // en MSS
  ssthresh: number; // en MSS
  phase: 'Slow Start' | 'Congestion Avoidance' | 'Fast Recovery' | 'Timeout Reset';
  event?: 'Loss 3 Dup ACKs' | 'Timeout RTO' | 'ssthresh Reached' | 'Normal ACK';
  description: string;
}

export interface CongestionSimulationConfig {
  mss: number;
  initialCwnd: number;
  initialSsthresh: number;
  totalRtts: number;
  lossEvents: Array<{
    rtt: number;
    type: '3dup_ack' | 'timeout';
  }>;
}

export const generateCongestionSawtooth = (config: CongestionSimulationConfig): CongestionDataPoint[] => {
  const points: CongestionDataPoint[] = [];
  let cwnd = config.initialCwnd;
  let ssthresh = config.initialSsthresh;
  let phase: CongestionDataPoint['phase'] = 'Slow Start';

  for (let rtt = 1; rtt <= config.totalRtts; rtt++) {
    // Comprobar si hay un evento de pérdida configurado en este RTT
    const loss = config.lossEvents.find((e) => e.rtt === rtt);

    if (loss) {
      if (loss.type === '3dup_ack') {
        // Fast Retransmit & Fast Recovery (3 ACKs duplicados)
        const oldCwnd = cwnd;
        ssthresh = Math.max(2, Math.floor(cwnd / 2));
        cwnd = ssthresh; // En Reno clásico se establece en nuevo ssthresh
        phase = 'Fast Recovery';
        points.push({
          rtt,
          cwnd,
          ssthresh,
          phase,
          event: 'Loss 3 Dup ACKs',
          description: `RTT ${rtt}: Pérdida detectada por 3 ACKs Duplicados. Fast Retransmit activado. ssthresh reducido de ${oldCwnd} a ${ssthresh} MSS. cwnd se ajusta a ${cwnd} MSS (Diente de Sierra).`
        });
        phase = 'Congestion Avoidance';
      } else if (loss.type === 'timeout') {
        // Timeout (RTO) - Reacción severa
        const oldCwnd = cwnd;
        ssthresh = Math.max(2, Math.floor(cwnd / 2));
        cwnd = 1; // Se desploma a 1 MSS
        phase = 'Timeout Reset';
        points.push({
          rtt,
          cwnd,
          ssthresh,
          phase,
          event: 'Timeout RTO',
          description: `RTT ${rtt}: Vencimiento de Temporizador de Retransmisión (Timeout RTO). Reacción severa: ssthresh = ${ssthresh} MSS. cwnd se desploma a 1 MSS y reinicia en Slow Start.`
        });
        phase = 'Slow Start';
      }
      continue;
    }

    // Crecimiento normal en este RTT
    if (cwnd < ssthresh) {
      // Slow Start: Crecimiento exponencial aproximado (se duplica por cada RTT)
      phase = 'Slow Start';
      points.push({
        rtt,
        cwnd,
        ssthresh,
        phase,
        event: 'Normal ACK',
        description: `RTT ${rtt}: Slow Start. cwnd = ${cwnd} MSS. Crecimiento exponencial duplicando la ventana por cada RTT.`
      });
      cwnd = Math.min(ssthresh, cwnd * 2);
    } else {
      // Congestion Avoidance: Crecimiento lineal (+1 MSS por cada RTT)
      phase = 'Congestion Avoidance';
      points.push({
        rtt,
        cwnd,
        ssthresh,
        phase,
        event: 'Normal ACK',
        description: `RTT ${rtt}: Congestion Avoidance (cwnd >= ssthresh). Crecimiento lineal prudente de +1 MSS por RTT (${cwnd} MSS).`
      });
      cwnd += 1;
    }
  }

  return points;
};
