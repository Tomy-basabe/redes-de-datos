import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Wifi, Plus, Zap, ArrowRight } from 'lucide-react';

export const MultiWanFlowApple: React.FC = () => {
  const [flows, setFlows] = useState([
    { id: 1, user: 'Estudiante (VLAN 20)', dst: 'Campus Virtual (TCP 443)', isp: 'WestNet', bw: '100 Mbps', hash: 'PCC 0' },
    { id: 2, user: 'Docente (VLAN 30)', dst: 'Google Meet HD (TCP 443)', isp: 'Starlink', bw: '150 Mbps', hash: 'PCC 1' },
    { id: 3, user: 'Administración (VLAN 50)', dst: 'Sistema DGE (TCP 443)', isp: 'Tachicom', bw: '80 Mbps', hash: 'PCC 2' },
  ]);

  const addFlow = () => {
    const isps = [
      { name: 'WestNet', bw: '100 Mbps', hash: 'PCC 0' },
      { name: 'Starlink', bw: '150 Mbps', hash: 'PCC 1' },
      { name: 'Tachicom', bw: '80 Mbps', hash: 'PCC 2' },
    ];
    const targets = ['Repositorio UTN', 'Actualización Servidores', 'Videoconferencia Escolar', 'Plataforma Evaluativa'];
    const nextIdx = flows.length % 3;
    const newF = {
      id: Date.now(),
      user: `Conexión #${flows.length + 1} (VLAN ${nextIdx === 0 ? 20 : nextIdx === 1 ? 30 : 50})`,
      dst: `${targets[flows.length % targets.length]} (TCP 443)`,
      isp: isps[nextIdx].name,
      bw: isps[nextIdx].bw,
      hash: isps[nextIdx].hash,
    };
    setFlows([newF, ...flows.slice(0, 4)]);
  };

  return (
    <section id="multi-wan" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold">
          WAN & Capa de Transporte • Sección 9 del Informe
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold apple-headline text-white">
          MikroTik PCC. Tres Enlaces, Cero Congestión.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg apple-subheadline">
          El balanceo Per Connection Classifier clasifica cada flujo TCP basándose en la tupla IP/Puerto. Una sola conexión TCP no suma 330 Mbps; aprovecha la velocidad íntegra del enlace al que fue asignada.
        </p>

        <button
          onClick={addFlow}
          className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs tracking-wide hover:bg-zinc-200 transition-all cursor-pointer shadow-lg shadow-white/10"
        >
          <Plus className="w-4 h-4" />
          <span>Inyectar Flujo Concurrente</span>
        </button>
      </div>

      {/* Los 3 Tubos de Ancho de Banda WAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[32px] apple-glass border border-cyan-500/30 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">WAN 1 • Terrestre</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">Hash 0</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">WestNet</div>
          <div className="text-3xl font-black text-cyan-400 font-mono tracking-tight">100 Mbps</div>
          <p className="text-xs text-zinc-400 font-mono">
            Enlace por fibra terrestre. Utilizado prioritariamente para navegación general del alumnado.
          </p>
        </div>

        <div className="p-8 rounded-[32px] apple-glass border border-emerald-500/30 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-400 uppercase font-semibold">WAN 2 • Satelital</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Hash 1</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">Starlink</div>
          <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">150 Mbps</div>
          <p className="text-xs text-zinc-400 font-mono">
            Baja latencia y gran caudal satelital. Asignado a videollamadas docentes y campus virtual.
          </p>
        </div>

        <div className="p-8 rounded-[32px] apple-glass border border-violet-500/30 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-violet-400 uppercase font-semibold">WAN 3 • Inalámbrico</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">Hash 2</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">Tachicom</div>
          <div className="text-3xl font-black text-violet-400 font-mono tracking-tight">80 Mbps</div>
          <p className="text-xs text-zinc-400 font-mono">
            Enlace de contingencia y failover. Garantiza redundancia ante cortes en la zona de Corralitos.
          </p>
        </div>
      </div>

      {/* Flujos Concurrente Asignados */}
      <div className="p-6 rounded-[32px] apple-glass border border-white/[0.08] space-y-3">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
          Tabla de Conexiones Concurrente en Tiempo Real (MikroTik hEX RB750Gr3)
        </span>

        <div className="space-y-2">
          <AnimatePresence>
            {flows.map((fl) => (
              <motion.div
                key={fl.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
              >
                <div>
                  <span className="text-white font-bold">{fl.user}</span>
                  <span className="text-zinc-600 mx-2">→</span>
                  <span className="text-zinc-300">{fl.dst}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 text-[11px]">{fl.hash}</span>
                  <span className="px-3 py-1 rounded-full bg-white/[0.08] text-cyan-300 font-bold border border-white/[0.06]">
                    {fl.isp} • {fl.bw}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
