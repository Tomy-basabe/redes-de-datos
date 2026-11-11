import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Shield, Zap, ArrowRight, Check } from 'lucide-react';

export const Header3DScroller: React.FC = () => {
  const [protocol, setProtocol] = useState<'TCP' | 'UDP'>('TCP');
  const [selectedWord, setSelectedWord] = useState<number>(0);
  const [flags, setFlags] = useState({
    SYN: true,
    ACK: false,
    FIN: false,
    RST: false,
    PSH: false,
    URG: false,
  });

  const toggleFlag = (flagName: keyof typeof flags) => {
    setFlags((prev) => ({ ...prev, [flagName]: !prev[flagName] }));
  };

  const tcpWords = [
    {
      word: 0,
      title: 'Palabra 0 (Bits 0 a 31)',
      left: { name: 'Source Port (16 bits)', desc: 'Puerto efímero asignado por el cliente (ej. 53000 en VLAN 20).' },
      right: { name: 'Destination Port (16 bits)', desc: 'Puerto bien conocido del servicio (443 Nginx, 445 Samba).' }
    },
    {
      word: 1,
      title: 'Palabra 1 (Bits 32 a 63)',
      full: { name: 'Sequence Number (32 bits)', desc: 'Número de secuencia acumulativo para ordenar y reensamblar cada byte transferido.' }
    },
    {
      word: 2,
      title: 'Palabra 2 (Bits 64 a 95)',
      full: { name: 'Acknowledgment Number (32 bits)', desc: 'Indica el próximo byte que el receptor espera, confirmando la recepción íntegra.' }
    },
    {
      word: 3,
      title: 'Palabra 3 (Bits 96 a 127)',
      left: { name: 'Data Offset & Reserved (8 bits)', desc: 'Longitud del encabezado (mínimo 5 palabras de 32 bits = 20 bytes).' },
      right: { name: 'Control Flags (9 bits)', desc: 'Banderas de control: SYN, ACK, FIN, RST, PSH, URG.' }
    },
    {
      word: 4,
      title: 'Palabra 4 (Bits 128 a 159)',
      left: { name: 'Window Size rwnd (16 bits)', desc: 'Ventana de recepción para el Control de Flujo (anuncia el espacio en buffer).' },
      right: { name: 'Checksum & Urgent (16 bits)', desc: 'Suma de verificación matemática para detectar alteraciones en los enlaces.' }
    }
  ];

  return (
    <section id="segmento-rfc" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
      {/* Encabezado de Sección */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
          Anatomía de Transporte • RFC 793 vs. RFC 768
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold apple-headline text-white">
          Desensamble del Segmento.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg apple-subheadline">
          El encabezado no es un contenedor genérico. Cada bit cumple una función matemática estricta para garantizar la entrega de archivos en Samba o la velocidad instantánea de DNS.
        </p>

        {/* Selector de Protocolo Estilo Apple Segmented Control */}
        <div className="inline-flex p-1 rounded-full bg-white/[0.05] border border-white/[0.08] mt-4">
          <button
            onClick={() => setProtocol('TCP')}
            className={`px-6 py-2 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer ${
              protocol === 'TCP'
                ? 'bg-white text-black shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            TCP • Confiable (20 Bytes)
          </button>
          <button
            onClick={() => setProtocol('UDP')}
            className={`px-6 py-2 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer ${
              protocol === 'UDP'
                ? 'bg-white text-black shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            UDP • Datagrama (8 Bytes)
          </button>
        </div>
      </div>

      {protocol === 'TCP' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Palabras de 32 bits del Encabezado TCP */}
          <div className="lg:col-span-7 space-y-3">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
              Estructura de 32 Bits en Capa de Transporte (TCP Header)
            </div>

            {tcpWords.map((item, idx) => {
              const isSelected = selectedWord === idx;
              return (
                <motion.div
                  key={idx}
                  onClick={() => setSelectedWord(idx)}
                  whileHover={{ scale: 1.01 }}
                  className={`p-4 rounded-[24px] apple-glass border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-400/80 bg-white/[0.06] shadow-xl shadow-cyan-500/10'
                      : 'border-white/[0.06] hover:border-white/[0.14]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-zinc-400">{item.title}</span>
                    <span className="text-[11px] text-cyan-400 font-bold">Word #{idx}</span>
                  </div>

                  {item.full ? (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] text-xs font-mono text-white font-semibold">
                      {item.full.name}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-xs font-mono text-white truncate font-semibold">
                        {item.left?.name}
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-xs font-mono text-white truncate font-semibold">
                        {item.right?.name}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Columna Derecha: Inspector Interactivo & Control de Flags */}
          <div className="lg:col-span-5 space-y-6">
            {/* Tarjeta de Inspección */}
            <div className="p-6 rounded-[32px] apple-glass border border-white/[0.08] space-y-4">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block font-semibold">
                Inspección del Bloque Seleccionado
              </span>
              <h4 className="text-xl font-bold text-white tracking-tight">
                {tcpWords[selectedWord].title}
              </h4>

              <div className="space-y-3 text-xs font-mono text-zinc-300">
                {tcpWords[selectedWord].full ? (
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.04]">
                    <div className="text-white font-bold">{tcpWords[selectedWord].full?.name}</div>
                    <div className="text-zinc-400 mt-1 leading-relaxed">{tcpWords[selectedWord].full?.desc}</div>
                  </div>
                ) : (
                  <>
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.04]">
                      <div className="text-white font-bold">{tcpWords[selectedWord].left?.name}</div>
                      <div className="text-zinc-400 mt-1 leading-relaxed">{tcpWords[selectedWord].left?.desc}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.04]">
                      <div className="text-white font-bold">{tcpWords[selectedWord].right?.name}</div>
                      <div className="text-zinc-400 mt-1 leading-relaxed">{tcpWords[selectedWord].right?.desc}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Simulador Interactivo de Banderas TCP (Control Flags) */}
            <div className="p-6 rounded-[32px] apple-glass border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Banderas de Control TCP
                </span>
                <span className="text-[11px] font-mono text-zinc-500">Toca para conmutar</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(flags) as Array<keyof typeof flags>).map((fl) => {
                  const isActive = flags[fl];
                  return (
                    <button
                      key={fl}
                      onClick={() => toggleFlag(fl)}
                      className={`p-3 rounded-2xl border text-center font-mono text-xs font-bold transition-all cursor-pointer select-none ${
                        isActive
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                          : 'bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <div className="text-sm">{fl}</div>
                      <div className="text-[10px] mt-0.5">{isActive ? '1 (SET)' : '0 (OFF)'}</div>
                    </button>
                  );
                })}
              </div>

              {/* Diagnóstico en tiempo real del estado de conexión */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-xs font-mono text-zinc-300">
                <span className="text-zinc-500 block text-[10px] uppercase">Estado Resultante:</span>
                {flags.SYN && !flags.ACK && <span className="text-cyan-400 font-bold">Inicio de Sesión (SYN Handshake)</span>}
                {flags.SYN && flags.ACK && <span className="text-emerald-400 font-bold">Respuesta del Servidor (SYN-ACK)</span>}
                {!flags.SYN && flags.ACK && !flags.FIN && <span className="text-zinc-200">Transferencia de Datos Confiable (ACK)</span>}
                {flags.FIN && <span className="text-amber-400 font-bold">Cierre Ordenado de Conexión (FIN)</span>}
                {flags.RST && <span className="text-rose-400 font-bold">¡Reinicio/Rechazo Forzado! (Drop ACL o Puerto Cerrado)</span>}
                {!flags.SYN && !flags.ACK && !flags.FIN && !flags.RST && <span className="text-zinc-500">Segmento Inerte / Sin Banderas</span>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA UDP: Simple, sin conexión, 8 bytes */
        <div className="max-w-3xl mx-auto p-8 rounded-[36px] apple-glass border border-white/[0.08] space-y-6 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-sky-500/10 text-sky-400 mb-2">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            UDP: Fijo de 8 Bytes. Cero Sobrecarga.
          </h3>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Sin números de secuencia, sin confirmaciones ACK, sin control de congestión. En la Escuela Los Corralitos se utiliza para <strong>Windows DHCP (UDP 67/68)</strong> y <strong>Cisco OpenDNS (UDP 53)</strong> para lograr resolución inmediata sin negociación de enlaces.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left font-mono text-xs pt-4">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-zinc-500 block text-[10px]">16 BITS</span>
              <div className="text-white font-bold mt-1">Source Port</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Puerto emisor</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-zinc-500 block text-[10px]">16 BITS</span>
              <div className="text-white font-bold mt-1">Dest Port</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Puerto receptor</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-zinc-500 block text-[10px]">16 BITS</span>
              <div className="text-white font-bold mt-1">Length</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Longitud total</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-zinc-500 block text-[10px]">16 BITS</span>
              <div className="text-white font-bold mt-1">Checksum</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Detección de error</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
