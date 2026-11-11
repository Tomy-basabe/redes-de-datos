import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Play, 
  Pause, 
  AlertTriangle, 
  Server, 
  Layers,
  FileText,
  Clock,
  Radio
} from 'lucide-react';
import { SERVICIOS_TRANSPORTE } from '../../data/topologyTp1';

interface PacketSim {
  id: number;
  seq: number;
  status: 'transmitting' | 'acked' | 'lost' | 'retransmitting';
  type: 'TCP' | 'UDP';
  label: string;
}

export const Section2TcpVsUdp: React.FC = () => {
  // Estado para la simulación interactiva dual
  const [activeTab, setActiveTab] = useState<'comparativa' | 'simulador' | 'servicios_tp1'>('comparativa');
  const [simRunning, setSimRunning] = useState<boolean>(false);
  const [lossRate, setLossRate] = useState<number>(30); // % probabilidad de pérdida artificial
  const [tcpPackets, setTcpPackets] = useState<PacketSim[]>([]);
  const [udpPackets, setUdpPackets] = useState<PacketSim[]>([]);
  const [tcpDelivered, setTcpDelivered] = useState<number[]>([]);
  const [udpDelivered, setUdpDelivered] = useState<number[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('nginx');

  const selectedService = SERVICIOS_TRANSPORTE.find((s) => s.id === selectedServiceId) || SERVICIOS_TRANSPORTE[0];

  // Generador de paquetes en simulación dual
  useEffect(() => {
    let interval: any = null;
    if (simRunning) {
      interval = setInterval(() => {
        const nextId = Date.now();
        const seq = (tcpPackets.length + 1) * 100;

        // Decidir si este paquete se perderá aleatoriamente
        const willLose = Math.random() * 100 < lossRate;

        // Agregar paquete TCP
        const newTcp: PacketSim = {
          id: nextId,
          seq: seq,
          status: 'transmitting',
          type: 'TCP',
          label: `TCP Seq ${seq}`
        };

        // Agregar paquete UDP
        const newUdp: PacketSim = {
          id: nextId + 1,
          seq: seq,
          status: 'transmitting',
          type: 'UDP',
          label: `UDP Dgram #${Math.floor(seq / 100)}`
        };

        setTcpPackets((prev) => [...prev.slice(-6), newTcp]);
        setUdpPackets((prev) => [...prev.slice(-6), newUdp]);

        // Manejar llegada o pérdida en TCP vs UDP
        setTimeout(() => {
          if (willLose) {
            // TCP: detecta pérdida y requiere retransmisión
            setTcpPackets((prev) =>
              prev.map((p) => (p.id === nextId ? { ...p, status: 'lost' } : p))
            );
            setTimeout(() => {
              setTcpPackets((prev) =>
                prev.map((p) => (p.id === nextId ? { ...p, status: 'retransmitting' } : p))
              );
              setTimeout(() => {
                setTcpPackets((prev) =>
                  prev.map((p) => (p.id === nextId ? { ...p, status: 'acked' } : p))
                );
                setTcpDelivered((del) => (del.includes(seq) ? del : [...del, seq]));
              }, 800);
            }, 600);

            // UDP: se pierde silenciosamente, no hay recuperación
            setUdpPackets((prev) =>
              prev.map((p) => (p.id === nextId + 1 ? { ...p, status: 'lost' } : p))
            );
          } else {
            // Entrega normal
            setTcpPackets((prev) =>
              prev.map((p) => (p.id === nextId ? { ...p, status: 'acked' } : p))
            );
            setTcpDelivered((del) => (del.includes(seq) ? del : [...del, seq]));

            setUdpPackets((prev) =>
              prev.map((p) => (p.id === nextId + 1 ? { ...p, status: 'acked' } : p))
            );
            setUdpDelivered((del) => (del.includes(seq) ? del : [...del, seq]));
          }
        }, 600);

      }, 1400);
    }
    return () => clearInterval(interval);
  }, [simRunning, lossRate, tcpPackets.length]);

  const resetSim = () => {
    setSimRunning(false);
    setTcpPackets([]);
    setUdpPackets([]);
    setTcpDelivered([]);
    setUdpDelivered([]);
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold block">
            Sección 2 • Mecanismos de Transporte Fundamentales
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold apple-headline text-white mt-1">
            TCP vs UDP: Elección y Comportamiento Dinámico
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-3xl">
            Análisis comparativo de los dos protocolos dominantes de la Capa de Transporte: la confiabilidad orientada a conexión con acuses de TCP frente a la velocidad y mínima sobrecarga sin conexión de UDP.
          </p>
        </div>

        {/* Pestañas de Vista */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <button
            onClick={() => setActiveTab('comparativa')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'comparativa'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Matriz Técnica
          </button>
          <button
            onClick={() => setActiveTab('simulador')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'simulador'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Simulador Dual
          </button>
          <button
            onClick={() => setActiveTab('servicios_tp1')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'servicios_tp1'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Servicios TP1
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: MATRIZ TÉCNICA COMPARATIVA */}
      {activeTab === 'comparativa' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tarjeta TCP */}
            <div className="p-8 rounded-[32px] apple-glass border border-cyan-500/30 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-display">TCP (RFC 793)</h3>
                    <span className="text-xs font-mono text-cyan-300">Transmission Control Protocol</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Orientado a Conexión
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                Ofrece un flujo de bytes estructurado y confiable. Antes de transmitir datos de aplicación, establece un canal lógico mediante el <strong className="text-white">Three-Way Handshake</strong>. Emplea números de secuencia, acuses de recibo acumulativos (ACK), temporizadores de retransmisión (RTO), y mecanismos de control de flujo y congestión.
              </p>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Tamaño de Cabecera:</span>
                  <span className="text-white font-bold">20 a 60 Bytes (con opciones)</span>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Garantía de Entrega:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Confiable (Retransmisión)
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Orden de Segmentos:</span>
                  <span className="text-white font-bold">Estricto por Número de Secuencia</span>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Control de Flujo:</span>
                  <span className="text-cyan-300 font-bold">Sí (Ventana Anunciada rwnd)</span>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Control de Congestión:</span>
                  <span className="text-cyan-300 font-bold">Sí (Ventana cwnd + ssthresh)</span>
                </div>
              </div>
            </div>

            {/* Tarjeta UDP */}
            <div className="p-8 rounded-[32px] apple-glass border border-emerald-500/30 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-display">UDP (RFC 768)</h3>
                    <span className="text-xs font-mono text-emerald-300">User Datagram Protocol</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  No Orientado a Conexión
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                Transmite datagramas atómicos independientes bajo el principio de <strong className="text-white">Mejor Esfuerzo (Best Effort)</strong>. No requiere negociación previa ni almacena estado de sesión en los extremos. Ofrece mínima latencia y overhead, ideal para consultas cortas o tráfico donde perder un paquete es preferible a sufrir retrasos de retransmisión.
              </p>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Tamaño de Cabecera:</span>
                  <span className="text-white font-bold">8 Bytes fijos</span>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Garantía de Entrega:</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> No Confiable (Best Effort)
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Orden de Datagramas:</span>
                  <span className="text-zinc-300 font-bold">No garantizado (pueden desordenarse)</span>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Control de Flujo:</span>
                  <span className="text-zinc-400 font-bold">No posee</span>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Control de Congestión:</span>
                  <span className="text-zinc-400 font-bold">No posee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Decisión Rápida */}
          <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.08] overflow-x-auto">
            <h4 className="text-sm font-bold text-white mb-4 font-display flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Matriz Comparativa de Criterios de Selección en Capa de Transporte
            </h4>
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.08] text-zinc-400">
                  <th className="pb-3 px-3">Criterio Técnico</th>
                  <th className="pb-3 px-3 text-cyan-300">TCP (Transmission Control Protocol)</th>
                  <th className="pb-3 px-3 text-emerald-300">UDP (User Datagram Protocol)</th>
                  <th className="pb-3 px-3 text-zinc-300">Impacto en la Escuela 4-025</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                <tr>
                  <td className="py-3 px-3 font-semibold text-white">Sobrecarga (Header)</td>
                  <td className="py-3 px-3 text-cyan-400 font-bold">20 - 60 Bytes</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">8 Bytes fijos</td>
                  <td className="py-3 px-3">UDP ahorra 60% de overhead en consultas pequeñas (DNS/DHCP).</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-white">Latencia Inicial</td>
                  <td className="py-3 px-3">1 RTT de handshake (SYN, SYN-ACK, ACK)</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">0 RTT (Transmisión inmediata)</td>
                  <td className="py-3 px-3">OpenDNS resuelve en milisegundos sin negociación.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-white">Integridad de Archivos</td>
                  <td className="py-3 px-3 text-cyan-400 font-bold">Garantizada por retransmisión</td>
                  <td className="py-3 px-3 text-amber-400">Sin retransmisión nativa</td>
                  <td className="py-3 px-3">Samba (SMB 445) requiere TCP para no corromper documentos.</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-white">Sobrecarga de Servidor</td>
                  <td className="py-3 px-3">Almacena buffers y estado TCB por socket</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">Stateless (Sin buffers de retransmisión)</td>
                  <td className="py-3 px-3">Servidor DHCP atiende cientos de leases sin saturar memoria.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: SIMULADOR DUAL INTERACTIVO */}
      {activeTab === 'simulador' && (
        <div className="space-y-6">
          {/* Panel de Controles del Simulador */}
          <div className="p-6 rounded-[28px] apple-glass border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSimRunning(!simRunning)}
                className={`px-5 py-2.5 rounded-2xl font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
                  simRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/20'
                }`}
              >
                {simRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {simRunning ? 'Pausar Simulación' : 'Iniciar Transmisión Dual'}
              </button>

              <button
                onClick={resetSim}
                className="px-4 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 font-mono text-xs flex items-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Reiniciar
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">Pérdida de Paquetes Simulada:</span>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="10"
                  value={lossRate}
                  onChange={(e) => setLossRate(Number(e.target.value))}
                  className="w-28 accent-cyan-400"
                />
                <span className="text-xs font-mono font-bold text-cyan-300 w-8">{lossRate}%</span>
              </div>
            </div>
          </div>

          {/* Comparativa Visual de Canales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Canal TCP */}
            <div className="p-6 rounded-[32px] bg-cyan-950/20 border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-bold text-white font-display">Canal TCP (Confiable)</span>
                </div>
                <div className="text-xs font-mono text-cyan-300">
                  Entregados en orden: <strong className="text-white">{tcpDelivered.length}</strong>
                </div>
              </div>

              {/* Animación de Paquetes en Vuelo */}
              <div className="h-48 rounded-2xl bg-black/40 border border-white/[0.05] p-3 flex flex-col justify-between overflow-hidden relative">
                <div className="text-[10px] font-mono text-zinc-500 uppercase flex justify-between">
                  <span>Host Emisor (VLAN 20: 172.16.20.10)</span>
                  <span>Servidor Nginx (VLAN 10: 172.16.10.12)</span>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-2 py-2">
                  {tcpPackets.length === 0 ? (
                    <div className="text-center text-xs font-mono text-zinc-500">
                      Presiona "Iniciar Transmisión Dual" para observar el comportamiento de TCP.
                    </div>
                  ) : (
                    tcpPackets.map((pkt) => (
                      <motion.div
                        key={pkt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-2 rounded-xl text-xs font-mono flex items-center justify-between border ${
                          pkt.status === 'lost'
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : pkt.status === 'retransmitting'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : pkt.status === 'acked'
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                            : 'bg-white/[0.05] border-white/[0.1] text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          <span>{pkt.label}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold">
                          {pkt.status === 'lost' && '⚠️ Pérdida detectada (Retransmitiendo)'}
                          {pkt.status === 'retransmitting' && '🔁 Re-enviando segmento'}
                          {pkt.status === 'acked' && '✓ ACK Recibido y confirmado'}
                          {pkt.status === 'transmitting' && '→ En vuelo hacia el receptor'}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              <div className="text-xs text-zinc-400 font-sans leading-relaxed">
                <strong className="text-white">Comportamiento TCP ante fallas:</strong> Si un segmento se pierde, el receptor genera ACKs duplicados o se dispara el temporizador RTO. El emisor retransmite el paquete faltante asegurando que la aplicación receptora nunca reciba datos truncados.
              </div>
            </div>

            {/* Canal UDP */}
            <div className="p-6 rounded-[32px] bg-emerald-950/20 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white font-display">Canal UDP (Sin Conexión)</span>
                </div>
                <div className="text-xs font-mono text-emerald-300">
                  Datagramas recibidos: <strong className="text-white">{udpDelivered.length}</strong>
                </div>
              </div>

              {/* Animación de Datagramas */}
              <div className="h-48 rounded-2xl bg-black/40 border border-white/[0.05] p-3 flex flex-col justify-between overflow-hidden relative">
                <div className="text-[10px] font-mono text-zinc-500 uppercase flex justify-between">
                  <span>Host Cliente (172.16.20.10)</span>
                  <span>Cisco OpenDNS / DHCP (UDP 53/67)</span>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-2 py-2">
                  {udpPackets.length === 0 ? (
                    <div className="text-center text-xs font-mono text-zinc-500">
                      Presiona "Iniciar Transmisión Dual" para observar el comportamiento de UDP.
                    </div>
                  ) : (
                    udpPackets.map((pkt) => (
                      <motion.div
                        key={pkt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-2 rounded-xl text-xs font-mono flex items-center justify-between border ${
                          pkt.status === 'lost'
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 line-through'
                            : pkt.status === 'acked'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : 'bg-white/[0.05] border-white/[0.1] text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{pkt.label}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold">
                          {pkt.status === 'lost' && '❌ Datagrama descartado (Ignorado)'}
                          {pkt.status === 'acked' && '⚡ Entregado inmediatamente'}
                          {pkt.status === 'transmitting' && '→ Disparado a la red'}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              <div className="text-xs text-zinc-400 font-sans leading-relaxed">
                <strong className="text-white">Comportamiento UDP ante fallas:</strong> Si un datagrama se pierde, no se notifica al emisor ni se pausa el flujo. Si la aplicación requiere reintentos (como una nueva consulta DNS por timeout de la aplicación), debe gestionarlo ella misma.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: SERVICIOS Y DECISIONES TÉCNICAS DEL TP1 */}
      {activeTab === 'servicios_tp1' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {SERVICIOS_TRANSPORTE.map((srv) => {
              const isSelected = selectedServiceId === srv.id;
              return (
                <div
                  key={srv.id}
                  onClick={() => setSelectedServiceId(srv.id)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-500/10'
                      : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-cyan-400" />
                      {srv.nombre}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                        srv.protocolo === 'TCP'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      }`}
                    >
                      {srv.protocolo} :{srv.puerto}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono">{srv.ip}</div>
                  <p className="text-xs text-zinc-300 mt-2 line-clamp-2">{srv.descripcion}</p>
                </div>
              );
            })}
          </div>

          {/* Detalle Explicativo del Servicio Seleccionado */}
          <div className="p-8 rounded-[32px] apple-glass border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">
                  Fundamento Técnico en la Escuela Los Corralitos
                </span>
                <h3 className="text-xl font-bold text-white font-display mt-0.5">
                  {selectedService.nombre} • Protocolo {selectedService.protocolo} en Puerto {selectedService.puerto}
                </h3>
              </div>
              <span className="text-xs font-mono px-3.5 py-1.5 rounded-2xl bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                {selectedService.ip}
              </span>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              <p>
                <strong className="text-white">¿Por qué utiliza {selectedService.protocolo}?</strong>
                <br />
                {selectedService.justificacion}
              </p>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-zinc-300">
                <span className="text-cyan-300 font-bold block mb-1">Regla de Filtrado en Cisco Meraki MX100 / Switch C9200:</span>
                El firewall perimetral y las ACLs del switch núcleo inspeccionan los encabezados L4 permitiendo únicamente el tráfico hacia <code className="text-white">{selectedService.protocolo}/{selectedService.puerto}</code>, bloqueando puertos no autorizados y asegurando la segmentación inter-VLAN.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
