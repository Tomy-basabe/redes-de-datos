import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  Server, 
  Laptop, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Globe, 
  FileText,
  RotateCcw,
  Play,
  Shuffle
} from 'lucide-react';
import { SERVICIOS_TRANSPORTE } from '../../data/topologyTp1';
import { tabeSpringPill } from '../../lib/tabeChoreography';

interface ActiveSocket {
  id: string;
  app: string;
  clientIp: string;
  clientPort: number;
  serverIp: string;
  serverPort: number;
  protocol: 'TCP' | 'UDP';
  status: 'ESTABLISHED' | 'LISTENING' | 'TIME_WAIT';
}

export const Section9PortsMux: React.FC = () => {
  const [selectedFlow, setSelectedFlow] = useState<'reverse_proxy' | 'multi_client' | 'dhcp_relay'>('reverse_proxy');
  const [step, setStep] = useState<number>(0);

  // Lista de sockets simulados en el host de estudiantes (172.16.20.10)
  const [clientSockets, setClientSockets] = useState<ActiveSocket[]>([
    {
      id: 'sock-1',
      app: 'Navegador Web (Pestaña 1 - Portal Escolar)',
      clientIp: '172.16.20.10',
      clientPort: 53100,
      serverIp: '172.16.10.12',
      serverPort: 443,
      protocol: 'TCP',
      status: 'ESTABLISHED'
    },
    {
      id: 'sock-2',
      app: 'Navegador Web (Pestaña 2 - Recursos)',
      clientIp: '172.16.20.10',
      clientPort: 53101,
      serverIp: '172.16.10.12',
      serverPort: 443,
      protocol: 'TCP',
      status: 'ESTABLISHED'
    },
    {
      id: 'sock-3',
      app: 'Explorador de Archivos (Compartición SMB)',
      clientIp: '172.16.20.10',
      clientPort: 53102,
      serverIp: '172.16.10.13',
      serverPort: 445,
      protocol: 'TCP',
      status: 'ESTABLISHED'
    },
    {
      id: 'sock-4',
      app: 'Cliente DHCP (Concesión inicial IP)',
      clientIp: '0.0.0.0',
      clientPort: 68,
      serverIp: '255.255.255.255',
      serverPort: 67,
      protocol: 'UDP',
      status: 'LISTENING'
    }
  ]);

  const advanceStep = () => {
    setStep((prev) => (prev < 3 ? prev + 1 : 0));
  };

  const resetFlow = () => {
    setStep(0);
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold block">
            Sección 9 • Multiplexación & Arquitectura de Sockets
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold apple-headline text-white mt-1">
            Puertos, Multiplexación y Demultiplexación
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-3xl">
            Cómo la Capa de Transporte permite que múltiples aplicaciones compartan la misma interfaz de red utilizando la <strong className="text-white">5-Tupla (Protocolo, IP Orig, Puerto Orig, IP Dest, Puerto Dest)</strong>, y el análisis del doble salto TCP en el Proxy Inverso Nginx $\rightarrow$ Apache.
          </p>
        </div>

        {/* Selector de Escenario con Resorte FLIP (Pilar 3) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/[0.08] relative">
          {[
            { id: 'reverse_proxy', label: 'Doble Salto Nginx → Apache' },
            { id: 'multi_client', label: 'Multiplexación en Host' },
            { id: 'dhcp_relay', label: 'DHCP Relay en C9200' }
          ].map((item) => {
            const isSelected = selectedFlow === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setSelectedFlow(item.id as any); resetFlow(); }}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer select-none tabe-btn-action ${
                  isSelected ? 'text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="sec9-flow-pill"
                    transition={tabeSpringPill}
                    className="absolute inset-0 rounded-xl bg-cyan-500/20 border border-cyan-400/40 -z-10 shadow-sm"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ESCENARIO 1: DOBLE SALTO TCP INDEPENDIENTE (NGINX PROXY INVERSO -> APACHE BACKEND) */}
      {selectedFlow === 'reverse_proxy' && (
        <div className="p-8 rounded-[36px] apple-glass border border-white/[0.08] space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                <Network className="w-5 h-5 text-cyan-400" />
                Arquitectura de Doble Socket TCP Independiente (To-Be del TP1)
              </h3>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Demostración obligatoria: Nginx no pasa los paquetes L4 directamente; termina una conexión TCP y abre otra completamente nueva hacia Apache.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={advanceStep}
                className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
              >
                <Play className="w-4 h-4" />
                {step === 0 ? 'Paso 1: Conexión Cliente -> Nginx' : step === 1 ? 'Paso 2: Conexión Nginx -> Apache' : step === 2 ? 'Paso 3: Respuesta Inversa' : 'Reiniciar Demostración'}
              </button>
              <button
                onClick={resetFlow}
                className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Diagrama de los 3 Nodos Extremo a Extremo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Nodo 1: Host Estudiante VLAN 20 */}
            <div className="p-6 rounded-[28px] bg-black/40 border border-white/[0.08] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-display">Host Estudiante</h4>
                  <span className="text-xs font-mono text-cyan-300">VLAN 20 (172.16.20.10)</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] font-mono text-xs space-y-1.5">
                <div className="text-zinc-500 text-[10px] uppercase font-bold">Socket L4 Local:</div>
                <div className="text-white font-bold">172.16.20.10:53100</div>
                <div className="text-zinc-400 text-[11px]">Puerto efímero asignado por el OS</div>
              </div>

              <div className={`p-3 rounded-2xl text-xs font-mono border transition-all ${
                step >= 1 ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300' : 'bg-white/[0.02] border-white/[0.06] text-zinc-500'
              }`}>
                Estado Conexión 1: <strong>{step >= 1 ? 'ESTABLISHED (HTTPS)' : 'WAITING'}</strong>
              </div>
            </div>

            {/* Nodo 2: Servidor Nginx (Proxy Inverso VLAN 10) */}
            <div className="p-6 rounded-[28px] bg-cyan-950/20 border border-cyan-500/40 space-y-4 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-display">Servidor Nginx</h4>
                  <span className="text-xs font-mono text-cyan-300">VLAN 10 (172.16.10.12)</span>
                </div>
              </div>

              {/* Los Dos Sockets en Nginx */}
              <div className="space-y-2 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/30">
                  <div className="text-[10px] text-cyan-400 uppercase font-bold">Socket Frontend (Termina TLS):</div>
                  <div className="text-white font-bold">172.16.10.12:443 (LISTEN)</div>
                  <div className="text-[10px] text-zinc-400">Recibe petición del estudiante</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/30">
                  <div className="text-[10px] text-amber-400 uppercase font-bold">Socket Backend (Proxy Clt):</div>
                  <div className="text-white font-bold">172.16.10.12:49820 (EFÍMERO)</div>
                  <div className="text-[10px] text-zinc-400">Abre nueva conexión hacia Apache</div>
                </div>
              </div>

              <div className="text-[11px] font-mono text-zinc-400 bg-white/[0.03] p-2 rounded-xl text-center">
                Termina TCP #1 • Inicia TCP #2
              </div>
            </div>

            {/* Nodo 3: Servidor Apache (Backend Interno VLAN 10) */}
            <div className="p-6 rounded-[28px] bg-black/40 border border-white/[0.08] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-display">Servidor Apache</h4>
                  <span className="text-xs font-mono text-amber-300">VLAN 10 (172.16.10.11)</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] font-mono text-xs space-y-1.5">
                <div className="text-zinc-500 text-[10px] uppercase font-bold">Socket Backend Interno:</div>
                <div className="text-white font-bold">172.16.10.11:8080 (LISTEN)</div>
                <div className="text-zinc-400 text-[11px]">Protegido por ACL en Switch C9200</div>
              </div>

              <div className={`p-3 rounded-2xl text-xs font-mono border transition-all ${
                step >= 2 ? 'bg-amber-500/15 border-amber-400/40 text-amber-300' : 'bg-white/[0.02] border-white/[0.06] text-zinc-500'
              }`}>
                Estado Conexión 2: <strong>{step >= 2 ? 'ESTABLISHED (HTTP Puro)' : 'WAITING'}</strong>
              </div>
            </div>
          </div>

          {/* Explicación Técnica Rigurosa */}
          <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.08] space-y-3">
            <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Por qué el Doble Salto TCP Garantiza Seguridad y Eficiencia (Defensa ante Docente):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-zinc-300 leading-relaxed">
              <p>
                1. <strong className="text-white">Aislamiento de la Conexión de Transporte:</strong> El cliente en la VLAN 20 jamás establece una conexión TCP directa contra el Apache. Esto impide ataques directos al servidor de aplicaciones y permite que Nginx descargue la carga criptográfica SSL/TLS (puerto 443).
              </p>
              <p>
                2. <strong className="text-white">Filtrado Estricto por Puerto:</strong> La ACL del switch núcleo Cisco Catalyst C9200 bloquea cualquier intento de conexión hacia el puerto TCP 8080 que no provenga estrictamente de la IP de Nginx (<code className="text-cyan-300">172.16.10.12</code>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ESCENARIO 2: TABLA DE SOCKETS EN EL HOST CLIENTE */}
      {selectedFlow === 'multi_client' && (
        <div className="p-8 rounded-[36px] apple-glass border border-white/[0.08] space-y-6">
          <div className="border-b border-white/[0.08] pb-4">
            <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Multiplexación en un Mismo Host (VLAN 20: 172.16.20.10)
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Cómo la 5-tupla permite abrir múltiples conexiones concurrentes sin colisión de datos.
            </p>
          </div>

          {/* Tabla de Sockets Activos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.08] text-zinc-400">
                  <th className="pb-3 px-3">Aplicación Local</th>
                  <th className="pb-3 px-3">Proto</th>
                  <th className="pb-3 px-3 text-cyan-300">IP y Puerto Local</th>
                  <th className="pb-3 px-3 text-emerald-300">IP y Puerto Remoto</th>
                  <th className="pb-3 px-3">Estado Socket</th>
                  <th className="pb-3 px-3">Diferenciador 5-Tupla</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                {clientSockets.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-semibold text-white">{s.app}</td>
                    <td className="py-3 px-3 font-bold text-cyan-400">{s.protocol}</td>
                    <td className="py-3 px-3 font-mono text-zinc-200">
                      {s.clientIp}:<strong className="text-cyan-300">{s.clientPort}</strong>
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-200">
                      {s.serverIp}:<strong className="text-emerald-300">{s.serverPort}</strong>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-zinc-400">
                      Puerto origen efímero <strong className="text-white">:{s.clientPort}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-xs font-mono text-zinc-300">
            <strong className="text-cyan-300">Principio de Demultiplexación:</strong> Cuando un paquete llega a la tarjeta de red del host, el kernel examina la cabecera IP y la cabecera L4. Si es TCP, compara los 4 campos (IP Orig, Port Orig, IP Dest, Port Dest) para entregar los bytes a la pestaña exacta del navegador sin cruzarse con la descarga del archivo Samba.
          </div>
        </div>
      )}

      {/* ESCENARIO 3: DHCP RELAY EN CISCO CATALYST C9200 */}
      {selectedFlow === 'dhcp_relay' && (
        <div className="p-8 rounded-[36px] apple-glass border border-white/[0.08] space-y-6">
          <div className="border-b border-white/[0.08] pb-4">
            <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              Mecanismo de Transporte en DHCP Relay (Catalyst C9200)
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Cómo los datagramas UDP 67/68 atraviesan las fronteras de las VLANs mediante el comando <code className="text-emerald-300">ip helper-address 172.16.10.14</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3 font-mono text-xs">
              <div className="text-white font-bold flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-cyan-400" />
                1. Cliente (VLAN 20)
              </div>
              <div className="text-zinc-400 text-[11px]">
                Sin IP configurada. Emite un broadcast a nivel L2 y L3:
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] space-y-1">
                <div>Proto: <strong className="text-emerald-400">UDP</strong></div>
                <div>Origen: 0.0.0.0:68</div>
                <div>Destino: 255.255.255.255:67</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3 font-mono text-xs">
              <div className="text-white font-bold flex items-center gap-1.5">
                <Network className="w-4 h-4 text-cyan-400" />
                2. Switch Cisco C9200 (SVI 20)
              </div>
              <div className="text-zinc-400 text-[11px]">
                Captura el broadcast en su interfaz virtual VLAN 20:
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/20 text-cyan-300 text-[11px]">
                <code>interface Vlan20</code><br />
                <code> ip address 172.16.20.1 255.255.252.0</code><br />
                <code> ip helper-address 172.16.10.14</code>
              </div>
              <div className="text-[10px] text-zinc-400">
                Convierte el broadcast en unicast UDP hacia el servidor.
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3 font-mono text-xs">
              <div className="text-white font-bold flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-400" />
                3. Servidor DHCP (VLAN 10)
              </div>
              <div className="text-zinc-400 text-[11px]">
                Recibe el paquete unicast en su IP:
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] space-y-1">
                <div>IP: 172.16.10.14:67</div>
                <div className="text-emerald-300">Asigna pool de VLAN 20: 172.16.20.0/22</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
