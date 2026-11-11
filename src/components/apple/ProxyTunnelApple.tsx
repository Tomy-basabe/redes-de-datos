import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Unlock, AlertOctagon, CheckCircle2, ArrowRight } from 'lucide-react';

export const ProxyTunnelApple: React.FC = () => {
  const [internalTls, setInternalTls] = useState<boolean>(false);
  const [aclTriggered, setAclTriggered] = useState<boolean>(false);

  return (
    <section id="proxy-tunnel" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
          Arquitectura de Borde • Sección 4 y 10
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold apple-headline text-white">
          Doble Salto L4. El Proxy Invisible.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg apple-subheadline">
          El cliente nunca toca el servidor de aplicaciones directamente. Nginx actúa como front-end perimetral aislando el puerto interno 8080 de Apache de toda la red escolar.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <button
            onClick={() => setInternalTls(!internalTls)}
            className={`px-5 py-2 rounded-full text-xs font-mono font-semibold transition-all border cursor-pointer flex items-center gap-2 ${
              internalTls
                ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
            }`}
          >
            {internalTls ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <Unlock className="w-3.5 h-3.5 text-zinc-500" />}
            <span>Cifrado Interno: {internalTls ? 'TLS Habilitado (HTTPS 8443)' : 'Texto Plano (HTTP 8080)'}</span>
          </button>

          <button
            onClick={() => {
              setAclTriggered(true);
              setTimeout(() => setAclTriggered(false), 2500);
            }}
            className="px-5 py-2 rounded-full text-xs font-mono font-semibold bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-500/10"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>Test ACL: Estudiante directo a Apache:8080</span>
          </button>
        </div>
      </div>

      {/* Visualizador del Doble Túnel */}
      <div className="p-8 sm:p-12 rounded-[36px] apple-glass border border-white/[0.08] space-y-8 relative overflow-hidden">
        {/* Alerta de Bloqueo por ACL */}
        <AnimatePresence>
          {aclTriggered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center justify-between gap-4 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong>¡ACCESO DENEGADO POR CISCO CATALYST C9200!</strong>
                  <div className="text-[11px] text-zinc-300">
                    La ACL L3 bloqueó el paquete con TCP RST. La VLAN 20 no tiene permiso hacia el puerto 8080.
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-rose-500/30">
                DROP L4
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Los 3 Nodos en Secuencia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Nodo 1: Estudiante */}
          <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300">
              VLAN 20 (Estudiantes)
            </span>
            <div className="text-lg font-bold text-white mt-1">PC Alumno</div>
            <div className="text-xs text-zinc-400 font-mono">172.16.20.10</div>
            <div className="text-xs font-mono text-cyan-400 pt-3 border-t border-white/[0.06]">
              Puerto Efímero: <strong className="text-white">53000</strong>
            </div>
          </div>

          {/* Nodo 2: Nginx */}
          <div className="p-6 rounded-[28px] bg-white/[0.04] border border-emerald-500/40 text-center space-y-2 relative shadow-xl shadow-emerald-500/10">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              Proxy Inverso Front-End
            </span>
            <div className="text-lg font-bold text-white mt-1">Nginx Server</div>
            <div className="text-xs text-zinc-400 font-mono">172.16.10.12</div>
            <div className="text-xs font-mono text-emerald-400 pt-3 border-t border-white/[0.06] space-y-1">
              <div>Escucha Pública: <strong>TCP 443</strong></div>
              <div>Salida Interna: <strong>TCP Efímero</strong></div>
            </div>
          </div>

          {/* Nodo 3: Apache */}
          <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300">
              Backend Protegido
            </span>
            <div className="text-lg font-bold text-white mt-1">Apache Server</div>
            <div className="text-xs text-zinc-400 font-mono">172.16.10.11</div>
            <div className="text-xs font-mono text-violet-400 pt-3 border-t border-white/[0.06]">
              Puerto Interno: <strong>{internalTls ? 'TCP 8443 (TLS)' : 'TCP 8080'}</strong>
            </div>
          </div>
        </div>

        {/* Resumen de Seguridad de Cátedra */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-xs font-mono text-zinc-400 space-y-2">
          <div className="font-bold text-white">Principio de Mínimo Privilegio (Cátedra de Redes):</div>
          <p className="text-zinc-300 leading-relaxed font-sans">
            Al existir dos conexiones de transporte desacopladas, Nginx actúa como escudo térmico: si un atacante intenta explotar una vulnerabilidad en Apache, debe primero superar la capa de inspección y terminación TLS de Nginx.
          </p>
        </div>
      </div>
    </section>
  );
};
