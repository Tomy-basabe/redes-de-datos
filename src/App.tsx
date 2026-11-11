import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LenisProvider } from './components/apple/LenisProvider';
import { CanvasNetworkHero } from './components/apple/CanvasNetworkHero';
import { LabNavbar, LAB_SECTIONS } from './components/lab/LabNavbar';
import { Section1Intro } from './components/lab/Section1Intro';
import { Section2TcpVsUdp } from './components/lab/Section2TcpVsUdp';
import { Section3Segmentation } from './components/lab/Section3Segmentation';
import { Section4SlidingWindow } from './components/lab/Section4SlidingWindow';
import { Section5Checksum } from './components/lab/Section5Checksum';
import { Section6CongestionSawtooth } from './components/lab/Section6CongestionSawtooth';
import { Section7Handshake } from './components/lab/Section7Handshake';
import { Section8Teardown } from './components/lab/Section8Teardown';
import { Section9PortsMux } from './components/lab/Section9PortsMux';
import { Section10TopologyTp1 } from './components/lab/Section10TopologyTp1';
import { ChevronLeft, ChevronRight, Presentation, Sliders, Layers } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'exposicion' | 'laboratorio'>('exposicion');

  // Atajos de teclado para navegación fluida en la defensa oral
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setActiveSection((prev) => (prev < 10 ? prev + 1 : 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setActiveSection((prev) => (prev > 1 ? prev - 1 : 10));
      } else if (e.key >= '1' && e.key <= '9') {
        setActiveSection(parseInt(e.key, 10));
      } else if (e.key === '0') {
        setActiveSection(10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartLab = () => {
    setActiveSection(2);
  };

  const handleToggleViewMode = () => {
    setViewMode((prev) => (prev === 'exposicion' ? 'laboratorio' : 'exposicion'));
  };

  return (
    <LenisProvider>
      <div className="min-h-screen bg-[#07090e] text-[#f5f5f7] flex flex-col font-sans selection:bg-cyan-400 selection:text-black relative">
        {/* Fondo Dinámico de Red con Partículas */}
        <CanvasNetworkHero />

        {/* Barra de Navegación del Laboratorio (10 Secciones, Timer 15m, Modos) */}
        <LabNavbar
          activeSection={activeSection}
          onSelectSection={(idx) => setActiveSection(idx)}
          viewMode={viewMode}
          onToggleViewMode={handleToggleViewMode}
        />

        {/* Contenedor Principal de la Sección Activa */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {activeSection === 1 && <Section1Intro onStartLab={handleStartLab} />}
              {activeSection === 2 && <Section2TcpVsUdp />}
              {activeSection === 3 && <Section3Segmentation />}
              {activeSection === 4 && <Section4SlidingWindow />}
              {activeSection === 5 && <Section5Checksum />}
              {activeSection === 6 && <Section6CongestionSawtooth />}
              {activeSection === 7 && <Section7Handshake />}
              {activeSection === 8 && <Section8Teardown />}
              {activeSection === 9 && <Section9PortsMux />}
              {activeSection === 10 && <Section10TopologyTp1 />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Barra Flotante de Navegación Rápida (Pie de Pantalla) */}
        <div className="sticky bottom-4 z-40 max-w-xl mx-auto w-full px-4 pointer-events-none">
          <div className="apple-glass p-2.5 rounded-full border border-white/[0.12] shadow-2xl flex items-center justify-between pointer-events-auto backdrop-blur-2xl bg-black/80">
            <button
              onClick={() => setActiveSection((prev) => (prev > 1 ? prev - 1 : 10))}
              className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-all flex items-center gap-1 text-xs font-mono"
              title="Sección Anterior (Flecha Izquierda)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            {/* Indicador de Sección y Acceso Directo */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">
                Sección <strong className="text-cyan-300 font-bold">{activeSection}</strong> de 10
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-400 hidden sm:inline">
                {LAB_SECTIONS[activeSection - 1]?.short}
              </span>
            </div>

            <button
              onClick={() => setActiveSection((prev) => (prev < 10 ? prev + 1 : 1))}
              className="p-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all flex items-center gap-1 text-xs font-mono shadow-md shadow-cyan-500/20"
              title="Siguiente Sección (Flecha Derecha)"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer Institucional con Cátedra e Integrantes */}
        <footer className="border-t border-white/[0.08] bg-[#05070b]/95 py-10 px-6 text-center text-xs font-mono text-zinc-500 space-y-3 relative z-10 mt-12">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="text-zinc-400 font-sans">
              Universidad Tecnológica Nacional • Facultad Regional Mendoza • Ingeniería en Sistemas de Información
            </div>
            <div className="text-zinc-500">
              Cátedra: Redes de Información / Redes de Datos • Cátedra: Esp. Prof. Raúl Tonelli / Prof. Roberto Cutuli
            </div>
            <div className="text-zinc-600 text-[11px]">
              Proyecto Oficial: Diseño de Red LAN Escuela 4-025 Los Corralitos • Exposición 13 de Noviembre
            </div>
          </div>
        </footer>
      </div>
    </LenisProvider>
  );
}
