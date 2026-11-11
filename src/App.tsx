import React from 'react';
import { LenisProvider } from './components/apple/LenisProvider';
import { CanvasNetworkHero } from './components/apple/CanvasNetworkHero';
import { AppleNavbar } from './components/apple/AppleNavbar';
import { HeroApple } from './components/apple/HeroApple';
import { Header3DScroller } from './components/apple/Header3DScroller';
import { HandshakeTimelineApple } from './components/apple/HandshakeTimelineApple';
import { ProxyTunnelApple } from './components/apple/ProxyTunnelApple';
import { MultiWanFlowApple } from './components/apple/MultiWanFlowApple';
import { DhcpRelayPrismApple } from './components/apple/DhcpRelayPrismApple';
import { OralDefenseBentoApple } from './components/apple/OralDefenseBentoApple';

export default function App() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <LenisProvider>
      <div className="min-h-screen bg-black text-[#f5f5f7] flex flex-col font-sans selection:bg-cyan-400 selection:text-black relative">
        {/* Motion Graphics Canvas en Segundo Plano */}
        <CanvasNetworkHero />

        {/* Navbar Estilo Apple */}
        <AppleNavbar onScrollTo={scrollTo} />

        {/* Contenido Principal en Secuencia Cinematográfica */}
        <main className="flex-1 relative z-10 space-y-12 sm:space-y-20">
          <HeroApple onExplore={() => scrollTo('segmento-rfc')} />
          <Header3DScroller />
          <HandshakeTimelineApple />
          <ProxyTunnelApple />
          <MultiWanFlowApple />
          <DhcpRelayPrismApple />
          <OralDefenseBentoApple />
        </main>

        {/* Footer Minimalista Estilo Apple.com */}
        <footer className="border-t border-white/[0.08] bg-black/90 py-12 px-6 text-center text-xs font-mono text-zinc-500 space-y-3 relative z-10">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="text-zinc-400 font-sans">
              Universidad Tecnológica Nacional • Facultad Regional Mendoza • Ingeniería en Sistemas de Información
            </div>
            <div className="text-zinc-500">
              Cátedra: Redes de Datos • Trabajo Práctico: Capa de Transporte • Escuela 4-025 Los Corralitos
            </div>
            <div className="text-zinc-600 text-[11px]">
              Docentes: Esp. Prof. Raúl Tonelli / Prof. Roberto Cutuli • 13 de Noviembre
            </div>
          </div>
        </footer>
      </div>
    </LenisProvider>
  );
}
