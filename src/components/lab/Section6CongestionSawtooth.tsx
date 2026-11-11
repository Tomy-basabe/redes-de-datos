import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft,
  AlertTriangle, 
  Layers, 
  Sliders, 
  Activity,
  ArrowRight,
  Laptop,
  Server,
  ShieldCheck,
  CheckCircle2,
  Info,
  Clock
} from 'lucide-react';
import { 
  generateKuroseSimulation, 
  KuroseScenarioConfig, 
  KuroseRttPoint, 
  DEFAULT_KUROSE_CONFIG 
} from '../../logic/kuroseCongestionEngine';
import { tabeSpringPill } from '../../lib/tabeChoreography';

export const Section6CongestionSawtooth: React.FC = () => {
  // Configuración del escenario (Kurose & Ross)
  const [config, setConfig] = useState<KuroseScenarioConfig>(DEFAULT_KUROSE_CONFIG);
  const [activeCycleIdx, setActiveCycleIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeedMs, setPlaySpeedMs] = useState<number>(1400);
  
  // Modos de visualización
  const [displayMode, setDisplayMode] = useState<'both' | 'reno' | 'tahoe'>('both');
  const [viewPreset, setViewPreset] = useState<'kurose_official' | 'advanced'>('kurose_official');

  // Datos generados por el motor
  const [points, setPoints] = useState<KuroseRttPoint[]>(() => generateKuroseSimulation(DEFAULT_KUROSE_CONFIG));

  // Recalcular puntos cuando cambia la configuración
  useEffect(() => {
    const pts = generateKuroseSimulation(config);
    setPoints(pts);
    if (activeCycleIdx >= pts.length) {
      setActiveCycleIdx(0);
    }
  }, [config]);

  // Loop de reproducción automática
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveCycleIdx((prev) => {
        if (prev >= points.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playSpeedMs);
    return () => clearInterval(interval);
  }, [isPlaying, playSpeedMs, points.length]);

  const currentPoint = points[activeCycleIdx] || points[0];

  const handleReset = () => {
    setIsPlaying(false);
    setActiveCycleIdx(0);
  };

  const handleNextCycle = () => {
    if (activeCycleIdx < points.length - 1) {
      setActiveCycleIdx((prev) => prev + 1);
    }
  };

  const handlePrevCycle = () => {
    if (activeCycleIdx > 0) {
      setActiveCycleIdx((prev) => prev - 1);
    }
  };

  const handleSelectPreset = (preset: 'kurose_official' | 'advanced') => {
    setViewPreset(preset);
    if (preset === 'kurose_official') {
      setConfig(DEFAULT_KUROSE_CONFIG);
      setActiveCycleIdx(0);
      setIsPlaying(false);
    }
  };

  // Coordenadas para el SVG del gráfico de Kurose & Ross
  // Eje X: 0 a 15 (16 valores)
  // Eje Y: 0 a 14 (15 valores)
  const svgWidth = 620;
  const svgHeight = 360;
  const paddingLeft = 55;
  const paddingRight = 40;
  const paddingTop = 45;
  const paddingBottom = 45;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const getX = (cycle: number) => paddingLeft + (cycle / 15) * chartW;
  const getY = (cwnd: number) => paddingTop + chartH - (cwnd / 14) * chartH;

  // Construir paths para TCP Tahoe y TCP Reno
  const tahoePath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.cycle)} ${getY(p.cwndTahoe)}`)
    .join(' ');

  // Para Reno, antes de la pérdida coincide con Tahoe; a partir del ciclo 8 se bifurca
  const renoPoints = points.filter((p) => p.cycle >= config.lossCycle);
  const renoPath = renoPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.cycle)} ${getY(p.cwndReno)}`)
    .join(' ');

  // Determinación de la fase actual mostrada arriba del gráfico
  const currentPhaseTitle = currentPoint.phaseReno;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold block">
              Sección 6 • Directriz Pedagógica Kurose & Ross
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
              Capítulo 3: Capa de Transporte • Fig. 3.53
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold apple-headline text-white mt-1">
            Ventana de Congestión TCP (cwnd) & Fenómeno de Sierra
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-3xl">
            Implementación fiel del modelo conceptual de <strong className="text-white">James F. Kurose y Keith W. Ross</strong>: Diagrama espacio-tiempo de RTTs (izquierda) articulado en tiempo real con el gráfico de evolución de ventana <strong className="text-cyan-300">TCP Reno</strong> vs <strong className="text-zinc-300">TCP Tahoe</strong> (derecha).
          </p>
        </div>

        {/* Píldoras de Modo: Escenario Oficial Kurose vs Laboratorio Avanzado */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/[0.08] relative">
          <button
            onClick={() => handleSelectPreset('kurose_official')}
            className={`relative px-3.5 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer select-none tabe-btn-action ${
              viewPreset === 'kurose_official' ? 'text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {viewPreset === 'kurose_official' && (
              <motion.span
                layoutId="sec6-preset-pill"
                transition={tabeSpringPill}
                className="absolute inset-0 rounded-xl bg-amber-500/20 border border-amber-400/40 -z-10 shadow-sm"
              />
            )}
            <span className="relative z-10">Kurose & Ross (Oficial)</span>
          </button>

          <button
            onClick={() => handleSelectPreset('advanced')}
            className={`relative px-3.5 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer select-none tabe-btn-action ${
              viewPreset === 'advanced' ? 'text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {viewPreset === 'advanced' && (
              <motion.span
                layoutId="sec6-preset-pill"
                transition={tabeSpringPill}
                className="absolute inset-0 rounded-xl bg-cyan-500/20 border border-cyan-400/40 -z-10 shadow-sm"
              />
            )}
            <span className="relative z-10">Laboratorio Avanzado</span>
          </button>
        </div>
      </div>

      {/* PANEL PRINCIPAL: DUAL DISPLAY (DIAGRAMA ESPACIO-TIEMPO + GRÁFICO DE SIERRA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: DIAGRAMA ESPACIO-TIEMPO (LADDER DIAGRAM KUROSE) */}
        <div className="lg:col-span-5 p-6 rounded-[32px] apple-glass border border-white/[0.08] flex flex-col justify-between space-y-4 relative overflow-hidden bg-gradient-to-b from-black/80 to-[#07090e]">
          
          {/* Header con Recuadro "siguiente periodo RTT" (Exacto al libro) */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="px-3 py-1 border-2 border-white/60 bg-black/80 rounded font-display text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
              siguiente periodo RTT
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              Ciclo RTT: <strong className="text-amber-400">{currentPoint.cycle}</strong> de 15
            </div>
          </div>

          {/* Cabecera de los dos Extremos (Host A y Host B de la Escuela Los Corralitos) */}
          <div className="flex justify-between items-center px-4 pt-1">
            {/* Host A */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-md">
                <Laptop className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white mt-1.5 font-display">Host A</span>
              <span className="text-[10px] font-mono text-cyan-300">172.16.20.10</span>
              <span className="text-[9px] font-mono text-zinc-500">(Estudiante VLAN 20)</span>
            </div>

            {/* RTT Badge Central */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider font-semibold">
                Canal WAN
              </span>
              <div className="px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] font-mono text-[11px] text-zinc-300 mt-0.5">
                RTT ≈ 50 ms
              </div>
              <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
                MikroTik PCC Multi-Enlace
              </div>
            </div>

            {/* Host B */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-md">
                <Server className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white mt-1.5 font-display">Host B</span>
              <span className="text-[10px] font-mono text-emerald-300">172.16.10.12:443</span>
              <span className="text-[9px] font-mono text-zinc-500">(Nginx Servidor VLAN 10)</span>
            </div>
          </div>

          {/* Lienzo Espacio-Tiempo Vectorial Interactivo */}
          <div className="relative py-4 px-2 flex-1 min-h-[300px] flex flex-col justify-center">
            {/* Dos líneas verticales de tiempo */}
            <div className="absolute top-0 bottom-6 left-12 w-0.5 border-r border-dashed border-white/20" />
            <div className="absolute top-0 bottom-6 right-12 w-0.5 border-r border-dashed border-white/20" />

            {/* Representación de segmentos y ACKs según el ciclo actual */}
            <div className="space-y-4 relative z-10">
              {/* Indicador de cantidad de segmentos en este RTT */}
              <div className="text-center">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-block shadow-sm">
                  {currentPoint.cycle === 1 && 'un segmento (cwnd = 1 MSS)'}
                  {currentPoint.cycle === 2 && 'dos segmentos (cwnd = 2 MSS)'}
                  {currentPoint.cycle === 3 && 'cuatro segmentos (cwnd = 4 MSS)'}
                  {currentPoint.cycle === 4 && 'ocho segmentos (cwnd = 8 MSS = umbral)'}
                  {currentPoint.cycle >= 5 && currentPoint.cycle < config.lossCycle && `${currentPoint.cwndReno} segmentos (Evitación de Congestión)`}
                  {currentPoint.cycle === config.lossCycle && `¡PÉRDIDA DETECTADA! (cwnd = ${currentPoint.cwndReno} MSS)`}
                  {currentPoint.cycle > config.lossCycle && `Recuperación: ${currentPoint.cwndReno} segmentos en Reno`}
                </span>
              </div>

              {/* Animación de flechas de transmisión Host A -> Host B y ACKs */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Bytes en vuelo: <strong className="text-white">{currentPoint.bytesInFlight} B</strong></span>
                  <span>MSS: <strong className="text-cyan-300">1460 B</strong></span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {currentPoint.ladderSegments.slice(0, 6).map((seg) => (
                    <motion.div
                      key={seg.segId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-2 rounded-xl text-[11px] font-mono flex items-center justify-between border ${
                        seg.status === 'lost'
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : seg.status === 'dup_ack'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-white/[0.03] border-white/[0.08] text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Seg #{seg.segId} (Seq {seg.seqNumber})</span>
                      </div>
                      <span className="text-[10px] font-bold">
                        {seg.status === 'lost' && '❌ PERDIDO EN LA RED'}
                        {seg.status === 'dup_ack' && `⚠️ ACK Dup ${seg.ackNumber}`}
                        {seg.status === 'ok' && `✓ ACK Recibido (${seg.ackNumber})`}
                      </span>
                    </motion.div>
                  ))}
                  {currentPoint.ladderSegments.length > 6 && (
                    <div className="text-center text-[10px] font-mono text-zinc-500 pt-1">
                      + {currentPoint.ladderSegments.length - 6} segmentos adicionales transmitidos en paralelo en esta ráfaga...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Etiquetas "Tiempo" en la base de las líneas */}
            <div className="flex justify-between items-center px-8 text-xs font-mono text-zinc-500 pt-4">
              <span>Tiempo ▼</span>
              <span className="text-[10px] text-zinc-600">RTT = Ida y Vuelta</span>
              <span>Tiempo ▼</span>
            </div>
          </div>

          {/* Estado de la Conexión en Host A */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-zinc-400 block text-[10px]">Ventana cwnd (Host A):</span>
              <span className="text-white font-bold">{currentPoint.cwndReno} MSS ({currentPoint.bytesInFlight} B)</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-400 block text-[10px]">Umbral ssthresh:</span>
              <span className="text-amber-400 font-bold">{currentPoint.ssthreshReno} MSS</span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: GRÁFICO OFICIAL EXACTO DE KUROSE & ROSS */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-[32px] apple-glass border border-white/[0.08] flex flex-col justify-between space-y-4 bg-gradient-to-b from-black/80 to-[#07090e]">
          
          {/* Header con la Fase (Exacto a la Captura: "Fase: Inicio rápido") */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-white font-display">
                Fase:{' '}
                <span className={
                  currentPhaseTitle === 'Inicio rápido'
                    ? 'text-amber-400'
                    : currentPhaseTitle === 'Recuperación rápida'
                    ? 'text-cyan-400'
                    : 'text-emerald-400'
                }>
                  {currentPhaseTitle}
                </span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-400">
                {currentPhaseTitle === 'Inicio rápido' ? 'Exponencial (x2 / RTT)' : 'Lineal (+1 / RTT)'}
              </span>
            </div>

            {/* Selector de Curvas: Ambos, Solo Reno, Solo Tahoe */}
            <div className="inline-flex p-1 rounded-xl bg-black/60 border border-white/[0.08] text-xs font-mono">
              <button
                onClick={() => setDisplayMode('both')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  displayMode === 'both' ? 'bg-white/20 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Ambos
              </button>
              <button
                onClick={() => setDisplayMode('reno')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  displayMode === 'reno' ? 'bg-cyan-500/25 text-cyan-300 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                TCP Reno
              </button>
              <button
                onClick={() => setDisplayMode('tahoe')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  displayMode === 'tahoe' ? 'bg-zinc-500/25 text-zinc-200 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                TCP Tahoe
              </button>
            </div>
          </div>

          {/* Gráfico Vectorial SVG de la Curva de Kurose & Ross */}
          <div className="relative w-full overflow-x-auto flex justify-center py-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full max-w-[620px] h-auto select-none font-mono"
            >
              {/* Cuadrícula de fondo */}
              {[0, 2, 4, 6, 8, 10, 12, 14].map((yVal) => (
                <line
                  key={`grid-y-${yVal}`}
                  x1={paddingLeft}
                  y1={getY(yVal)}
                  x2={svgWidth - paddingRight}
                  y2={getY(yVal)}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                />
              ))}

              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((xVal) => (
                <line
                  key={`grid-x-${xVal}`}
                  x1={getX(xVal)}
                  y1={paddingTop}
                  x2={getX(xVal)}
                  y2={svgHeight - paddingBottom}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                />
              ))}

              {/* Ejes principales */}
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={paddingLeft}
                y2={svgHeight - paddingBottom}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1.5"
              />
              <line
                x1={paddingLeft}
                y1={svgHeight - paddingBottom}
                x2={svgWidth - paddingRight}
                y2={svgHeight - paddingBottom}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1.5"
              />

              {/* Título y Etiquetas de los Ejes */}
              <text
                x={-svgHeight / 2}
                y="16"
                transform="rotate(-90)"
                fill="#a1a1aa"
                fontSize="11"
                textAnchor="middle"
                className="font-sans"
              >
                Ventana de congestión (en segmentos)
              </text>

              <text
                x={paddingLeft + chartW / 2}
                y={svgHeight - 10}
                fill="#a1a1aa"
                fontSize="11"
                textAnchor="middle"
                className="font-sans"
              >
                Ciclo de transmisión
              </text>

              {/* Marcas numéricas del eje Y (0, 2, 4, 6, 8, 10, 12, 14) */}
              {[0, 2, 4, 6, 8, 10, 12, 14].map((yVal) => (
                <text
                  key={`label-y-${yVal}`}
                  x={paddingLeft - 8}
                  y={getY(yVal) + 4}
                  fill="#71717a"
                  fontSize="11"
                  textAnchor="end"
                >
                  {yVal}
                </text>
              ))}

              {/* Marcas numéricas del eje X (0 a 15) */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((xVal) => (
                <text
                  key={`label-x-${xVal}`}
                  x={getX(xVal)}
                  y={svgHeight - paddingBottom + 18}
                  fill={xVal === currentPoint.cycle ? '#38bdf8' : '#71717a'}
                  fontWeight={xVal === currentPoint.cycle ? 'bold' : 'normal'}
                  fontSize="10"
                  textAnchor="middle"
                >
                  {xVal}
                </text>
              ))}

              {/* Líneas de Umbral (ssthresh) discontinuas exactas a la figura */}
              {/* Umbral 1: ssthresh = 8 (de ciclo 0 a 8) */}
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

              {/* Umbral 2: ssthresh = 6 (de ciclo 8 a 15) */}
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
                x={getX(13.2)}
                y={getY(6) + 14}
                fill="#e4e4e7"
                fontSize="10"
                fontWeight="bold"
              >
                umbral (6)
              </text>

              {/* CURVA TCP TAHOE (Línea gris claro con círculos) */}
              {(displayMode === 'both' || displayMode === 'tahoe') && (
                <g>
                  <path
                    d={tahoePath}
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map((p) => (
                    <circle
                      key={`tahoe-pt-${p.cycle}`}
                      cx={getX(p.cycle)}
                      cy={getY(p.cwndTahoe)}
                      r="3.5"
                      fill="#e4e4e7"
                      stroke="#4b5563"
                      strokeWidth="1"
                    />
                  ))}
                  {/* Etiqueta "TCP Tahoe" en la curva */}
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

              {/* CURVA TCP RENO (Línea de color contrastante / oscura según la figura, con puntos negros) */}
              {(displayMode === 'both' || displayMode === 'reno') && (
                <g>
                  {/* Rama de Reno a partir del ciclo de pérdida (ciclo 8) */}
                  <path
                    d={renoPath}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {renoPoints.map((p) => (
                    <circle
                      key={`reno-pt-${p.cycle}`}
                      cx={getX(p.cycle)}
                      cy={getY(p.cwndReno)}
                      r="4"
                      fill="#080c14"
                      stroke="#22d3ee"
                      strokeWidth="2"
                    />
                  ))}
                  {/* Etiqueta y flecha apuntando a "TCP Reno" */}
                  <text
                    x={getX(12.5)}
                    y={getY(12.2)}
                    fill="#22d3ee"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    TCP Reno
                  </text>
                  <line
                    x1={getX(12.5)}
                    y1={getY(11.8)}
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
                  x1={getX(currentPoint.cycle)}
                  y1={paddingTop}
                  x2={getX(currentPoint.cycle)}
                  y2={svgHeight - paddingBottom}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={getX(currentPoint.cycle)}
                  cy={getY(currentPoint.cwndReno)}
                  r="7"
                  fill="#38bdf8"
                  className="animate-pulse"
                />
                <circle
                  cx={getX(currentPoint.cycle)}
                  cy={getY(currentPoint.cwndReno)}
                  r="3.5"
                  fill="#07090e"
                />
              </g>
            </svg>
          </div>

          {/* Botonera de Control de Reproducción y Pasos (Estándar T.A.B.E.) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs font-mono flex items-center gap-2 hover:bg-zinc-200 transition-all cursor-pointer shadow-lg tabe-btn-action"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pausar Simulación' : 'Reproducir Flujo RTT'}</span>
              </button>

              <button
                onClick={handlePrevCycle}
                disabled={activeCycleIdx === 0}
                className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 text-white font-mono text-xs flex items-center transition-all cursor-pointer border border-white/[0.08] tabe-btn-action"
                title="Ciclo RTT Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextCycle}
                disabled={activeCycleIdx === points.length - 1}
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

            {/* Selector de Velocidad */}
            <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{(playSpeedMs / 1000).toFixed(1)}s / RTT</span>
              <input
                type="range"
                min="600"
                max="2400"
                step="200"
                value={playSpeedMs}
                onChange={(e) => setPlaySpeedMs(Number(e.target.value))}
                className="w-24 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* EXPLICACIÓN PEDAGÓGICA RIGUROSA DE KUROSE Y ROSS PARA EL CICLO ACTUAL */}
      <div className="p-6 sm:p-8 rounded-[32px] apple-glass border border-white/[0.08] space-y-4 bg-gradient-to-r from-white/[0.02] to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-bold text-white font-display">
              Análisis Técnico del Ciclo {currentPoint.cycle} (Kurose & Ross §3.7)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-400">cwnd Reno:</span>
            <strong className="text-cyan-300 font-bold">{currentPoint.cwndReno} MSS</strong>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">cwnd Tahoe:</span>
            <strong className="text-zinc-200 font-bold">{currentPoint.cwndTahoe} MSS</strong>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          {currentPoint.eventDescription}
        </p>

        {/* Comparativa Conceptual Tahoe vs Reno (Cátedra Tonelli / Cutuli) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-1.5 font-mono text-xs">
            <div className="text-zinc-400 text-[11px] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              Comportamiento TCP Tahoe (Histórico):
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">
              Trata tanto los <strong>3 ACKs duplicados</strong> como el <strong>Timeout</strong> de la misma manera: <strong className="text-white">hunde la ventana a 1 MSS</strong> y reinicia en Slow Start. Esto castiga fuertemente la velocidad de la conexión incluso cuando la red solo perdió un paquete puntual.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-1.5 font-mono text-xs">
            <div className="text-cyan-300 text-[11px] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Comportamiento TCP Reno (Estándar Moderno RFC 5681):
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">
              Al recibir <strong>3 ACKs duplicados</strong>, deduce que los paquetes subsiguientes sí llegaron al receptor. Ejecuta <strong>Fast Retransmit</strong> del paquete faltante y <strong>Fast Recovery</strong>, recortando cwnd a la mitad (<code className="text-cyan-300">ssthresh = cwnd / 2 = 6</code>) sin desplomarse a 1 MSS, continuando directamente en Evitación de Congestión.
            </p>
          </div>
        </div>
      </div>

      {/* MODO LABORATORIO AVANZADO (SI ESTÁ SELECCIONADO) */}
      {viewPreset === 'advanced' && (
        <div className="p-6 sm:p-8 rounded-[32px] apple-glass border border-cyan-500/30 space-y-6">
          <div className="border-b border-white/[0.08] pb-3">
            <h4 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Parámetros Configurables del Algoritmo de Congestión
            </h4>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Experimenta con diferentes valores de umbral inicial y tipos de pérdida para observar cómo reacciona el fenómeno de sierra en los enlaces WAN de la escuela.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
            {/* Umbral Inicial ssthresh */}
            <div className="space-y-2">
              <label className="text-zinc-400 block">Umbral Inicial (ssthresh):</label>
              <select
                value={config.initialSsthresh}
                onChange={(e) => {
                  setConfig({ ...config, initialSsthresh: Number(e.target.value) });
                  setActiveCycleIdx(0);
                }}
                className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value={4} className="bg-slate-900">4 MSS (Red muy congestionada)</option>
                <option value={8} className="bg-slate-900">8 MSS (Estándar Kurose & Ross)</option>
                <option value={12} className="bg-slate-900">12 MSS (Enlace Starlink 150M)</option>
                <option value={16} className="bg-slate-900">16 MSS (Enlace rápido)</option>
              </select>
            </div>

            {/* Ciclo de Pérdida */}
            <div className="space-y-2">
              <label className="text-zinc-400 block">Ciclo RTT de Pérdida:</label>
              <select
                value={config.lossCycle}
                onChange={(e) => {
                  setConfig({ ...config, lossCycle: Number(e.target.value) });
                  setActiveCycleIdx(0);
                }}
                className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value={6} className="bg-slate-900">Ciclo 6 (Pérdida temprana)</option>
                <option value={8} className="bg-slate-900">Ciclo 8 (Estándar Kurose & Ross)</option>
                <option value={10} className="bg-slate-900">Ciclo 10 (Pérdida tardía)</option>
              </select>
            </div>

            {/* Tipo de Pérdida */}
            <div className="space-y-2">
              <label className="text-zinc-400 block">Mecanismo de Pérdida:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfig({ ...config, lossType: '3dup_ack' })}
                  className={`flex-1 p-2 rounded-xl text-xs font-mono transition-all tabe-btn-action cursor-pointer ${
                    config.lossType === '3dup_ack'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
                      : 'bg-black/40 text-zinc-400 border border-white/[0.08]'
                  }`}
                >
                  3 Dup ACKs (Reno)
                </button>
                <button
                  onClick={() => setConfig({ ...config, lossType: 'timeout' })}
                  className={`flex-1 p-2 rounded-xl text-xs font-mono transition-all tabe-btn-action cursor-pointer ${
                    config.lossType === 'timeout'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50 font-bold'
                      : 'bg-black/40 text-zinc-400 border border-white/[0.08]'
                  }`}
                >
                  Timeout RTO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
