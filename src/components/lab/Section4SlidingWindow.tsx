import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  AlertTriangle, 
  ShieldCheck, 
  Sliders, 
  Layers,
  ArrowRight,
  ArrowLeft,
  XCircle,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { 
  createInitialWindowState, 
  transmitWindow, 
  processReception, 
  processAcksAtSender, 
  SlidingWindowState 
} from '../../logic/tcpSlidingWindowEngine';

export const Section4SlidingWindow: React.FC<{ isPresentationMode?: boolean }> = ({ isPresentationMode = false }) => {
  // Parámetros configurables
  const [mss, setMss] = useState<number>(1460);
  const [segmentCount, setSegmentCount] = useState<number>(8);
  const [rwndBytes, setRwndBytes] = useState<number>(4380); // 3 MSS
  const [cwndBytes, setCwndBytes] = useState<number>(4380); // 3 MSS
  
  // Escenario seleccionado
  const [scenario, setScenario] = useState<'normal' | 'loss_segment' | 'loss_ack' | 'corrupt_segment'>('normal');
  const [lossSegmentIdx, setLossSegmentIdx] = useState<number>(1); // Afecta por defecto a Seq 2460

  // Estado del Motor
  const [engineState, setEngineState] = useState<SlidingWindowState>(() => 
    createInitialWindowState(rwndBytes, cwndBytes, segmentCount, mss)
  );

  // Control de Ejecución (Paso a paso)
  // Sub-pasos: 0 = Listo / Espera, 1 = Transmitiendo en vuelo, 2 = Recibido en receptor / ACK generado, 3 = ACKs recibidos en emisor / Ventana desplazada
  const [subStep, setSubStep] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [playSpeedMs, setPlaySpeedMs] = useState<number>(1600);

  // Reiniciar simulador
  const handleReset = () => {
    setIsAutoPlaying(false);
    setSubStep(0);
    setEngineState(createInitialWindowState(rwndBytes, cwndBytes, segmentCount, mss));
  };

  // Avanzar un paso en el ciclo de transporte
  const handleNextStep = () => {
    if (subStep === 0) {
      // Paso 1: Transmitir lo que quepa en la ventana efectiva
      const afterTransmit = transmitWindow(engineState, scenario, lossSegmentIdx);
      setEngineState(afterTransmit);
      setSubStep(1);
    } else if (subStep === 1) {
      // Paso 2: Procesar recepción en el receptor y generar ACKs
      const afterRecv = processReception(engineState, scenario, 0);
      setEngineState(afterRecv);
      setSubStep(2);
    } else if (subStep === 2) {
      // Paso 3: ACKs llegan al emisor y desplazan la ventana
      const afterAcks = processAcksAtSender(engineState);
      setEngineState(afterAcks);
      setSubStep(0);
    }
  };

  // Auto-play loop
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      handleNextStep();
    }, playSpeedMs);
    return () => clearInterval(timer);
  }, [isAutoPlaying, playSpeedMs, subStep, engineState, scenario]);

  const { sendBase, effectiveWindow, rcvNext, rwnd, cwnd } = engineState;
  const sendWindowEnd = sendBase + effectiveWindow;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold block">
            Sección 4 • Laboratorio de Núcleo L4
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold apple-headline text-white mt-1">
            Simulador de Ventanas TCP & Desplazamiento de Búfer
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Demuestra cómo el emisor transmite mientras exista espacio en la ventana efectiva $\min(\text{rwnd}, \text{cwnd})$, el receptor confirma acumulativamente en orden y se recuperan pérdidas mediante ACKs duplicados o timeout.
          </p>
        </div>

        {/* Escenarios Predeterminados */}
        <div className="inline-flex p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono">
          <button
            onClick={() => {
              setScenario('normal');
              handleReset();
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              scenario === 'normal' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Escenario A: Transmisión Normal
          </button>
          <button
            onClick={() => {
              setScenario('loss_segment');
              handleReset();
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              scenario === 'loss_segment' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Escenario B1: Pérdida de Segmento
          </button>
          <button
            onClick={() => {
              setScenario('loss_ack');
              handleReset();
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              scenario === 'loss_ack' ? 'bg-purple-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Escenario B2: Pérdida de ACK
          </button>
          <button
            onClick={() => {
              setScenario('corrupt_segment');
              handleReset();
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              scenario === 'corrupt_segment' ? 'bg-rose-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Escenario C: Segmento Corrupto
          </button>
        </div>
      </div>

      {/* Panel de Métricas de la Ventana Efectiva */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl apple-glass border border-white/[0.06]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Ventana Anunciada (rwnd)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 mt-0.5">{rwnd} B</div>
          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">Espacio libre en búfer receptor</div>
        </div>

        <div className="p-4 rounded-2xl apple-glass border border-white/[0.06]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Ventana de Congestión (cwnd)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-0.5">{cwnd} B</div>
          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">Límite impuesto por la red</div>
        </div>

        <div className="p-4 rounded-2xl apple-glass border border-cyan-400/40 bg-cyan-500/10 shadow-lg shadow-cyan-500/10">
          <span className="text-[10px] font-mono text-cyan-300 uppercase block font-bold">Ventana Efectiva min(rwnd, cwnd)</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-0.5">{effectiveWindow} B</div>
          <div className="text-[11px] text-cyan-300 font-mono mt-0.5">Máximo de bytes en vuelo permitidos</div>
        </div>

        <div className="p-4 rounded-2xl apple-glass border border-white/[0.06]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Base de Envío (sendBase)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5">{sendBase}</div>
          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">Ventana: [{sendBase} .. {sendWindowEnd})</div>
        </div>
      </div>

      {/* Lienzo Visual: Desplazamiento de la Ventana del Emisor */}
      <div className="p-6 sm:p-8 rounded-[32px] apple-glass border border-white/[0.08] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm sm:text-base font-bold text-white font-mono uppercase">
              Búfer del Emisor & Ventana Deslizante
            </h3>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            Rango de la Ventana: <strong className="text-cyan-400">[{sendBase} a {sendWindowEnd} bytes]</strong>
          </div>
        </div>

        {/* Gráfico de los Segmentos con la Ventana Superpuesta */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {engineState.segments.map((seg, idx) => {
              const inWindow = seg.seq >= sendBase && seg.seq < sendWindowEnd;
              const isBase = seg.seq === sendBase;

              let statusColor = 'border-white/[0.08] bg-white/[0.02] text-zinc-400';
              if (seg.status === 'confirmado') {
                statusColor = 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-bold';
              } else if (seg.status === 'en_vuelo') {
                statusColor = 'border-cyan-400 bg-cyan-500/20 text-cyan-200 animate-pulse font-bold';
              } else if (seg.status === 'recibido') {
                statusColor = 'border-blue-400 bg-blue-500/20 text-blue-200 font-bold';
              } else if (seg.status === 'perdido') {
                statusColor = 'border-rose-500 bg-rose-500/25 text-rose-300 font-bold';
              } else if (seg.status === 'corrupto') {
                statusColor = 'border-amber-500 bg-amber-500/25 text-amber-300 font-bold';
              }

              return (
                <div
                  key={seg.seq}
                  className={`p-3 rounded-2xl border text-center transition-all relative ${statusColor} ${
                    inWindow ? 'ring-2 ring-cyan-400/50 shadow-lg' : 'opacity-60'
                  }`}
                >
                  {isBase && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-mono text-[9px] font-black uppercase tracking-wider">
                      sendBase
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-zinc-400">Seg #{idx + 1}</div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">Seq={seg.seq}</div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-1">{seg.length} B</div>
                  <div className="mt-2 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/40">
                    {seg.status}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-2">
            <span>◄ Datos Confirmados y Entregados</span>
            <span className="text-cyan-400 font-bold">◄─── Ventana Activa ({effectiveWindow} Bytes) ───►</span>
            <span>Datos No Enviados Todavía ►</span>
          </div>
        </div>

        {/* Estado del Receptor y Búfer de Recepción */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-mono uppercase font-bold text-emerald-400">
              Búfer de Recepción del Host Destino (172.16.10.12 / 172.16.10.13)
            </span>
            <span className="text-xs font-mono text-zinc-300">
              Siguiente Byte Esperado en Orden: <strong className="text-emerald-300">rcvNext = {rcvNext}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
              <span className="text-zinc-500 block text-[10px]">ACKs Duplicados Acumulados:</span>
              <div className="text-lg font-bold text-amber-400">{engineState.duplicateAckCount}</div>
              <div className="text-[10px] text-zinc-500">Fast Retransmit al llegar a 3</div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
              <span className="text-zinc-500 block text-[10px]">Segmentos Fuera de Orden:</span>
              <div className="text-lg font-bold text-white">{engineState.outOfOrderBuffer.length}</div>
              <div className="text-[10px] text-zinc-500">Guardados en buffer temporal</div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
              <span className="text-zinc-500 block text-[10px]">Espacio Libre de Búfer:</span>
              <div className="text-lg font-bold text-cyan-400">{rwnd} B</div>
              <div className="text-[10px] text-zinc-500">Ventana rwnd anunciada</div>
            </div>
          </div>
        </div>

        {/* Botonera de Control de Simulación */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs font-mono flex items-center gap-2 hover:bg-zinc-200 transition-all cursor-pointer shadow-lg"
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isAutoPlaying ? 'Pausar Simulación' : 'Reproducir Flujo'}</span>
            </button>

            <button
              onClick={handleNextStep}
              disabled={isAutoPlaying}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-40 text-white font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/[0.08]"
            >
              <span>Avanzar Paso</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/[0.06]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
            <span>Velocidad:</span>
            <input
              type="range"
              min="600"
              max="3000"
              step="200"
              value={playSpeedMs}
              onChange={(e) => setPlaySpeedMs(Number(e.target.value))}
              className="w-28 accent-cyan-400 cursor-pointer"
            />
            <span>{(playSpeedMs / 1000).toFixed(1)}s / paso</span>
          </div>
        </div>

        {/* Consola de Registro de Eventos L4 en Vivo */}
        <div className="p-4 rounded-2xl bg-black/70 border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 border-b border-white/[0.04] pb-1.5">
            <span>Registro de Eventos L4 (Transmisión, ACKs y Búfer)</span>
            <span>Últimos {engineState.logMessages.length} eventos</span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 font-mono text-[11px] pr-2 no-scrollbar">
            {engineState.logMessages.slice(-6).map((msg, i) => (
              <div 
                key={i} 
                className={
                  msg.includes('PERDIDO') || msg.includes('CORRUPTO') 
                    ? 'text-rose-400 font-bold' 
                    : msg.includes('DESPLAZA') || msg.includes('Reensamblado')
                    ? 'text-emerald-300 font-bold'
                    : msg.includes('DUPLICADO') || msg.includes('FAST RETRANSMIT')
                    ? 'text-amber-300 font-bold'
                    : 'text-zinc-300'
                }
              >
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
