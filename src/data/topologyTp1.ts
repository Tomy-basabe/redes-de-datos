/**
 * DATOS TÉCNICOS OFICIALES DEL TP1 (DISEÑO DE RED LAN) E INFORME DE CAPA DE TRANSPORTE
 * Escuela 4-025 Los Corralitos - UTN Facultad Regional Mendoza - Cátedra Redes de Datos
 * Docentes: Esp. Prof. Raúl Tonelli / Prof. Roberto Cutuli
 */

export interface VlanConfig {
  id: number;
  nombre: string;
  subred: string;
  mascara: string;
  cidr: string;
  gateway: string;
  rangoHost: string;
  descripcion: string;
  hostEjemploLogico: string;
}

export const VLANS_TP1: VlanConfig[] = [
  {
    id: 10,
    nombre: 'Gestión, Servidores e Infraestructura',
    subred: '172.16.10.0',
    mascara: '255.255.255.192',
    cidr: '/26',
    gateway: '172.16.10.1 (SVI en Cisco Catalyst C9200)',
    rangoHost: '172.16.10.2 - 172.16.10.62',
    descripcion: 'Aloja los servidores centrales virtuales, equipamiento de red e interfaces de administración.',
    hostEjemploLogico: '172.16.10.12 (Servidor Nginx Front-End)'
  },
  {
    id: 20,
    nombre: 'Estudiantes / Alumnos',
    subred: '172.16.20.0',
    mascara: '255.255.252.0',
    cidr: '/22',
    gateway: '172.16.20.1 (SVI en Cisco Catalyst C9200)',
    rangoHost: '172.16.20.2 - 172.16.23.254',
    descripcion: 'Subred para dispositivos estudiantiles con asignación dinámica DHCP y aislamiento L4.',
    hostEjemploLogico: '172.16.20.10 (Host lógico de demostración en VLAN 20)'
  },
  {
    id: 30,
    nombre: 'Maestros / Docentes',
    subred: '172.16.30.0',
    mascara: '255.255.255.0',
    cidr: '/24',
    gateway: '172.16.30.1 (SVI en Cisco Catalyst C9200)',
    rangoHost: '172.16.30.2 - 172.16.30.254',
    descripcion: 'Subred para equipos pedagógicos y docentes con acceso a recursos compartidos Samba.',
    hostEjemploLogico: '172.16.30.15 (Host lógico de demostración en VLAN 30)'
  },
  {
    id: 50,
    nombre: 'Administración y Secretaría',
    subred: '172.16.50.0',
    mascara: '255.255.255.128',
    cidr: '/25',
    gateway: '172.16.50.1 (SVI en Cisco Catalyst C9200)',
    rangoHost: '172.16.50.2 - 172.16.50.126',
    descripcion: 'Equipos administrativos, sistemas de gestión escolar y contabilidad de la institución.',
    hostEjemploLogico: '172.16.50.8 (Host lógico de demostración en VLAN 50)'
  }
];

export interface ServerService {
  id: string;
  nombre: string;
  ip: string;
  vlan: string;
  puertoTransporte: string;
  puerto?: string | number;
  protocolo: 'TCP' | 'UDP';
  estadoImplementacion: 'Propuesta de Mejora (To-Be)' | 'Servicio Relevado (As-Is)' | 'Servicio Externo WAN';
  rol: string;
  descripcion?: string;
  justificacionL4: string;
  justificacion?: string;
}

