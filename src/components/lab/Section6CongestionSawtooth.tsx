import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  AlertTriangle, 
  TrendingUp, 
  Sliders, 
  Activity,
  Zap
} from 'lucide-react';
import { 
  generateCongestionSawtooth, 
  CongestionDataPoint, 
  CongestionSimulationConfig 
} from '../../logic/congestionEngine';

export const Section6CongestionSawtooth: React.FC = () => {
  const [initialSsthresh, setInitialSsthresh] = useState<number>(16);
  const [mssBytes, setMssBytes] = useState<number>(1460);
  
  // Lista de eventos de pérdida preconfigurados o agregados interactivamente
  const [lossEvents, setLossEvents] = useState<Array<{ rtt: number; type: '3dup_ack' | 'timeout' }>>([
    { rtt: 6, type: '3dup_ack' },
    { rtt: 13, type: 'timeout' },
    { rtt: 19, type: '3dup_ack' }
  ]);

  // Puntos generados por el algoritmo matemático
  const [points, setPoints] = useState<CongestionDataPoint[]>([]);
  const [activeRttIdx, setActiveRttIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(1200);

  const totalRtts = 24;

  const recompute = () => {
    const config: CongestionSimulationConfig = {
      mss: mssBytes,
      initialCwnd: 1,
      initialSsthresh,
      totalRtts,
      lossEvents
    };
    const pts = generateCongestionSawtooth(config);
    setPoints(pts);
    setActiveRttIdx(0);
  };

  useEffect(() => {
    recompute();
  }, [initialSsthresh, mssBytes, lossEvents]);

  // Loop de reproducción
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveRttIdx((prev) => {
        if (prev >= points.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs);
    return () => clearInterval(timer);
  }, [isPlaying, speedMs, points.length]);

  const currentPoint = points[activeRttIdx] || points[0] || {
    rtt: 1,
    cwnd: 1,
    ssthresh: 16,
    phase: 'Slow Start',
    description: 'Iniciando simulación'
  };

  const injectLossAtCurrent = (type: '3dup_ack' | 'timeout') => {
    const currentRtt = currentPoint.rtt;
    const updated = lossEvents.filter((e) => e.rtt !== currentRtt);
    updated.push({ rtt: currentRtt, type });
    setLossEvents(updated);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold block">
            Sección 6 • Algoritmos de Congestión en WAN
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold apple-headline text-white mt-1">
            Ventana de Congestión TCP (cwnd) & Fenómeno de Sierra
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Demuestra el comportamiento clásico de TCP Reno: crecimiento exponencial en Slow Start, lineal en Congestion Avoidance, y la diferencia crítica entre una pérdida recuperada por 3 ACKs duplicados frente al colapso por Timeout.
          </p>
        </div>

        {/* Acciones de Inyección de Pérdida con Micro-interacción T.A.B.E. */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => injectLossAtCurrent('3dup_ack')}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 tabe-btn-action"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pérdida por 3 Dup ACKs (Fast Retransmit)</span>
          </button>

          <button
            onClick={() => injectLossAtCurrent('timeout')}
            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 tabe-btn-action"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pérdida por Timeout (RTO)</span>
          </button>
        </div>
      </div>

      {/* Métricas del RTT Activo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl apple-glass border border-white/[0.06]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Punto Temporal (RTT)</span>
          <div className="text-2xl font-bold font-mono text-white mt-0.5">RTT #{currentPoint.rtt}</div>
          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">Paso {activeRttIdx + 1} de {points.length}</div>
        </div>

        <div className="p-4 rounded-2xl apple-glass border border-cyan-400/40 bg-cyan-500/10">
          <span className="text-[10px] font-mono text-cyan-300 uppercase block font-bold">Ventana de Congestión (cwnd)</span>
          <div className="text-2xl font-black font-mono text-cyan-400 mt-0.5">{currentPoint.cwnd} MSS</div>
          <div className="text-[11px] text-cyan-300 font-mono mt-0.5">~{currentPoint.cwnd * mssBytes} Bytes en Vuelo</div>
        </div>

        <div className="p-4 rounded-2xl apple-glass border border-white/[0.06]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Umbral de Cambio (ssthresh)</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">{currentPoint.ssthresh} MSS</div>
          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">Conmutador a Congestion Avoidance</div>
        </div>

        <div className="p-4 rounded-2xl apple-glass border border-white/[0.06]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Fase del Algoritmo</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{currentPoint.phase}</div>
          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
            {currentPoint.event || 'Transmisión normal'}
          </div>
        </div>
      </div>

      {/* Gráfico Dinámico SVG de la Curva en Diente de Sierra */}
      <div className="p-6 sm:p-8 rounded-[32px] apple-glass border border-white/[0.08] space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white uppercase">Curva de Evolución de cwnd (Patrón Diente de Sierra)</span>
          </div>
          <span>Eje Y: cwnd [MSS] • Eje X: Tiempo [RTT]</span>
        </div>

        {/* Canvas / SVG Interactivo del Gráfico */}
        <div className="relative h-64 w-full bg-black/60 rounded-2xl border border-white/[0.04] p-4 flex flex-col justify-end">
          {/* Línea horizontal punteada del umbral ssthresh actual */}
          <div 
            className="absolute left-0 right-0 border-b border-dashed border-amber-400/60 z-10 transition-all duration-300"
            style={{ bottom: `${(currentPoint.ssthresh / 32) * 100}%` }}
          >
            <span className="absolute right-4 -top-4 text-[10px] font-mono text-amber-300 bg-black/80 px-2 py-0.5 rounded border border-amber-500/30">
              ssthresh = {currentPoint.ssthresh} MSS
            </span>
          </div>

          {/* Barras dinámicas de cada RTT */}
          <div className="h-full flex items-end gap-1.5 sm:gap-2">
            {points.map((pt, idx) => {
              const heightPct = Math.min(100, (pt.cwnd / 32) * 100);
              const isCurrent = idx === activeRttIdx;
              const isPast = idx <= activeRttIdx;

              let barColor = 'bg-zinc-800 opacity-40';
              if (isPast) {
                if (pt.event === 'Loss 3 Dup ACKs') {
                  barColor = 'bg-amber-400 shadow-md shadow-amber-500/30';
                } else if (pt.event === 'Timeout RTO') {
                  barColor = 'bg-rose-500 shadow-md shadow-rose-500/30';
                } else if (pt.cwnd < pt.ssthresh) {
                  barColor = 'bg-cyan-400 shadow-md shadow-cyan-500/20'; // Slow Start
                } else {
                  barColor = 'bg-emerald-400 shadow-md shadow-emerald-500/20'; // Congestion Avoidance
                }
              }

              return (
                <div
                  key={pt.rtt}
                  onClick={() => setActiveRttIdx(idx)}
                  className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
                >
                  {isCurrent && (
                    <span className="text-[10px] font-mono font-bold text-white mb-1">
                      {pt.cwnd}
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${barColor} ${
                      isCurrent ? 'ring-2 ring-white scale-105' : ''
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] font-mono text-zinc-500 mt-1.5">
                    {pt.rtt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controles de Reproducción y Avance por RTT con Micro-interacción T.A.B.E. */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs font-mono flex items-center gap-2 hover:bg-zinc-200 transition-all cursor-pointer shadow-lg tabe-btn-action"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pausar Simulación' : 'Reproducir Sierra'}</span>
            </button>

            <button
              onClick={() => setActiveRttIdx((prev) => Math.min(points.length - 1, prev + 1))}
              disabled={isPlaying || activeRttIdx >= points.length - 1}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-40 text-white font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/[0.08] tabe-btn-action"
            >
              <span>Avanzar 1 RTT</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setActiveRttIdx(0);
                setIsPlaying(false);
              }}
              className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/[0.06] tabe-btn-action"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs font-mono text-zinc-400">
            Fase Actual: <strong className="text-cyan-400">{currentPoint.phase}</strong>
          </div>
        </div>

        {/* Explicación Técnica Detallada del Evento en este RTT */}
        <div className="p-4 rounded-2xl bg-black/70 border border-white/[0.06] text-xs font-mono text-zinc-300 space-y-1">
          <span className="text-zinc-500 block uppercase text-[10px]">Diagnóstico Técnico del Algoritmo en este RTT:</span>
          <p className="text-sm font-sans text-white leading-relaxed">{currentPoint.description}</p>
        </div>
      </div>
    </div>
  );
};
