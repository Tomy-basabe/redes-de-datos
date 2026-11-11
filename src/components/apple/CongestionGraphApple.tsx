import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, AlertTriangle, TrendingUp, Sliders } from 'lucide-react';

export const CongestionGraphApple: React.FC = () => {
  const [cwnd, setCwnd] = useState<number>(1);
  const [ssthresh, setSsthresh] = useState<number>(16);
  const [phase, setPhase] = useState<'Slow Start' | 'Congestion Avoidance' | 'Fast Recovery'>('Slow Start');
  const [history, setHistory] = useState<number[]>([1]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setCwnd((prev) => {
        let next: number;
        if (prev < ssthresh) {
          next = prev * 2;
          setPhase('Slow Start');
        } else {
          next = prev + 1;
          setPhase('Congestion Avoidance');
        }

        if (next > 32) {
          next = 32;
        }

        setHistory((h) => [...h.slice(-15), next]);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, ssthresh]);

  const simulateLoss = () => {
    const newSsthresh = Math.max(2, Math.floor(cwnd / 2));
    setSsthresh(newSsthresh);
    setCwnd(newSsthresh);
    setPhase('Fast Recovery');
    setHistory((h) => [...h.slice(-15), newSsthresh]);
  };

  const resetSim = () => {
    setCwnd(1);
    setSsthresh(16);
    setPhase('Slow Start');
    setHistory([1]);
    setIsRunning(false);
  };

  return (
    <section id="congestion-control" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
          Sección 9 del Informe • Algoritmos de Congestión
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold apple-headline text-white">
          Control de Congestión. Cwnd Dinámica.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg apple-subheadline">
          El Control de Flujo protege al receptor (rwnd), mientras que el Control de Congestión protege a los enlaces WAN y switches intermedios adaptando la ventana de congestión (cwnd).
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-6 py-2 rounded-full bg-white text-black font-semibold text-xs tracking-wide hover:bg-zinc-200 transition-all cursor-pointer shadow-lg shadow-white/10 flex items-center gap-2"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pausar Algoritmo' : 'Iniciar Simulación RTT'}</span>
          </button>

          <button
            onClick={simulateLoss}
            className="px-5 py-2 rounded-full text-xs font-mono font-semibold bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer flex items-center gap-2"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simular Congestión de Enlace (3 Dup ACKs)</span>
          </button>

          <button
            onClick={resetSim}
            className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-zinc-400 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gráfico y Métricas de la Ventana Cwnd */}
      <div className="p-8 sm:p-12 rounded-[36px] apple-glass border border-white/[0.08] space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Ventana de Congestión (cwnd)</span>
            <div className="text-4xl font-bold font-mono text-cyan-400 mt-1">{cwnd} MSS</div>
            <div className="text-xs text-zinc-400 font-mono mt-1">~{cwnd * 1460} Bytes en Tránsito</div>
          </div>

          <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Umbral de Cambio (ssthresh)</span>
            <div className="text-4xl font-bold font-mono text-amber-400 mt-1">{ssthresh} MSS</div>
            <div className="text-xs text-zinc-400 font-mono mt-1">Conmutador a Crecimiento Lineal</div>
          </div>

          <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Fase del Algoritmo</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">{phase}</div>
            <div className="text-xs text-zinc-400 font-mono mt-1">
              {phase === 'Slow Start' && 'Crecimiento Exponencial (x2 / RTT)'}
              {phase === 'Congestion Avoidance' && 'Crecimiento Moderado (+1 / RTT)'}
              {phase === 'Fast Recovery' && 'Recuperación Rápida Sin Caer a 1'}
            </div>
          </div>
        </div>

        {/* Representación Visual de la Curva de Congestión */}
        <div className="p-6 rounded-[28px] bg-black/60 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Evolución Histórica de Cwnd por Cada RTT (Round Trip Time)</span>
            <span className="text-cyan-400 font-bold">{history.length} RTTs Registrados</span>
          </div>

          <div className="h-44 flex items-end gap-2 pt-4 px-2 border-b border-white/[0.08]">
            {history.map((val, idx) => {
              const heightPct = (val / 32) * 100;
              const isOverThreshold = val >= ssthresh;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[9px] font-mono text-zinc-500">{val}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-lg transition-all ${
                      isOverThreshold ? 'bg-amber-400 shadow-md shadow-amber-500/20' : 'bg-cyan-400 shadow-md shadow-cyan-500/20'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] font-mono text-zinc-500 pt-2">
            <span>◄ Inicio de Conexión (1 MSS)</span>
            <span>Límite de Seguridad del Enlace (32 MSS) ►</span>
          </div>
        </div>
      </div>
    </section>
  );
};
