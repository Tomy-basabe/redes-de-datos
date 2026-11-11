import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Server, Shield, Globe, Laptop, ArrowRight, CheckCircle2 } from 'lucide-react';
import { INTEGRANTES_GRUPO, VLANS_TP1 } from '../../data/topologyTp1';

export const Section1Intro: React.FC<{ onStartLab: () => void }> = ({ onStartLab }) => {
  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Banner Principal */}
      <div className="p-8 sm:p-12 rounded-[36px] apple-glass border border-white/[0.08] relative overflow-hidden space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3.5 py-1 rounded-full text-xs font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            UTN Facultad Regional Mendoza
          </span>
          <span className="px-3.5 py-1 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Redes de Información
          </span>
          <span className="px-3.5 py-1 rounded-full text-xs font-mono bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
            TP1 Escuela 4-025 Los Corralitos
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold apple-headline text-white tracking-tight">
          Capa de Transporte:
          <br />
          <span className="apple-text-gradient-cyan">
            El Eje Articulador Extremo a Extremo.
          </span>
        </h2>

        <p className="text-zinc-300 text-sm sm:text-base lg:text-lg max-w-3xl leading-relaxed font-sans">
          En el modelo TCP/IP, la Capa de Red (IP) se encarga de transportar paquetes desde un equipo emisor hasta un equipo receptor a través de la infraestructura. La <strong className="text-white">Capa de Transporte</strong>, en cambio, permite que los programas de aplicación se comuniquen directamente entre sí, identificando el servicio exacto mediante <strong className="text-cyan-400">números de puerto</strong> y gestionando la confiabilidad, control de flujo y congestión.
        </p>

        {/* Cátedra y Docentes */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-zinc-400">
          <div>
            Docente a cargo de Cátedra: <strong className="text-white">Esp. Prof. Raúl Tonelli</strong>
            <span className="mx-2">•</span>
            Docente de Trabajos Prácticos: <strong className="text-white">Prof. Roberto Cutuli</strong>
          </div>
          <div>Fecha de Exposición: <strong className="text-cyan-300">13 de Noviembre</strong></div>
        </div>

        {/* 6 Estudiantes Expositores con sus Roles */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-mono uppercase text-zinc-500 tracking-wider block font-semibold">
            Integrantes del Grupo de Trabajo (UTN FRM):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
            {INTEGRANTES_GRUPO.map((st) => (
              <div key={st.legajo} className="p-3 rounded-2xl bg-black/40 border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">{st.nombre}</span>
                  <span className="text-cyan-400">#{st.legajo}</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">{st.rolExposicion}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Las 5 Funciones de Transporte Aplicadas a la Escuela */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white font-display">
          Funciones Principales de Transporte en la Red Escolar
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-[28px] apple-glass border border-white/[0.08] space-y-2">
            <span className="text-xs font-mono uppercase text-cyan-400 font-bold block">1. Extremo a Extremo</span>
            <div className="text-base font-bold text-white">Comunicación Entre Procesos</div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Permite la comunicación lógica directa entre el navegador del alumno (VLAN 20) y los procesos Nginx, Apache o Samba en VLAN 10 sin que los routers intermedios intervengan en la capa 4.
            </p>
          </div>

          <div className="p-6 rounded-[28px] apple-glass border border-white/[0.08] space-y-2">
            <span className="text-xs font-mono uppercase text-emerald-400 font-bold block">2. Segmentación</span>
            <div className="text-base font-bold text-white">División y Reensamblado</div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              TCP divide los archivos grandes de Samba en bloques MSS (1460 B) numerados secuencialmente, asegurando que se reconstruyan en el destino en orden exacto.
            </p>
          </div>

          <div className="p-6 rounded-[28px] apple-glass border border-white/[0.08] space-y-2">
            <span className="text-xs font-mono uppercase text-amber-400 font-bold block">3. Multiplexación</span>
            <div className="text-base font-bold text-white">Puertos y Concurrencia</div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Permite a los hosts administrativos utilizar simultáneamente DNS (53), navegación (443) y archivos compartidos (445) utilizando puertos efímeros independientes.
            </p>
          </div>
        </div>

        {/* Botón de Inicio con Micro-interacción T.A.B.E. */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={onStartLab}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 hover:scale-[1.02] shadow-xl shadow-cyan-500/20 cursor-pointer tabe-btn-action"
          >
            <span>Iniciar Demostración: Sección 2 (TCP vs UDP)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
