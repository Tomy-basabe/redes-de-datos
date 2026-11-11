import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft,
  AlertTriangle, 
  Laptop,
  Server,
  Clock,
  Sliders,
  CheckCircle2,
  XCircle,
  Zap,
  Info,
  Sparkles
} from 'lucide-react';
import { tabeSpringPill } from '../../lib/tabeChoreography';

interface PacketItem {
  id: number;
  segNum: number;
  seqVal: number;
  ackVal: number;
  isLost: boolean;
  ackStatus: 'normal' | 'dup';
}

export const Section6CongestionSawtooth: React.FC = () => {
  // 1. Congestión pactada de la red (configurable por el usuario)
  // Opciones: 8, 10, 12, 14 segmentos
  const [networkCapacityLimit, setNetworkCapacityLimit] = useState<number>(12);
  const [lossMechanism, setLossMechanism] = useState<'3dup_ack' | 'timeout'>('3dup_ack');
  
  // 2. Control de tiempo y ciclos
  const [activeCycle, setActiveCycle] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeedMs, setPlaySpeedMs] = useState<number>(1800);
  
  // 3. Sub-etapas de animación dentro de un RTT:
  // 'idle' -> 'transmitting' (paquetes viajan a B) -> 'acked' (ACKs viajan a A) -> 'threshold_spawn' (se crea umbral si hubo pérdida)
  const [animStage, setAnimStage] = useState<'transmitting' | 'acked' | 'settled'>('settled');
  
  // Estado para saber si el umbral ya ha sido descubierto/creado
  // Regla del usuario: NO DEBE EXISTIR si todavía no se llega al segmento que excede la congestión pactada
  const [thresholdCreated, setThresholdCreated] = useState<boolean>(false);
  const [thresholdValue, setThresholdValue] = useState<number | null>(null);
  
  // Filtro de curvas (Ambos, Reno, Tahoe)
  const [curveFilter, setCurveFilter] = useState<'both' | 'reno' | 'tahoe'>('both');

  const mss = 1460;

  // Ciclo donde se excede la congestión pactada
  // Calculamos en qué ciclo se alcanza la capacidad seleccionada:
  // Por ejemplo, con 12: Ciclo 1 (1), Ciclo 2 (2), Ciclo 3 (4), Ciclo 4 (8), Ciclo 5 (9), Ciclo 6 (10), Ciclo 7 (11), Ciclo 8 (12) -> Congestión en Ciclo 8
  const lossCycle = networkCapacityLimit === 8 ? 4 : networkCapacityLimit === 10 ? 6 : networkCapacityLimit === 12 ? 8 : 10;

  // Generador de datos de los 15 ciclos
  const generateData = () => {
    const list: Array<{
      cycle: number;
      cwndReno: number;
      cwndTahoe: number;
      ssthresh: number | null;
      phase: string;
      isLoss: boolean;
      hasThreshold: boolean;
      segments: PacketItem[];
    }> = [];

    let currentCwnd = 1;
    let ssthreshCalc: number | null = null;
    let hasCreatedThresh = false;

    // Valores para Reno y Tahoe
    let cwndR = 1;
    let cwndT = 1;

    for (let c = 1; c <= 15; c++) {
      const isLossEvent = (c === lossCycle);

      if (c < lossCycle) {
        // Antes de la congestión: No hay umbral. Crecimiento de Inicio Rápido hasta saturar o lineal
        if (c <= 3) {
          cwndR = Math.pow(2, c - 1); // 1, 2, 4
          cwndT = cwndR;
        } else {
          // Si capacidad es 8, en c=4 es 8. Si es 12, va 8, 9, 10, 11, 12...
          const prev = list[c - 2]?.cwndReno || 4;
          cwndR = Math.min(networkCapacityLimit, prev <= 4 ? 8 : prev + 1);
          cwndT = cwndR;
        }
      } else if (c === lossCycle) {
        // En el ciclo de congestión: se alcanza la capacidad pactada
        cwndR = networkCapacityLimit;
        cwndT = networkCapacityLimit;
        // El umbral se calcula como la congestión pactada / 2
        ssthreshCalc = Math.max(2, Math.floor(networkCapacityLimit / 2));
        hasCreatedThresh = true;
      } else {
        // Ciclos posteriores a la congestión
        const half = Math.max(2, Math.floor(networkCapacityLimit / 2));
        ssthreshCalc = half;
        hasCreatedThresh = true;

        if (c === lossCycle + 1) {
          if (lossMechanism === '3dup_ack') {
            cwndR = half; // Reno salta al umbral (Fast Recovery)
          } else {
            cwndR = 1; // Timeout cae a 1
          }
          cwndT = 1; // Tahoe siempre cae a 1
        } else {
          // Reno avanza lineal
          if (lossMechanism === '3dup_ack') {
            cwndR = half + (c - (lossCycle + 1));
          } else {
            const prevR = list[c - 2].cwndReno;
            cwndR = prevR < half ? Math.min(half, prevR * 2) : prevR + 1;
          }

          // Tahoe sube en Slow Start hasta el nuevo umbral (half) y luego lineal
          const prevT = list[c - 2].cwndTahoe;
          if (prevT < half) {
            cwndT = Math.min(half, prevT * 2);
          } else {
            cwndT = prevT + 1;
          }
        }
      }

      // Generar paquetes representativos para el diagrama de flechas
      // Representamos de 1 hasta 6 flechas visibles para claridad
      const segCount = Math.min(cwndR, 5);
      const segs: PacketItem[] = [];
      const baseSeq = (c - 1) * 10000 + 1000;

      for (let s = 0; s < segCount; s++) {
        const segSeq = baseSeq + s * mss;
        const isThisLost = (isLossEvent && s === 1); // El segundo segmento se pierde
        const isDup = (isLossEvent && s > 1); // Los posteriores son dup ACKs

        segs.push({
          id: s + 1,
          segNum: s + 1,
          seqVal: segSeq,
          ackVal: isDup ? baseSeq + mss : segSeq + mss,
          isLost: isThisLost,
          ackStatus: isDup ? 'dup' : 'normal'
        });
      }

      let phaseName = 'Inicio rápido';
      if (hasCreatedThresh) {
        if (c === lossCycle + 1 && lossMechanism === '3dup_ack') {
          phaseName = 'Recuperación rápida';
        } else if (cwndR >= (ssthreshCalc || 6)) {
          phaseName = 'Evitación de congestión';
        }
      }

      list.push({
        cycle: c,
        cwndReno: cwndR,
        cwndTahoe: cwndT,
        ssthresh: hasCreatedThresh ? ssthreshCalc : null,
        phase: phaseName,
        isLoss: isLossEvent,
        hasThreshold: hasCreatedThresh,
        segments: segs
      });
    }

    return list;
  };

  const simulationData = generateData();
  const currentCycleData = simulationData[activeCycle - 1] || simulationData[0];

  // Actualizar si el umbral está creado en base al ciclo activo
  useEffect(() => {
    if (activeCycle >= lossCycle) {
      setThresholdCreated(true);
      setThresholdValue(Math.max(2, Math.floor(networkCapacityLimit / 2)));
    } else {
      setThresholdCreated(false);
      setThresholdValue(null);
    }
  }, [activeCycle, lossCycle, networkCapacityLimit]);

  // Manejo de la animación paso a paso de los paquetes
  useEffect(() => {
    // Al cambiar de ciclo, arrancamos transmitiendo
    setAnimStage('transmitting');
    const timer1 = setTimeout(() => {
      setAnimStage('acked');
      const timer2 = setTimeout(() => {
        setAnimStage('settled');
      }, playSpeedMs * 0.45);
      return () => clearTimeout(timer2);
    }, playSpeedMs * 0.45);

    return () => clearTimeout(timer1);
  }, [activeCycle, playSpeedMs]);

  // Loop de reproducción automática
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

  const handleReset = () => {
    setIsPlaying(false);
    setActiveCycle(1);
    setThresholdCreated(false);
    setThresholdValue(null);
  };

  const handleNext = () => {
    if (activeCycle < 15) setActiveCycle((c) => c + 1);
  };

  const handlePrev = () => {
    if (activeCycle > 1) setActiveCycle((c) => c - 1);
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

  // Puntos para TCP Tahoe y TCP Reno
  const tahoePath = simulationData
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(c.cycle)} ${getY(c.cwndTahoe)}`)
    .join(' ');

  const renoPoints = simulationData.filter((c) => c.cycle >= lossCycle);
  const renoPath = renoPoints
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(c.cycle)} ${getY(c.cwndReno)}`)
    .join(' ');

  // El valor del umbral calculado
  const currentThreshold = Math.max(2, Math.floor(networkCapacityLimit / 2));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold block">
              Control de Congestión Dinámico
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
              RFC 5681 • Simulación Extremo a Extremo
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold apple-headline text-white mt-1">
            Ventana de Congestión TCP (cwnd) & Fenómeno de Sierra
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-3xl">
            Observa el recorrido físico de cada segmento y su correspondiente ACK. Al inicio no existe ningún umbral; la línea horizontal solo se crea y dibuja cuando la ráfaga excede la capacidad pactada de la red, fijando el nuevo <code className="text-amber-300">umbral = Congestión / 2</code>.
          </p>
        </div>

        {/* Selector de Capacidad de Congestión Pactada (Regla de Usuario) */}
        <div className="p-3 rounded-2xl bg-black/60 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs font-mono">
            <span className="text-zinc-400">Congestión de Red Pactada:</span>
            <span className="text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
              {networkCapacityLimit} segmentos ({networkCapacityLimit * mss} B)
            </span>
          </div>
          <div className="flex gap-1.5">
            {[8, 10, 12, 14].map((cap) => (
              <button
                key={cap}
                onClick={() => {
                  setNetworkCapacityLimit(cap);
                  handleReset();
                }}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-mono transition-all tabe-btn-action cursor-pointer ${
                  networkCapacityLimit === cap
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                {cap} MSS
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DUAL DISPLAY: DIAGRAMA ESPACIO-TIEMPO INTERACTIVO + GRÁFICO DINÁMICO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* =========================================================
            COLUMNA IZQUIERDA: DIAGRAMA ESPACIO-TIEMPO CON PAQUETES NAVEGANDO
           ========================================================= */}
        <div className="lg:col-span-6 p-6 rounded-[32px] apple-glass border border-white/[0.08] flex flex-col justify-between space-y-4 bg-[#07090e]/95 relative overflow-hidden">
          
          {/* Header con Recuadro "siguiente periodo RTT" */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="px-3.5 py-1.5 border-2 border-white/80 bg-black/90 rounded text-xs sm:text-sm font-bold font-display text-white tracking-wider uppercase shadow-md">
              siguiente periodo RTT
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-400">Ciclo RTT:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                #{activeCycle} de 15
              </span>
            </div>
          </div>

          {/* Extremos Host A y Host B */}
          <div className="flex justify-between items-center px-4 pt-1">
            <div className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-md">
                <Laptop className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white mt-1 font-display">Host A</span>
              <span className="text-[10px] font-mono text-cyan-300">172.16.20.10</span>
              <span className="text-[9px] font-mono text-zinc-500">Cliente (VLAN 20)</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">
                Canal WAN
              </div>
              <span className="text-[11px] font-mono text-amber-300 mt-0.5">
                RTT ≈ 50 ms
              </span>
              <span className="text-[9px] font-mono text-zinc-500">
                MikroTik Multi-Enlace
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-md">
                <Server className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white mt-1 font-display">Host B</span>
              <span className="text-[10px] font-mono text-emerald-300">172.16.10.12:443</span>
              <span className="text-[9px] font-mono text-zinc-500">Nginx (VLAN 10)</span>
            </div>
          </div>

          {/* LIENZO VECTORIAL DEL DIAGRAMA CON PAQUETES NAVEGANDO REALMENTE */}
          <div className="relative w-full flex justify-center py-2 select-none">
            <svg
              viewBox="0 0 460 480"
              className="w-full max-w-[440px] h-auto font-mono text-xs overflow-visible"
            >
              <defs>
                <marker
                  id="arr-seg"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#d4d4d8" />
                </marker>
                
                <marker
                  id="arr-ack"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#a1a1aa" />
                </marker>

                <marker
                  id="arr-dup"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                </marker>
              </defs>

              {/* Líneas verticales punteadas de tiempo */}
              <line x1="60" y1="10" x2="60" y2="450" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="400" y1="10" x2="400" y2="450" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />

              <polygon points="56,450 64,450 60,458" fill="rgba(255,255,255,0.6)" />
              <text x="60" y="472" fill="#a1a1aa" fontSize="11" textAnchor="middle">Tiempo</text>

              <polygon points="396,450 404,450 400,458" fill="rgba(255,255,255,0.6)" />
              <text x="400" y="472" fill="#a1a1aa" fontSize="11" textAnchor="middle">Tiempo</text>

              {/* Bracket de RTT */}
              <path d="M 46 22 L 36 22 L 36 50 L 26 50 L 36 50 L 36 78 L 46 78" fill="none" stroke="#d4d4d8" strokeWidth="1.5" />
              <text x="20" y="54" fill="#f4f4f5" fontSize="11" fontWeight="bold" textAnchor="end">RTT</text>

              {/* RÁFAGA 1: un segmento */}
              <g opacity={activeCycle >= 1 ? 1 : 0.2}>
                <text x="230" y="34" fill="#e4e4e7" fontSize="11" fontWeight="bold" textAnchor="middle">
                  un segmento [Seq 1000]
                </text>
                <line x1="60" y1="22" x2="400" y2="50" stroke="#d4d4d8" strokeWidth="1.5" markerEnd="url(#arr-seg)" />
                <line x1="400" y1="50" x2="60" y2="78" stroke="#a1a1aa" strokeWidth="1.2" markerEnd="url(#arr-ack)" />
                
                {/* Paquete navegando en Ciclo 1 */}
                {activeCycle === 1 && animStage === 'transmitting' && (
                  <motion.g
                    initial={{ x: 60, y: 22 }}
                    animate={{ x: 400, y: 50 }}
                    transition={{ duration: playSpeedMs * 0.00045, ease: 'linear' }}
                  >
                    <rect x="-24" y="-8" width="48" height="16" rx="8" fill="#0284c7" />
                    <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Seq 1000</text>
                  </motion.g>
                )}
                {activeCycle === 1 && animStage === 'acked' && (
                  <motion.g
                    initial={{ x: 400, y: 50 }}
                    animate={{ x: 60, y: 78 }}
                    transition={{ duration: playSpeedMs * 0.00045, ease: 'linear' }}
                  >
                    <rect x="-24" y="-8" width="48" height="16" rx="8" fill="#059669" />
                    <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">ACK 2460</text>
                  </motion.g>
                )}
              </g>

              {/* RÁFAGA 2: dos segmentos */}
              <g opacity={activeCycle >= 2 ? 1 : 0.2}>
                <text x="230" y="90" fill="#e4e4e7" fontSize="11" fontWeight="bold" textAnchor="middle">
                  dos segmentos [Seq 2460, 3920]
                </text>
                <line x1="60" y1="78" x2="400" y2="106" stroke="#d4d4d8" strokeWidth="1.5" markerEnd="url(#arr-seg)" />
                <line x1="60" y1="90" x2="400" y2="118" stroke="#d4d4d8" strokeWidth="1.5" markerEnd="url(#arr-seg)" />
                <line x1="400" y1="106" x2="60" y2="134" stroke="#a1a1aa" strokeWidth="1.2" markerEnd="url(#arr-ack)" />
                <line x1="400" y1="118" x2="60" y2="146" stroke="#a1a1aa" strokeWidth="1.2" markerEnd="url(#arr-ack)" />

                {/* Paquetes navegando en Ciclo 2 */}
                {activeCycle === 2 && animStage === 'transmitting' && (
                  <>
                    <motion.g initial={{ x: 60, y: 78 }} animate={{ x: 400, y: 106 }} transition={{ duration: playSpeedMs * 0.00045, ease: 'linear' }}>
                      <rect x="-24" y="-8" width="48" height="16" rx="8" fill="#0284c7" />
                      <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Seq 2460</text>
                    </motion.g>
                    <motion.g initial={{ x: 60, y: 90 }} animate={{ x: 400, y: 118 }} transition={{ duration: playSpeedMs * 0.00045, ease: 'linear' }}>
                      <rect x="-24" y="-8" width="48" height="16" rx="8" fill="#0284c7" />
                      <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Seq 3920</text>
                    </motion.g>
                  </>
                )}
                {activeCycle === 2 && animStage === 'acked' && (
                  <>
                    <motion.g initial={{ x: 400, y: 106 }} animate={{ x: 60, y: 134 }} transition={{ duration: playSpeedMs * 0.00045, ease: 'linear' }}>
                      <rect x="-24" y="-8" width="48" height="16" rx="8" fill="#059669" />
                      <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">ACK 3920</text>
                    </motion.g>
                    <motion.g initial={{ x: 400, y: 118 }} animate={{ x: 60, y: 146 }} transition={{ duration: playSpeedMs * 0.00045, ease: 'linear' }}>
                      <rect x="-24" y="-8" width="48" height="16" rx="8" fill="#059669" />
                      <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">ACK 5380</text>
                    </motion.g>
                  </>
                )}
              </g>

              {/* RÁFAGA 3: cuatro segmentos */}
              <g opacity={activeCycle >= 3 ? 1 : 0.2}>
                <text x="230" y="160" fill="#e4e4e7" fontSize="11" fontWeight="bold" textAnchor="middle">
                  cuatro segmentos
                </text>
                <line x1="60" y1="146" x2="400" y2="174" stroke="#d4d4d8" strokeWidth="1.5" markerEnd="url(#arr-seg)" />
                <line x1="60" y1="156" x2="400" y2="184" stroke="#d4d4d8" strokeWidth="1.5" markerEnd="url(#arr-seg)" />
                <line x1="60" y1="166" x2="400" y2="194" stroke="#d4d4d8" strokeWidth="1.5" markerEnd="url(#arr-seg)" />
                <line x1="60" y1="176" x2="400" y2="204" stroke="#d4d4d8" strokeWidth="1.5" markerEnd="url(#arr-seg)" />

                <line x1="400" y1="174" x2="60" y2="202" stroke="#a1a1aa" strokeWidth="1.2" markerEnd="url(#arr-ack)" />
                <line x1="400" y1="184" x2="60" y2="212" stroke="#a1a1aa" strokeWidth="1.2" markerEnd="url(#arr-ack)" />
                <line x1="400" y1="194" x2="60" y2="222" stroke="#a1a1aa" strokeWidth="1.2" markerEnd="url(#arr-ack)" />
                <line x1="400" y1="204" x2="60" y2="232" stroke="#a1a1aa" strokeWidth="1.2" markerEnd="url(#arr-ack)" />

                {/* Paquetes navegando en Ciclo 3 */}
                {activeCycle === 3 && animStage === 'transmitting' && (
                  <motion.g initial={{ x: 60, y: 146 }} animate={{ x: 400, y: 174 }} transition={{ duration: playSpeedMs * 0.00045, ease: 'linear' }}>
                    <rect x="-24" y="-8" width="48" height="16" rx="8" fill="#0284c7" />
                    <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Seq #1</text>
                  </motion.g>
                )}
                {activeCycle === 3 && animStage === 'acked' && (
                  <motion.g initial={{ x: 400, y: 174 }} animate={{ x: 60, y: 202 }} transition={{ duration: playSpeedMs * 0.00045, ease: 'linear' }}>
                    <rect x="-24" y="-8" width="48" height="16" rx="8" fill="#059669" />
                    <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">ACK #1</text>
                  </motion.g>
                )}
              </g>

              {/* RÁFAGA DE CONGESTIÓN (LLEGA A LA CAPACIDAD PACTADA) CON 'X' DE ERROR */}
              <g opacity={activeCycle >= lossCycle ? 1 : 0.2}>
                {/* Líneas de ida */}
                <line x1="60" y1="240" x2="400" y2="268" stroke="#d4d4d8" strokeWidth="1.5" markerEnd="url(#arr-seg)" />
                {/* Segmento perdido que se corta en la X */}
                <line x1="60" y1="252" x2="220" y2="274" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 2" />
                <line x1="60" y1="264" x2="400" y2="292" stroke="#d4d4d8" strokeWidth="1.5" markerEnd="url(#arr-seg)" />
                <line x1="60" y1="276" x2="400" y2="304" stroke="#d4d4d8" strokeWidth="1.5" markerEnd="url(#arr-seg)" />
                <line x1="60" y1="288" x2="400" y2="316" stroke="#d4d4d8" strokeWidth="1.5" markerEnd="url(#arr-seg)" />

                {/* ANIMACIÓN DEL PAQUETE PERDIDO VIAJANDO HASTA LA 'X' */}
                {activeCycle === lossCycle && animStage === 'transmitting' && (
                  <motion.g
                    initial={{ x: 60, y: 252 }}
                    animate={{ x: 220, y: 274 }}
                    transition={{ duration: playSpeedMs * 0.00028, ease: 'linear' }}
                  >
                    <rect x="-24" y="-8" width="48" height="16" rx="8" fill="#ef4444" />
                    <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Seq #2</text>
                  </motion.g>
                )}

                {/* LA 'X' PROMINENTE DE PÉRDIDA EN EL CANAL */}
                <g transform="translate(135, 335)">
                  <rect x="-14" y="-14" width="28" height="28" rx="6" fill="#000000" fillOpacity="0.8" />
                  <line x1="-10" y1="-10" x2="10" y2="10" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" />
                  <line x1="10" y1="-10" x2="-10" y2="10" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" />
                </g>

                {/* Retorno de ACKs normales y ACKs duplicados */}
                <line x1="400" y1="268" x2="60" y2="296" stroke="#a1a1aa" strokeWidth="1.2" markerEnd="url(#arr-ack)" />
                <line x1="400" y1="292" x2="155" y2="320" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arr-dup)" />
                <line x1="400" y1="304" x2="148" y2="333" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arr-dup)" />
                <line x1="400" y1="316" x2="140" y2="346" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arr-dup)" />

                {/* Paquetes de ACK duplicados viajando hacia Host A */}
                {activeCycle === lossCycle && animStage === 'acked' && (
                  <motion.g
                    initial={{ x: 400, y: 292 }}
                    animate={{ x: 155, y: 320 }}
                    transition={{ duration: playSpeedMs * 0.00045, ease: 'linear' }}
                  >
                    <rect x="-30" y="-8" width="60" height="16" rx="8" fill="#d97706" />
                    <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">ACK Dup #1</text>
                  </motion.g>
                )}

                <text x="210" y="380" fill="#f43f5e" fontSize="11" fontWeight="bold" textAnchor="middle">
                  Segmento Perdido (✖) → 3 ACKs Duplicados devueltos
                </text>
              </g>
            </svg>
          </div>

          {/* Estado de la ráfaga */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-zinc-400 block text-[10px]">Ráfaga en este RTT:</span>
              <span className="text-white font-bold">{currentCycleData.cwndReno} segmentos ({currentCycleData.cwndReno * mss} B)</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-400 block text-[10px]">Umbral ssthresh actual:</span>
              <span className={thresholdCreated ? 'text-amber-400 font-bold' : 'text-zinc-500 font-normal'}>
                {thresholdCreated ? `${thresholdValue} MSS (Congestión / 2)` : 'No existe aún (Sin congestión)'}
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================
            COLUMNA DERECHA: GRÁFICO DINÁMICO (UMBRAL CONDICIONAL Y ANIMADO)
           ========================================================= */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-[32px] apple-glass border border-white/[0.08] flex flex-col justify-between space-y-4 bg-[#07090e]/95">
          
          {/* Header con la Fase */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-white font-display">
                Fase:{' '}
                <span className={
                  currentCycleData.phase === 'Inicio rápido'
                    ? 'text-amber-400'
                    : currentCycleData.phase === 'Recuperación rápida'
                    ? 'text-cyan-400'
                    : 'text-emerald-400'
                }>
                  {currentCycleData.phase}
                </span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                {currentCycleData.phase === 'Inicio rápido' ? 'Exponencial (x2 / RTT)' : 'Lineal (+1 MSS / RTT)'}
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

          {/* GRÁFICO VECTORIAL */}
          <div className="relative w-full overflow-x-auto flex justify-center py-2">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full max-w-[580px] h-auto select-none font-mono"
            >
              {/* Cuadrícula horizontal */}
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

              {/* Cuadrícula vertical */}
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

              {/* Ejes principales */}
              <line x1={padL} y1={padT} x2={padL} y2={svgH - padB} stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" />
              <line x1={padL} y1={svgH - padB} x2={svgW - padR} y2={svgH - padB} stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" />

              <text x={-svgH / 2} y="15" transform="rotate(-90)" fill="#a1a1aa" fontSize="11" textAnchor="middle" className="font-sans font-medium">
                Ventana de congestión (en segmentos)
              </text>

              <text x={padL + plotW / 2} y={svgH - 8} fill="#a1a1aa" fontSize="11" textAnchor="middle" className="font-sans font-medium">
                Ciclo de transmisión
              </text>

              {[0, 2, 4, 6, 8, 10, 12, 14].map((yVal) => (
                <text key={`ly-${yVal}`} x={padL - 8} y={getY(yVal) + 4} fill="#71717a" fontSize="11" textAnchor="end">
                  {yVal}
                </text>
              ))}

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

              {/* LÍNEA DE UMBRAL CONDICIONAL Y ANIMADA (SOLO APARECE TRAS LA PÉRDIDA) */}
              <AnimatePresence>
                {thresholdCreated && (
                  <g>
                    {/* Línea horizontal animada que se expande hacia la derecha */}
                    <motion.line
                      initial={{ x2: getX(lossCycle) }}
                      animate={{ x2: getX(15) }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      x1={getX(lossCycle)}
                      y1={getY(currentThreshold)}
                      stroke="#fbbf24"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />

                    {/* Rótulo animado del umbral recién nacido */}
                    <motion.g
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <rect
                        x={getX(lossCycle) + 10}
                        y={getY(currentThreshold) - 18}
                        width="155"
                        height="20"
                        rx="6"
                        fill="#000000"
                        stroke="#fbbf24"
                        strokeWidth="1"
                      />
                      <text
                        x={getX(lossCycle) + 18}
                        y={getY(currentThreshold) - 5}
                        fill="#fbbf24"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        umbral = {networkCapacityLimit}/2 = {currentThreshold} MSS
                      </text>
                    </motion.g>
                  </g>
                )}
              </AnimatePresence>

              {/* Curva TCP Tahoe */}
              {(curveFilter === 'both' || curveFilter === 'tahoe') && (
                <g>
                  <path d={tahoePath} fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {simulationData.map((c) => (
                    <circle key={`pt-${c.cycle}`} cx={getX(c.cycle)} cy={getY(c.cwndTahoe)} r="3.5" fill="#e4e4e7" stroke="#4b5563" strokeWidth="1" />
                  ))}
                  <text x={getX(4.3)} y={getY(4) + 18} fill="#9ca3af" fontSize="11" fontWeight="bold">
                    TCP Tahoe
                  </text>
                </g>
              )}

              {/* Curva TCP Reno */}
              {(curveFilter === 'both' || curveFilter === 'reno') && (
                <g>
                  <path d={renoPath} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {renoPoints.map((c) => (
                    <circle key={`pr-${c.cycle}`} cx={getX(c.cycle)} cy={getY(c.cwndReno)} r="4" fill="#07090e" stroke="#22d3ee" strokeWidth="2" />
                  ))}
                  <text x={getX(12.3)} y={getY(12.3)} fill="#22d3ee" fontSize="11" fontWeight="bold" textAnchor="middle">
                    TCP Reno
                  </text>
                  <line x1={getX(12.3)} y1={getY(12)} x2={getX(11.8)} y2={getY(9.5)} stroke="#22d3ee" strokeWidth="1.2" />
                </g>
              )}

              {/* Cursor activo con pulso */}
              <g>
                <line x1={getX(activeCycle)} y1={padT} x2={getX(activeCycle)} y2={svgH - padB} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                <circle cx={getX(activeCycle)} cy={getY(currentCycleData.cwndReno)} r="7" fill="#38bdf8" className="animate-pulse" />
                <circle cx={getX(activeCycle)} cy={getY(currentCycleData.cwndReno)} r="3.5" fill="#07090e" />
              </g>
            </svg>
          </div>

          {/* Botonera de Control de Reproducción */}
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
                title="Reiniciar al Ciclo 1"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{(playSpeedMs / 1000).toFixed(1)}s / RTT</span>
              <input
                type="range"
                min="800"
                max="2600"
                step="200"
                value={playSpeedMs}
                onChange={(e) => setPlaySpeedMs(Number(e.target.value))}
                className="w-20 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DETALLE TÉCNICO Y EXPLICACIÓN DE LA CREACIÓN DEL UMBRAL */}
      <div className="p-6 sm:p-8 rounded-[32px] apple-glass border border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-bold text-white font-display">
              Diagnóstico de la Conexión • RTT #{activeCycle}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-400">Estado de Umbral:</span>
            {thresholdCreated ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Umbral Creado = {currentThreshold} MSS
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 border border-white/[0.08]">
                Sin umbral activo (Red libre)
              </span>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          {activeCycle < lossCycle ? (
            <>
              La red opera por debajo de la capacidad pactada de <strong className="text-white">{networkCapacityLimit} segmentos</strong>. Por lo tanto, <strong className="text-amber-300">no existe línea de umbral todavía</strong>: TCP incrementa la ventana de congestión de forma exponencial (<code className="text-cyan-300">cwnd = {currentCycleData.cwndReno} MSS</code>), duplicando los segmentos en cada ciclo tras recibir los acuses sin errores.
            </>
          ) : activeCycle === lossCycle ? (
            <>
              <strong className="text-rose-400">¡Congestión detectada en el Ciclo #{lossCycle}!</strong> La ráfaga alcanzó el límite pactado de <strong className="text-white">{networkCapacityLimit} segmentos</strong>. El segmento #2 se pierde en la red (marcado con <strong className="text-rose-400">✖</strong>). Al recibir los 3 ACKs Duplicados subsiguientes, Host A detecta la congestión y crea en este instante la línea horizontal de umbral: <code className="text-amber-300">ssthresh = {networkCapacityLimit} / 2 = {currentThreshold} MSS</code>.
            </>
          ) : (
            <>
              El umbral se encuentra activo y visible en <strong className="text-amber-300">{currentThreshold} MSS</strong>. En <strong className="text-cyan-300">TCP Reno</strong>, al recibir los 3 ACKs duplicados, se aplica <em>Fast Recovery</em> ajustando <code className="text-cyan-300">cwnd = ssthresh = {currentThreshold} MSS</code> y continuando directamente en Evitación de Congestión (+1 por RTT). En <strong className="text-zinc-300">TCP Tahoe</strong>, la ventana se desploma a 1 MSS y reinicia en Inicio Rápido.
            </>
          )}
        </p>

        {/* Tarjetas comparativas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-1.5 font-mono text-xs">
            <div className="text-zinc-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              Cálculo del Umbral en la Red Escolar:
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
              Cuando el router MikroTik hEX RB750Gr3 o los enlaces WAN saturan sus buffers con {networkCapacityLimit} paquetes en vuelo, TCP deduce la capacidad de cuello de botella y fija el umbral <code className="text-white">ssthresh = {networkCapacityLimit} / 2 = {currentThreshold} MSS</code> para prevenir el colapso congestivo.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-1.5 font-mono text-xs">
            <div className="text-cyan-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Mecanismo de Retransmisión Rápida:
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">
              Los 3 ACKs duplicados con el mismo número de reconocimiento informan a Host A que los segmentos posteriores sí llegaron a Host B. Esto permite retransmitir inmediatamente el segmento faltante sin esperar al vencimiento del temporizador RTO.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
