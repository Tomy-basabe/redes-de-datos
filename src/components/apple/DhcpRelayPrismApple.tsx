import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Router as RouterIcon, CheckCircle2, XCircle, Play, ArrowRight, Shield } from 'lucide-react';

export const DhcpRelayPrismApple: React.FC = () => {
  const [helperActive, setHelperActive] = useState<boolean>(true);
  const [testing, setTesting] = useState<boolean>(false);
  const [result, setResult] = useState<'success' | 'fail' | null>(null);

  const runTest = () => {
    setTesting(true);
    setResult(null);
    setTimeout(() => {
      setTesting(false);
      setResult(helperActive ? 'success' : 'fail');
    }, 1200);
  };

  return (
    <section id="dhcp-prism" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-violet-400 font-semibold">
          Enrutamiento Inter-VLAN • Sección 10 del Informe
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold apple-headline text-white">
          DHCP Relay. El Prisma Inter-VLAN.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg apple-subheadline">
          El servidor DHCP está en VLAN 10 (172.16.10.14), pero los clientes están en VLAN 20, 30 y 50. Como los broadcasts no cruzan routers, el comando <code className="font-mono text-cyan-300">ip helper-address</code> en el Cisco Catalyst C9200 convierte el broadcast en unicast.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setHelperActive(!helperActive)}
            className={`px-5 py-2 rounded-full text-xs font-mono font-semibold transition-all border cursor-pointer ${
              helperActive
                ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                : 'bg-rose-500/15 border-rose-400 text-rose-300'
            }`}
          >
            ip helper-address: {helperActive ? 'CONFIGURADO (172.16.10.14)' : 'APAGADO / FALTANTE'}
          </button>

          <button
            onClick={runTest}
            disabled={testing}
            className="px-6 py-2 rounded-full bg-white text-black font-semibold text-xs tracking-wide hover:bg-zinc-200 transition-all cursor-pointer shadow-lg shadow-white/10 flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{testing ? 'Emitiendo Broadcast...' : 'Emitir DHCP Discover'}</span>
          </button>
        </div>
      </div>

      {/* Visualización del Proceso en 3 Pasos */}
      <div className="p-8 sm:p-12 rounded-[36px] apple-glass border border-white/[0.08] space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Paso 1: Cliente Broadcast */}
          <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300">
              VLAN 20 (Estudiantes)
            </span>
            <div className="text-lg font-bold text-white mt-1">Broadcast L2/L3</div>
            <div className="text-xs text-zinc-400 font-mono">0.0.0.0:68 → 255.255.255.255:67</div>
            <p className="text-[11px] text-zinc-500 pt-2 border-t border-white/[0.06]">
              Trama broadcast dirigida a toda la subred solicitando dirección IP.
            </p>
          </div>

          {/* Paso 2: Catalyst C9200 con Helper-Address */}
          <div className="p-6 rounded-[28px] bg-white/[0.04] border border-cyan-500/40 text-center space-y-2 shadow-xl shadow-cyan-500/10">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
              Switch L3 Cisco C9200
            </span>
            <div className="text-lg font-bold text-white mt-1">SVI interface Vlan20</div>
            <div className="text-xs text-cyan-300 font-mono">
              {helperActive ? 'ip helper-address 172.16.10.14' : '! Sin Relay Configurado'}
            </div>
            <p className="text-[11px] text-zinc-400 pt-2 border-t border-white/[0.06]">
              {helperActive
                ? 'Intercepta el broadcast y lo encapsula en unicast hacia VLAN 10.'
                : 'Descarta el broadcast. El paquete no cruza la frontera de red.'}
            </p>
          </div>

          {/* Paso 3: Windows Server DHCP */}
          <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
              VLAN 10 (Servidores)
            </span>
            <div className="text-lg font-bold text-white mt-1">Windows Server DHCP</div>
            <div className="text-xs text-zinc-400 font-mono">172.16.10.14:67</div>
            <p className="text-[11px] text-zinc-500 pt-2 border-t border-white/[0.06]">
              Asigna pool 172.16.20.0/24 y responde mediante Unicast Offer.
            </p>
          </div>
        </div>

        {/* Diagnóstico del Test */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-[24px] border text-xs font-mono flex items-center justify-between gap-4 ${
              result === 'success'
                ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                : 'bg-rose-500/15 border-rose-400/50 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {result === 'success' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              )}
              <div>
                <strong className="text-sm block text-white">
                  {result === 'success' ? '¡IP Asignada Dinámicamente!' : '¡Falla de DHCP: Broadcast Caído!'}
                </strong>
                <span className="text-zinc-300 font-sans">
                  {result === 'success'
                    ? 'El switch Cisco Catalyst C9200 actuó como agente de retransmisión. El cliente en VLAN 20 recibió la IP 172.16.20.45/24.'
                    : 'Sin "ip helper-address", el broadcast no puede atravesar el switch de capa 3. El cliente queda en 169.254.x.x sin Internet.'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
