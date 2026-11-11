import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Globe, Wifi, ArrowRight, Zap } from 'lucide-react';

export const PccHashCalculatorApple: React.FC = () => {
  const [srcIp, setSrcIp] = useState<string>('172.16.20.45');
  const [srcPort, setSrcPort] = useState<number>(53210);

  // Simple deterministic hash simulation mimicking MikroTik PCC
  const ipSum = srcIp.split('.').reduce((acc, part) => acc + (parseInt(part, 10) || 0), 0);
  const hashVal = (ipSum + srcPort) % 3;

  const isps = [
    {
      name: 'WestNet (100 Mbps)',
      val: 0,
      color: 'text-cyan-400',
      border: 'border-cyan-400/80',
      bg: 'bg-cyan-500/15',
      desc: 'Enlace primario por fibra óptica terrestre.'
    },
    {
      name: 'Starlink (150 Mbps)',
      val: 1,
      color: 'text-emerald-400',
      border: 'border-emerald-400/80',
      bg: 'bg-emerald-500/15',
      desc: 'Enlace satelital de alta velocidad y baja latencia.'
    },
    {
      name: 'Tachicom (80 Mbps)',
      val: 2,
      color: 'text-violet-400',
      border: 'border-violet-400/80',
      bg: 'bg-violet-500/15',
      desc: 'Enlace inalámbrico de respaldo y failover.'
    }
  ];

  const assignedIsp = isps[hashVal];

  return (
    <section id="pcc-calculator" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold">
          Laboratorio Interactivo • MikroTik RouterOS
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold apple-headline text-white">
          Calculador de Hash PCC en Vivo.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg apple-subheadline">
          Cambia la IP del estudiante o el puerto efímero para ver cómo el algoritmo Per Connection Classifier asigna instantáneamente el flujo a uno de los 3 proveedores de Internet.
        </p>
      </div>

      <div className="p-8 sm:p-12 rounded-[36px] apple-glass border border-white/[0.08] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Entradas Interactivas */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Dirección IP de Origen (Host Estudiante/Docente)
              </label>
              <input
                type="text"
                value={srcIp}
                onChange={(e) => setSrcIp(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white font-mono text-sm focus:border-cyan-400 outline-none transition-colors"
                placeholder="Ej. 172.16.20.10"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Puerto Efímero L4 (49152 - 65535)
              </label>
              <input
                type="number"
                value={srcPort}
                onChange={(e) => setSrcPort(Number(e.target.value))}
                className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white font-mono text-sm focus:border-cyan-400 outline-none transition-colors"
                placeholder="Ej. 53000"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.04] text-xs font-mono text-zinc-400 space-y-1">
            <div className="text-zinc-500 uppercase text-[10px]">Fórmula RouterOS PCC:</div>
            <div className="text-white">
              both-addresses-and-ports : 3 / <strong className="text-cyan-400">{hashVal}</strong>
            </div>
          </div>
        </div>

        {/* Proveedor Seleccionado Dinámicamente */}
        <div className="lg:col-span-6 space-y-4">
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Resultado del Clasificador de Flujo:
          </div>

          <motion.div
            key={assignedIsp.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-8 rounded-[32px] border ${assignedIsp.border} ${assignedIsp.bg} space-y-4 shadow-2xl`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-black/40 text-white font-bold">
                Mangle Mark: WAN{hashVal + 1}_conn
              </span>
              <span className={`text-xs font-mono font-bold ${assignedIsp.color}`}>
                Hash #{hashVal} de 3
              </span>
            </div>

            <div className="text-3xl font-black text-white tracking-tight">
              {assignedIsp.name}
            </div>

            <p className="text-xs text-zinc-200 font-mono leading-relaxed">
              {assignedIsp.desc}
            </p>

            <div className="pt-3 border-t border-white/[0.1] text-[11px] font-mono text-zinc-300">
              Todos los paquetes de esta sesión TCP (Seq, Ack, Fin) viajarán únicamente por este enlace para evitar desorden de segmentos por latencias dispares.
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
