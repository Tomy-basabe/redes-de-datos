import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Cpu, 
  Network, 
  Server,
  ArrowRight,
  ArrowLeft,
  Zap,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

export const Slide2MultiplexingAndFlow: React.FC = () => {
  // Estado para la animación de Multiplexación (Columna Izquierda)
  const [muxPhase, setMuxPhase] = useState<'idle' | 'step1' | 'kernel' | 'step2' | 'done'>('idle');
  const [muxShotCount, setMuxShotCount] = useState<number>(0);

  // Estado para la animación de Demultiplexación (Columna Derecha)
  const [demuxPhase, setDemuxPhase] = useState<'idle' | 'step1' | 'kernel' | 'step2' | 'done'>('idle');
  const [demuxShotCount, setDemuxShotCount] = useState<number>(0);

  // Estado de Auto-Play periódico continuo
  const [autoPlay, setAutoPlay] = useState<boolean>(true);

  // Ref para almacenar timeouts activos y limpiarlos correctamente
  const activeTimersRef = useRef<NodeJS.Timeout[]>([]);

  const addTimer = (timer: NodeJS.Timeout) => {
    activeTimersRef.current.push(timer);
  };

  const clearAllTimers = () => {
    activeTimersRef.current.forEach(clearTimeout);
    activeTimersRef.current = [];
  };

  // Secuencia de Multiplexación
  const runMuxSequence = () => {
    setMuxShotCount((prev) => prev + 1);
    setMuxPhase('step1');

    addTimer(setTimeout(() => {
      setMuxPhase('kernel');
    }, 950));

    addTimer(setTimeout(() => {
      setMuxPhase('step2');
    }, 1800));

    addTimer(setTimeout(() => {
      setMuxPhase('done');
    }, 2800));

    addTimer(setTimeout(() => {
      setMuxPhase('idle');
    }, 3800));
  };

  // Secuencia de Demultiplexación
  const runDemuxSequence = () => {
    setDemuxShotCount((prev) => prev + 1);
    setDemuxPhase('step1');

    addTimer(setTimeout(() => {
      setDemuxPhase('kernel');
    }, 950));

    addTimer(setTimeout(() => {
      setDemuxPhase('step2');
    }, 1800));

    addTimer(setTimeout(() => {
      setDemuxPhase('done');
    }, 2800));

    addTimer(setTimeout(() => {
      setDemuxPhase('idle');
    }, 3800));
  };

  // Disparo manual Multiplexación
  const handleShootMux = () => {
    if (muxPhase !== 'idle' && muxPhase !== 'done') return;
    runMuxSequence();
  };

  // Disparo manual Demultiplexación
  const handleShootDemux = () => {
    if (demuxPhase !== 'idle' && demuxPhase !== 'done') return;
    runDemuxSequence();
  };

  // Disparar Ambos al mismo tiempo para comparar manualmente
  const handleShootBoth = () => {
    runMuxSequence();
    runDemuxSequence();
  };

  // Ciclo periódico automático continuo (Multiplexación salida -> Demultiplexación entrada -> Pausa -> Repetir)
  useEffect(() => {
    if (!autoPlay) {
      clearAllTimers();
      return;
    }

    const executeCycle = () => {
      // 1. Inicia Multiplexación (Salida: Sockets -> Kernel -> NIC eth0)
      runMuxSequence();

      // 2. A los 4.2 segundos inicia Demultiplexación (Entrada de respuesta: NIC eth0 -> Kernel -> Sockets)
      addTimer(setTimeout(() => {
        runDemuxSequence();
      }, 4200));
    };

    // Disparo inicial poco después de montar la diapositiva
    const initialTimer = setTimeout(executeCycle, 600);
    activeTimersRef.current.push(initialTimer);

    // Ciclo recurrente cada 9.5 segundos
    const intervalTimer = setInterval(executeCycle, 9500);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      clearAllTimers();
    };
  }, [autoPlay]);

  const isMuxRunning = muxPhase !== 'idle' && muxPhase !== 'done';
  const isDemuxRunning = demuxPhase !== 'idle' && demuxPhase !== 'done';

  return (
    <section className="apple-pro-canvas apple-slide-canvas relative p-4 sm:p-5 space-y-4 animate-fadeIn">
      {/* Encabezado Conciso Cupertino */}
      <div className="apple-bento flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[13px] bg-gradient-to-b from-[#5E5CE6] to-[#4338CA] border border-indigo-700/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_10px_-2px_rgba(79,70,229,0.35)] flex items-center justify-center text-white shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F] tracking-tight leading-tight">
              Multiplexación y Demultiplexación en la Capa de Transporte
            </h2>
            <p className="text-xs sm:text-[13px] text-[#515154] font-medium mt-0.5">
              Concurrencia de aplicaciones sobre una única interfaz física de red • Host:{' '}
              <span className="font-mono font-semibold text-[#1D1D1F]">172.16.50.8</span>
            </p>
          </div>
        </div>

        {/* 5-Tupla compacta y controles de animación */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-xs bg-[#F5F5F7] px-3 py-1.5 rounded-full border border-black/[0.08]">
            <span className="font-sans text-[#515154] font-semibold">5-Tupla:</span>
            <span className="text-indigo-700 font-bold">TCP/UDP</span>
            <span className="text-[#8E8E93]">•</span>
            <span className="text-[#0071E3] font-semibold">172.16.50.8:53100</span>
            <span className="text-[#8E8E93]">→</span>
            <span className="text-emerald-700 font-semibold">172.16.10.12:443</span>
          </div>

          {/* Toggle de Auto-Play Periódico */}
          <button
            onClick={() => setAutoPlay((prev) => !prev)}
            className={`apple-btn px-3 py-1.5 rounded-xl text-xs shrink-0 ${
              autoPlay
                ? 'apple-btn-emerald'
                : 'apple-btn-secondary'
            }`}
            title="Activar o pausar la animación periódica automática"
          >
            {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#515154]" />}
            <span>{autoPlay ? 'Auto: Activo' : 'Auto: Pausado'}</span>
          </button>

          <button
            onClick={handleShootBoth}
            disabled={isMuxRunning || isDemuxRunning}
            className="apple-btn apple-btn-primary px-3.5 py-1.5 rounded-xl text-xs shrink-0"
            title="Simular ambos procesos en simultáneo manualmente"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Simular Ambos</span>
          </button>
        </div>
      </div>

      {/* BLOQUE INTEGRADO: PUERTOS DE 16 BITS Y CLASIFICACIÓN IANA */}
      <div className="apple-bento p-4 sm:p-5 space-y-3.5">
        {/* Subtítulo e Identificación de Procesos en Capa 4 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-black/[0.06] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-gradient-to-b from-[#0A84FF] to-[#0071E3] border border-[#0058B8]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_10px_-2px_rgba(0,113,227,0.3)] flex items-center justify-center text-white shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1D1D1F] tracking-tight leading-tight">
                Puertos, Servicios Centrales y Proxy Inverso
              </h3>
              <p className="text-xs text-[#515154] font-medium mt-0.5">
                Identificación de procesos en Capa 4 • Reglas de acceso Switch C9200 • Escuela 4-025
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold text-[#1D1D1F] bg-[#F5F5F7] px-3.5 py-1.5 rounded-full border border-black/[0.08] inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <span>Capa de Transporte</span>
            <span className="text-[#8E8E93]">•</span>
            <span className="font-mono text-[#0071E3]">16 bits (0–65535)</span>
          </div>
        </div>

        {/* Definición Conceptual Exacta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0071E3] shrink-0"></span>
            <p className="text-[#3A3A3C] text-xs sm:text-[13.5px] leading-snug">
              <strong className="text-[#1D1D1F]">La dirección IP identifica al equipo;</strong> el <strong className="text-[#0071E3]">puerto identifica el servicio o proceso de comunicación</strong> dentro de ese equipo.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#515154] shrink-0">
            <span>Rango de <strong className="text-[#1D1D1F]">16 bits</strong>:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-[#F5F5F7] text-[#1D1D1F] font-mono font-bold border border-black/[0.08]">0 a 65535</span>
          </div>
        </div>

        {/* Las 3 Clasificaciones de Puertos IANA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* 1. Conocidos */}
          <div className="p-3 rounded-2xl bg-[#0071E3]/[0.05] border border-[#0071E3]/20 flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0071E3] shrink-0 mt-1"></span>
            <div>
              <div className="text-[#0058B8] text-[13px] font-bold">Conocidos (0 – 1023)</div>
              <div className="text-xs text-[#3A3A3C] mt-1 leading-relaxed">
                Servicios del sistema y puertos estándar: <span className="font-mono font-semibold text-[#1D1D1F]">HTTP 80, HTTPS 443, SMB 445, DHCP 67/68, DNS 53</span>.
              </div>
            </div>
          </div>

          {/* 2. Registrados */}
          <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1"></span>
            <div>
              <div className="text-amber-900 text-[13px] font-bold">Registrados (1024 – 49151)</div>
              <div className="text-xs text-[#3A3A3C] mt-1 leading-relaxed">
                Servicios y aplicaciones específicas: <span className="font-mono font-semibold text-[#1D1D1F]">Apache interno en puerto TCP 8080</span>.
              </div>
            </div>
          </div>

          {/* 3. Dinámicos o Privados */}
          <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 mt-1"></span>
            <div>
              <div className="text-emerald-900 text-[13px] font-bold">Dinámicos o Privados (49152 – 65535)</div>
              <div className="text-xs text-[#3A3A3C] mt-1 leading-relaxed">
                Asignados por el SO al cliente para sesiones salientes (<span className="font-mono font-semibold text-[#1D1D1F]">efímeros, ej. 53000</span>).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal: Ambos gráficos uno al lado del otro */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* ========================================================= */}
        {/* COLUMNA 1: GRÁFICO DE MULTIPLEXACIÓN (SALIDA)             */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 apple-bento p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div>
            {/* Cabecera del Gráfico 1 */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5 mb-2.5 gap-2">
              <div className="flex items-center gap-2 text-[#0071E3] text-xs sm:text-[13px] font-bold tracking-tight">
                <ArrowRight className="w-4 h-4" />
                <span>1. Multiplexación (Flujo de Salida)</span>
              </div>

              <button
                onClick={handleShootMux}
                disabled={isMuxRunning}
                className="apple-btn apple-btn-primary px-3 py-1.5 rounded-xl text-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isMuxRunning ? 'Transmitiendo...' : 'Disparar Mux'}</span>
              </button>
            </div>

            {/* Subtítulo descriptivo */}
            <div className="text-xs text-[#515154] flex flex-wrap items-center justify-between gap-1 mb-2.5">
              <span className="text-[#0071E3] font-semibold">3 Sockets → Kernel → Canal Único (NIC eth0)</span>
              <span className="font-medium">Salida hacia el cable</span>
            </div>

            {/* Diagrama Visual de Multiplexación */}
            <div className="p-3 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2.5 relative overflow-hidden">
              <div className="grid grid-cols-12 gap-1.5 items-center text-xs py-1">
                
                {/* 3 Sockets de Aplicación */}
                <div className="col-span-4 space-y-1.5">
                  <div className="text-[11px] font-bold text-[#3A3A3C] pb-0.5 flex items-center justify-between">
                    <span>Sockets / Apps</span>
                    <span className="text-[10.5px] font-semibold text-[#515154]">Origen</span>
                  </div>

                  {/* Socket 1: Web */}
                  <div className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-1 relative bg-white ${
                    muxPhase === 'step1'
                      ? 'border-[#0071E3] ring-2 ring-[#0071E3]/25 shadow-xs'
                      : 'border-sky-200'
                  }`}>
                    <span className="text-[11px] text-[#1D1D1F] font-bold truncate">1. Web HTTPS</span>
                    <span className="text-[10.5px] font-mono font-semibold text-[#0071E3] bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-md shrink-0">:53100</span>
                  </div>

                  {/* Socket 2: Samba */}
                  <div className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-1 relative bg-white ${
                    muxPhase === 'step1'
                      ? 'border-amber-500 ring-2 ring-amber-400/25 shadow-xs'
                      : 'border-amber-200'
                  }`}>
                    <span className="text-[11px] text-[#1D1D1F] font-bold truncate">2. Samba SMB</span>
                    <span className="text-[10.5px] font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md shrink-0">:53101</span>
                  </div>

                  {/* Socket 3: DNS */}
                  <div className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-1 relative bg-white ${
                    muxPhase === 'step1'
                      ? 'border-emerald-500 ring-2 ring-emerald-400/25 shadow-xs'
                      : 'border-emerald-200'
                  }`}>
                    <span className="text-[11px] text-[#1D1D1F] font-bold truncate">3. Cisco DNS</span>
                    <span className="text-[10.5px] font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">:53102</span>
                  </div>
                </div>

                {/* Canal 1: Sockets -> Kernel */}
                <div className="col-span-1 flex flex-col justify-around h-full py-1 relative">
                  <div className="h-6 flex items-center justify-center relative">
                    <div className="w-full h-0.5 bg-slate-300"></div>
                    <AnimatePresence>
                      {muxPhase === 'step1' && (
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 10, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: 'linear' }}
                          className="absolute w-3 h-3 rounded-full bg-[#0071E3] shadow-sm ring-2 ring-white"
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="h-6 flex items-center justify-center relative">
                    <div className="w-full h-0.5 bg-slate-300"></div>
                    <AnimatePresence>
                      {muxPhase === 'step1' && (
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 10, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, delay: 0.1, ease: 'linear' }}
                          className="absolute w-3 h-3 rounded-full bg-amber-500 shadow-sm ring-2 ring-white"
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="h-6 flex items-center justify-center relative">
                    <div className="w-full h-0.5 bg-slate-300"></div>
                    <AnimatePresence>
                      {muxPhase === 'step1' && (
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 10, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, delay: 0.2, ease: 'linear' }}
                          className="absolute w-3 h-3 rounded-full bg-emerald-500 shadow-sm ring-2 ring-white"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Kernel (SO) en el Centro */}
                <div className={`col-span-3 p-2.5 rounded-2xl border text-center transition-all relative bg-white ${
                  muxPhase === 'kernel'
                    ? 'border-[#0071E3] ring-2 ring-[#0071E3]/25 shadow-sm bg-sky-50/70'
                    : 'border-black/[0.08]'
                }`}>
                  <div className="flex items-center justify-center gap-1.5">
                    <Cpu className={`w-4 h-4 ${muxPhase === 'kernel' ? 'text-[#0071E3] animate-spin' : 'text-[#0071E3]'}`} />
                    <span className="text-[11.5px] font-bold text-[#1D1D1F]">Kernel (SO)</span>
                  </div>

                  <div className="mt-1.5">
                    <span className={`text-[10.5px] px-2 py-0.5 rounded-md font-bold block ${
                      muxPhase === 'kernel'
                        ? 'bg-[#0071E3] text-white'
                        : 'bg-[#F5F5F7] text-[#3A3A3C] border border-black/[0.06]'
                    }`}>
                      {muxPhase === 'kernel' ? 'Adosa Puertos L4' : 'Multiplexor'}
                    </span>
                  </div>

                  <div className="text-[10.5px] font-medium text-[#515154] mt-1.5 leading-tight">
                    {muxPhase === 'kernel' ? 'Etiqueta :53100…' : 'Transporte L4'}
                  </div>
                </div>

                {/* Canal 2: Kernel -> Canal Único */}
                <div className="col-span-1 flex flex-col items-center justify-center h-full relative">
                  <div className="w-full h-1 bg-slate-300 rounded-full relative overflow-visible flex items-center justify-center">
                    <AnimatePresence>
                      {muxPhase === 'step2' && (
                        <motion.div
                          initial={{ x: -14, opacity: 0, scale: 0.85 }}
                          animate={{ x: 14, opacity: 1, scale: 1.15 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.9, ease: 'easeInOut' }}
                          className="absolute w-3.5 h-3.5 rounded-full bg-[#0071E3] border-2 border-white shadow-md z-20"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="text-[10px] font-semibold text-[#0071E3] mt-1.5 text-center leading-none">
                    Manda →
                  </span>
                </div>

                {/* NIC Física eth0 (Canal Único) */}
                <div className={`col-span-3 p-2.5 rounded-2xl border text-center transition-all relative bg-white ${
                  muxPhase === 'step2'
                    ? 'border-emerald-500 ring-2 ring-emerald-400/25 shadow-sm bg-emerald-50/60'
                    : 'border-black/[0.08]'
                }`}>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-md bg-[#F5F5F7] text-[#3A3A3C] border border-black/[0.06] font-bold block">
                    Canal Único
                  </span>
                  <div className="text-xs font-mono font-bold text-[#1D1D1F] mt-1">NIC eth0</div>
                  <div className="text-[10.5px] font-medium text-[#515154] leading-tight mt-0.5">
                    {muxPhase === 'step2' ? 'Al cable físico' : 'Medio Físico'}
                  </div>
                </div>

              </div>

              {/* Banner dinámico de estado en tiempo real */}
              <div className="p-2.5 rounded-xl bg-white border border-black/[0.07] text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isMuxRunning ? 'bg-[#0071E3] animate-ping' : 'bg-[#0071E3]'}`}></div>
                  <span className="text-[#1D1D1F] font-medium">
                    {muxPhase === 'idle' && (autoPlay ? 'Ciclo automático activo • Transmisión periódica…' : 'Listo. Presiona «Disparar Mux» para iniciar.')}
                    {muxPhase === 'step1' && '1. Sockets envían datos al Kernel…'}
                    {muxPhase === 'kernel' && '2. Kernel adosa puertos TCP/UDP a cada segmento…'}
                    {muxPhase === 'step2' && '3. ¡Kernel manda el paquete multiplexado a la NIC!'}
                    {muxPhase === 'done' && '✓ Multiplexación completada: 3 flujos por 1 NIC.'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {autoPlay && <span className="text-[11px] text-[#0071E3] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 font-semibold">Auto</span>}
                  <span className="text-[11px] font-mono text-[#515154]">Ráfagas: <strong className="text-[#1D1D1F]">{muxShotCount}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Explicación Teórica de la Multiplexación */}
          <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06]">
            <p className="text-[#3A3A3C] text-xs sm:text-[12.5px] leading-relaxed">
              • <strong className="text-[#0071E3]">Multiplexación:</strong> El Kernel reúne los datos generados simultáneamente por múltiples aplicaciones en sus sockets (<code className="text-[#1D1D1F] font-semibold">:53100</code>, <code className="text-[#1D1D1F] font-semibold">:53101</code>, <code className="text-[#1D1D1F] font-semibold">:53102</code>), agrega los encabezados de puerto y los despacha por el <strong className="text-[#1D1D1F]">Canal Único</strong> de la tarjeta (<code className="text-[#1D1D1F] font-semibold">eth0</code>).
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMNA 2: GRÁFICO DE DEMULTIPLEXACIÓN (ENTRADA)          */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 apple-bento p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div>
            {/* Cabecera del Gráfico 2 */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5 mb-2.5 gap-2">
              <div className="flex items-center gap-2 text-emerald-700 text-xs sm:text-[13px] font-bold tracking-tight">
                <ArrowLeft className="w-4 h-4" />
                <span>2. Demultiplexación (Flujo de Entrada)</span>
              </div>

              <button
                onClick={handleShootDemux}
                disabled={isDemuxRunning}
                className="apple-btn apple-btn-emerald px-3 py-1.5 rounded-xl text-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isDemuxRunning ? 'Recibiendo...' : 'Disparar Demux'}</span>
              </button>
            </div>

            {/* Subtítulo descriptivo */}
            <div className="text-xs text-[#515154] flex flex-wrap items-center justify-between gap-1 mb-2.5">
              <span className="text-emerald-700 font-semibold">Canal Único (NIC eth0) → Kernel → Socket Exacto</span>
              <span className="font-medium">Entrada desde el cable</span>
            </div>

            {/* Diagrama Visual de Demultiplexación */}
            <div className="p-3 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2.5 relative overflow-hidden">
              <div className="grid grid-cols-12 gap-1.5 items-center text-xs py-1">
                
                {/* 3 Sockets de Aplicación (Destino) */}
                <div className="col-span-4 space-y-1.5">
                  <div className="text-[11px] font-bold text-[#3A3A3C] pb-0.5 flex items-center justify-between">
                    <span>Sockets / Apps</span>
                    <span className="text-[10.5px] font-semibold text-[#515154]">Destino</span>
                  </div>

                  {/* Socket 1: Web */}
                  <div className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-1 relative bg-white ${
                    demuxPhase === 'step2'
                      ? 'border-emerald-500 ring-2 ring-emerald-400/25 shadow-xs'
                      : 'border-sky-200'
                  }`}>
                    <span className="text-[11px] text-[#1D1D1F] font-bold truncate">1. Web HTTPS</span>
                    <span className="text-[10.5px] font-mono font-semibold text-[#0071E3] bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-md shrink-0">:53100</span>
                  </div>

                  {/* Socket 2: Samba */}
                  <div className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-1 relative bg-white ${
                    demuxPhase === 'step2'
                      ? 'border-emerald-500 ring-2 ring-emerald-400/25 shadow-xs'
                      : 'border-amber-200'
                  }`}>
                    <span className="text-[11px] text-[#1D1D1F] font-bold truncate">2. Samba SMB</span>
                    <span className="text-[10.5px] font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md shrink-0">:53101</span>
                  </div>

                  {/* Socket 3: DNS */}
                  <div className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-1 relative bg-white ${
                    demuxPhase === 'step2'
                      ? 'border-emerald-500 ring-2 ring-emerald-400/25 shadow-xs'
                      : 'border-emerald-200'
                  }`}>
                    <span className="text-[11px] text-[#1D1D1F] font-bold truncate">3. Cisco DNS</span>
                    <span className="text-[10.5px] font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">:53102</span>
                  </div>
                </div>

                {/* Canal 1: Kernel -> Sockets */}
                <div className="col-span-1 flex flex-col justify-around h-full py-1 relative">
                  <div className="h-6 flex items-center justify-center relative">
                    <div className="w-full h-0.5 bg-slate-300"></div>
                    <AnimatePresence>
                      {demuxPhase === 'step2' && (
                        <motion.div
                          initial={{ x: 10, opacity: 0 }}
                          animate={{ x: -10, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: 'linear' }}
                          className="absolute w-3 h-3 rounded-full bg-[#0071E3] shadow-sm ring-2 ring-white"
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="h-6 flex items-center justify-center relative">
                    <div className="w-full h-0.5 bg-slate-300"></div>
                    <AnimatePresence>
                      {demuxPhase === 'step2' && (
                        <motion.div
                          initial={{ x: 10, opacity: 0 }}
                          animate={{ x: -10, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, delay: 0.1, ease: 'linear' }}
                          className="absolute w-3 h-3 rounded-full bg-amber-500 shadow-sm ring-2 ring-white"
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="h-6 flex items-center justify-center relative">
                    <div className="w-full h-0.5 bg-slate-300"></div>
                    <AnimatePresence>
                      {demuxPhase === 'step2' && (
                        <motion.div
                          initial={{ x: 10, opacity: 0 }}
                          animate={{ x: -10, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, delay: 0.2, ease: 'linear' }}
                          className="absolute w-3 h-3 rounded-full bg-emerald-500 shadow-sm ring-2 ring-white"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Kernel (SO) en el Centro */}
                <div className={`col-span-3 p-2.5 rounded-2xl border text-center transition-all relative bg-white ${
                  demuxPhase === 'kernel'
                    ? 'border-emerald-500 ring-2 ring-emerald-400/25 shadow-sm bg-emerald-50/70'
                    : 'border-black/[0.08]'
                }`}>
                  <div className="flex items-center justify-center gap-1.5">
                    <Cpu className={`w-4 h-4 ${demuxPhase === 'kernel' ? 'text-emerald-600 animate-spin' : 'text-emerald-600'}`} />
                    <span className="text-[11.5px] font-bold text-[#1D1D1F]">Kernel (SO)</span>
                  </div>

                  <div className="mt-1.5">
                    <span className={`text-[10.5px] px-2 py-0.5 rounded-md font-bold block ${
                      demuxPhase === 'kernel'
                        ? 'bg-[#189E32] text-white'
                        : 'bg-[#F5F5F7] text-[#3A3A3C] border border-black/[0.06]'
                    }`}>
                      {demuxPhase === 'kernel' ? 'Lee Puerto L4' : 'Demultiplexor'}
                    </span>
                  </div>

                  <div className="text-[10.5px] font-medium text-[#515154] mt-1.5 leading-tight">
                    {demuxPhase === 'kernel' ? 'Enruta a :53100…' : 'Transporte L4'}
                  </div>
                </div>

                {/* Canal 2: Canal Único -> Kernel */}
                <div className="col-span-1 flex flex-col items-center justify-center h-full relative">
                  <div className="w-full h-1 bg-slate-300 rounded-full relative overflow-visible flex items-center justify-center">
                    <AnimatePresence>
                      {demuxPhase === 'step1' && (
                        <motion.div
                          initial={{ x: 14, opacity: 0, scale: 0.85 }}
                          animate={{ x: -14, opacity: 1, scale: 1.15 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.9, ease: 'easeInOut' }}
                          className="absolute w-3.5 h-3.5 rounded-full bg-[#189E32] border-2 border-white shadow-md z-20"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 mt-1.5 text-center leading-none">
                    ← Manda
                  </span>
                </div>

                {/* NIC Física eth0 (Canal Único) */}
                <div className={`col-span-3 p-2.5 rounded-2xl border text-center transition-all relative bg-white ${
                  demuxPhase === 'step1'
                    ? 'border-emerald-500 ring-2 ring-emerald-400/25 shadow-sm bg-emerald-50/60'
                    : 'border-black/[0.08]'
                }`}>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-md bg-[#F5F5F7] text-[#3A3A3C] border border-black/[0.06] font-bold block">
                    Canal Único
                  </span>
                  <div className="text-xs font-mono font-bold text-[#1D1D1F] mt-1">NIC eth0</div>
                  <div className="text-[10.5px] font-medium text-[#515154] leading-tight mt-0.5">
                    {demuxPhase === 'step1' ? 'Recibiendo trama' : 'Medio Físico'}
                  </div>
                </div>

              </div>

              {/* Banner dinámico de estado en tiempo real */}
              <div className="p-2.5 rounded-xl bg-white border border-black/[0.07] text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isDemuxRunning ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'}`}></div>
                  <span className="text-[#1D1D1F] font-medium">
                    {demuxPhase === 'idle' && (autoPlay ? 'Ciclo automático activo • Recepción periódica…' : 'Listo. Presiona «Disparar Demux» para iniciar.')}
                    {demuxPhase === 'step1' && '1. NIC eth0 recibe trama y la entrega al Kernel…'}
                    {demuxPhase === 'kernel' && '2. Kernel lee el puerto de destino en la cabecera…'}
                    {demuxPhase === 'step2' && '3. ¡Kernel entrega el paquete al socket exacto!'}
                    {demuxPhase === 'done' && '✓ Demultiplexación completada: Entregado sin errores.'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {autoPlay && <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">Auto</span>}
                  <span className="text-[11px] font-mono text-[#515154]">Ráfagas: <strong className="text-[#1D1D1F]">{demuxShotCount}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Explicación Teórica de la Demultiplexación */}
          <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06]">
            <p className="text-[#3A3A3C] text-xs sm:text-[12.5px] leading-relaxed">
              • <strong className="text-emerald-700">Demultiplexación:</strong> Al ingresar tramas por el <strong className="text-[#1D1D1F]">Canal Único</strong> (<code className="text-[#1D1D1F] font-semibold">eth0</code>), el Kernel inspecciona el puerto de destino y la 5-Tupla en la cabecera de transporte para dirigir cada segmento al socket exacto de su aplicación.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
