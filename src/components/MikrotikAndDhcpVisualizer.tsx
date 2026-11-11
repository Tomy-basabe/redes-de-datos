import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Wifi, CheckCircle2, XCircle, RotateCcw, AlertTriangle, ArrowRight, Play } from 'lucide-react';

export const MikrotikAndDhcpVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pcc' | 'dhcp'>('pcc');

  // PCC State
  const [flows, setFlows] = useState([
    { id: 1, usuario: 'Estudiante (VLAN 20)', destino: 'Campus Virtual (TCP 443)', isp: 'WestNet', velocidad: '100 Mbps', hash: 'PCC Hash 0' },
    { id: 2, usuario: 'Docente (VLAN 30)', destino: 'Videollamada Meet (TCP 443)', isp: 'Starlink', velocidad: '150 Mbps', hash: 'PCC Hash 1' },
    { id: 3, usuario: 'Secretaría (VLAN 50)', destino: 'Portal DGE Mendoza (TCP 443)', isp: 'Tachicom', velocidad: '80 Mbps', hash: 'PCC Hash 2' }
  ]);

  // DHCP Relay State
  const [helperAddressEnabled, setHelperAddressEnabled] = useState<boolean>(true);
  const [dhcpStatus, setDhcpStatus] = useState<'idle' | 'discovering' | 'success' | 'failed'>('idle');

  const addPccFlow = () => {
    const isps = [
      { name: 'WestNet', vel: '100 Mbps', hash: 'PCC Hash 0' },
      { name: 'Starlink', vel: '150 Mbps', hash: 'PCC Hash 1' },
      { name: 'Tachicom', vel: '80 Mbps', hash: 'PCC Hash 2' }
    ];
    const targets = ['Google Classroom', 'Descarga ISO Linux', 'YouTube Educativo', 'Actualización Windows'];
    const nextIdx = flows.length % 3;
    const newFlow = {
      id: Date.now(),
      usuario: `Usuario #${flows.length + 1} (VLAN ${nextIdx === 0 ? 20 : nextIdx === 1 ? 30 : 50})`,
      destino: `${targets[flows.length % targets.length]} (TCP 443)`,
      isp: isps[nextIdx].name,
      velocidad: isps[nextIdx].vel,
      hash: isps[nextIdx].hash
    };
    setFlows([newFlow, ...flows.slice(0, 4)]);
  };

  const testDhcp = () => {
    setDhcpStatus('discovering');
    setTimeout(() => {
      if (helperAddressEnabled) {
        setDhcpStatus('success');
      } else {
        setDhcpStatus('failed');
      }
    }, 1200);
  };

  return (
    <div className="w-full rounded-3xl bg-slate-950 border border-slate-800 p-6 lg:p-8 space-y-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase text-amber-400 tracking-wider">
            Secciones 9 y 10 del Informe • Capa 3 / WAN e Infraestructura
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Balanceo MikroTik Multi-WAN & Simulador DHCP Relay C9200
          </h3>
        </div>

        <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('pcc')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'pcc'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Balanceo PCC (3 ISPs)
          </button>
          <button
            onClick={() => setActiveTab('dhcp')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'dhcp'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. DHCP Relay (C9200)
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: MIKROTIK BALANCEO PCC */}
      {activeTab === 'pcc' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono text-amber-300 font-bold uppercase">
                Aclaración Crítica de Cátedra (Redes de Datos):
              </span>
              <p className="text-xs text-slate-300">
                El balanceo PCC distribuye flujos independientes, pero <strong>una única conexión TCP jamás suma los 3 anchos de banda</strong> (100 + 150 + 80 = 330 Mbps), porque violaría la consistencia de números de secuencia y la IP pública asignada a cada socket.
              </p>
            </div>

            <button
              onClick={addPccFlow}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5" /> Inyectar Nueva Conexión TCP
            </button>
          </div>

          {/* Grilla de los 3 Proveedores WAN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-bold">WAN 1 • WestNet</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300">100 Mbps</span>
              </div>
              <div className="text-xs text-slate-400">Asignado por PCC: Hash 0 (3:0)</div>
              <div className="text-[11px] text-slate-500 font-mono">Enlace Terrestre Principal</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 font-bold">WAN 2 • Starlink</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">150 Mbps</span>
              </div>
              <div className="text-xs text-slate-400">Asignado por PCC: Hash 1 (3:1)</div>
              <div className="text-[11px] text-slate-500 font-mono">Enlace Satelital de Alta Velocidad</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-violet-400 font-bold">WAN 3 • Tachicom</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-violet-500/15 text-violet-300">80 Mbps</span>
              </div>
              <div className="text-xs text-slate-400">Asignado por PCC: Hash 2 (3:2)</div>
              <div className="text-[11px] text-slate-500 font-mono">Enlace Inalámbrico de Respaldo</div>
            </div>
          </div>

          {/* Tabla de Flujos Activos Asignados */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="text-xs font-mono font-bold text-white uppercase">
              Conexiones TCP Concurrente Distribuidas por MikroTik:
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {flows.map((fl) => (
                  <motion.div
                    key={fl.id}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="text-white font-bold">{fl.usuario}</span>
                      <span className="text-slate-400 mx-2">→</span>
                      <span className="text-slate-300">{fl.destino}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[11px]">{fl.hash}</span>
                      <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 font-bold">
                        {fl.isp} ({fl.velocidad})
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: SIMULADOR DHCP RELAY EN CISCO CATALYST C9200 */}
      {activeTab === 'dhcp' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-blue-300 font-bold uppercase">
                Problema de Capa 2 vs. Capa 3 en la Escuela:
              </span>
              <p className="text-xs text-slate-300 mt-1">
                El servidor DHCP reside en la <strong>VLAN 10</strong> (172.16.10.14), mientras que los clientes están en VLAN 20, 30 y 50. Como los broadcasts <code className="font-mono text-cyan-300">UDP 67/68</code> no cruzan routers, se requiere obligatoriamente <code className="font-mono text-cyan-300">ip helper-address</code> en el Cisco Catalyst C9200.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setHelperAddressEnabled(!helperAddressEnabled)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  helperAddressEnabled
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                }`}
              >
                ip helper-address: {helperAddressEnabled ? 'CONFIGURADO' : 'APAGADO'}
              </button>

              <button
                onClick={testDhcp}
                className="px-4 py-2 rounded-xl bg-blue-500 text-white font-mono text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer whitespace-nowrap"
              >
                Probar DHCP Discover
              </button>
            </div>
          </div>

          {/* Resultado de la Prueba */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            {dhcpStatus === 'idle' && (
              <div className="text-xs text-slate-400 font-mono">
                Presiona "Probar DHCP Discover" para simular la solicitud de una PC en VLAN 20.
              </div>
            )}

            {dhcpStatus === 'discovering' && (
              <div className="text-xs text-blue-400 font-mono animate-pulse">
                Transmitiendo broadcast UDP 0.0.0.0:68 → 255.255.255.255:67 hacia la interfaz VLAN del C9200...
              </div>
            )}

            {dhcpStatus === 'success' && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono space-y-1">
                <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" /> ¡IP ASIGNADA CON ÉXITO!
                </div>
                <div>El Catalyst C9200 transformó el broadcast L2 en Unicast L3 hacia 172.16.10.14.</div>
                <div className="text-slate-300">Cliente recibe: IP 172.16.20.45 / Máscara 255.255.255.0 / Gateway 172.16.20.1.</div>
              </div>
            )}

            {dhcpStatus === 'failed' && (
              <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono space-y-1">
                <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                  <XCircle className="w-4 h-4" /> ¡ERROR: BROADCAST DESCARTADO POR EL ROUTER!
                </div>
                <div>Al no existir ip helper-address, el switch L3 no reenvió la solicitud a la VLAN 10.</div>
                <div className="text-slate-300">El cliente queda con dirección APIPA (169.254.x.x) y sin conectividad.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
