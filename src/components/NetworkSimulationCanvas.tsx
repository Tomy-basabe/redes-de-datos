import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, 
  Shield, 
  Router as RouterIcon, 
  Laptop, 
  Wifi, 
  Play, 
  RotateCcw, 
  AlertOctagon, 
  CheckCircle, 
  ArrowRight,
  Database,
  Globe
} from 'lucide-react';
import { SERVICIOS_ESCUELA, EQUIPAMIENTO_CORE } from '../data/reportData';

export interface PacketLog {
  id: string;
  timestamp: string;
  protocolo: 'TCP' | 'UDP';
  origen: string;
  destino: string;
  puertoOrigen: number;
  puertoDestino: number;
  flags?: string;
  info: string;
  estado: 'exito' | 'bloqueado' | 'retransmision' | 'en_transito';
}

interface NetworkSimulationCanvasProps {
  onPacketLogged?: (packet: PacketLog) => void;
}

export const NetworkSimulationCanvas: React.FC<NetworkSimulationCanvasProps> = ({ onPacketLogged }) => {
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);
  const [packetProgress, setPacketProgress] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<string>('c9200');

  const runSimulation = (tipo: 'web' | 'samba' | 'dhcp' | 'dns' | 'bloqueo_acl') => {
    setActiveSimulation(tipo);
    setPacketProgress(0);

    const now = new Date().toLocaleTimeString();

    if (tipo === 'web') {
      const p1: PacketLog = {
        id: Math.random().toString(),
        timestamp: now,
        protocolo: 'TCP',
        origen: '172.16.20.10 (Estudiante VLAN 20)',
        destino: '172.16.10.12 (Nginx VLAN 10)',
        puertoOrigen: 53120,
        puertoDestino: 443,
        flags: 'SYN, ACK',
        info: 'Handshake HTTPS completado. Solicitud GET /campus.',
        estado: 'exito'
      };
      onPacketLogged?.(p1);

      setTimeout(() => {
        const p2: PacketLog = {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          protocolo: 'TCP',
          origen: '172.16.10.12 (Nginx Proxy)',
          destino: '172.16.10.11 (Apache Backend)',
          puertoOrigen: 41890,
          puertoDestino: 8080,
          flags: 'PSH, ACK',
          info: 'Doble Salto Proxy Inverso: Nginx abre segunda sesión TCP hacia Apache:8080.',
          estado: 'exito'
        };
        onPacketLogged?.(p2);
      }, 1200);
    } else if (tipo === 'bloqueo_acl') {
      const p: PacketLog = {
        id: Math.random().toString(),
        timestamp: now,
        protocolo: 'TCP',
        origen: '172.16.20.10 (Estudiante VLAN 20)',
        destino: '172.16.10.11 (Apache VLAN 10)',
        puertoOrigen: 53200,
        puertoDestino: 8080,
        flags: 'RST, ACK',
        info: 'DENEGADO POR ACL L3: Cisco Catalyst C9200 descarta conexión directa al puerto 8080.',
        estado: 'bloqueado'
      };
      onPacketLogged?.(p);
    } else if (tipo === 'samba') {
      const p: PacketLog = {
        id: Math.random().toString(),
        timestamp: now,
        protocolo: 'TCP',
        origen: '172.16.30.15 (Docente VLAN 30)',
        destino: '172.16.10.13 (Samba VLAN 10)',
        puertoOrigen: 49850,
        puertoDestino: 445,
        flags: 'ACK',
        info: 'Transferencia de archivo SMB: TCP asegura entrega sin pérdida ni corrupción.',
        estado: 'exito'
      };
      onPacketLogged?.(p);
    } else if (tipo === 'dhcp') {
      const p: PacketLog = {
        id: Math.random().toString(),
        timestamp: now,
        protocolo: 'UDP',
        origen: '0.0.0.0:68 (Cliente)',
        destino: '255.255.255.255:67 -> 172.16.10.14:67',
        puertoOrigen: 68,
        puertoDestino: 67,
        info: 'DHCP Discover: C9200 convierte Broadcast L2 en Unicast vía ip helper-address.',
        estado: 'exito'
      };
      onPacketLogged?.(p);
    } else if (tipo === 'dns') {
      const p: PacketLog = {
        id: Math.random().toString(),
        timestamp: now,
        protocolo: 'UDP',
        origen: '172.16.50.8 (Administración)',
        destino: '208.67.222.222:53 (Cisco OpenDNS)',
        puertoOrigen: 58210,
        puertoDestino: 53,
        info: 'Consulta DNS estándar: mensaje UDP puntual de bajo overhead sin conexión previa.',
        estado: 'exito'
      };
      onPacketLogged?.(p);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-slate-950 border border-slate-800 p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Fondo técnico interactivo con rejilla */}
      <div className="absolute inset-0 bg-network-grid opacity-30 pointer-events-none" />

      {/* Cabecera del Simulador */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Simulador Dinámico de Flujos L4 en Tiempo Real
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Topología Interactiva • Escuela 4-025 Los Corralitos
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Haz clic en los escenarios inferiores para inyectar tráfico real y observar cómo operan TCP, UDP, las ACLs del Catalyst C9200 y el proxy Nginx.
          </p>
        </div>

        {/* Botonera de Inyección de Tráfico */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => runSimulation('web')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSimulation === 'web'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                : 'bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Navegar HTTPS Web (Nginx 443 → Apache 8080)</span>
          </button>

          <button
            onClick={() => runSimulation('bloqueo_acl')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSimulation === 'bloqueo_acl'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-slate-900 border border-slate-800 text-rose-400 hover:bg-slate-800'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Ataque/Acceso Directo Apache:8080 (Drop ACL)</span>
          </button>

          <button
            onClick={() => runSimulation('samba')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSimulation === 'samba'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                : 'bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Descarga Samba (TCP 445)</span>
          </button>

          <button
            onClick={() => runSimulation('dhcp')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSimulation === 'dhcp'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-900 border border-slate-800 text-blue-400 hover:bg-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>DHCP Relay (UDP 67/68)</span>
          </button>
        </div>
      </div>

      {/* Escenario Visual / Mapa de Nodos */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Columna Izquierda: Clientes VLAN 20, 30, 50 */}
        <div className="lg:col-span-3 space-y-3">
          <div className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider mb-2">
            VLANs de Usuarios (Clientes)
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedNode('vlan20')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeSimulation === 'web' || activeSimulation === 'bloqueo_acl'
                ? 'bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Laptop className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-sm font-bold text-white">VLAN 20 • Estudiantes</div>
                <div className="text-xs text-slate-400 font-mono">172.16.20.10 (PC Alumno)</div>
              </div>
            </div>
            {activeSimulation === 'web' && (
              <div className="mt-2 text-[11px] font-mono text-cyan-300 bg-cyan-950/60 p-1.5 rounded">
                Socket: 172.16.20.10:53120 → Destino: 443
              </div>
            )}
            {activeSimulation === 'bloqueo_acl' && (
              <div className="mt-2 text-[11px] font-mono text-rose-300 bg-rose-950/60 p-1.5 rounded flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" /> Intento directo a TCP 8080
              </div>
            )}
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedNode('vlan30')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeSimulation === 'samba'
                ? 'bg-amber-500/10 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Laptop className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-bold text-white">VLAN 30 • Maestros</div>
                <div className="text-xs text-slate-400 font-mono">172.16.30.15 (PC Docente)</div>
              </div>
            </div>
            {activeSimulation === 'samba' && (
              <div className="mt-2 text-[11px] font-mono text-amber-300 bg-amber-950/60 p-1.5 rounded">
                Socket: 172.16.30.15:49850 → Destino: 445 (SMB)
              </div>
            )}
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedNode('vlan50')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeSimulation === 'dns'
                ? 'bg-violet-500/10 border-violet-400 shadow-md shadow-violet-500/20'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Laptop className="w-5 h-5 text-violet-400" />
              <div>
                <div className="text-sm font-bold text-white">VLAN 50 • Administración</div>
                <div className="text-xs text-slate-400 font-mono">172.16.50.8 (PC Secretaría)</div>
              </div>
            </div>
            {activeSimulation === 'dns' && (
              <div className="mt-2 text-[11px] font-mono text-violet-300 bg-violet-950/60 p-1.5 rounded">
                DNS UDP 53 a Cisco OpenDNS
              </div>
            )}
          </motion.div>
        </div>

        {/* Columna Central: Núcleo L3 (Catalyst C9200) + Firewall Meraki + MikroTik WAN */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-5 relative">
          {/* Nodo Núcleo: Cisco Catalyst C9200 */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            onClick={() => setSelectedNode('c9200')}
            className={`w-full max-w-sm p-5 rounded-2xl border text-center transition-all cursor-pointer relative ${
              selectedNode === 'c9200'
                ? 'bg-cyan-500/15 border-cyan-400 shadow-xl shadow-cyan-500/25 ring-2 ring-cyan-400/30'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto mb-2 border border-cyan-500/30">
              <RouterIcon className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white">Cisco Catalyst C9200</div>
            <div className="text-xs text-cyan-300 font-mono">Núcleo Capa 3 e Inter-VLAN</div>
            <div className="text-[11px] text-slate-300 mt-2 bg-slate-950/70 p-2 rounded-lg border border-slate-800 text-left space-y-1">
              <div>• <strong>ACL L4:</strong> Permite TCP 443 hacia Nginx. Bloquea TCP 8080 directo a Apache.</div>
              <div>• <strong>DHCP Relay:</strong> <code className="text-cyan-300 font-mono">ip helper-address 172.16.10.14</code>.</div>
            </div>

            {/* Efecto visual de paquete atravesando el switch */}
            {activeSimulation && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-mono text-[10px] font-bold"
              >
                PROCESANDO L4
              </motion.div>
            )}
          </motion.div>

          {/* Nodos de Borde: Meraki MX100 y MikroTik */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            <div 
              onClick={() => setSelectedNode('meraki')}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center hover:border-slate-700 cursor-pointer"
            >
              <Shield className="w-5 h-5 text-rose-400 mx-auto mb-1" />
              <div className="text-xs font-bold text-white">Meraki MX100</div>
              <div className="text-[10px] text-slate-400 font-mono">Firewall Perimetral L4</div>
            </div>

            <div 
              onClick={() => setSelectedNode('mikrotik')}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center hover:border-slate-700 cursor-pointer"
            >
              <Globe className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <div className="text-xs font-bold text-white">MikroTik RB750Gr3</div>
              <div className="text-[10px] text-slate-400 font-mono">Balanceo PCC (3 WANs)</div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Servidores VLAN 10 */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider mb-2">
            VLAN 10 • Servidores Institucionales
          </div>

          {/* Nginx */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedNode('nginx')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              activeSimulation === 'web'
                ? 'bg-emerald-500/15 border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Nginx (Proxy Inverso)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                TCP 80 / 443
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">IP: 172.16.10.12</div>
          </motion.div>

          {/* Apache */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedNode('apache')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              activeSimulation === 'web'
                ? 'bg-violet-500/15 border-violet-400 shadow-md shadow-violet-500/20'
                : activeSimulation === 'bloqueo_acl'
                ? 'bg-rose-500/15 border-rose-400 shadow-md shadow-rose-500/20'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-white">Apache (Web Backend)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                TCP 8080 Interno
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">IP: 172.16.10.11 (Solo Nginx permitido)</div>
          </motion.div>

          {/* Samba */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedNode('samba')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              activeSimulation === 'samba'
                ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Samba (Archivos)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                TCP 445
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">IP: 172.16.10.13 (Confiable)</div>
          </motion.div>

          {/* Windows DHCP */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedNode('dhcp')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              activeSimulation === 'dhcp'
                ? 'bg-blue-500/15 border-blue-400 shadow-md shadow-blue-500/20'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">Windows Server DHCP</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                UDP 67
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">IP: 172.16.10.14</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