export const SERVICIOS_TRANSPORTE: ServerService[] = [
  {
    id: 'nginx',
    nombre: 'Nginx (Reverse Proxy & Front-End)',
    ip: '172.16.10.12',
    vlan: 'VLAN 10',
    puertoTransporte: 'TCP 80 (HTTP) y TCP 443 (HTTPS)',
    puerto: '443 / 80',
    protocolo: 'TCP',
    estadoImplementacion: 'Propuesta de Mejora (To-Be)',
    rol: 'Terminación TLS y Proxy Inverso perimetral frente a las VLANs de usuarios.',
    descripcion: 'Proxy inverso y terminación TLS para proteger los servidores web internos de la institución.',
    justificacionL4: 'TCP garantiza que las páginas web y certificados TLS se descarguen completos y ordenados.',
    justificacion: 'TCP garantiza que las páginas web y certificados TLS se descarguen completos y ordenados.'
  },
  {
    id: 'apache',
    nombre: 'Apache (Web Backend Interno)',
    ip: '172.16.10.11',
    vlan: 'VLAN 10',
    puertoTransporte: 'TCP 8080 (Interno Propuesto)',
    puerto: '8080',
    protocolo: 'TCP',
    estadoImplementacion: 'Propuesta de Mejora (To-Be)',
    rol: 'Servidor interno de aplicaciones. Acepta tráfico EXCLUSIVAMENTE desde Nginx.',
    descripcion: 'Servidor de aplicaciones escolares accesible exclusivamente desde el socket de Nginx.',
    justificacionL4: 'El puerto 8080 es una propuesta interna aislada de los alumnos mediante ACL en el switch L3.',
    justificacion: 'El puerto 8080 es una propuesta interna aislada de los alumnos mediante ACL en el switch L3.'
  },
  {
    id: 'samba',
    nombre: 'Samba (File Server SMB)',
    ip: '172.16.10.13',
    vlan: 'VLAN 10',
    puertoTransporte: 'TCP 445 (SMB Directo) [TCP 139 / UDP 137-138 NetBIOS opcional]',
    puerto: '445',
    protocolo: 'TCP',
    estadoImplementacion: 'Servicio Relevado (As-Is)',
    rol: 'Servidor de archivos compartidos para docentes y personal administrativo.',
    descripcion: 'Almacenamiento de archivos pedagógicos, planificaciones docentes y registros de secretaría.',
    justificacionL4: 'TCP es obligatorio: la pérdida de un solo segmento en un archivo causaría corrupción de datos.',
    justificacion: 'TCP es obligatorio: la pérdida de un solo segmento en un archivo causaría corrupción de datos.'
  },
  {
    id: 'dhcp',
    nombre: 'Windows Server DHCP',
    ip: '172.16.10.14',
    vlan: 'VLAN 10',
    puertoTransporte: 'UDP 67 (Servidor) / UDP 68 (Cliente)',
    puerto: '67 / 68',
    protocolo: 'UDP',
    estadoImplementacion: 'Servicio Relevado (As-Is)',
    rol: 'Servicio de asignación dinámica de parámetros IP para las 4 VLANs.',
    descripcion: 'Distribución de leases IP a través del Cisco C9200 con DHCP Relay configurado.',
    justificacionL4: 'UDP sin conexión: los clientes aún no tienen IP configurada para abrir una conexión TCP.',
    justificacion: 'UDP sin conexión: los clientes aún no tienen IP configurada para abrir una conexión TCP.'
  },
  {
    id: 'opendns',
    nombre: 'Cisco OpenDNS',
    ip: '208.67.222.222 / 208.67.220.220',
    vlan: 'Servicio Externo (WAN)',
    puertoTransporte: 'UDP 53 (Consultas estándar) / TCP 53 (Respuestas > 512B)',
    puerto: '53',
    protocolo: 'UDP',
    estadoImplementacion: 'Servicio Externo WAN',
    rol: 'Resolución de nombres de dominio y filtrado de contenido educativo.',
    descripcion: 'Filtrado de categorías no pedagógicas coordinado con las políticas de Cisco Meraki MX100.',
    justificacionL4: 'UDP para consultas puntuales de baja latencia; TCP cuando el paquete excede los 512 bytes.',
    justificacion: 'UDP para consultas puntuales de baja latencia; TCP cuando el paquete excede los 512 bytes.'
  }
];

export const EQUIPAMIENTO_TP1 = [
  {
    id: 'c9200',
    nombre: 'Cisco Catalyst C9200-24P',
    funcionTP1: 'Switch Core Capa 3 y Enrutamiento Inter-VLAN',
    rolTransporte: 'No interviene como extremo TCP/UDP. Inspecciona puertos L4 mediante ACLs y actúa como Agente DHCP Relay (ip helper-address 172.16.10.14) convirtiendo broadcasts UDP 67/68 en unicast.',
    ubicacion: 'Gabinete MDF - Piso Tecnológico'
  },
  {
    id: 'meraki',
    nombre: 'Cisco Meraki MX100',
    funcionTP1: 'Firewall Perimetral UTM y Seguridad de Borde',
    rolTransporte: 'Inspección de estado L4 (Stateful Packet Inspection), filtrado de puertos de salida y protección perimetral.',
    ubicacion: 'Gabinete MDF - Piso Tecnológico'
  },
  {
    id: 'mikrotik',
    nombre: 'MikroTik hEX RB750Gr3',
    funcionTP1: 'Router Balanceador Multi-WAN y Failover',
    rolTransporte: 'Clasifica flujos L4 mediante PCC (Per Connection Classifier) asignando cada tupla a uno de los 3 proveedores de Internet. No ejecuta control de congestión TCP ni suma anchos de banda por socket.',
    ubicacion: 'Gabinete MDF - Borde WAN'
  }
];

export const ISPS_TP1 = [
  { id: 'wan1', nombre: 'WestNet (Nación / Terrestre)', anchoBanda: '100 Mbps', tipo: 'Fibra Terrestre', hashPcc: 'both-addresses-and-ports:3/0' },
  { id: 'wan2', nombre: 'Starlink', anchoBanda: '150 Mbps', tipo: 'Satelital LEO', hashPcc: 'both-addresses-and-ports:3/1' },
  { id: 'wan3', nombre: 'Tachicom', anchoBanda: '80 Mbps', tipo: 'Inalámbrico Punto a Punto', hashPcc: 'both-addresses-and-ports:3/2' }
];

export const INTEGRANTES_GRUPO = [
  { nombre: 'Tomás Basabe', legajo: '51910', rolExposicion: 'Infraestructura TP1, Topología y Balanceo PCC' },
  { nombre: 'Facundo Blanes', legajo: '51916', rolExposicion: 'TCP vs UDP, Segmentación y Encabezados RFC' },
  { nombre: 'Ignacio Generoso', legajo: '51990', rolExposicion: 'Puertos, Multiplexación y Proxy Inverso Nginx' },
  { nombre: 'Renzo Gutierrez', legajo: '52004', rolExposicion: 'Ventana de Recepción (rwnd), Handshake y Samba' },
  { nombre: 'Andrés Moreno', legajo: '52055', rolExposicion: 'Ventana de Congestión (cwnd) y Fenómeno de Sierra' },
  { nombre: 'Agustina Vega Maiquez', legajo: '52150', rolExposicion: 'Seguridad L4, ACLs en C9200 y DHCP Relay' }
];
