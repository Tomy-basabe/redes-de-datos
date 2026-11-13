import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  SchoolTopologySvg,
  TOPOLOGY_COORDS,
  IspId,
  AnimatedPillPacket,
  TopologyOverlayBadge,
  TopologyTrafficSummary
} from './SchoolTopologySvg';
import { TransportFlowId } from '../../data/cupertinoCorralitosData';

interface Module1Props {
  isDark: boolean;
  viewLayer: 'physical' | 'logical';
  onToggleViewLayer?: (layer: 'physical' | 'logical') => void;
  activeFlow: TransportFlowId;
  onSelectFlow: (flow: TransportFlowId) => void;
}

const APPLE_EASE = [0.16, 1, 0.3, 1] as const;

const FLOW_TABS: Array<{ id: TransportFlowId; label: string; proto: 'UDP' | 'TCP' }> = [
  { id: 'dhcp', label: 'UDP • DHCP', proto: 'UDP' },
  { id: 'opendns', label: 'UDP • OpenDNS', proto: 'UDP' },
  { id: 'samba', label: 'TCP • Samba', proto: 'TCP' },
  { id: 'nginx', label: 'TCP • Proxy Web', proto: 'TCP' },
  { id: 'pcc', label: 'TCP • Multi-WAN PCC', proto: 'TCP' }
];

