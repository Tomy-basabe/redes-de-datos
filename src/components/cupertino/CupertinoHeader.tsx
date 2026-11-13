import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Network,
  Layers,
  Activity
} from 'lucide-react';

export interface CupertinoHeaderProps {
  viewLayer: 'physical' | 'logical';
  onToggleViewLayer: (layer: 'physical' | 'logical') => void;
  isDark: boolean;
  onToggleTheme: () => void;
  secondsLeft: number;
  isRunning: boolean;
  onToggleRun: () => void;
  onResetTimer: () => void;
}

export const CupertinoHeader: React.FC<CupertinoHeaderProps> = ({
  viewLayer,
  onToggleViewLayer,
  isDark,
  onToggleTheme: _onToggleTheme,
  secondsLeft,
  isRunning,
  onToggleRun,
  onResetTimer
}) => {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const dotColor =
    secondsLeft <= 20
      ? 'bg-[#FF453A]'
      : secondsLeft <= 60
      ? 'bg-[#FF9F0A]'
      : isRunning
      ? 'bg-[#30D158]'
      : 'bg-[#86868B]';

  return (
    <header
      className={`rounded-[24px] border backdrop-blur-2xl px-4 py-3 sm:px-5 sm:py-3.5 transition-colors duration-300 ${
        isDark
          ? 'bg-[#161618]/90 border-white/[0.09] text-[#F5F5F7]'
          : 'bg-white/90 border-black/[0.07] text-[#1D1D1F] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)]'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Identidad Apple Hardware Pro */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-[12px] border flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-[#2C2C2E] border-white/[0.12] text-[#F5F5F7]'
                : 'bg-[#1D1D1F] border-black/10 text-white'
            }`}
          >
            <Activity className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] sm:text-[17px] font-bold tracking-[-0.025em] truncate text-[#1D1D1F]">
              TCP vs. UDP en Capa de Transporte — Escuela 4-025 Los Corralitos
            </h1>
            <p
              className={`text-xs font-medium tracking-[-0.005em] truncate ${
                isDark ? 'text-[#AEAEB2]' : 'text-[#515154]'
              }`}
            >
              UTN FRM • Principio Extremo a Extremo • Topología y Cabeceras (Exposición 2:30 min)
            </p>
          </div>
        </div>

        {/* Controles Derechos: Capa Física / Capa Lógica + Cronómetro */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Toggle estricto Capa Física vs Capa Lógica */}
          <div
            className={`inline-flex p-1 rounded-[14px] border text-xs font-semibold ${
              isDark
                ? 'bg-black/55 border-white/[0.08]'
                : 'bg-[#E5E5EA]/85 border-black/[0.05] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]'
            }`}
          >
            <button
              type="button"
              onClick={() => onToggleViewLayer('physical')}
              className={`apple-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] ${
                viewLayer === 'physical'
                  ? isDark
                    ? 'bg-[#2C2C2E] text-[#F5F5F7] shadow-sm'
                    : 'apple-segment-active'
                  : isDark
                  ? 'text-[#AEAEB2] hover:text-[#F5F5F7]'
                  : 'text-[#515154] hover:text-[#1D1D1F]'
              }`}
              title="Muestra exclusivamente la infraestructura física (Capas 1–3)"
            >
              <Network className="w-3.5 h-3.5" strokeWidth={1.9} />
              Capa Física
            </button>
            <button
              type="button"
              onClick={() => onToggleViewLayer('logical')}
              className={`apple-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] ${
                viewLayer === 'logical'
                  ? 'apple-btn-primary border-transparent'
                  : isDark
                  ? 'text-[#AEAEB2] hover:text-[#F5F5F7]'
                  : 'text-[#515154] hover:text-[#1D1D1F]'
              }`}
              title="Muestra exclusivamente los canales lógicos extremo a extremo (Capa 4)"
            >
              <Layers className="w-3.5 h-3.5" strokeWidth={1.9} />
              Capa Lógica
            </button>
          </div>

          {/* Cronómetro Pro 02:30 */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[14px] border ${
              isDark
                ? 'bg-black/55 border-white/[0.09] text-[#F5F5F7]'
                : 'bg-white border-black/[0.08] text-[#1D1D1F]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
                isRunning ? 'animate-pulse' : ''
              }`}
            />
            <span className="font-mono text-[12px] font-semibold apple-tabular tracking-tight">
              {formattedTime}
            </span>
            <div
              className={`h-3.5 w-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={onToggleRun}
              title={isRunning ? 'Pausar cronómetro' : 'Iniciar exposición 2:30'}
              className={`p-0.5 rounded-md transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/10 text-[#F5F5F7]' : 'hover:bg-black/5 text-[#1D1D1F]'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={onResetTimer}
              title="Reiniciar a 02:30"
              className={`p-0.5 rounded-md transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/10 text-[#86868B]' : 'hover:bg-black/5 text-[#6E6E73]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* Tema claro unificado en toda la presentación */}
        </div>
      </div>
    </header>
  );
};
