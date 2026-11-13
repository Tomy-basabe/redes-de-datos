import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Globe,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Layers,
  Gauge
} from 'lucide-react';
import {
  SchoolTopologySvg,
  TOPOLOGY_COORDS,
  AnimatedPillPacket,
  TopologyOverlayBadge
} from './SchoolTopologySvg';
import { SCHOOL_DEVICES } from '../../data/cupertinoCorralitosData';

interface Module2UdpLiveProps {
  isDark: boolean;
  viewLayer: 'physical' | 'logical';
  onToggleViewLayer?: (layer: 'physical' | 'logical') => void;
}

type UdpScenario = 'idle' | 'dhcp' | 'dns';

const APPLE_EASE = [0.16, 1, 0.3, 1] as const;

const BENTO_STAGGER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.02 }
  }
};

const BENTO_ITEM = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: APPLE_EASE } }
};

// Exactas 4 ventajas del libro citadas en el guion
const UDP_FOUR_ADVANTAGES = [
  {
    id: 'no-handshake',
    icon: Zap,
    title: 'Sin retardo de establecimiento',
    desc: '0 ms de saludo inicial (handshake) antes de transmitir.'
  },
  {
    id: 'stateless',
    icon: Layers,
    title: 'No guarda estado en memoria',
    desc: 'El servidor no mantiene buffers ni contadores; soporta todas las VLANs.'
  },
  {
    id: 'overhead',
    icon: Gauge,
    title: 'Cabecera de solo 8 Bytes',
    desc: '2,5× más liviana que los 20 Bytes mínimos de TCP.'
  },
  {
    id: 'app-control',
    icon: Cpu,
    title: 'Control de aplicación (envío inmediato)',
    desc: 'La app decide qué enviar y cuándo; UDP empaqueta y entrega a IP al instante sin freno de congestión.'
  }
];

