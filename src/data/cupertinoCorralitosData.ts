/**
 * FUENTE DE VERDAD CANÓNICA — ESCUELA 4-025 LOS CORRALITOS (UTN FRM)
 * Exposición 2:30 min: "TCP vs. UDP en la Capa de Transporte"
 */

export interface HeaderFieldSpec {
  id: string;
  label: string;
  bits: number;
  spanCols: number; // Sobre grilla de 32 bits (16 bits = 2 cols de 4, 32 bits = 4 cols)
  shortValue: string;
  roleInSchool: string;
  accent: 'udp' | 'tcp' | 'ack' | 'warn';
}

export const UDP_HEADER_FIELDS: HeaderFieldSpec[] = [
  {
    id: 'udp-src-port',
    label: 'Puerto Origen (16b)',
    bits: 16,
    spanCols: 2,
    shortValue: '68 / Efímero',
    roleInSchool:
      'Identifica el proceso cliente: puerto 68 en PC Estudiante 01 (172.16.20.10) para DHCP o un puerto efímero (ej. 54210) al consultar Cisco OpenDNS.',
    accent: 'udp'
  },
  {
    id: 'udp-dst-port',
    label: 'Puerto Destino (16b)',
    bits: 16,
    spanCols: 2,
    shortValue: '67 (DHCP) / 53 (DNS)',
    roleInSchool:
      'Demultiplexa el datagrama al servicio destino sin estado: 67 en Windows Server DHCP (172.16.10.14) o 53 en Cisco OpenDNS.',
    accent: 'udp'
  },
  {
    id: 'udp-length',
    label: 'Longitud Total (16b)',
    bits: 16,
    spanCols: 2,
    shortValue: '8B + Payload',
    roleInSchool:
      'Tamaño total del datagrama UDP en bytes (mínimo 8 bytes de cabecera + carga útil de consulta DNS o trama DHCP Discover/Request).',
    accent: 'udp'
  },
  {
    id: 'udp-checksum',
    label: 'Checksum Comp. a 1 (16b)',
    bits: 16,
    spanCols: 2,
    shortValue: 'Verificación 16 bits',
    roleInSchool:
      'Suma de comprobación en complemento a uno sobre palabras de 16 bits para detectar errores de bit en el cableado UTP/fibra escolar.',
    accent: 'ack'
  }
];

export const TCP_HEADER_FIELDS: HeaderFieldSpec[] = [
  {
    id: 'tcp-src-port',
    label: 'Puerto Origen (16b)',
    bits: 16,
    spanCols: 2,
    shortValue: '51514 / 53000',
    roleInSchool:
      'Puerto efímero único del proceso cliente (ej. 51514 en PC Estudiante 01 hacia Nginx, o 53000 desde Nginx hacia Apache).',
    accent: 'tcp'
  },
  {
    id: 'tcp-dst-port',
    label: 'Puerto Destino (16b)',
    bits: 16,
    spanCols: 2,
    shortValue: '443 / 8080 / 445',
    roleInSchool:
      'Puerto bien conocido del servidor: 443 (Nginx HTTPS), 8080 (Apache interno protegido por ACL) o 445 (Samba SMB).',
    accent: 'tcp'
  },
  {
    id: 'tcp-seq',
    label: 'Número de Secuencia (32b)',
    bits: 32,
    spanCols: 4,
    shortValue: 'Cuenta Bytes (ej. 1000)',
    roleInSchool:
      'Numera el primer byte de datos del segmento (NO cuenta paquetes). Permite a Samba reconstruir apuntes escolares sin huecos ni desorden.',
    accent: 'tcp'
  },
  {
    id: 'tcp-ack',
    label: 'Número de Reconocimiento / ACK (32b)',
    bits: 32,
    spanCols: 4,
    shortValue: 'ACK Acumulativo',
    roleInSchool:
      'Indica el próximo byte esperado en orden. Tres ACKs duplicados (ej. 3× ACK=1000) disparan Retransmisión Rápida antes del timeout.',
    accent: 'ack'
  },
  {
    id: 'tcp-flags',
    label: 'Long. Cabecera (4b) + No usado (6b) + Flags (URG, ACK, PSH, RST, SYN, FIN)',
    bits: 16,
    spanCols: 2,
    shortValue: 'SYN / ACK / FIN / RST',
    roleInSchool:
      'Controla el ciclo de vida: SYN negocia el Three-Way Handshake con Nginx, ACK confirma recepción y RST/FIN cierran o rechazan vía ACL.',
    accent: 'warn'
  },
  {
    id: 'tcp-rwnd',
    label: 'Ventana de Recepción (16b)',
    bits: 16,
    spanCols: 2,
    shortValue: 'Control de Flujo (rwnd)',
    roleInSchool:
      'El receptor anuncia el espacio libre de su BufferRecepcion para evitar que el servidor Samba (172.16.10.13) sature al equipo docente o estudiante.',
    accent: 'tcp'
  },
  {
    id: 'tcp-checksum',
    label: 'Checksum (16b)',
    bits: 16,
    spanCols: 2,
    shortValue: 'Obligatorio 16b',
    roleInSchool:
      'Verifica la integridad de pseudocabecera IP, cabecera TCP y carga útil en cada salto hacia Proxmox (172.16.10.10) o Internet.',
    accent: 'ack'
  },
  {
    id: 'tcp-urgent',
    label: 'Puntero Urgente (16b)',
    bits: 16,
    spanCols: 2,
    shortValue: '0x0000 (URG=0)',
    roleInSchool:
      'Desplazamiento respecto al Sequence Number para datos urgentes cuando el flag URG=1 está activo (en tráfico web/Samba suele ser 0).',
    accent: 'tcp'
  }
];

