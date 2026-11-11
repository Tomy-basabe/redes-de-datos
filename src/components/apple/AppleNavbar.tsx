import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface AppleNavbarProps {
  onScrollTo: (id: string) => void;
}

export const AppleNavbar: React.FC<AppleNavbarProps> = ({ onScrollTo }) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollProgress((window.scrollY / total) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { id: 'hero', label: 'Visión General' },
    { id: 'segmento-rfc', label: 'Anatomía RFC' },
    { id: 'handshake-motion', label: 'Handshake' },
    { id: 'multiplexacion', label: 'Multiplexación' },
    { id: 'proxy-tunnel', label: 'Doble Salto' },
    { id: 'multi-wan', label: 'MikroTik PCC' },
    { id: 'congestion-control', label: 'Congestión Cwnd' },
    { id: 'dhcp-prism', label: 'DHCP Relay' },
    { id: 'cisco-terminal', label: 'Cisco CLI' },
    { id: 'examen-coloquio', label: 'Simulador Examen' },
    { id: 'defensa-oral', label: 'Defensa Cátedra' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-black/75 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Identidad Apple Pro */}
        <div 
          onClick={() => onScrollTo('hero')}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-zinc-200 to-zinc-600 flex items-center justify-center text-black font-black text-xs shadow-inner">
            L4
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-white group-hover:text-cyan-400 transition-colors font-display">
              Capa de Transporte
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.08] hidden sm:inline-block">
              4-025 Los Corralitos
            </span>
          </div>
        </div>

        {/* Links Estilo Apple Minimal con Scroll Horizontal Suave en pantallas pequeñas */}
        <nav className="hidden lg:flex items-center gap-5 text-xs text-zinc-400 font-sans">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => onScrollTo(link.id)}
              className="hover:text-white transition-colors cursor-pointer select-none whitespace-nowrap"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Botón de Cátedra */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onScrollTo('examen-coloquio')}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] transition-all flex items-center gap-1 cursor-pointer font-sans"
          >
            <span>Evaluar Defensa</span>
            <ChevronRight className="w-3 h-3 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Hilo de Progreso de Scroll Ultradelgado */}
      <div className="w-full h-[1.5px] bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all duration-100"
          style={{ width: `${Math.max(1, scrollProgress)}%` }}
        />
      </div>
    </header>
  );
};
