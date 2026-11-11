import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Shield, Server, Cpu, GraduationCap, Users } from 'lucide-react';
import { INTEGRANTES, DOCENTES, INSTITUCIONAL } from '../../data/reportData';

interface HeroAppleProps {
  onExplore: () => void;
}

export const HeroApple: React.FC<HeroAppleProps> = ({ onExplore }) => {
  return (
    <section id="hero" className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-6 pt-12 pb-20 overflow-hidden">
      {/* Resplandor suave de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] apple-glow-cyan opacity-40 blur-3xl pointer-events-none" />

      {/* Eyebrow Apple Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono text-zinc-300 mb-6 backdrop-blur-xl"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        {INSTITUCIONAL.universidad} • {INSTITUCIONAL.facultad} • {INSTITUCIONAL.materia}
      </motion.div>

      {/* Titular Monumental */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold apple-headline max-w-5xl apple-text-gradient-silver tracking-tight"
      >
        Capa de Transporte.
        <br />
        <span className="apple-text-gradient-cyan">
          Confiabilidad en cada byte.
        </span>
      </motion.h1>

      {/* Párrafo Narrativo Estilo Apple */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="text-lg sm:text-xl md:text-2xl text-zinc-400 max-w-3xl mt-6 apple-subheadline font-normal"
      >
        Una arquitectura de red diseñada para la <strong className="text-white font-medium">Escuela 4-025 Los Corralitos</strong>. Donde la diferenciación entre TCP y UDP, la segmentación inter-VLAN y el balanceo multi-enlace convergen en una experiencia sin fisuras.
      </motion.p>

      {/* Estadísticas de Ingeniería Estilo Apple Keynote */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-14"
      >
        <div className="p-6 rounded-[28px] apple-glass text-center">
          <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">20 B</div>
          <div className="text-xs text-zinc-400 mt-1 uppercase font-mono tracking-wider">Encabezado TCP</div>
          <div className="text-[11px] text-cyan-400 mt-2 font-mono">Control y Confiabilidad</div>
        </div>

        <div className="p-6 rounded-[28px] apple-glass text-center">
          <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">2 Saltos</div>
          <div className="text-xs text-zinc-400 mt-1 uppercase font-mono tracking-wider">Proxy Inverso</div>
          <div className="text-[11px] text-emerald-400 mt-2 font-mono">Nginx 443 → Apache 8080</div>
        </div>

        <div className="p-6 rounded-[28px] apple-glass text-center">
          <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">3 ISPs</div>
          <div className="text-xs text-zinc-400 mt-1 uppercase font-mono tracking-wider">MikroTik PCC</div>
          <div className="text-[11px] text-sky-400 mt-2 font-mono">WestNet • Starlink • Tachicom</div>
        </div>

        <div className="p-6 rounded-[28px] apple-glass text-center">
          <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">4 VLANs</div>
          <div className="text-xs text-zinc-400 mt-1 uppercase font-mono tracking-wider">Catalyst C9200</div>
          <div className="text-[11px] text-violet-400 mt-2 font-mono">DHCP Relay L3 Configurado</div>
        </div>
      </motion.div>

      {/* Ficha Académica del Equipo y Cátedra */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl mt-10 p-6 rounded-[32px] apple-glass border border-white/[0.08] text-left"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4 mb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block">
              Equipo de Exposición • UTN Mendoza
            </span>
            <div className="text-sm font-semibold text-white mt-0.5">
              Docentes a cargo: <span className="text-zinc-300">Esp. Prof. Raúl Tonelli / Prof. Roberto Cutuli</span>
            </div>
          </div>
          <span className="text-xs font-mono text-zinc-400">Entrega: 13 de Noviembre</span>
        </div>

        {/* 6 Estudiantes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {INTEGRANTES.map((st) => (
            <div key={st.legajo} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-xs font-semibold text-white truncate">{st.nombre}</div>
              <div className="text-[11px] font-mono text-cyan-400 mt-0.5">#{st.legajo}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA de Desplazamiento */}
      <motion.button
        onClick={onExplore}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="mt-12 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium text-xs tracking-wide hover:bg-zinc-200 transition-all cursor-pointer shadow-xl shadow-white/10"
      >
        <span>Explorar la Arquitectura</span>
        <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
      </motion.button>
    </section>
  );
};
