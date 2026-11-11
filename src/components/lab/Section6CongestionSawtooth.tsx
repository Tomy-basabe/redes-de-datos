import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft,
  AlertTriangle, 
  ArrowRight,
  Laptop,
  Server,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Info,
  Sliders,
  TrendingUp,
  Activity
} from 'lucide-react';
import { tabeSpringPill } from '../../lib/tabeChoreography';

interface LadderSegment {
  id: number;
  label?: string;
  isLost?: boolean;
  ackStatus: 'ok' | 'dup' | 'none';
  ackNum?: number;
}

interface RttCycleData {
  cycle: number;
  cwndTahoe: number;
  cwndReno: number;
  ssthreshTahoe: number;
  ssthreshReno: number;
  phaseTahoe: 'Inicio rápido' | 'Evitación de congestión';
  phaseReno: 'Inicio rápido' | 'Evitación de congestión' | 'Recuperación rápida';
  bytesInFlight: number;
  burstLabel: string;
  isLossCycle: boolean;
  explanation: string;
  ladderSegments: LadderSegment[];
}

export const Section6CongestionSawtooth: React.FC = () => {
  // Configuración del experimento
  const [lossType, setLossType] = useState<'3dup_ack' | 'timeout'>('3dup_ack');
  const [activeCycle, setActiveCycle] = useState<number>(1); // Ciclo 1 a 15
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeedMs, setPlaySpeedMs] = useState<number>(1500);
  const [curveFilter, setCurveFilter] = useState<'both' | 'reno' | 'tahoe'>('both');
  const [showLossDetails, setShowLossDetails] = useState<boolean>(true);

  const mss = 1460; // Bytes por segmento estándar

  // Generación completa y exacta de los 15 ciclos
  const generateCycles = (): RttCycleData[] => {
    const data: RttCycleData[] = [];
    
    // Valores de la figura canónica:
    // Ciclos 1-4: Inicio rápido (1, 2, 4, 8)
    // ssthresh inicial = 8
    // Ciclos 5-8: Evitación de congestión (9, 10, 11, 12)
    // Ciclo 8: Pérdida en cwnd = 12. ssthresh nuevo = 6.
    // Ciclo 9: Tahoe cae a 1; Reno arranca en ssthresh = 6 (o 1 si es timeout).
    // Ciclos 10-15:
    //   Tahoe: 2, 4, 6 (llega a umbral 6), 7, 8, 9.
    //   Reno: 7, 8, 9, 10, 11, 12 (lineal).
    
    const tahoeValues = [1, 2, 4, 8, 9, 10, 11, 12, 1, 2, 4, 6, 7, 8, 9];
    const renoValues = lossType === '3dup_ack' 
      ? [1, 2, 4, 8, 9, 10, 11, 12, 6, 7, 8, 9, 10, 11, 12]
      : [1, 2, 4, 8, 9, 10, 11, 12, 1, 2, 4, 6, 7, 8, 9]; // Timeout también desploma Reno a 1

    for (let c = 1; c <= 15; c++) {
      const cwndT = tahoeValues[c - 1];
      const cwndR = renoValues[c - 1];
      const isLoss = (c === 8);
      const isPostLoss = (c >= 9);

      const ssthreshT = isPostLoss ? 6 : 8;
      const ssthreshR = isPostLoss ? 6 : 8;

      let phaseR: RttCycleData['phaseReno'] = 'Inicio rápido';
      if (c >= 4 && c <= 8) phaseR = 'Evitación de congestión';
      else if (c === 9 && lossType === '3dup_ack') phaseR = 'Recuperación rápida';
      else if (c >= 10 && lossType === '3dup_ack') phaseR = 'Evitación de congestión';
      else if (c >= 12 && lossType === 'timeout') phaseR = 'Evitación de congestión';

      let phaseT: RttCycleData['phaseTahoe'] = 'Inicio rápido';
      if (c >= 4 && c <= 8) phaseT = 'Evitación de congestión';
      else if (c >= 12) phaseT = 'Evitación de congestión';

      let burstLabel = '';
      if (c === 1) burstLabel = 'un segmento';
      else if (c === 2) burstLabel = 'dos segmentos';
      else if (c === 3) burstLabel = 'cuatro segmentos';
      else if (c === 4) burstLabel = 'ocho segmentos';
      else if (c === 8) burstLabel = 'ráfaga con pérdida (12 segmentos)';
      else burstLabel = `${cwndR} segmentos en vuelo`;

      // Generar segmentos ladder para este ciclo
      const ladderSegs: LadderSegment[] = [];
      const count = Math.min(cwndR, 8); // Dibujamos hasta 8 flechas visuales
      for (let s = 0; s < count; s++) {
        if (isLoss && s === 1) {
          ladderSegs.push({ id: s + 1, isLost: true, ackStatus: 'none' });
        } else if (isLoss && s > 1) {
          ladderSegs.push({ id: s + 1, isLost: false, ackStatus: 'dup', ackNum: 1001 });
        } else {
          ladderSegs.push({ id: s + 1, isLost: false, ackStatus: 'ok' });
        }
      }

      let expl = '';
      if (c === 1) {
        expl = 'Inicio Rápido (Slow Start): cwnd = 1 MSS (1460 Bytes). Se transmite un solo segmento. Al recibir su ACK, el emisor incrementa cwnd en 1 MSS, duplicándola a 2 para el siguiente RTT.';
      } else if (c === 2) {
        expl = 'Inicio Rápido: cwnd = 2 MSS (2920 Bytes). Se transmiten dos segmentos en paralelo durante el RTT. Al recibir ambos ACKs, cada uno suma 1 MSS, duplicando la ventana a 4 MSS.';
      } else if (c === 3) {
        expl = 'Inicio Rápido: cwnd = 4 MSS (5840 Bytes). Se transmiten cuatro segmentos en paralelo. El crecimiento exponencial continúa duplicando la capacidad en cada ciclo de ida y vuelta.';
      } else if (c === 4) {
        expl = 'Alcanzado el Umbral Inicial (ssthresh = 8 MSS): La ventana alcanza los 8 segmentos. TCP abandona el crecimiento exponencial de Inicio Rápido e ingresa a Evitación de Congestión (crecimiento aditivo prudente de +1 segmento por RTT).';
      } else if (c >= 5 && c <= 7) {
        expl = `Evitación de Congestión (Congestion Avoidance): cwnd = ${cwndR} MSS (${cwndR * mss} B). Cada ACK incrementa cwnd en 1/cwnd, logrando que al completarse todo el RTT la ventana aumente en exactamente 1 segmento.`;
      } else if (c === 8) {
        expl = `Ciclo 8 [DETECCIÓN DE PÉRDIDA]: cwnd alcanzó 12 MSS (17.520 B). El búfer intermedio de la WAN se desborda y se pierde el Segmento #2 (marcado con ✖). Los segmentos posteriores llegan fuera de orden a Host B, generando 3 ACKs Duplicados idénticos en Host A. El nuevo umbral se fija a la mitad: ssthresh = 12 / 2 = 6 MSS.`;
      } else if (c === 9) {
        expl = lossType === '3dup_ack'
          ? 'Ciclo 9 [DIFERENCIA CRÍTICA RENO vs TAHOE]: En TCP Tahoe, la ventana se desploma a 1 MSS reiniciando en Slow Start. En TCP Reno, al detectar 3 ACKs Duplicados (Fast Retransmit), deduce que la red sigue transportando datos; aplica Fast Recovery fijando cwnd = ssthresh = 6 MSS sin reiniciar a 1, continuando directamente en Evitación de Congestión.'
          : 'Ciclo 9 [TIMEOUT RTO SEVERO]: Al vencer el temporizador de retransmisión (Timeout), tanto TCP Reno como TCP Tahoe se ven forzados a desplomar cwnd a 1 MSS y reiniciar en Inicio Rápido hasta el nuevo umbral (6 MSS).';
      } else {
        expl = `Ciclo ${c}: En TCP Reno la ventana continúa su crecimiento lineal aditivo (+1 MSS por RTT) alcanzando ${cwndR} MSS. En TCP Tahoe, se observa la recuperación lenta tras el desplome a 1.`;
      }

      data.push({
        cycle: c,
        cwndTahoe: cwndT,
        cwndReno: cwndR,
        ssthreshTahoe: ssthreshT,
        ssthreshReno: ssthreshR,
        phaseTahoe: phaseT,
        phaseReno: phaseR,
        bytesInFlight: cwndR * mss,
        burstLabel,
        isLossCycle: isLoss,
        explanation: expl,
        ladderSegments: ladderSegs
      });
    }

    return data;
  };

  const cycles = generateCycles();
  const current = cycles[activeCycle - 1] || cycles[0];

  // Control de bucle de animación
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveCycle((prev) => {
        if (prev >= 15) {
          setIsPlaying(false);
          return 1;
        }
        return prev + 1;
      });
    }, playSpeedMs);
    return () => clearInterval(interval);
  }, [isPlaying, playSpeedMs]);

  const handleNext = () => {
    if (activeCycle < 15) setActiveCycle((c) => c + 1);
  };

  const handlePrev = () => {
    if (activeCycle > 1) setActiveCycle((c) => c - 1);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setActiveCycle(1);
  };

  // Coordenadas SVG del gráfico
  const svgW = 600;
  const svgH = 340;
  const padL = 50;
  const padR = 30;
  const padT = 35;
  const padB = 40;

  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const getX = (cycleNum: number) => padL + (cycleNum / 15) * plotW;
  const getY = (val: number) => padT + plotH - (val / 14) * plotH;

  // Paths para las curvas
  const tahoePath = cycles
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(c.cycle)} ${getY(c.cwndTahoe)}`)
    .join(' ');

  // Reno antes del ciclo 8 coincide con Tahoe; a partir del ciclo 8 se bifurca
  const renoPoints = cycles.filter((c) => c.cycle >= 8);
  const renoPath = renoPoints
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(c.cycle)} ${getY(c.cwndReno)}`)
    .join(' ');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold block">
              Control de Congestión en Capa de Transporte
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
              RFC 5681 • TCP Reno vs TCP Tahoe
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold apple-headline text-white mt-1">
            Ventana de Congestión TCP (cwnd) & Fenómeno de Sierra
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-3xl">
            Visualización interactiva articulada: a la izquierda, el <strong>Diagrama Espacio-Tiempo (Ladder Diagram)</strong> mostrando la transmisión real de ráfagas con pérdida y acuses duplicados; a la derecha, la <strong>Evolución de la Ventana de Congestión</strong> con los umbrales (<code className="text-amber-300">ssthresh</code>) y la bifurcación entre TCP Reno y TCP Tahoe.
          </p>
        </div>

        {/* Tipo de Pérdida en Ciclo 8 */}
        <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/[0.08] text-xs font-mono">
          <span className="text-zinc-500 text-[11px] px-2 hidden sm:inline">Pérdida en Ciclo 8:</span>
          <button
            onClick={() => setLossType('3dup_ack')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none tabe-btn-action font-bold ${
              lossType === '3dup_ack'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            3 ACKs Duplicados (Fast Retransmit)
          </button>
          <button
            onClick={() => setLossType('timeout')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none tabe-btn-action font-bold ${
              lossType === 'timeout'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Timeout RTO (Desplome a 1)
          </button>
        </div>
      </div>

      {/* DUAL DISPLAY: DIAGRAMA ESPACIO-TIEMPO + GRÁFICO DE SIERRA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* =========================================================
            COLUMNA IZQUIERDA: DIAGRAMA ESPACIO-TIEMPO (TAL CUAL LA IMAGEN)
           ========================================================= */}
        <div className="lg:col-span-6 p-6 rounded-[32px] apple-glass border border-white/[0.08] flex flex-col justify-between space-y-3 bg-[#07090e]/95 relative overflow-hidden">
          
          {/* Header con Recuadro "siguiente periodo RTT" (Exacto al diseño original) */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="px-3.5 py-1.5 border-2 border-white/80 bg-black/90 rounded text-xs sm:text-sm font-bold font-display text-white tracking-wider uppercase shadow-md">
              siguiente periodo RTT
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-400">Ciclo Activo:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                RTT #{activeCycle} de 15
              </span>
            </div>
          </div>

          {/* Iconos de Host A y Host B (Equipos reales de la red escolar) */}
          <div className="flex justify-between items-center px-4 pt-1">
            {/* Host A (Emisor) */}
            <div className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-md">
                <Laptop className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white mt-1 font-display">Host A</span>
              <span className="text-[10px] font-mono text-cyan-300">172.16.20.10</span>
              <span className="text-[9px] font-mono text-zinc-500">Cliente (VLAN 20)</span>
            </div>

            {/* Canal WAN Central */}
            <div className="flex flex-col items-center text-center">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">
                Canal WAN
              </div>
              <span className="text-[11px] font-mono text-amber-300 mt-0.5">
                RTT ≈ 50 ms
              </span>
              <span className="text-[9px] font-mono text-zinc-500">
                MikroTik PCC (100M/150M)
              </span>
            </div>

            {/* Host B (Receptor) */}
            <div className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-md">
                <Server className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white mt-1 font-display">Host B</span>
              <span className="text-[10px] font-mono text-emerald-300">172.16.10.12:443</span>
              <span className="text-[9px] font-mono text-zinc-500">Servidor Nginx (VLAN 10)</span>
            </div>
          </div>

          {/* SVG EXACTO DEL DIAGRAMA ESPACIO-TIEMPO CON FLECHAS DIAGONALES, TEXTOS Y LA 'X' */}
          <div className="relative w-full flex justify-center py-2 select-none">
            <svg
              viewBox="0 0 460 480"
              className="w-full max-w-[440px] h-auto font-mono text-xs overflow-visible"
            >
              <defs>
                {/* Flecha estándar hacia Host B */}
                <marker
                  id="arrow-seg"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#d4d4d8" />
                </marker>
                
                {/* Flecha ACK de retorno hacia Host A */}
                <marker
                  id="arrow-ack"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#a1a1aa" />
                </marker>

                {/* Flecha destacada activa */}
                <marker
                  id="arrow-active"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                </marker>
              </defs>

              {/* Línea vertical punteada de Host A (izquierda) */}
              <line
                x1="60"
                y1="10"
                x2="60"
                y2="450"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Línea vertical punteada de Host B (derecha) */}
              <line
                x1="400"
                y1="10"
                x2="400"
                y2="450"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Flechas de tiempo en la punta inferior */}
              <polygon points="56,450 64,450 60,458" fill="rgba(255,255,255,0.6)" />
              <text x="60" y="472" fill="#a1a1aa" fontSize="11" textAnchor="middle">
                Tiempo
              </text>

              <polygon points="396,450 404,450 400,458" fill="rgba(255,255,255,0.6)" />
              <text x="400" y="472" fill="#a1a1aa" fontSize="11" textAnchor="middle">
                Tiempo
              </text>

              {/* Corchete / Indicador RTT a la izquierda (Exacto a la imagen: TT / RTT) */}
              <path
                d="M 46 22 L 36 22 L 36 50 L 26 50 L 36 50 L 36 78 L 46 78"
                fill="none"
                stroke="#d4d4d8"
                strokeWidth="1.5"
              />
              <text x="20" y="54" fill="#f4f4f5" fontSize="11" fontWeight="bold" textAnchor="end">
                RTT
              </text>

              {/* ========================================================
                  RÁFAGA 1 (RTT 1): "un segmento"
                 ======================================================== */}
              <g opacity={activeCycle >= 1 ? 1 : 0.25} className="transition-opacity">
                {/* Texto sobre la flecha: "un segmento" */}
                <text
                  x="230"
                  y="36"
                  fill={activeCycle === 1 ? '#38bdf8' : '#e4e4e7'}
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="font-mono tracking-wide"
                >
                  un segmento
                </text>
                {/* Flecha diagonal Host A -> Host B */}
                <line
                  x1="60"
                  y1="22"
                  x2="400"
                  y2="50"
                  stroke={activeCycle === 1 ? '#38bdf8' : '#d4d4d8'}
                  strokeWidth={activeCycle === 1 ? '2.5' : '1.5'}
                  markerEnd={activeCycle === 1 ? 'url(#arrow-active)' : 'url(#arrow-seg)'}
                />
                {/* Flecha ACK Host B -> Host A */}
                <line
                  x1="400"
                  y1="50"
                  x2="60"
                  y2="78"
                  stroke={activeCycle === 1 ? '#38bdf8' : '#a1a1aa'}
                  strokeWidth={activeCycle === 1 ? '2' : '1.2'}
                  markerEnd={activeCycle === 1 ? 'url(#arrow-active)' : 'url(#arrow-ack)'}
                />
              </g>

              {/* ========================================================
                  RÁFAGA 2 (RTT 2): "dos segmentos"
                 ======================================================== */}
              <g opacity={activeCycle >= 2 ? 1 : 0.25} className="transition-opacity">
                <text
                  x="230"
                  y="92"
                  fill={activeCycle === 2 ? '#38bdf8' : '#e4e4e7'}
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="font-mono tracking-wide"
                >
                  dos segmentos
                </text>
                {/* 2 segmentos paralelos */}
                <line
                  x1="60"
                  y1="78"
                  x2="400"
                  y2="106"
                  stroke={activeCycle === 2 ? '#38bdf8' : '#d4d4d8'}
                  strokeWidth={activeCycle === 2 ? '2.5' : '1.5'}
                  markerEnd={activeCycle === 2 ? 'url(#arrow-active)' : 'url(#arrow-seg)'}
                />
                <line
                  x1="60"
                  y1="90"
                  x2="400"
                  y2="118"
                  stroke={activeCycle === 2 ? '#38bdf8' : '#d4d4d8'}
                  strokeWidth={activeCycle === 2 ? '2.5' : '1.5'}
                  markerEnd={activeCycle === 2 ? 'url(#arrow-active)' : 'url(#arrow-seg)'}
                />
                {/* 2 ACKs devueltos */}
                <line
                  x1="400"
                  y1="106"
                  x2="60"
                  y2="134"
                  stroke={activeCycle === 2 ? '#38bdf8' : '#a1a1aa'}
                  strokeWidth={activeCycle === 2 ? '2' : '1.2'}
                  markerEnd={activeCycle === 2 ? 'url(#arrow-active)' : 'url(#arrow-ack)'}
                />
                <line
                  x1="400"
                  y1="118"
                  x2="60"
                  y2="146"
                  stroke={activeCycle === 2 ? '#38bdf8' : '#a1a1aa'}
                  strokeWidth={activeCycle === 2 ? '2' : '1.2'}
                  markerEnd={activeCycle === 2 ? 'url(#arrow-active)' : 'url(#arrow-ack)'}
                />
              </g>

              {/* ========================================================
                  RÁFAGA 3 (RTT 3): "cuatro segmentos"
                 ======================================================== */}
              <g opacity={activeCycle >= 3 ? 1 : 0.25} className="transition-opacity">
                <text
                  x="230"
                  y="162"
                  fill={activeCycle === 3 ? '#38bdf8' : '#e4e4e7'}
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="font-mono tracking-wide"
                >
                  cuatro segmentos
                </text>
                {/* 4 segmentos paralelos */}
                <line
                  x1="60"
                  y1="146"
                  x2="400"
                  y2="174"
                  stroke={activeCycle === 3 ? '#38bdf8' : '#d4d4d8'}
                  strokeWidth={activeCycle === 3 ? '2.5' : '1.5'}
                  markerEnd={activeCycle === 3 ? 'url(#arrow-active)' : 'url(#arrow-seg)'}
                />
                <line
                  x1="60"
                  y1="156"
                  x2="400"
                  y2="184"
                  stroke={activeCycle === 3 ? '#38bdf8' : '#d4d4d8'}
                  strokeWidth={activeCycle === 3 ? '2.5' : '1.5'}
                  markerEnd={activeCycle === 3 ? 'url(#arrow-active)' : 'url(#arrow-seg)'}
                />
                <line
                  x1="60"
                  y1="166"
                  x2="400"
                  y2="194"
                  stroke={activeCycle === 3 ? '#38bdf8' : '#d4d4d8'}
                  strokeWidth={activeCycle === 3 ? '2.5' : '1.5'}
                  markerEnd={activeCycle === 3 ? 'url(#arrow-active)' : 'url(#arrow-seg)'}
                />
                <line
                  x1="60"
                  y1="176"
                  x2="400"
                  y2="204"
                  stroke={activeCycle === 3 ? '#38bdf8' : '#d4d4d8'}
                  strokeWidth={activeCycle === 3 ? '2.5' : '1.5'}
                  markerEnd={activeCycle === 3 ? 'url(#arrow-active)' : 'url(#arrow-seg)'}
                />

                {/* 4 ACKs devueltos */}
                <line
                  x1="400"
                  y1="174"
                  x2="60"
                  y2="202"
                  stroke={activeCycle === 3 ? '#38bdf8' : '#a1a1aa'}
                  strokeWidth="1.2"
                  markerEnd="url(#arrow-ack)"
                />
                <line
                  x1="400"
                  y1="184"
                  x2="60"
                  y2="212"
                  stroke={activeCycle === 3 ? '#38bdf8' : '#a1a1aa'}
                  strokeWidth="1.2"
                  markerEnd="url(#arrow-ack)"
                />
                <line
                  x1="400"
                  y1="194"
                  x2="60"
                  y2="222"
                  stroke={activeCycle === 3 ? '#38bdf8' : '#a1a1aa'}
                  strokeWidth="1.2"
                  markerEnd="url(#arrow-ack)"
                />
                <line
                  x1="400"
                  y1="204"
                  x2="60"
                  y2="232"
                  stroke={activeCycle === 3 ? '#38bdf8' : '#a1a1aa'}
                  strokeWidth="1.2"
                  markerEnd="url(#arrow-ack)"
                />
              </g>

              {/* ========================================================
                  RÁFAGA CON PÉRDIDA Y LA 'X' NEGRA PROMINENTE (Exacta a la imagen)
                 ======================================================== */}
              <g opacity={activeCycle >= 8 ? 1 : 0.25} className="transition-opacity">
                {/* Flechas de ida */}
                <line
                  x1="60"
                  y1="240"
                  x2="400"
                  y2="268"
                  stroke={activeCycle === 8 ? '#f59e0b' : '#d4d4d8'}
                  strokeWidth="1.5"
                  markerEnd="url(#arrow-seg)"
                />
                <line
                  x1="60"
                  y1="252"
                  x2="220"
                  y2="274"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                <line
                  x1="60"
                  y1="264"
                  x2="400"
                  y2="292"
                  stroke={activeCycle === 8 ? '#f59e0b' : '#d4d4d8'}
                  strokeWidth="1.5"
                  markerEnd="url(#arrow-seg)"
                />
                <line
                  x1="60"
                  y1="276"
                  x2="400"
                  y2="304"
                  stroke={activeCycle === 8 ? '#f59e0b' : '#d4d4d8'}
                  strokeWidth="1.5"
                  markerEnd="url(#arrow-seg)"
                />
                <line
                  x1="60"
                  y1="288"
                  x2="400"
                  y2="316"
                  stroke={activeCycle === 8 ? '#f59e0b' : '#d4d4d8'}
                  strokeWidth="1.5"
                  markerEnd="url(#arrow-seg)"
                />

                {/* LA 'X' NEGRA GIGANTE DE PÉRDIDA (TAL CUAL LA CAPTURA) */}
                <g transform="translate(135, 335)">
                  {/* Sombra / halo de fondo para destacar */}
                  <rect x="-14" y="-14" width="28" height="28" rx="6" fill="#000000" fillOpacity="0.8" />
                  {/* Dos líneas gruesas cruzadas formando la X */}
                  <line x1="-10" y1="-10" x2="10" y2="10" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" />
                  <line x1="10" y1="-10" x2="-10" y2="10" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" />
                </g>

                {/* Flechas de acuses duplicados de vuelta que apuntan hacia abajo de la X */}
                <line
                  x1="400"
                  y1="268"
                  x2="60"
                  y2="296"
                  stroke="#a1a1aa"
                  strokeWidth="1.2"
                  markerEnd="url(#arrow-ack)"
                />
                <line
                  x1="400"
                  y1="292"
                  x2="155"
                  y2="320"
                  stroke="#fbbf24"
                  strokeWidth="1.8"
                  markerEnd="url(#arrow-ack)"
                />
                <line
                  x1="400"
                  y1="304"
                  x2="148"
                  y2="333"
                  stroke="#fbbf24"
                  strokeWidth="1.8"
                  markerEnd="url(#arrow-ack)"
                />
                <line
                  x1="400"
                  y1="316"
                  x2="140"
                  y2="346"
                  stroke="#fbbf24"
                  strokeWidth="1.8"
                  markerEnd="url(#arrow-ack)"
                />

                {/* Etiqueta explicativa */}
                <text x="210" y="380" fill="#f43f5e" fontSize="11" fontWeight="bold" textAnchor="middle">
                  Segmento Perdido (✖) → 3 ACKs Duplicados devueltos
                </text>
              </g>
            </svg>
          </div>

          {/* Estado numérico de la ráfaga activa */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-zinc-400 block text-[10px]">Ráfaga en este RTT:</span>
              <span className="text-white font-bold">{current.burstLabel}</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-400 block text-[10px]">Datos en vuelo:</span>
              <span className="text-cyan-300 font-bold">{current.bytesInFlight} Bytes</span>
            </div>
          </div>
        </div>

        {/* =========================================================
            COLUMNA DERECHA: GRÁFICO OFICIAL MEJORADO (10/10)
           ========================================================= */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-[32px] apple-glass border border-white/[0.08] flex flex-col justify-between space-y-4 bg-[#07090e]/95">
          
          {/* Header con la Fase (Exacto a la Captura: "Fase: Inicio rápido") */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-white font-display">
                Fase:{' '}
                <span className={
                  current.phaseReno === 'Inicio rápido'
                    ? 'text-amber-400'
                    : current.phaseReno === 'Recuperación rápida'
                    ? 'text-cyan-400'
                    : 'text-emerald-400'
                }>
                  {current.phaseReno}
                </span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                {current.phaseReno === 'Inicio rápido' ? 'Exponencial (x2 / RTT)' : 'Lineal (+1 MSS / RTT)'}
              </span>
            </div>

            {/* Selector de Curvas */}
            <div className="inline-flex p-1 rounded-xl bg-black/60 border border-white/[0.08] text-xs font-mono">
              <button
                onClick={() => setCurveFilter('both')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  curveFilter === 'both' ? 'bg-white/20 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Ambos
              </button>
              <button
                onClick={() => setCurveFilter('reno')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  curveFilter === 'reno' ? 'bg-cyan-500/25 text-cyan-300 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                TCP Reno
              </button>
              <button
                onClick={() => setCurveFilter('tahoe')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  curveFilter === 'tahoe' ? 'bg-zinc-500/25 text-zinc-200 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                TCP Tahoe
              </button>
            </div>
          </div>

          {/* SVG DE ALTA FIDELIDAD DEL GRÁFICO (RENO VS TAHOE) */}
          <div className="relative w-full overflow-x-auto flex justify-center py-2">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full max-w-[580px] h-auto select-none font-mono"
            >
              {/* Cuadrícula horizontal (valores 0, 2, 4, 6, 8, 10, 12, 14) */}
              {[0, 2, 4, 6, 8, 10, 12, 14].map((yVal) => (
                <line
                  key={`gy-${yVal}`}
                  x1={padL}
                  y1={getY(yVal)}
                  x2={svgW - padR}
                  y2={getY(yVal)}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                />
              ))}

              {/* Cuadrícula vertical (ciclos 0 a 15) */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((xVal) => (
                <line
                  key={`gx-${xVal}`}
                  x1={getX(xVal)}
                  y1={padT}
                  x2={getX(xVal)}
                  y2={svgH - padB}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                />
              ))}

              {/* Ejes principales X e Y */}
              <line
                x1={padL}
                y1={padT}
                x2={padL}
                y2={svgH - padB}
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="1.5"
              />
              <line
                x1={padL}
                y1={svgH - padB}
                x2={svgW - padR}
                y2={svgH - padB}
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="1.5"
              />

              {/* Rótulos de los Ejes */}
              <text
                x={-svgH / 2}
                y="15"
                transform="rotate(-90)"
                fill="#a1a1aa"
                fontSize="11"
                textAnchor="middle"
                className="font-sans font-medium"
              >
                Ventana de congestión (en segmentos)
              </text>

              <text
                x={padL + plotW / 2}
                y={svgH - 8}
                fill="#a1a1aa"
                fontSize="11"
                textAnchor="middle"
                className="font-sans font-medium"
              >
                Ciclo de transmisión
              </text>

              {/* Marcas de valores en el Eje Y */}
              {[0, 2, 4, 6, 8, 10, 12, 14].map((yVal) => (
                <text
                  key={`ly-${yVal}`}
                  x={padL - 8}
                  y={getY(yVal) + 4}
                  fill="#71717a"
                  fontSize="11"
                  textAnchor="end"
                >
                  {yVal}
                </text>
              ))}

              {/* Marcas de valores en el Eje X */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((xVal) => (
                <text
                  key={`lx-${xVal}`}
                  x={getX(xVal)}
                  y={svgH - padB + 18}
                  fill={xVal === activeCycle ? '#38bdf8' : '#71717a'}
                  fontWeight={xVal === activeCycle ? 'bold' : 'normal'}
                  fontSize="10"
                  textAnchor="middle"
                >
                  {xVal}
                </text>
              ))}

              {/* Líneas de Umbral (ssthresh) discontinuas exactas a la captura */}
              {/* Umbral 1: ssthresh = 8 (Ciclo 0 a 8) */}
              <line
                x1={getX(0)}
                y1={getY(8)}
                x2={getX(8)}
                y2={getY(8)}
                stroke="#e4e4e7"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={getX(0) + 12}
                y={getY(8) - 6}
                fill="#e4e4e7"
                fontSize="10"
                fontWeight="bold"
              >
                umbral (8)
              </text>

              {/* Umbral 2: ssthresh = 6 (Ciclo 8 a 15) */}
              <line
                x1={getX(8)}
                y1={getY(6)}
                x2={getX(15)}
                y2={getY(6)}
                stroke="#e4e4e7"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={getX(13.5)}
                y={getY(6) + 14}
                fill="#e4e4e7"
                fontSize="10"
                fontWeight="bold"
              >
                umbral (6)
              </text>

              {/* CURVA TCP TAHOE (Línea gris claro con puntos, que cae a 1) */}
              {(curveFilter === 'both' || curveFilter === 'tahoe') && (
                <g>
                  <path
                    d={tahoePath}
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {cycles.map((c) => (
                    <circle
                      key={`tahoe-c-${c.cycle}`}
                      cx={getX(c.cycle)}
                      cy={getY(c.cwndTahoe)}
                      r="3.5"
                      fill="#e4e4e7"
                      stroke="#4b5563"
                      strokeWidth="1"
                    />
                  ))}
                  <text
                    x={getX(4.3)}
                    y={getY(4) + 18}
                    fill="#9ca3af"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    TCP Tahoe
                  </text>
                </g>
              )}

              {/* CURVA TCP RENO (Línea contrastante con puntos que se bifurca en ciclo 9) */}
              {(curveFilter === 'both' || curveFilter === 'reno') && (
                <g>
                  <path
                    d={renoPath}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {renoPoints.map((c) => (
                    <circle
                      key={`reno-c-${c.cycle}`}
                      cx={getX(c.cycle)}
                      cy={getY(c.cwndReno)}
                      r="4"
                      fill="#07090e"
                      stroke="#22d3ee"
                      strokeWidth="2"
                    />
                  ))}
                  {/* Etiqueta y flecha apuntando a TCP Reno (Exacta a la imagen) */}
                  <text
                    x={getX(12.3)}
                    y={getY(12.3)}
                    fill="#22d3ee"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    TCP Reno
                  </text>
                  <line
                    x1={getX(12.3)}
                    y1={getY(12)}
                    x2={getX(11.8)}
                    y2={getY(9.5)}
                    stroke="#22d3ee"
                    strokeWidth="1.2"
                  />
                </g>
              )}

              {/* Cursor / Marcador Interactivo del Ciclo Actual */}
              <g>
                <line
                  x1={getX(current.cycle)}
                  y1={padT}
                  x2={getX(current.cycle)}
                  y2={svgH - padB}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={getX(current.cycle)}
                  cy={getY(current.cwndReno)}
                  r="7"
                  fill="#38bdf8"
                  className="animate-pulse"
                />
                <circle
                  cx={getX(current.cycle)}
                  cy={getY(current.cwndReno)}
                  r="3.5"
                  fill="#07090e"
                />
              </g>
            </svg>
          </div>

          {/* Controles de Reproducción y Avance por RTT */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs font-mono flex items-center gap-2 hover:bg-zinc-200 transition-all cursor-pointer shadow-lg tabe-btn-action"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pausar Simulación' : 'Reproducir Flujo RTT'}</span>
              </button>

              <button
                onClick={handlePrev}
                disabled={activeCycle === 1}
                className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 text-white font-mono text-xs flex items-center transition-all cursor-pointer border border-white/[0.08] tabe-btn-action"
                title="RTT Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleNext}
                disabled={activeCycle === 15}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 text-white font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/[0.08] tabe-btn-action"
              >
                <span>Siguiente RTT</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/[0.06] tabe-btn-action"
                title="Reiniciar a Ciclo 1"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Slider de Velocidad */}
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{(playSpeedMs / 1000).toFixed(1)}s / RTT</span>
              <input
                type="range"
                min="600"
                max="2400"
                step="200"
                value={playSpeedMs}
                onChange={(e) => setPlaySpeedMs(Number(e.target.value))}
                className="w-20 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* EXPLICACIÓN TÉCNICA DEL CICLO ACTUAL */}
      <div className="p-6 sm:p-8 rounded-[32px] apple-glass border border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-bold text-white font-display">
              Análisis Técnico del Ciclo #{current.cycle}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-400">cwnd Reno:</span>
            <strong className="text-cyan-300 font-bold">{current.cwndReno} MSS ({current.bytesInFlight} B)</strong>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">cwnd Tahoe:</span>
            <strong className="text-zinc-300 font-bold">{current.cwndTahoe} MSS</strong>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">ssthresh:</span>
            <strong className="text-amber-400 font-bold">{current.ssthreshReno} MSS</strong>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          {current.explanation}
        </p>

        {/* Tarjetas Comparativas de Comportamiento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-1.5 font-mono text-xs">
            <div className="text-zinc-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              TCP Tahoe (Comportamiento Clásico):
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
              Trata tanto la pérdida por 3 ACKs duplicados como el Timeout de forma idéntica: <strong className="text-white">resetea cwnd a 1 MSS</strong> y reinicia en Inicio Rápido hasta el nuevo umbral (6 MSS). Esto provoca caídas abruptas de throughput.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-1.5 font-mono text-xs">
            <div className="text-cyan-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              TCP Reno (Estándar Moderno RFC 5681):
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">
              Al recibir 3 ACKs Duplicados, sabe que los paquetes posteriores sí alcanzaron al destino. Ejecuta <strong>Fast Retransmit</strong> del segmento perdido y <strong>Fast Recovery</strong>: ajusta <code className="text-cyan-300">cwnd = ssthresh = 6 MSS</code> y continúa en Evitación de Congestión sin reiniciar a 1, preservando el caudal de la red.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
