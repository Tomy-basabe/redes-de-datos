export interface Student {
  nombre: string;
  legajo: string;
  rol: string;
}

export const INTEGRANTES: Student[] = [
  { nombre: 'Tomás Basabe', legajo: '51910', rol: 'Topología L3/WAN y Balanceo Multi-ISP' },
  { nombre: 'Facundo Blanes', legajo: '51916', rol: 'Anatomía RFC de Encabezados TCP/UDP' },
  { nombre: 'Ignacio Generoso', legajo: '51990', rol: 'Puertos L4 y Arquitectura Proxy Inverso' },
  { nombre: 'Renzo Gutierrez', legajo: '52004', rol: '3-Way Handshake y Confiabilidad Samba' },
  { nombre: 'Andrés Moreno', legajo: '52055', rol: 'Control de Flujo vs. Congestión & PCC' },
  { nombre: 'Agustina Vega Maiquez', legajo: '52150', rol: 'Seguridad VLAN, ACLs y DHCP Relay' },
];

export const DOCENTES = [
  { nombre: 'Esp. Prof. Raúl Tonelli', cargo: 'Docente a cargo de Cátedra' },
  { nombre: 'Prof. Roberto Cutuli', cargo: 'Docente a cargo de Trabajos Prácticos' }
];

export const INSTITUCIONAL = {
  universidad: 'Universidad Tecnológica Nacional',
  facultad: 'Facultad Regional Mendoza',
  carrera: 'Ingeniería en Sistemas de Información',
  materia: 'Redes de Datos',
  escuela: '4-025 Escuela Los Corralitos',
  fechaEntrega: '13 de Noviembre',
  modalidad: 'Presentación Grupal en Plataforma'
};

export interface ServiceNode {
  id: string;
  nombre: string;
  ip: string;
  vlan: string;
  puertos: string;
  protocolo: 'TCP' | 'UDP' | 'AMBOS';
  rol: string;
  descripcion: string;
  color: 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | 'blue';
}

export const SERVICIOS_ESCUELA: ServiceNode[] = [
  {
    id: 'nginx',
    nombre: 'Nginx (Reverse Proxy)',
    ip: '172.16.10.12',
    vlan: 'VLAN 10 (Servidores)',
    puertos: 'TCP 80 (HTTP) / TCP 443 (HTTPS)',
    protocolo: 'TCP',
    rol: 'Front-End y Terminación TLS',
    descripcion: 'Recibe las peticiones web de las VLANs de usuarios y gestiona la sesión segura HTTPS con el cliente.',
    color: 'emerald'
  },
  {
    id: 'apache',
    nombre: 'Apache (Web Backend)',
    ip: '172.16.10.11',
    vlan: 'VLAN 10 (Servidores)',
    puertos: 'TCP 8080 (Interno)',
    protocolo: 'TCP',
    rol: 'Servidor de Aplicaciones Interno',
    descripcion: 'Acepta conexiones internas únicamente desde Nginx. Aislado de los estudiantes mediante ACL en el switch L3.',
    color: 'violet'
  },
  {
    id: 'samba',
    nombre: 'Samba (File Server)',
    ip: '172.16.10.13',
    vlan: 'VLAN 10 (Servidores)',
    puertos: 'TCP 445 (SMB) [TCP 139 / UDP 137-138]',
    protocolo: 'TCP',
    rol: 'Almacenamiento de Archivos Compartidos',
    descripcion: 'Acceso confiable a carpetas compartidas. Utiliza TCP para garantizar que ningún bloque de archivo se corrompa.',
    color: 'amber'
  },
  {
    id: 'dhcp',
    nombre: 'Windows Server DHCP',
    ip: '172.16.10.14',
    vlan: 'VLAN 10 (Servidores)',
    puertos: 'UDP 67 (Servidor) / UDP 68 (Cliente)',
    protocolo: 'UDP',
    rol: 'Asignación Dinámica de Direcciones IP',
    descripcion: 'Responde a los pedidos de configuración de red mediante DHCP Relay configurado en el Cisco Catalyst C9200.',
    color: 'blue'
  },
  {
    id: 'dns',
    nombre: 'Cisco OpenDNS',
    ip: '208.67.222.222 / 208.67.220.220',
    vlan: 'Servicio Externo (WAN)',
    puertos: 'UDP 53 (Consultas estándar) / TCP 53 (>512B)',
    protocolo: 'UDP',
    rol: 'Resolución de Nombres y Filtrado de Contenidos',
    descripcion: 'Servicio externo de resolución y seguridad perimetral para proteger la navegación de la escuela.',
    color: 'cyan'
  }
];

