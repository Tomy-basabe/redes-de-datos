import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LenisProvider } from './components/apple/LenisProvider';
import { CanvasNetworkHero } from './components/apple/CanvasNetworkHero';
import { LabNavbar, LAB_SECTIONS } from './components/lab/LabNavbar';
import { Section2TcpVsUdp } from './components/lab/Section2TcpVsUdp';
import { Section7Handshake } from './components/lab/Section7Handshake';
import { Section8Teardown } from './components/lab/Section8Teardown';
import { Slide2MultiplexingAndFlow } from './components/slides/Slide2MultiplexingAndFlow';
import { SectionCongestionAndFlow } from './components/slides/SectionCongestionAndFlow';
import { SectionAndresChecksum } from './components/slides/SectionAndresChecksum';
import { SectionFinaleCelebration } from './components/slides/SectionFinaleCelebration';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { applySectionTheme, SECTION_THEMES } from './lib/tabeChoreography';

const TOTAL_SECTIONS = LAB_SECTIONS.length;

export default function App() {
  const [activeSection, setActiveSection] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'exposicion' | 'laboratorio'>('exposicion');

  // Aplicar halo cromático y tema CSS dinámico al cambiar de sección
  useEffect(() => {
    applySectionTheme(activeSection);
  }, [activeSection]);

  // Atajos de teclado para navegación fluida en la defensa oral
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setActiveSection((prev) => (prev < TOTAL_SECTIONS ? prev + 1 : 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setActiveSection((prev) => (prev > 1 ? prev - 1 : TOTAL_SECTIONS));
      } else if (e.key >= '1' && e.key <= String(TOTAL_SECTIONS)) {
        setActiveSection(parseInt(e.key, 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleViewMode = () => {
    setViewMode((prev) => (prev === 'exposicion' ? 'laboratorio' : 'exposicion'));
  };

  const currentTheme = SECTION_THEMES[activeSection] || SECTION_THEMES[1];

  return (
    <LenisProvider>
      <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-sky-200 selection:text-slate-950 relative overflow-x-hidden">
        {/* Pilar 2: Halo Ambiental Superior con Paleta Cromática Reactiva */}
        <div className="tabe-ambient-glow fixed top-0 left-0 right-0 h-[520px] -z-10" />

        {/* Fondo Dinámico Sutil de Red de Nodos */}
        <CanvasNetworkHero />

        {/* Barra Superior con Coreografía T.A.B.E. (7 Secciones, Timer 15m, Modos) */}
        <LabNavbar
          activeSection={activeSection}
          onSelectSection={(idx) => setActiveSection(idx)}
          viewMode={viewMode}
          onToggleViewMode={handleToggleViewMode}
        />

        {/* Contenedor Principal de la Sección Activa */}
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 relative z-10">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99, transition: { duration: 0.15 } }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="tabe-stage-module"
            >
              {activeSection === 1 && <Section2TcpVsUdp />}
              {activeSection === 2 && <Slide2MultiplexingAndFlow />}
              {activeSection === 3 && <Section7Handshake />}
              {activeSection === 4 && <Section8Teardown />}
              {activeSection === 5 && <SectionCongestionAndFlow />}
              {activeSection === 6 && <SectionAndresChecksum />}
              {activeSection === 7 && <SectionFinaleCelebration />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Barra Flotante de Navegación Rápida Estilo Dock Apple (Pie de Pantalla) */}
        <div className="sticky bottom-4 z-40 max-w-xl mx-auto w-full px-4 pointer-events-none">
          <div className="p-2 rounded-full border border-black/[0.08] shadow-[0_18px_40px_-14px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.9)] flex items-center justify-between pointer-events-auto backdrop-blur-2xl bg-white/88">
            <button
              onClick={() => setActiveSection((prev) => (prev > 1 ? prev - 1 : TOTAL_SECTIONS))}
              className="apple-btn apple-btn-secondary px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] text-[#1D1D1F]"
              title="Sección Anterior (Flecha Izquierda)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            {/* Indicador de Sección Activa con Resorte */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs sm:text-[13px] font-medium text-[#515154]">
                Diapositiva{' '}
                <strong
                  style={{ color: currentTheme.accentHex }}
                  className="font-bold font-mono transition-colors"
                >
                  {activeSection}
                </strong>{' '}
                de {TOTAL_SECTIONS}
              </span>
              <span
                style={{
                  backgroundColor: currentTheme.badgeBg,
                  borderColor: currentTheme.badgeBorder,
                  color: currentTheme.badgeText
                }}
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border hidden sm:inline transition-colors"
              >
                {LAB_SECTIONS[activeSection - 1]?.short}
              </span>
            </div>

            <button
              onClick={() => setActiveSection((prev) => (prev < TOTAL_SECTIONS ? prev + 1 : 1))}
              style={{
                background: `linear-gradient(180deg, rgba(${currentTheme.primaryRgb}, 0.94) 0%, rgba(${currentTheme.secondaryRgb}, 1) 100%)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 4px 14px -2px rgba(${currentTheme.primaryRgb}, 0.4)`
              }}
              className="apple-btn px-4 py-1.5 rounded-full text-white font-semibold text-xs sm:text-[13px]"
              title="Siguiente Sección (Flecha Derecha)"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer Institucional con Cátedra */}
        <footer className="border-t border-black/[0.06] bg-white/80 backdrop-blur-md py-6 px-6 text-center text-xs text-[#515154] space-y-1.5 relative z-10 mt-8">
          <div className="max-w-4xl mx-auto space-y-1">
            <div className="text-[#1D1D1F] font-semibold text-[13px]">
              Universidad Tecnológica Nacional • Facultad Regional Mendoza • Ingeniería en Sistemas de Información
            </div>
            <div className="text-[#3A3A3C]">
              Cátedra: Redes de Información / Redes de Datos • Docentes: Esp. Prof. Raúl Tonelli / Prof. Roberto Cutuli
            </div>
            <div className="text-[#515154] text-xs font-medium">
              Proyecto Oficial: Diseño de Red LAN Escuela 4-025 Los Corralitos • Exposición 13 de Noviembre
            </div>
          </div>
        </footer>
      </div>
    </LenisProvider>
  );
}