export const SCHOOL_DEVICES = {
  studentPc: {
    name: 'PC Estudiante 01',
    ip: '172.16.20.10',
    vlan: 'VLAN 20 - Estudiantes',
    gateway: '172.16.20.1'
  },
  teacherPc: {
    name: 'PC Docente 01',
    ip: '172.16.30.10',
    vlan: 'VLAN 30 - Maestros',
    gateway: '172.16.30.1'
  },
  adminPc: {
    name: 'PC Admin 01',
    ip: '172.16.50.11',
    vlan: 'VLAN 50 - Administración',
    gateway: '172.16.50.1'
  },
  c9200: {
    name: 'Cisco Catalyst C9200',
    role: 'Switch Core L3',
    ip: '172.16.10.1',
    detail: 'Ruteo inter-VLAN, ACLs y DHCP Relay (ip helper-address 172.16.10.14)'
  },
  meraki: {
    name: 'Cisco Meraki MX100',
    role: 'Firewall Perimetral',
    ip: '172.16.10.6',
    transitIp: '10.0.0.1'
  },
  mikrotik: {
    name: 'MikroTik hEX RB750Gr3',
    role: 'Router de Borde Multi-WAN',
    ip: '172.16.10.5',
    transitIp: '10.0.0.5',
    isps: [
      { id: 'starlink', name: 'Starlink', speed: '200 Mbps', weight: 20, rttMs: 42 },
      { id: 'westnet', name: 'WestNet', speed: '300 Mbps', weight: 30, rttMs: 18 },
      { id: 'tachicom', name: 'Tachicom', speed: '500 Mbps', weight: 50, rttMs: 11 }
    ]
  },
  proxmoxHost: {
    name: 'Host Proxmox VLAN 10',
    ip: '172.16.10.10',
    vlan: 'VLAN 10 - Gestión'
  },
  servers: {
    dhcp: {
      name: 'Windows Server DHCP',
      ip: '172.16.10.14',
      ports: 'UDP 67 (srv) / UDP 68 (clt)'
    },
    nginx: {
      name: 'Proxy Inverso Nginx',
      ip: '172.16.10.12',
      ports: 'TCP 80 (HTTP) / TCP 443 (HTTPS)'
    },
    apache: {
      name: 'Backend Apache HTTP',
      ip: '172.16.10.11',
      ports: 'TCP 8080 (ACL: solo Nginx)'
    },
    samba: {
      name: 'Servidor Samba',
      ip: '172.16.10.13',
      ports: 'TCP 445 (SMB) [opt: TCP 139, UDP 137/138]'
    },
    opendns: {
      name: 'Cisco OpenDNS / Umbrella',
      ip: '208.67.222.222',
      ports: 'UDP 53 (rápido) / TCP 53 (>512B)'
    }
  }
} as const;

export type TransportFlowId = 'dhcp' | 'opendns' | 'samba' | 'nginx' | 'pcc';

export interface FlowOralCue {
  flowId: TransportFlowId;
  stepLabel: string;
  protocol: 'UDP' | 'TCP';
  timeRange: string;
  line1: string;
  line2: string;
}

