import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop, Globe, Server, FileText, Send, CheckCircle2, Layers } from 'lucide-react';

interface ActiveSocket {
  id: string;
  app: string;
  srcPort: number;
  dstIp: string;
  dstPort: number;
  proto: 'TCP' | 'UDP';
  serviceName: string;
  status: 'ESTABLISHED' | 'ACTIVE';
}

export const MultiplexingInteractive: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('web');
  const [sockets, setSockets] = useState<ActiveSocket[]>([
    {
      id: 'web',
      app: 'Navegador Web (Campus Escolar)',
      srcPort: 53010,
      dstIp: '172.16.10.12',
      dstPort: 443,
      proto: 'TCP',
      serviceName: 'Nginx HTTPS',
      status: 'ESTABLISHED'
    },
    {
      id: 'samba',
      app: 'Explorador de Archivos (Compartidos)',
      srcPort: 53011,
      dstIp: '172.16.10.13',
      dstPort: 445,
      proto: 'TCP',
      serviceName: 'Samba SMB',
      status: 'ESTABLISHED'
    },
    {
      id: 'dns',
      app: 'Resolución de Nombres DNS',
      srcPort: 53012,
      dstIp: '208.67.222.222',
      dstPort: 53,
      proto: 'UDP',
      serviceName: 'Cisco OpenDNS',
      status: 'ACTIVE'
    }
  ]);

  const [activePacketFlow, setActivePacketFlow] = useState<string | null>(null);

  const triggerPacket = (socketId: string) => {
    setActivePacketFlow(socketId);
    setTimeout(() => setActivePacketFlow(null), 1800);
  };

  const currentSocket = sockets.find((s) => s.id === activeTab) || sockets[0];

  return (
    <section id="multiplexacion" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
          Sección 5 del Informe • Concurrencia de Procesos
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold apple-headline text-white">
          Multiplexación y Demultiplexación.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg apple-subheadline">
          Una sola PC administrativa con IP <code className="text-white font-mono font-bold">172.16.50.8</code> puede consultar DNS, transferir archivos por Samba y navegar la web a la vez. La Capa de Transporte entrega cada respuesta a la ventana exacta mediante la tupla de 5 elementos.
        </p>
      </div>

      {/* Ventana de Computadora Interactiva */}
      <div className="p-8 sm:p-12 rounded-[36px] apple-glass border border-white/[0.08] space-y-8 relative overflow-hidden">
        {/* Cabecera de Ventanas de Aplicaciones */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-4">
          {sockets.map((sock) => (
            <button
              key={sock.id}
              onClick={() => setActiveTab(sock.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === sock.id
                  ? 'bg-white/[0.1] text-white border border-white/[0.15] shadow-lg'
                  : 'bg-white/[0.02] text-zinc-400 hover:text-white border border-white/[0.04]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${sock.proto === 'TCP' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
              <span className="font-semibold">{sock.app}</span>
              <span className="text-[10px] text-zinc-500 font-mono">:{sock.srcPort}</span>
            </button>
          ))}
        </div>

        {/* Panel del Socket Activo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Tarjeta del Proceso Local */}
          <div className="lg:col-span-5 p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-zinc-500 font-semibold">Proceso Emisor (PC)</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                {currentSocket.proto}
              </span>
            </div>

            <div className="text-lg font-bold text-white tracking-tight">{currentSocket.app}</div>

            <div className="space-y-2 text-xs font-mono text-zinc-400 pt-2 border-t border-white/[0.06]">
              <div>IP Local: <span className="text-white font-bold">172.16.50.8</span></div>
              <div>Puerto Efímero (OS): <span className="text-cyan-400 font-bold">{currentSocket.srcPort}</span></div>
              <div>Servicio Destino: <span className="text-emerald-400 font-bold">{currentSocket.serviceName} ({currentSocket.dstIp}:{currentSocket.dstPort})</span></div>
            </div>

            <button
              onClick={() => triggerPacket(currentSocket.id)}
              className="w-full mt-2 py-3 rounded-2xl bg-white text-black font-semibold text-xs tracking-wide hover:bg-zinc-200 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-white/10"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Emitir Solicitud de Transporte</span>
            </button>
          </div>

          {/* Animación del Viaje por la Tupla L4 */}
          <div className="lg:col-span-7 p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] space-y-4">
            <span className="text-xs font-mono uppercase text-emerald-400 font-semibold block">
              Tupla de 5 Elementos L4 (Identificador Único del Socket)
            </span>

            <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.04] font-mono text-xs text-zinc-300 space-y-1">
              <div>1. Protocolo: <strong className="text-white">{currentSocket.proto}</strong></div>
              <div>2. IP Origen: <strong className="text-cyan-300">172.16.50.8</strong></div>
              <div>3. Puerto Origen: <strong className="text-cyan-400">{currentSocket.srcPort}</strong> (Efímero)</div>
              <div>4. IP Destino: <strong className="text-emerald-300">{currentSocket.dstIp}</strong></div>
              <div>5. Puerto Destino: <strong className="text-emerald-400">{currentSocket.dstPort}</strong> ({currentSocket.serviceName})</div>
            </div>

            {/* Efecto de Demultiplexación */}
            {activePacketFlow && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-mono flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Demultiplexación exitosa: respuesta entregada con precisión al proceso en el puerto {currentSocket.srcPort} sin interferir con los otros sockets.</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Tabla Netstat en Vivo */}
        <div className="space-y-3 pt-4 border-t border-white/[0.08]">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
            <span>Tabla de Conexiones Activas en el Host (netstat -ano)</span>
            <span>3 sockets concurrentes</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-black/40">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-white/[0.02] text-zinc-500 text-[10px] uppercase border-b border-white/[0.06]">
                <tr>
                  <th className="p-3">Proto</th>
                  <th className="p-3">Dirección Local : Puerto</th>
                  <th className="p-3">Dirección Remota : Puerto</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Aplicación Destino</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sockets.map((s) => (
                  <tr key={s.id} className="text-zinc-300 hover:bg-white/[0.02]">
                    <td className="p-3 text-cyan-400 font-bold">{s.proto}</td>
                    <td className="p-3">172.16.50.8:{s.srcPort}</td>
                    <td className="p-3">{s.dstIp}:{s.dstPort}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.06] text-zinc-300">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-400">{s.app}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
