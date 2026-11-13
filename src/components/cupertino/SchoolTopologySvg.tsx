import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Layers } from 'lucide-react';

export type PacketVisualKind =
  | 'file'
  | 'web'
  | 'dhcp'
  | 'dns'
  | 'segment'
  | 'ack'
  | 'blocked'
  | 'rto';

export interface AnimatedPillPacket {
  id: string;
  label: string;
  color: 'udp' | 'tcp' | 'ack' | 'error';
  kind?: PacketVisualKind;
  curveOffset?: number;
  points: Array<{ x: number; y: number }>;
  duration?: number;
  delay?: number;
  repeatDelay?: number;
  stopsAtMiddle?: boolean;
  dropMarker?: boolean;
  loop?: boolean;
}

export interface TopologyOverlayBadge {
  nodeId:
    | 'student'
    | 'teacher'
    | 'c9200'
    | 'dhcp'
    | 'nginx'
    | 'apache'
    | 'samba'
    | 'opendns'
    | 'mikrotik';
  text: string;
  tone: 'udp' | 'tcp' | 'ack' | 'error';
}

export interface TopologyTrafficSummary {
  protocol: 'UDP' | 'TCP';
  what: string;
  route: string;
  why?: string;
  tone?: 'udp' | 'tcp' | 'ack' | 'error';
}

export type IspId = 'starlink' | 'westnet' | 'tachicom';

interface SchoolTopologySvgProps {
  viewLayer: 'physical' | 'logical';
  onToggleViewLayer?: (layer: 'physical' | 'logical') => void;
  isDark: boolean;
  packets: AnimatedPillPacket[];
  badges?: TopologyOverlayBadge[];
  logicalTunnel?: {
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
  } | null;
  highlightNodes?: string[];
  activeIspIds?: IspId[];
  internetTitle?: string;
  internetSubtitle?: string;
  compact?: boolean;
  headerExtra?: React.ReactNode;
  subControls?: React.ReactNode;
  trafficSummary?: TopologyTrafficSummary | null;
}

/** Coordenadas arquitectónicas sobre lienzo amplio 1120x470 sin superposiciones */
export const TOPOLOGY_COORDS = {
  student: { x: 202, y: 81 },
  teacher: { x: 202, y: 235 },
  admin: { x: 202, y: 389 },
  c9200: { x: 381, y: 235 },
  dhcp: { x: 540, y: 106 },
  nginx: { x: 540, y: 200 },
  nginxRight: { x: 750, y: 200 },
  apache: { x: 540, y: 294 },
  apacheRight: { x: 750, y: 294 },
  samba: { x: 540, y: 388 },
  meraki: { x: 875, y: 94 },
  mikrotik: { x: 1031, y: 94 },
  opendns: { x: 984, y: 304 }
};

const OPENDNS_LOGICAL_ENTRY = { x: 984, y: 186 };

const SIGNAL_PALETTE = {
  udp: {
    bg: '#0E1A26',
    border: '#38BDF8',
    pillText: '#7DD3FC',
    lightBg: '#0F172A',
    lightText: '#FFFFFF',
    line: '#38BDF8'
  },
  tcp: {
    bg: '#0A84FF',
    border: '#70D6FF',
    pillText: '#FFFFFF',
    lightBg: '#0071E3',
    lightText: '#FFFFFF',
    line: '#0A84FF'
  },
  ack: {
    bg: '#102C1E',
    border: '#30D158',
    pillText: '#6EE7B7',
    lightBg: '#166534',
    lightText: '#FFFFFF',
    line: '#30D158'
  },
  error: {
    bg: '#3B1216',
    border: '#FF453A',
    pillText: '#FCA5A5',
    lightBg: '#DC2626',
    lightText: '#FFFFFF',
    line: '#FF453A'
  }
};

const APPLE_EASE = [0.16, 1, 0.3, 1] as const;

const isSamePoint = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.abs(a.x - b.x) < 3 && Math.abs(a.y - b.y) < 3;

