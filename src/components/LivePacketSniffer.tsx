import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, CheckCircle, AlertTriangle, XCircle, Filter, Trash2 } from 'lucide-react';
import { PacketLog } from './NetworkSimulationCanvas';

interface LivePacketSnifferProps {
  packets: PacketLog[];
  onClear: () => void;
}

export const LivePacketSniffer: React.FC<LivePacketSnifferProps> = ({ packets, onClear }) => {
  const [filter, setFilter] = useState<'ALL' | 'TCP' | 'UDP' | 'BLOQUEADO'>('ALL');
  const [selectedPacket, setSelectedPacket] = useState<PacketLog | null>(null);

  const filtered = packets.filter((p) => {
    if (filter === 'TCP') return p.protocolo === 'TCP';
    if (filter === 'UDP') return p.protocolo === 'UDP';
    if (filter === 'BLOQUEADO') return p.estado === 'bloqueado';
    return true;
  });

  return (
    <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Wireshark Terminal • Captura de Paquetes L4 en Vivo
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {filtered.length} frames
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
            {(['ALL', 'TCP', 'UDP', 'BLOQUEADO'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filter === f ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={onClear}
            title="Limpiar captura"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabla de Paquetes */}
      <div className="overflow-x-auto max-h-64 no-scrollbar rounded-xl border border-slate-900">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase border-b border-slate-800 sticky top-0">
            <tr>
              <th className="p-2.5">Tiempo</th>
              <th className="p-2.5">Proto</th>
              <th className="p-2.5">Origen : Puerto</th>
              <th className="p-2.5">Destino : Puerto</th>
              <th className="p-2.5">Flags / Info</th>
              <th className="p-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/80">
            <AnimatePresence>
              {filtered.map((pkt) => (
                <motion.tr
                  key={pkt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedPacket(pkt)}
                  className={`cursor-pointer transition-colors ${
                    selectedPacket?.id === pkt.id
                      ? 'bg-cyan-500/15 text-white'
                      : pkt.estado === 'bloqueado'
                      ? 'bg-rose-950/20 text-rose-300 hover:bg-rose-950/40'
                      : 'hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <td className="p-2.5 text-slate-400 text-[11px]">{pkt.timestamp}</td>
                  <td className="p-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        pkt.protocolo === 'TCP'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {pkt.protocolo}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-200">
                    {pkt.origen}:{pkt.puertoOrigen}
                  </td>
                  <td className="p-2.5 text-slate-200">
                    {pkt.destino}:{pkt.puertoDestino}
                  </td>
                  <td className="p-2.5 truncate max-w-xs text-[11px]">
                    {pkt.flags && <span className="text-amber-300 font-bold mr-1.5">[{pkt.flags}]</span>}
                    {pkt.info}
                  </td>
                  <td className="p-2.5">
                    {pkt.estado === 'exito' && (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle className="w-3 h-3" /> OK
                      </span>
                    )}
                    {pkt.estado === 'bloqueado' && (
                      <span className="text-rose-400 flex items-center gap-1 text-[11px] font-bold">
                        <XCircle className="w-3 h-3" /> ACL DROP
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-500 font-mono">
            No hay paquetes capturados en este filtro. Ejecuta una simulación en el panel superior.
          </div>
        )}
      </div>

      {/* Detalle del Paquete Inspeccionado */}
      {selectedPacket && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-mono space-y-2 text-slate-300"
        >
          <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-slate-800 pb-2">
            <span>Desglose de Capas OSI / TCP/IP (Frame #{selectedPacket.id.slice(0, 5)})</span>
            <button
              onClick={() => setSelectedPacket(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block font-bold">Capa 3 (Red):</span>
              Origen: {selectedPacket.origen}
              <br />
              Destino: {selectedPacket.destino}
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-cyan-400 block font-bold">Capa 4 (Transporte):</span>
              Protocolo: {selectedPacket.protocolo}
              <br />
              Puerto Origen: <span className="text-amber-300">{selectedPacket.puertoOrigen}</span>
              <br />
              Puerto Destino: <span className="text-emerald-300">{selectedPacket.puertoDestino}</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-emerald-400 block font-bold">Diagnóstico:</span>
              {selectedPacket.info}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
