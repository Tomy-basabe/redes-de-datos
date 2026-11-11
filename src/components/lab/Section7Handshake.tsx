import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ChevronRight, CheckCircle2, Laptop, Server, ArrowRight, ArrowLeft } from 'lucide-react';

export const Section7Handshake: React.FC = () => {
  const [step, setStep] = useState<number>(0);

  const steps = [
    {
      id: 0,
      emisor: 'Cliente Lógico VLAN 20 (172.16.20.10)',
      receptor: 'Nginx Front-End VLAN 10 (172.16.10.12:443)',
      tipo: '1. Segmento SYN (Sincronización Inicial)',
      flags: 'SYN = 1, ACK = 0',
      seq: 1000,
      ack: 0,
      clientState: 'SYN_SENT',
      serverState: 'LISTEN',
      direccion: 'cliente_a_servidor',
      descripcion: 'El host de estudiantes genera un Número de Secuencia Inicial aleatorio (ISN = 1000) y solicita abrir la sesión HTTPS con Nginx.'
    },
    {
      id: 1,
      emisor: 'Nginx Front-End VLAN 10 (172.16.10.12:443)',
      receptor: 'Cliente Lógico VLAN 20 (172.16.20.10)',
      tipo: '2. Segmento SYN + ACK (Aceptación y Reconocimiento)',
      flags: 'SYN = 1, ACK = 1',
      seq: 5000,
      ack: 1001,
      clientState: 'SYN_SENT',
      serverState: 'SYN_RCVD',
      direccion: 'servidor_a_cliente',
      descripcion: 'Nginx reconoce la secuencia del cliente incrementándola en 1 (ACK = 1001) y anuncia su propio número de secuencia (ISN = 5000).'
    },
    {
      id: 2,
      emisor: 'Cliente Lógico VLAN 20 (172.16.20.10)',
      receptor: 'Nginx Front-End VLAN 10 (172.16.10.12:443)',
      tipo: '3. Segmento ACK (Confirmación Final)',
      flags: 'SYN = 0, ACK = 1',
      seq: 1001,
      ack: 5001,
      clientState: 'ESTABLISHED',
      serverState: 'ESTABLISHED',
      direccion: 'cliente_a_servidor',
      descripcion: 'El cliente confirma la recepción del SYN del servidor (ACK = 5001). Ambos extremos pasan al estado ESTABLISHED. La conexión lógica queda operativa.'
    }
  ];

  const current = steps[step];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold block">
            Sección 7 • Negociación de Sesión L4
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold apple-headline text-white mt-1">
            Establecimiento de Conexión TCP (Three-Way Handshake)
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Demostración aplicada entre un host lógico de la VLAN 20 de Estudiantes (<code className="text-cyan-300 font-mono">172.16.20.10</code>) y el servidor Nginx en VLAN 10 (<code className="text-cyan-300 font-mono">172.16.10.12:443</code>) para servicio web HTTPS.
          </p>
        </div>

        {/* Controles de Paso a Paso */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer border border-white/[0.08]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Paso Anterior</span>
          </button>

          <button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            disabled={step === steps.length - 1}
            className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs font-mono flex items-center gap-1.5 hover:bg-zinc-200 disabled:opacity-30 cursor-pointer shadow-lg"
          >
            <span>Siguiente ({step + 1}/{steps.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setStep(0)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white cursor-pointer border border-white/[0.06]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Escenario de Simulación en 3 Pasos */}
      <div className="p-8 rounded-[36px] apple-glass border border-white/[0.08] space-y-8">
        {/* Los Dos Extremos Lógicos con sus Estados de Conexión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Laptop className="w-8 h-8 text-cyan-400" />
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Cliente Lógico VLAN 20</span>
                <div className="text-base font-bold text-white font-mono">172.16.20.10:53000</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Estado:</span>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                current.clientState === 'ESTABLISHED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                {current.clientState}
              </span>
            </div>
          </div>

          <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-emerald-400" />
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Nginx Front-End VLAN 10</span>
                <div className="text-base font-bold text-white font-mono">172.16.10.12:443 (HTTPS)</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Estado:</span>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                current.serverState === 'ESTABLISHED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {current.serverState}
              </span>
            </div>
          </div>
        </div>

        {/* Trayectoria Visual del Segmento Actual */}
        <div className="p-6 rounded-2xl bg-black/60 border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white font-bold">{current.tipo}</span>
            <span className="text-cyan-400 font-bold">{current.flags}</span>
          </div>

          {/* Flecha Direccional Dinámica */}
          <div className="flex items-center justify-between px-6 py-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs font-mono text-zinc-300">
            <span className="text-cyan-400 font-bold">172.16.20.10:53000</span>
            <div className="flex-1 mx-6 flex items-center justify-center gap-2">
              <div className={`w-full h-0.5 ${current.direccion === 'cliente_a_servidor' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
              <span className="text-[11px] font-bold uppercase shrink-0 px-2 py-0.5 rounded bg-black/80">
                {current.direccion === 'cliente_a_servidor' ? 'Seq=' + current.seq + ' ───▶' : '◀─── Seq=' + current.seq + ' Ack=' + current.ack}
              </span>
            </div>
            <span className="text-emerald-400 font-bold">172.16.10.12:443</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
              <span className="text-zinc-500 text-[10px] block">Seq Number:</span>
              <strong className="text-white">{current.seq}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
              <span className="text-zinc-500 text-[10px] block">Ack Number:</span>
              <strong className="text-cyan-300">{current.ack}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
              <span className="text-zinc-500 text-[10px] block">Banderas:</span>
              <strong className="text-emerald-300">{current.flags}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
              <span className="text-zinc-500 text-[10px] block">Servicio:</span>
              <strong className="text-white">HTTPS TLS 1.3</strong>
            </div>
          </div>
        </div>

        {/* Explicación Técnica */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-zinc-300 space-y-1">
          <span className="text-zinc-500 block uppercase text-[10px]">Fundamento del Paso #{step + 1}:</span>
          <p className="text-sm font-sans text-zinc-200 leading-relaxed">{current.descripcion}</p>
        </div>
      </div>
    </div>
  );
};
