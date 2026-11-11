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
  { id: 1, title: '1. Introducción L4', short: '1. Intro L4' },
  { id: 2, title: '2. TCP vs UDP', short: '2. TCP/UDP' },
  { id: 3, title: '3. Segmentación & RFC', short: '3. Segmentos' },
  { id: 4, title: '4. Ventana de Recepción (rwnd)', short: '4. Ventana rwnd' },
  { id: 5, title: '5. Checksum & Errores', short: '5. Checksum' },
  { id: 6, title: '6. Congestión & Sierra (cwnd)', short: '6. Sierra cwnd' },
  { id: 7, title: '7. 3-Way Handshake', short: '7. Handshake' },
  { id: 8, title: '8. 4-Way Teardown', short: '8. Teardown' },
  { id: 9, title: '9. Puertos & Multiplexación', short: '9. Puertos' },
  { id: 10, title: '10. Aplicación TP1 Corralitos', short: '10. TP1 Escuela' }
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
    <header className="sticky top-0 z-50 w-full bg-[#07090e]/90 backdrop-blur-2xl border-b border-white/[0.08] transition-colors">
      {/* Fila Superior: Marca Institucional, Timer y Controles de Modo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Identidad de Laboratorio */}
        <div 
          onClick={() => onSelectSection(1)}
          className="flex items-center gap-2.5 cursor-pointer select-none group tabe-btn-action"
        >
          <div 
            style={{ 
              background: `linear-gradient(135deg, rgba(${currentTheme.primaryRgb}, 1) 0%, rgba(${currentTheme.secondaryRgb}, 1) 100%)` 
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-950 font-black text-xs shadow-lg transition-transform group-hover:scale-105"
          >
            L4
          </div>
          <div>
            <div className="text-xs sm:text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5 font-display">
              <span>LABORATORIO CAPA DE TRANSPORTE</span>
              <span 
                style={{
                  backgroundColor: currentTheme.badgeBg,
                  borderColor: currentTheme.badgeBorder,
                  color: currentTheme.badgeText
                }}
                className="hidden md:inline-block text-[10px] font-mono px-2 py-0.5 rounded border transition-colors"
              >
                TP1 Escuela 4-025 Los Corralitos
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono hidden sm:block">
              UTN FRM • Redes de Información • Tonelli / Cutuli
            </div>
          </div>
        </div>

        {/* Zona Central / Derecha: Temporizador 15 Minutos y Modo Exposición */}
        <div className="flex items-center gap-2.5">
          {/* Temporizador de Exposición 15:00 */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.03] border border-white/[0.08] font-mono text-xs text-zinc-300">
            <Clock 
              style={{ color: currentTheme.accentHex }} 
              className="w-3.5 h-3.5 transition-colors" 
            />
            <span className="font-bold">{timerDisplay}</span>
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 cursor-pointer tabe-btn-action"
            >
              {timerRunning ? 'Pausar' : 'Iniciar'}
            </button>
            <button
              onClick={() => {
                setSecondsLeft(15 * 60);
                setTimerRunning(false);
              }}
              title="Reiniciar temporizador"
              className="text-zinc-500 hover:text-white ml-0.5 cursor-pointer tabe-btn-action"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Toggle Modo Exposición vs Modo Laboratorio Avanzado con Resorte FLIP layoutId */}
          <div className="inline-flex p-1 rounded-2xl bg-black/70 border border-white/[0.08] text-xs font-mono relative">
            <button
              onClick={() => {
                if (viewMode !== 'exposicion') onToggleViewMode();
              }}
              className={`relative z-10 px-3 py-1 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer tabe-btn-action ${
                viewMode === 'exposicion' ? 'text-slate-950 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {viewMode === 'exposicion' && (
                <motion.span
                  layoutId="tabe-viewmode-pill"
                  transition={tabeSpringPill}
                  style={{
                    background: `linear-gradient(135deg, rgba(${currentTheme.primaryRgb}, 1) 0%, rgba(${currentTheme.secondaryRgb}, 1) 100%)`
                  }}
                  className="absolute inset-0 rounded-xl shadow-lg -z-10"
                />
              )}
              <Presentation className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Modo Exposición</span>
            </button>

            <button
              onClick={() => {
                if (viewMode !== 'laboratorio') onToggleViewMode();
              }}
              className={`relative z-10 px-3 py-1 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer tabe-btn-action ${
                viewMode === 'laboratorio' ? 'text-slate-950 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {viewMode === 'laboratorio' && (
                <motion.span
                  layoutId="tabe-viewmode-pill"
                  transition={tabeSpringPill}
                  className="absolute inset-0 rounded-xl bg-white shadow-lg -z-10"
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
            className="p-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer tabe-btn-action"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Fila Inferior: Selector Rápido de las 10 Secciones con Píldora de Resorte FLIP */}
      <div className="border-t border-white/[0.04] bg-black/40 px-4 sm:px-6 py-1.5 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5">
          {LAB_SECTIONS.map((sec) => {
            const isSelected = activeSection === sec.id;
            const theme = SECTION_THEMES[sec.id] || SECTION_THEMES[1];
            return (
              <button
                key={sec.id}
                onClick={() => onSelectSection(sec.id)}
                className={`relative px-3 py-1 rounded-xl text-xs font-mono whitespace-nowrap transition-colors cursor-pointer select-none tabe-btn-action ${
                  isSelected ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="tabe-navbar-active-pill"
                    transition={tabeSpringPill}
                    style={{
                      backgroundColor: `rgba(${theme.primaryRgb}, 0.18)`,
                      borderColor: `rgba(${theme.primaryRgb}, 0.45)`,
                      boxShadow: `0 4px 14px -3px rgba(${theme.primaryRgb}, 0.35)`
                    }}
                    className="absolute inset-0 rounded-xl border -z-10"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <span 
                    style={{
                      backgroundColor: isSelected ? theme.accentHex : 'rgba(255,255,255,0.2)'
                    }}
                    className="w-1.5 h-1.5 rounded-full inline-block transition-colors"
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
