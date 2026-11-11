import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  Layers, 
  Shield, 
  Server, 
  Terminal, 
  Globe, 
  CheckCircle2, 
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AcademicHero } from './components/AcademicHero';
import { NetworkSimulationCanvas, PacketLog } from './components/NetworkSimulationCanvas';
import { LivePacketSniffer } from './components/LivePacketSniffer';
import { HandshakeAndFlowVisualizer } from './components/HandshakeAndFlowVisualizer';
import { ProxyAndAclVisualizer } from './components/ProxyAndAclVisualizer';
import { MikrotikAndDhcpVisualizer } from './components/MikrotikAndDhcpVisualizer';
import { HeaderRfcInspector } from './components/HeaderRfcInspector';
import { DefenseOralQandA } from './components/DefenseOralQandA';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('inicio');
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [capturedPackets, setCapturedPackets] = useState<PacketLog[]>([
    {
      id: 'init-1',
      timestamp: '12:00:01',
      protocolo: 'TCP',
      origen: '172.16.20.10',
      destino: '172.16.10.12',
      puertoOrigen: 53120,
      puertoDestino: 443,
      flags: 'SYN',
      info: 'Handshake inicial hacia Nginx Proxy HTTPS',
      estado: 'exito'
    },
    {
      id: 'init-2',
      timestamp: '12:00:02',
      protocolo: 'TCP',
      origen: '172.16.10.12',
      destino: '172.16.10.11',
      puertoOrigen: 41890,
      puertoDestino: 8080,
      flags: 'SYN, ACK',
      info: 'Doble salto: conexión interna hacia Apache Backend',
      estado: 'exito'
    }
  ]);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);

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

  const handlePacketLogged = (packet: PacketLog) => {
    setCapturedPackets((prev) => [packet, ...prev.slice(0, 19)]);
  };

  const navItems = [
    { id: 'inicio', label: 'Inicio & Cátedra' },
    { id: 'topologia', label: 'Topología & Tráfico' },
    { id: 'handshake', label: 'Handshake & Flujo' },
    { id: 'proxy', label: 'Proxy Inverso & ACLs' },
    { id: 'wan-dhcp', label: 'Multi-WAN & DHCP' },
    { id: 'rfc', label: 'Encabezados RFC' },
    { id: 'coloquio', label: 'Defensa Oral' }
  ];

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Header Flotante Estilo Apple / Vercel */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#06090e]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo y Titular */}
          <div 
            onClick={() => scrollTo('inicio')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all">
              L4
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
                <span>CAPA DE TRANSPORTE</span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  Escuela 4-025 Los Corralitos
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                UTN FRM • Redes de Datos • Tonelli / Cutuli
              </div>
            </div>
          </div>

          {/* Menú de Navegación con Pastilla Activa Animada (Framer Motion layoutId) */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            {navItems.map((item) => {
              const isSelected = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`relative px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors cursor-pointer select-none ${
                    isSelected ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="nav-active-pill"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-md shadow-cyan-500/20"
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Botón de Atajos y Ayuda */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Guía</span>
            </button>
          </div>
        </div>

        {/* Barra de Progreso de Lectura con Gradiente Fluido */}
        <div className="w-full h-1 bg-slate-900/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-500 transition-all duration-150"
            style={{ width: `${Math.max(2, scrollProgress)}%` }}
          />
        </div>
      </header>

      {/* Modal / Toast de Atajos y Tips */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 z-50 max-w-sm w-full p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-xs font-mono text-slate-300 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Tips para la Exposición Oral
              </span>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              En cada módulo pueden interactuar con los conmutadores y botones de inyección de tráfico. Los paquetes aparecerán automáticamente capturados en la consola Wireshark inferior.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenedor Principal con Espaciado Armónico */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-16">
        {/* Sección 1: Portada e Identidad Institucional */}
        <section id="inicio">
          <AcademicHero
            onStartPresentation={() => scrollTo('handshake')}
            onExploreSimulator={() => scrollTo('topologia')}
          />
        </section>

        {/* Sección 2: Topología y Tráfico en Vivo + Sniffer */}
        <section id="topologia" className="space-y-6">
          <NetworkSimulationCanvas onPacketLogged={handlePacketLogged} />
          <LivePacketSniffer
            packets={capturedPackets}
            onClear={() => setCapturedPackets([])}
          />
        </section>

        {/* Sección 3: Handshake y Confiabilidad Samba */}
        <section id="handshake">
          <HandshakeAndFlowVisualizer />
        </section>

        {/* Sección 4: Proxy Inverso Nginx / Apache & ACLs C9200 */}
        <section id="proxy">
          <ProxyAndAclVisualizer />
        </section>

        {/* Sección 5: Balanceo Multi-WAN MikroTik & DHCP Relay C9200 */}
        <section id="wan-dhcp">
          <MikrotikAndDhcpVisualizer />
        </section>

        {/* Sección 6: Anatomía RFC de Encabezados */}
        <section id="rfc">
          <HeaderRfcInspector />
        </section>

        {/* Sección 7: Coloquio / Defensa Oral ante Tonelli y Cutuli */}
        <section id="coloquio">
          <DefenseOralQandA />
        </section>
      </main>

      {/* Footer Limpio y Profesional */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 text-center text-xs font-mono text-slate-500 space-y-2">
        <div>
          Universidad Tecnológica Nacional • Facultad Regional Mendoza • Ingeniería en Sistemas de Información
        </div>
        <div>
          Cátedra: Redes de Datos • Trabajo Práctico: Capa de Transporte (Escuela 4-025 Los Corralitos)
        </div>
        <div className="text-slate-600">
          Docentes: Esp. Prof. Raúl Tonelli / Prof. Roberto Cutuli • 13 de Noviembre
        </div>
      </footer>
    </div>
  );
}
