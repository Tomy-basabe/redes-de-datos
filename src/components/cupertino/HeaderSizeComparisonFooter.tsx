import React from 'react';
import { motion } from 'framer-motion';

interface HeaderSizeComparisonFooterProps {
  isDark: boolean;
}

const APPLE_EASE = [0.16, 1, 0.3, 1] as const;

export const HeaderSizeComparisonFooter: React.FC<HeaderSizeComparisonFooterProps> = ({
  isDark
}) => {
  const surface = isDark
    ? 'bg-[#161618]/90 border-white/[0.09] text-[#F5F5F7]'
    : 'bg-white/95 border-black/[0.07] text-[#1D1D1F] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]';

  const muted = isDark ? 'text-[#86868B]' : 'text-[#6E6E73]';
  const wellBg = isDark ? 'bg-black/45 border-white/[0.07]' : 'bg-[#F5F5F7] border-black/[0.06]';
  const cellNeutral = isDark
    ? 'bg-white/[0.04] border-white/[0.10] text-[#F5F5F7]'
    : 'bg-white border-black/[0.08] text-[#1D1D1F] shadow-[0_1px_2px_rgba(0,0,0,0.03)]';
  const cellTcpControl = isDark
    ? 'bg-[#0A84FF]/[0.09] border-[#0A84FF]/25 text-[#F5F5F7]'
    : 'bg-[#0071E3]/[0.06] border-[#0071E3]/20 text-[#1D1D1F]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: APPLE_EASE, delay: 0.08 }}
      className={`rounded-[24px] border backdrop-blur-2xl px-4 py-3.5 sm:px-5 sm:py-4 transition-colors duration-300 ${surface}`}
    >
      {/* Cabecera minimalista Apple */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${muted}`}>
            Comparativa Proporcional (32 bits / fila)
          </span>
          <h3 className="text-sm sm:text-base font-bold tracking-[-0.02em]">
            Cabecera UDP (8 Bytes) vs. Cabecera TCP (mínimo 20 Bytes)
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold apple-tabular">
          <span
            className={`px-3 py-0.5 rounded-full border ${
              isDark ? 'bg-white/[0.05] border-white/10 text-[#F5F5F7]' : 'bg-black/[0.04] border-black/10 text-[#1D1D1F]'
            }`}
          >
            UDP: <strong>8 B</strong> (2 filas)
          </span>
          <span
            className={`px-3 py-0.5 rounded-full border ${
              isDark
                ? 'bg-[#0A84FF]/15 border-[#0A84FF]/30 text-[#64D2FF]'
                : 'bg-[#0071E3]/10 border-[#0071E3]/25 text-[#0071E3]'
            }`}
          >
            TCP: <strong>20 B</strong> (5 filas • 2,5×)
          </span>
        </div>
      </div>

      {/* Grillas paralelas a escala real de 32 bits por fila */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* === UDP: 8 BYTES (2 FILAS) === */}
        <div className={`rounded-[18px] border p-3.5 flex flex-col justify-between ${wellBg}`}>
          <div>
            <div className="flex items-center justify-between text-xs mb-2 px-0.5">
              <span className="font-semibold tracking-[-0.01em]">
                Cabecera UDP <span className={`font-normal ${muted}`}>• RFC 768</span>
              </span>
              <span className={`font-mono text-[11px] ${muted}`}>0 ··· 15 | 16 ··· 31 bits</span>
            </div>

            <div className="space-y-1.5">
              {/* Fila 1 (Bytes 0-3) */}
              <div className="grid grid-cols-2 gap-1.5 h-[34px]">
                <div className={`rounded-lg border flex items-center justify-between px-2.5 text-xs font-medium ${cellNeutral}`}>
                  <span className="truncate">Puerto Origen</span>
                  <span className={`font-mono text-[11px] ${muted}`}>16b</span>
                </div>
                <div className={`rounded-lg border flex items-center justify-between px-2.5 text-xs font-medium ${cellNeutral}`}>
                  <span className="truncate">Puerto Destino</span>
                  <span className={`font-mono text-[11px] ${muted}`}>16b</span>
                </div>
              </div>

              {/* Fila 2 (Bytes 4-7) */}
              <div className="grid grid-cols-2 gap-1.5 h-[34px]">
                <div className={`rounded-lg border flex items-center justify-between px-2.5 text-xs font-medium ${cellNeutral}`}>
                  <span className="truncate">Longitud Total</span>
                  <span className={`font-mono text-[11px] ${muted}`}>16b</span>
                </div>
                <div className={`rounded-lg border flex items-center justify-between px-2.5 text-xs font-medium ${cellNeutral}`}>
                  <span className="truncate">Checksum</span>
                  <span className={`font-mono text-[11px] ${muted}`}>16b</span>
                </div>
              </div>

              {/* Espacio proporcional libre equivalente a las 3 filas extra que TCP ocupa */}
              <div
                className={`h-[112px] rounded-xl border border-dashed flex flex-col items-center justify-center text-center px-3 ${
                  isDark ? 'border-white/[0.08] bg-white/[0.015]' : 'border-black/[0.1] bg-white/55'
                }`}
              >
                <span className="text-xs font-semibold tracking-[-0.01em]">
                  Aquí ya comienzan los Datos de Aplicación
                </span>
                <span className={`text-[11.5px] mt-1 ${muted}`}>
                  Sin Seq, sin ACK, sin ventana deslizante ni flags — 12 Bytes más liviana
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* === TCP: 20 BYTES (5 FILAS) === */}
        <div className={`rounded-[18px] border p-3.5 flex flex-col justify-between ${wellBg}`}>
          <div>
            <div className="flex items-center justify-between text-xs mb-2 px-0.5">
              <span className="font-semibold tracking-[-0.01em]">
                Cabecera TCP <span className={`font-normal ${muted}`}>• RFC 793 (20 B mínimos)</span>
              </span>
              <span className={`font-mono text-[11px] ${muted}`}>0 ··· 15 | 16 ··· 31 bits</span>
            </div>

            <div className="space-y-1.5">
              {/* Fila 1 (Bytes 0-3) */}
              <div className="grid grid-cols-2 gap-1.5 h-[34px]">
                <div className={`rounded-lg border flex items-center justify-between px-2.5 text-xs font-medium ${cellNeutral}`}>
                  <span className="truncate">Puerto Origen</span>
                  <span className={`font-mono text-[11px] ${muted}`}>16b</span>
                </div>
                <div className={`rounded-lg border flex items-center justify-between px-2.5 text-xs font-medium ${cellNeutral}`}>
                  <span className="truncate">Puerto Destino</span>
                  <span className={`font-mono text-[11px] ${muted}`}>16b</span>
                </div>
              </div>

              {/* Fila 2 (Bytes 4-7) */}
              <div className={`h-[34px] rounded-lg border flex items-center justify-between px-2.5 text-xs font-medium ${cellTcpControl}`}>
                <span className="truncate">Número de Secuencia (conteo de bytes)</span>
                <span className={`font-mono text-[11px] ${muted}`}>32b</span>
              </div>

              {/* Fila 3 (Bytes 8-11) */}
              <div className={`h-[34px] rounded-lg border flex items-center justify-between px-2.5 text-xs font-medium ${cellTcpControl}`}>
                <span className="truncate">Número de Reconocimiento (ACK acumulativo)</span>
                <span className={`font-mono text-[11px] ${muted}`}>32b</span>
              </div>

              {/* Fila 4 (Bytes 12-15): proporción bit a bit exacta (4b + 6b + 6b + 16b = 32b) */}
              <div
                className="grid gap-1.5 h-[34px]"
                style={{ gridTemplateColumns: '4fr 6fr 6fr 16fr' }}
              >
                <div
                  className={`rounded-lg border flex items-center justify-center text-[11px] font-medium px-1 ${cellTcpControl}`}
                  title="Longitud de cabecera (4 bits, en palabras de 32 bits)"
                >
                  Long. 4b
                </div>
                <div
                  className={`rounded-lg border flex items-center justify-center text-[11px] px-1 ${cellTcpControl}`}
                  title="6 bits reservados / no usados (Fig. 3.29 Kurose & Ross)"
                >
                  No usado
                </div>
                <div
                  className={`rounded-lg border flex items-center justify-center text-[11px] font-semibold tracking-wide px-1 ${cellTcpControl}`}
                  title="Indicadores de 6 bits: URG, ACK, PSH, RST, SYN, FIN"
                >
                  U A P R S F
                </div>
                <div className={`rounded-lg border flex items-center justify-between px-2.5 text-[11.5px] font-medium ${cellTcpControl}`}>
                  <span className="truncate">Ventana (rwnd)</span>
                  <span className={`font-mono text-[10.5px] ${muted}`}>16b</span>
                </div>
              </div>

              {/* Fila 5 (Bytes 16-19) */}
              <div className="grid grid-cols-2 gap-1.5 h-[34px]">
                <div className={`rounded-lg border flex items-center justify-between px-2.5 text-xs font-medium ${cellNeutral}`}>
                  <span className="truncate">Checksum</span>
                  <span className={`font-mono text-[11px] ${muted}`}>16b</span>
                </div>
                <div className={`rounded-lg border flex items-center justify-between px-2.5 text-xs font-medium ${cellNeutral}`}>
                  <span className="truncate">Puntero Urgente</span>
                  <span className={`font-mono text-[11px] ${muted}`}>16b</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
