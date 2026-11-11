import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, 
  Layers, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Play, 
  Database,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface SegmentChunk {
  index: number;
  seqStart: number;
  seqEnd: number;
  bytes: number;
  received: boolean;
  orderReceived: number;
}

export const Section3Segmentation: React.FC = () => {
  // Configuración de la carga útil a segmentar
  const [fileSize, setFileSize] = useState<number>(4380); // 3 segmentos exactos de 1460 B
  const [mss, setMss] = useState<number>(1460); // MSS estándar Ethernet
  const [selectedHeaderTab, setSelectedHeaderTab] = useState<'tcp' | 'udp'>('tcp');
  const [selectedField, setSelectedField] = useState<string>('seq');

  // Estado de la simulación de reensamblado
  const [isAssembling, setIsAssembling] = useState<boolean>(false);
  const [segments, setSegments] = useState<SegmentChunk[]>([]);
  const [assembledBuffer, setAssembledBuffer] = useState<SegmentChunk[]>([]);

  // Inicializar o recalcular segmentos
  const calculateSegments = (totalBytes: number, segmentMss: number) => {
    const totalSegments = Math.ceil(totalBytes / segmentMss);
    const segList: SegmentChunk[] = [];
    let currentSeq = 1;

    for (let i = 0; i < totalSegments; i++) {
      const bytesInThisSeg = Math.min(segmentMss, totalBytes - (currentSeq - 1));
      segList.push({
        index: i + 1,
        seqStart: currentSeq,
        seqEnd: currentSeq + bytesInThisSeg - 1,
        bytes: bytesInThisSeg,
        received: false,
        orderReceived: 0
      });
      currentSeq += bytesInThisSeg;
    }
    setSegments(segList);
    setAssembledBuffer([]);
    setIsAssembling(false);
  };

  // Ejecutar segmentación inicial
  React.useEffect(() => {
    calculateSegments(fileSize, mss);
  }, [fileSize, mss]);

  // Simular envío y recepción desordenada (out-of-order) para demostrar reordenamiento por Seq
  const simulateArrival = () => {
    setIsAssembling(true);
    setAssembledBuffer([]);

    // Clonar lista y generar un orden de llegada arbitrario (ej. llega el 2, luego el 1, luego el 3)
    const arrivalOrder = segments.map((s) => s.index);
    if (arrivalOrder.length > 1) {
      // Intercambiar los primeros dos para simular desorden
      const temp = arrivalOrder[0];
      arrivalOrder[0] = arrivalOrder[1];
      arrivalOrder[1] = temp;
    }

    arrivalOrder.forEach((segIdx, step) => {
      setTimeout(() => {
        setSegments((prev) =>
          prev.map((s) =>
            s.index === segIdx ? { ...s, received: true, orderReceived: step + 1 } : s
          )
        );

        // En el receptor, se reordena automáticamente según el número de secuencia
        setAssembledBuffer((prev) => {
          const target = segments.find((s) => s.index === segIdx);
          if (!target) return prev;
          const updated = [...prev, { ...target, received: true, orderReceived: step + 1 }];
          // Ordenamiento estricto por Seq
          return updated.sort((a, b) => a.seqStart - b.seqStart);
        });

        if (step === arrivalOrder.length - 1) {
          setIsAssembling(false);
        }
      }, (step + 1) * 900);
    });
  };

  const resetAssembly = () => {
    calculateSegments(fileSize, mss);
  };

  // Diccionario explicativo de campos de cabecera
  const TCP_FIELDS_INFO: Record<string, { name: string; bits: string; desc: string; role: string }> = {
    ports: {
      name: 'Puertos Origen y Destino',
      bits: '16 bits cada uno (32 bits en total)',
      desc: 'Identifican el socket local y el proceso remoto. El puerto origen suele ser efímero (p.ej. 53000 de un estudiante) y el destino el servicio de red (p.ej. 443 Nginx o 445 Samba).',
      role: 'Multiplexación y Demultiplexación en la capa L4.'
    },
    seq: {
      name: 'Sequence Number (Número de Secuencia)',
      bits: '32 bits (0 a 4.294.967.295)',
      desc: 'Indica la posición del primer byte de datos de este segmento en el flujo total de la sesión. Permite detectar pérdidas, duplicados y reconstruir el archivo en orden exacto.',
      role: 'Garantía de entrega secuencial y reensamblado estricto.'
    },
    ack: {
      name: 'Acknowledgment Number (Número de Acuse de Recibo)',
      bits: '32 bits',
      desc: 'Válido cuando el flag ACK está activo. Especifica el SIGUIENTE número de secuencia que el receptor espera recibir. Confirma todos los bytes anteriores (ACK acumulativo).',
      role: 'Confiabilidad y confirmación de recepción.'
    },
    offset: {
      name: 'Data Offset / HLEN & Flags de Control',
      bits: '4 bits (longitud cabecera) + 9 bits flags',
      desc: 'Data Offset indica el tamaño de la cabecera en palabras de 32 bits (mínimo 5 = 20B). Los flags (SYN, ACK, FIN, RST, PSH, URG) controlan el ciclo de vida del canal.',
      role: 'Señalización de conexión, control y segmentación.'
    },
    window: {
      name: 'Window Size (Ventana de Recepción rwnd)',
      bits: '16 bits (hasta 65.535 bytes, expandible con Window Scale RFC 1323)',
      desc: 'El receptor comunica cuántos bytes tiene disponibles en su búfer de memoria para recibir sin saturarse. Si llega a 0, el emisor debe pausar la transmisión.',
      role: 'Control de flujo para evitar sobrecargar al receptor.'
    },
    checksum: {
      name: 'Checksum de Transporte',
      bits: '16 bits',
      desc: 'Suma de comprobación en complemento a 1 de la cabecera TCP, los datos y una pseudocabecera IP con las direcciones origen/destino. Detecta bits corruptos durante el viaje.',
      role: 'Detección obligatoria de errores extremo a extremo.'
    }
  };

  const UDP_FIELDS_INFO: Record<string, { name: string; bits: string; desc: string; role: string }> = {
    ports: {
      name: 'Puertos Origen y Destino UDP',
      bits: '16 bits cada uno (32 bits en total)',
      desc: 'Direccionan el datagrama hacia el proceso correcto (p.ej. cliente DHCP puerto 68 hacia servidor DHCP puerto 67, o consulta hacia OpenDNS puerto 53).',
      role: 'Multiplexación de datagramas independientes.'
    },
    length: {
      name: 'Longitud del Datagrama (Length)',
      bits: '16 bits',
      desc: 'Indica la longitud total del datagrama UDP en bytes, incluyendo los 8 bytes de cabecera más la carga útil (Payload). Mínimo valor: 8 bytes (sin datos).',
      role: 'Delimitación del paquete de transporte.'
    },
    checksum: {
      name: 'Checksum UDP',
      bits: '16 bits',
      desc: 'Suma en complemento a 1 similar a TCP con pseudocabecera IP. En IPv4 es opcional (puede valer 0), pero en IPv6 y en redes modernas es mandatorio para descartar paquetes dañados.',
      role: 'Detección básica de errores por bit flip.'
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold block">
            Sección 3 • Del Flujo de Aplicación a la Red
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold apple-headline text-white mt-1">
            Segmentación, Encabezados y Reensamblado
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-3xl">
            Demostración visual de cómo la Capa de Transporte fragmenta los datos de aplicación en bloques adaptados al MSS (1460 Bytes) sobre MTU Ethernet (1500 Bytes), y cómo el receptor reconstruye el archivo original a partir de los números de secuencia.
          </p>
        </div>

        <div className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/30">
          MTU 1500 B • MSS 1460 B
        </div>
      </div>

      {/* BLOQUE 1: SIMULADOR DE SEGMENTACIÓN Y REENSAMBLADO INTERACTIVO */}
      <div className="p-8 rounded-[36px] apple-glass border border-white/[0.08] space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
              <Scissors className="w-5 h-5 text-cyan-400" />
              Proceso de Segmentación de Carga Útil (VLAN 50 Administración $\rightarrow$ Samba)
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Simulemos el envío de un documento escolar alojado en Samba (<code className="text-cyan-300">172.16.10.13:445</code>).
            </p>
          </div>

          {/* Controles de Entrada */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-2xl border border-white/[0.08]">
              <span className="text-xs font-mono text-zinc-400">Tamaño de Archivo:</span>
              <select
                value={fileSize}
                onChange={(e) => setFileSize(Number(e.target.value))}
                className="bg-transparent text-white font-mono text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value={1460} className="bg-slate-900">1460 B (1 Segmento exacto)</option>
                <option value={2920} className="bg-slate-900">2920 B (2 Segmentos exactos)</option>
                <option value={4380} className="bg-slate-900">4380 B (3 Segmentos exactos)</option>
                <option value={5000} className="bg-slate-900">5000 B (3 Segmentos + 1 Residual de 620B)</option>
              </select>
            </div>

            <button
              onClick={simulateArrival}
              disabled={isAssembling}
              className="px-5 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Play className="w-4 h-4" /> Simular Transmisión y Reensamblado
            </button>

            <button
              onClick={resetAssembly}
              className="p-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Diagrama de Fragmentación en el Emisor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">
              1. Búfer del Emisor: Carga total de <strong className="text-white">{fileSize} Bytes</strong> segmentada en MSS = {mss} B:
            </span>
            <span className="text-cyan-300">
              Total: <strong>{segments.length}</strong> segmento(s) TCP
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {segments.map((seg) => (
              <div
                key={seg.index}
                className={`p-4 rounded-2xl border transition-all ${
                  seg.received
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-white/[0.03] border-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-white">Segmento #{seg.index}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-cyan-300">
                    {seg.bytes} Bytes
                  </span>
                </div>
                <div className="space-y-1 text-xs font-mono text-zinc-400">
                  <div className="flex justify-between">
                    <span>Seq Inicial:</span>
                    <strong className="text-white">{seg.seqStart}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Seq Final:</span>
                    <strong className="text-white">{seg.seqEnd}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/[0.05]">
                    <span>Estado:</span>
                    <strong className={seg.received ? 'text-emerald-400' : 'text-amber-400'}>
                      {seg.received ? `Recibido (Orden #${seg.orderReceived})` : 'En cola de envío'}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagrama de Reensamblado en el Receptor */}
        <div className="p-6 rounded-[28px] bg-black/40 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white font-display">
                2. Búfer de Reensamblado del Receptor (Servidor Samba 172.16.10.13)
              </h4>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Bytes Reensamblados: <strong className="text-emerald-400">{assembledBuffer.reduce((acc, s) => acc + s.bytes, 0)}</strong> / {fileSize} B
            </span>
          </div>

          {assembledBuffer.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-zinc-500 border border-dashed border-white/[0.1] rounded-2xl">
              Presiona "Simular Transmisión" para observar la llegada de paquetes y el reordenamiento secuencial en el receptor.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 overflow-x-auto py-2">
                {assembledBuffer.map((seg, i) => (
                  <motion.div
                    key={seg.index}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex-1 min-w-[200px] p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between text-emerald-300 font-bold mb-1">
                      <span>Bloque #{seg.index} Ordenado</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-[11px] text-zinc-300">
                      Rango de Bytes: [{seg.seqStart} - {seg.seqEnd}]
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">
                      Llegó en el paso temporal #{seg.orderReceived} (Reordenado por Seq)
                    </div>
                  </motion.div>
                ))}
              </div>

              {assembledBuffer.length === segments.length && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Archivo reconstruido íntegramente al 100%. Los {fileSize} bytes fueron entregados a la capa de aplicación sin duplicados ni huecos.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BLOQUE 2: ANATOMÍA INTERACTIVA DE ENCABEZADOS (TCP 20-60B vs UDP 8B) */}
      <div className="p-8 rounded-[36px] apple-glass border border-white/[0.08] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <h3 className="text-xl font-bold text-white font-display">
              Anatomía de los Encabezados de la Capa de Transporte
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Haz clic en cualquier campo para inspeccionar su estructura de bits y su función en la red.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <button
              onClick={() => {
                setSelectedHeaderTab('tcp');
                setSelectedField('seq');
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-mono transition-all ${
                selectedHeaderTab === 'tcp'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cabecera TCP (20-60 Bytes)
            </button>
            <button
              onClick={() => {
                setSelectedHeaderTab('udp');
                setSelectedField('ports');
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-mono transition-all ${
                selectedHeaderTab === 'udp'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cabecera UDP (8 Bytes Fijos)
            </button>
          </div>
        </div>

        {/* Visualizador de la Matriz de 32 Bits */}
        {selectedHeaderTab === 'tcp' ? (
          <div className="space-y-4">
            <div className="flex justify-between text-[11px] font-mono text-zinc-500 px-1">
              <span>Bit 0</span>
              <span>Bit 15</span>
              <span>Bit 16</span>
              <span>Bit 31</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {/* Fila 1: Puertos */}
              <div
                onClick={() => setSelectedField('ports')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedField === 'ports'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                    : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:border-white/[0.2]'
                }`}
              >
                <span className="w-1/2 text-center border-r border-white/[0.1] pr-2">
                  Puerto Origen (16 bits)
                </span>
                <span className="w-1/2 text-center pl-2">Puerto Destino (16 bits)</span>
              </div>

              {/* Fila 2: Sequence Number */}
              <div
                onClick={() => setSelectedField('seq')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center ${
                  selectedField === 'seq'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                    : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:border-white/[0.2]'
                }`}
              >
                Sequence Number (32 bits)
              </div>

              {/* Fila 3: Acknowledgment Number */}
              <div
                onClick={() => setSelectedField('ack')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center ${
                  selectedField === 'ack'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                    : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:border-white/[0.2]'
                }`}
              >
                Acknowledgment Number (32 bits)
              </div>

              {/* Fila 4: Offset, Flags y Ventana */}
              <div className="grid grid-cols-12 gap-2">
                <div
                  onClick={() => setSelectedField('offset')}
                  className={`col-span-6 p-3 rounded-2xl border cursor-pointer transition-all text-center ${
                    selectedField === 'offset'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                      : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:border-white/[0.2]'
                  }`}
                >
                  Offset (4b) + Res (3b) + Flags [SYN, ACK, FIN, RST...] (9b)
                </div>
                <div
                  onClick={() => setSelectedField('window')}
                  className={`col-span-6 p-3 rounded-2xl border cursor-pointer transition-all text-center ${
                    selectedField === 'window'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                      : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:border-white/[0.2]'
                  }`}
                >
                  Window Size (rwnd) (16 bits)
                </div>
              </div>

              {/* Fila 5: Checksum y Puntero Urgente */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => setSelectedField('checksum')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all text-center ${
                    selectedField === 'checksum'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                      : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:border-white/[0.2]'
                  }`}
                >
                  Checksum (16 bits)
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-zinc-500">
                  Urgent Pointer (16 bits)
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Visualizador de la Matriz UDP */
          <div className="space-y-4">
            <div className="flex justify-between text-[11px] font-mono text-zinc-500 px-1">
              <span>Bit 0</span>
              <span>Bit 15</span>
              <span>Bit 16</span>
              <span>Bit 31</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {/* Fila 1 UDP: Puertos */}
              <div
                onClick={() => setSelectedField('ports')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedField === 'ports'
                    ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold'
                    : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:border-white/[0.2]'
                }`}
              >
                <span className="w-1/2 text-center border-r border-white/[0.1] pr-2">
                  Puerto Origen (16 bits)
                </span>
                <span className="w-1/2 text-center pl-2">Puerto Destino (16 bits)</span>
              </div>

              {/* Fila 2 UDP: Longitud y Checksum */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => setSelectedField('length')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all text-center ${
                    selectedField === 'length'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold'
                      : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:border-white/[0.2]'
                  }`}
                >
                  Longitud UDP (16 bits)
                </div>
                <div
                  onClick={() => setSelectedField('checksum')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all text-center ${
                    selectedField === 'checksum'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold'
                      : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:border-white/[0.2]'
                  }`}
                >
                  Checksum UDP (16 bits)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel Descriptivo del Campo Seleccionado */}
        {(() => {
          const dict = selectedHeaderTab === 'tcp' ? TCP_FIELDS_INFO : UDP_FIELDS_INFO;
          const info = dict[selectedField] || dict[Object.keys(dict)[0]];
          return (
            <div className="p-6 rounded-[28px] bg-white/[0.03] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white font-display">{info.name}</h4>
                </div>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                  {info.bits}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                {info.desc}
              </p>
              <div className="text-xs font-mono text-zinc-400 pt-2 border-t border-white/[0.06]">
                <strong className="text-white">Rol en el Modelo:</strong> {info.role}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
