import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, AlertTriangle, CheckCircle2, XCircle, RotateCcw, ShieldCheck, Zap } from 'lucide-react';
import { calculateTcpChecksum, toHex16, toBin16 } from '../../logic/checksumCalculator';

export const Section5Checksum: React.FC = () => {
  const [srcIp, setSrcIp] = useState<string>('172.16.20.10');
  const [dstIp, setDstIp] = useState<string>('172.16.10.12');
  const [srcPort, setSrcPort] = useState<number>(53000);
  const [dstPort, setDstPort] = useState<number>(443);
  const [payload, setPayload] = useState<string>('GET / HTTP/1.1');
  const [isCorrupted, setIsCorrupted] = useState<boolean>(false);

  const result = calculateTcpChecksum(
    srcIp,
    dstIp,
    srcPort,
    dstPort,
    1000,
    0,
    64240,
    payload,
    isCorrupted
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold block">
            Sección 5 • Verificación Matemática de Integridad
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold apple-headline text-white mt-1">
            Checksum TCP & Detección de Errores (Complemento a Uno)
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Demostración visual del cálculo de suma en complemento a uno sobre la pseudocabecera IP, cabecera TCP y carga útil según el RFC 793 y RFC 1071.
          </p>
        </div>

        {/* Botón de Corrupción Interactiva */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCorrupted(!isCorrupted)}
            className={`px-5 py-2.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              isCorrupted
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/[0.08]'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{isCorrupted ? 'Segmento Corrupto Activo' : 'Corromper Segmento (Invertir Bit)'}</span>
          </button>

          {isCorrupted && (
            <button
              onClick={() => setIsCorrupted(false)}
              className="p-2.5 rounded-full bg-white/[0.06] text-zinc-400 hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Panel de Entradas de la Trama de la Escuela */}
      <div className="p-6 rounded-[28px] apple-glass border border-white/[0.08] space-y-4">
        <span className="text-xs font-mono uppercase text-zinc-400 font-semibold block">
          Parámetros del Segmento (Host VLAN 20 → Nginx VLAN 10)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label className="text-zinc-500 block mb-1">IP Origen (Host Lógico)</label>
            <input
              type="text"
              value={srcIp}
              onChange={(e) => setSrcIp(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/60 border border-white/[0.08] text-white"
            />
          </div>
          <div>
            <label className="text-zinc-500 block mb-1">IP Destino (Nginx)</label>
            <input
              type="text"
              value={dstIp}
              onChange={(e) => setDstIp(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/60 border border-white/[0.08] text-white"
            />
          </div>
          <div>
            <label className="text-zinc-500 block mb-1">Puertos (Src → Dst)</label>
            <div className="p-2.5 rounded-xl bg-black/60 border border-white/[0.08] text-cyan-400 font-bold">
              {srcPort} → {dstPort} (HTTPS)
            </div>
          </div>
          <div>
            <label className="text-zinc-500 block mb-1">Carga Útil (Payload)</label>
            <input
              type="text"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/60 border border-white/[0.08] text-white"
            />
          </div>
        </div>
      </div>

      {/* Procedimiento de Cálculo en 5 Fases Matemáticas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Lista de Palabras de 16 bits */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Palabras de 16 Bits que componen la suma ({result.words.length} palabras):</span>
            <span className="text-cyan-400">Pseudocabecera + Cabecera + Datos</span>
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-2 no-scrollbar">
            {result.words.map((w, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-[10px]">#{idx + 1}</span>
                  <span className="text-white font-semibold">{w.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 text-[11px] hidden sm:inline">{w.bin}</span>
                  <span className="text-cyan-400 font-bold bg-black/40 px-2 py-0.5 rounded">
                    {w.hex}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Suma, Acarreo e Inversión (Emisor y Receptor) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Cálculo en el Emisor */}
          <div className="p-6 rounded-[28px] apple-glass border border-white/[0.08] space-y-4">
            <span className="text-xs font-mono uppercase text-cyan-400 font-semibold block">
              Proceso Matemático en el Emisor
            </span>

            <div className="space-y-2.5 text-xs font-mono text-zinc-300">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] flex justify-between">
                <span>1. Suma Bruta Acumulada:</span>
                <strong className="text-white">{result.rawSumHex} ({result.rawSum})</strong>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] flex justify-between">
                <span>2. Acarreo (Bits Superiores &gt; 16):</span>
                <strong className="text-amber-400">+{result.carryBits} (Wrap-around carry)</strong>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] flex justify-between">
                <span>3. Suma Reducida a 16 bits:</span>
                <strong className="text-white">{result.sumAfterCarryHex}</strong>
              </div>

              <div className="p-4 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 flex justify-between items-center">
                <span>4. Inversión Bit a Bit (~NOT):</span>
                <strong className="text-base font-bold text-white">{result.checksumHex}</strong>
              </div>
            </div>
          </div>

          {/* Verificación en el Receptor */}
          <div className={`p-6 rounded-[28px] border transition-all ${
            result.isValid
              ? 'apple-glass border-emerald-500/40 bg-emerald-500/10'
              : 'apple-glass border-rose-500/50 bg-rose-500/15'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase font-bold text-white">
                Verificación en el Receptor
              </span>
              {result.isValid ? (
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> INTEGRIDAD OK
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> CHECKSUM FALLÓ
                </span>
              )}
            </div>

            <p className="text-xs font-mono text-zinc-300 leading-relaxed">
              {result.isValid ? (
                <span>
                  El receptor sumó todas las palabras más el checksum recibido. El resultado invertido es <strong className="text-emerald-400">0x0000</strong> (suma = 0xFFFF). El segmento es aceptado y entregado a la aplicación.
                </span>
              ) : (
                <span>
                  ¡Alteración detectada! La suma en complemento a uno arrojó residuo <strong className="text-rose-400">{toHex16(result.receiverFinal)} != 0x0000</strong>. El receptor descarta el segmento en silencio sin generar ACK.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Nota Teórica de la Cátedra */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-xs font-mono text-zinc-400 space-y-1">
        <strong className="text-white block font-sans text-sm">Fundamento Crítico de la Cátedra (Redes de Datos):</strong>
        <p className="text-zinc-300 leading-relaxed font-sans">
          El checksum TCP permite detectar errores provocados por ruido en enlaces físicos, pero <strong>no corrige el contenido dañado</strong> (no es un código Hamming) ni garantiza detectar absolutamente todas las alteraciones (por ejemplo, cancelaciones cruzadas de bits). Ante cualquier fallo, el protocolo se apoya en los mecanismos de retransmisión para recuperar la información.
        </p>
      </div>
    </div>
  );
};
