import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, ShieldCheck, Server, Sparkles, Terminal } from 'lucide-react';
import { INTEGRANTES, DOCENTES, INSTITUCIONAL } from '../data/reportData';

interface AcademicHeroProps {
  onStartPresentation: () => void;
  onExploreSimulator: () => void;
}

export const AcademicHero: React.FC<AcademicHeroProps> = ({ onStartPresentation, onExploreSimulator }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-10 lg:p-12 shadow-2xl space-y-8">
      {/* Resplandor ambiental de red */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Badges de Identidad Institucional */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
          <GraduationCap className="w-3.5 h-3.5" />
          {INSTITUCIONAL.universidad} • {INSTITUCIONAL.facultad}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          {INSTITUCIONAL.carrera} • {INSTITUCIONAL.materia}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-violet-500/15 text-violet-300 border border-violet-500/30">
          {INSTITUCIONAL.escuela}
        </span>
      </div>

      {/* Título Principal de la Presentación */}
      <div className="space-y-4 max-w-4xl">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Capa de Transporte{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent">
            Modelo TCP/IP
          </span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed font-sans">
          Plataforma técnica interactiva y simulador de flujos en tiempo real para la defensa del trabajo práctico: comunicación extremo a extremo, planificación de puertos en servidores VLAN 10, proxy inverso doble salto (Nginx $\rightarrow$ Apache), confiabilidad en Samba, balanceo MikroTik PCC y políticas de seguridad con DHCP Relay en Cisco Catalyst C9200.
        </p>
      </div>

      {/* Docentes a Cargo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        {DOCENTES.map((doc, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
              {idx === 0 ? 'RT' : 'RC'}
            </div>
            <div>
              <div className="text-sm font-bold text-white">{doc.nombre}</div>
              <div className="text-xs text-slate-400 font-mono">{doc.cargo}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Equipo Expositor (6 Integrantes con Legajos y Roles) */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Equipo de Estudiantes Expositores (Grupo):
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {INTEGRANTES.map((st) => (
            <div
              key={st.legajo}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                {st.legajo.slice(-3)}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">{st.nombre}</div>
                <div className="text-[11px] text-cyan-400 font-mono">Legajo: {st.legajo}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{st.rol}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botonera de Acción */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
        <button
          onClick={onExploreSimulator}
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-bold font-mono text-xs sm:text-sm hover:from-cyan-300 hover:to-emerald-300 transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer"
        >
          <span>Ir al Simulador de Topología L4</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onStartPresentation}
          className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-mono text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Ver Protocolos y Confiabilidad</span>
        </button>
      </div>
    </div>
  );
};
