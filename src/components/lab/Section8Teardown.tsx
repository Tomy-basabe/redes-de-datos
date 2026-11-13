import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Database,
  Clock,
  Sparkles,
  ArrowLeftRight,
  Unlock,
  Lock
} from 'lucide-react';

type InitiatorRole = 'client' | 'server';

interface TeardownStepInfo {
  id: number;
  shortTitle: string;
  title: string;
  segmentType: 'FIN' | 'ACK' | 'NONE';
  direction: 'c2s' | 's2c' | 'none';
  clientState: string;
  serverState: string;
  clientBufferStatus: 'allocated' | 'half_closed' | 'waiting' | 'freed';
  serverBufferStatus: 'allocated' | 'half_closed' | 'waiting' | 'freed';
  flags: {
    URG: 0 | 1;
    ACK: 0 | 1;
    PSH: 0 | 1;
    RST: 0 | 1;
    SYN: 0 | 1;
    FIN: 0 | 1;
  };
  summary: string;
  highlightNote?: string;
}

export const Section8Teardown: React.FC = () => {
  const [initiator, setInitiator] = useState<InitiatorRole>('client');
  const [step, setStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showRfcDetails, setShowRfcDetails] = useState<boolean>(false);
  const [packetAnimKey, setPacketAnimKey] = useState<number>(0);

  const isClientInit = initiator === 'client';
  const initiatorLabel = isClientInit ? 'Cliente' : 'Servidor';
  const responderLabel = isClientInit ? 'Servidor' : 'Cliente';

  const steps: TeardownStepInfo[] = [
    {
      id: 0,
      shortTitle: '1. FIN',
      title: `Paso 1: ${initiatorLabel} solicita cerrar (FIN = 1)`,
      segmentType: 'FIN',
      direction: isClientInit ? 'c2s' : 's2c',
      clientState: isClientInit ? 'FIN_WAIT_1' : 'ESTABLISHED',
      serverState: isClientInit ? 'ESTABLISHED' : 'FIN_WAIT_1',
      clientBufferStatus: isClientInit ? 'half_closed' : 'allocated',
      serverBufferStatus: isClientInit ? 'allocated' : 'half_closed',
      flags: { URG: 0, ACK: 1, PSH: 0, RST: 0, SYN: 0, FIN: 1 },
      summary: `Cualquiera de los dos hosts puede terminar la conexión. El ${initiatorLabel.toLowerCase()} ejecuta Cerrar y envía un segmento con el bit indicador FIN = 1, indicando que no transmitirá más datos en su sentido.`,
      highlightNote: 'Cierre de un solo sentido (Half-Close): el otro extremo aún puede enviar datos.'
    },
    {
      id: 1,
      shortTitle: '2. ACK',
      title: `Paso 2: ${responderLabel} confirma recepción (ACK = 1)`,
      segmentType: 'ACK',
      direction: isClientInit ? 's2c' : 'c2s',
      clientState: isClientInit ? 'FIN_WAIT_2' : 'CLOSE_WAIT',
      serverState: isClientInit ? 'CLOSE_WAIT' : 'FIN_WAIT_2',
      clientBufferStatus: isClientInit ? 'half_closed' : 'allocated',
      serverBufferStatus: isClientInit ? 'allocated' : 'half_closed',
      flags: { URG: 0, ACK: 1, PSH: 0, RST: 0, SYN: 0, FIN: 0 },
      summary: `Una vez recibido el FIN, el ${responderLabel.toLowerCase()} confirma la recepción enviando un segmento ACK. Entra en CLOSE_WAIT mientras termina cualquier tarea o transferencia pendiente antes de su propio cierre.`,
      highlightNote: 'La brecha vertical en la línea de tiempo representa el tiempo antes del cierre del segundo host.'
    },
    {
      id: 2,
      shortTitle: '3. FIN',
      title: `Paso 3: ${responderLabel} también cierra su canal (FIN = 1)`,
      segmentType: 'FIN',
      direction: isClientInit ? 's2c' : 'c2s',
      clientState: isClientInit ? 'FIN_WAIT_2' : 'LAST_ACK',
      serverState: isClientInit ? 'LAST_ACK' : 'FIN_WAIT_2',
      clientBufferStatus: isClientInit ? 'half_closed' : 'half_closed',
      serverBufferStatus: isClientInit ? 'half_closed' : 'half_closed',
      flags: { URG: 0, ACK: 1, PSH: 0, RST: 0, SYN: 0, FIN: 1 },
      summary: `Cuando el ${responderLabel.toLowerCase()} termina de enviar sus datos, ejecuta Cerrar y transmite su segmento con el bit FIN = 1 para notificar al ${initiatorLabel.toLowerCase()} que su canal también se cierra.`
    },
    {
      id: 3,
      shortTitle: '4. ACK + Espera',
      title: `Paso 4: ACK final y periodo de Espera (TIME_WAIT)`,
      segmentType: 'ACK',
      direction: isClientInit ? 'c2s' : 's2c',
      clientState: isClientInit ? 'TIME_WAIT (Espera)' : 'CLOSED (Cerrado)',
      serverState: isClientInit ? 'CLOSED (Cerrado)' : 'TIME_WAIT (Espera)',
      clientBufferStatus: isClientInit ? 'waiting' : 'freed',
      serverBufferStatus: isClientInit ? 'freed' : 'waiting',
      flags: { URG: 0, ACK: 1, PSH: 0, RST: 0, SYN: 0, FIN: 0 },
      summary: `El ${initiatorLabel.toLowerCase()} responde con el ACK final e ingresa al estado Espera (TIME_WAIT • 2MSL). Al recibir este ACK, el ${responderLabel.toLowerCase()} pasa inmediatamente a Cerrado y libera sus buffers y variables.`,
      highlightNote: 'El estado Espera garantiza que el último ACK llegue y permite retransmitirlo si el FIN se repite.'
    },
    {
      id: 4,
      shortTitle: '5. Cerrado',
      title: `Paso 5: Conexión cerrada y recursos liberados`,
      segmentType: 'NONE',
      direction: 'none',
      clientState: 'CLOSED (Cerrado)',
      serverState: 'CLOSED (Cerrado)',
      clientBufferStatus: 'freed',
      serverBufferStatus: 'freed',
      flags: { URG: 0, ACK: 0, PSH: 0, RST: 0, SYN: 0, FIN: 0 },
      summary: `Finalizado el temporizador de Espera, el ${initiatorLabel.toLowerCase()} pasa a Cerrado. De esta manera ambos hosts cierran completamente la conexión y liberan todos los buffers y variables TCP para reutilización.`,
      highlightNote: 'Todos los buffers de envío/recepción y estructuras del socket quedan libres para nuevas conexiones.'
    }
  ];

  const current = steps[step] || steps[0];

  // Auto-reproducción
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  useEffect(() => {
    setPacketAnimKey((k) => k + 1);
  }, [step, initiator]);

  const handleInitiatorChange = (role: InitiatorRole) => {
    setIsPlaying(false);
    setInitiator(role);
    setStep(0);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStep(0);
    setPacketAnimKey((k) => k + 1);
  };

  // Coordenadas geométricas del diagrama Espacio-Tiempo (viewBox 560 x 460)
  const X_CLIENT = 165;
  const X_SERVER = 395;

  const xInit = isClientInit ? X_CLIENT : X_SERVER;
  const xResp = isClientInit ? X_SERVER : X_CLIENT;

  const arrowCoords = [
    { x1: xInit, y1: 120, x2: xResp, y2: 172, type: 'FIN' as const },
    { x1: xResp, y1: 172, x2: xInit, y2: 224, type: 'ACK' as const },
    { x1: xResp, y1: 272, x2: xInit, y2: 324, type: 'FIN' as const },
    { x1: xInit, y1: 324, x2: xResp, y2: 376, type: 'ACK' as const }
  ];

  const getArrowAngleAndPos = (x1: number, y1: number, x2: number, y2: number, offsetPx = -12) => {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const isLeftToRight = x2 > x1;
    const dx = isLeftToRight ? x2 - x1 : x1 - x2;
    const dy = isLeftToRight ? y2 - y1 : y1 - y2;
    const len = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const nx = dy / len;
    const ny = -dx / len;
    return {
      x: mx + nx * offsetPx * -1,
      y: my + ny * offsetPx * -1,
      angle
    };
  };

  const activeArrow = step < 4 ? arrowCoords[step] : null;

  const getBufferBadge = (status: TeardownStepInfo['clientBufferStatus']) => {
    switch (status) {
      case 'allocated':
        return { text: 'En uso (100%)', cls: 'text-amber-700 font-semibold', bar: 'w-full bg-amber-500' };
      case 'half_closed':
        return { text: 'Half-Close (TX libre)', cls: 'text-sky-700 font-semibold', bar: 'w-1/2 bg-sky-500' };
      case 'waiting':
        return { text: 'Retenido (Espera 2MSL)', cls: 'text-violet-700 font-semibold', bar: 'w-1/4 bg-violet-500 animate-pulse' };
      case 'freed':
        return { text: 'Liberados ✓', cls: 'text-emerald-700 font-bold', bar: 'w-0 bg-emerald-500' };
    }
  };

  const clientBuf = getBufferBadge(current.clientBufferStatus);
  const serverBuf = getBufferBadge(current.serverBufferStatus);

  return (
    <section className="apple-pro-canvas apple-slide-canvas relative p-4 sm:p-5 space-y-4 animate-fadeIn">
      {/* Encabezado Principal Cupertino */}
      <div className="apple-bento flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 sm:p-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
              Terminación de Sesión L4
            </span>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F5F7] text-[#3A3A3C] border border-black/[0.08]">
              RFC 9293 • Cierre en 4 Pasos (FIN / ACK)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight">
            Finalización de Conexión TCP (Four-Way Teardown)
          </h2>
          <p className="text-[#515154] text-xs sm:text-sm max-w-3xl leading-relaxed">
            Cualquiera de los dos hosts puede terminar una conexión TCP mediante segmentos{' '}
            <code className="text-rose-700 font-mono font-semibold bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/70">FIN</code> y{' '}
            <code className="text-violet-700 font-mono font-semibold bg-violet-50 px-1.5 py-0.5 rounded-md border border-violet-200/70">ACK</code>. Observa el cierre independiente en ambos sentidos, el periodo de <strong className="text-[#1D1D1F]">Espera</strong> y la liberación final de buffers.
          </p>
        </div>

        {/* Controles de Reproducción */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setIsPlaying(false);
              setStep((s) => Math.max(0, s - 1));
            }}
            disabled={step === 0}
            className="apple-btn apple-btn-secondary px-3.5 py-2 rounded-xl text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <button
            onClick={() => {
              if (!isPlaying && step === steps.length - 1) {
                setStep(0);
              }
              setIsPlaying((p) => !p);
            }}
            className={`apple-btn px-4 py-2 rounded-xl text-xs ${
              isPlaying
                ? 'apple-btn-amber'
                : 'apple-btn-rose'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setStep((s) => Math.min(steps.length - 1, s + 1));
            }}
            disabled={step === steps.length - 1}
            className="apple-btn apple-btn-ink px-4 py-2 rounded-xl text-xs"
          >
            <span>
              Siguiente ({step + 1}/{steps.length})
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleReset}
            title="Reiniciar diagrama"
            className="apple-btn apple-btn-secondary p-2 rounded-xl text-[#3A3A3C]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selector: ¿Quién inicia el cierre? + Toggle detalles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="apple-segmented flex-wrap gap-1 self-start">
          <button
            onClick={() => handleInitiatorChange('client')}
            className={`apple-btn px-3.5 py-1.5 rounded-[11px] text-xs ${
              initiator === 'client'
                ? 'apple-segment-active text-rose-800'
                : 'text-[#515154] hover:text-[#1D1D1F]'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-rose-600" />
            <span>Cliente inicia cierre (Diagrama base)</span>
          </button>

          <button
            onClick={() => handleInitiatorChange('server')}
            className={`apple-btn px-3.5 py-1.5 rounded-[11px] text-xs ${
              initiator === 'server'
                ? 'apple-segment-active text-violet-800'
                : 'text-[#515154] hover:text-[#1D1D1F]'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-violet-600" />
            <span>Servidor inicia cierre (Simétrico)</span>
          </button>
        </div>

        <button
          onClick={() => setShowRfcDetails((v) => !v)}
          className={`apple-btn px-3.5 py-1.5 rounded-xl text-xs self-start md:self-auto ${
            showRfcDetails
              ? 'apple-btn-primary'
              : 'apple-btn-secondary text-[#3A3A3C]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Etiquetas en flechas: {showRfcDetails ? 'Bit + Estado RFC' : 'Clásico (FIN / ACK)'}</span>
        </button>
      </div>

      {/* GRID PRINCIPAL: DIAGRAMA ESPACIO-TIEMPO (IZQ) + INSPECTOR DE RECURSOS (DER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* =========================================================
            COLUMNA IZQUIERDA (7 cols): DIAGRAMA ESPACIO-TIEMPO DEL CIERRE
           ========================================================= */}
        <div className="lg:col-span-7 apple-bento p-4 sm:p-5 space-y-3.5 relative overflow-hidden">
          {/* Barra superior de pasos clickeables */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {steps.map((s, idx) => {
                const isActive = idx === step;
                const isDone = idx < step;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setIsPlaying(false);
                      setStep(idx);
                    }}
                    className={`apple-btn px-3 py-1 rounded-xl text-xs border ${
                      isActive
                        ? 'apple-btn-rose border-transparent'
                        : isDone
                        ? 'bg-[#F5F5F7] border-black/[0.12] text-[#1D1D1F]'
                        : 'bg-white border-black/[0.07] text-[#515154] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {s.shortTitle}
                  </button>
                );
              })}
            </div>

            {step < 4 && (
              <button
                onClick={() => setPacketAnimKey((k) => k + 1)}
                className="apple-btn apple-btn-secondary px-3 py-1 rounded-xl text-xs text-rose-700"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>Reanimar segmento</span>
              </button>
            )}
          </div>

          {/* LIENZO VECTORIAL CLARO + CORCHETE ESPERA -> CERRADO */}
          <div className="w-full flex justify-center select-none rounded-2xl bg-slate-50/75 border border-slate-200/80 p-2 sm:p-3">
            <svg viewBox="0 0 560 460" className="w-full max-w-[600px] h-auto font-mono">
              <defs>
                <marker id="td-arr-dim" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#cbd5e1" />
                </marker>
                <marker id="td-arr-rose" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
                </marker>
                <marker id="td-arr-violet" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#7c3aed" />
                </marker>
                <marker id="td-arr-time" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
                </marker>

                <filter id="td-glow" x="-25%" y="-25%" width="150%" height="150%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.16" />
                </filter>
              </defs>

              {/* ================= NODO CLIENTE ================= */}
              <g transform={`translate(${X_CLIENT}, 16)`}>
                <text x="0" y="0" fill="#1d1d1f" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif">
                  Host cliente
                </text>
                <rect x="-24" y="10" width="48" height="33" rx="5" fill="#ffffff" stroke="#0071E3" strokeWidth="2" />
                <rect x="-19" y="15" width="38" height="23" rx="2.5" fill="#e0f2fe" />
                <path d="M -16 33 L -4 18 L 8 18 L -4 33 Z" fill="rgba(0,113,227,0.16)" />
                <rect x="-6" y="43" width="12" height="6" fill="#94a3b8" />
                <path d="M -22 50 L 22 50 L 27 61 L -27 61 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.2" />
                <line x1="-18" y1="54" x2="18" y2="54" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 2" />
                <line x1="-20" y1="58" x2="20" y2="58" stroke="#64748b" strokeWidth="1.2" strokeDasharray="4 2" />
                <text x="0" y="77" fill="#0071E3" fontSize="10.8" fontWeight="bold" textAnchor="middle">
                  172.16.20.10:53000
                </text>
              </g>

              {/* ================= NODO SERVIDOR ================= */}
              <g transform={`translate(${X_SERVER}, 16)`}>
                <text x="0" y="0" fill="#1d1d1f" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif">
                  Host servidor
                </text>
                <rect x="-18" y="10" width="36" height="52" rx="4.5" fill="#ffffff" stroke="#7c3aed" strokeWidth="2" />
                <rect x="-12" y="16" width="24" height="6" rx="1.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                <rect x="-12" y="25" width="24" height="6" rx="1.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                <line x1="-12" y1="38" x2="12" y2="38" stroke="#94a3b8" strokeWidth="1.2" />
                <line x1="-12" y1="43" x2="12" y2="43" stroke="#94a3b8" strokeWidth="1.2" />
                <circle
                  cx="8"
                  cy="53"
                  r="2.8"
                  fill={current.serverState.includes('CLOSED') ? '#10b981' : '#7c3aed'}
                />
                <circle cx="-8" cy="53" r="2.2" fill="#0071E3" opacity="0.8" />
                <text x="0" y="77" fill="#6d28d9" fontSize="10.8" fontWeight="bold" textAnchor="middle">
                  172.16.10.12:443
                </text>
              </g>

              {/* ================= LÍNEAS VERTICALES PUNTEADAS DE TIEMPO ================= */}
              <line
                x1={X_CLIENT}
                y1="98"
                x2={X_CLIENT}
                y2="424"
                stroke="#94a3b8"
                strokeWidth="2.5"
                strokeDasharray="2 6"
                strokeLinecap="round"
                markerEnd="url(#td-arr-time)"
              />
              <text x={X_CLIENT} y="446" fill="#515154" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif">
                Tiempo
              </text>

              <line
                x1={X_SERVER}
                y1="98"
                x2={X_SERVER}
                y2="424"
                stroke="#94a3b8"
                strokeWidth="2.5"
                strokeDasharray="2 6"
                strokeLinecap="round"
                markerEnd="url(#td-arr-time)"
              />
              <text x={X_SERVER} y="446" fill="#515154" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif">
                Tiempo
              </text>

              {/* Indicador sutil en el hueco CLOSE_WAIT del segundo host */}
              <g opacity={step >= 1 ? 1 : 0.35}>
                <line
                  x1={xResp}
                  y1="178"
                  x2={xResp}
                  y2="266"
                  stroke="#7c3aed"
                  strokeWidth="2.5"
                  strokeOpacity="0.45"
                />
                <text
                  x={isClientInit ? xResp + 14 : xResp - 14}
                  y="224"
                  fill="#6d28d9"
                  fontSize="10.5"
                  fontWeight="bold"
                  textAnchor={isClientInit ? 'start' : 'end'}
                  opacity="0.95"
                  fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
                >
                  {showRfcDetails ? 'CLOSE_WAIT (envía resto)' : 'Terminando envíos...'}
                </text>
              </g>

              {/* ================= LAS 4 FLECHAS DEL CIERRE (FIN / ACK / FIN / ACK) ================= */}
              {arrowCoords.map((coords, idx) => {
                const isVisible = idx <= step;
                const isCurrent = idx === step;
                const isFin = coords.type === 'FIN';
                const strokeColor = !isVisible
                  ? '#cbd5e1'
                  : isFin
                  ? '#e11d48'
                  : '#7c3aed';
                const markerId = !isVisible
                  ? 'url(#td-arr-dim)'
                  : isFin
                  ? 'url(#td-arr-rose)'
                  : 'url(#td-arr-violet)';

                const labelTransform = getArrowAngleAndPos(
                  coords.x1,
                  coords.y1,
                  coords.x2,
                  coords.y2,
                  -11
                );

                const arrowLabel = showRfcDetails
                  ? isFin
                    ? 'FIN = 1, ACK = 1'
                    : 'ACK = 1'
                  : coords.type;

                // Lado donde aparece "Cerrar" en paso 0 y paso 2
                const showCerrarOnLeft =
                  (idx === 0 && isClientInit) || (idx === 2 && !isClientInit);
                const showCerrarOnRight =
                  (idx === 0 && !isClientInit) || (idx === 2 && isClientInit);

                return (
                  <g
                    key={`${initiator}-${idx}`}
                    onClick={() => {
                      setIsPlaying(false);
                      setStep(idx);
                    }}
                    className="cursor-pointer"
                    opacity={isVisible ? 1 : 0.45}
                  >
                    <line
                      x1={coords.x1}
                      y1={coords.y1}
                      x2={coords.x2}
                      y2={coords.y2}
                      stroke="transparent"
                      strokeWidth="20"
                    />

                    <motion.line
                      x1={coords.x1}
                      y1={coords.y1}
                      x2={coords.x2}
                      y2={coords.y2}
                      stroke={strokeColor}
                      strokeWidth={isCurrent ? 2.8 : 2}
                      markerEnd={markerId}
                      filter={isCurrent ? 'url(#td-glow)' : undefined}
                      initial={isCurrent ? { pathLength: 0.15, opacity: 0.4 } : false}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    />

                    <circle cx={coords.x1} cy={coords.y1} r={isCurrent ? 4.5 : 3.5} fill={strokeColor} />
                    <circle cx={coords.x2} cy={coords.y2} r={isCurrent ? 4.5 : 3.5} fill={strokeColor} />

                    {/* Etiqueta rotada sobre la flecha */}
                    <g transform={`translate(${labelTransform.x}, ${labelTransform.y}) rotate(${labelTransform.angle})`}>
                      <text
                        x="0"
                        y="0"
                        fill={isVisible ? '#0f172a' : '#94a3b8'}
                        fontSize="11.5"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {arrowLabel}
                      </text>
                    </g>

                    {/* Anotación "Cerrar" a la izquierda */}
                    {showCerrarOnLeft && (
                      <g opacity={isVisible ? 1 : 0.45}>
                        <line
                          x1={X_CLIENT - 28}
                          y1={coords.y1}
                          x2={X_CLIENT - 5}
                          y2={coords.y1}
                          stroke={isVisible ? '#e11d48' : '#94a3b8'}
                          strokeWidth="1.5"
                        />
                        <text
                          x={X_CLIENT - 34}
                          y={coords.y1 + 4}
                          fill={isVisible ? '#0f172a' : '#94a3b8'}
                          fontSize="12"
                          fontWeight="bold"
                          textAnchor="end"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          Cerrar
                        </text>
                      </g>
                    )}

                    {/* Anotación "Cerrar" a la derecha */}
                    {showCerrarOnRight && (
                      <g opacity={isVisible ? 1 : 0.45}>
                        <line
                          x1={X_SERVER + 5}
                          y1={coords.y1}
                          x2={X_SERVER + 28}
                          y2={coords.y1}
                          stroke={isVisible ? '#e11d48' : '#94a3b8'}
                          strokeWidth="1.5"
                        />
                        <text
                          x={X_SERVER + 34}
                          y={coords.y1 + 4}
                          fill={isVisible ? '#0f172a' : '#94a3b8'}
                          fontSize="12"
                          fontWeight="bold"
                          textAnchor="start"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          Cerrar
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* ================= CORCHETE "ESPERA" Y ESTADO "CERRADO" ================= */}
              {(() => {
                const isWaitingActive = step >= 3;
                const isClosedDone = step >= 4;
                const yTop = 324;
                const yMid = 365;
                const yBot = 406;
                const dir = isClientInit ? -1 : 1;
                const xWaitLine = isClientInit ? X_CLIENT : X_SERVER;
                const xOtherLine = isClientInit ? X_SERVER : X_CLIENT;
                const bxInner = xWaitLine + dir * 12;
                const bxOuter = xWaitLine + dir * 26;
                const bxTip = xWaitLine + dir * 40;
                const textX = bxTip + dir * 6;
                const textAnchor = isClientInit ? 'end' : 'start';
                const peerBadgeX = isClientInit ? xOtherLine + 16 : xOtherLine - 112;

                return (
                  <g
                    onClick={() => {
                      setIsPlaying(false);
                      setStep(step === 3 ? 4 : 3);
                    }}
                    className="cursor-pointer"
                    opacity={isWaitingActive ? 1 : 0.35}
                  >
                    {/* Línea de progreso temporal durante Espera */}
                    {isWaitingActive && (
                      <motion.line
                        x1={xWaitLine}
                        y1={yTop}
                        x2={xWaitLine}
                        y2={yBot}
                        stroke={isClosedDone ? '#059669' : '#7c3aed'}
                        strokeWidth="3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: isClosedDone ? 1 : 0.72 }}
                        transition={{ duration: 0.7 }}
                      />
                    )}

                    {/* Corchete [ o ] */}
                    <path
                      d={`M ${bxInner} ${yTop} L ${bxOuter} ${yTop} L ${bxOuter} ${yBot} L ${bxInner} ${yBot} M ${bxOuter} ${yMid} L ${bxTip} ${yMid}`}
                      fill="none"
                      stroke={isClosedDone ? '#059669' : isWaitingActive ? '#334155' : '#94a3b8'}
                      strokeWidth="1.6"
                    />

                    <text
                      x={textX}
                      y={yMid + 4}
                      fill={isWaitingActive ? '#0f172a' : '#94a3b8'}
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor={textAnchor}
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      Espera
                    </text>
                    {showRfcDetails && (
                      <text
                        x={textX}
                        y={yMid + 17}
                        fill="#6d28d9"
                        fontSize="10.5"
                        fontWeight="bold"
                        textAnchor={textAnchor}
                      >
                        (TIME_WAIT)
                      </text>
                    )}

                    {/* Punto, línea guía y texto "Cerrado" al final del corchete */}
                    <circle
                      cx={xWaitLine}
                      cy={yBot}
                      r={isClosedDone ? 4.5 : 3}
                      fill={isClosedDone ? '#059669' : '#94a3b8'}
                    />
                    <text
                      x={textX}
                      y={yBot + 4}
                      fill={isClosedDone ? '#047857' : '#64748b'}
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor={textAnchor}
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      Cerrado
                    </text>

                    {/* Badge de cierre inmediato en el receptor cuando llega el ACK final */}
                    {isWaitingActive && (
                      <g transform={`translate(${peerBadgeX}, 366)`}>
                        <rect
                          width="102"
                          height="20"
                          rx="6"
                          fill="#d1fae5"
                          stroke="#34d399"
                          strokeWidth="1"
                        />
                        <text x="51" y="13.5" fill="#065f46" fontSize="10" fontWeight="bold" textAnchor="middle">
                          Cerrado ✓
                        </text>
                      </g>
                    )}
                  </g>
                );
              })()}

              {/* ================= PAQUETE ANIMADO VIAJANDO POR LA FLECHA ACTIVA ================= */}
              {activeArrow && (
                <motion.g
                  key={`td-pkt-${initiator}-${step}-${packetAnimKey}`}
                  initial={{ x: activeArrow.x1, y: activeArrow.y1, scale: 0.8, opacity: 0.7 }}
                  animate={{ x: activeArrow.x2, y: activeArrow.y2, scale: 1, opacity: 1 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                >
                  <rect
                    x="-28"
                    y="-11"
                    width="56"
                    height="22"
                    rx="11"
                    fill={activeArrow.type === 'FIN' ? '#e11d48' : '#7c3aed'}
                    stroke="#ffffff"
                    strokeOpacity="0.9"
                    strokeWidth="1.5"
                    filter="url(#td-glow)"
                  />
                  <text x="0" y="3.5" fill="#ffffff" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                    {activeArrow.type === 'FIN' ? 'FIN=1' : 'ACK=1'}
                  </text>
                </motion.g>
              )}
            </svg>
          </div>
        </div>

        {/* =========================================================
            COLUMNA DERECHA (5 cols): LIBERACIÓN DE RECURSOS & BANDERAS
           ========================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Estado de Conexión y Liberación de Recursos (Buffers & Variables TCP) */}
          <div className="apple-bento p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-rose-600" />
                Liberación de Recursos (Buffers y Variables)
              </span>
              {step === 4 ? (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Unlock className="w-3 h-3" />
                  100% Libres
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  En cierre
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              {/* Cliente */}
              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#1D1D1F]">Cliente</span>
                  <span
                    className={`text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      current.clientState.includes('CLOSED')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : current.clientState.includes('TIME_WAIT')
                        ? 'bg-violet-50 text-violet-800 border-violet-200'
                        : 'bg-sky-50 text-[#0071E3] border-sky-200'
                    }`}
                  >
                    {current.clientState}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#515154]">Buffers &amp; Vars:</span>
                    <span className={clientBuf.cls}>{clientBuf.text}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-black/[0.08] overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${clientBuf.bar}`} />
                  </div>
                </div>
              </div>

              {/* Servidor */}
              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#1D1D1F]">Servidor</span>
                  <span
                    className={`text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      current.serverState.includes('CLOSED')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : current.serverState.includes('TIME_WAIT')
                        ? 'bg-violet-50 text-violet-800 border-violet-200'
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}
                  >
                    {current.serverState}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#515154]">Buffers &amp; Vars:</span>
                    <span className={serverBuf.cls}>{serverBuf.text}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-black/[0.08] overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${serverBuf.bar}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Bits Indicadores del Segmento */}
          <div className="apple-bento p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-violet-600" />
                Bits Indicadores del Segmento
              </span>
              <span className="text-xs font-semibold text-[#1D1D1F] bg-[#F5F5F7] px-2.5 py-0.5 rounded-full border border-black/[0.08]">
                {current.direction === 'c2s'
                  ? 'Cliente ──▶ Servidor'
                  : current.direction === 's2c'
                  ? 'Servidor ──▶ Cliente'
                  : 'Sin tráfico activo'}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1.5 font-mono">
              {(['URG', 'ACK', 'PSH', 'RST', 'SYN', 'FIN'] as const).map((flagName) => {
                const val = current.flags[flagName];
                const isLit = val === 1;
                const activeStyle =
                  flagName === 'FIN' && isLit
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                    : flagName === 'ACK' && isLit
                    ? 'bg-violet-50 border-violet-400 text-violet-800 shadow-xs'
                    : 'bg-[#F5F5F7] border-black/[0.07] text-[#6E6E73]';

                return (
                  <div
                    key={flagName}
                    className={`p-2 rounded-xl border text-center transition-all ${activeStyle}`}
                  >
                    <div className="text-[11px] font-bold tracking-wider">{flagName}</div>
                    <div className="text-sm font-extrabold mt-0.5">{val}</div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-[#3A3A3C] leading-relaxed">
              {current.segmentType === 'FIN'
                ? 'El bit FIN = 1 indica que el emisor finalizó el envío de datos y libera su mitad del flujo.'
                : current.segmentType === 'ACK'
                ? 'El segmento ACK = 1 confirma la recepción del FIN previo (no cierra por sí solo el otro sentido).'
                : 'Ambos extremos han completado el cierre; no quedan segmentos pendientes ni recursos retenidos.'}
            </p>
          </div>

          {/* 3. Fundamento Técnico del Paso */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${initiator}-${step}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className={`p-4 sm:p-5 rounded-[24px] border space-y-2.5 shadow-xs ${
                step === 4
                  ? 'bg-emerald-50/90 border-emerald-200'
                  : 'bg-white/95 border-black/[0.07]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-slate-900">{current.title}</span>
                {step === 4 && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{current.summary}</p>

              {current.highlightNote && (
                <div className="px-3 py-2 rounded-xl bg-violet-50 border-l-2 border-violet-500 text-xs text-violet-900">
                  {current.highlightNote}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