export const Module1HeadersTuples: React.FC<Module1Props> = ({
  isDark,
  viewLayer,
  onToggleViewLayer,
  activeFlow,
  onSelectFlow
}) => {
  const [sambaErrorMode, setSambaErrorMode] = useState<'normal' | 'dup_ack' | 'timeout'>('normal');
  const [errorStep, setErrorStep] = useState<1 | 2 | 3 | 4>(1);
  const [isErrorAuto, setIsErrorAuto] = useState<boolean>(true);
  const [proxyMode, setProxyMode] = useState<'student_denied' | 'teacher_allowed' | 'acl_direct'>('student_denied');
  const [pccMode, setPccMode] = useState<'connection' | 'packet'>('connection');

  useEffect(() => {
    if (activeFlow !== 'samba' || sambaErrorMode === 'normal' || !isErrorAuto) return;
    const id = window.setInterval(() => {
      setErrorStep((prev) => (prev >= 4 ? 1 : ((prev + 1) as 1 | 2 | 3 | 4)));
    }, 4600);
    return () => window.clearInterval(id);
  }, [activeFlow, sambaErrorMode, isErrorAuto]);

  const mutedText = isDark ? 'text-[#86868B]' : 'text-[#6E6E73]';

  // Flujos reales de la escuela con ritmo pausado (legible en proyector) y lenguaje claro + técnico
  const scenario: {
    highlightNodes: string[];
    activeIspIds?: IspId[];
    internetTitle?: string;
    internetSubtitle?: string;
    badges?: TopologyOverlayBadge[];
    logicalTunnel: {
      from: { x: number; y: number };
      to: { x: number; y: number };
      via?: Array<{ x: number; y: number }>;
      secondHop?: {
        from: { x: number; y: number };
        to: { x: number; y: number };
        via?: Array<{ x: number; y: number }>;
        label?: string;
      };
      extraTunnels?: Array<{
        from: { x: number; y: number };
        to: { x: number; y: number };
        via?: Array<{ x: number; y: number }>;
      }>;
      color: 'udp' | 'tcp' | 'ack' | 'error';
      label?: string;
    };
    trafficSummary: TopologyTrafficSummary;
    packets: AnimatedPillPacket[];
  } = (() => {
    // 1. UDP — Windows Server DHCP (VLANs 20, 30, 50 -> Relay Cisco C9200 -> 172.16.10.14:67)
    if (activeFlow === 'dhcp') {
      return {
        highlightNodes: ['student', 'teacher', 'admin', 'c9200', 'dhcp'],
        logicalTunnel: {
          from: TOPOLOGY_COORDS.student,
          to: TOPOLOGY_COORDS.dhcp,
          extraTunnels: [
            { from: TOPOLOGY_COORDS.teacher, to: TOPOLOGY_COORDS.dhcp },
            { from: TOPOLOGY_COORDS.admin, to: TOPOLOGY_COORDS.dhcp }
          ],
          color: 'udp',
          label: 'Mismo socket UDP (.10.14 :67) para toda la escuela'
        },
        trafficSummary: {
          protocol: 'UDP',
          what: 'La PC pide una dirección IP ("¿qué IP uso?") y el servidor le responde con su IP asignada.',
          route:
            viewLayer === 'physical'
              ? 'PCs (VLAN 20/30/50) → Cisco C9200 (Relay) → Win Server DHCP (.10.14)'
              : '3 PCs (:68) → Socket único Win Server DHCP (172.16.10.14:67)',
          why: 'Apenas prendés la PC necesitás IP al instante: UDP no pierde tiempo saludando antes, pesa solo 8 B y no gasta memoria por sesión.'
        },
        packets: [
          {
            id: `dhcp-v20-${viewLayer}`,
            label: viewLayer === 'physical' ? 'V20: Dame IP → C9200' : 'V20: Dame IP (:68→:67)',
            color: 'udp',
            kind: 'dhcp',
            points:
              viewLayer === 'logical'
                ? [TOPOLOGY_COORDS.student, TOPOLOGY_COORDS.dhcp]
                : [TOPOLOGY_COORDS.student, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.dhcp],
            duration: 3.9,
            delay: 0,
            repeatDelay: 3.0,
            loop: true
          },
          {
            id: `dhcp-v30-${viewLayer}`,
            label: viewLayer === 'physical' ? 'V30: Dame IP → C9200' : 'V30: Dame IP (:68→:67)',
            color: 'udp',
            kind: 'dhcp',
            points:
              viewLayer === 'logical'
                ? [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.dhcp]
                : [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.dhcp],
            duration: 3.9,
            delay: 0.9,
            repeatDelay: 3.0,
            loop: true
          },
          {
            id: `dhcp-v50-${viewLayer}`,
            label: viewLayer === 'physical' ? 'V50: Dame IP → C9200' : 'V50: Dame IP (:68→:67)',
            color: 'udp',
            kind: 'dhcp',
            points:
              viewLayer === 'logical'
                ? [TOPOLOGY_COORDS.admin, TOPOLOGY_COORDS.dhcp]
                : [TOPOLOGY_COORDS.admin, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.dhcp],
            duration: 3.9,
            delay: 1.8,
            repeatDelay: 3.0,
            loop: true
          },
          {
            id: `dhcp-offer-${viewLayer}`,
            label: 'Toma tu IP (.20.10) ✓',
            color: 'ack',
            kind: 'ack',
            curveOffset: 18,
            points:
              viewLayer === 'logical'
                ? [TOPOLOGY_COORDS.dhcp, TOPOLOGY_COORDS.student]
                : [TOPOLOGY_COORDS.dhcp, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.student],
            duration: 3.9,
            delay: 3.0,
            repeatDelay: 3.0,
            loop: true
          }
        ]
      };
    }

    // 2. UDP — Cisco OpenDNS / Umbrella (208.67.222.222:53)
    if (activeFlow === 'opendns') {
      const topArc = [
        { x: 390, y: 52 },
        { x: 820, y: 52 }
      ];
      return {
        highlightNodes: ['student', 'c9200', 'meraki', 'mikrotik', 'opendns'],
        activeIspIds: ['tachicom'],
        internetTitle: 'Cisco OpenDNS',
        internetSubtitle: '208.67.222.222',
        logicalTunnel: {
          from: TOPOLOGY_COORDS.student,
          to: TOPOLOGY_COORDS.opendns,
          via: topArc,
          color: 'udp',
          label: 'Consulta DNS directa (:53) • Sin saludo previo'
        },
        trafficSummary: {
          protocol: 'UDP',
          what: 'Pregunta el nombre del sitio ("¿qué IP tiene esta web y es segura?") y vuelve la IP filtrada.',
          route:
            viewLayer === 'physical'
              ? 'PC Estudiante → C9200 → Meraki → MikroTik → Tachicom → OpenDNS (:53)'
              : 'PC Estudiante (:54210) ↔ Cisco OpenDNS (208.67.222.222:53)',
          why: 'Para navegar rápido no podés esperar 3 mensajes de saludo antes de preguntar la IP: UDP consulta directo en 1 viaje (TCP 53 solo si >512 B).'
        },
        packets: [
          {
            id: `dns-req-${viewLayer}`,
            label:
              viewLayer === 'physical'
                ? '¿IP de esta web? (DNS)'
                : '¿IP de web? (UDP :53)',
            color: 'udp',
            kind: 'dns',
            curveOffset: -9,
            points:
              viewLayer === 'logical'
                ? [TOPOLOGY_COORDS.student, ...topArc, TOPOLOGY_COORDS.opendns]
                : [
                    TOPOLOGY_COORDS.student,
                    TOPOLOGY_COORDS.c9200,
                    TOPOLOGY_COORDS.meraki,
                    TOPOLOGY_COORDS.mikrotik,
                    { x: 1074, y: 140 },
                    { x: 1052, y: 278 },
                    TOPOLOGY_COORDS.opendns
                  ],
            duration: viewLayer === 'physical' ? 5.2 : 3.8,
            delay: 0,
            repeatDelay: 2.8,
            loop: true
          },
          {
            id: `dns-res-${viewLayer}`,
            label: 'Sitio seguro + IP ✓',
            color: 'ack',
            kind: 'ack',
            curveOffset: -9,
            points:
              viewLayer === 'logical'
                ? [TOPOLOGY_COORDS.opendns, ...[...topArc].reverse(), TOPOLOGY_COORDS.student]
                : [
                    TOPOLOGY_COORDS.opendns,
                    { x: 1052, y: 278 },
                    { x: 1074, y: 140 },
                    TOPOLOGY_COORDS.mikrotik,
                    TOPOLOGY_COORDS.meraki,
                    TOPOLOGY_COORDS.c9200,
                    TOPOLOGY_COORDS.student
                  ],
            duration: viewLayer === 'physical' ? 5.2 : 3.8,
            delay: viewLayer === 'physical' ? 2.8 : 2.2,
            repeatDelay: 2.8,
            loop: true
          }
        ]
      };
    }

    // 3. TCP — Servidor de Archivos Samba (172.16.10.13:445) + Simulación Paso a Paso de Errores
    if (activeFlow === 'samba') {
      if (sambaErrorMode === 'normal') {
        return {
          highlightNodes: ['samba', 'c9200', 'teacher'],
          logicalTunnel: {
            from: TOPOLOGY_COORDS.samba,
            to: TOPOLOGY_COORDS.teacher,
            color: 'tcp',
            label: 'Conexión TCP Samba • Cada byte numerado (:445)'
          },
          trafficSummary: {
            protocol: 'TCP',
            what: 'Partes numeradas de un apunte/planilla (.pdf) más avisos de confirmación ("recibido, mandá más").',
            route:
              viewLayer === 'physical'
                ? 'Servidor Samba (.10.13:445) → Cisco C9200 → PC Docente (.30.10)'
                : 'Servidor Samba (.10.13:445) ↔ PC Docente (.30.10:51840)',
            why: 'Si bajás un archivo escolar no puede faltar ni un solo byte: TCP numera todo, regula el ritmo para no ahogar la PC y reenvía si algo se pierde.',
            tone: 'tcp'
          },
          packets: [
            {
              id: `smb-data-1-${viewLayer}`,
              label: 'Apunte PDF #1 (Seq=1000)',
              color: 'tcp',
              kind: 'file',
              curveOffset: 16,
              points:
                viewLayer === 'logical'
                  ? [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.teacher]
                  : [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.teacher],
              duration: 2.8,
              delay: 0,
              repeatDelay: 4.4,
              loop: true
            },
            {
              id: `smb-data-2-${viewLayer}`,
              label: 'Apunte PDF #2 (Seq=2000)',
              color: 'tcp',
              kind: 'file',
              curveOffset: 16,
              points:
                viewLayer === 'logical'
                  ? [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.teacher]
                  : [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.teacher],
              duration: 2.8,
              delay: 1.4,
              repeatDelay: 4.4,
              loop: true
            },
            {
              id: `smb-ack-${viewLayer}`,
              label: 'Recibido ACK=3000 ✓',
              color: 'ack',
              kind: 'ack',
              curveOffset: 16,
              points:
                viewLayer === 'logical'
                  ? [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.samba]
                  : [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.samba],
              duration: 2.8,
              delay: 4.2,
              repeatDelay: 4.4,
              loop: true
            }
          ]
        };
      }

      const dropPoint = viewLayer === 'logical' ? { x: 371, y: 311.5 } : { x: 248, y: 235 };
      const toTeacher =
        viewLayer === 'logical'
          ? [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.teacher]
          : [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.teacher];
      const toSamba =
        viewLayer === 'logical'
          ? [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.samba]
          : [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.samba];
      const toDrop =
        viewLayer === 'logical'
          ? [TOPOLOGY_COORDS.samba, dropPoint]
          : [TOPOLOGY_COORDS.samba, TOPOLOGY_COORDS.c9200, dropPoint];

      if (sambaErrorMode === 'dup_ack') {
        const stepConfig: Record<
          1 | 2 | 3 | 4,
          {
            badges: TopologyOverlayBadge[];
            color: 'error' | 'tcp' | 'ack';
            tunnelLabel: string;
            what: string;
            why: string;
            packets: AnimatedPillPacket[];
          }
        > = {
          1: {
            badges: [{ nodeId: 'teacher', text: 'Falta 1000! (Guarda 2000 y 3000)', tone: 'error' }],
            color: 'error',
            tunnelLabel: 'Paso 1/4 • Cae Seq=1000 (✕), llegan 2000 y 3000',
            what: 'Paso 1: Samba envía los trozos 1000, 2000 y 3000. El Seq=1000 se pierde (✕), pero el 2000 y 3000 sí llegan desordenados.',
            why: 'Como el 2000 y 3000 llegaron atrás del hueco, la PC Docente se da cuenta al instante de que falta el 1000.',
            packets: [
              {
                id: `dupack-s1-drop-${viewLayer}`,
                label: 'Archivo Seq=1000 ✕ CAE',
                color: 'error',
                kind: 'blocked',
                points: toDrop,
                dropMarker: true,
                duration: 2.7,
                delay: 0,
                repeatDelay: 1.9,
                loop: true
              },
              {
                id: `dupack-s1-2000-${viewLayer}`,
                label: 'Parte Seq=2000 (sin 1000)',
                color: 'tcp',
                kind: 'file',
                curveOffset: 16,
                points: toTeacher,
                duration: 3.1,
                delay: 0.7,
                repeatDelay: 1.5,
                loop: true
              },
              {
                id: `dupack-s1-3000-${viewLayer}`,
                label: 'Parte Seq=3000 (sin 1000)',
                color: 'tcp',
                kind: 'file',
                curveOffset: 16,
                points: toTeacher,
                duration: 3.1,
                delay: 1.4,
                repeatDelay: 1.5,
                loop: true
              }
            ]
          },
          2: {
            badges: [{ nodeId: 'samba', text: 'Recibe 3x ACK=1000 iguales!', tone: 'error' }],
            color: 'error',
            tunnelLabel: 'Paso 2/4 • PC Docente pide 3 veces "Falta el 1000"',
            what: 'Paso 2: Por cada paquete que llega fuera de orden, la PC responde ACK=1000 ("¡sigo esperando el 1000!"). Junta 3 iguales.',
            why: '3 ACK duplicados le avisan a Samba que el 1000 se perdió antes de que venza el reloj de espera.',
            packets: [
              {
                id: `dupack-s2-ack1-${viewLayer}`,
                label: 'ACK=1000 (Dup #1)',
                color: 'error',
                kind: 'ack',
                curveOffset: 16,
                points: toSamba,
                duration: 2.8,
                delay: 0,
                repeatDelay: 1.8,
                loop: true
              },
              {
                id: `dupack-s2-ack3-${viewLayer}`,
                label: 'ACK=1000 (Dup #2 y #3)',
                color: 'error',
                kind: 'ack',
                curveOffset: 16,
                points: toSamba,
                duration: 2.8,
                delay: 0.9,
                repeatDelay: 1.8,
                loop: true
              }
            ]
          },
          3: {
            badges: [{ nodeId: 'samba', text: 'Retransmisión Rápida (sin reloj)', tone: 'tcp' }],
            color: 'tcp',
            tunnelLabel: 'Paso 3/4 • Samba reenvía Seq=1000 al instante',
            what: 'Paso 3: Al recibir el 3º ACK=1000, Samba reenvía Seq=1000 al toque (Fast Retransmit) y baja un poco la velocidad por precaución.',
            why: 'No pierde segundos esperando el temporizador: reacciona rápido apenas la PC repite 3 veces qué byte falta.',
            packets: [
              {
                id: `dupack-s3-retx-${viewLayer}`,
                label: 'Reenvío Rápido Archivo Seq=1000 ✓',
                color: 'tcp',
                kind: 'file',
                curveOffset: 16,
                points: toTeacher,
                duration: 3.4,
                delay: 0,
                repeatDelay: 1.2,
                loop: true
              }
            ]
          },
          4: {
            badges: [{ nodeId: 'teacher', text: 'Une 1000 + 2000..4000 en orden ✓', tone: 'ack' }],
            color: 'ack',
            tunnelLabel: 'Paso 4/4 • ACK=5000 (Confirma todo en bloque)',
            what: 'Paso 4: Llega el 1000, la PC lo pega delante de 2000–4000 que ya guardó en buffer y confirma todo junto: ACK=5000.',
            why: 'ACK acumulativo significa "hasta el 4999 ya tengo todo sano, mandame desde el 5000". Archivo 100% íntegro.',
            packets: [
              {
                id: `dupack-s4-ack5000-${viewLayer}`,
                label: 'ACK=5000 (Archivo OK ✓)',
                color: 'ack',
                kind: 'ack',
                curveOffset: 16,
                points: toSamba,
                duration: 3.4,
                delay: 0,
                repeatDelay: 1.2,
                loop: true
              }
            ]
          }
        };

        const cur = stepConfig[errorStep];
        return {
          highlightNodes: ['samba', 'c9200', 'teacher'],
          badges: cur.badges,
          logicalTunnel: {
            from: TOPOLOGY_COORDS.samba,
            to: TOPOLOGY_COORDS.teacher,
            color: cur.color,
            label: cur.tunnelLabel
          },
          trafficSummary: {
            protocol: 'TCP',
            what: cur.what,
            route:
              viewLayer === 'physical'
                ? 'Servidor Samba (.10.13:445) ↔ Cisco C9200 ↔ PC Docente (.30.10)'
                : 'Servidor Samba (.10.13:445) ↔ PC Docente (.30.10:51840)',
            why: cur.why,
            tone: cur.color
          },
          packets: cur.packets
        };
      }

      // Error 2: Timeout / Vencimiento de Temporizador (RTO)
      const timeoutSteps: Record<
        1 | 2 | 3 | 4,
        {
          badges: TopologyOverlayBadge[];
          color: 'error' | 'tcp' | 'ack';
          tunnelLabel: string;
          what: string;
          why: string;
          packets: AnimatedPillPacket[];
        }
      > = {
        1: {
          badges: [{ nodeId: 'samba', text: '⏱ Reloj contando (espera ACK)...', tone: 'tcp' }],
          color: 'error',
          tunnelLabel: 'Paso 1/4 • Cae Seq=1000 (✕) y no llegan más paquetes',
          what: 'Paso 1: Samba manda Seq=1000 y se pierde en el camino (✕). No vienen otros paquetes atrás, así que nadie avisa nada.',
          why: 'Samba siempre arranca un cronómetro (RTO) por si el paquete nunca llega al destino.',
          packets: [
            {
              id: `rto-s1-drop-${viewLayer}`,
              label: 'Archivo Seq=1000 ✕ CAE',
              color: 'error',
              kind: 'blocked',
              points: toDrop,
              dropMarker: true,
              duration: 2.9,
              delay: 0,
              repeatDelay: 1.7,
              loop: true
            }
          ]
        },
        2: {
          badges: [{ nodeId: 'samba', text: '⏱ TIMEOUT! Venció el reloj (cwnd=1)', tone: 'error' }],
          color: 'error',
          tunnelLabel: 'Paso 2/4 • Silencio total → Vence temporizador RTO',
          what: 'Paso 2: Como nunca volvió ningún ACK, el temporizador de Samba llega a cero (Timeout). TCP asume congestión severa.',
          why: 'Ante un Timeout, TCP recorta la ventana de envío al mínimo (cwnd = 1 segmento) para no empeorar la saturación.',
          packets: []
        },
        3: {
          badges: [{ nodeId: 'samba', text: 'Reenvía lento tras Timeout', tone: 'tcp' }],
          color: 'tcp',
          tunnelLabel: 'Paso 3/4 • Samba reenvía Seq=1000 desde cero',
          what: 'Paso 3: Samba reenvía el segmento perdido (Seq=1000) y vuelve a arrancar despacio verificando que el camino esté libre.',
          why: 'Así ningún apunte ni documento compartido se queda cortado a la mitad aunque haya habido un corte temporal.',
          packets: [
            {
              id: `rto-s3-retx-${viewLayer}`,
              label: 'Reenvío Timeout Seq=1000',
              color: 'tcp',
              kind: 'file',
              curveOffset: 16,
              points: toTeacher,
              duration: 3.5,
              delay: 0,
              repeatDelay: 1.1,
              loop: true
            }
          ]
        },
        4: {
          badges: [{ nodeId: 'teacher', text: 'Archivo íntegro ✓', tone: 'ack' }],
          color: 'ack',
          tunnelLabel: 'Paso 4/4 • PC Docente confirma ACK=2000 ✓',
          what: 'Paso 4: Llega Seq=1000 sano a la PC Docente y contesta ACK=2000 ("¡recibido, seguí mandando!").',
          why: 'Una vez confirmado el ACK, TCP vuelve a acelerar progresivamente hasta recuperar su ritmo normal.',
          packets: [
            {
              id: `rto-s4-ack-${viewLayer}`,
              label: 'Confirmado ACK=2000 ✓',
              color: 'ack',
              kind: 'ack',
              curveOffset: 16,
              points: toSamba,
              duration: 3.4,
              delay: 0,
              repeatDelay: 1.2,
              loop: true
            }
          ]
        }
      };

      const tCur = timeoutSteps[errorStep];
      return {
        highlightNodes: ['samba', 'c9200', 'teacher'],
        badges: tCur.badges,
        logicalTunnel: {
          from: TOPOLOGY_COORDS.samba,
          to: TOPOLOGY_COORDS.teacher,
          color: tCur.color,
          label: tCur.tunnelLabel
        },
        trafficSummary: {
          protocol: 'TCP',
          what: tCur.what,
          route:
            viewLayer === 'physical'
              ? 'Servidor Samba (.10.13:445) ↔ Cisco C9200 ↔ PC Docente (.30.10)'
              : 'Servidor Samba (.10.13:445) ↔ PC Docente (.30.10:51840)',
          why: tCur.why,
          tone: tCur.color
        },
        packets: tCur.packets
      };
    }

    // 4. TCP — Portal de Profesores en Apache tras Proxy Inverso Nginx (+ ACL C9200)
    if (activeFlow === 'nginx') {
      const rightArc = [
        { x: 792, y: 200 },
        { x: 792, y: 294 }
      ];
      const returnRightArc = [
        { x: 822, y: 294 },
        { x: 822, y: 200 }
      ];

      if (proxyMode === 'student_denied') {
        return {
          highlightNodes: ['student', 'c9200', 'nginx_proxy_block', 'apache_protected'],
          badges: [
            {
              nodeId: 'nginx',
              text: 'Nginx rechaza VLAN 20 (HTTP 403)',
              tone: 'error'
            },
            {
              nodeId: 'apache',
              text: 'Portal Docentes aislado (no toca Apache)',
              tone: 'ack'
            }
          ],
          logicalTunnel: {
            from: TOPOLOGY_COORDS.student,
            to: TOPOLOGY_COORDS.nginx,
            color: 'error',
            label: 'Alumno (VLAN 20) → Portal Profesores :443 • RECHAZADO 403'
          },
          trafficSummary: {
            protocol: 'TCP',
            what: 'PC Estudiante (.20.10) intenta entrar al Portal de Profesores (/docentes) vía Nginx (:443). Proxy Nginx detecta VLAN 20 y lo frena con 403 Prohibido antes de tocar Apache.',
            route:
              viewLayer === 'physical'
                ? 'PC Estudiante → C9200 → Proxy Nginx [403 ✕] → Devuelve rechazo al Alumno'
                : 'PC Estudiante (:51514) ↔ Proxy Nginx (:443) [HTTP 403 ✕]  |  Apache (:8080) intacto',
            why: 'El Proxy Inverso (Nginx) filtra permisos antes de consultar al servidor interno: ningún alumno puede alcanzar el Portal Docente alojado en Apache.',
            tone: 'error'
          },
          packets: [
            {
              id: `proxy-deny-req-${viewLayer}`,
              label: 'GET /portal-docentes (:443)',
              color: 'tcp',
              kind: 'web',
              dropMarker: true,
              points:
                viewLayer === 'logical'
                  ? [TOPOLOGY_COORDS.student, { x: 530, y: 200 }]
                  : [
                      TOPOLOGY_COORDS.student,
                      TOPOLOGY_COORDS.c9200,
                      { x: 468, y: 218 },
                      { x: 500, y: 218 },
                      { x: 500, y: 200 },
                      { x: 530, y: 200 }
                    ],
              duration: 3.0,
              delay: 0,
              repeatDelay: 4.2,
              loop: true
            },
            {
              id: `proxy-deny-res-${viewLayer}`,
              label: 'HTTP 403 Prohibido • Solo Docentes',
              color: 'error',
              kind: 'blocked',
              curveOffset: 18,
              points:
                viewLayer === 'logical'
                  ? [TOPOLOGY_COORDS.nginx, TOPOLOGY_COORDS.student]
                  : [TOPOLOGY_COORDS.nginx, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.student],
              duration: 3.0,
              delay: 3.1,
              repeatDelay: 4.2,
              loop: true
            }
          ]
        };
      }

      if (proxyMode === 'acl_direct') {
        return {
          highlightNodes: ['student', 'c9200', 'apache_err'],
          badges: [
            viewLayer === 'physical'
              ? {
                  nodeId: 'c9200',
                  text: 'ACL C9200 frena acceso directo :8080',
                  tone: 'error'
                }
              : {
                  nodeId: 'apache',
                  text: 'Rechazado (solo entra vía Nginx)',
                  tone: 'error'
                }
          ],
          logicalTunnel: {
            from: TOPOLOGY_COORDS.student,
            to: TOPOLOGY_COORDS.apache,
            color: 'error',
            label: 'Conexión directa a Apache :8080 → BLOQUEADA'
          },
          trafficSummary: {
            protocol: 'TCP',
            what: 'Un alumno intenta saltarse Nginx apuntando directo a la IP interna de Apache (:8080), pero la ACL del switch lo frena.',
            route:
              viewLayer === 'physical'
                ? 'PC Estudiante (.20.10) → Cisco C9200 [ACL BLOQUEA :8080] ✕'
                : 'PC Estudiante (:51520) —✕ Conexión rechazada hacia Apache :8080',
            why: 'Apache (172.16.10.11:8080) queda protegido adentro: el Cisco C9200 solo deja hablarle a Nginx (.10.12) por seguridad.',
            tone: 'error'
          },
          packets: [
            {
              id: `acl-drop-${viewLayer}`,
              label: viewLayer === 'physical' ? 'SYN :8080 ✕ ACL DROP' : 'SYN :8080 ✕ Rechazado',
              color: 'error',
              kind: 'blocked',
              points:
                viewLayer === 'logical'
                  ? [TOPOLOGY_COORDS.student, { x: 371, y: 187.5 }]
                  : [TOPOLOGY_COORDS.student, { x: 248, y: 81 }, { x: 248, y: 207 }, { x: 294, y: 207 }],
              dropMarker: true,
              duration: 3.4,
              delay: 0,
              repeatDelay: 1.6,
              loop: true
            }
          ]
        };
      }

      // proxyMode === 'teacher_allowed': Docente accede exitosamente a su Portal de Profesores en Apache vía Nginx
      return {
        highlightNodes: ['teacher', 'c9200', 'nginx', 'apache'],
        badges: [
          {
            nodeId: 'nginx',
            text: 'Autoriza VLAN 30 → Reenvía a Apache',
            tone: 'ack'
          },
          {
            nodeId: 'teacher',
            text: 'Portal Profesores cargado ✓',
            tone: 'ack'
          }
        ],
        logicalTunnel: {
          from: TOPOLOGY_COORDS.teacher,
          to: TOPOLOGY_COORDS.nginx,
          secondHop: {
            from: TOPOLOGY_COORDS.nginxRight,
            to: TOPOLOGY_COORDS.apacheRight,
            via: rightArc,
            label: '2ª TCP (:53000 → :8080)'
          },
          color: 'tcp',
          label: '1ª Sesión TCP Docente (:51840 → :443)'
        },
        trafficSummary: {
          protocol: 'TCP',
          what: '1) PC Docente (.30.10) pide su Portal a Nginx (:443) → 2) Nginx autoriza VLAN 30 y consulta a Apache (:8080) → 3) Apache envía el Portal + Notas y Nginx se lo entrega al Docente.',
          route:
            viewLayer === 'physical'
              ? 'Docente (.30.10) → C9200 → Nginx (:443) → C9200 → Apache (:8080) → Nginx → Docente'
              : '1) Docente (.30.10) ↔ Nginx (:443)  |  2) Nginx ↔ Apache (.10.11:8080)',
          why: 'Como proviene de PC Docente (VLAN 30), Nginx aprueba la entrada y abre una 2ª sesión TCP interna contra Apache (:8080) sin exponer el servidor.',
          tone: 'tcp'
        },
        packets: [
          {
            id: `web-t-hop1-${viewLayer}`,
            label: '1) Pide Portal → Nginx :443',
            color: 'tcp',
            kind: 'web',
            curveOffset: 16,
            points:
              viewLayer === 'logical'
                ? [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.nginx]
                : [TOPOLOGY_COORDS.teacher, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.nginx],
            duration: 2.6,
            delay: 0,
            repeatDelay: 5.8,
            loop: true
          },
          {
            id: `web-t-hop2-${viewLayer}`,
            label: '2) Nginx → Apache :8080',
            color: 'tcp',
            kind: 'web',
            points:
              viewLayer === 'logical'
                ? [TOPOLOGY_COORDS.nginxRight, ...rightArc, TOPOLOGY_COORDS.apacheRight]
                : [TOPOLOGY_COORDS.nginx, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.apache],
            duration: 2.2,
            delay: 2.0,
            repeatDelay: 6.2,
            loop: true
          },
          {
            id: `web-t-hop3-${viewLayer}`,
            label: '3) Apache envía Portal + Notas',
            color: 'ack',
            kind: 'file',
            points:
              viewLayer === 'logical'
                ? [TOPOLOGY_COORDS.apacheRight, ...returnRightArc, TOPOLOGY_COORDS.nginxRight]
                : [TOPOLOGY_COORDS.apache, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.nginx],
            duration: 2.2,
            delay: 3.9,
            repeatDelay: 6.2,
            loop: true
          },
          {
            id: `web-t-hop4-${viewLayer}`,
            label: '4) Portal Docente 200 OK ✓',
            color: 'ack',
            kind: 'ack',
            curveOffset: 16,
            points:
              viewLayer === 'logical'
                ? [TOPOLOGY_COORDS.nginx, TOPOLOGY_COORDS.teacher]
                : [TOPOLOGY_COORDS.nginx, TOPOLOGY_COORDS.c9200, TOPOLOGY_COORDS.teacher],
            duration: 2.6,
            delay: 5.8,
            repeatDelay: 5.8,
            loop: true
          }
        ]
      };
    }

    // 5. TCP — Cierre Multi-WAN MikroTik RB750Gr3 (PCC por conexión vs por paquete)
    const isPerPacketBad = pccMode === 'packet';
    const topArcPcc = [
      { x: 390, y: 52 },
      { x: 820, y: 52 }
    ];

    return {
      highlightNodes: ['student', 'c9200', 'meraki', 'mikrotik', 'opendns'],
      activeIspIds: isPerPacketBad ? ['starlink', 'westnet', 'tachicom'] : ['tachicom'],
      internetTitle: 'Internet Web / Cloud',
      internetSubtitle: isPerPacketBad ? 'Llegan desordenados!' : 'Sesión TCP estable',
      badges: isPerPacketBad
        ? [
            viewLayer === 'physical'
              ? {
                  nodeId: 'mikrotik',
                  text: '¡Desordena TCP! → 3 ACK dup falsos',
                  tone: 'error'
                }
              : {
                  nodeId: 'opendns',
                  text: 'Llega desordenado → Cae velocidad TCP',
                  tone: 'error'
                }
          ]
        : [
            viewLayer === 'physical'
              ? {
                  nodeId: 'mikrotik',
                  text: 'PCC fija 1 ISP por sesión',
                  tone: 'ack'
                }
              : {
                  nodeId: 'opendns',
                  text: 'Llega todo en orden ✓',
                  tone: 'ack'
                }
          ],
      logicalTunnel: {
        from: TOPOLOGY_COORDS.student,
        to: TOPOLOGY_COORDS.opendns,
        via: topArcPcc,
        color: isPerPacketBad ? 'error' : 'tcp',
        label: isPerPacketBad
          ? '¡Paquetes mezclados! → TCP frena la conexión'
          : '1 Sesión TCP limpia • Llega en orden (:443)'
      },
      trafficSummary: {
        protocol: 'TCP',
        what: isPerPacketBad
          ? 'Los pedazos de una misma descarga se reparten entre Starlink (lento) y Tachicom (rápido) y llegan cruzados.'
          : 'Toda la descarga TCP sale junta por un solo proveedor elegido (Tachicom) hasta terminar la sesión.',
        route:
          viewLayer === 'physical'
            ? isPerPacketBad
              ? 'MikroTik parte una misma sesión entre 3 ISPs ✕'
              : 'PC Estudiante → C9200 → Meraki → MikroTik → Tachicom → Internet ✓'
            : isPerPacketBad
            ? 'PC (:52410) ↔ Internet (:443) [Llega Seq=2 antes que Seq=1 → 3 ACK dup falsos]'
            : 'PC (:52410) ↔ Internet (:443) [Seq=1 → Seq=2 → Seq=3 en orden]',
        why: 'Si balanceás por paquete entre 3 internet con distinta latencia, llegan desordenados y TCP cree que hay congestión y derrumba la velocidad. Con PCC por conexión no pasa.',
        tone: isPerPacketBad ? 'error' : 'tcp'
      },
      packets: isPerPacketBad
        ? viewLayer === 'logical'
          ? [
              {
                id: 'pcc-bad-l4-1',
                label: 'Seq=2 llega antes (!)',
                color: 'error',
                kind: 'segment',
                curveOffset: -9,
                points: [TOPOLOGY_COORDS.student, ...topArcPcc, TOPOLOGY_COORDS.opendns],
                duration: 3.8,
                delay: 0,
                repeatDelay: 2.2,
                loop: true
              },
              {
                id: 'pcc-bad-l4-2',
                label: '3x ACK Dup falso!',
                color: 'error',
                kind: 'blocked',
                curveOffset: -9,
                points: [
                  TOPOLOGY_COORDS.opendns,
                  ...[...topArcPcc].reverse(),
                  TOPOLOGY_COORDS.student
                ],
                duration: 3.8,
                delay: 2.2,
                repeatDelay: 2.2,
                loop: true
              }
            ]
          : [
              {
                id: 'pcc-bad-starlink',
                label: 'Seq=1 → Starlink (lento)',
                color: 'error',
                kind: 'segment',
                points: [
                  TOPOLOGY_COORDS.student,
                  TOPOLOGY_COORDS.c9200,
                  TOPOLOGY_COORDS.meraki,
                  TOPOLOGY_COORDS.mikrotik,
                  { x: 988, y: 140 },
                  { x: 916, y: 278 },
                  TOPOLOGY_COORDS.opendns
                ],
                duration: 5.8,
                delay: 0,
                repeatDelay: 1.8,
                loop: true
              },
              {
                id: 'pcc-bad-tachicom',
                label: 'Seq=2 → Tachicom (rápido)',
                color: 'error',
                kind: 'segment',
                points: [
                  TOPOLOGY_COORDS.student,
                  TOPOLOGY_COORDS.c9200,
                  TOPOLOGY_COORDS.meraki,
                  TOPOLOGY_COORDS.mikrotik,
                  { x: 1074, y: 140 },
                  { x: 1052, y: 278 },
                  TOPOLOGY_COORDS.opendns
                ],
                duration: 4.4,
                delay: 1.4,
                repeatDelay: 3.2,
                loop: true
              }
            ]
        : [
            {
              id: `pcc-good-${viewLayer}`,
              label:
                viewLayer === 'physical'
                  ? 'Sesión completa → Tachicom ✓'
                  : 'Seq=1,2,3 en orden ✓',
              color: 'tcp',
              kind: 'segment',
              curveOffset: -9,
              points:
                viewLayer === 'logical'
                  ? [TOPOLOGY_COORDS.student, ...topArcPcc, TOPOLOGY_COORDS.opendns]
                  : [
                      TOPOLOGY_COORDS.student,
                      TOPOLOGY_COORDS.c9200,
                      TOPOLOGY_COORDS.meraki,
                      TOPOLOGY_COORDS.mikrotik,
                      { x: 1074, y: 140 },
                      { x: 1052, y: 278 },
                      TOPOLOGY_COORDS.opendns
                    ],
              duration: viewLayer === 'physical' ? 5.2 : 3.8,
              delay: 0,
              repeatDelay: 1.4,
              loop: true
            }
          ]
    };
  })();

  const renderSubControls = () => {
    const pillBase = (active: boolean, danger = false) =>
      `apple-btn px-3 py-1 rounded-[10px] text-[11.5px] border ${
        active
          ? danger
            ? 'apple-btn-rose border-transparent'
            : 'apple-btn-primary border-transparent'
          : 'apple-btn-secondary text-[#3A3A3C]'
      }`;

    if (activeFlow === 'samba') {
      return (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-medium ${mutedText}`}>
              Simulación Samba (.10.13:445):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSambaErrorMode('normal');
                  setErrorStep(1);
                }}
                className={pillBase(sambaErrorMode === 'normal')}
              >
                Normal (Seq + ACK)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSambaErrorMode('dup_ack');
                  setErrorStep(1);
                }}
                className={pillBase(sambaErrorMode === 'dup_ack', true)}
              >
                Error 1: Pérdida + 3 ACK Dup
              </button>
              <button
                type="button"
                onClick={() => {
                  setSambaErrorMode('timeout');
                  setErrorStep(1);
                }}
                className={pillBase(sambaErrorMode === 'timeout', true)}
              >
                Error 2: Timeout (Reloj RTO)
              </button>
            </div>
          </div>

          {sambaErrorMode !== 'normal' && (
            <div className="flex flex-wrap items-center gap-1">
              {(
                sambaErrorMode === 'dup_ack'
                  ? ([
                      { id: 1, label: '1. Cae 1000 ✕' },
                      { id: 2, label: '2. 3x ACK=1000' },
                      { id: 3, label: '3. Reenvío Rápido' },
                      { id: 4, label: '4. ACK=5000 ✓' }
                    ] as const)
                  : ([
                      { id: 1, label: '1. Cae 1000 ✕' },
                      { id: 2, label: '2. Vence Reloj ⏱' },
                      { id: 3, label: '3. Reenvío Timeout' },
                      { id: 4, label: '4. ACK=2000 ✓' }
                    ] as const)
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setErrorStep(st.id);
                    setIsErrorAuto(false);
                  }}
                  className={pillBase(errorStep === st.id, st.id <= 2)}
                >
                  {st.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsErrorAuto((a) => !a)}
                className={pillBase(isErrorAuto)}
                title="Alternar avance automático paso a paso"
              >
                {isErrorAuto ? 'Auto ▶' : 'Pausado ⏸'}
              </button>
            </div>
          )}
        </>
      );
    }

    if (activeFlow === 'nginx') {
      return (
        <>
          <span className={`text-[11px] font-medium ${mutedText}`}>
            Portal Profesores (Apache :8080 tras Proxy Nginx :443):
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setProxyMode('student_denied')}
              className={pillBase(proxyMode === 'student_denied', true)}
            >
              Alumno → Portal Docentes (✕ Proxy 403)
            </button>
            <button
              type="button"
              onClick={() => setProxyMode('teacher_allowed')}
              className={pillBase(proxyMode === 'teacher_allowed')}
            >
              Docente → Su Portal (✓ Nginx → Apache)
            </button>
            <button
              type="button"
              onClick={() => setProxyMode('acl_direct')}
              className={pillBase(proxyMode === 'acl_direct', true)}
            >
              Alumno directo :8080 (✕ ACL C9200)
            </button>
          </div>
        </>
      );
    }

    if (activeFlow === 'pcc') {
      return (
        <>
          <span className={`text-[11px] font-medium ${mutedText}`}>
            Balanceo MikroTik RB750Gr3 (Starlink 20% • WestNet 30% • Tachicom 50%):
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPccMode('connection')}
              className={pillBase(pccMode === 'connection')}
            >
              PCC por Conexión ✓
            </button>
            <button
              type="button"
              onClick={() => setPccMode('packet')}
              className={pillBase(pccMode === 'packet', true)}
            >
              Por Paquete ❌ (Fallo TCP)
            </button>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: APPLE_EASE }}
      className="w-full"
    >
      <SchoolTopologySvg
        viewLayer={viewLayer}
        isDark={isDark}
        compact={false}
        highlightNodes={scenario.highlightNodes}
        activeIspIds={scenario.activeIspIds}
        internetTitle={scenario.internetTitle}
        internetSubtitle={scenario.internetSubtitle}
        badges={scenario.badges}
        logicalTunnel={scenario.logicalTunnel}
        packets={scenario.packets}
        trafficSummary={scenario.trafficSummary}
        subControls={renderSubControls()}
        headerExtra={
          <div className="apple-segmented flex-wrap text-xs">
            {FLOW_TABS.map((item) => {
              const active = activeFlow === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectFlow(item.id)}
                  className={`apple-btn px-3 py-1 rounded-[10px] whitespace-nowrap ${
                    active
                      ? item.proto === 'TCP'
                        ? 'apple-btn-primary border-transparent'
                        : 'apple-segment-active text-[#0071E3]'
                      : 'text-[#515154] hover:text-[#1D1D1F]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        }
      />
    </motion.div>
  );
};
