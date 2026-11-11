import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, Zap, Laptop, Server } from 'lucide-react';

export const HandshakeTimelineApple: React.FC = () => {
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mode, setMode] = useState<'handshake' | 'samba_loss'>('handshake');
  const [sambaLost, setSambaLost] = useState<boolean>(false);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return prev + 1;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Determine handshake step from progress (0-100)
  const currentStep = progress < 33 ? 0 : progress < 66 ? 1 : progress < 99 ? 2 : 3;

  return (
    <section id="handshake-motion" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
      {/* Encabezado */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
          Sincronización L4 • Sección 7 y 8
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold apple-headline text-white">
          The Three-Way Handshake.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg apple-subheadline">
          Desliza la línea de tiempo o presiona Reproducir para observar la negociación en 3 etapas que sincroniza los sockets de los alumnos con los servidores centrales.
        </p>

        <div className="inline-flex p-1 rounded-full bg-white/[0.05] border border-white/[0.08] mt-2">
          <button
            onClick={() => {
              setMode('handshake');
              setProgress(0);
            }}
            className={`px-5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
              mode === 'handshake' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            1. Negociación 3-Way Handshake
          </button>
          <button
            onClick={() => {
              setMode('samba_loss');
              setSambaLost(false);
            }}
            className={`px-5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
              mode === 'samba_loss' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            2. Samba Confiabilidad & Pérdida
          </button>
        </div>
      </div>

      {mode === 'handshake' ? (
        /* VISTA INTERACTIVA DEL HANDSHAKE CON TIMELINE */
        <div className="p-8 sm:p-12 rounded-[36px] apple-glass border border-white/[0.08] space-y-10 relative overflow-hidden">
          {/* LEDs de Estado de los Dos Extremos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Laptop className="w-8 h-8 text-cyan-400" />
                <div>
                  <div className="text-xs text-zinc-500 font-mono">CLIENTE VLAN 20</div>
                  <div className="text-base font-bold text-white">172.16.20.10:53000</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Estado Socket:</span>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                  currentStep === 0
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : currentStep >= 2
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/[0.05] text-zinc-400'
                }`}>
                  {currentStep === 0 ? 'SYN_SENT' : currentStep >= 2 ? 'ESTABLISHED' : 'CONNECTING'}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="w-8 h-8 text-emerald-400" />
                <div>
                  <div className="text-xs text-zinc-500 font-mono">SERVIDOR NGINX VLAN 10</div>
                  <div className="text-base font-bold text-white">172.16.10.12:443</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Estado Socket:</span>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                  currentStep === 1
                    ? 'bg-amber-500/20 text-amber-300'
                    : currentStep >= 2
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/[0.05] text-zinc-400'
                }`}>
                  {currentStep === 0 ? 'LISTEN' : currentStep === 1 ? 'SYN_RCVD' : 'ESTABLISHED'}
                </span>
              </div>
            </div>
          </div>

          {/* Lienzo del Paquete en Tránsito Animado */}
          <div className="relative h-28 rounded-2xl bg-black/50 border border-white/[0.04] flex items-center px-8 overflow-hidden">
            {/* Línea de Trayectoria */}
            <div className="w-full h-0.5 bg-zinc-800 relative">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Paquete Luminoso Móvil */}
            <motion.div
              className="absolute w-10 h-10 -ml-5 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 shadow-xl shadow-cyan-500/40 flex items-center justify-center text-slate-950 font-mono font-black text-xs pointer-events-none"
              style={{ left: `${Math.min(96, Math.max(4, progress))}%` }}
            >
              L4
            </motion.div>
          </div>

          {/* Scrubber / Control de Tiempo Estilo Apple */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-2 rounded-full bg-white text-black font-semibold flex items-center gap-1.5 hover:bg-zinc-200 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
                </button>

                <button
                  onClick={() => {
                    setProgress(0);
                    setIsPlaying(false);
                  }}
                  className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <span>Línea de Tiempo: {progress}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => {
                setProgress(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Tarjeta Explicativa del Paso Actual */}
          <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-zinc-300 space-y-2">
            <div className="text-cyan-400 font-bold uppercase text-[11px] tracking-wider">
              {currentStep === 0 && 'PASO 1 • SYN (Synchronization)'}
              {currentStep === 1 && 'PASO 2 • SYN-ACK (Synchronization + Acknowledgment)'}
              {currentStep >= 2 && 'PASO 3 • ACK (Acknowledgment Completo) & ESTABLISHED'}
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed font-sans">
              {currentStep === 0 &&
                'El cliente genera un número de secuencia inicial aleatorio (ISN = 1000) y solicita abrir la sesión segura con Nginx.'}
              {currentStep === 1 &&
                'Nginx reconoce el número del cliente sumando 1 (Ack = 1001) y propone su propio número de secuencia (ISN = 5000).'}
              {currentStep >= 2 &&
                'El cliente confirma con Ack = 5001. Ambos sockets quedan en estado ESTABLISHED listos para transferir datos TLS sin pérdidas.'}
            </p>
          </div>
        </div>
      ) : (
        /* VISTA SAMBA PÉRDIDA Y RECUPERACIÓN */
        <div className="p-8 sm:p-12 rounded-[36px] apple-glass border border-white/[0.08] space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div>
              <span className="text-xs font-mono text-amber-400 font-bold uppercase">
                Servidor Samba VLAN 10 (172.16.10.13:445)
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">
                Descarga de Archivos Sin Corrupción
              </h3>
            </div>

            <button
              onClick={() => setSambaLost(true)}
              className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Simular Pérdida de Paquete por Ruido
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`p-6 rounded-[24px] border text-center transition-all ${
                  sambaLost && n === 2
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse'
                    : 'apple-glass border-white/[0.06] text-zinc-300'
                }`}
              >
                <div className="text-xs font-mono text-zinc-500">Segmento #{n}</div>
                <div className="text-xl font-bold text-white mt-1">1460 B</div>
                <div className="text-[11px] font-mono mt-2">
                  {sambaLost && n === 2 ? '¡PERDIDO! Retransmitiendo...' : 'Entregado con ACK'}
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-zinc-400 leading-relaxed">
            {sambaLost ? (
              <span className="text-amber-300 font-bold">
                ✓ TCP detectó la falta de reconocimiento en el temporizador RTO y retransmitió el segmento #2. El archivo del docente se descargó 100% íntegro.
              </span>
            ) : (
              <span>
                Presiona el botón superior para inducir una falla y comprobar cómo opera la confiabilidad garantizada de TCP.
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
