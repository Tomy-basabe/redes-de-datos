import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  Lock,
  HardDrive,
  Router,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Clock
} from 'lucide-react';
import {
  SchoolTopologySvg,
  TOPOLOGY_COORDS,
  AnimatedPillPacket,
  TopologyOverlayBadge
} from './SchoolTopologySvg';
import { SCHOOL_DEVICES } from '../../data/cupertinoCorralitosData';

interface Module3TcpSambaWanProps {
  isDark: boolean;
  viewLayer: 'physical' | 'logical';
  onToggleViewLayer?: (layer: 'physical' | 'logical') => void;
}

type SimTab = 'samba' | 'proxy' | 'wan';

const APPLE_EASE = [0.16, 1, 0.3, 1] as const;

const SPRING_APPLE = {
  type: 'spring',
  stiffness: 420,
  damping: 34
} as const;

export const Module3TcpSambaWan: React.FC<Module3TcpSambaWanProps> = ({
  isDark,
  viewLayer,
  onToggleViewLayer
}) => {
  // Orden exacto del guion: 1. Samba -> 2. Proxy Nginx/Apache -> 3. Cierre Multi-WAN PCC
  const [activeTab, setActiveTab] = useState<SimTab>('samba');

  // --- ESTADO SIMULADOR 1: SAMBA DOCENTE ---
  const [sambaStep, setSambaStep] = useState<number>(0);
  const [sambaRun, setSambaRun] = useState<number>(0);
  const [sambaRecoveryMode, setSambaRecoveryMode] = useState<'fast-retransmit' | 'timeout'>(
    'fast-retransmit'
  );

  // --- ESTADO SIMULADOR 2: PROXY INVERSO NGINX -> APACHE + ACL ---
  const [proxyMode, setProxyMode] = useState<'idle' | 'https' | 'acl-block'>('idle');
  const [proxyStep, setProxyStep] = useState<number>(0);
  const [proxyRun, setProxyRun] = useState<number>(0);

  // --- ESTADO SIMULADOR 3: MULTI-WAN MIKROTIK + AIMD ---
  const [wanMode, setWanMode] = useState<'pcc' | 'per-packet'>('pcc');
  const [wanTick, setWanTick] = useState<number>(12);
  const [wanAnimating, setWanAnimating] = useState<boolean>(true);

  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (activeTab !== 'wan' || !wanAnimating) return;
    const interval = window.setInterval(() => {
      setWanTick((prev) => (prev >= 22 ? 6 : prev + 1));
    }, 650);
    return () => window.clearInterval(interval);
  }, [activeTab, wanAnimating]);

  const startSambaLossFlow = (mode = sambaRecoveryMode) => {
    clearTimers();
    setSambaRun((r) => r + 1);
    setSambaRecoveryMode(mode);
    setSambaStep(1);
    timersRef.current.push(
      window.setTimeout(() => setSambaStep(2), 1600),
      window.setTimeout(() => setSambaStep(3), 3200),
      window.setTimeout(() => setSambaStep(4), 4700)
    );
  };

  const startHttpsFlow = () => {
    clearTimers();
    setProxyRun((r) => r + 1);
    setProxyMode('https');
    setProxyStep(1);
    timersRef.current.push(
      window.setTimeout(() => setProxyStep(2), 1450),
      window.setTimeout(() => setProxyStep(3), 2900),
      window.setTimeout(() => setProxyStep(4), 4400)
    );
  };

  const triggerDirectAclBlock = () => {
    clearTimers();
    setProxyRun((r) => r + 1);
    setProxyMode('acl-block');
    setProxyStep(1);
    timersRef.current.push(window.setTimeout(() => setProxyStep(2), 900));
  };

  const buildSambaTopology = () => {
    const packets: AnimatedPillPacket[] = [];
    const badges: TopologyOverlayBadge[] = [];
    const highlightNodes = sambaStep > 0 ? ['samba', 'c9200', 'teacher'] : [];
    const logicalTunnel =
      viewLayer === 'logical' && sambaStep > 0
        ? {
            from: TOPOLOGY_COORDS.samba,
            to: TOPOLOGY_COORDS.teacher,
            color: (sambaStep === 1 || sambaStep === 2 ? 'error' : 'ack') as
              | 'udp'
              | 'tcp'
              | 'ack'
              | 'error',
            label: 'Sesión TCP Samba • Tupla de 4 (:445)'
          }
        : null;

    if (sambaStep > 0) {
      badges.push({
        nodeId: 'samba',
        text:
          sambaStep === 3
            ? sambaRecoveryMode === 'fast-retransmit'
              ? 'Fast Retransmit Seq=1000'
              : 'Timeout RTO -> Retx Seq=1000'
            : sambaStep >= 4
            ? 'ACK=5000 (Docente OK)'
            : 'SMB :445 -> PC Docente 01',
        tone: sambaStep === 3 ? 'error' : sambaStep >= 4 ? 'ack' : 'tcp'
      });
    }

    if (sambaStep === 1) {
      packets.push(
        {
          id: `smb-0-${sambaRun}`,
          label: 'Seq=0 (1000B)',
          color: 'tcp',
          points:
            viewLayer === 'physical'
              ? [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.teacher]
              : [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.teacher],
          duration: 1.15
        },
        {
          id: `smb-1000-lost-${sambaRun}`,
          label: 'Seq=1000 (PERDIDO)',
          color: 'error',
          points: [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.c9200],
          duration: 0.85,
          delay: 0.2,
          stopsAtMiddle: true
        },
        {
          id: `smb-2000-${sambaRun}`,
          label: 'Seq=2000 (Dup #1)',
          color: 'tcp',
          points:
            viewLayer === 'physical'
              ? [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.teacher]
              : [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.teacher],
          duration: 1.2,
          delay: 0.35
        },
        {
          id: `smb-3000-${sambaRun}`,
          label: 'Seq=3000 (Dup #2)',
          color: 'tcp',
          points:
            viewLayer === 'physical'
              ? [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.teacher]
              : [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.teacher],
          duration: 1.2,
          delay: 0.5
        },
        {
          id: `smb-4000-${sambaRun}`,
          label: 'Seq=4000 (Dup #3)',
          color: 'tcp',
          points:
            viewLayer === 'physical'
              ? [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.teacher]
              : [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.teacher],
          duration: 1.2,
          delay: 0.65
        }
      );
    } else if (sambaStep === 2) {
      packets.push({
        id: `smb-dupack-${sambaRun}`,
        label:
          sambaRecoveryMode === 'fast-retransmit'
            ? '3x ACK=1000 (Dup #1..#3)'
            : 'Temporizador RTO Vence!',
        color: 'error',
        points:
          viewLayer === 'physical'
            ? [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.samba]
            : [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.samba],
        duration: 1.35
      });
    } else if (sambaStep === 3) {
      packets.push({
        id: `smb-fastretx-${sambaRun}`,
        label:
          sambaRecoveryMode === 'fast-retransmit'
            ? 'Fast Retx Seq=1000'
            : 'RTO Retx Seq=1000',
        color: 'ack',
        points:
          viewLayer === 'physical'
            ? [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.teacher]
            : [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.teacher],
        duration: 1.3
      });
    } else if (sambaStep >= 4) {
      packets.push({
        id: `smb-ack5000-${sambaRun}`,
        label: 'ACK=5000 (Acumulativo)',
        color: 'ack',
        points:
          viewLayer === 'physical'
            ? [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.samba]
            : [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.samba],
        duration: 1.2
      });
    }

    const trafficSummary =
      sambaStep > 0
        ? {
            protocol: 'TCP' as const,
            what: 'Descarga de material docente en bytes numerados (Seq=0..4000) con control de flujo y ACK acumulativo',
            route: 'Servidor Samba (172.16.10.13:445) → C9200 → PC Docente 01 (.30.10)',
            tone: (sambaStep === 1 || sambaStep === 2
              ? 'error'
              : sambaStep >= 4
              ? 'ack'
              : 'tcp') as 'tcp' | 'ack' | 'error'
          }
        : null;

    return { packets, badges, highlightNodes, logicalTunnel, trafficSummary };
  };

  const buildProxyTopology = () => {
    const packets: AnimatedPillPacket[] = [];
    const badges: TopologyOverlayBadge[] = [];
    let highlightNodes: string[] = [];
    let logicalTunnel: {
      from: { x: number; y: number };
      to: { x: number; y: number };
      secondHop?: { from: { x: number; y: number }; to: { x: number; y: number } };
      color: 'udp' | 'tcp' | 'ack' | 'error';
      label?: string;
    } | null = null;

    if (proxyMode === 'https') {
      highlightNodes = ['student', 'c9200', 'nginx', ...(proxyStep >= 3 ? ['apache'] : [])];
      badges.push({
        nodeId: 'nginx',
        text: proxyStep >= 2 ? 'Tupla #1 (:443) + Proxy' : 'Handshake #1 (:443)',
        tone: 'tcp'
      });
      if (proxyStep >= 3) {
        badges.push({
          nodeId: 'apache',
          text: 'Handshake #2 (:8080)',
          tone: 'ack'
        });
      }

      if (viewLayer === 'logical') {
        logicalTunnel = {
          from: TOPOLOGY_COORDS.student,
          to: TOPOLOGY_COORDS.nginx,
          secondHop:
            proxyStep >= 3
              ? { from: TOPOLOGY_COORDS.nginx, to: TOPOLOGY_COORDS.apache }
              : undefined,
          color: 'tcp',
          label:
            proxyStep >= 3
              ? 'Conexión #1 (:443) + Conexión #2 (:8080)'
              : 'Conexión TCP #1 • Tupla de 4 (:443)'
        };
      }

      if (proxyStep === 1) {
        packets.push({
          id: `px-syn1-${proxyRun}`,
          label: '1) SYN (51514->443)',
          color: 'tcp',
          points:
            viewLayer === 'physical'
              ? [TOPOLOGY_COORDS.student, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.nginx]
              : [TOPOLOGY_COORDS.student, TOPOLOGY_COORDS.nginx],
          duration: 1.35
        });
      } else if (proxyStep === 2) {
        packets.push({
          id: `px-synack1-${proxyRun}`,
          label: 'SYN-ACK / ACK (Tupla #1)',
          color: 'ack',
          points:
            viewLayer === 'physical'
              ? [TOPOLOGY_COORDS.nginx, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.student]
              : [TOPOLOGY_COORDS.nginx, TOPOLOGY_COORDS.student],
          duration: 1.3
        });
      } else if (proxyStep === 3) {
        packets.push({
          id: `px-syn2-${proxyRun}`,
          label: '2) Saludo 3 pasos (:8080)',
          color: 'tcp',
          points: [TOPOLOGY_COORDS.nginx, TOPOLOGY_COORDS.apache],
          duration: 1.25
        });
      } else if (proxyStep >= 4) {
        packets.push({
          id: `px-res-${proxyRun}`,
          label: 'HTTP 200 OK vía Nginx',
          color: 'ack',
          points:
            viewLayer === 'physical'
              ? [
                  TOPOLOGY_COORDS.apache,
                  TOPOLOGY_COORDS.nginx,
                  TOPOLOGY_COORDS.c9200,
                  TOPOLOGY_COORDS.student
                ]
              : [TOPOLOGY_COORDS.apache, TOPOLOGY_COORDS.nginx, TOPOLOGY_COORDS.student],
          duration: 1.5
        });
      }
    } else if (proxyMode === 'acl-block') {
      highlightNodes = ['student', 'c9200', 'apache_err'];
      badges.push({
        nodeId: 'c9200',
        text: 'ACL DROP: VLAN20 -> :8080',
        tone: 'error'
      });
      badges.push({
        nodeId: 'apache',
        text: 'Aislado (Solo Nginx)',
        tone: 'ack'
      });

      if (viewLayer === 'logical') {
        logicalTunnel = {
          from: TOPOLOGY_COORDS.student,
          to: TOPOLOGY_COORDS.apache,
          color: 'error',
          label: 'Bloqueo ACL C9200 (TCP :8080 denegado)'
        };
      }

      packets.push({
        id: `acl-drop-${proxyRun}`,
        label: 'SYN :8080 (ACL DROP)',
        color: 'error',
        points: [TOPOLOGY_COORDS.student, TOPOLOGY_COORDS.c9200],
        duration: 0.9,
        stopsAtMiddle: true
      });
    }

    const trafficSummary =
      proxyMode === 'https'
        ? {
            protocol: 'TCP' as const,
            what: 'Portal Web Escolar: 2 conexiones TCP independientes con su propio saludo de 3 pasos',
            route: 'Alumno (.20.10:51514) → Nginx (.10.12:443) → Apache (.10.11:8080)',
            tone: (proxyStep >= 4 ? 'ack' : 'tcp') as 'tcp' | 'ack'
          }
        : proxyMode === 'acl-block'
        ? {
            protocol: 'TCP' as const,
            what: 'Intento de acceso TCP directo al puerto interno 8080 rechazado por ACL del switch Core',
            route: 'Alumno (.20.10) ✕ BLOQUEADO en C9200 → Apache (:8080 aislado)',
            tone: 'error' as const
          }
        : null;

    return { packets, badges, highlightNodes, logicalTunnel, trafficSummary };
  };

  const buildAimdSeries = () => {
    const pccPoints: Array<{ rtt: number; cwnd: number; ssthresh: number; loss?: boolean }> = [];
    const perPacketPoints: Array<{ rtt: number; cwnd: number; ssthresh: number; loss?: boolean }> = [];

    // Modelo fiel a Kurose & Ross Fig. 3.53 (TCP Reno) + Fig. 3.54 (Diente de sierra AIMD):
    // Slow Start (1->2->4->8 hasta ssthresh=8), Evitación (+1/RTT hasta 12 en RTT 8),
    // 3 ACK Dup -> ssthresh = cwnd/2 = 6, cwnd = 6 en RTT 9; sube +1 hasta 14 en RTT 17 -> cae a 7.
    let cwndPcc = 1;
    let ssthreshPcc = 8;
    for (let rtt = 1; rtt <= 22; rtt++) {
      const isLossEvent = rtt === 8 || rtt === 17;
      pccPoints.push({ rtt, cwnd: cwndPcc, ssthresh: ssthreshPcc, loss: isLossEvent });
      if (isLossEvent) {
        ssthreshPcc = Math.floor(cwndPcc / 2);
        cwndPcc = ssthreshPcc;
      } else if (cwndPcc < ssthreshPcc) {
        cwndPcc = Math.min(ssthreshPcc, cwndPcc * 2);
      } else {
        cwndPcc += 1;
      }
    }

    let cwndErr = 1;
    let ssthreshErr = 8;
    for (let rtt = 1; rtt <= 22; rtt++) {
      const isFalseDup = rtt === 4 || rtt === 8 || rtt === 12 || rtt === 16 || rtt === 20;
      perPacketPoints.push({ rtt, cwnd: cwndErr, ssthresh: ssthreshErr, loss: isFalseDup });
      if (isFalseDup) {
        ssthreshErr = Math.max(2, Math.floor(cwndErr / 2));
        cwndErr = ssthreshErr;
      } else {
        cwndErr = cwndErr < ssthreshErr ? Math.min(ssthreshErr, cwndErr * 2) : Math.min(5, cwndErr + 1);
      }
    }

    return { pccPoints, perPacketPoints };
  };

  const { pccPoints, perPacketPoints } = buildAimdSeries();
  const activeAimdSeries = wanMode === 'pcc' ? pccPoints : perPacketPoints;
  const currentSample = activeAimdSeries[Math.min(wanTick - 1, activeAimdSeries.length - 1)];

  const cardSurface = isDark
    ? 'bg-[#161618]/90 border-white/[0.09] text-[#F5F5F7]'
    : 'bg-white/95 border-black/[0.07] text-[#1D1D1F] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]';
  const wellBg = isDark ? 'bg-black/45 border-white/[0.07]' : 'bg-[#F5F5F7] border-black/[0.06]';
  const mutedText = isDark ? 'text-[#86868B]' : 'text-[#6E6E73]';
  const accentText = isDark ? 'text-[#0A84FF]' : 'text-[#0071E3]';

  const sambaTopo = buildSambaTopology();
  const proxyTopo = buildProxyTopology();

  return (
    <div className="flex flex-col gap-3">
      {/* Segmented Control en el orden exacto de exposición */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className={`inline-flex p-1 rounded-[14px] border backdrop-blur-xl ${
            isDark
              ? 'bg-black/55 border-white/[0.08]'
              : 'bg-[#E8E8ED]/80 border-black/[0.05]'
          }`}
        >
          {(
            [
              { id: 'samba', label: '1. Samba (TCP 445)', icon: HardDrive },
              { id: 'proxy', label: '2. Proxy Nginx -> Apache', icon: Lock },
              { id: 'wan', label: '3. Multi-WAN PCC & AIMD', icon: Router }
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-[12px] font-medium transition-colors cursor-pointer ${
                  active
                    ? isDark
                      ? 'text-[#F5F5F7]'
                      : 'text-[#1D1D1F]'
                    : mutedText
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="block3-seg-pill"
                    transition={SPRING_APPLE}
                    className={`absolute inset-0 rounded-[10px] ${
                      isDark
                        ? 'bg-[#2C2C2E] border border-white/[0.12] shadow-sm'
                        : 'bg-white border border-black/[0.06] shadow-sm'
                    }`}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 relative z-10 ${active ? accentText : mutedText}`} strokeWidth={1.75} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <span className={`text-[10.5px] font-semibold uppercase tracking-[0.06em] ${mutedText}`}>
          Bloque 3 • Fiabilidad TCP &amp; Congestión (1:20 – 2:30)
        </span>
      </div>

      {/* CONTENIDO DEL SUB-SIMULADOR ACTIVO */}
      <AnimatePresence mode="wait">
        {/* === 1. SAMBA DOCENTE === */}
        {activeTab === 'samba' && (
          <motion.div
            key="tab-samba"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: APPLE_EASE }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch"
          >
            <div
              className={`lg:col-span-7 rounded-[24px] border backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 ${cardSurface}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-[16px] font-semibold tracking-[-0.02em]">
                    Samba (<code>172.16.10.13:445</code>) -&gt; Docente (<code>172.16.30.10</code>)
                  </h3>
                  <p className={`text-[12px] mt-0.5 ${mutedText}`}>
                    Numera bytes con <code>Seq</code>, confirma con <code>ACK</code> acumulativo y reenvía ante pérdida.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Switch Rápida Retransmisión vs Temporizador */}
                  <div
                    className={`inline-flex p-0.5 rounded-xl border text-[11px] font-medium ${
                      isDark ? 'bg-black/55 border-white/[0.08]' : 'bg-[#E8E8ED]/80 border-black/[0.06]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSambaRecoveryMode('fast-retransmit')}
                      className={`px-2 py-1 rounded-[9px] transition-colors cursor-pointer ${
                        sambaRecoveryMode === 'fast-retransmit'
                          ? isDark
                            ? 'bg-[#2C2C2E] text-white'
                            : 'bg-white text-[#1D1D1F] shadow-sm'
                          : mutedText
                      }`}
                    >
                      3 ACK Dup
                    </button>
                    <button
                      type="button"
                      onClick={() => setSambaRecoveryMode('timeout')}
                      className={`px-2 py-1 rounded-[9px] transition-colors cursor-pointer inline-flex items-center gap-1 ${
                        sambaRecoveryMode === 'timeout'
                          ? isDark
                            ? 'bg-[#2C2C2E] text-white'
                            : 'bg-white text-[#1D1D1F] shadow-sm'
                          : mutedText
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      Timeout RTO
                    </button>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => startSambaLossFlow(sambaRecoveryMode)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] text-[12px] font-medium text-white transition-colors cursor-pointer ${
                      isDark ? 'bg-[#0A84FF] hover:bg-[#0071E3]' : 'bg-[#0071E3] hover:bg-[#0062C4]'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Descargar Material Docente
                  </motion.button>

                  {sambaStep > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      type="button"
                      onClick={() => {
                        clearTimers();
                        setSambaStep(0);
                      }}
                      className={`p-2 rounded-[12px] border cursor-pointer ${wellBg}`}
                      title="Reiniciar Samba"
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
                packets={sambaTopo.packets}
                badges={sambaTopo.badges}
                logicalTunnel={sambaTopo.logicalTunnel}
                highlightNodes={sambaTopo.highlightNodes}
                trafficSummary={sambaTopo.trafficSummary}
                compact
              />

              <div className={`rounded-[16px] border p-3 text-[12px] space-y-2 ${wellBg}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Layers className={`w-3.5 h-3.5 ${accentText}`} strokeWidth={1.8} />
                    Buffer de Recepción (PC Docente 01 — VLAN 30)
                  </span>
                  <span className={`font-mono text-[11px] ${mutedText}`}>
                    {sambaStep === 0 && 'Esperando descarga de material...'}
                    {sambaStep === 1 && 'Seq=0 OK (ACK=1000); Seq=1000 perdido (2000/3000/4000 retenidos)'}
                    {sambaStep === 2 &&
                      (sambaRecoveryMode === 'fast-retransmit'
                        ? '3x ACK=1000 duplicados -> Retransmisión rápida'
                        : 'Temporizador vence (Timeout RTO) -> cwnd cae a 1 MSS')}
                    {sambaStep === 3 && 'Samba reenvía Seq=1000 perdido'}
                    {sambaStep >= 4 && 'ACK=5000 Acumulativo -> Archivo 100% íntegro'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { seq: 0, state: sambaStep >= 1 ? 'ok' : 'idle', label: '0..999 B' },
                    {
                      seq: 1000,
                      state:
                        sambaStep === 0
                          ? 'idle'
                          : sambaStep === 1 || sambaStep === 2
                          ? 'lost'
                          : sambaStep === 3
                          ? 'retx'
                          : 'ok',
                      label: '1000..1999 B'
                    },
                    {
                      seq: 2000,
                      state:
                        sambaStep === 0
                          ? 'idle'
                          : sambaStep >= 1 && sambaStep < 4
                          ? 'buffered'
                          : 'ok',
                      label: '2000..2999 B'
                    },
                    {
                      seq: 3000,
                      state:
                        sambaStep === 0
                          ? 'idle'
                          : sambaStep >= 1 && sambaStep < 4
                          ? 'buffered'
                          : 'ok',
                      label: '3000..3999 B'
                    },
                    {
                      seq: 4000,
                      state:
                        sambaStep === 0
                          ? 'idle'
                          : sambaStep >= 1 && sambaStep < 4
                          ? 'buffered'
                          : 'ok',
                      label: '4000..4999 B'
                    }
                  ].map((seg) => {
                    const styleMap = {
                      idle: isDark
                        ? 'border-white/[0.08] bg-white/[0.03] text-[#86868B]'
                        : 'border-black/[0.07] bg-white text-[#6E6E73]',
                      ok: 'border-[#30D158]/45 bg-[#30D158]/10 text-[#30D158]',
                      lost: 'border-[#FF453A]/50 bg-[#FF453A]/10 text-[#FF453A]',
                      buffered: 'border-[#FF9F0A]/50 bg-[#FF9F0A]/10 text-[#FF9F0A]',
                      retx: 'border-[#0A84FF]/55 bg-[#0A84FF]/15 text-[#0A84FF]'
                    };
                    const dupIdx = seg.seq >= 2000 ? (seg.seq - 1000) / 1000 : 0;
                    const tagMap = {
                      idle: 'Pendiente',
                      ok: 'Entregado',
                      lost: 'HUECO',
                      buffered: `Dup #${dupIdx}`,
                      retx: 'Reenviado'
                    };
                    return (
                      <motion.div
                        key={seg.seq}
                        layout
                        className={`rounded-xl border p-2 text-center transition-colors ${styleMap[seg.state]}`}
                      >
                        <div className="font-mono font-semibold text-[11px]">Seq={seg.seq}</div>
                        <div className="text-[10px] opacity-75">{seg.label}</div>
                        <div className="text-[10px] font-semibold mt-0.5">{tagMap[seg.state]}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div
              className={`lg:col-span-5 rounded-[24px] border backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 ${cardSurface}`}
            >
              <div>
                <div className={`text-[10.5px] uppercase tracking-[0.06em] font-semibold mb-2.5 ${mutedText}`}>
                  Control de Flujo (rwnd) vs. Congestión (cwnd)
                </div>

                <div className="space-y-3">
                  <div className={`rounded-[16px] border p-3 ${wellBg}`}>
                    <div className="flex items-center justify-between text-[12px] font-semibold mb-1.5">
                      <span>Control de Flujo (rwnd — PC Docente)</span>
                      <span className="font-mono text-[#30D158]">64 KB</span>
                    </div>
                    <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`}>
                      <motion.div
                        className="h-full rounded-full bg-[#30D158]"
                        initial={{ width: '92%' }}
                        animate={{ width: sambaStep === 2 ? '84%' : '92%' }}
                        transition={{ duration: 0.45, ease: APPLE_EASE }}
                      />
                    </div>
                    <p className={`text-[11px] mt-1.5 ${mutedText}`}>
                      Regula el envío para no saturar el buffer de memoria de la PC docente.
                    </p>
                  </div>

                  <div className={`rounded-[16px] border p-3 ${wellBg}`}>
                    <div className="flex items-center justify-between text-[12px] font-semibold mb-1.5">
                      <span>Control de Congestión (cwnd — Red)</span>
                      <span className="font-mono">
                        {sambaStep === 0 && '12 MSS'}
                        {sambaStep === 1 && '12 MSS (En vuelo)'}
                        {(sambaStep === 2 || sambaStep === 3) &&
                          (sambaRecoveryMode === 'fast-retransmit'
                            ? '9 MSS (umbral 6 + 3)'
                            : '1 MSS (Slow Start RTO)')}
                        {sambaStep >= 4 &&
                          (sambaRecoveryMode === 'fast-retransmit'
                            ? '6 MSS (Evit. Cong.)'
                            : '2 MSS (Slow Start)')}
                      </span>
                    </div>
                    <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`}>
                      <motion.div
                        className={`h-full rounded-full ${
                          sambaStep === 2 || sambaStep === 3
                            ? sambaRecoveryMode === 'timeout'
                              ? 'bg-[#FF453A]'
                              : 'bg-[#FF9F0A]'
                            : 'bg-[#0A84FF]'
                        }`}
                        animate={{
                          width:
                            sambaStep === 2 || sambaStep === 3
                              ? sambaRecoveryMode === 'timeout'
                                ? '12%'
                                : '62%'
                              : sambaStep >= 4
                              ? sambaRecoveryMode === 'timeout'
                                ? '20%'
                                : '48%'
                              : '80%'
                        }}
                        transition={{ duration: 0.45, ease: APPLE_EASE }}
                      />
                    </div>
                    <p className={`text-[11px] mt-1.5 ${mutedText}`}>
                      {sambaRecoveryMode === 'fast-retransmit'
                        ? '3 ACKs dup fijan umbral = cwnd/2 (6 MSS), cwnd = 6 + 3 en Rec. Rápida y al llegar ACK nuevo pasa a 6 MSS.'
                        : 'Si vence RTO, umbral = 6 MSS, cwnd cae a 1 MSS y reinicia Arranque Lento (duplica por RTT).'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`rounded-[16px] border p-3 text-[11.5px] space-y-1 ${wellBg}`}>
                <div className="font-semibold flex items-center gap-1.5">
                  <Activity className={`w-3.5 h-3.5 ${accentText}`} strokeWidth={1.8} />
                  Detección dual de pérdidas
                </div>
                <p className={`text-[11px] leading-relaxed ${mutedText}`}>
                  Alterná arriba entre <strong>3 ACK Dup</strong> (retransmisión rápida sin esperar) y <strong>Timeout RTO</strong> (vencimiento de temporizador) para demostrar ambos mecanismos frente al docente.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* === 2. PROXY INVERSO NGINX -> APACHE === */}
        {activeTab === 'proxy' && (
          <motion.div
            key="tab-proxy"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: APPLE_EASE }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch"
          >
            <div
              className={`lg:col-span-8 rounded-[24px] border backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 ${cardSurface}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-[16px] font-semibold tracking-[-0.02em]">
                    Proxy Inverso Nginx (<code>:443</code>) -&gt; Apache (<code>:8080</code>) y ACL C9200
                  </h3>
                  <p className={`text-[12px] mt-0.5 ${mutedText}`}>
                    Dos conexiones TCP independientes por Tupla de 4, cada una con su saludo de 3 pasos (SYN, SYN-ACK, ACK).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={startHttpsFlow}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] text-[12px] font-medium transition-colors cursor-pointer ${
                      proxyMode === 'https'
                        ? isDark
                          ? 'bg-[#0A84FF] text-white'
                          : 'bg-[#0071E3] text-white'
                        : isDark
                        ? 'bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#F5F5F7] border border-white/[0.08]'
                        : 'bg-[#1D1D1F] hover:bg-[#2C2C2E] text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" strokeWidth={1.8} />
                    Iniciar Sesión HTTPS Web
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={triggerDirectAclBlock}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] text-[12px] font-medium border transition-colors cursor-pointer ${
                      proxyMode === 'acl-block'
                        ? 'bg-[#FF453A] border-[#FF453A] text-white'
                        : isDark
                        ? 'bg-white/[0.05] hover:bg-[#FF453A]/15 border-white/[0.10] text-[#FF453A]'
                        : 'bg-white hover:bg-[#FF453A]/10 border-black/[0.10] text-[#D70015]'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.8} />
                    Acceso Directo Alumno -&gt; Apache:8080
                  </motion.button>
                </div>
              </div>

              <SchoolTopologySvg
                viewLayer={viewLayer}
                onToggleViewLayer={onToggleViewLayer}
                isDark={isDark}
                packets={proxyTopo.packets}
                badges={proxyTopo.badges}
                logicalTunnel={proxyTopo.logicalTunnel}
                highlightNodes={proxyTopo.highlightNodes}
                trafficSummary={proxyTopo.trafficSummary}
                compact={false}
              />

              {/* Barra con píldoras SYN -> SYN-ACK -> ACK en tiempo real */}
              <div className={`rounded-[16px] border px-4 py-2.5 text-[12px] flex flex-wrap items-center justify-between gap-2 ${wellBg}`}>
                {proxyMode === 'idle' && (
                  <span className={mutedText}>
                    Ejecutá <strong className={isDark ? 'text-[#F5F5F7]' : 'text-[#1D1D1F]'}>Iniciar Sesión HTTPS Web</strong> para mostrar ambos Handshakes independientes, o probá la <strong className={isDark ? 'text-[#F5F5F7]' : 'text-[#1D1D1F]'}>ACL del C9200</strong>.
                  </span>
                )}
                {proxyMode === 'https' && (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#30D158] shrink-0" strokeWidth={1.9} />
                      <span>
                        {proxyStep === 1 && 'Conexión #1: PC Estudiante envía SYN hacia Nginx (172.16.10.12:443)...'}
                        {proxyStep === 2 && 'Conexión #1 establecida (SYN-ACK + ACK) con Tupla de 4 #1.'}
                        {proxyStep === 3 && 'Conexión #2: Nginx actúa como cliente hacia Apache (172.16.10.11:8080).'}
                        {proxyStep >= 4 && 'Ambas conexiones TCP activas: el alumno nunca toca el puerto 8080.'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      {(['SYN', 'SYN-ACK', 'ACK'] as const).map((flag, i) => (
                        <span
                          key={flag}
                          className={`px-2 py-0.5 rounded-full border ${
                            proxyStep >= i + 1
                              ? 'border-[#30D158]/40 bg-[#30D158]/15 text-[#30D158]'
                              : isDark
                              ? 'border-white/10 text-[#636366]'
                              : 'border-black/10 text-[#86868B]'
                          }`}
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                {proxyMode === 'acl-block' && (
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#FF453A] shrink-0" strokeWidth={1.9} />
                    <span>
                      <strong className="text-[#FF453A]">Bloqueo ACL en Cisco C9200 (172.16.10.1):</strong> Ningún alumno de VLAN 20 puede alcanzar directo el puerto interno <code>8080</code> de Apache.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`lg:col-span-4 rounded-[24px] border backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 ${cardSurface}`}
            >
              <div>
                <div className={`text-[10.5px] uppercase tracking-[0.06em] font-semibold mb-2.5 ${mutedText}`}>
                  Dos Conexiones Independientes (Tupla de 4)
                </div>

                <div className="space-y-2.5">
                  <div
                    className={`rounded-[16px] border p-3 transition-colors ${
                      proxyMode === 'https' && proxyStep >= 2
                        ? isDark
                          ? 'border-[#0A84FF]/50 bg-[#0A84FF]/[0.08]'
                          : 'border-[#0071E3]/40 bg-[#0071E3]/[0.05]'
                        : wellBg
                    }`}
                  >
                    <div className="flex items-center justify-between text-[12px] font-semibold mb-1">
                      <span>Conexión #1 (Alumno -&gt; Nginx)</span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            proxyMode === 'https' && proxyStep >= 2 ? 'bg-[#30D158]' : 'bg-[#86868B]'
                          }`}
                        />
                        {proxyMode === 'https' && proxyStep >= 2 ? 'ESTABLISHED' : 'ESPERA'}
                      </span>
                    </div>
                    <div className={`font-mono text-[11px] ${accentText}`}>
                      (172.16.20.10, 51514, 172.16.10.12, 443)
                    </div>
                    <p className={`text-[11px] mt-1 ${mutedText}`}>
                      3-Way Handshake independiente con terminación TLS HTTPS.
                    </p>
                  </div>

                  <div
                    className={`rounded-[16px] border p-3 transition-colors ${
                      proxyMode === 'https' && proxyStep >= 3
                        ? 'border-[#30D158]/45 bg-[#30D158]/[0.06]'
                        : wellBg
                    }`}
                  >
                    <div className="flex items-center justify-between text-[12px] font-semibold mb-1">
                      <span>Conexión #2 (Nginx -&gt; Apache)</span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            proxyMode === 'https' && proxyStep >= 3 ? 'bg-[#30D158]' : 'bg-[#86868B]'
                          }`}
                        />
                        {proxyMode === 'https' && proxyStep >= 3 ? 'ESTABLISHED' : 'ESPERA'}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-[#30D158]">
                      (172.16.10.12, 53000, 172.16.10.11, 8080)
                    </div>
                    <p className={`text-[11px] mt-1 ${mutedText}`}>
                      2° 3-Way Handshake interno donde Nginx actúa como cliente frente a Apache.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`rounded-[16px] border p-3 text-[11px] ${wellBg}`}>
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  <Shield className={`w-3.5 h-3.5 ${accentText}`} strokeWidth={1.8} />
                  Aislamiento de Puerto 8080 por ACL
                </div>
                <p className={mutedText}>
                  El switch Core C9200 bloquea el acceso directo desde VLAN 20 hacia <code>172.16.10.11:8080</code>, obligando todo tráfico web a pasar por Nginx.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* === 3. MULTI-WAN MIKROTIK & AIMD === */}
        {activeTab === 'wan' && (
          <motion.div
            key="tab-wan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: APPLE_EASE }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch"
          >
            <div
              className={`lg:col-span-6 rounded-[24px] border backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 ${cardSurface}`}
            >
              <div>
                <h3 className="text-[16px] font-semibold tracking-[-0.02em]">
                  Cierre Multi-WAN: MikroTik hEX RB750Gr3 (<code>172.16.10.5</code>)
                </h3>
                <p className={`text-[12px] mt-0.5 ${mutedText}`}>
                  3 ISPs balanceados con PCC proporcional: por conexión vs. por paquete.
                </p>
              </div>

              <div
                className={`grid grid-cols-2 gap-1.5 p-1 rounded-[14px] border ${
                  isDark ? 'bg-black/55 border-white/[0.08]' : 'bg-[#E8E8ED]/80 border-black/[0.05]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setWanMode('pcc')}
                  className={`px-3 py-1.5 rounded-[10px] text-[11.5px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    wanMode === 'pcc'
                      ? isDark
                        ? 'bg-[#2C2C2E] text-[#F5F5F7] border border-white/[0.12] shadow-sm'
                        : 'bg-white text-[#1D1D1F] shadow-sm'
                      : mutedText
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
                  Balanceo PCC por Conexión
                </button>
                <button
                  type="button"
                  onClick={() => setWanMode('per-packet')}
                  className={`px-3 py-1.5 rounded-[10px] text-[11.5px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    wanMode === 'per-packet'
                      ? 'bg-[#FF453A] text-white shadow-sm'
                      : mutedText
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Balanceo por Paquete (Error)
                </button>
              </div>

              <div className="space-y-2">
                {SCHOOL_DEVICES.mikrotik.isps.map((isp, idx) => {
                  const isAssignedFlow = wanMode === 'pcc' ? isp.id === 'tachicom' : true;
                  return (
                    <div key={isp.id} className={`rounded-[16px] border p-2.5 ${wellBg}`}>
                      <div className="flex items-center justify-between text-[11.5px] mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              wanMode === 'pcc' && isp.id === 'tachicom'
                                ? 'bg-[#30D158]'
                                : wanMode === 'per-packet'
                                ? 'bg-[#FF453A]'
                                : 'bg-[#86868B]'
                            }`}
                          />
                          <span className="font-semibold">{isp.name}</span>
                          <span className={`font-mono text-[10.5px] ${mutedText}`}>
                            {isp.speed} • [{isp.weight}%]
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-semibold">~{isp.rttMs} ms</span>
                      </div>

                      <div
                        className={`relative h-5 rounded-full border overflow-hidden flex items-center px-1.5 ${
                          isDark ? 'bg-black/60 border-white/[0.08]' : 'bg-white border-black/[0.08]'
                        }`}
                      >
                        {isAssignedFlow ? (
                          <motion.div
                            key={`${wanMode}-${isp.id}`}
                            className={`h-3.5 px-2.5 rounded-full text-[9px] font-mono font-semibold flex items-center whitespace-nowrap ${
                              wanMode === 'pcc'
                                ? isDark
                                  ? 'bg-[#0A84FF] text-white'
                                  : 'bg-[#0071E3] text-white'
                                : 'bg-[#FF453A] text-white'
                            }`}
                            initial={{ x: 0 }}
                            animate={{ x: [0, 230] }}
                            transition={{
                              repeat: Infinity,
                              duration: isp.rttMs / 15,
                              delay: idx * 0.14,
                              ease: 'linear'
                            }}
                          >
                            {wanMode === 'pcc'
                              ? 'Tupla #1 ordenada (Seq 0,1000,2000)'
                              : idx === 0
                              ? 'Seq=1000 (42ms lento!)'
                              : idx === 1
                              ? 'Seq=3000 (18ms)'
                              : 'Seq=2000 (11ms rápido)'}
                          </motion.div>
                        ) : (
                          <span className={`text-[10px] pl-1 ${mutedText}`}>
                            Disponible para otras Tuplas de 4 en concurrencia
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className={`rounded-[16px] border p-3 text-[11.5px] leading-snug ${
                  wanMode === 'pcc'
                    ? isDark
                      ? 'border-white/[0.10] bg-white/[0.03] text-[#F5F5F7]'
                      : 'border-black/[0.08] bg-white text-[#1D1D1F]'
                    : 'border-[#FF453A]/35 bg-[#FF453A]/[0.08] text-[#FF453A]'
                }`}
              >
                {wanMode === 'pcc' ? (
                  <span>
                    <strong>PCC por conexión:</strong> Cada sesión TCP completa sale por un mismo ISP (los 3 enlaces se aprovechan entre múltiples conexiones concurrentes). No altera el orden ni sustituye el control de congestión de TCP.
                  </span>
                ) : (
                  <span>
                    <strong>Balanceo por paquete:</strong> Segmentos del mismo flujo TCP toman proveedores con distinto retardo, llegan desordenados, disparan <strong>3 ACK duplicados falsos</strong> y derrumban la ventana <code>cwnd</code>.
                  </span>
                )}
              </div>
            </div>

            <div
              className={`lg:col-span-6 rounded-[24px] border backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 ${cardSurface}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className={`text-[10.5px] uppercase tracking-[0.06em] font-semibold ${mutedText}`}>
                    Dinámica AIMD (Fig. 3.53 / 3.54)
                  </span>
                  <h4 className="text-[15px] font-semibold tracking-[-0.02em]">
                    Ventana de congestión TCP (<code>cwnd</code>)
                  </h4>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setWanAnimating((a) => !a)}
                  className={`px-3 py-1 rounded-[10px] border text-[11px] font-medium cursor-pointer ${wellBg}`}
                >
                  {wanAnimating ? 'Pausar Traza' : 'Reanudar Traza'}
                </motion.button>
              </div>

              <div className={`rounded-[18px] border p-3 ${wellBg}`}>
                <svg viewBox="0 0 460 205" className="w-full h-48 select-none">
                  {[4, 8, 12, 16].map((val) => {
                    const y = 175 - (val / 16) * 145;
                    return (
                      <g key={val}>
                        <line
                          x1={40}
                          y1={y}
                          x2={440}
                          y2={y}
                          stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}
                          strokeDasharray="3 3"
                        />
                        <text
                          x={14}
                          y={y + 4}
                          fontSize={10}
                          fill={isDark ? '#86868B' : '#6E6E73'}
                          fontFamily="monospace"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  <line
                    x1={40}
                    y1={20}
                    x2={40}
                    y2={175}
                    stroke={isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.25)'}
                  />
                  <line
                    x1={40}
                    y1={175}
                    x2={440}
                    y2={175}
                    stroke={isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.25)'}
                  />

                  {(() => {
                    const visible = activeAimdSeries.slice(0, wanTick);
                    const pathData = visible
                      .map((pt, i) => {
                        const x = 45 + ((pt.rtt - 1) / 21) * 390;
                        const y = 175 - (pt.cwnd / 16) * 145;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ');
                    const ssthreshPathData = visible
                      .map((pt, i) => {
                        const x = 45 + ((pt.rtt - 1) / 21) * 390;
                        const y = 175 - (pt.ssthresh / 16) * 145;
                        if (i === 0) return `M ${x} ${y}`;
                        const prevY = 175 - (visible[i - 1].ssthresh / 16) * 145;
                        return prevY !== y ? `H ${x} V ${y}` : `L ${x} ${y}`;
                      })
                      .join(' ');
                    const strokeColor = wanMode === 'pcc' ? '#0A84FF' : '#FF453A';
                    const latestPt = visible[visible.length - 1];
                    const latestSsthreshY = 175 - (latestPt.ssthresh / 16) * 145;
                    return (
                      <>
                        {/* Umbral ssthresh dinámico (Fig. 3.53: 8 -> 6 -> 7) */}
                        <path
                          d={ssthreshPathData}
                          fill="none"
                          stroke="#FF9F0A"
                          strokeDasharray="5 4"
                          strokeWidth={1.35}
                          strokeOpacity={0.85}
                        />
                        <text
                          x={335}
                          y={Math.max(16, latestSsthreshY - 6)}
                          fontSize={10}
                          fill="#FF9F0A"
                          fontWeight={600}
                        >
                          ssthresh = {latestPt.ssthresh} MSS
                        </text>

                        <motion.path
                          key={`aimd-${wanMode}`}
                          d={pathData}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0.7 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.35, ease: APPLE_EASE }}
                        />
                        {visible.map((pt, idx) => {
                          const x = 45 + ((pt.rtt - 1) / 21) * 390;
                          const y = 175 - (pt.cwnd / 16) * 145;
                          const isLatest = idx === visible.length - 1;
                          return (
                            <g key={pt.rtt}>
                              <circle
                                cx={x}
                                cy={y}
                                r={pt.loss ? 4.4 : isLatest ? 4.2 : 2.8}
                                fill={pt.loss ? '#FF9F0A' : strokeColor}
                                stroke={isDark ? '#161618' : '#FFFFFF'}
                                strokeWidth={1.2}
                              />
                              {pt.loss && wanMode === 'pcc' && (
                                <text
                                  x={x - 16}
                                  y={Math.max(14, y - 8)}
                                  fontSize={9}
                                  fill="#FF9F0A"
                                  fontWeight={600}
                                >
                                  3-ACK
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}

                  <text
                    x={175}
                    y={196}
                    fontSize={10}
                    fill={isDark ? '#86868B' : '#6E6E73'}
                    fontWeight={600}
                  >
                    Ciclos de Transmisión (RTT) — Reno / AIMD
                  </text>
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className={`rounded-[14px] border p-2.5 text-center ${wellBg}`}>
                  <div className={`text-[10px] ${mutedText}`}>cwnd Actual</div>
                  <div
                    className={`text-[15px] font-semibold font-mono apple-tabular mt-0.5 ${
                      wanMode === 'pcc' ? accentText : 'text-[#FF453A]'
                    }`}
                  >
                    {currentSample.cwnd} MSS
                  </div>
                </div>
                <div className={`rounded-[14px] border p-2.5 text-center ${wellBg}`}>
                  <div className={`text-[10px] ${mutedText}`}>Falsos 3-ACK Dup</div>
                  <div className="text-[15px] font-semibold font-mono apple-tabular mt-0.5">
                    {wanMode === 'pcc' ? '0 / seg' : 'Frecuentes'}
                  </div>
                </div>
                <div className={`rounded-[14px] border p-2.5 text-center ${wellBg}`}>
                  <div className={`text-[10px] ${mutedText}`}>Uso Multi-WAN</div>
                  <div className="text-[15px] font-semibold font-mono apple-tabular mt-0.5">
                    {wanMode === 'pcc' ? '~94%' : '~29%'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