export const Module2UdpLive: React.FC<Module2UdpLiveProps> = ({
  isDark,
  viewLayer,
  onToggleViewLayer
}) => {
  const [scenario, setScenario] = useState<UdpScenario>('idle');
  const [step, setStep] = useState<number>(0);
  const [runCounter, setRunCounter] = useState<number>(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const triggerDhcp = () => {
    clearTimers();
    const nextRun = runCounter + 1;
    setRunCounter(nextRun);
    setScenario('dhcp');
    setStep(1);

    timersRef.current.push(
      window.setTimeout(() => setStep(2), 1450),
      window.setTimeout(() => setStep(3), 2950)
    );
  };

  const triggerDns = () => {
    clearTimers();
    const nextRun = runCounter + 1;
    setRunCounter(nextRun);
    setScenario('dns');
    setStep(1);

    timersRef.current.push(window.setTimeout(() => setStep(2), 1600));
  };

  const resetLab = () => {
    clearTimers();
    setScenario('idle');
    setStep(0);
  };

  const packets: AnimatedPillPacket[] = [];
  const badges: TopologyOverlayBadge[] = [];
  let highlightNodes: string[] = [];
  let logicalTunnel: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    secondHop?: { from: { x: number; y: number }; to: { x: number; y: number } };
    extraTunnels?: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }>;
    color: 'udp' | 'tcp' | 'ack' | 'error';
    label?: string;
  } | null = null;
  let trafficSummary: {
    protocol: 'UDP' | 'TCP';
    what: string;
    route: string;
    tone?: 'udp' | 'tcp' | 'ack' | 'error';
  } | null = null;

  if (scenario === 'dhcp') {
    highlightNodes = ['student', 'teacher', 'admin', 'c9200', 'dhcp'];
    trafficSummary = {
      protocol: 'UDP',
      what: 'Solicitudes automáticas de IP (DHCP Discover/Req) desde las 3 VLANs al mismo socket',
      route: 'VLAN 20/30/50 (:68) → C9200 Relay → Win Server DHCP (.10.14:67)',
      tone: step >= 2 ? 'ack' : 'udp'
    };
    badges.push({
      nodeId: 'c9200',
      text: 'DHCP Relay (ip helper-address)',
      tone: 'udp'
    });
    badges.push({
      nodeId: 'dhcp',
      text: 'Socket único (172.16.10.14, 67)',
      tone: step >= 2 ? 'ack' : 'udp'
    });

    if (viewLayer === 'logical') {
      logicalTunnel = {
        from: TOPOLOGY_COORDS.student,
        to: TOPOLOGY_COORDS.dhcp,
        extraTunnels: [
          { from: TOPOLOGY_COORDS.teacher, to: TOPOLOGY_COORDS.dhcp },
          { from: TOPOLOGY_COORDS.admin, to: TOPOLOGY_COORDS.dhcp }
        ],
        color: 'udp',
        label: 'Tupla de 2 UDP → Socket (172.16.10.14, 67)'
      };
    }

    if (step === 1) {
      packets.push(
        {
          id: `dhcp-stu-req-${runCounter}`,
          label: 'Pide IP V20 (:68→:67)',
          color: 'udp',
          points:
            viewLayer === 'physical'
              ? [TOPOLOGY_COORDS.student, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.dhcp]
              : [TOPOLOGY_COORDS.student, TOPOLOGY_COORDS.dhcp],
          duration: 1.35
        },
        {
          id: `dhcp-tea-req-${runCounter}`,
          label: 'Pide IP V30 (:68→:67)',
          color: 'udp',
          points:
            viewLayer === 'physical'
              ? [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.dhcp]
              : [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.dhcp],
          duration: 1.35,
          delay: 0.14
        },
        {
          id: `dhcp-adm-req-${runCounter}`,
          label: 'Pide IP V50 (:68→:67)',
          color: 'udp',
          points:
            viewLayer === 'physical'
              ? [TOPOLOGY_COORDS.admin, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.dhcp]
              : [TOPOLOGY_COORDS.admin, TOPOLOGY_COORDS.dhcp],
          duration: 1.35,
          delay: 0.28
        }
      );
    } else if (step === 2) {
      packets.push(
        {
          id: `dhcp-ack-stu-${runCounter}`,
          label: 'Asigna .20.10 (ACK)',
          color: 'ack',
          points:
            viewLayer === 'physical'
              ? [TOPOLOGY_COORDS.dhcp, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.student]
              : [TOPOLOGY_COORDS.dhcp, TOPOLOGY_COORDS.student],
          duration: 1.35
        },
        {
          id: `dhcp-ack-tea-${runCounter}`,
          label: 'Asigna .30.10 (ACK)',
          color: 'ack',
          points:
            viewLayer === 'physical'
              ? [TOPOLOGY_COORDS.dhcp, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.teacher]
              : [TOPOLOGY_COORDS.dhcp, TOPOLOGY_COORDS.teacher],
          duration: 1.35,
          delay: 0.14
        },
        {
          id: `dhcp-ack-adm-${runCounter}`,
          label: 'Asigna .50.11 (ACK)',
          color: 'ack',
          points:
            viewLayer === 'physical'
              ? [TOPOLOGY_COORDS.dhcp, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.admin]
              : [TOPOLOGY_COORDS.dhcp, TOPOLOGY_COORDS.admin],
          duration: 1.35,
          delay: 0.28
        }
      );
    }
  } else if (scenario === 'dns') {
    highlightNodes = ['student', 'c9200', 'meraki', 'mikrotik', 'opendns'];
    trafficSummary = {
      protocol: 'UDP',
      what: 'Consulta de dominio Web y filtrado de malware al instante (0 ms handshake TCP)',
      route: 'Alumno (.20.10) → C9200 → Meraki → MikroTik → OpenDNS (208.67.222.222:53)',
      tone: step >= 2 ? 'ack' : 'udp'
    };
    badges.push({
      nodeId: 'opendns',
      text: 'UDP 53 (0 ms) • Filtrado Web',
      tone: 'udp'
    });
    badges.push({
      nodeId: 'mikrotik',
      text: 'Salida WAN (NAT)',
      tone: 'udp'
    });

    if (viewLayer === 'logical') {
      logicalTunnel = {
        from: TOPOLOGY_COORDS.student,
        to: TOPOLOGY_COORDS.opendns,
        color: 'udp',
        label: 'Consulta UDP 53 Directa • Sin Handshake TCP'
      };
    }

    if (step === 1) {
      packets.push({
        id: `dns-query-${runCounter}`,
        label: 'Consulta DNS (:53 UDP)',
        color: 'udp',
        points:
          viewLayer === 'physical'
            ? [
                TOPOLOGY_COORDS.student,
                TOPOLOGY_COORDS.c9200,
                TOPOLOGY_COORDS.meraki,
                TOPOLOGY_COORDS.mikrotik,
                TOPOLOGY_COORDS.opendns
              ]
            : [TOPOLOGY_COORDS.student, TOPOLOGY_COORDS.opendns],
        duration: 1.5
      });
    } else if (step === 2) {
      packets.push({
        id: `dns-resp-${runCounter}`,
        label: 'Dominio OK (TCP si >512B)',
        color: 'ack',
        points:
          viewLayer === 'physical'
            ? [
                TOPOLOGY_COORDS.opendns,
                TOPOLOGY_COORDS.mikrotik,
                TOPOLOGY_COORDS.meraki,
                TOPOLOGY_COORDS.c9200,
                TOPOLOGY_COORDS.student
              ]
            : [TOPOLOGY_COORDS.opendns, TOPOLOGY_COORDS.student],
        duration: 1.4
      });
    }
  }

  const cardSurface = isDark
    ? 'bg-[#161618]/90 border-white/[0.09] text-[#F5F5F7]'
    : 'bg-white/95 border-black/[0.07] text-[#1D1D1F] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]';
  const mutedText = isDark ? 'text-[#86868B]' : 'text-[#6E6E73]';
  const wellBg = isDark ? 'bg-black/45 border-white/[0.07]' : 'bg-[#F5F5F7] border-black/[0.06]';

  return (
    <motion.div
      variants={BENTO_STAGGER}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch"
    >
      {/* Columna principal (8 cols) */}
      <motion.div
        variants={BENTO_ITEM}
        className={`lg:col-span-8 rounded-[24px] border backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 ${cardSurface}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className={`text-[10.5px] font-semibold uppercase tracking-[0.06em] block ${mutedText}`}>
              Bloque 2 • Servicios Críticos UDP (0:35 – 1:20)
            </span>
            <h2 className="text-[17px] sm:text-[19px] font-semibold tracking-[-0.025em] mt-0.5">
              DHCP (VLANs 20, 30 y 50) y Cisco OpenDNS en vivo
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={triggerDhcp}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] text-[12px] font-medium transition-colors cursor-pointer ${
                scenario === 'dhcp'
                  ? isDark
                    ? 'bg-[#0A84FF] text-white'
                    : 'bg-[#0071E3] text-white'
                  : isDark
                  ? 'bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#F5F5F7] border border-white/[0.08]'
                  : 'bg-[#1D1D1F] hover:bg-[#2C2C2E] text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" strokeWidth={1.8} />
              1. Solicitud DHCP (UDP 68 -&gt; 67)
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={triggerDns}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] text-[12px] font-medium border transition-colors cursor-pointer ${
                scenario === 'dns'
                  ? isDark
                    ? 'bg-[#0A84FF] border-[#0A84FF] text-white'
                    : 'bg-[#0071E3] border-[#0071E3] text-white'
                  : isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.11] border-white/[0.10] text-[#F5F5F7]'
                  : 'bg-white hover:bg-[#F5F5F7] border-black/[0.10] text-[#1D1D1F]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" strokeWidth={1.8} />
              2. Cisco OpenDNS (UDP 53)
            </motion.button>

            {scenario !== 'idle' && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={resetLab}
                title="Reiniciar simulación"
                className={`p-2 rounded-[12px] border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.05] hover:bg-white/[0.10] border-white/[0.10] text-[#A1A1A6]'
                    : 'bg-black/[0.04] hover:bg-black/[0.08] border-black/[0.08] text-[#6E6E73]'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </div>

        <SchoolTopologySvg
          viewLayer={viewLayer}
          onToggleViewLayer={onToggleViewLayer}
          isDark={isDark}
          packets={packets}
          badges={badges}
          logicalTunnel={logicalTunnel}
          highlightNodes={highlightNodes}
          compact={false}
          trafficSummary={trafficSummary}
        />

        {/* Barra de estado en vivo */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${scenario}-${step}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: APPLE_EASE }}
            className={`rounded-[16px] border px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[12px] ${wellBg}`}
          >
            {scenario === 'idle' && (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
                <span className={mutedText}>
                  Tocá <strong className={isDark ? 'text-[#F5F5F7]' : 'text-[#1D1D1F]'}>1. Solicitud DHCP</strong> para ver VLANs 20, 30 y 50 en un solo socket, o{' '}
                  <strong className={isDark ? 'text-[#F5F5F7]' : 'text-[#1D1D1F]'}>2. Cisco OpenDNS</strong> para ahorro de saludo TCP y filtrado de malware.
                </span>
              </div>
            )}

            {scenario === 'dhcp' && (
              <>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#30D158] shrink-0" strokeWidth={1.9} />
                  <span>
                    {step === 1 && (
                      <>
                        <strong>DHCP Relay en Cisco C9200:</strong> VLAN 20, VLAN 30 y VLAN 50 envían pedidos UDP 68-&gt;67 retransmitidos por <code>ip helper-address</code>.
                      </>
                    )}
                    {step === 2 && (
                      <>
                        <strong>Tupla de 2 en Windows Server:</strong> Las 3 VLANs convergen en el <strong>mismo socket</strong> <code>(172.16.10.14, 67)</code> y reciben su IP.
                      </>
                    )}
                    {step >= 3 && (
                      <>
                        <strong>IPs asignadas sin handshake:</strong> <code>.20.10</code> (VLAN 20), <code>.30.10</code> (VLAN 30) y <code>.50.11</code> (VLAN 50) listas en 1 RTT.
                      </>
                    )}
                  </span>
                </div>
                <span className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full border ${isDark ? 'bg-black/40 border-white/10 text-[#F5F5F7]' : 'bg-white border-black/10 text-[#1D1D1F]'}`}>
                  (172.16.10.14, 67)
                </span>
              </>
            )}

            {scenario === 'dns' && (
              <>
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-[#0A84FF] shrink-0" strokeWidth={1.9} />
                  <span>
                    {step === 1 && (
                      <>
                        <strong>Ahorro del saludo TCP:</strong> Consulta directa por Meraki -&gt; MikroTik hacia OpenDNS (<code>208.67.222.222:53</code>) en UDP.
                      </>
                    )}
                    {step >= 2 && (
                      <>
                        <strong>Resolución y filtrado al instante:</strong> Bloquea malware o sitios indebidos al instante; <strong>TCP 53</strong> queda reservado para respuestas grandes (&gt;512 B).
                      </>
                    )}
                  </span>
                </div>
                <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full border border-[#30D158]/30 bg-[#30D158]/10 text-[#30D158]">
                  UDP 53 (TCP &gt;512B)
                </span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Columna lateral (4 cols) */}
      <motion.div
        variants={BENTO_ITEM}
        className={`lg:col-span-4 rounded-[24px] border backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 ${cardSurface}`}
      >
        <div>
          <span className={`text-[10.5px] uppercase tracking-[0.06em] font-semibold block mb-2 ${mutedText}`}>
            Demultiplexación DHCP (Tupla de 2)
          </span>
          <div className={`rounded-[16px] border p-3 space-y-1.5 text-[11px] ${wellBg}`}>
            <div className="flex items-center justify-between font-mono">
              <span className={mutedText}>VLAN 20 ({SCHOOL_DEVICES.studentPc.ip}:68)</span>
              <span className="font-semibold">-&gt; (172.16.10.14, 67)</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span className={mutedText}>VLAN 30 ({SCHOOL_DEVICES.teacherPc.ip}:68)</span>
              <span className="font-semibold">-&gt; (172.16.10.14, 67)</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span className={mutedText}>VLAN 50 ({SCHOOL_DEVICES.adminPc.ip}:68)</span>
              <span className="font-semibold">-&gt; (172.16.10.14, 67)</span>
            </div>
            <p className={`text-[10.5px] pt-1.5 border-t leading-snug ${isDark ? 'border-white/[0.08]' : 'border-black/[0.07]'} ${mutedText}`}>
              Las 3 VLANs entran al mismo socket usando solo (IP destino, Puerto destino) vía Relay del C9200.
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className={`text-[10.5px] uppercase tracking-[0.06em] font-semibold mb-2 ${mutedText}`}>
            Las 4 Ventajas UDP (Kurose &amp; Ross)
          </div>
          <div className={`rounded-[16px] border divide-y overflow-hidden ${wellBg} ${isDark ? 'divide-white/[0.07]' : 'divide-black/[0.06]'}`}>
            {UDP_FOUR_ADVANTAGES.map((adv) => {
              const Icon = adv.icon;
              return (
                <div key={adv.id} className="px-3 py-2 flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isDark ? 'bg-white/[0.06] text-[#F5F5F7]' : 'bg-white text-[#1D1D1F] shadow-sm'}`}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.7} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold tracking-[-0.01em] leading-tight">
                      {adv.title}
                    </div>
                    <div className={`text-[10.5px] leading-snug mt-0.5 ${mutedText}`}>{adv.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
