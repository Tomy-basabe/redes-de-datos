import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Sliders, 
  Presentation,
  CheckCircle2,
  ChevronRight,
  Shield
} from 'lucide-react';
import { SECTION_THEMES, tabeSpringPill } from '../../lib/tabeChoreography';

interface LabNavbarProps {
  activeSection: number;
  onSelectSection: (sectionIndex: number) => void;
  viewMode: 'exposicion' | 'laboratorio';
  onToggleViewMode: () => void;
}

export const LAB_SECTIONS = [
  { id: 1, title: '1. TCP vs UDP', short: '1. TCP/UDP' },
  { id: 2, title: '2. Puertos y Multiplexación', short: '2. Puertos & Mux' },
  { id: 3, title: '3. 3-Way Handshake y RST', short: '3. Handshake & RST' },
  { id: 4, title: '4. 4-Way Teardown', short: '4. Teardown' },
  { id: 5, title: '5. Congestión y Flujo', short: '5. Congestión & Flujo' },
  { id: 6, title: '6. Checksum TCP (Andrés)', short: '6. Checksum' },
  { id: 7, title: '7. ¡FIN! Concierto', short: '7. FIN 🎉' }
];

export const LabNavbar: React.FC<LabNavbarProps> = ({
  activeSection,
  onSelectSection,
  viewMode,
  onToggleViewMode
}) => {
  // Temporizador de 15 minutos para la defensa oral
  const [secondsLeft, setSecondsLeft] = useState<number>(15 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, secondsLeft]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const currentTheme = SECTION_THEMES[activeSection] || SECTION_THEMES[1];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/84 backdrop-blur-2xl border-b border-black/[0.08] transition-colors shadow-[0_6px_24px_-14px_rgba(15,23,42,0.12)]">
      {/* Fila Superior: Marca Institucional, Timer y Controles de Modo */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Identidad de Laboratorio */}
        <div
          onClick={() => onSelectSection(1)}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div
            style={{
              background: `linear-gradient(180deg, rgba(${currentTheme.primaryRgb}, 0.92) 0%, rgba(${currentTheme.secondaryRgb}, 1) 100%)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 8px -2px rgba(${currentTheme.primaryRgb}, 0.45)`
            }}
            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white font-bold text-xs tracking-tight transition-transform group-hover:scale-105"
          >
            L4
          </div>
          <div>
            <div className="text-[13px] sm:text-sm font-bold text-[#1D1D1F] tracking-tight flex items-center gap-2">
              <span>Laboratorio Capa de Transporte</span>
              <span
                style={{
                  backgroundColor: currentTheme.badgeBg,
                  borderColor: currentTheme.badgeBorder,
                  color: currentTheme.badgeText
                }}
                className="hidden md:inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors"
              >
                TP1 • Escuela 4-025 Los Corralitos
              </span>
            </div>
            <div className="text-[11px] font-medium text-[#515154] hidden sm:block">
              UTN FRM • Redes de Información • Tonelli / Cutuli
            </div>
          </div>
        </div>

        {/* Zona Central / Derecha: Temporizador 15 Minutos y Modo Exposición */}
        <div className="flex items-center gap-2.5">
          {/* Temporizador de Exposición 15:00 */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[13px] bg-[#F5F5F7] border border-black/[0.07] text-xs text-[#1D1D1F] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
            <Clock
              style={{ color: currentTheme.accentHex }}
              className="w-3.5 h-3.5 transition-colors"
            />
            <span className="font-mono font-bold tracking-tight">{timerDisplay}</span>
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="apple-btn apple-btn-secondary ml-0.5 text-[11px] px-2.5 py-0.5 rounded-lg"
            >
              {timerRunning ? 'Pausar' : 'Iniciar'}
            </button>
            <button
              onClick={() => {
                setSecondsLeft(15 * 60);
                setTimerRunning(false);
              }}
              title="Reiniciar temporizador"
              className="p-1 rounded-lg text-[#515154] hover:text-[#1D1D1F] hover:bg-black/[0.05] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Modo Exposición vs Modo Laboratorio Avanzado con Resorte FLIP layoutId */}
          <div className="apple-segmented text-xs relative">
            <button
              onClick={() => {
                if (viewMode !== 'exposicion') onToggleViewMode();
              }}
              className={`relative z-10 px-3 py-1.5 rounded-[10px] transition-colors flex items-center gap-1.5 cursor-pointer font-semibold ${
                viewMode === 'exposicion' ? 'text-white' : 'text-[#515154] hover:text-[#1D1D1F]'
              }`}
            >
              {viewMode === 'exposicion' && (
                <motion.span
                  layoutId="tabe-viewmode-pill"
                  transition={tabeSpringPill}
                  style={{
                    background: `linear-gradient(180deg, rgba(${currentTheme.primaryRgb}, 0.94) 0%, rgba(${currentTheme.secondaryRgb}, 1) 100%)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 2px 6px rgba(${currentTheme.primaryRgb}, 0.35)`
                  }}
                  className="absolute inset-0 rounded-[10px] -z-10"
                />
              )}
              <Presentation className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Modo Exposición</span>
            </button>

            <button
              onClick={() => {
                if (viewMode !== 'laboratorio') onToggleViewMode();
              }}
              className={`relative z-10 px-3 py-1.5 rounded-[10px] transition-colors flex items-center gap-1.5 cursor-pointer font-semibold ${
                viewMode === 'laboratorio' ? 'text-[#1D1D1F]' : 'text-[#515154] hover:text-[#1D1D1F]'
              }`}
            >
              {viewMode === 'laboratorio' && (
                <motion.span
                  layoutId="tabe-viewmode-pill"
                  transition={tabeSpringPill}
                  className="absolute inset-0 rounded-[10px] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.10),0_0.5px_1px_rgba(0,0,0,0.06)] -z-10"
                />
              )}
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Modo Libre</span>
            </button>
          </div>

          {/* Botón Pantalla Completa */}
          <button
            onClick={toggleFullscreen}
            title="Pantalla Completa"
            className="apple-btn apple-btn-secondary p-2 rounded-[12px] text-[#3A3A3C]"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Fila Inferior: Selector Rápido de las 7 Secciones con Píldora de Resorte FLIP */}
      <div className="border-t border-black/[0.06] bg-[#F5F5F7]/80 px-4 sm:px-6 py-2 overflow-x-auto no-scrollbar">
        <div className="max-w-[1440px] mx-auto flex items-center gap-1.5">
          {LAB_SECTIONS.map((sec) => {
            const isSelected = activeSection === sec.id;
            const theme = SECTION_THEMES[sec.id] || SECTION_THEMES[1];
            return (
              <button
                key={sec.id}
                onClick={() => onSelectSection(sec.id)}
                className={`relative px-3.5 py-1.5 rounded-[11px] text-xs font-sans whitespace-nowrap transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'font-bold'
                    : 'font-medium text-[#515154] hover:text-[#1D1D1F] hover:bg-black/[0.03]'
                }`}
                style={isSelected ? { color: theme.badgeText } : undefined}
              >
                {isSelected && (
                  <motion.span
                    layoutId="tabe-navbar-active-pill"
                    transition={tabeSpringPill}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: `rgba(${theme.primaryRgb}, 0.28)`,
                      boxShadow: `0 2px 8px -1px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(${theme.primaryRgb}, 0.22)`
                    }}
                    className="absolute inset-0 rounded-[11px] border -z-10"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span
                    style={{
                      backgroundColor: isSelected ? theme.accentHex : 'rgba(81,81,84,0.38)'
                    }}
                    className="w-2 h-2 rounded-full inline-block transition-colors"
                  />
                  {sec.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
