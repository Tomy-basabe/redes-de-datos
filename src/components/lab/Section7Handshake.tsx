import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Cpu,
  Database,
  Shuffle,
  Layers,
  Sparkles,
  Package
} from 'lucide-react';

type ScenarioMode = 'handshake' | 'rst';
type LabelMode = 'symbolic' | 'numeric';

interface StepInfo {
  id: number;
  shortTitle: string;
  segmentName: string;
  direction: 'c2s' | 's2c';
  clientState: string;
  serverState: string;
  clientBufferAllocated: boolean;
  serverBufferAllocated: boolean;
  flags: {
    URG: 0 | 1;
    ACK: 0 | 1;
    PSH: 0 | 1;
    RST: 0 | 1;
    SYN: 0 | 1;
    FIN: 0 | 1;
  };
  seqFormula: string;
  seqValue: number;
  ackFormula: string;
  ackValue: number | null;
  canCarryPayload: boolean;
  quote?: string;
  summary: string;
}

export const Section7Handshake: React.FC = () => {
  const [mode, setMode] = useState<ScenarioMode>('handshake');
  const [step, setStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [labelMode, setLabelMode] = useState<LabelMode>('symbolic');
  const [includePayloadStep3, setIncludePayloadStep3] = useState<boolean>(true);
  const [clientNsi, setClientNsi] = useState<number>(1000);
  const [serverNsi, setServerNsi] = useState<number>(5000);
  const [packetAnimKey, setPacketAnimKey] = useState<number>(0);

  const handshakeSteps: StepInfo[] = [
    {
      id: 0,
      shortTitle: '1. SYN',
      segmentName: 'Paso 1: Solicitud de conexión (SYN)',
      direction: 'c2s',
      clientState: 'SYN_SENT',
      serverState: 'LISTEN',
      clientBufferAllocated: false,
      serverBufferAllocated: false,
      flags: { URG: 0, ACK: 0, PSH: 0, RST: 0, SYN: 1, FIN: 0 },
      seqFormula: 'cliente_nsi',
      seqValue: clientNsi,
      ackFormula: '—',
      ackValue: null,
      canCarryPayload: false,
      summary:
        'Todo comienza con el cliente enviando un segmento especial al servidor con el bit indicador SYN = 1 y un número de secuencia inicial aleatorio (cliente_nsi). Todavía no transporta datos de aplicación.'
    },
    {
      id: 1,
      shortTitle: '2. SYNACK',
      segmentName: 'Paso 2: Conexión concedida (SYNACK)',
      direction: 's2c',
      clientState: 'SYN_SENT',
      serverState: 'SYN_RCVD',
      clientBufferAllocated: false,
      serverBufferAllocated: true,
      flags: { URG: 0, ACK: 1, PSH: 0, RST: 0, SYN: 1, FIN: 0 },
      seqFormula: 'servidor_nsi',
      seqValue: serverNsi,
      ackFormula: 'cliente_nsi + 1',
      ackValue: clientNsi + 1,
      canCarryPayload: false,
      quote: `«Estoy listo para entablar una conexión, mi número de secuencia es ${serverNsi}»`,
      summary:
        'Al llegar el datagrama, el servidor asigna su buffer y variables TCP. Genera un segmento SYNACK (SYN = 1, ACK = 1) con ack = cliente_nsi + 1 y elige su propio número de secuencia aleatorio (servidor_nsi) para compartirlo al cliente.'
    },
    {
      id: 2,
      shortTitle: '3. ACK',
      segmentName: 'Paso 3: Confirmación final (ACK)',
      direction: 'c2s',
      clientState: 'ESTABLISHED',
      serverState: 'ESTABLISHED',
      clientBufferAllocated: true,
      serverBufferAllocated: true,
      flags: {
        URG: 0,
        ACK: 1,
        PSH: includePayloadStep3 ? 1 : 0,
        RST: 0,
        SYN: 0,
        FIN: 0
      },
      seqFormula: 'cliente_nsi + 1',
      seqValue: clientNsi + 1,
      ackFormula: 'servidor_nsi + 1',
      ackValue: serverNsi + 1,
      canCarryPayload: true,
      summary:
        'Una vez recibido el SYNACK, el cliente asigna su buffer y variables TCP y avisa al servidor que la conexión fue establecida. Este tercer segmento viaja con el bit SYN = 0, confirma ack = servidor_nsi + 1 y ya puede contener carga útil.'
    }
  ];

  const rstSteps: StepInfo[] = [
    {
      id: 0,
      shortTitle: '1. SYN',
      segmentName: 'Paso 1: Intento de conexión a puerto cerrado (SYN)',
      direction: 'c2s',
      clientState: 'SYN_SENT',
      serverState: 'CLOSED (Sin escucha)',
      clientBufferAllocated: false,
      serverBufferAllocated: false,
      flags: { URG: 0, ACK: 0, PSH: 0, RST: 0, SYN: 1, FIN: 0 },
      seqFormula: 'cliente_nsi',
      seqValue: clientNsi,
      ackFormula: '—',
      ackValue: null,
      canCarryPayload: false,
      summary:
        'El host cliente intenta abrir una sesión enviando un segmento con SYN = 1 y sec = cliente_nsi hacia un puerto destino del servidor (ej. TCP 8085) donde no hay ningún servicio escuchando.'
    },
    {
      id: 1,
      shortTitle: '2. RST',
      segmentName: 'Paso 2: Rechazo inmediato con bandera RST',
      direction: 's2c',
      clientState: 'CLOSED (Rechazada)',
      serverState: 'CLOSED (Sin escucha)',
      clientBufferAllocated: false,
      serverBufferAllocated: false,
      flags: { URG: 0, ACK: 1, PSH: 0, RST: 1, SYN: 0, FIN: 0 },
      seqFormula: '0',
      seqValue: 0,
      ackFormula: 'cliente_nsi + 1',
      ackValue: clientNsi + 1,
      canCarryPayload: false,
      quote: '«No se aceptan conexiones en este puerto (RST = 1)»',
      summary:
        'Como el servidor no está "escuchando" en ese puerto determinado, al recibir el SYN no asigna buffers ni variables TCP y responde inmediatamente con un segmento con el bit RST = 1 para rechazar la conexión.'
    }
  ];

  const activeSteps = mode === 'handshake' ? handshakeSteps : rstSteps;
  const current = activeSteps[step] || activeSteps[0];

  // Auto-reproducción de la secuencia
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= activeSteps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, [isPlaying, activeSteps.length]);

  // Reiniciar animación del paquete cada vez que cambia el paso o modo
  useEffect(() => {
    setPacketAnimKey((k) => k + 1);
  }, [step, mode, clientNsi, serverNsi]);

  const handleModeChange = (newMode: ScenarioMode) => {
    setIsPlaying(false);
    setMode(newMode);
    setStep(0);
  };

  const handleRandomizeNsi = () => {
    setClientNsi(Math.floor(1000 + Math.random() * 8000));
    setServerNsi(Math.floor(1000 + Math.random() * 8000));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStep(0);
    setPacketAnimKey((k) => k + 1);
  };

  // Coordenadas geométricas del diagrama Espacio-Tiempo (viewBox 560 x 430)
  const X_CLIENT = 165;
  const X_SERVER = 395;

  // Coordenadas de flechas para Handshake (3 pasos) y RST (2 pasos)
  const arrowCoords =
    mode === 'handshake'
      ? [
          { x1: X_CLIENT, y1: 132, x2: X_SERVER, y2: 204 },
          { x1: X_SERVER, y1: 212, x2: X_CLIENT, y2: 284 },
          { x1: X_CLIENT, y1: 292, x2: X_SERVER, y2: 364 }
        ]
      : [
          { x1: X_CLIENT, y1: 150, x2: X_SERVER, y2: 230 },
          { x1: X_SERVER, y1: 240, x2: X_CLIENT, y2: 320 }
        ];

  const getArrowAngleAndPos = (x1: number, y1: number, x2: number, y2: number, offsetPx = -12) => {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const isLeftToRight = x2 > x1;
    const dx = isLeftToRight ? x2 - x1 : x1 - x2;
    const dy = isLeftToRight ? y2 - y1 : y1 - y2;
    const len = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    // Normal apuntando "arriba" respecto al texto legible de izquierda a derecha
    const nx = dy / len;
    const ny = -dx / len;
    return {
      x: mx + nx * offsetPx * -1, // offset negativo sube en pantalla (y menor)
      y: my + ny * offsetPx * -1,
      angle
    };
  };

  // Helper de etiquetas para flechas (fiel a la imagen ilustrativa + opción numérica)
  const getArrowTextLines = (idx: number): string[] => {
    if (mode === 'handshake') {
      if (idx === 0) {
        return labelMode === 'symbolic'
          ? ['SYN=1, sec=cliente_nsi']
          : [`SYN=1, sec=${clientNsi}`];
      }
      if (idx === 1) {
        return labelMode === 'symbolic'
          ? ['SYN=1, sec=servidor_nsi,', 'ack=cliente_nsi+1']
          : [`SYN=1, sec=${serverNsi},`, `ack=${clientNsi + 1}`];
      }
      return labelMode === 'symbolic'
        ? [
            `SYN=0, sec=cliente_nsi+1,`,
            `ack=servidor_nsi+1${includePayloadStep3 ? ' (+datos)' : ''}`
          ]
        : [
            `SYN=0, sec=${clientNsi + 1},`,
            `ack=${serverNsi + 1}${includePayloadStep3 ? ' (+datos)' : ''}`
          ];
    } else {
      if (idx === 0) {
        return labelMode === 'symbolic'
          ? ['SYN=1, sec=cliente_nsi']
          : [`SYN=1, sec=${clientNsi}`];
      }
      return labelMode === 'symbolic'
        ? ['RST=1, ACK=1,', 'ack=cliente_nsi+1']
        : [`RST=1, ACK=1,`, `ack=${clientNsi + 1}`];
    }
  };

  const activeArrow = arrowCoords[step];

  return (
    <section className="apple-pro-canvas apple-slide-canvas relative p-4 sm:p-5 space-y-4 animate-fadeIn">
      {/* Encabezado Principal Cupertino */}
      <div className="apple-bento flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 sm:p-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Negociación de Sesión L4
            </span>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F5F7] text-[#3A3A3C] border border-black/[0.08]">
              RFC 9293 • 3-Way Handshake &amp; RST
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight">
            Establecimiento de Conexión TCP (Three-Way Handshake)
          </h2>
          <p className="text-[#515154] text-xs sm:text-sm max-w-3xl leading-relaxed">
            Simulación espacio-tiempo entre <strong className="text-[#0071E3]">Host cliente</strong> (VLAN 20 •{' '}
            <code className="text-[#0071E3] font-mono font-semibold bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-200/70">172.16.20.10</code>) y{' '}
            <strong className="text-emerald-700">Host servidor</strong> (VLAN 10 •{' '}
            <code className="text-emerald-700 font-mono font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/70">172.16.10.12</code>). Explora el acuerdo exitoso en 3 fases y el rechazo <code className="text-rose-700 font-mono font-semibold bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/70">RST</code>.
          </p>
        </div>

        {/* Controles de Reproducción y Paso a Paso */}
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
              if (!isPlaying && step === activeSteps.length - 1) {
                setStep(0);
              }
              setIsPlaying((p) => !p);
            }}
            className={`apple-btn px-4 py-2 rounded-xl text-xs ${
              isPlaying
                ? 'apple-btn-amber'
                : mode === 'handshake'
                ? 'apple-btn-emerald'
                : 'apple-btn-rose'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setStep((s) => Math.min(activeSteps.length - 1, s + 1));
            }}
            disabled={step === activeSteps.length - 1}
            className="apple-btn apple-btn-ink px-4 py-2 rounded-xl text-xs"
          >
            <span>
              Siguiente ({step + 1}/{activeSteps.length})
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

      {/* Selector de Escenario (Puerto Abierto vs Puerto Cerrado RST) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="apple-segmented flex-wrap gap-1 self-start">
          <button
            onClick={() => handleModeChange('handshake')}
            className={`apple-btn px-3.5 py-1.5 rounded-[11px] text-xs ${
              mode === 'handshake'
                ? 'apple-segment-active text-emerald-800'
                : 'text-[#515154] hover:text-[#1D1D1F]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Acuerdo de 3 Fases (Puerto :443 Abierto)</span>
          </button>

          <button
            onClick={() => handleModeChange('rst')}
            className={`apple-btn px-3.5 py-1.5 rounded-[11px] text-xs ${
              mode === 'rst'
                ? 'apple-segment-active text-rose-800'
                : 'text-[#515154] hover:text-[#1D1D1F]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>¿Qué pasa si no acepta conexiones? (RST)</span>
          </button>
        </div>

        {/* Selector de Etiquetas & NSI */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="apple-segmented text-xs">
            <button
              onClick={() => setLabelMode('symbolic')}
              className={`apple-btn px-3 py-1 rounded-[10px] ${
                labelMode === 'symbolic' ? 'apple-btn-ink' : 'text-[#515154] hover:text-[#1D1D1F]'
              }`}
            >
              Simbólico (nsi)
            </button>
            <button
              onClick={() => setLabelMode('numeric')}
              className={`apple-btn px-3 py-1 rounded-[10px] ${
                labelMode === 'numeric' ? 'apple-btn-ink' : 'text-[#515154] hover:text-[#1D1D1F]'
              }`}
            >
              Numérico (<span className="font-mono">{clientNsi}/{serverNsi}</span>)
            </button>
          </div>

          <button
            onClick={handleRandomizeNsi}
            className="apple-btn apple-btn-secondary px-3 py-1.5 rounded-xl text-xs"
            title="Generar nuevos números de secuencia iniciales aleatorios"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>Nuevos NSI</span>
          </button>

          {mode === 'handshake' && (
            <button
              onClick={() => setIncludePayloadStep3((v) => !v)}
              className={`apple-btn px-3 py-1.5 rounded-xl text-xs ${
                includePayloadStep3
                  ? 'apple-btn-primary'
                  : 'apple-btn-secondary text-[#3A3A3C]'
              }`}
              title="Mostrar que el 3er segmento (SYN=0) ya puede transportar datos de aplicación"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Carga útil en Paso 3: {includePayloadStep3 ? 'SÍ' : 'NO'}</span>
            </button>
          )}
        </div>
      </div>

      {/* GRID PRINCIPAL: DIAGRAMA ESPACIO-TIEMPO (IZQ) + INSPECTOR DINÁMICO (DER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* =========================================================
            COLUMNA IZQUIERDA (7 cols): DIAGRAMA ESPACIO-TIEMPO INTERACTIVO
           ========================================================= */}
        <div className="lg:col-span-7 apple-bento p-4 sm:p-5 space-y-3.5 relative overflow-hidden">
          {/* Barra superior de pasos clickeables */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {activeSteps.map((s, idx) => {
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
                        ? mode === 'handshake'
                          ? 'apple-btn-emerald border-transparent'
                          : 'apple-btn-rose border-transparent'
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

            <button
              onClick={() => setPacketAnimKey((k) => k + 1)}
              className="apple-btn apple-btn-secondary px-3 py-1 rounded-xl text-xs text-[#0071E3]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Reanimar segmento</span>
            </button>
          </div>

          {/* LIENZO VECTORIAL CLARO + ANIMACIÓN DINÁMICA */}
          <div className="w-full flex justify-center select-none rounded-2xl bg-slate-50/75 border border-slate-200/80 p-2 sm:p-3">
            <svg viewBox="0 0 560 430" className="w-full max-w-[600px] h-auto font-mono">
              <defs>
                {/* Marcadores de flecha */}
                <marker id="hs-arr-dim" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#cbd5e1" />
                </marker>
                <marker id="hs-arr-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
                </marker>
                <marker id="hs-arr-emerald" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
                </marker>
                <marker id="hs-arr-rose" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
                </marker>
                <marker id="hs-arr-time" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
                </marker>

                {/* Sombra suave en lugar de glow oscuro */}
                <filter id="hs-glow" x="-25%" y="-25%" width="150%" height="150%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.16" />
                </filter>
              </defs>

              {/* ================= NODO HOST CLIENTE (Monitor + Teclado) ================= */}
              <g transform={`translate(${X_CLIENT}, 16)`}>
                <text x="0" y="0" fill="#0f172a" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">
                  Host cliente
                </text>
                {/* Monitor estilizado */}
                <rect x="-24" y="10" width="48" height="33" rx="5" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
                <rect x="-19" y="15" width="38" height="23" rx="2.5" fill="#e0f2fe" />
                {/* Brillo en pantalla */}
                <path d="M -16 33 L -4 18 L 8 18 L -4 33 Z" fill="rgba(2,132,199,0.16)" />
                {/* Base + Teclado */}
                <rect x="-6" y="43" width="12" height="6" fill="#94a3b8" />
                <path d="M -22 50 L 22 50 L 27 61 L -27 61 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.2" />
                <line x1="-18" y1="54" x2="18" y2="54" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 2" />
                <line x1="-20" y1="58" x2="20" y2="58" stroke="#64748b" strokeWidth="1.2" strokeDasharray="4 2" />
                {/* IP / Estado pill */}
                <text x="0" y="77" fill="#0071E3" fontSize="10.8" fontWeight="bold" textAnchor="middle">
                  172.16.20.10:53000
                </text>
              </g>

              {/* ================= NODO HOST SERVIDOR (Torre Servidor) ================= */}
              <g transform={`translate(${X_SERVER}, 16)`}>
                <text x="0" y="0" fill="#0f172a" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">
                  Host servidor
                </text>
                {/* Torre servidor */}
                <rect
                  x="-18"
                  y="10"
                  width="36"
                  height="52"
                  rx="4.5"
                  fill="#ffffff"
                  stroke={mode === 'handshake' ? '#059669' : '#e11d48'}
                  strokeWidth="2"
                />
                {/* Bahías / Unidades */}
                <rect x="-12" y="16" width="24" height="6" rx="1.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                <rect x="-12" y="25" width="24" height="6" rx="1.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                <line x1="-12" y1="38" x2="12" y2="38" stroke="#94a3b8" strokeWidth="1.2" />
                <line x1="-12" y1="43" x2="12" y2="43" stroke="#94a3b8" strokeWidth="1.2" />
                {/* LEDs de estado */}
                <circle
                  cx="8"
                  cy="53"
                  r="2.8"
                  fill={mode === 'handshake' ? '#10b981' : '#e11d48'}
                />
                <circle cx="-8" cy="53" r="2.2" fill="#0284c7" opacity="0.8" />
                {/* IP / Puerto */}
                <text
                  x="0"
                  y="77"
                  fill={mode === 'handshake' ? '#047857' : '#be123c'}
                  fontSize="10.8"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {mode === 'handshake' ? '172.16.10.12:443' : '172.16.10.12:8085'}
                </text>
              </g>

              {/* ================= LÍNEAS VERTICALES PUNTEADAS DE TIEMPO ================= */}
              <line
                x1={X_CLIENT}
                y1="98"
                x2={X_CLIENT}
                y2="394"
                stroke="#94a3b8"
                strokeWidth="2.5"
                strokeDasharray="2 6"
                strokeLinecap="round"
                markerEnd="url(#hs-arr-time)"
              />
              <text x={X_CLIENT} y="416" fill="#475569" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">
                Tiempo
              </text>

              <line
                x1={X_SERVER}
                y1="98"
                x2={X_SERVER}
                y2="394"
                stroke="#94a3b8"
                strokeWidth="2.5"
                strokeDasharray="2 6"
                strokeLinecap="round"
                markerEnd="url(#hs-arr-time)"
              />
              <text x={X_SERVER} y="416" fill="#475569" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">
                Tiempo
              </text>

              {/* ================= FLECHAS Y ANOTACIONES DEL DIAGRAMA ================= */}
              {arrowCoords.map((coords, idx) => {
                const isVisible = idx <= step;
                const isCurrent = idx === step;
                const isC2S = coords.x2 > coords.x1;
                const isRstArrow = mode === 'rst' && idx === 1;

                const strokeColor = !isVisible
                  ? '#cbd5e1'
                  : isRstArrow
                  ? '#e11d48'
                  : isC2S
                  ? '#0284c7'
                  : '#059669';

                const markerId = !isVisible
                  ? 'url(#hs-arr-dim)'
                  : isRstArrow
                  ? 'url(#hs-arr-rose)'
                  : isC2S
                  ? 'url(#hs-arr-cyan)'
                  : 'url(#hs-arr-emerald)';

                const textLines = getArrowTextLines(idx);
                const labelTransform = getArrowAngleAndPos(
                  coords.x1,
                  coords.y1,
                  coords.x2,
                  coords.y2,
                  textLines.length > 1 ? -19 : -11
                );

                return (
                  <g
                    key={`${mode}-${idx}`}
                    onClick={() => {
                      setIsPlaying(false);
                      setStep(idx);
                    }}
                    className="cursor-pointer"
                    opacity={isVisible ? 1 : 0.45}
                  >
                    {/* Línea invisible más ancha para facilitar el clic */}
                    <line
                      x1={coords.x1}
                      y1={coords.y1}
                      x2={coords.x2}
                      y2={coords.y2}
                      stroke="transparent"
                      strokeWidth="20"
                    />

                    {/* Flecha diagonal principal */}
                    <motion.line
                      x1={coords.x1}
                      y1={coords.y1}
                      x2={coords.x2}
                      y2={coords.y2}
                      stroke={strokeColor}
                      strokeWidth={isCurrent ? 2.8 : 2}
                      markerEnd={markerId}
                      filter={isCurrent ? 'url(#hs-glow)' : undefined}
                      initial={isCurrent ? { pathLength: 0.15, opacity: 0.4 } : false}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    />

                    {/* Puntos en los ejes de tiempo */}
                    <circle
                      cx={coords.x1}
                      cy={coords.y1}
                      r={isCurrent ? 4.5 : 3.5}
                      fill={strokeColor}
                    />
                    <circle
                      cx={coords.x2}
                      cy={coords.y2}
                      r={isCurrent ? 4.5 : 3.5}
                      fill={strokeColor}
                    />

                    {/* Texto rotado paralelo a la flecha */}
                    <g transform={`translate(${labelTransform.x}, ${labelTransform.y}) rotate(${labelTransform.angle})`}>
                      {textLines.map((line, lineIdx) => (
                        <text
                          key={lineIdx}
                          x="0"
                          y={lineIdx * 13}
                          fill={isVisible ? '#1D1D1F' : '#64748b'}
                          fontSize="11.2"
                          fontWeight={isCurrent ? 'bold' : '600'}
                          textAnchor="middle"
                        >
                          {line}
                        </text>
                      ))}
                    </g>

                    {/* ANOTACIONES LATERALES */}
                    {/* Paso 1: "Solicitud de conexión" a la izquierda */}
                    {idx === 0 && (
                      <g opacity={isVisible ? 1 : 0.45}>
                        <line
                          x1={X_CLIENT - 30}
                          y1={coords.y1}
                          x2={X_CLIENT - 5}
                          y2={coords.y1}
                          stroke={isVisible ? '#0284c7' : '#94a3b8'}
                          strokeWidth="1.5"
                        />
                        <text
                          x={X_CLIENT - 35}
                          y={coords.y1 - 3}
                          fill={isVisible ? '#0f172a' : '#94a3b8'}
                          fontSize="11.5"
                          fontWeight="bold"
                          textAnchor="end"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          Solicitud de
                        </text>
                        <text
                          x={X_CLIENT - 35}
                          y={coords.y1 + 11}
                          fill={isVisible ? '#0f172a' : '#94a3b8'}
                          fontSize="11.5"
                          fontWeight="bold"
                          textAnchor="end"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          conexión
                        </text>
                      </g>
                    )}

                    {/* Paso 2 Handshake: "Conexión concedida" a la derecha + buffer */}
                    {mode === 'handshake' && idx === 1 && (
                      <g opacity={isVisible ? 1 : 0.45}>
                        <line
                          x1={X_SERVER + 5}
                          y1={coords.y1}
                          x2={X_SERVER + 30}
                          y2={coords.y1}
                          stroke={isVisible ? '#059669' : '#94a3b8'}
                          strokeWidth="1.5"
                        />
                        <text
                          x={X_SERVER + 35}
                          y={coords.y1 - 4}
                          fill={isVisible ? '#0f172a' : '#94a3b8'}
                          fontSize="11.5"
                          fontWeight="bold"
                          textAnchor="start"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          Conexión
                        </text>
                        <text
                          x={X_SERVER + 35}
                          y={coords.y1 + 10}
                          fill={isVisible ? '#0f172a' : '#94a3b8'}
                          fontSize="11.5"
                          fontWeight="bold"
                          textAnchor="start"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          concedida
                        </text>
                        {isVisible && (
                          <g transform={`translate(${X_SERVER + 30}, ${coords.y1 + 18})`}>
                            <rect width="120" height="19" rx="6" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="1" />
                            <text x="60" y="13" fill="#047857" fontSize="9.8" fontWeight="bold" textAnchor="middle">
                              +Buffer y vars TCP
                            </text>
                          </g>
                        )}
                      </g>
                    )}

                    {/* Paso 3 Handshake: "ACK" a la izquierda + buffer */}
                    {mode === 'handshake' && idx === 2 && (
                      <g opacity={isVisible ? 1 : 0.45}>
                        <line
                          x1={X_CLIENT - 30}
                          y1={coords.y1}
                          x2={X_CLIENT - 5}
                          y2={coords.y1}
                          stroke={isVisible ? '#0284c7' : '#94a3b8'}
                          strokeWidth="1.5"
                        />
                        <text
                          x={X_CLIENT - 35}
                          y={coords.y1 + 4}
                          fill={isVisible ? '#0f172a' : '#94a3b8'}
                          fontSize="12"
                          fontWeight="bold"
                          textAnchor="end"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          ACK
                        </text>
                        {isVisible && (
                          <g transform={`translate(${X_CLIENT - 150}, ${coords.y1 + 12})`}>
                            <rect width="120" height="19" rx="6" fill="#f0f9ff" stroke="#7dd3fc" strokeWidth="1" />
                            <text x="60" y="13" fill="#0369a1" fontSize="9.8" fontWeight="bold" textAnchor="middle">
                              +Buffer y vars TCP
                            </text>
                          </g>
                        )}
                        {isVisible && (
                          <g transform={`translate(${X_SERVER + 16}, ${coords.y2 - 9})`}>
                            <rect width="112" height="20" rx="6" fill="#d1fae5" stroke="#34d399" strokeWidth="1" />
                            <text x="56" y="13.5" fill="#065f46" fontSize="10" fontWeight="bold" textAnchor="middle">
                              ESTABLISHED ✓
                            </text>
                          </g>
                        )}
                      </g>
                    )}

                    {/* Paso 2 RST: "Puerto sin escucha" a la derecha & "Rechazada" a la izquierda */}
                    {mode === 'rst' && idx === 1 && (
                      <g opacity={isVisible ? 1 : 0.45}>
                        <line
                          x1={X_SERVER + 5}
                          y1={coords.y1}
                          x2={X_SERVER + 30}
                          y2={coords.y1}
                          stroke={isVisible ? '#e11d48' : '#94a3b8'}
                          strokeWidth="1.5"
                        />
                        <text
                          x={X_SERVER + 35}
                          y={coords.y1 - 3}
                          fill={isVisible ? '#be123c' : '#94a3b8'}
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="start"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          No escucha en
                        </text>
                        <text
                          x={X_SERVER + 35}
                          y={coords.y1 + 11}
                          fill={isVisible ? '#be123c' : '#94a3b8'}
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="start"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          puerto :8085
                        </text>

                        {isVisible && (
                          <>
                            <line
                              x1={X_CLIENT - 26}
                              y1={coords.y2}
                              x2={X_CLIENT - 5}
                              y2={coords.y2}
                              stroke="#e11d48"
                              strokeWidth="1.5"
                            />
                            <text
                              x={X_CLIENT - 31}
                              y={coords.y2 - 3}
                              fill="#be123c"
                              fontSize="11"
                              fontWeight="bold"
                              textAnchor="end"
                              fontFamily="Plus Jakarta Sans, sans-serif"
                            >
                              Conexión
                            </text>
                            <text
                              x={X_CLIENT - 31}
                              y={coords.y2 + 11}
                              fill="#be123c"
                              fontSize="11"
                              fontWeight="bold"
                              textAnchor="end"
                              fontFamily="Plus Jakarta Sans, sans-serif"
                            >
                              rechazada
                            </text>
                          </>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}

              {/* ================= PAQUETE ANIMADO VIAJANDO POR LA FLECHA ACTIVA ================= */}
              {activeArrow && (
                <motion.g
                  key={`pkt-${mode}-${step}-${packetAnimKey}`}
                  initial={{ x: activeArrow.x1, y: activeArrow.y1, scale: 0.8, opacity: 0.7 }}
                  animate={{ x: activeArrow.x2, y: activeArrow.y2, scale: 1, opacity: 1 }}
                  transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
                >
                  <rect
                    x="-34"
                    y="-11"
                    width="68"
                    height="22"
                    rx="11"
                    fill={
                      mode === 'rst' && step === 1
                        ? '#e11d48'
                        : activeArrow.x2 > activeArrow.x1
                        ? '#0284c7'
                        : '#059669'
                    }
                    stroke="#ffffff"
                    strokeOpacity="0.9"
                    strokeWidth="1.5"
                    filter="url(#hs-glow)"
                  />
                  <text x="0" y="3.5" fill="#ffffff" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                    {mode === 'handshake'
                      ? step === 0
                        ? 'SYN=1'
                        : step === 1
                        ? 'SYNACK'
                        : includePayloadStep3
                        ? 'ACK+DATA'
                        : 'SYN=0 ACK'
                      : step === 0
                      ? 'SYN=1'
                      : 'RST=1'}
                  </text>
                </motion.g>
              )}
            </svg>
          </div>
        </div>

        {/* =========================================================
            COLUMNA DERECHA (5 cols): ESTADO, BUFFERS, CABECERA & TEORÍA
           ========================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Estado de Hosts + Asignación de Buffers y Variables TCP */}
          <div className="apple-bento p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#0071E3]" />
                Recursos TCP (Buffers y Variables)
              </span>
              <span className="text-[11px] font-mono text-[#515154]">
                NSI Cliente: <strong className="text-[#0071E3]">{clientNsi}</strong> • NSI Serv:{' '}
                <strong className="text-emerald-700">{serverNsi}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              {/* Tarjeta Cliente */}
              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#1D1D1F]">Host cliente</span>
                  <span
                    className={`text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      current.clientState === 'ESTABLISHED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : current.clientState.includes('CLOSED')
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-sky-50 text-[#0071E3] border-sky-200'
                    }`}
                  >
                    {current.clientState}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-black/[0.07]">
                  <span className="text-[#515154]">Buffer &amp; Vars:</span>
                  <span
                    className={
                      current.clientBufferAllocated
                        ? 'text-emerald-700 font-bold'
                        : 'text-[#515154] font-medium'
                    }
                  >
                    {current.clientBufferAllocated ? 'Asignados ✓' : 'Sin asignar'}
                  </span>
                </div>
              </div>

              {/* Tarjeta Servidor */}
              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#1D1D1F]">Host servidor</span>
                  <span
                    className={`text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      current.serverState === 'ESTABLISHED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : current.serverState.includes('CLOSED')
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : current.serverState === 'SYN_RCVD'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-white text-[#3A3A3C] border-black/[0.1]'
                    }`}
                  >
                    {current.serverState}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-black/[0.07]">
                  <span className="text-[#515154]">Buffer &amp; Vars:</span>
                  <span
                    className={
                      current.serverBufferAllocated
                        ? 'text-emerald-700 font-bold'
                        : 'text-[#515154] font-medium'
                    }
                  >
                    {current.serverBufferAllocated ? 'Asignados ✓' : 'Sin asignar'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Inspección del Segmento Actual: Banderas (Bits) + Campos Sec/Ack */}
          <div className="apple-bento p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-600" />
                Cabecera del Segmento Actual
              </span>
              <span className="text-xs font-semibold text-[#1D1D1F] bg-[#F5F5F7] px-2.5 py-0.5 rounded-full border border-black/[0.08]">
                {current.direction === 'c2s' ? 'Cliente ──▶ Servidor' : 'Servidor ──▶ Cliente'}
              </span>
            </div>

            {/* Bits indicadores de la cabecera TCP */}
            <div>
              <span className="text-xs font-medium text-[#515154] block mb-2">
                Bits indicadores (Flags TCP):
              </span>
              <div className="grid grid-cols-6 gap-1.5 font-mono">
                {(['URG', 'ACK', 'PSH', 'RST', 'SYN', 'FIN'] as const).map((flagName) => {
                  const val = current.flags[flagName];
                  const isHighlighted = val === 1;
                  const activeStyle =
                    flagName === 'RST' && isHighlighted
                      ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                      : flagName === 'SYN' && isHighlighted
                      ? 'bg-sky-50 border-sky-400 text-[#0071E3] shadow-xs'
                      : flagName === 'ACK' && isHighlighted
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                      : isHighlighted
                      ? 'bg-amber-50 border-amber-400 text-amber-800'
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
            </div>

            {/* Campos Secuencia, Reconocimiento y Carga Útil */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-[#F5F5F7] border border-black/[0.06]">
                <span className="text-[11px] font-medium text-[#515154] block">N° Secuencia (sec):</span>
                <div className="text-[#1D1D1F] font-mono font-bold mt-0.5">{current.seqFormula}</div>
                <div className="text-xs font-mono text-[#0071E3] font-semibold mt-0.5">Valor: {current.seqValue}</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#F5F5F7] border border-black/[0.06]">
                <span className="text-[11px] font-medium text-[#515154] block">Reconocimiento (ack):</span>
                <div className="text-[#1D1D1F] font-mono font-bold mt-0.5">{current.ackFormula}</div>
                <div className="text-xs font-mono text-emerald-700 font-semibold mt-0.5">
                  {current.ackValue !== null ? `Valor: ${current.ackValue}` : 'No aplica (ACK=0)'}
                </div>
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/[0.06] flex items-center justify-between text-xs">
              <span className="text-[#3A3A3C] font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#515154]" />
                Carga útil (Payload):
              </span>
              {current.canCarryPayload && includePayloadStep3 ? (
                <span className="text-[#0071E3] font-bold">Permitida (SYN=0 • ej. TLS/HTTP)</span>
              ) : (
                <span className="text-[#515154] font-medium">
                  {current.canCarryPayload ? 'Opcional (actualmente vacía)' : 'Sin carga útil (0 bytes)'}
                </span>
              )}
            </div>
          </div>

          {/* 3. Fundamento Conceptual del Paso */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${step}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className={`p-4 sm:p-5 rounded-[24px] border space-y-2.5 shadow-xs ${
                mode === 'rst' && step === 1
                  ? 'bg-rose-50/90 border-rose-200'
                  : 'bg-white/95 border-black/[0.07]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-900">{current.segmentName}</span>
                {mode === 'rst' && step === 1 && <XCircle className="w-4 h-4 text-rose-600" />}
                {mode === 'handshake' && step === 2 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>

              {current.quote && (
                <div
                  className={`px-3 py-2 rounded-xl text-xs font-medium italic border-l-2 ${
                    mode === 'rst'
                      ? 'bg-rose-100/70 border-rose-500 text-rose-900'
                      : 'bg-emerald-50 border-emerald-500 text-emerald-900'
                  }`}
                >
                  {current.quote}
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{current.summary}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