/** Convierte una polilínea en un path SVG con codos redondeados */
const pointsToRoundedPath = (pts: Array<{ x: number; y: number }>, radius = 16) => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];

    const v1x = curr.x - prev.x;
    const v1y = curr.y - prev.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;

    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);

    if (len1 < 1 || len2 < 1) {
      d += ` L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
      continue;
    }

    const r = Math.min(radius, len1 * 0.45, len2 * 0.45);
    const inX = curr.x - (v1x / len1) * r;
    const inY = curr.y - (v1y / len1) * r;
    const outX = curr.x + (v2x / len2) * r;
    const outY = curr.y + (v2y / len2) * r;

    d += ` L ${inX.toFixed(1)} ${inY.toFixed(1)} Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${outX.toFixed(1)} ${outY.toFixed(1)}`;
  }

  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
};

/** Submuestrea curvas en esquinas para que la píldora viaje por codos curvos sin saltos bruscos */
const sampleRoundedCornerPoints = (
  pts: Array<{ x: number; y: number }>,
  radius = 20,
  subSamples = 4
): Array<{ x: number; y: number }> => {
  if (pts.length < 3) return pts;
  const out: Array<{ x: number; y: number }> = [pts[0]];

  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];

    const v1x = curr.x - prev.x;
    const v1y = curr.y - prev.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;

    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);

    if (len1 < 2 || len2 < 2) {
      out.push(curr);
      continue;
    }

    const r = Math.min(radius, len1 * 0.42, len2 * 0.42);
    const pIn = { x: curr.x - (v1x / len1) * r, y: curr.y - (v1y / len1) * r };
    const pOut = { x: curr.x + (v2x / len2) * r, y: curr.y + (v2y / len2) * r };

    for (let s = 0; s <= subSamples; s++) {
      const t = s / subSamples;
      const omt = 1 - t;
      out.push({
        x: omt * omt * pIn.x + 2 * omt * t * curr.x + t * t * pOut.x,
        y: omt * omt * pIn.y + 2 * omt * t * curr.y + t * t * pOut.y
      });
    }
  }

  out.push(pts[pts.length - 1]);
  return out;
};

/** Desplaza suavemente rutas bidireccionales en Capa Lógica para que Ida y Vuelta nunca se tapen */
const applyLogicalCurveOffset = (
  pts: Array<{ x: number; y: number }>,
  curveOffset?: number
): Array<{ x: number; y: number }> => {
  if (!curveOffset || pts.length < 2) return pts;
  const p0 = pts[0];
  const p1 = pts[pts.length - 1];
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy);
  if (len < 4) return pts;

  const nx = -dy / len;
  const ny = dx / len;

  if (pts.length === 2) {
    const cx = (p0.x + p1.x) / 2 + nx * curveOffset * 1.65;
    const cy = (p0.y + p1.y) / 2 + ny * curveOffset * 1.65;
    const sampled: Array<{ x: number; y: number }> = [];
    const steps = 10;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const omt = 1 - t;
      sampled.push({
        x: omt * omt * p0.x + 2 * omt * t * cx + t * t * p1.x,
        y: omt * omt * p0.y + 2 * omt * t * cy + t * t * p1.y
      });
    }
    return sampled;
  }

  return pts.map((pt, idx) =>
    idx === 0 || idx === pts.length - 1
      ? pt
      : { x: pt.x + nx * curveOffset, y: pt.y + ny * curveOffset }
  );
};

/** Calcula `times` proporcionales a la distancia real para velocidad 100% constante */
const buildTimedMotion = (rawPts: Array<{ x: number; y: number }>, dropMarker?: boolean) => {
  let pts = rawPts;
  if (rawPts.length >= 2) {
    const first = rawPts[0];
    const second = rawPts[1];
    const last = rawPts[rawPts.length - 1];
    const prevLast = rawPts[rawPts.length - 2];
    pts = [
      first,
      {
        x: first.x + (second.x - first.x) * 0.08,
        y: first.y + (second.y - first.y) * 0.08
      },
      ...rawPts.slice(1, -1),
      {
        x: prevLast.x + (last.x - prevLast.x) * 0.92,
        y: prevLast.y + (last.y - prevLast.y) * 0.92
      },
      last
    ];
  }

  if (pts.length <= 1) {
    return {
      x: [pts[0]?.x ?? 0],
      y: [pts[0]?.y ?? 0],
      times: [0],
      opacity: [1],
      scale: [1]
    };
  }

  const dists: number[] = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    total += d;
    dists.push(total);
  }

  const safeTotal = Math.max(1, total);
  const times = dists.map((d) => d / safeTotal);
  const opacity = pts.map((_, idx) => {
    if (idx === 0) return 0;
    if (idx === pts.length - 1) return dropMarker ? 0.14 : 0.25;
    return 1;
  });
  const scale = pts.map((_, idx) => {
    if (idx === 0) return 0.84;
    if (idx === pts.length - 1) return dropMarker ? 1.1 : 0.88;
    return 1;
  });

  return {
    x: pts.map((p) => p.x),
    y: pts.map((p) => p.y),
    times,
    opacity,
    scale
  };
};

/** Expande tramos físicos para que cada paquete viaje exactamente por los cables y buses reales */
const expandPhysicalSegment = (
  a: { x: number; y: number },
  b: { x: number; y: number }
): Array<{ x: number; y: number }> => {
  // Clientes <-> Cisco C9200 (bus vertical en x=248)
  if (isSamePoint(a, TOPOLOGY_COORDS.student) && isSamePoint(b, TOPOLOGY_COORDS.c9200)) {
    return [{ x: 202, y: 81 }, { x: 248, y: 81 }, { x: 248, y: 207 }, { x: 294, y: 207 }, { x: 381, y: 235 }];
  }
  if (isSamePoint(a, TOPOLOGY_COORDS.c9200) && isSamePoint(b, TOPOLOGY_COORDS.student)) {
    return [{ x: 381, y: 235 }, { x: 294, y: 207 }, { x: 248, y: 207 }, { x: 248, y: 81 }, { x: 202, y: 81 }];
  }
  if (isSamePoint(a, TOPOLOGY_COORDS.teacher) && isSamePoint(b, TOPOLOGY_COORDS.c9200)) {
    return [{ x: 202, y: 235 }, { x: 294, y: 235 }, { x: 381, y: 235 }];
  }
  if (isSamePoint(a, TOPOLOGY_COORDS.c9200) && isSamePoint(b, TOPOLOGY_COORDS.teacher)) {
    return [{ x: 381, y: 235 }, { x: 294, y: 235 }, { x: 202, y: 235 }];
  }
  if (isSamePoint(a, TOPOLOGY_COORDS.admin) && isSamePoint(b, TOPOLOGY_COORDS.c9200)) {
    return [{ x: 202, y: 389 }, { x: 248, y: 389 }, { x: 248, y: 263 }, { x: 294, y: 263 }, { x: 381, y: 235 }];
  }
  if (isSamePoint(a, TOPOLOGY_COORDS.c9200) && isSamePoint(b, TOPOLOGY_COORDS.admin)) {
    return [{ x: 381, y: 235 }, { x: 294, y: 263 }, { x: 248, y: 263 }, { x: 248, y: 389 }, { x: 202, y: 389 }];
  }

  // C9200 <-> VMs Proxmox (bus distribuidor en x=500, separación limpia 30px)
  const vmEntryY: Array<{ pt: { x: number; y: number }; exitY: number; entryY: number }> = [
    { pt: TOPOLOGY_COORDS.dhcp, exitY: 192, entryY: 106 },
    { pt: TOPOLOGY_COORDS.nginx, exitY: 218, entryY: 200 },
    { pt: TOPOLOGY_COORDS.apache, exitY: 252, entryY: 294 },
    { pt: TOPOLOGY_COORDS.samba, exitY: 278, entryY: 388 }
  ];
  for (const vm of vmEntryY) {
    if (isSamePoint(a, TOPOLOGY_COORDS.c9200) && isSamePoint(b, vm.pt)) {
      return [{ x: 381, y: 235 }, { x: 468, y: vm.exitY }, { x: 500, y: vm.exitY }, { x: 500, y: vm.entryY }, { x: 540, y: vm.entryY }];
    }
    if (isSamePoint(a, vm.pt) && isSamePoint(b, TOPOLOGY_COORDS.c9200)) {
      return [{ x: 540, y: vm.entryY }, { x: 500, y: vm.entryY }, { x: 500, y: vm.exitY }, { x: 468, y: vm.exitY }, { x: 381, y: 235 }];
    }
  }

  // C9200 <-> Meraki MX100 (corredor superior WAN en y=24)
  if (isSamePoint(a, TOPOLOGY_COORDS.c9200) && isSamePoint(b, TOPOLOGY_COORDS.meraki)) {
    return [{ x: 381, y: 160 }, { x: 381, y: 24 }, { x: 875, y: 24 }, { x: 875, y: 94 }];
  }
  if (isSamePoint(a, TOPOLOGY_COORDS.meraki) && isSamePoint(b, TOPOLOGY_COORDS.c9200)) {
    return [{ x: 875, y: 94 }, { x: 875, y: 24 }, { x: 381, y: 24 }, { x: 381, y: 160 }];
  }

  // Meraki <-> MikroTik
  if (isSamePoint(a, TOPOLOGY_COORDS.meraki) && isSamePoint(b, TOPOLOGY_COORDS.mikrotik)) {
    return [{ x: 942, y: 94 }, { x: 1031, y: 94 }];
  }
  if (isSamePoint(a, TOPOLOGY_COORDS.mikrotik) && isSamePoint(b, TOPOLOGY_COORDS.meraki)) {
    return [{ x: 1031, y: 94 }, { x: 942, y: 94 }];
  }

  // MikroTik <-> OpenDNS físico
  if (isSamePoint(a, TOPOLOGY_COORDS.mikrotik) && isSamePoint(b, TOPOLOGY_COORDS.opendns)) {
    return [{ x: 1031, y: 140 }, { x: 984, y: 274 }, { x: 984, y: 304 }];
  }
  if (isSamePoint(a, TOPOLOGY_COORDS.opendns) && isSamePoint(b, TOPOLOGY_COORDS.mikrotik)) {
    return [{ x: 984, y: 304 }, { x: 984, y: 274 }, { x: 1031, y: 140 }];
  }

  return [a, b];
};

const getBadgeAnchor = (
  nodeId: TopologyOverlayBadge['nodeId'],
  isLogical: boolean
): { x: number; y: number } => {
  switch (nodeId) {
    case 'student':
      return { x: 112, y: 158 };
    case 'teacher':
      return { x: 112, y: 312 };
    case 'c9200':
      return { x: 381, y: 336 };
    case 'dhcp':
      return { x: 645, y: isLogical ? 50 : 54 };
    case 'nginx':
      return { x: 645, y: 153 };
    case 'apache':
      return { x: 645, y: 247 };
    case 'samba':
      return { x: 645, y: 451 };
    case 'mikrotik':
      return { x: 1012, y: 24 };
    case 'opendns':
      return { x: 984, y: isLogical ? 158 : 268 };
  }
};

/** Iconografía vectorial nítida (14x14) según tipo de dato o paquete de transporte */
const renderPacketKindIcon = (kind: PacketVisualKind | undefined, strokeColor: string) => {
  switch (kind) {
    case 'file':
      return (
        <g stroke={strokeColor} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M -4.5 -5.5 H 1 L 4.5 -2 V 5.5 H -4.5 Z" />
          <path d="M 1 -5.5 V -2 H 4.5" />
          <path d="M -2.5 0.5 H 2.5 M -2.5 3 H 1.8" strokeWidth="1.15" />
        </g>
      );
    case 'web':
      return (
        <g stroke={strokeColor} strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="-5.5" y="-4.8" width="11" height="9.6" rx="1.8" />
          <path d="M -5.5 -2 H 5.5" strokeWidth="1.1" />
          <path d="M -3.2 0.8 H 1.8 M -3.2 2.8 H 3.2" strokeWidth="1.1" />
        </g>
      );
    case 'dhcp':
      return (
        <path
          d="M 1 -5.5 L -4 0.8 H 0.2 L -1 5.5 L 4 -0.8 H -0.2 Z"
          fill={strokeColor}
          fillOpacity="0.24"
          stroke={strokeColor}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      );
    case 'dns':
      return (
        <g stroke={strokeColor} strokeWidth="1.3" fill="none">
          <circle cx="0" cy="0" r="4.8" />
          <ellipse cx="0" cy="0" rx="2.1" ry="4.8" />
          <path d="M -4.8 0 H 4.8" />
        </g>
      );
    case 'ack':
      return (
        <g stroke={strokeColor} strokeWidth="1.45" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="0" cy="0" r="4.8" fill={strokeColor} fillOpacity="0.16" />
          <path d="M -2.3 0.1 L -0.6 2 L 2.7 -1.9" />
        </g>
      );
    case 'blocked':
      return (
        <g stroke={strokeColor} strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 0 -5.4 L 4.5 -3.5 V 0.8 C 4.5 3.4 2.4 5 0 5.8 C -2.4 5 -4.5 3.4 -4.5 0.8 V -3.5 Z"
            fill={strokeColor}
            fillOpacity="0.2"
          />
          <path d="M -1.8 -1.2 L 1.8 2.4 M 1.8 -1.2 L -1.8 2.4" strokeWidth="1.5" />
        </g>
      );
    default:
      return (
        <g stroke={strokeColor} strokeWidth="1.3" fill={strokeColor} fillOpacity="0.2">
          <rect x="-5" y="-4.5" width="10" height="3.8" rx="1" />
          <rect x="-5" y="1" width="6.5" height="3.8" rx="1" />
        </g>
      );
  }
};

export const SchoolTopologySvg: React.FC<SchoolTopologySvgProps> = ({
  viewLayer,
  onToggleViewLayer,
  isDark,
  packets,
  badges = [],
  logicalTunnel,
  highlightNodes = [],
  activeIspIds = [],
  internetTitle = 'Cisco OpenDNS',
  internetSubtitle = '208.67.222.222',
  compact = false,
  headerExtra,
  subControls,
  trafficSummary
}) => {
  const isLogical = viewLayer === 'logical';

  const strokeLine = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)';
  const nodeBg = isDark ? '#18181C' : '#FFFFFF';
  const chassisBg = isDark ? '#0F1014' : '#F2F2F7';
  const nodeBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)';
  const textPrimary = isDark ? '#F5F5F7' : '#1D1D1F';
  const textSecondary = isDark ? '#98989D' : '#6E6E73';
  const activeAccent = isDark ? '#0A84FF' : '#0071E3';
  const udpAccent = isDark ? '#38BDF8' : '#0284C7';
  const ackAccent = '#30D158';
  const rackHeaderBg = isDark ? '#24242B' : '#E5E5EA';

  const getBadgeFor = (nodeId: TopologyOverlayBadge['nodeId']) =>
    badges.find((b) => b.nodeId === nodeId);

  const hasHighlightFilter = highlightNodes.length > 0;
  const isHighlighted = (id: string) => highlightNodes.includes(id);

  // En Capa Lógica remapea automáticamente TOPOLOGY_COORDS.opendns al nodo remoto centrado
  const mapLogicalPoint = (pt: { x: number; y: number }) =>
    isLogical && isSamePoint(pt, TOPOLOGY_COORDS.opendns) ? OPENDNS_LOGICAL_ENTRY : pt;

  const expandWaypoints = (pts: Array<{ x: number; y: number }>, curveOffset?: number) => {
    const mapped = pts.map(mapLogicalPoint);
    if (isLogical) {
      const curved = applyLogicalCurveOffset(mapped, curveOffset);
      return curved.length > 5 ? curved : sampleRoundedCornerPoints(curved, 28, 5);
    }
    if (mapped.length < 2) return mapped;
    const out: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < mapped.length - 1; i++) {
      const seg = expandPhysicalSegment(mapped[i], mapped[i + 1]);
      for (let j = 0; j < seg.length; j++) {
        if (out.length === 0 || !isSamePoint(out[out.length - 1], seg[j])) {
          out.push(seg[j]);
        }
      }
    }
    return sampleRoundedCornerPoints(out, 12, 3);
  };

  const buildSvgPath = (
    pts: Array<{ x: number; y: number }>,
    stopsAtMiddle?: boolean,
    curveOffset?: number
  ) => {
    const mapped = pts.map(mapLogicalPoint);
    if (mapped.length === 0) return '';
    if (!isLogical && mapped.length >= 2) {
      const out: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < mapped.length - 1; i++) {
        const seg = expandPhysicalSegment(mapped[i], mapped[i + 1]);
        for (let j = 0; j < seg.length; j++) {
          if (out.length === 0 || !isSamePoint(out[out.length - 1], seg[j])) {
            out.push(seg[j]);
          }
        }
      }
      return pointsToRoundedPath(out, 12);
    }
    if (stopsAtMiddle && mapped.length >= 2) {
      const midX = (mapped[0].x + mapped[mapped.length - 1].x) / 2;
      const midY = (mapped[0].y + mapped[mapped.length - 1].y) / 2;
      return `M ${mapped[0].x} ${mapped[0].y} L ${midX} ${midY}`;
    }
    const curved = applyLogicalCurveOffset(mapped, curveOffset);
    return pointsToRoundedPath(curved, curved.length > 5 ? 6 : 28);
  };

  const buildTunnelPath = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    via?: Array<{ x: number; y: number }>
  ) => {
    const f = mapLogicalPoint(from);
    const t = mapLogicalPoint(to);
    const pts = via && via.length > 0 ? [f, ...via, t] : [f, t];
    return pointsToRoundedPath(pts, 32);
  };

  const getTunnelMidpoint = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    via?: Array<{ x: number; y: number }>
  ) => {
    const f = mapLogicalPoint(from);
    const t = mapLogicalPoint(to);
    if (via && via.length > 0) {
      if (via.length === 1) return via[0];
      const midA = via[Math.floor((via.length - 1) / 2)];
      const midB = via[Math.ceil((via.length - 1) / 2)];
      return { x: (midA.x + midB.x) / 2, y: (midA.y + midB.y) / 2 };
    }
    return { x: (f.x + t.x) / 2, y: (f.y + t.y) / 2 };
  };

  const tunnelMidpoint = logicalTunnel
    ? getTunnelMidpoint(logicalTunnel.from, logicalTunnel.to, logicalTunnel.via)
    : null;

  const clientNodes = [
    {
      id: 'student',
      y: 38,
      title: 'PC Estudiante 01',
      ip: '172.16.20.10',
      physicalMeta: 'VLAN 20 • GW .20.1',
      logicalMeta: 'App Navegador (:68 / :51514)',
      accent: '#38BDF8'
    },
    {
      id: 'teacher',
      y: 192,
      title: 'PC Docente 01',
      ip: '172.16.30.10',
      physicalMeta: 'VLAN 30 • GW .30.1',
      logicalMeta: 'App Archivos (:68 / :51840)',
      accent: '#818CF8'
    },
    {
      id: 'admin',
      y: 346,
      title: 'PC Admin 01',
      ip: '172.16.50.11',
      physicalMeta: 'VLAN 50 • GW .50.1',
      logicalMeta: 'App Gestión (:68)',
      accent: '#94A3B8'
    }
  ] as const;

  const vmServers = [
    {
      id: 'dhcp',
      y: 74,
      name: 'Win Server DHCP',
      ip: '172.16.10.14',
      protoBadge: 'UDP 67/68',
      protoType: 'udp' as const,
      physicalRole: 'VM VLAN 10 • eth0',
      logicalRole: 'Socket único UDP (:67)'
    },
    {
      id: 'nginx',
      y: 168,
      name: 'Proxy Inverso Nginx',
      ip: '172.16.10.12',
      protoBadge: 'TCP 80/443',
      protoType: 'tcp' as const,
      physicalRole: 'Puerta pública • Filtra VLANs',
      logicalRole: 'Recepción (:443) → Portal Docente'
    },
    {
      id: 'apache',
      y: 262,
      name: 'Backend Apache HTTP',
      ip: '172.16.10.11',
      protoBadge: 'TCP 8080',
      protoType: 'tcp' as const,
      physicalRole: 'Portal Profesores • Solo vía Nginx',
      logicalRole: 'Portal Docentes (:8080 protegido)'
    },
    {
      id: 'samba',
      y: 356,
      name: 'Servidor Samba SMB',
      ip: '172.16.10.13',
      protoBadge: 'TCP 445',
      protoType: 'tcp' as const,
      physicalRole: 'VM VLAN 10 • Archivos',
      logicalRole: 'Archivo confiable (Seq + ACK)'
    }
  ] as const;

  const ispLinks: Array<{
    id: IspId;
    label: string;
    xTop: number;
    xBot: number;
    pillX: number;
    pillY: number;
  }> = [
    { id: 'starlink', label: 'Starlink 20%', xTop: 988, xBot: 916, pillX: 904, pillY: 198 },
    { id: 'westnet', label: 'WestNet 30%', xTop: 1031, xBot: 984, pillX: 992, pillY: 168 },
    { id: 'tachicom', label: 'Tachicom 50%', xTop: 1074, xBot: 1052, pillX: 1068, pillY: 214 }
  ];

  const c9200Active = isHighlighted('c9200');
  const merakiActive = isHighlighted('meraki');
  const mikrotikActive = isHighlighted('mikrotik');

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[22px] border transition-colors duration-300 ${
        isDark ? 'bg-[#09090B] border-white/[0.10]' : 'bg-[#F5F5F7] border-black/[0.08]'
      }`}
    >
      {/* HUD SUPERIOR */}
      <div
        className={`px-3.5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2.5 ${
          isDark
            ? 'bg-white/[0.03] border-white/[0.08]'
            : 'bg-white/85 border-black/[0.06]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-[-0.01em] border shrink-0 ${
              isLogical
                ? isDark
                  ? 'bg-[#0A84FF]/15 text-[#64D2FF] border-[#0A84FF]/40'
                  : 'bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/30'
                : isDark
                ? 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/35'
                : 'bg-[#FF9F0A]/12 text-[#B45309] border-[#FF9F0A]/35'
            }`}
          >
            {isLogical ? (
              <Layers className="w-3.5 h-3.5" strokeWidth={2} />
            ) : (
              <Network className="w-3.5 h-3.5" strokeWidth={2} />
            )}
            {isLogical ? 'Capa Lógica • Capa 4 (Transporte)' : 'Capa Física • Capas 1–3 (Red)'}
          </span>

          <span
            className={`text-[11.5px] font-medium tracking-[-0.01em] truncate ${
              isDark ? 'text-[#D1D1D6]' : 'text-[#3A3A3C]'
            }`}
          >
            {isLogical
              ? 'Solo aplicaciones hablando extremo a extremo (los switches y routers desaparecen).'
              : 'Recorrido físico por cables, Switch Cisco C9200, Rack Proxmox, Meraki y MikroTik.'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {headerExtra}

          {onToggleViewLayer && (
            <div className="apple-segmented text-xs">
              <button
                type="button"
                onClick={() => onToggleViewLayer('physical')}
                className={`apple-btn px-3 py-1 rounded-[10px] ${
                  !isLogical
                    ? 'apple-segment-active'
                    : 'text-[#515154] hover:text-[#1D1D1F]'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                Capa Física
              </button>
              <button
                type="button"
                onClick={() => onToggleViewLayer('logical')}
                className={`apple-btn px-3 py-1 rounded-[10px] ${
                  isLogical
                    ? 'apple-btn-primary border-transparent'
                    : 'text-[#515154] hover:text-[#1D1D1F]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Capa Lógica
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-controles contextuales */}
      {subControls && (
        <div
          className={`px-3.5 py-1.5 border-b flex flex-wrap items-center justify-between gap-2 ${
            isDark
              ? 'bg-black/35 border-white/[0.06]'
              : 'bg-[#FAFAFC] border-black/[0.05]'
          }`}
        >
          {subControls}
        </div>
      )}

      {/* SVG ARQUITECTÓNICO 1120x470 */}
      <svg
        viewBox="0 0 1120 470"
        className={`w-full h-auto select-none ${
          compact ? 'min-h-[280px] max-h-[360px]' : 'min-h-[360px] max-h-[510px]'
        }`}
      >
        <defs>
          {/* Patrón sutil de rejilla técnica */}
          <pattern id="apple-dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle
              cx="12"
              cy="12"
              r="0.85"
              fill={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
            />
          </pattern>

          <filter id="apple-pill-shadow" x="-25%" y="-25%" width="150%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.42" />
          </filter>
          <filter id="apple-card-shadow" x="-12%" y="-12%" width="124%" height="130%">
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="4"
              floodColor="#000000"
              floodOpacity={isDark ? '0.52' : '0.10'}
            />
          </filter>
          <filter id="apple-neon-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Puntas de flecha nítidas por protocolo */}
          {(['udp', 'tcp', 'ack', 'error'] as const).map((tone) => (
            <marker
              key={`arrow-${tone}`}
              id={`arrow-${tone}`}
              viewBox="0 0 10 10"
              refX="8.6"
              refY="5"
              markerWidth="6.4"
              markerHeight="6.4"
              orient="auto"
            >
              <path
                d="M 0.8 1.5 L 9.2 5 L 0.8 8.5 L 2.8 5 Z"
                fill={SIGNAL_PALETTE[tone].line}
              />
            </marker>
          ))}
        </defs>

        {/* Fondo sutil */}
        <rect width="1120" height="470" fill="url(#apple-dot-grid)" />

        {/* ===================================================================== */}
        {/* 1. CAPA FÍSICA EXCLUSIVA (Capas 1-3: Cables, Rack, Switch, FW, Router) */}
        {/* ===================================================================== */}
        <AnimatePresence>
          {!isLogical && (
            <motion.g
              key="physical-layer-root"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.14 } }}
              transition={{ duration: 0.25, ease: APPLE_EASE }}
            >
              {/* Gabinete Rack Metálico PROXMOX Svf01 */}
              <rect
                x="522"
                y="40"
                width="246"
                height="394"
                rx="16"
                fill={isDark ? 'rgba(255,255,255,0.022)' : 'rgba(0,0,0,0.025)'}
                stroke={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.13)'}
                strokeWidth="1.3"
              />
              {/* Rieles laterales con perforaciones de rack */}
              {[0, 1].map((side) => (
                <g key={side} transform={`translate(${side === 0 ? 526 : 756}, 74)`}>
                  <rect width="6" height="350" rx="2" fill={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} />
                  {Array.from({ length: 15 }).map((_, hole) => (
                    <circle
                      key={hole}
                      cx="3"
                      cy={12 + hole * 23}
                      r="1.3"
                      fill={isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)'}
                    />
                  ))}
                </g>
              ))}
              {/* Cabecera Rack Svf01 */}
              <path
                d="M 522 56 Q 522 40 538 40 L 752 40 Q 768 40 768 56 L 768 66 L 522 66 Z"
                fill={rackHeaderBg}
              />
              <circle cx="538" cy="53" r="3.2" fill="#30D158" />
              <circle cx="549" cy="53" r="3.2" fill="#0A84FF" />
              <text
                x="650"
                y="56.5"
                textAnchor="middle"
                fontSize="9.8"
                fontWeight="700"
                fill={textPrimary}
                className="font-mono"
              >
                RACK PROXMOX Svf01 • .10.10
              </text>

              {/* Cables Acceso Trunk 802.1Q: PCs -> C9200 (bus x=248) */}
              <path
                d={pointsToRoundedPath(
                  [{ x: 202, y: 81 }, { x: 248, y: 81 }, { x: 248, y: 207 }, { x: 294, y: 207 }],
                  10
                )}
                fill="none"
                stroke={isHighlighted('student') ? activeAccent : strokeLine}
                strokeWidth={isHighlighted('student') ? '2.6' : '2'}
              />
              <path
                d="M 202 235 L 294 235"
                fill="none"
                stroke={isHighlighted('teacher') ? activeAccent : strokeLine}
                strokeWidth={isHighlighted('teacher') ? '2.6' : '2'}
              />
              <path
                d={pointsToRoundedPath(
                  [{ x: 202, y: 389 }, { x: 248, y: 389 }, { x: 248, y: 263 }, { x: 294, y: 263 }],
                  10
                )}
                fill="none"
                stroke={isHighlighted('admin') ? activeAccent : strokeLine}
                strokeWidth={isHighlighted('admin') ? '2.6' : '2'}
              />
              <rect
                x="210"
                y="128"
                width="76"
                height="18"
                rx="7"
                fill={isDark ? '#18181C' : '#FFFFFF'}
                stroke={nodeBorder}
                strokeWidth="0.9"
              />
              <text
                x="248"
                y="140"
                textAnchor="middle"
                fontSize="8.6"
                fontWeight="700"
                fill={textSecondary}
                className="font-mono"
              >
                Trunk 802.1Q
              </text>

              {/* Cables Distribuidores VLAN 10: C9200 -> VMs (bus x=500) */}
              {[
                { id: 'dhcp', exitY: 192, entryY: 106, color: udpAccent },
                { id: 'nginx', exitY: 218, entryY: 200, color: activeAccent },
                { id: 'apache', exitY: 252, entryY: 294, color: activeAccent },
                { id: 'samba', exitY: 278, entryY: 388, color: activeAccent }
              ].map((vm) => {
                const active = isHighlighted(vm.id);
                return (
                  <path
                    key={vm.id}
                    d={pointsToRoundedPath(
                      [{ x: 468, y: vm.exitY }, { x: 500, y: vm.exitY }, { x: 500, y: vm.entryY }, { x: 540, y: vm.entryY }],
                      10
                    )}
                    fill="none"
                    stroke={active ? vm.color : strokeLine}
                    strokeWidth={active ? '2.6' : '2'}
                  />
                );
              })}

              {/* Corredor superior WAN: C9200 -> Meraki */}
              <path
                d={pointsToRoundedPath(
                  [{ x: 381, y: 160 }, { x: 381, y: 24 }, { x: 875, y: 24 }, { x: 875, y: 48 }],
                  12
                )}
                fill="none"
                stroke={merakiActive ? activeAccent : strokeLine}
                strokeWidth={merakiActive ? '2.6' : '2.1'}
              />
              <rect
                x="536"
                y="14"
                width="184"
                height="19"
                rx="9.5"
                fill={isDark ? '#18181C' : '#FFFFFF'}
                stroke={merakiActive ? activeAccent : nodeBorder}
                strokeWidth="0.95"
              />
              <text
                x="628"
                y="26.5"
                textAnchor="middle"
                fontSize="8.8"
                fontWeight="700"
                fill={textSecondary}
                className="font-mono"
              >
                Tránsito WAN • .10.6 / 10.0.0.1
              </text>

              {/* Meraki -> MikroTik */}
              <line
                x1={942}
                y1={94}
                x2={964}
                y2={94}
                stroke={mikrotikActive ? activeAccent : strokeLine}
                strokeWidth={mikrotikActive ? '2.8' : '2.2'}
              />

              {/* 3 Enlaces WAN físicos desde MikroTik hacia Nube Externa */}
              {ispLinks.map((isp) => {
                const isIspOn = activeIspIds.includes(isp.id);
                const multiWanBad = activeIspIds.length > 1;
                const ispColor = isIspOn
                  ? multiWanBad
                    ? '#FF453A'
                    : activeAccent
                  : strokeLine;
                return (
                  <g key={isp.id}>
                    <line
                      x1={isp.xTop}
                      y1={140}
                      x2={isp.xBot}
                      y2={278}
                      stroke={ispColor}
                      strokeWidth={isIspOn ? '3' : '1.8'}
                    />
                    <rect
                      x={isp.pillX - 38}
                      y={isp.pillY - 9}
                      width="76"
                      height="18"
                      rx="6"
                      fill={
                        isIspOn
                          ? multiWanBad
                            ? isDark
                              ? '#3B1618'
                              : '#FEE2E2'
                            : isDark
                            ? '#0D2847'
                            : '#DBEAFE'
                          : isDark
                          ? '#18181C'
                          : '#FFFFFF'
                      }
                      stroke={isIspOn ? ispColor : nodeBorder}
                      strokeWidth={isIspOn ? '1.25' : '0.9'}
                    />
                    <text
                      x={isp.pillX}
                      y={isp.pillY + 3}
                      textAnchor="middle"
                      fontSize="8.4"
                      fontWeight="700"
                      fill={isIspOn ? (multiWanBad ? '#FF453A' : activeAccent) : textSecondary}
                      className="font-mono"
                    >
                      {isp.label}
                    </text>
                  </g>
                );
              })}

              {/* Silueta de Nube WAN Externa */}
              <path
                d="M 838 424 C 806 424, 790 400, 800 374 C 788 354, 804 322, 836 320 C 848 282, 898 270, 932 288 C 964 270, 1018 286, 1028 320 C 1064 326, 1080 360, 1064 388 C 1072 412, 1048 426, 1016 426 Z"
                transform="translate(52, -6)"
                fill={isDark ? 'rgba(56,189,248,0.055)' : 'rgba(2,132,199,0.055)'}
                stroke={
                  isHighlighted('opendns')
                    ? udpAccent
                    : isDark
                    ? 'rgba(255,255,255,0.16)'
                    : 'rgba(0,0,0,0.14)'
                }
                strokeWidth={isHighlighted('opendns') ? '2.1' : '1.2'}
                strokeDasharray={isHighlighted('opendns') ? undefined : '5 4'}
              />

              {/* === HARDWARE: SWITCH RACK 1U CISCO CATALYST C9200-24P === */}
              <g transform="translate(294, 160)" filter="url(#apple-card-shadow)">
                {/* Orejas metálicas de rack */}
                <rect x="-6" y="18" width="6" height="28" rx="1.5" fill={isDark ? '#3A3A3C' : '#C7C7CC'} />
                <rect x="174" y="18" width="6" height="28" rx="1.5" fill={isDark ? '#3A3A3C' : '#C7C7CC'} />
                <rect
                  width="174"
                  height="150"
                  rx="15"
                  fill={nodeBg}
                  stroke={
                    getBadgeFor('c9200')?.tone === 'error'
                      ? '#FF453A'
                      : c9200Active
                      ? activeAccent
                      : nodeBorder
                  }
                  strokeWidth={getBadgeFor('c9200') || c9200Active ? '2.4' : '1.2'}
                />
                {/* Frontal estilo Rack 1U Cisco */}
                <rect x="10" y="10" width="154" height="44" rx="8" fill={chassisBg} stroke={nodeBorder} strokeWidth="0.9" />
                <text x="17" y="23" fontSize="8.2" fontWeight="700" fill={activeAccent} className="font-mono">
                  CISCO CATALYST
                </text>
                <text x="157" y="23" textAnchor="end" fontSize="8" fontWeight="700" fill={textSecondary} className="font-mono">
                  24P+SFP
                </text>
                {/* 10 puertos RJ45 con LEDs animados */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                  <g key={p} transform={`translate(${17 + p * 11}, 30)`}>
                    <rect width="8.5" height="11" rx="1.5" fill={isDark ? '#2C2C2E' : '#D1D1D6'} />
                    <motion.circle
                      cx="4.25"
                      cy="2.5"
                      r="1.3"
                      fill={p < 7 ? '#30D158' : '#38BDF8'}
                      animate={c9200Active ? { opacity: [0.45, 1, 0.45] } : { opacity: 0.85 }}
                      transition={{ duration: 1.4, delay: p * 0.14, repeat: Infinity }}
                    />
                  </g>
                ))}
                {[0, 1].map((sfp) => (
                  <rect
                    key={sfp}
                    x={132 + sfp * 13}
                    y="30"
                    width="10"
                    height="11"
                    rx="1.5"
                    fill={activeAccent}
                    fillOpacity="0.7"
                  />
                ))}
                <text x="14" y="75" fontSize="13" fontWeight="700" fill={textPrimary}>
                  Cisco C9200-24P
                </text>
                <text x="14" y="95" fontSize="10.5" fill={textPrimary} className="font-mono" opacity="0.92">
                  GW .10.1 / .20.1 / .30.1
                </text>
                <text x="14" y="114" fontSize="9.6" fill={textSecondary}>
                  Organiza VLANs • Relay DHCP
                </text>
                <text x="14" y="131" fontSize="9.6" fill={activeAccent} fontWeight="600">
                  Seguridad por ACLs L3/L4
                </text>
                {/* Puertos entrada/salida */}
                <circle cx="0" cy="47" r="3" fill={activeAccent} />
                <circle cx="0" cy="75" r="3" fill={activeAccent} />
                <circle cx="0" cy="103" r="3" fill={activeAccent} />
                <circle cx="87" cy="0" r="3" fill={activeAccent} />
              </g>

              {/* === HARDWARE: FIREWALL CISCO MERAKI MX100 === */}
              <g transform="translate(808, 48)" filter="url(#apple-card-shadow)">
                <rect
                  width="134"
                  height="92"
                  rx="14"
                  fill={nodeBg}
                  stroke={merakiActive ? activeAccent : nodeBorder}
                  strokeWidth={merakiActive ? '2.4' : '1.15'}
                />
                <rect x="0" y="0" width="134" height="26" rx="14" fill={chassisBg} />
                <rect x="0" y="14" width="134" height="12" fill={chassisBg} />
                {/* Barra LED Meraki */}
                <motion.rect
                  x="12"
                  y="10"
                  width="14"
                  height="5"
                  rx="2.5"
                  fill="#FF9F0A"
                  animate={merakiActive ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.9 }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                <text x="33" y="16" fontSize="8.4" fontWeight="700" fill={textSecondary} className="font-mono">
                  FIREWALL L3/L7
                </text>
                <text x="12" y="47" fontSize="12" fontWeight="700" fill={textPrimary}>
                  Meraki MX100
                </text>
                <text x="12" y="65" fontSize="10" fill={textPrimary} className="font-mono" opacity="0.9">
                  172.16.10.6
                </text>
                <text x="12" y="80" fontSize="9" fill={textSecondary} className="font-mono">
                  Aduana • 10.0.0.1
                </text>
              </g>

              {/* === HARDWARE: ROUTER MIKROTIK RB750Gr3 === */}
              <g transform="translate(964, 48)" filter="url(#apple-card-shadow)">
                <rect
                  width="134"
                  height="92"
                  rx="14"
                  fill={nodeBg}
                  stroke={mikrotikActive ? activeAccent : nodeBorder}
                  strokeWidth={mikrotikActive ? '2.4' : '1.15'}
                />
                <rect x="0" y="0" width="134" height="26" rx="14" fill={chassisBg} />
                <rect x="0" y="14" width="134" height="12" fill={chassisBg} />
                {[0, 1, 2, 3, 4].map((p) => (
                  <rect
                    key={p}
                    x={12 + p * 12}
                    y="8"
                    width="8.5"
                    height="9"
                    rx="1.8"
                    fill={p < 3 ? '#30D158' : activeAccent}
                  />
                ))}
                <text x="123" y="16" textAnchor="end" fontSize="8" fontWeight="700" fill={textSecondary} className="font-mono">
                  ROUTER
                </text>
                <text x="12" y="47" fontSize="12" fontWeight="700" fill={textPrimary}>
                  MikroTik hEX
                </text>
                <text x="12" y="65" fontSize="10" fill={textPrimary} className="font-mono" opacity="0.9">
                  172.16.10.5 / .0.5
                </text>
                <text x="12" y="80" fontSize="9" fill={textSecondary}>
                  Balanceo PCC 3 ISPs
                </text>
              </g>
            </motion.g>
          )}
        </AnimatePresence>

        {/* ===================================================================== */}
        {/* 2. CAPA LÓGICA EXCLUSIVA (L4: SOLO PROCESOS Y TÚNELES DIRECTOS)       */}
        {/* ===================================================================== */}
        <AnimatePresence>
          {isLogical && (
            <motion.g
              key="logical-layer-root"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.14 } }}
              transition={{ duration: 0.25, ease: APPLE_EASE }}
            >
              {/* Banner superior L4 */}
              <g transform="translate(560, 22)">
                <rect
                  x="-210"
                  y="-12"
                  width="420"
                  height="23"
                  rx="11.5"
                  fill={isDark ? 'rgba(10,132,255,0.12)' : 'rgba(0,113,227,0.08)'}
                  stroke={isDark ? 'rgba(100,210,255,0.34)' : 'rgba(0,113,227,0.28)'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fontSize="9.8"
                  fontWeight="700"
                  fill={isDark ? '#64D2FF' : '#0071E3'}
                  className="font-mono"
                >
                  CAPA 4 (TRANSPORTE) • PROCESO ORIGEN ↔ PROCESO DESTINO DIRECTO
                </text>
              </g>

              {/* Panel conceptual sutil en el medio explicando la abstracción */}
              <g transform="translate(380, 444)">
                <rect
                  x="-150"
                  y="-11"
                  width="300"
                  height="20"
                  rx="10"
                  fill={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}
                  stroke={nodeBorder}
                  strokeWidth="0.8"
                />
                <text x="0" y="2.5" textAnchor="middle" fontSize="9.2" fill={textSecondary} fontWeight="600">
                  Cables, switch C9200, Meraki y MikroTik ocultos en Capa 4
                </text>
              </g>

              {logicalTunnel && (
                <>
                  {[
                    { from: logicalTunnel.from, to: logicalTunnel.to, via: logicalTunnel.via },
                    ...(logicalTunnel.secondHop ? [logicalTunnel.secondHop] : []),
                    ...(logicalTunnel.extraTunnels || [])
                  ].map((hop, idx) => {
                    const d = buildTunnelPath(hop.from, hop.to, hop.via);
                    const lineColor = SIGNAL_PALETTE[logicalTunnel.color].line;
                    const f = mapLogicalPoint(hop.from);
                    const t = mapLogicalPoint(hop.to);
                    return (
                      <React.Fragment key={idx}>
                        {/* Halo luminoso de túnel L4 */}
                        <path
                          d={d}
                          fill="none"
                          stroke={lineColor}
                          strokeOpacity="0.16"
                          strokeWidth="16"
                          strokeLinecap="round"
                        />
                        <motion.path
                          d={d}
                          fill="none"
                          stroke={lineColor}
                          strokeWidth="2.8"
                          strokeDasharray="8 6"
                          strokeLinecap="round"
                          animate={{ strokeDashoffset: [0, -28] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                        />
                        <circle cx={f.x} cy={f.y} r="5.2" fill={lineColor} />
                        <circle cx={t.x} cy={t.y} r="5.2" fill={lineColor} />
                      </React.Fragment>
                    );
                  })}

                  {logicalTunnel.label && tunnelMidpoint && (
                    <g transform={`translate(${tunnelMidpoint.x}, ${tunnelMidpoint.y - 18})`} filter="url(#apple-pill-shadow)">
                      <rect
                        x={-Math.max(108, logicalTunnel.label.length * 3.45 + 16)}
                        y="-12"
                        width={Math.max(216, logicalTunnel.label.length * 6.9 + 32)}
                        height="24"
                        rx="12"
                        fill={isDark ? '#111827' : '#FFFFFF'}
                        stroke={SIGNAL_PALETTE[logicalTunnel.color].line}
                        strokeWidth="1.35"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fontSize="10.2"
                        fontWeight="700"
                        fill={isDark ? '#F5F5F7' : '#1D1D1F'}
                        className="font-mono"
                      >
                        {logicalTunnel.label}
                      </text>
                    </g>
                  )}

                  {logicalTunnel.secondHop?.label && (
                    <g transform="translate(778, 247)" filter="url(#apple-pill-shadow)">
                      <rect
                        x="-83"
                        y="-11"
                        width="166"
                        height="22"
                        rx="11"
                        fill={isDark ? '#111827' : '#FFFFFF'}
                        stroke={SIGNAL_PALETTE[logicalTunnel.color].line}
                        strokeWidth="1.2"
                      />
                      <text
                        x="0"
                        y="3.3"
                        textAnchor="middle"
                        fontSize="9.2"
                        fontWeight="700"
                        fill={isDark ? '#F5F5F7' : '#1D1D1F'}
                        className="font-mono"
                      >
                        {logicalTunnel.secondHop.label}
                      </text>
                    </g>
                  )}
                </>
              )}
            </motion.g>
          )}
        </AnimatePresence>

        {/* === CLIENTES (WORKSTATIONS EN FÍSICA / VENTANAS APP EN LÓGICA) === */}
        {clientNodes.map((pc) => {
          const active = isHighlighted(pc.id);
          const nodeOpacity = isLogical && hasHighlightFilter && !active ? 0.34 : 1;
          return (
            <g
              key={pc.id}
              transform={`translate(22, ${pc.y})`}
              filter="url(#apple-card-shadow)"
              style={{ opacity: nodeOpacity, transition: 'opacity 0.3s ease' }}
            >
              {active && (
                <motion.rect
                  x="-3"
                  y="-3"
                  width="186"
                  height="92"
                  rx="18"
                  fill="none"
                  stroke={activeAccent}
                  strokeWidth="1.6"
                  animate={{ opacity: [0.18, 0.52, 0.18] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                />
              )}
              <rect
                width="180"
                height="86"
                rx="15"
                fill={nodeBg}
                stroke={active ? activeAccent : nodeBorder}
                strokeWidth={active ? '2.2' : '1.15'}
              />
              <rect x="6" y="10" width="4.5" height="66" rx="2.2" fill={pc.accent} />

              {/* Ícono adaptado a la capa: Monitor PC vs Ventana de App/Socket */}
              {!isLogical ? (
                <g transform="translate(18, 13)">
                  <rect width="26" height="17" rx="3" fill={chassisBg} stroke={active ? activeAccent : pc.accent} strokeWidth="1.6" />
                  <line x1="8" y1="20" x2="18" y2="20" stroke={active ? activeAccent : textSecondary} strokeWidth="2" strokeLinecap="round" />
                  <line x1="13" y1="17" x2="13" y2="20" stroke={active ? activeAccent : textSecondary} strokeWidth="1.8" />
                </g>
              ) : (
                <g transform="translate(18, 13)">
                  <rect width="26" height="19" rx="4" fill={chassisBg} stroke={active ? activeAccent : pc.accent} strokeWidth="1.5" />
                  <circle cx="5.5" cy="5.5" r="1.4" fill="#FF453A" />
                  <circle cx="10" cy="5.5" r="1.4" fill="#FF9F0A" />
                  <circle cx="14.5" cy="5.5" r="1.4" fill="#30D158" />
                  <line x1="5" y1="12" x2="20" y2="12" stroke={pc.accent} strokeWidth="1.6" strokeLinecap="round" />
                </g>
              )}

              <text x="52" y="25" fontSize="11.8" fontWeight="700" fill={textPrimary}>
                {pc.title}
              </text>
              <text x="19" y="51" fontSize="11" fill={textPrimary} className="font-mono" opacity="0.94">
                {pc.ip}
              </text>
              <text x="19" y="69" fontSize="9.3" fill={isLogical && active ? activeAccent : textSecondary}>
                {isLogical ? pc.logicalMeta : pc.physicalMeta}
              </text>
              <circle
                cx="180"
                cy="43"
                r="3.8"
                fill={active ? activeAccent : isDark ? '#3F3F46' : '#CBD5E1'}
              />
            </g>
          );
        })}

        {/* === SERVIDORES / SERVICIOS DESTINO === */}
        {vmServers.map((srv) => {
          const nginxProxyBlocked = srv.id === 'nginx' && isHighlighted('nginx_proxy_block');
          const apacheProtected = srv.id === 'apache' && isHighlighted('apache_protected');
          const active =
            isHighlighted(srv.id) ||
            nginxProxyBlocked ||
            apacheProtected ||
            (srv.id === 'apache' && isHighlighted('apache_err'));
          const errBorder = (srv.id === 'apache' && isHighlighted('apache_err')) || nginxProxyBlocked;
          const pillFill = errBorder
            ? '#FF453A'
            : apacheProtected
            ? ackAccent
            : srv.protoType === 'udp'
            ? udpAccent
            : activeAccent;
          const nodeOpacity = isLogical && hasHighlightFilter && !active ? 0.34 : 1;
          return (
            <g
              key={srv.id}
              transform={`translate(540, ${srv.y})`}
              filter="url(#apple-card-shadow)"
              style={{ opacity: nodeOpacity, transition: 'opacity 0.3s ease' }}
            >
              {active && (
                <motion.rect
                  x="-3"
                  y="-3"
                  width="216"
                  height="70"
                  rx="16"
                  fill="none"
                  stroke={pillFill}
                  strokeWidth="1.5"
                  strokeDasharray={apacheProtected ? '5 4' : undefined}
                  animate={{ opacity: [0.16, 0.52, 0.16] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                />
              )}
              <rect
                width="210"
                height="64"
                rx="13"
                fill={nodeBg}
                stroke={active ? pillFill : nodeBorder}
                strokeWidth={active ? '2.2' : '1.15'}
                strokeDasharray={apacheProtected ? '6 3' : undefined}
              />
              <rect x="8" y="9" width="5" height="46" rx="2.5" fill={pillFill} />
              {/* Mini vent / status LED blade server */}
              <motion.circle
                cx="20"
                cy="16.5"
                r="2.4"
                fill={errBorder ? '#FF453A' : active ? '#30D158' : pillFill}
                animate={active ? { opacity: [0.45, 1, 0.45] } : { opacity: 0.85 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <text x="28" y="20" fontSize="11.6" fontWeight="700" fill={textPrimary}>
                {srv.name}
              </text>
              <rect
                x="136"
                y="27"
                width="65"
                height="16"
                rx="5"
                fill={pillFill}
                fillOpacity={isDark ? '0.2' : '0.12'}
              />
              <text
                x="168.5"
                y="38"
                textAnchor="middle"
                fontSize="8.8"
                fontWeight="700"
                fill={pillFill}
                className="font-mono"
              >
                {srv.protoBadge}
              </text>
              <text x="21" y="39" fontSize="10.2" fill={textPrimary} className="font-mono" opacity="0.92">
                {srv.ip}
              </text>
              <text x="21" y="54" fontSize="8.9" fill={apacheProtected ? ackAccent : textSecondary} fontWeight={apacheProtected ? '600' : '400'}>
                {apacheProtected
                  ? 'Protegido • Intacto tras Proxy Nginx'
                  : isLogical
                  ? srv.logicalRole
                  : srv.physicalRole}
              </text>
              <circle
                cx="0"
                cy="32"
                r="3.8"
                fill={active ? pillFill : isDark ? '#3F3F46' : '#CBD5E1'}
              />

              {/* Barrera Firewall Proxy cuando Nginx bloquea VLAN 20 */}
              {nginxProxyBlocked && (
                <g transform="translate(-8, 32)">
                  <motion.line
                    x1="0"
                    y1="-24"
                    x2="0"
                    y2="24"
                    stroke="#FF453A"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    animate={{ opacity: [0.45, 1, 0.45] }}
                    transition={{ duration: 1.3, repeat: Infinity }}
                  />
                  <circle r="10" fill={isDark ? '#3B1216' : '#FEE2E2'} stroke="#FF453A" strokeWidth="1.6" />
                  <path
                    d="M 0 -5 L 4 -3.2 V 0.8 C 4 3 2.2 4.5 0 5.2 C -2.2 4.5 -4 3 -4 0.8 V -3.2 Z"
                    fill="#FF453A"
                    fillOpacity="0.24"
                    stroke="#FF453A"
                    strokeWidth="1.2"
                  />
                  <path d="M -1.5 -1 L 1.5 2 M 1.5 -1 L -1.5 2" stroke="#FF453A" strokeWidth="1.3" strokeLinecap="round" />
                </g>
              )}

              {/* Escudo candado sobre Apache cuando queda aislado del alumno */}
              {apacheProtected && (
                <g transform="translate(194, 14)">
                  <circle r="8.5" fill={isDark ? '#102C1E' : '#DCFCE7'} stroke={ackAccent} strokeWidth="1.2" />
                  <path
                    d="M -2.8 -0.5 V -2.5 C -2.8 -4.1 2.8 -4.1 2.8 -2.5 V -0.5 M -3.8 -0.5 H 3.8 V 4 H -3.8 Z"
                    fill="none"
                    stroke={ackAccent}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* === DESTINO INTERNET (BAJO EN FÍSICA, CENTRADO EN LÓGICA) === */}
        <g
          transform={`translate(874, ${isLogical ? 186 : 304})`}
          filter="url(#apple-card-shadow)"
          style={{
            opacity: isLogical && hasHighlightFilter && !isHighlighted('opendns') ? 0.34 : 1,
            transition: 'opacity 0.3s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <rect
            width="220"
            height="98"
            rx="15"
            fill={nodeBg}
            stroke={isHighlighted('opendns') ? udpAccent : nodeBorder}
            strokeWidth={isHighlighted('opendns') ? '2.3' : '1.15'}
          />
          <text
            x="16"
            y="21"
            fontSize="8.8"
            fontWeight="700"
            fill={udpAccent}
            className="font-mono"
          >
            {isLogical ? 'SERVICIO REMOTO L4' : 'INTERNET • EN LA NUBE'}
          </text>
          <circle
            cx="23"
            cy="43"
            r="6.5"
            fill={udpAccent}
            fillOpacity="0.2"
            stroke={udpAccent}
            strokeWidth="1.6"
          />
          <text x="36" y="47" fontSize="12.4" fontWeight="700" fill={textPrimary}>
            {internetTitle}
          </text>
          <text x="16" y="67" fontSize="10.5" fill={textPrimary} className="font-mono" opacity="0.94">
            {internetSubtitle}
          </text>
          <text x="16" y="84" fontSize="9.1" fill={textSecondary}>
            {internetTitle.includes('OpenDNS')
              ? 'UDP 53 • Filtro web (TCP >512B)'
              : 'Sesión TCP por proveedor asignado'}
          </text>
          <circle
            cx="110"
            cy="0"
            r="3.8"
            fill={isHighlighted('opendns') ? udpAccent : isDark ? '#3F3F46' : '#CBD5E1'}
          />
        </g>

        {/* === BADGES DE ESTADO (FUERA DE FRAMER TRANSFORM) === */}
        <AnimatePresence>
          {badges
            .filter((b) => !(isLogical && (b.nodeId === 'c9200' || b.nodeId === 'mikrotik')))
            .map((badge) => {
              const coord = getBadgeAnchor(badge.nodeId, isLogical);
              const sig = SIGNAL_PALETTE[badge.tone];
              const badgeW = Math.max(162, badge.text.length * 6.4 + 24);
              const clampedX = Math.min(1120 - badgeW / 2 - 10, Math.max(badgeW / 2 + 10, coord.x));
              return (
                <motion.g
                  key={`badge-${viewLayer}-${badge.nodeId}-${badge.text}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.22, ease: APPLE_EASE }}
                >
                  <g transform={`translate(${clampedX}, ${coord.y})`} filter="url(#apple-pill-shadow)">
                    <motion.g
                      initial={{ scale: 0.92 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.22, ease: APPLE_EASE }}
                    >
                      <rect
                        x={-badgeW / 2}
                        y="-11"
                        width={badgeW}
                        height="22"
                        rx="11"
                        fill={isDark ? sig.bg : sig.lightBg}
                        stroke={sig.border}
                        strokeWidth="1.25"
                      />
                      <text
                        x="0"
                        y="3.3"
                        textAnchor="middle"
                        fontSize="9.8"
                        fontWeight="700"
                        fill={isDark ? sig.pillText : sig.lightText}
                        className="font-mono"
                      >
                        {badge.text}
                      </text>
                    </motion.g>
                  </g>
                </motion.g>
              );
            })}
        </AnimatePresence>

        {/* === FLECHAS DIRECCIONALES + PAQUETES/ARCHIVOS EN RUTA === */}
        <AnimatePresence mode="wait">
          <motion.g
            key={`${viewLayer}::${packets.map((p) => `${p.id}:${p.label}`).join('|')}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.16 } }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
          >
            {packets.map((pkt) => {
              const pColor = SIGNAL_PALETTE[pkt.color].line;
              const d = buildSvgPath(pkt.points, pkt.stopsAtMiddle, pkt.curveOffset);
              return (
                <g key={`trace-grp-${pkt.id}`}>
                  {/* Halo sutil de ruta */}
                  <path
                    d={d}
                    fill="none"
                    stroke={pColor}
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    strokeOpacity="0.14"
                  />
                  {/* Trazo guía direccional con punta de flecha */}
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={pColor}
                    strokeWidth="2.35"
                    strokeLinecap="round"
                    markerEnd={pkt.dropMarker ? undefined : `url(#arrow-${pkt.color})`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.72 }}
                    transition={{
                      duration: Math.max(0.55, (pkt.duration || 2.5) * 0.35),
                      delay: pkt.delay || 0,
                      ease: APPLE_EASE
                    }}
                  />
                  {/* Pulso de flujo animado mostrando dirección continua */}
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={pColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6 10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.9, strokeDashoffset: [0, -32] }}
                    transition={{
                      opacity: { duration: 0.35, delay: pkt.delay || 0 },
                      strokeDashoffset: { repeat: Infinity, duration: 1.35, ease: 'linear' }
                    }}
                  />
                </g>
              );
            })}

            {packets.map((pkt) => {
              const sampledPts = expandWaypoints(pkt.points, pkt.curveOffset);
              const kf = buildTimedMotion(sampledPts, pkt.dropMarker);
              const sig = SIGNAL_PALETTE[pkt.color];
              const pillW = Math.max(132, pkt.label.length * 6.35 + 46);
              const dur = pkt.duration || 3.8;
              const dly = pkt.delay || 0;
              const repDelay = pkt.repeatDelay ?? 1.2;
              const isLoop = Boolean(pkt.loop);
              const startX = kf.x[0] ?? 0;
              const startY = kf.y[0] ?? 0;
              const dropX = kf.x[kf.x.length - 1] ?? 0;
              const dropY = kf.y[kf.y.length - 1] ?? 0;
              const dx = dropX - startX;
              const dy = dropY - startY;
              const dirChevron = pkt.dropMarker
                ? '✕'
                : Math.abs(dx) >= Math.abs(dy)
                ? dx >= 0
                  ? '▸'
                  : '◂'
                : dy >= 0
                ? '▾'
                : '▴';
              const iconStroke = isDark ? sig.pillText : sig.lightText;

              return (
                <g key={`pkt-wrap-${pkt.id}`}>
                  {!pkt.stopsAtMiddle &&
                    !pkt.dropMarker &&
                    pkt.points
                      .map(mapLogicalPoint)
                      .slice(1)
                      .filter(
                        (pt) =>
                          isSamePoint(pt, TOPOLOGY_COORDS.c9200) ||
                          isSamePoint(pt, TOPOLOGY_COORDS.dhcp) ||
                          isSamePoint(pt, TOPOLOGY_COORDS.nginx) ||
                          isSamePoint(pt, TOPOLOGY_COORDS.apache) ||
                          isSamePoint(pt, TOPOLOGY_COORDS.samba) ||
                          isSamePoint(pt, TOPOLOGY_COORDS.teacher) ||
                          isSamePoint(pt, TOPOLOGY_COORDS.student) ||
                          isSamePoint(pt, TOPOLOGY_COORDS.opendns) ||
                          isSamePoint(pt, OPENDNS_LOGICAL_ENTRY)
                      )
                      .map((pt, idx) => (
                        <motion.circle
                          key={`pulse-${pkt.id}-${idx}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={11}
                          fill="none"
                          stroke={sig.line}
                          strokeWidth="1.9"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: [0.5, 2.3], opacity: [0.75, 0] }}
                          transition={{
                            duration: 0.9,
                            delay: dly + dur * 0.85,
                            repeat: isLoop ? Infinity : 0,
                            repeatDelay: isLoop ? Math.max(0.4, dur + repDelay - 0.9) : 0,
                            ease: 'easeOut'
                          }}
                        />
                      ))}

                  <motion.g
                    initial={{ x: kf.x[0], y: kf.y[0], opacity: 0, scale: 0.84 }}
                    animate={{
                      x: kf.x,
                      y: kf.y,
                      opacity: kf.opacity,
                      scale: kf.scale
                    }}
                    transition={{
                      duration: dur,
                      times: kf.times,
                      delay: dly,
                      repeat: isLoop ? Infinity : 0,
                      repeatDelay: isLoop ? repDelay : 0,
                      ease: 'linear'
                    }}
                    filter="url(#apple-pill-shadow)"
                  >
                    <rect
                      x={-pillW / 2}
                      y="-14"
                      width={pillW}
                      height="28"
                      rx="9.5"
                      fill={isDark ? sig.bg : sig.lightBg}
                      stroke={sig.border}
                      strokeWidth="1.4"
                    />
                    {/* Tira lateral indicando cabecera L4 adjunta */}
                    <rect
                      x={-pillW / 2 + 4}
                      y="-9.5"
                      width="3"
                      height="19"
                      rx="1.5"
                      fill={sig.border}
                    />
                    {/* Icono vectorial de paquete / archivo / portal web */}
                    <g transform={`translate(${-pillW / 2 + 17.5}, 0)`}>
                      {renderPacketKindIcon(pkt.kind, iconStroke)}
                    </g>
                    <text
                      x="5"
                      y="3.5"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill={iconStroke}
                      className="font-mono"
                    >
                      {pkt.label}
                    </text>
                    <text
                      x={pillW / 2 - 10}
                      y="3.5"
                      textAnchor="middle"
                      fontSize="10.5"
                      fontWeight="800"
                      fill={sig.border}
                    >
                      {dirChevron}
                    </text>
                  </motion.g>

                  {pkt.dropMarker && kf.x.length > 0 && (
                    <g transform={`translate(${dropX}, ${dropY})`}>
                      <motion.g
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: [0.7, 1.35, 1.0], opacity: [0.25, 1, 0.85] }}
                        transition={{
                          duration: 0.9,
                          delay: dly + dur * 0.88,
                          repeat: isLoop ? Infinity : 0,
                          repeatDelay: isLoop ? Math.max(0.3, dur + repDelay - 0.9) : 0
                        }}
                      >
                        <circle
                          r="15"
                          fill="#FF453A"
                          fillOpacity="0.24"
                          stroke="#FF453A"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M -5 -5 L 5 5 M 5 -5 L -5 5"
                          stroke="#FF453A"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </motion.g>
                    </g>
                  )}
                </g>
              );
            })}
          </motion.g>
        </AnimatePresence>
      </svg>

      {/* CINTA INFERIOR INTEGRADA */}
      {trafficSummary && (
        <div
          className={`px-3.5 py-2.5 border-t space-y-1 text-[11.5px] ${
            isDark
              ? 'bg-white/[0.025] border-white/[0.08] text-[#E5E5EA]'
              : 'bg-white/85 border-black/[0.06] text-[#1D1D1F]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span
                className="px-2 py-0.5 rounded-md font-mono text-[10.5px] font-bold"
                style={{
                  backgroundColor:
                    trafficSummary.protocol === 'UDP'
                      ? isDark
                        ? 'rgba(56,189,248,0.16)'
                        : 'rgba(2,132,199,0.12)'
                      : isDark
                      ? 'rgba(10,132,255,0.20)'
                      : 'rgba(0,113,227,0.12)',
                  color: trafficSummary.protocol === 'UDP' ? udpAccent : activeAccent
                }}
              >
                {trafficSummary.protocol}
              </span>
              <span className="font-semibold tracking-[-0.01em]">Qué se envía:</span>
              <span className={isDark ? 'text-[#D1D1D6]' : 'text-[#3A3A3C]'}>
                {trafficSummary.what}
              </span>
            </div>
            <span
              className="font-mono text-[11px] font-semibold"
              style={{
                color: trafficSummary.tone === 'error' ? '#FF453A' : ackAccent
              }}
            >
              {trafficSummary.route}
            </span>
          </div>

          {trafficSummary.why && (
            <div className={`text-[11px] ${isDark ? 'text-[#A1A1A6]' : 'text-[#6E6E73]'}`}>
              <span className={`font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#1D1D1F]'}`}>
                Por qué {trafficSummary.protocol} aquí:
              </span>{' '}
              {trafficSummary.why}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
