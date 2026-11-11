import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Shield, Lock, Unlock, CheckCircle2, XCircle, ArrowRight, AlertTriangle } from 'lucide-react';

export const ProxyAndAclVisualizer: React.FC = () => {
  const [internalTls, setInternalTls] = useState<boolean>(false);
  const [selectedFlow, setSelectedFlow] = useState<number>(0);

  const flows = [
    {
      id: 0,
      nombre: 'Navegación Alumno a Campus Web (Nginx Proxy)',
      origen: '172.16.20.10:53000 (VLAN 20)',
      destino: '172.16.10.12:443 (Nginx VLAN 10)',
      puerto: 'TCP 443 (HTTPS)',
      resultado: 'PERMITIDO',
      color: 'emerald',
      detalles: 'El alumno se conecta de forma segura a Nginx con certificado TLS público de la escuela.'
    },
    {
      id: 1,
      nombre: 'Conexión Interna Proxy a Backend (Nginx → Apache)',
      origen: '172.16.10.12:41000 (Nginx)',
      destino: '172.16.10.11:8080 (Apache)',
      puerto: 'TCP 8080 Interno',
      resultado: 'PERMITIDO INTERNO',
      color: 'cyan',
      detalles: 'Segunda conexión TCP independiente iniciada por Nginx como cliente frente a Apache.'
    },
    {
      id: 2,
      nombre: 'Intento de Acceso Directo de Estudiante a Apache 8080',
      origen: '172.16.20.10:53000 (VLAN 20)',
      destino: '172.16.10.11:8080 (Apache VLAN 10)',
      puerto: 'TCP 8080',
      resultado: 'BLOQUEADO (ACL C9200)',
      color: 'rose',
      detalles: 'El Cisco Catalyst C9200 aplica una ACL que rechaza el tráfico hacia 8080 desde las VLANs de usuarios.'
    }
  ];

  return (
    <div className="w-full rounded-3xl bg-slate-950 border border-slate-800 p-6 lg:p-8 space-y-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider">
            Sección 4 del Informe • Doble Salto y Seguridad L4
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Arquitectura Proxy Inverso Nginx / Apache & ACLs C9200
          </h3>
        </div>

        {/* Interruptor de Cifrado Interno */}
        <button
          onClick={() => setInternalTls(!internalTls)}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-2 cursor-pointer ${
            internalTls
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {internalTls ? <Lock className="w-4 h-4 text-emerald-400" /> : <Unlock className="w-4 h-4 text-slate-400" />}
          <span>TLS Tramo Interno: {internalTls ? 'CIFRADO (HTTPS:8443)' : 'PLANO (HTTP:8080)'}</span>
        </button>
      </div>

      {/* Diagrama Visual de Doble Salto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Nodo 1: Estudiante */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-center">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
            Cliente VLAN 20
          </span>
          <div className="text-sm font-bold text-white mt-1">PC Estudiante</div>
          <div className="text-xs font-mono text-slate-400">172.16.20.10</div>
          <div className="text-[11px] font-mono text-cyan-300 pt-2 border-t border-slate-800/80">
            Puerto Efímero: <strong className="text-white">53000</strong>
          </div>
        </div>

        {/* Salto 1 -> Nginx */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2 text-center relative">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
            Proxy Inverso
          </span>
          <div className="text-sm font-bold text-white mt-1">Nginx Front-End</div>
          <div className="text-xs font-mono text-slate-400">172.16.10.12</div>
          <div className="text-[11px] font-mono text-emerald-300 pt-2 border-t border-slate-800/80 space-y-0.5">
            <div>Escucha Externa: <strong>TCP 443 / 80</strong></div>
            <div>Salida Interna: <strong>TCP efímero</strong></div>
          </div>
        </div>

        {/* Salto 2 -> Apache */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-violet-500/30 space-y-2 text-center">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-violet-500/15 text-violet-300">
            Backend Protegido
          </span>
          <div className="text-sm font-bold text-white mt-1">Apache Server</div>
          <div className="text-xs font-mono text-slate-400">172.16.10.11</div>
          <div className="text-[11px] font-mono text-violet-300 pt-2 border-t border-slate-800/80">
            Puerto Interno: <strong>{internalTls ? 'TCP 8443 (TLS)' : 'TCP 8080'}</strong>
          </div>
        </div>
      </div>

      {/* Probador Interactivo de ACLs en Cisco Catalyst C9200 */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Probador de Reglas de Acceso L4 (Cisco Catalyst C9200)
          </h4>
          <span className="text-xs text-slate-500 font-mono">Haz clic en cada flujo para evaluarlo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {flows.map((fl) => {
            const isSelected = selectedFlow === fl.id;
            return (
              <div
                key={fl.id}
                onClick={() => setSelectedFlow(fl.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? fl.resultado.includes('BLOQUEADO')
                      ? 'bg-rose-500/15 border-rose-400 shadow-md shadow-rose-500/20'
                      : 'bg-emerald-500/15 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="font-bold text-white">{fl.puerto}</span>
                  {fl.resultado.includes('BLOQUEADO') ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                      <XCircle className="w-3.5 h-3.5" /> DROP
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> PERMIT
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-200">{fl.nombre}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  {fl.origen} → {fl.destino}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detalle Técnico de la Regla Seleccionada */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono flex items-start gap-3">
          <div className="text-cyan-400 font-bold shrink-0">Evaluación IOS:</div>
          <div className="leading-relaxed">
            {flows[selectedFlow].detalles}
            {selectedFlow === 2 && (
              <span className="text-rose-300 block mt-1 font-bold">
                ! Regla Cisco IOS: access-list 101 deny tcp 172.16.20.0 0.0.0.255 host 172.16.10.11 eq 8080
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
