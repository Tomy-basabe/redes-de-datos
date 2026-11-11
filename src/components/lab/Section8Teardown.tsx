import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, RotateCcw, ChevronRight, Laptop, Server, CheckCircle2, Lock } from 'lucide-react';

export const Section8Teardown: React.FC = () => {
  const [step, setStep] = useState<number>(0);

  const steps = [
    {
      id: 0,
      emisor: 'Cliente Lógico VLAN 20 (172.16.20.10)',
      receptor: 'Nginx Front-End VLAN 10 (172.16.10.12)',
      tipo: 'Paso 1: FIN (Solicitud de Cierre desde el Cliente)',
      flags: 'FIN = 1, ACK = 1',
      clientState: 'FIN_WAIT_1',
      serverState: 'ESTABLISHED',
      direccion: 'cliente_a_servidor',
      descripcion: 'El cliente notifica que terminó de transmitir datos en su sentido. La mitad del canal se cierra (Half-Close).'
    },
    {
      id: 1,
      emisor: 'Nginx Front-End VLAN 10 (172.16.10.12)',
      receptor: 'Cliente Lógico VLAN 20 (172.16.20.10)',
      tipo: 'Paso 2: ACK (Confirmación del FIN del Cliente)',
      flags: 'ACK = 1',
      clientState: 'FIN_WAIT_2',
      serverState: 'CLOSE_WAIT',
      direccion: 'servidor_a_cliente',
      descripcion: 'El servidor confirma la recepción del FIN. Nginx puede continuar transmitiendo datos pendientes hacia el cliente si los hubiera.'
    },
    {
      id: 2,
      emisor: 'Nginx Front-End VLAN 10 (172.16.10.12)',
      receptor: 'Cliente Lógico VLAN 20 (172.16.20.10)',
      tipo: 'Paso 3: FIN (Cierre del Sentido del Servidor)',
      flags: 'FIN = 1, ACK = 1',
      clientState: 'FIN_WAIT_2',
      serverState: 'LAST_ACK',
      direccion: 'servidor_a_cliente',
      descripcion: 'Habiendo completado la entrega de la página web, Nginx transmite su propio FIN anunciando el cierre de su sentido de transmisión.'
    },
    {
      id: 3,
      emisor: 'Cliente Lógico VLAN 20 (172.16.20.10)',
      receptor: 'Nginx Front-End VLAN 10 (172.16.10.12)',
      tipo: 'Paso 4: ACK Final & Estado TIME_WAIT',
      flags: 'ACK = 1',
      clientState: 'TIME_WAIT (Temporizador 2MSL)',
      serverState: 'CLOSED',
      direccion: 'cliente_a_servidor',
      descripcion: 'El cliente confirma el FIN del servidor. Nginx pasa a CLOSED inmediatamente. El cliente permanece en TIME_WAIT (2MSL) para asegurar que el ACK no se pierda y no interfiera con sockets futuros antes de liberar el puerto.'
    }
  ];

  const current = steps[step];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-violet-400 font-semibold block">
            Sección 8 • Terminación de Sesión L4
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold apple-headline text-white mt-1">
            Finalización de Conexión TCP (Four-Way Teardown)
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl">
            A diferencia del establecimiento en 3 pasos, el cierre habitual utiliza 4 segmentos (FIN, ACK, FIN, ACK) permitiendo cerrar independientemente cada sentido de transmisión (cierre ordenado y Half-Close).
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

      {/* Escenario en 4 Pasos */}
      <div className="p-8 rounded-[36px] apple-glass border border-white/[0.08] space-y-8">
        {/* Nodos con Estados de Conexión en Cierre */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Laptop className="w-8 h-8 text-cyan-400" />
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Extremo Local (Estudiante)</span>
                <div className="text-base font-bold text-white font-mono">172.16.20.10:53000</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Estado Socket:</span>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                current.clientState.includes('TIME_WAIT')
                  ? 'bg-amber-500/20 text-amber-300'
                  : current.clientState.includes('CLOSED')
                  ? 'bg-zinc-700 text-zinc-300'
                  : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                {current.clientState}
              </span>
            </div>
          </div>

          <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-violet-400" />
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Extremo Servidor (Nginx)</span>
                <div className="text-base font-bold text-white font-mono">172.16.10.12:443</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Estado Socket:</span>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                current.serverState === 'CLOSED'
                  ? 'bg-zinc-700 text-zinc-300'
                  : 'bg-violet-500/20 text-violet-300'
              }`}>
                {current.serverState}
              </span>
            </div>
          </div>
        </div>

        {/* Trayectoria Visual del Mensaje */}
        <div className="p-6 rounded-2xl bg-black/60 border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white font-bold">{current.tipo}</span>
            <span className="text-violet-400 font-bold">{current.flags}</span>
          </div>

          <div className="flex items-center justify-between px-6 py-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs font-mono text-zinc-300">
            <span className="text-cyan-400 font-bold">172.16.20.10:53000</span>
            <div className="flex-1 mx-6 flex items-center justify-center gap-2">
              <div className={`w-full h-0.5 ${current.direccion === 'cliente_a_servidor' ? 'bg-cyan-400' : 'bg-violet-400'}`} />
              <span className="text-[11px] font-bold uppercase shrink-0 px-2 py-0.5 rounded bg-black/80">
                {current.direccion === 'cliente_a_servidor' ? current.flags + ' ───▶' : '◀─── ' + current.flags}
              </span>
            </div>
            <span className="text-violet-400 font-bold">172.16.10.12:443</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs font-mono text-zinc-300 space-y-1">
            <span className="text-zinc-500 block uppercase text-[10px]">Justificación de Cátedra:</span>
            <p className="text-sm font-sans text-zinc-200 leading-relaxed">{current.descripcion}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