export const EQUIPAMIENTO_CORE = [
  {
    id: 'c9200',
    nombre: 'Cisco Catalyst C9200',
    rol: 'Núcleo de Capa 3 y Enrutamiento Inter-VLAN',
    l4Impact: 'Inspecciona puertos L4 mediante ACLs y retransmite broadcasts UDP 67/68 hacia 172.16.10.14 vía ip helper-address.',
    color: 'cyan'
  },
  {
    id: 'meraki',
    nombre: 'Cisco Meraki MX100',
    rol: 'Firewall Perimetral UTM',
    l4Impact: 'Aplica inspección de estado de paquetes (Stateful Firewall) y filtra puertos TCP/UDP de salida hacia Internet.',
    color: 'rose'
  },
  {
    id: 'mikrotik',
    nombre: 'MikroTik hEX RB750Gr3',
    rol: 'Router Multi-WAN & Balanceo PCC',
    l4Impact: 'Balancea flujos independientes entre WestNet, Starlink y Tachicom basándose en la tupla IP/Puerto L4 (PCC).',
    color: 'amber'
  }
];

export const PREGUNTAS_DEFENSA = [
  {
    pregunta: '¿Por qué un estudiante no puede ni debe conectarse directo a Apache en el puerto 8080?',
    respuesta: 'Porque Nginx actúa como Proxy Inverso. En la capa de transporte existen dos conexiones TCP independientes: la primera entre el estudiante y Nginx (puerto 443 HTTPS), y una segunda conexión interna iniciada por Nginx hacia Apache (puerto 8080). El switch L3 Cisco Catalyst C9200 aplica una ACL que rechaza cualquier paquete de la VLAN 20 con destino TCP 8080.',
    pilar: 'Arquitectura Proxy Inverso & ACL L4'
  },
  {
    pregunta: 'Si el router MikroTik balancea 3 proveedores con PCC, ¿una descarga TCP puede usar los 3 anchos de banda a la vez?',
    respuesta: 'No. El balanceo PCC (Per Connection Classifier) asigna cada socket TCP completo a un único enlace WAN para mantener la integridad de los números de secuencia y la IP pública. Una sola conexión TCP usa un solo proveedor. Los 3 enlaces se aprovechan en concurrencia cuando múltiples usuarios abren diferentes conexiones.',
    pilar: 'Transporte vs. Balanceo Multi-WAN'
  },
  {
    pregunta: '¿Cuál es la diferencia crítica entre Control de Flujo y Control de Congestión?',
    respuesta: 'El Control de Flujo protege al RECEPTOR para no saturar su buffer interno, empleando la ventana de recepción (rwnd) anunciada en el encabezado TCP. El Control de Congestión protege a la RED intermedia (enlaces y switches), usando la ventana de congestión (cwnd) y algoritmos como Slow Start, Congestion Avoidance y Fast Retransmit.',
    pilar: 'Mecanismos de Protección TCP'
  },
  {
    pregunta: '¿Por qué es obligatorio configurar "ip helper-address 172.16.10.14" en el Cisco Catalyst C9200?',
    respuesta: 'El servidor DHCP está en VLAN 10, pero los estudiantes y docentes están en VLAN 20, 30 y 50. Los clientes envían solicitudes DHCP Discover mediante broadcast L2/L3 (UDP 67/68), que los routers no reenvían por defecto. El ip helper-address en la SVI del C9200 intercepta el broadcast y lo reenvía como unicast L3 hacia el servidor 172.16.10.14.',
    pilar: 'Enrutamiento Inter-VLAN & DHCP L4'
  }
];