export const FLOW_ORAL_CUES: Record<TransportFlowId, FlowOralCue> = {
  dhcp: {
    flowId: 'dhcp',
    stepLabel: '1/5 • UDP: Windows Server DHCP',
    protocol: 'UDP',
    timeRange: '0:25 – 0:50',
    line1:
      '«Elegimos UDP por práctico y rápido: no saluda antes (0 ms), no gasta RAM guardando sesiones, su cabecera pesa solo 8 bytes y manda el pedido al toque.»',
    line2:
      '«Cuando prendés una PC de VLAN 20, 30 o 50 pide IP por UDP 68; el switch Cisco C9200 hace de mensajero (Relay) y mete todas al mismo socket en DHCP (.10.14:67).»'
  },
  opendns: {
    flowId: 'opendns',
    stepLabel: '2/5 • UDP: Cisco OpenDNS / Umbrella',
    protocol: 'UDP',
    timeRange: '0:50 – 1:10',
    line1:
      '«Para traducir dominios web en Cisco OpenDNS (208.67.222.222, UDP 53), usamos UDP para no perder tiempo con el saludo de 3 pasos de TCP.»',
    line2:
      '«Así preguntamos la IP y filtramos sitios peligrosos en un solo viaje; solo si la respuesta supera los 512 bytes cambia a TCP 53.»'
  },
  samba: {
    flowId: 'samba',
    stepLabel: '3/5 • TCP: Servidor Samba SMB',
    protocol: 'TCP',
    timeRange: '1:10 – 1:40',
    line1:
      '«En archivos compartidos no podemos perder ni un byte: en Samba (172.16.10.13, TCP 445) TCP numera cada pedazo (Seq) y confirma con ACK.»',
    line2:
      '«Regula el ritmo con Control de Flujo y Congestión; si se pierde un tramo, lo detecta por reloj o 3 ACK repetidos y lo vuelve a mandar al instante.»'
  },
  nginx: {
    flowId: 'nginx',
    stepLabel: '4/5 • TCP: Proxy Inverso Nginx → Portal Docente Apache',
    protocol: 'TCP',
    timeRange: '1:40 – 2:10',
    line1:
      '«El Portal de Profesores vive en Apache (:8080) protegido detrás del Proxy Inverso Nginx (:443): si un Alumno (VLAN 20) intenta entrar, Nginx lo rechaza en la puerta (403) y si va directo al :8080 lo frena la ACL del C9200.»',
    line2:
      '«Cuando entra un Docente (VLAN 30), ocurren 2 sesiones TCP: primero Docente ↔ Nginx (:443), y luego Nginx abre otra conexión interna hacia Apache (:8080) para traerle su portal completo.»'
  },
  pcc: {
    flowId: 'pcc',
    stepLabel: '5/5 • Cierre TCP: Multi-WAN MikroTik PCC',
    protocol: 'TCP',
    timeRange: '2:10 – 2:30',
    line1:
      '«Para salir por Starlink, WestNet y Tachicom en el MikroTik, configuramos balanceo PCC por conexión y nunca por paquete.»',
    line2:
      '«Si mandáramos paquetes sueltos por distintos proveedores llegarían desordenados, dispararían 3 ACK duplicados falsos y TCP derrumbaría la velocidad.»'
  }
};

export interface TeleprompterCue {
  blockId: 1 | 2 | 3;
  timeRange: string;
  line1: string;
  line2: string;
}

export const TELEPROMPTER_CUES: Record<1 | 2 | 3, TeleprompterCue> = {
  1: {
    blockId: 1,
    timeRange: '0:00 – 0:35',
    line1:
      '«TCP y UDP mueven datos entre aplicaciones: TCP prioriza fiabilidad y orden; UDP prioriza velocidad y baja latencia.»',
    line2:
      '«Señalá abajo la diferencia de tamaño (UDP 8 B vs. TCP 20 B) y arriba los flujos reales de la escuela en Vista Física vs. Vista Lógica.»'
  },
  2: {
    blockId: 2,
    timeRange: '0:35 – 1:20',
    line1: FLOW_ORAL_CUES.dhcp.line1,
    line2: FLOW_ORAL_CUES.opendns.line2
  },
  3: {
    blockId: 3,
    timeRange: '1:20 – 2:30',
    line1: FLOW_ORAL_CUES.samba.line1,
    line2: FLOW_ORAL_CUES.pcc.line2
  }
};
