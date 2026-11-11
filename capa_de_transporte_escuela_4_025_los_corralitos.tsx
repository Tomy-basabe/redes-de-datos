import React, { useState, useEffect, useCallback } from 'react';
import {
  Network,
  Shield,
  Server,
  Cpu,
  Globe,
  Lock,
  Unlock,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Terminal,
  Activity,
  Wifi,
  HardDrive,
  Users,
  BookOpen,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  Eye,
  FileText,
  Zap,
  Sliders,
  Radio,
  Share2,
  Split,
  HelpCircle,
  Sparkles,
  Monitor,
  Database,
  Router
} from 'lucide-react';

// ============================================================================
// DATOS ACADÉMICOS Y CONSTANTES DEL INFORME (ESCUELA 4-025 LOS CORRALITOS)
// ============================================================================

const INTEGRANTES = [
  { nombre: 'Tomás Basabe', legajo: '51910', rol: 'Arquitectura y Topología L3/WAN' },
  { nombre: 'Facundo Blanes', legajo: '51916', rol: 'Protocolos TCP/UDP y Encabezados' },
  { nombre: 'Ignacio Generoso', legajo: '51990', rol: 'Servicios, Puertos y Proxy Inverso' },
  { nombre: 'Renzo Gutierrez', legajo: '52004', rol: 'Handshake, Confiabilidad y Flujo' },
  { nombre: 'Andrés Moreno', legajo: '52055', rol: 'Control de Congestión y Balanceo PCC' },
  { nombre: 'Agustina Vega Maiquez', legajo: '52150', rol: 'Seguridad VLAN, ACLs y DHCP Relay' },
];

const SCENES = [
  {
    id: 0,
    short: 'Portada',
    title: 'Identidad Académica e Introducción',
    sections: 'Portada y Sección 1',
    color: 'cyan',
    speakerNotes:
      'Bienvenidos profesores Raúl Tonelli y Roberto Cutuli. En esta presentación expondremos cómo opera la Capa de Transporte del modelo TCP/IP aplicada directamente a la infraestructura relevada y propuesta para la Escuela 4-025 Los Corralitos, mostrando su impacto real en los servicios, el enrutamiento inter-VLAN y la seguridad.'
  },
  {
    id: 1,
    short: '1. Infraestructura',
    title: 'Infraestructura y Función de la Capa de Transporte',
    sections: 'Secciones 1 y 2',
    color: 'cyan',
    speakerNotes:
      'Aquí destacamos que los protocolos de transporte (TCP y UDP) se implementan en los equipos terminales (clientes y servidores de la VLAN 10). El router MikroTik y el switch C9200 encaminan paquetes, pero no ejecutan la comunicación extremo a extremo de las aplicaciones, aunque el Meraki MX100 y el C9200 inspeccionan puertos para aplicar políticas.'
  },
  {
    id: 2,
    short: '2. TCP vs UDP & RFC',
    title: 'Elección TCP/UDP y Anatomía de Encabezados',
    sections: 'Secciones 3 y 6',
    color: 'violet',
    speakerNotes:
      'Comparamos el encabezado TCP (mínimo 20 bytes, orientado a conexión y confiable para Nginx, Apache y Samba) frente a UDP (fijo de 8 bytes, sin conexión ni sobrecarga para DHCP y consultas a Cisco OpenDNS). Es clave remarcar que las direcciones IP NO están en este encabezado, sino en la Capa de Red.'
  },
  {
    id: 3,
    short: '3. Puertos y Proxy',
    title: 'Planificación de Puertos y Doble Salto Proxy Inverso',
    sections: 'Sección 4',
    color: 'emerald',
    speakerNotes:
      'Explicamos cómo Nginx (172.16.10.12) escucha en TCP 80/443 frente a las VLANs de usuarios y abre una SEGUNDA conexión TCP independiente hacia Apache (172.16.10.11) en el puerto interno TCP 8080. También justificamos TCP 445 para Samba moderno y UDP 67/68 para Windows DHCP.'
  },
  {
    id: 4,
    short: '4. Simulador TCP/UDP',
    title: 'Handshake, Retransmisión en Samba y Multiplexación',
    sections: 'Secciones 5, 7 y 8',
    color: 'amber',
    speakerNotes:
      'Demostramos tres fenómenos en vivo: 1) El Three-Way Handshake hacia Nginx y Apache; 2) Cómo TCP recupera un segmento perdido al descargar un archivo de Samba sin corromperlo y regula el envío con la ventana de recepción; 3) Cómo una PC administrativa multiplexa DNS, Web y Samba simultáneamente usando puertos efímeros.'
  },
  {
    id: 5,
    short: '5. Congestión y PCC',
    title: 'Control de Congestión vs. Flujo y Balanceo MikroTik PCC',
    sections: 'Sección 9',
    color: 'cyan',
    speakerNotes:
      'Diferenciamos Control de Flujo (protege al receptor mediante rwnd) de Control de Congestión (protege a la red mediante cwnd, Slow Start y Congestion Avoidance). Además aclaramos un punto técnico clave: el balanceo PCC del MikroTik entre WestNet, Starlink y Tachicom distribuye flujos distintos, pero una única conexión TCP NO suma el ancho de banda de los 3 ISPs.'
  },
  {
    id: 6,
    short: '6. VLANs, ACL y DHCP',
    title: 'Seguridad Inter-VLAN, ACLs y Necesidad de DHCP Relay',
    sections: 'Sección 10',
    color: 'rose',
    speakerNotes:
      'Mostramos por qué bloqueamos mediante ACL en el Cisco Catalyst C9200 el acceso directo de Estudiantes al puerto TCP 8080 de Apache. Finalmente demostramos por qué, al estar el servidor DHCP en la VLAN 10 (172.16.10.14), los broadcasts UDP 67/68 de las VLAN 20, 30 y 50 requieren obligatoriamente configurar ip helper-address en el C9200.'
  },
  {
    id: 7,
    short: '7. Conclusión y Q&A',
    title: 'Conclusión Integradora y Defensa Oral',
    sections: 'Sección 11',
    color: 'emerald',
    speakerNotes:
      'Cerramos demostrando que la Capa de Transporte no es un elemento aislado: articula las aplicaciones de la escuela con el direccionamiento IP, las VLANs y las reglas de seguridad en el C9200 y Meraki MX100.'
  }
];

const TOPOLOGY_NODES = [
  {
    id: 'mikrotik',
    name: 'MikroTik hEX RB750Gr3',
    role: 'Router Multi-WAN (Balanceo PCC)',
    ip: 'Borde WAN (3 ISPs)',
    vlan: 'Perímetro Externo',
    layerRole: 'Encaminamiento y Clasificación de Flujos (Capa 3 / Inspector L4)',
    ports: 'Clasifica tuplas IP/Puerto para PCC (WestNet, Starlink, Tachicom)',
    color: 'amber',
    description:
      'Administra las 3 conexiones a Internet (WestNet, Starlink y Tachicom) mediante balanceo PCC (Per Connection Classifier) y failover. No reemplaza el control de congestión de TCP ni suma el ancho de banda en un único socket TCP.'
  },
  {
    id: 'meraki',
    name: 'Cisco Meraki MX100',
    role: 'Firewall Perimetral UTM',
    ip: 'Gateway Perimetral',
    vlan: 'Seguridad Borde',
    layerRole: 'Inspección de Puertos TCP/UDP y Filtrado Perimetral',
    ports: 'Permite UDP/TCP 53 (OpenDNS), HTTP/HTTPS saliente y bloquea accesos no autorizados',
    color: 'rose',
    description:
      'Aplica las políticas de seguridad perimetral inspeccionando protocolos y números de puerto TCP y UDP entre la red escolar e Internet.'
  },
  {
    id: 'c9200',
    name: 'Cisco Catalyst C9200',
    role: 'Switch Núcleo Capa 3',
    ip: 'SVIs VLAN 10, 20, 30, 50',
    vlan: 'Core Inter-VLAN',
    layerRole: 'Enrutamiento Inter-VLAN, ACLs por Puerto y DHCP Relay',
    ports: 'ACLs (Ej. bloquea TCP 8080 desde VLAN 20) + ip helper-address -> UDP 67',
    color: 'cyan',
    description:
      'Núcleo de conmutación y enrutamiento inter-VLAN. Aplica listas de control de acceso (ACL) filtrando por puerto TCP/UDP y convierte broadcasts DHCP (UDP 67/68) en unicast hacia 172.16.10.14 mediante DHCP Relay.'
  },
  {
    id: 'nginx',
    name: 'Servidor Nginx (Proxy Inverso)',
    role: 'Punto de Entrada Web Institucional',
    ip: '172.16.10.12',
    vlan: 'VLAN 10 (Gestión)',
    layerRole: 'Terminal de Transporte (Servidor frente a Usuarios / Cliente frente a Apache)',
    ports: 'Escucha en TCP 80 (HTTP) y TCP 443 (HTTPS/TLS)',
    color: 'emerald',
    description:
      'Recibe las conexiones TCP de estudiantes, docentes y administración en los puertos 80/443 y abre una segunda conexión TCP independiente hacia el servidor interno Apache en el puerto 8080.'
  },
  {
    id: 'apache',
    name: 'Servidor Web Apache (Backend)',
    role: 'Servidor de Aplicaciones Interno',
    ip: '172.16.10.11',
    vlan: 'VLAN 10 (Gestión)',
    layerRole: 'Terminal de Transporte (Servidor Backend Aislado)',
    ports: 'Escucha únicamente en TCP 8080 (Interno desde Nginx)',
    color: 'violet',
    description:
      'Aloja las aplicaciones web internas. Su puerto TCP 8080 solo acepta conexiones provenientes de Nginx (172.16.10.12) y no se expone directamente a las VLANs de usuarios.'
  },
  {
    id: 'samba',
    name: 'Servidor de Archivos Samba',
    role: 'Almacenamiento Compartido SMB',
    ip: '172.16.10.13',
    vlan: 'VLAN 10 (Gestión)',
    layerRole: 'Terminal de Transporte Confiable (Transferencia de Archivos)',
    ports: 'TCP 445 (Principal SMB); TCP 139 y UDP 137/138 (NetBIOS opcional)',
    color: 'cyan',
    description:
      'Brinda acceso a carpetas y documentos compartidos. Utiliza TCP 445 para garantizar que los archivos descargados o subidos lleguen completos, en orden y sin corrupción.'
  },
  {
    id: 'dhcp',
    name: 'Windows Server DHCP',
    role: 'Asignación Dinámica de Red',
    ip: '172.16.10.14',
    vlan: 'VLAN 10 (Gestión)',
    layerRole: 'Terminal de Transporte Sin Conexión (Mensajes Puntuales)',
    ports: 'UDP 67 (Servidor escucha) / UDP 68 (Cliente recibe)',
    color: 'amber',
    description:
      'Asigna automáticamente IP, máscara, puerta de enlace y DNS a las VLANs 20, 30 y 50 utilizando datagramas UDP rápidos sin necesidad de establecer conexión previa.'
  },
  {
    id: 'opendns',
    name: 'Cisco OpenDNS (Cloud)',
    role: 'Resolución y Filtrado DNS Externo',
    ip: 'Servicio Externo Cloud',
    vlan: 'Nube / Internet',
    layerRole: 'Servicio de Transporte DNS Externo',
    ports: 'UDP 53 (Consultas habituales) / TCP 53 (Respuestas grandes o zonas)',
    color: 'emerald',
    description:
      'Servicio externo (no es una VM local) encargado de resolver nombres de dominio y filtrar contenido inadecuado para la escuela. Opera por defecto sobre UDP 53 por su baja sobrecarga.'
  }
];

const TCP_HEADER_FIELDS = [
  {
    id: 'src_port',
    name: 'Puerto de Origen (16 bits)',
    bits: 'Bits 0 - 15 (2 Bytes)',
    span: 6,
    color: 'cyan',
    desc: 'Identifica el proceso que inicia la comunicación en el equipo cliente. Suele ser un puerto dinámico/efímero (49152–65535).',
    schoolExample: 'Cuando una PC de Estudiantes (172.16.20.10) abre el sitio de la escuela, su sistema operativo asigna por ejemplo el puerto dinámico 53000.'
  },
  {
    id: 'dst_port',
    name: 'Puerto de Destino (16 bits)',
    bits: 'Bits 16 - 31 (2 Bytes)',
    span: 6,
    color: 'emerald',
    desc: 'Identifica el servicio específico que escucha en el servidor destino.',
    schoolExample: 'Apunta a TCP 443 en Nginx (172.16.10.12), TCP 8080 en Apache (172.16.10.11) o TCP 445 en Samba (172.16.10.13).'
  },
  {
    id: 'seq_num',
    name: 'Número de Secuencia (32 bits)',
    bits: 'Bits 0 - 31 (4 Bytes)',
    span: 12,
    color: 'violet',
    desc: 'Indica la posición del primer byte de datos del segmento dentro del flujo total. Permite reensamblar en orden en el destino.',
    schoolExample: 'Fundamental al descargar un PDF o planilla desde Samba (172.16.10.13): si los paquetes llegan desordenados, el cliente los reordena con este campo.'
  },
  {
    id: 'ack_num',
    name: 'Número de Reconocimiento - ACK (32 bits)',
    bits: 'Bits 0 - 31 (4 Bytes)',
    span: 12,
    color: 'amber',
    desc: 'Indica el próximo byte esperado por el receptor. Confirma que todos los bytes anteriores llegaron correctamente.',
    schoolExample: 'Si el servidor Samba no recibe el ACK de un segmento enviado a una PC docente, su temporizador expira y retransmite el segmento perdido.'
  },
  {
    id: 'hlen',
    name: 'Longitud Encabezado (4b)',
    bits: 'Bits 0 - 3',
    span: 3,
    color: 'slate',
    desc: 'Indica cuántas palabras de 32 bits tiene el encabezado TCP (mínimo 5 palabras = 20 bytes).',
    schoolExample: 'Permite al receptor saber exactamente dónde termina el encabezado TCP y dónde comienzan los datos de la página web o archivo.'
  },
  {
    id: 'reserved',
    name: 'Reservado (6b)',
    bits: 'Bits 4 - 9',
    span: 3,
    color: 'slate',
    desc: 'Campo reservado para uso futuro, se establece en cero.',
    schoolExample: 'Mantiene la alineación de 32 bits del estándar RFC en todos los segmentos de la red.'
  },
  {
    id: 'flags',
    name: 'Flags / Indicadores (6b)',
    bits: 'URG | ACK | PSH | RST | SYN | FIN',
    span: 3,
    color: 'rose',
    desc: 'Bits de control que gestionan el ciclo de vida de la conexión TCP (inicio, confirmación, empuje de datos, reinicio o cierre).',
    schoolExample: 'SYN y ACK establecen la sesión con Nginx; FIN la cierra ordenadamente; RST rechaza conexiones no válidas o abruptas.'
  },
  {
    id: 'window',
    name: 'Ventana de Recepción - rwnd (16 bits)',
    bits: 'Bits 16 - 31 (2 Bytes)',
    span: 3,
    color: 'cyan',
    desc: 'Implementa el Control de Flujo: informa cuántos bytes puede aceptar el receptor en su buffer sin saturarse.',
    schoolExample: 'Si el servidor Samba o Apache está atendiendo muchas solicitudes simultáneas, reduce su ventana para que los clientes moderen el envío.'
  },
  {
    id: 'checksum',
    name: 'Checksum / Suma de Comprobación (16 bits)',
    bits: 'Bits 0 - 15 (2 Bytes)',
    span: 6,
    color: 'emerald',
    desc: 'Permite detectar alteraciones o errores en los bits del encabezado y los datos ocurridos durante la transmisión.',
    schoolExample: 'Si un segmento llega con errores eléctricos o de transmisión, el stack TCP del servidor de la VLAN 10 lo descarta para que sea retransmitido.'
  },
  {
    id: 'urgent',
    name: 'Puntero Urgente (16 bits)',
    bits: 'Bits 16 - 31 (2 Bytes)',
    span: 6,
    color: 'slate',
    desc: 'Válido solo si el flag URG está activo; señala el final de los datos prioritarios dentro del segmento.',
    schoolExample: 'Utilizado en señales de interrupción fuera de banda cuando una aplicación requiere atención inmediata.'
  },
  {
    id: 'options',
    name: 'Opciones y Relleno (Variable, múltiplo de 32 bits)',
    bits: 'Opcional (Ej. MSS - Maximum Segment Size, Window Scale)',
    span: 12,
    color: 'slate',
    desc: 'Permite negociar parámetros adicionales durante el handshake, como el tamaño máximo de segmento (MSS).',
    schoolExample: 'Durante el SYN inicial entre un cliente y Nginx, negocia el MSS óptimo para evitar fragmentación IP en el C9200.'
  }
];

const UDP_HEADER_FIELDS = [
  {
    id: 'udp_src',
    name: 'Puerto de Origen (16 bits)',
    bits: 'Bits 0 - 15 (2 Bytes)',
    span: 6,
    color: 'cyan',
    desc: 'Puerto del proceso emisor (ej. UDP 68 en un cliente DHCP o un puerto efímero como 51204 para una consulta DNS).',
    schoolExample: 'Cuando una PC administrativa consulta un dominio a Cisco OpenDNS, usa un puerto efímero UDP de origen para recibir la respuesta.'
  },
  {
    id: 'udp_dst',
    name: 'Puerto de Destino (16 bits)',
    bits: 'Bits 16 - 31 (2 Bytes)',
    span: 6,
    color: 'amber',
    desc: 'Puerto del servicio destino (ej. UDP 67 para el servidor Windows DHCP o UDP 53 para Cisco OpenDNS).',
    schoolExample: 'Identifica que el datagrama va dirigido al servicio DHCP (172.16.10.14:67) o al resolvedor OpenDNS (:53).'
  },
  {
    id: 'udp_len',
    name: 'Longitud Total del Datagrama (16 bits)',
    bits: 'Bits 0 - 15 (2 Bytes)',
    span: 6,
    color: 'violet',
    desc: 'Longitud total del datagrama UDP en bytes (encabezado fijo de 8 bytes + datos de aplicación).',
    schoolExample: 'Las consultas DNS hacia OpenDNS son mensajes pequeños y puntuales que caben en un único datagrama ligero.'
  },
  {
    id: 'udp_checksum',
    name: 'Checksum UDP (16 bits)',
    bits: 'Bits 16 - 31 (2 Bytes)',
    span: 6,
    color: 'emerald',
    desc: 'Verifica la integridad del encabezado y de los datos para detectar corrupciones en tránsito.',
    schoolExample: 'Asegura que los parámetros IP entregados por el servidor Windows DHCP (172.16.10.14) no hayan sufrido alteraciones.'
  }
];

const SERVICES_MATRIX = [
  {
    service: 'Nginx Reverse Proxy',
    ip: '172.16.10.12',
    vlan: 'VLAN 10',
    proto: 'TCP',
    ports: 'TCP 80 y TCP 443',
    category: 'Conocidos (0-1023)',
    exposure: 'Accesible desde VLANs internas (20, 30, 50)',
    justification:
      'Actúa como proxy inverso delante de Apache. Recibe HTTP (80) y HTTPS con TLS (443) de los usuarios y abre una conexión TCP separada hacia Apache.',
    badgeColor: 'emerald'
  },
  {
    service: 'Apache Web Server',
    ip: '172.16.10.11',
    vlan: 'VLAN 10',
    proto: 'TCP',
    ports: 'TCP 8080 (Interno)',
    category: 'Registrados (1024-49151)',
    exposure: 'Aislado — Solo acepta tráfico desde Nginx (172.16.10.12)',
    justification:
      'Servidor backend de aplicaciones web. El puerto 8080 se protege mediante ACL en el C9200 para no exponerse directamente a las VLANs de estudiantes o usuarios.',
    badgeColor: 'violet'
  },
  {
    service: 'Samba File Server',
    ip: '172.16.10.13',
    vlan: 'VLAN 10',
    proto: 'TCP / UDP',
    ports: 'TCP 445 (Principal); TCP 139 y UDP 137/138 (Opcionales)',
    category: 'Conocidos (0-1023)',
    exposure: 'Usuarios autorizados según políticas de VLAN',
    justification:
      'Brinda carpetas compartidas con entrega ordenada y sin pérdida mediante SMB moderno (TCP 445). Los puertos NetBIOS (139, 137/138) quedan sujetos solo a compatibilidad heredada.',
    badgeColor: 'cyan'
  },
  {
    service: 'Windows Server DHCP',
    ip: '172.16.10.14',
    vlan: 'VLAN 10',
    proto: 'UDP',
    ports: 'UDP 67 (Servidor) / UDP 68 (Cliente)',
    category: 'Conocidos (0-1023)',
    exposure: 'Todas las VLANs a través de DHCP Relay en el C9200',
    justification:
      'Intercambio rápido de mensajes de configuración IP (DORA) sin establecer conexión previa. Requiere ip helper-address en el switch C9200 para cruzar VLANs.',
    badgeColor: 'amber'
  },
  {
    service: 'Cisco OpenDNS',
    ip: 'Servicio Externo (Cloud)',
    vlan: 'Internet / WAN',
    proto: 'UDP / TCP',
    ports: 'UDP 53 (Habitual); TCP 53 (Casos específicos)',
    category: 'Conocidos (0-1023)',
    exposure: 'Salida controlada por Firewall Meraki MX100',
    justification:
      'No es una VM local. Resuelve y filtra dominios usando UDP 53 por velocidad y baja sobrecarga; utiliza TCP 53 cuando las respuestas superan el tamaño estándar o en transferencias.',
    badgeColor: 'rose'
  }
];

const ORAL_DEFENSE_QA = [
  {
    q: '¿Por qué un estudiante no se conecta directamente a Apache (172.16.10.11:8080) y qué pasa a nivel de Capa de Transporte?',
    a: 'Porque Nginx (172.16.10.12) actúa como Proxy Inverso en los puertos TCP 80 y 443. A nivel de transporte existen DOS conexiones TCP totalmente independientes: la primera entre el navegador del estudiante (puerto efímero, ej. 53000) y Nginx (puerto 443), y la segunda iniciada por Nginx (como cliente con su propio puerto efímero) hacia Apache (puerto 8080). El puerto 8080 se bloquea en las ACLs del Catalyst C9200 para las VLANs de usuarios.'
  },
  {
    q: 'Si el MikroTik hEX RB750Gr3 balancea 3 proveedores (WestNet, Starlink y Tachicom) con PCC, ¿una descarga TCP triplica su velocidad?',
    a: 'No. El balanceo PCC (Per Connection Classifier) asigna cada flujo TCP completo a un único enlace WAN para evitar que los segmentos lleguen por rutas con distinta latencia e IP pública. Por lo tanto, una única conexión TCP utiliza el ancho de banda de un solo proveedor; el beneficio de los 3 enlaces se observa en el conjunto de múltiples conexiones concurrentes de la escuela.'
  },
  {
    q: '¿Cuál es la diferencia exacta entre Control de Flujo y Control de Congestión en nuestra red?',
    a: 'El Control de Flujo protege al RECEPTOR (por ejemplo, que una PC o el servidor Samba no desborde su propio buffer de memoria), utilizando la Ventana de Recepción (rwnd) anunciada en el encabezado TCP. En cambio, el Control de Congestión protege a la RED intermedia (switches y enlaces WAN), utilizando la ventana de congestión (cwnd) con algoritmos como Slow Start, Congestion Avoidance y Fast Retransmit.'
  },
  {
    q: '¿Por qué es obligatorio configurar DHCP Relay (ip helper-address 172.16.10.14) en el Cisco Catalyst C9200?',
    a: 'Porque el servidor Windows DHCP (172.16.10.14) reside en la VLAN 10, mientras que los clientes están en las VLAN 20, 30 y 50. Cuando un cliente solicita IP mediante UDP (origen 68, destino 67), envía un broadcast que por diseño no atraviesa routers ni interfaces L3. El comando ip helper-address en las interfaces VLAN del C9200 intercepta ese broadcast UDP y lo reenvía como paquete unicast hacia 172.16.10.14.'
  }
];

// ============================================================================
// COMPONENTE PRINCIPAL (APP)
// ============================================================================

export default function App() {
  // Modo de visualización: 'presentation' (por escenas tipo Keynote) o 'scroll' (exploración completa)
  const [viewMode, setViewMode] = useState('presentation');
  const [currentScene, setCurrentScene] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);

  // Estado Módulo 1: Topología y Funciones
  const [selectedNodeId, setSelectedNodeId] = useState('c9200');
  const [activeLayerCompare, setActiveLayerCompare] = useState('transport');

  // Estado Módulo 2: Encabezados TCP/UDP y Flags
  const [headerProto, setHeaderProto] = useState('TCP');
  const [selectedField, setSelectedField] = useState(TCP_HEADER_FIELDS[0]);
  const [tcpFlags, setTcpFlags] = useState({
    URG: false,
    ACK: false,
    PSH: false,
    RST: false,
    SYN: true,
    FIN: false
  });

  // Estado Módulo 3: Matriz de Puertos y Proxy Inverso
  const [portFilter, setPortFilter] = useState('ALL');
  const [proxyStep, setProxyStep] = useState(2);
  const [internalTls, setInternalTls] = useState(false);

  // Estado Módulo 4: Simulador de 3 Escenarios Paso a Paso
  const [simScenario, setSimScenario] = useState('handshake'); // 'handshake' | 'samba' | 'mux'
  const [simStep, setSimStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [rwndSize, setRwndSize] = useState(64); // KB para control de flujo en Samba
  const [activeMuxSocket, setActiveMuxSocket] = useState('all');

  // Estado Módulo 5: Congestión vs Flujo y Balanceo PCC MikroTik
  const [cwndPhase, setCwndPhase] = useState('all'); // 'slow_start' | 'avoidance' | 'retransmit' | 'all'
  const [pccFlows, setPccFlows] = useState([
    { id: 1, src: '172.16.20.10:53010', dst: 'Campus Virtual (TCP 443)', isp: 'WestNet', bw: '100 Mbps', hash: 'Hash 0 (3:0)' },
    { id: 2, src: '172.16.30.22:54112', dst: ' Videollamada Docente (TCP 443)', isp: 'Starlink', bw: '150 Mbps', hash: 'Hash 1 (3:1)' },
    { id: 3, src: '172.16.50.15:51900', dst: 'Sistema Gestión DGE (TCP 443)', isp: 'Tachicom', bw: '80 Mbps', hash: 'Hash 2 (3:2)' }
  ]);

  // Estado Módulo 6: VLANs, ACLs y DHCP Relay
  const [selectedAclTest, setSelectedAclTest] = useState(0);
  const [dhcpRelayEnabled, setDhcpRelayEnabled] = useState(true);
  const [dhcpStep, setDhcpStep] = useState(4);

  // Estado Módulo 7: Q&A
  const [openQaIndex, setOpenQaIndex] = useState(0);

  // Navegación por teclado (Flechas Izquierda / Derecha) en modo Presentación
  const handleNextScene = useCallback(() => {
    setCurrentScene((prev) => Math.min(prev + 1, SCENES.length - 1));
  }, []);

  const handlePrevScene = useCallback(() => {
    setCurrentScene((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode !== 'presentation') return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') {
        handleNextScene();
      } else if (e.key === 'ArrowLeft') {
        handlePrevScene();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handleNextScene, handlePrevScene]);

  // Actualizar campo seleccionado al cambiar entre TCP y UDP
  useEffect(() => {
    if (headerProto === 'TCP') {
      setSelectedField(TCP_HEADER_FIELDS[0]);
    } else {
      setSelectedField(UDP_HEADER_FIELDS[0]);
    }
  }, [headerProto]);

  // Auto-Play para el Simulador del Módulo 4
  useEffect(() => {
    if (!isAutoPlaying) return;
    const maxSteps = simScenario === 'handshake' ? 4 : simScenario === 'samba' ? 4 : 3;
    const timer = setInterval(() => {
      setSimStep((prev) => {
        if (prev >= maxSteps) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, [isAutoPlaying, simScenario]);

  // Función para agregar nueva conexión al simulador PCC MikroTik
  const addNewPccFlow = () => {
    const isps = [
      { name: 'WestNet', bw: '100 Mbps', hash: 'Hash 0 (3:0)' },
      { name: 'Starlink', bw: '150 Mbps', hash: 'Hash 1 (3:1)' },
      { name: 'Tachicom', bw: '80 Mbps', hash: 'Hash 2 (3:2)' }
    ];
    const sampleSrcs = [
      '172.16.20.45 (Estudiante)',
      '172.16.30.18 (Docente)',
      '172.16.50.12 (Administración)',
      '172.16.20.88 (Laboratorio)'
    ];
    const sampleDsts = [
      'Google Workspace (TCP 443)',
      'Repositorio Educativo (TCP 443)',
      'Actualización Windows (TCP 443)',
      'Portal UTN / Investigación (TCP 443)'
    ];
    const nextIdx = pccFlows.length % 3;
    const chosenIsp = isps[nextIdx];
    const randomPort = Math.floor(49152 + Math.random() * 14000);
    const newFlow = {
      id: Date.now(),
      src: `${sampleSrcs[pccFlows.length % sampleSrcs.length].split(' ')[0]}:${randomPort}`,
      dst: sampleDsts[pccFlows.length % sampleDsts.length],
      isp: chosenIsp.name,
      bw: chosenIsp.bw,
      hash: chosenIsp.hash
    };
    setPccFlows((prev) => [newFlow, ...prev.slice(0, 5)]);
  };

  // Presets de Flags TCP
  const applyFlagPreset = (preset) => {
    const presets = {
      SYN: { URG: false, ACK: false, PSH: false, RST: false, SYN: true, FIN: false },
      SYN_ACK: { URG: false, ACK: true, PSH: false, RST: false, SYN: true, FIN: false },
      ACK: { URG: false, ACK: true, PSH: false, RST: false, SYN: false, FIN: false },
      PSH_ACK: { URG: false, ACK: true, PSH: true, RST: false, SYN: false, FIN: false },
      FIN_ACK: { URG: false, ACK: true, PSH: false, RST: false, SYN: false, FIN: true },
      RST: { URG: false, ACK: false, PSH: false, RST: true, SYN: false, FIN: false }
    };
    setTcpFlags(presets[preset]);
  };

  const getFlagInterpretation = () => {
    const { URG, ACK, PSH, RST, SYN, FIN } = tcpFlags;
    if (RST) {
      return {
        title: 'RST (Reinicio / Rechazo Inmediato)',
        badge: 'CONEXIÓN RECHAZADA O ABORTADA',
        color: 'rose',
        desc: 'Se utiliza para reiniciar o rechazar inmediatamente una conexión inválida (por ejemplo, si un equipo intenta conectarse a un puerto cerrado en un servidor de la escuela).'
      };
    }
    if (SYN && !ACK && !FIN) {
      return {
        title: 'Paso 1 Handshake: Solicitud de Inicio (SYN)',
        badge: 'SYN_SENT',
        color: 'cyan',
        desc: 'El cliente (ej. PC Estudiante 172.16.20.10:53000) solicita iniciar una conexión TCP con Nginx (172.16.10.12:443) y sincroniza su número de secuencia inicial.'
      };
    }
    if (SYN && ACK && !FIN) {
      return {
        title: 'Paso 2 Handshake: Confirmación y Sincronización (SYN + ACK)',
        badge: 'SYN_RECEIVED',
        color: 'emerald',
        desc: 'El servidor Nginx (172.16.10.12) acepta la solicitud, confirma el número de secuencia del cliente (ACK) y envía su propio número de secuencia inicial (SYN).'
      };
    }
    if (PSH && ACK) {
      return {
        title: 'Transferencia Activa de Aplicación (PSH + ACK)',
        badge: 'DATA PUSH',
        color: 'violet',
        desc: 'Indica al receptor que entregue los datos inmediatamente a la capa de aplicación (ej. petición HTTPS o bloque de archivo de Samba) sin esperar a llenar el buffer.'
      };
    }
    if (FIN && ACK) {
      return {
        title: 'Cierre Ordenado de Conexión (FIN + ACK)',
        badge: 'FIN_WAIT / CLOSE',
        color: 'amber',
        desc: 'Uno de los extremos indica que no tiene más datos por enviar y solicita finalizar ordenadamente la sesión TCP tras completar la descarga web o de Samba.'
      };
    }
    if (ACK && !SYN && !FIN && !PSH) {
      return {
        title: 'Reconocimiento Estándar (ACK)',
        badge: 'ESTABLISHED',
        color: 'emerald',
        desc: 'Confirma la recepción exitosa de bytes previos (Paso 3 del Handshake o confirmación de segmentos recibidos durante una descarga).'
      };
    }
    if (URG) {
      return {
        title: 'Datos Urgentes Activos (URG)',
        badge: 'URGENT POINTER',
        color: 'amber',
        desc: 'Notifica que el Puntero Urgente del encabezado es válido y señala datos prioritarios para el proceso destino.'
      };
    }
    return {
      title: 'Combinación Personalizada de Indicadores',
      badge: 'CUSTOM FLAGS',
      color: 'slate',
      desc: 'Activa o desactiva los bits individuales o usa los presets superiores para simular los estados reales de las conexiones en la Escuela Los Corralitos.'
    };
  };

  // ============================================================================
  // RENDERIZADO DE CADA ESCENA / MÓDULO
  // ============================================================================

  const renderScene0Hero = () => (
    <section className="space-y-8 animate-fadeIn">
      {/* Banner Principal Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-900/95 via-[#0B0F17] to-slate-900/90 p-6 sm:p-10 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <GraduationCap className="w-3.5 h-3.5" />
                UTN Facultad Regional Mendoza
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Escuela 4-025 Los Corralitos
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-violet-500/15 text-violet-300 border border-violet-500/30">
                Entrega: 13 de Noviembre
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              CAPA DE TRANSPORTE{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent">
                MODELO TCP/IP
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Desarrollo técnico e interactivo de la Capa de Transporte aplicada a la infraestructura de red relevada y propuesta para la{' '}
              <strong className="text-white">Escuela 4-025 Los Corralitos</strong>: comunicación extremo a extremo, planificación de puertos en servidores VLAN 10, proxy inverso doble salto, confiabilidad TCP, balanceo PCC Multi-WAN y políticas de seguridad inter-VLAN.
            </p>

            {/* Información de Cátedra */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Carrera y Asignatura</div>
                <div className="text-sm font-semibold text-white mt-0.5">Ing. en Sistemas de Información</div>
                <div className="text-xs text-cyan-400 font-mono">Redes de Datos</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Docentes a Cargo</div>
                <div className="text-sm font-semibold text-white mt-0.5">Esp. Prof. Raúl Tonelli</div>
                <div className="text-xs text-emerald-400 font-mono">Prof. Roberto Cutuli</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Modalidad</div>
                <div className="text-sm font-semibold text-white mt-0.5">Presentación Grupal</div>
                <div className="text-xs text-violet-400 font-mono">Entrega por Plataforma</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  if (viewMode === 'presentation') {
                    setCurrentScene(1);
                  } else {
                    document.getElementById('modulo-1')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <span>Iniciar Recorrido de Exposición</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setViewMode(viewMode === 'presentation' ? 'scroll' : 'presentation')}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>
                  Cambiar a {viewMode === 'presentation' ? 'Modo Exploración Libre (Scroll)' : 'Modo Presentación (Diapositivas)'}
                </span>
              </button>
            </div>
          </div>

          {/* Tarjeta de Integrantes del Grupo */}
          <div className="w-full lg:w-96 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h2 className="font-bold text-white text-sm uppercase tracking-wider">Integrantes del Grupo</h2>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">6 Integrantes</span>
            </div>

            <div className="space-y-2.5">
              {INTEGRANTES.map((integrante, idx) => (
                <div
                  key={integrante.legajo}
                  onClick={() => {
                    if (viewMode === 'presentation') setCurrentScene(idx + 1);
                  }}
                  className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer"
                  title="Click para ir al módulo sugerido de defensa"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {integrante.nombre}
                    </div>
                    <div className="text-[11px] text-slate-400">{integrante.rol}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    Leg. {integrante.legajo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mapa de las 11 Secciones del Informe */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Estructura Interactiva del Informe (11 Secciones Cubiertas)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Haz clic en cualquier módulo para saltar directamente</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCENES.slice(1).map((scene) => (
            <div
              key={scene.id}
              onClick={() => {
                if (viewMode === 'presentation') {
                  setCurrentScene(scene.id);
                } else {
                  document.getElementById(`modulo-${scene.id}`)?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="group p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {scene.sections}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {scene.title}
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-3 line-clamp-2">{scene.speakerNotes}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // ============================================================================
  // MÓDULO 1: LA INFRAESTRUCTURA Y ROL DE TRANSPORTE (SECCIONES 1 Y 2)
  // ============================================================================
  const renderScene1Infrastructure = () => {
    const selectedNode = TOPOLOGY_NODES.find((n) => n.id === selectedNodeId) || TOPOLOGY_NODES[0];

    return (
      <section id="modulo-1" className="space-y-8 animate-fadeIn">
        {/* Encabezado de Sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              Módulo 1 • Secciones 1 y 2 del Informe
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Infraestructura de la Escuela 4-025 y Función de la Capa de Transporte
            </h2>
          </div>
          <p className="text-sm text-slate-400 max-w-md">
            Selecciona cualquier equipo de la arquitectura para inspeccionar su rol exacto frente a los protocolos TCP y UDP.
          </p>
        </div>

        {/* Diagrama de Topología Interactiva + Inspector Técnico */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Diagrama Topológico */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-400" />
                Topología Lógica Interactiva (Haz clic en cada nodo)
              </h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                8 Nodos Clave
              </span>
            </div>

            {/* Nivel 1: Internet / WAN / Cloud */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase text-slate-400">
                1. Borde WAN (3 Proveedores ISP) y Servicio DNS Externo
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOPOLOGY_NODES.filter((n) => ['mikrotik', 'opendns'].includes(n.id)).map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedNodeId === node.id
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{node.name}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                        {node.ip}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{node.role}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nivel 2: Firewall Perimetral y Core Capa 3 */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase text-slate-400">
                2. Seguridad Perimetral y Núcleo de Enrutamiento Inter-VLAN
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOPOLOGY_NODES.filter((n) => ['meraki', 'c9200'].includes(n.id)).map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedNodeId === node.id
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{node.name}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
                        {node.vlan}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{node.role}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nivel 3: Servidores Locales VLAN 10 */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase text-emerald-400">
                3. Granja de Servidores Locales — VLAN 10 (Gestión: 172.16.10.0/24)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOPOLOGY_NODES.filter((n) => ['nginx', 'apache', 'samba', 'dhcp'].includes(n.id)).map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedNodeId === node.id
                        ? 'bg-emerald-500/15 border-emerald-400 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{node.name}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {node.ip}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1">{node.ports}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nivel 4: VLANs de Usuarios */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300">Segmentos Clientes (Terminales):</span>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  VLAN 20: Estudiantes (172.16.20.0/24)
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  VLAN 30: Maestros
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  VLAN 50: Administración
                </span>
              </div>
            </div>
          </div>

          {/* Panel Inspector del Nodo Seleccionado */}
          <div className="lg:col-span-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Inspector de Nodo Activo
                </span>
                <span className="text-xs font-mono text-slate-400">{selectedNode.vlan}</span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">{selectedNode.name}</h3>
                <p className="text-sm text-cyan-400 font-medium">{selectedNode.role}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-xs text-slate-400 uppercase">Direccionamiento / Ubicación</div>
                  <div className="text-sm font-mono font-bold text-white mt-0.5">{selectedNode.ip}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-xs text-slate-400 uppercase">Intervención en Capa de Transporte</div>
                  <div className="text-sm font-semibold text-emerald-300 mt-0.5">{selectedNode.layerRole}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-xs text-slate-400 uppercase">Puertos y Protocolos Asociados</div>
                  <div className="text-sm font-mono text-amber-300 mt-0.5">{selectedNode.ports}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-sm text-slate-300 leading-relaxed">
                {selectedNode.description}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Concepto Clave (Sección 2):</strong> Los switches y routers convencionales encaminan tramas y paquetes, pero{' '}
                <strong className="text-cyan-300">los protocolos de transporte se implementan en los equipos terminales</strong> (clientes y servidores).
              </span>
            </div>
          </div>
        </div>

        {/* Comparativa Interactiva: Capa de Red vs Capa de Transporte + Las 5 Funciones */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Comparativa Capa de Red vs Capa de Transporte */}
          <div className="lg:col-span-5 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-400" />
              Diferencia Esencial en el Modelo TCP/IP
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveLayerCompare('network')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeLayerCompare === 'network'
                    ? 'bg-violet-500/15 border-violet-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-mono uppercase text-violet-300">Capa de Red</div>
                <div className="text-sm font-bold mt-0.5">Dirección IP</div>
                <div className="text-[11px] opacity-80">Entrega Equipo a Equipo</div>
              </button>

              <button
                onClick={() => setActiveLayerCompare('transport')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeLayerCompare === 'transport'
                    ? 'bg-cyan-500/15 border-cyan-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-mono uppercase text-cyan-300">Capa de Transporte</div>
                <div className="text-sm font-bold mt-0.5">Puertos TCP / UDP</div>
                <div className="text-[11px] opacity-80">Proceso a Proceso</div>
              </button>
            </div>

            {activeLayerCompare === 'network' ? (
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 space-y-2 text-sm">
                <div className="font-bold text-violet-200">Capa de Red: Lleva paquetes de un host a otro</div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Utiliza direcciones IP (ej. desde la PC <code className="font-mono text-white">172.16.20.10</code> hasta el servidor{' '}
                  <code className="font-mono text-white">172.16.10.12</code>). Sin embargo, la IP por sí sola solo llega hasta la placa de red del servidor, sin saber qué programa debe procesar los datos.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-2 text-sm">
                <div className="font-bold text-cyan-200">
                  Capa de Transporte: Identifica la aplicación exacta dentro del destino
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Ubicada entre la capa de Aplicación y la de Red, utiliza <strong className="text-white">números de puerto</strong> (ej.{' '}
                  <code className="font-mono text-cyan-300">TCP 443</code> para Nginx o{' '}
                  <code className="font-mono text-cyan-300">TCP 445</code> para Samba) para entregar los datos al proceso correcto.
                </p>
              </div>
            )}
          </div>

          {/* Las 5 Funciones de la Capa de Transporte en la Escuela */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Las 5 Funciones de la Capa de Transporte Aplicadas al Proyecto
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-xs font-mono text-cyan-400 font-bold">1. Comunicación Extremo a Extremo</div>
                <p className="text-xs text-slate-300 mt-1">
                  Conecta directamente los programas clientes (navegadores, explorador de archivos) con los servicios en los servidores de la VLAN 10.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-xs font-mono text-emerald-400 font-bold">2. Segmentación y Reensamblado</div>
                <p className="text-xs text-slate-300 mt-1">
                  En TCP, divide el flujo de datos (ej. un documento escolar en Samba) en segmentos numerados y los reconstruye en orden en el destino.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-xs font-mono text-violet-400 font-bold">3. Multiplexación y Demultiplexación</div>
                <p className="text-xs text-slate-300 mt-1">
                  Permite que una misma PC utilice simultáneamente DNS, Web y Samba diferenciando cada flujo mediante números de puerto.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-xs font-mono text-amber-400 font-bold">4. Detección de Errores (Checksum)</div>
                <p className="text-xs text-slate-300 mt-1">
                  Tanto TCP como UDP incluyen un campo Checksum en su encabezado para detectar si los datos sufrieron alteraciones en tránsito.
                </p>
              </div>
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-xs font-mono text-rose-400 font-bold">
                  5. Confiabilidad, Control de Flujo y Control de Congestión (Exclusivos de TCP)
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Mediante acuses de recibo (ACK), retransmisiones, ventana de recepción (<code className="font-mono">rwnd</code>) y ventana de congestión (<code className="font-mono">cwnd</code>), TCP regula y recupera la transmisión para los servicios web y de archivos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // ============================================================================
  // MÓDULO 2: SIMULADOR DE ENCABEZADOS RFC Y COMPARATIVA TCP VS UDP (SECCIONES 3 Y 6)
  // ============================================================================
  const renderScene2Headers = () => {
    const flagInterpretation = getFlagInterpretation();
    const activeFields = headerProto === 'TCP' ? TCP_HEADER_FIELDS : UDP_HEADER_FIELDS;

    return (
      <section id="modulo-2" className="space-y-8 animate-fadeIn">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
              Módulo 2 • Secciones 3 y 6 del Informe
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Simulador de Encabezados RFC y Elección TCP vs. UDP
            </h2>
          </div>

          {/* Switch Interactivo TCP vs UDP */}
          <div className="inline-flex p-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setHeaderProto('TCP')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                headerProto === 'TCP'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Encabezado TCP (Mín. 20 Bytes)
            </button>
            <button
              onClick={() => setHeaderProto('UDP')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                headerProto === 'UDP'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Encabezado UDP (Fijo 8 Bytes)
            </button>
          </div>
        </div>

        {/* Nota Crítica sobre Direcciones IP */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm text-slate-200">
              <strong className="text-amber-300">Distinción Fundamental de Examen (Sección 6):</strong> Las direcciones IP de origen y destino{' '}
              <strong className="underline decoration-amber-400">NO forman parte</strong> del encabezado TCP ni UDP; pertenecen al encabezado de la{' '}
              <strong className="text-white">Capa de Red</strong>.
            </span>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-950 text-amber-300 border border-amber-500/30 shrink-0">
            32 Bits de Ancho (RFC 793 / RFC 768)
          </span>
        </div>

        {/* Diagrama de Bytes RFC + Inspector de Campo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cuadrícula de Bits estilo RFC */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
              <span>Bit 0</span>
              <span>Bit 15</span>
              <span>Bit 16</span>
              <span>Bit 31</span>
            </div>

            <div className="grid grid-cols-12 gap-2.5">
              {activeFields.map((field) => {
                const isSelected = selectedField?.id === field.id;
                const colSpanClass =
                  field.span === 12
                    ? 'col-span-12'
                    : field.span === 6
                    ? 'col-span-12 sm:col-span-6'
                    : 'col-span-6 sm:col-span-3';

                return (
                  <button
                    key={field.id}
                    onClick={() => setSelectedField(field)}
                    className={`${colSpanClass} p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/10 scale-[1.01]'
                        : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase text-slate-400">{field.bits}</div>
                    <div className="text-xs sm:text-sm font-bold text-white mt-1">{field.name}</div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-xs text-slate-400">
              ▼ Payload / Datos de la Capa de Aplicación ({headerProto === 'TCP' ? 'HTTP, TLS, SMB Samba' : 'DHCP Discover/Offer, Consultas DNS'}) ▼
            </div>
          </div>

          {/* Tarjeta Explicativa del Campo Seleccionado */}
          <div className="lg:col-span-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  Inspector de Campo {headerProto}
                </span>
                <span className="text-xs font-mono text-slate-400">{selectedField?.bits}</span>
              </div>

              <h3 className="text-xl font-bold text-white">{selectedField?.name}</h3>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="text-xs font-mono uppercase text-slate-400">Función Técnica del Campo</div>
                <p className="text-sm text-slate-200 leading-relaxed">{selectedField?.desc}</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                <div className="text-xs font-mono uppercase text-emerald-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  Aplicación en la Escuela 4-025 Los Corralitos
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{selectedField?.schoolExample}</p>
              </div>
            </div>

            {/* Resumen Comparativo Rápido TCP vs UDP */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="font-mono font-bold text-cyan-400">TCP (Web y Samba)</div>
                <ul className="mt-1.5 space-y-1 text-slate-300">
                  <li>• Orientado a conexión</li>
                  <li>• Entrega ordenada + ACK</li>
                  <li>• Control flujo y congestión</li>
                  <li>• Mínimo 20 bytes</li>
                </ul>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="font-mono font-bold text-amber-400">UDP (DHCP y DNS)</div>
                <ul className="mt-1.5 space-y-1 text-slate-300">
                  <li>• Sin conexión previa</li>
                  <li>• Sin retransmisión TCP</li>
                  <li>• Baja sobrecarga y veloz</li>
                  <li>• Fijo de 8 bytes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Laboratorio Interactivo de Indicadores (Flags) TCP */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                Laboratorio Interactivo de Indicadores (Flags) TCP
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Conmuta los 6 bits de control del encabezado TCP o selecciona un estado predefinido para observar su efecto en la red escolar.
              </p>
            </div>

            {/* Presets Rápidos */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyFlagPreset('SYN')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer"
              >
                1. Inicio (SYN)
              </button>
              <button
                onClick={() => applyFlagPreset('SYN_ACK')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 cursor-pointer"
              >
                2. Respuesta (SYN+ACK)
              </button>
              <button
                onClick={() => applyFlagPreset('PSH_ACK')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-violet-300 border border-slate-700 cursor-pointer"
              >
                3. Datos Web/Samba (PSH+ACK)
              </button>
              <button
                onClick={() => applyFlagPreset('FIN_ACK')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer"
              >
                4. Cierre (FIN+ACK)
              </button>
              <button
                onClick={() => applyFlagPreset('RST')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 cursor-pointer"
              >
                5. Reinicio (RST)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Botones Toggle de los 6 Flags */}
            <div className="lg:col-span-6 grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {Object.entries(tcpFlags).map(([flag, isActive]) => (
                <button
                  key={flag}
                  onClick={() => setTcpFlags((prev) => ({ ...prev, [flag]: !prev[flag] }))}
                  className={`p-3.5 rounded-xl border text-center font-mono transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/15'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{flag}</div>
                  <div className={`text-lg font-extrabold mt-1 ${isActive ? 'text-cyan-300' : 'text-slate-600'}`}>
                    {isActive ? '1' : '0'}
                  </div>
                </button>
              ))}
            </div>

            {/* Interpretación en Vivo */}
            <div className="lg:col-span-6 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{flagInterpretation.title}</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {flagInterpretation.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{flagInterpretation.desc}</p>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // ============================================================================
  // MÓDULO 3: MATRIZ DE SERVICIOS, PUERTOS Y DOBLE SALTO PROXY INVERSO (SECCIÓN 4)
  // ============================================================================
  const renderScene3PortsAndProxy = () => {
    const filteredServices = SERVICES_MATRIX.filter((item) => {
      if (portFilter === 'ALL') return true;
      return item.proto.includes(portFilter);
    });

    return (
      <section id="modulo-3" className="space-y-8 animate-fadeIn">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
              Módulo 3 • Sección 4 del Informe
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Planificación de Puertos y Arquitectura Proxy Inverso
            </h2>
          </div>

          {/* Filtro por Protocolo */}
          <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
            {['ALL', 'TCP', 'UDP'].map((f) => (
              <button
                key={f}
                onClick={() => setPortFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  portFilter === f ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'ALL' ? 'Todos los Servicios (5)' : `Solo ${f}`}
              </button>
            ))}
          </div>
        </div>

        {/* Clasificación de los Puertos de 16 bits (0 - 65535) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-cyan-400">Rango 0 – 1023</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">Well-Known</span>
            </div>
            <div className="text-base font-bold text-white mt-1">Puertos Bien Conocidos</div>
            <p className="text-xs text-slate-400 mt-1">
              Asignados a servicios estándar en nuestros servidores: HTTP (<code className="font-mono text-white">80</code>), HTTPS (<code className="font-mono text-white">443</code>), SMB Samba (<code className="font-mono text-white">445</code>), DHCP (<code className="font-mono text-white">67/68</code>) y DNS (<code className="font-mono text-white">53</code>).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-violet-400">Rango 1024 – 49151</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300">Registrados</span>
            </div>
            <div className="text-base font-bold text-white mt-1">Puertos Registrados</div>
            <p className="text-xs text-slate-400 mt-1">
              Utilizados por aplicaciones específicas o servicios internos, como el servidor backend{' '}
              <strong className="text-white">Apache</strong> escuchando en <code className="font-mono text-violet-300">TCP 8080</code> interno.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-amber-400">Rango 49152 – 65535</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">Dinámicos / Efímeros</span>
            </div>
            <div className="text-base font-bold text-white mt-1">Puertos Dinámicos o Privados</div>
            <p className="text-xs text-slate-400 mt-1">
              Seleccionados automáticamente como <strong className="text-white">puerto de origen</strong> por los clientes (ej.{' '}
              <code className="font-mono text-amber-300">53000</code> en una PC de Estudiantes al abrir el navegador).
            </p>
          </div>
        </div>

        {/* Tabla / Matriz Interactiva de los 5 Servicios del Proyecto */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Matriz Oficial de Transporte de los Servidores de la Escuela
            </h3>
            <span className="text-xs font-mono text-slate-400">VLAN 10 (172.16.10.0/24) + Cisco OpenDNS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 bg-slate-950/60">
                  <th className="py-3.5 px-4">Servicio</th>
                  <th className="py-3.5 px-4">Dirección IP</th>
                  <th className="py-3.5 px-4">Protocolo / Puertos</th>
                  <th className="py-3.5 px-4">Exposición de Red</th>
                  <th className="py-3.5 px-4">Justificación de Diseño</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs sm:text-sm">
                {filteredServices.map((srv) => (
                  <tr key={srv.service} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">{srv.service}</td>
                    <td className="py-4 px-4 font-mono text-cyan-300">{srv.ip}</td>
                    <td className="py-4 px-4 font-mono font-semibold text-emerald-300">{srv.ports}</td>
                    <td className="py-4 px-4 text-xs text-slate-300">{srv.exposure}</td>
                    <td className="py-4 px-4 text-xs text-slate-400 max-w-md">{srv.justification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Simulador Visual: El Doble Salto del Proxy Inverso (Nginx -> Apache) */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-[#0B0F17] to-slate-900 border border-slate-800 p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-cyan-400">
                Demostración Arquitectónica Clave
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                El Doble Salto del Proxy Inverso: Dos Conexiones TCP Independientes
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                La comunicación Cliente–Nginx y la comunicación Nginx–Apache son dos sockets TCP distintos, cada uno con su propio Three-Way Handshake, números de secuencia y puertos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setInternalTls((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                  internalTls
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                {internalTls ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>Tramo Nginx–Apache: {internalTls ? 'TLS Cifrado Activo' : 'HTTP Interno (TCP 8080)'}</span>
              </button>

              <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1">
                {[1, 2].map((step) => (
                  <button
                    key={step}
                    onClick={() => setProxyStep(step)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all ${
                      proxyStep === step ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {step === 1 ? 'Ver Salto #1 (Cliente → Nginx)' : 'Ver Salto #1 + Salto #2 Completo'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Diagrama de los 3 Nodos y 2 Conexiones TCP */}
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
            {/* Nodo 1: PC Estudiante */}
            <div className="lg:col-span-3 p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400">VLAN 20 (Estudiantes)</span>
                <Monitor className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-base font-bold text-white">PC Estudiante</div>
              <div className="text-xs font-mono text-slate-300">
                IP: <span className="text-cyan-300">172.16.20.10</span>
              </div>
              <div className="text-xs font-mono text-slate-300">
                Puerto Origen: <span className="text-amber-300">53000 (Dinámico)</span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                Rol: <strong className="text-white">Cliente TCP #1</strong>
              </div>
            </div>

            {/* Flecha / Socket Conexión TCP #1 */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center space-y-1">
              <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase">Conexión TCP #1</span>
              <div className="flex items-center gap-1 text-xs font-mono text-white">
                <span>:53000</span>
                <ArrowRight className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>:443</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                <Lock className="w-3 h-3" /> HTTPS (TLS)
              </span>
            </div>

            {/* Nodo 2: Nginx Reverse Proxy (Dual Role) */}
            <div className="lg:col-span-3 p-4 rounded-2xl bg-slate-950 border-2 border-emerald-500/50 space-y-2 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400">VLAN 10 (Proxy Inverso)</span>
                <Server className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-white">Servidor Nginx</div>
              <div className="text-xs font-mono text-slate-300">
                IP: <span className="text-emerald-300">172.16.10.12</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-mono">
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Frente a Usuario:</div>
                  <div className="text-cyan-300 font-bold">Servidor (:443)</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Frente a Apache:</div>
                  <div className="text-violet-300 font-bold">Cliente (:58120)</div>
                </div>
              </div>
            </div>

            {/* Flecha / Socket Conexión TCP #2 */}
            <div
              className={`lg:col-span-1 flex flex-col items-center justify-center p-3 rounded-xl border text-center space-y-1 transition-all ${
                proxyStep === 2
                  ? 'bg-violet-500/15 border-violet-400 opacity-100'
                  : 'bg-slate-900/40 border-slate-800 opacity-40'
              }`}
            >
              <span className="text-[10px] font-mono font-bold text-violet-300 uppercase">TCP #2</span>
              <ArrowRight className="w-4 h-4 text-violet-400" />
              <span className="text-[10px] font-mono text-white">:8080</span>
            </div>

            {/* Nodo 3: Apache Backend Server */}
            <div
              className={`lg:col-span-2 p-4 rounded-2xl bg-slate-950 border transition-all space-y-2 ${
                proxyStep === 2 ? 'border-violet-500/50 opacity-100' : 'border-slate-800 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-violet-400">VLAN 10 (Backend)</span>
                <Database className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-base font-bold text-white">Servidor Apache</div>
              <div className="text-xs font-mono text-slate-300">
                IP: <span className="text-violet-300">172.16.10.11</span>
              </div>
              <div className="text-xs font-mono text-slate-300">
                Puerto: <span className="text-violet-300">TCP 8080</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                {internalTls ? 'TLS Interno Configurado' : 'Solo accesible desde Nginx'}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // ============================================================================
  // MÓDULO 4: SIMULADOR INTERACTIVO PASO A PASO (SECCIONES 5, 7 Y 8)
  // ============================================================================
  const renderScene4Simulator = () => {
    const HANDSHAKE_STEPS = [
      {
        step: 0,
        title: 'Paso 1: SYN — Solicitud de Inicio de Conexión',
        packet: 'SYN (Seq = 100, Ack = 0) | Origen: 172.16.20.10:53000 -> Destino: 172.16.10.12:443',
        stateClient: 'SYN_SENT',
        stateServer: 'LISTEN',
        desc: 'La PC del estudiante desea acceder al portal HTTPS en Nginx. Su capa de transporte selecciona el puerto dinámico 53000 y envía un segmento con el bit SYN activo.'
      },
      {
        step: 1,
        title: 'Paso 2: SYN-ACK — Respuesta y Reconocimiento del Servidor',
        packet: 'SYN + ACK (Seq = 500, Ack = 101) | Origen: 172.16.10.12:443 -> Destino: 172.16.20.10:53000',
        stateClient: 'SYN_SENT',
        stateServer: 'SYN_RECEIVED',
        desc: 'Nginx recibe la petición en el puerto 443, reserva recursos, confirma el número de secuencia del cliente (Ack=101) y envía su propio número inicial (Seq=500).'
      },
      {
        step: 2,
        title: 'Paso 3: ACK — Confirmación del Cliente y Conexión Establecida',
        packet: 'ACK (Seq = 101, Ack = 501) | Origen: 172.16.20.10:53000 -> Destino: 172.16.10.12:443',
        stateClient: 'ESTABLISHED',
        stateServer: 'ESTABLISHED',
        desc: 'El cliente confirma el número de secuencia de Nginx. La primera conexión TCP queda en estado ESTABLISHED y comienza la negociación TLS y transferencia.'
      },
      {
        step: 3,
        title: 'Paso 4: Segundo Handshake Independiente (Nginx -> Apache TCP 8080)',
        packet: 'SYN -> SYN-ACK -> ACK | Origen: 172.16.10.12:58120 -> Destino: 172.16.10.11:8080',
        stateClient: 'ESTABLISHED (Tramo 1)',
        stateServer: 'ESTABLISHED (Tramo 2 con Apache)',
        desc: 'Cuando Nginx necesita reenviar la solicitud a Apache (172.16.10.11:8080), ejecuta un Three-Way Handshake completamente independiente entre ambos servidores.'
      },
      {
        step: 4,
        title: 'Paso 5: Finalización Ordenada (FIN / ACK) vs. Reinicio (RST)',
        packet: 'FIN + ACK <-> ACK | Cierre ordenado de ambos extremos',
        stateClient: 'CLOSED',
        stateServer: 'CLOSED',
        desc: 'Al finalizar la sesión web, los extremos intercambian segmentos con los indicadores FIN y ACK para cerrar ordenadamente. RST se reserva para rechazos o cierres abruptos.'
      }
    ];

    const SAMBA_STEPS = [
      {
        step: 0,
        title: 'Paso 1: Inicio de Descarga desde Samba (172.16.10.13:445)',
        status: 'ENVIANDO SEGMENTOS',
        desc: 'Un usuario descarga un documento institucional desde la carpeta compartida de Samba. El archivo se divide en 4 segmentos TCP numerados (Seq #1, #2, #3 y #4).'
      },
      {
        step: 1,
        title: 'Paso 2: Pérdida del Segmento #2 en Tránsito',
        status: 'ALERTA: PÉRDIDA DE SEGMENTO #2',
        desc: 'El Segmento #1 llega bien y se confirma (ACK #2). Sin embargo, el Segmento #2 se pierde en la red. El Segmento #3 llega al cliente, pero al estar fuera de orden se guarda en el buffer.'
      },
      {
        step: 2,
        title: 'Paso 3: Detección por Falta de ACK / Temporizador y Retransmisión',
        status: 'RETRANSMITIENDO SEGMENTO #2',
        desc: 'Samba detecta que el Segmento #2 no fue reconocido (mediante temporizador o ACKs duplicados solicitando el #2) y vuelve a transmitir automáticamente el Segmento #2.'
      },
      {
        step: 3,
        title: 'Paso 4: Reensamblado en Orden y Entrega Íntegra a la Aplicación',
        status: 'ARCHIVO COMPLETO Y SIN CORRUPCIÓN',
        desc: 'Al recibir el Segmento #2 retransmitido, el receptor une los segmentos #1, #2, #3 y #4 en orden exacto y entrega el archivo íntegro. (En UDP, el archivo habría quedado incompleto).'
      },
      {
        step: 4,
        title: 'Paso 5: Regulación por Control de Flujo (Ventana Deslizante rwnd)',
        status: `VENTANA ANUNCIADA: ${rwndSize} KB`,
        desc: 'Durante toda la transferencia, el receptor anuncia su ventana de recepción (rwnd) para evitar que el servidor Samba envíe datos a mayor velocidad de la que la PC puede procesar.'
      }
    ];

    return (
      <section id="modulo-4" className="space-y-8 animate-fadeIn">
        {/* Encabezado y Selector de Escenario */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              Módulo 4 • Secciones 5, 7 y 8 del Informe
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Simulador de Protocolos Paso a Paso en la Escuela
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'handshake', label: '1. Three-Way Handshake (Nginx/Apache)' },
              { id: 'samba', label: '2. Retransmisión y Flujo (Samba :445)' },
              { id: 'mux', label: '3. Multiplexación Simultánea (PC Admin)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSimScenario(tab.id);
                  setSimStep(0);
                  setIsAutoPlaying(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                  simScenario === tab.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Controles de Reproducción Paso a Paso */}
        {simScenario !== 'mux' && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsAutoPlaying(false);
                  setSimStep((prev) => Math.max(0, prev - 1));
                }}
                disabled={simStep === 0}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-mono text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Anterior
              </button>

              <button
                onClick={() => {
                  setIsAutoPlaying(false);
                  setSimStep((prev) => Math.min(4, prev + 1));
                }}
                disabled={simStep === 4}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-xs font-mono font-bold text-slate-950 flex items-center gap-1.5 cursor-pointer"
              >
                Siguiente Paso <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsAutoPlaying((prev) => !prev)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-1.5 cursor-pointer"
              >
                {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isAutoPlaying ? 'Pausar' : 'Auto-Reproducir'}
              </button>

              <button
                onClick={() => {
                  setIsAutoPlaying(false);
                  setSimStep(0);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
              </button>
            </div>

            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setSimStep(idx)}
                  className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                    simStep === idx
                      ? 'bg-cyan-400 text-slate-950'
                      : simStep > idx
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ESCENARIO 1: THREE-WAY HANDSHAKE Y CIERRE TCP */}
        {simScenario === 'handshake' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800">
                <span className="text-cyan-300">PC Estudiante (172.16.20.10:53000)</span>
                <span className="text-emerald-300">Nginx (172.16.10.12:443)</span>
                <span className="text-violet-300">Apache (172.16.10.11:8080)</span>
              </div>

              <div className="space-y-3">
                {HANDSHAKE_STEPS.map((item, idx) => {
                  const active = simStep === idx;
                  const done = simStep > idx;
                  return (
                    <div
                      key={item.step}
                      onClick={() => setSimStep(idx)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        active
                          ? 'bg-cyan-500/15 border-cyan-400 shadow-lg'
                          : done
                          ? 'bg-emerald-500/10 border-emerald-500/30 opacity-85'
                          : 'bg-slate-950/60 border-slate-800 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white">{item.title}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300">
                          {item.stateClient}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-emerald-300 mt-1">{item.packet}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Análisis del Paso {simStep + 1} de 5
                </span>
                <h3 className="text-xl font-bold text-white">{HANDSHAKE_STEPS[simStep].title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{HANDSHAKE_STEPS[simStep].desc}</p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400">Estado Cliente</div>
                    <div className="text-sm font-mono font-bold text-cyan-300 mt-1">
                      {HANDSHAKE_STEPS[simStep].stateClient}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400">Estado Servidor</div>
                    <div className="text-sm font-mono font-bold text-emerald-300 mt-1">
                      {HANDSHAKE_STEPS[simStep].stateServer}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                <strong className="text-white">Sección 7 del Informe:</strong> Antes de enviar cualquier dato HTTP/HTTPS o archivo Samba, TCP establece esta sesión lógica de 3 pasos para sincronizar números de secuencia.
              </div>
            </div>
          </div>
        )}

        {/* ESCENARIO 2: CONFIABILIDAD, PÉRDIDA DE SEGMENTO Y CONTROL DE FLUJO EN SAMBA */}
        {simScenario === 'samba' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Descarga de Archivo desde Samba (172.16.10.13:445)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Observa cómo TCP recupera el Segmento #2 perdido para entregar el archivo sin corrupción.
                  </p>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {SAMBA_STEPS[simStep].status}
                </span>
              </div>

              {/* Estado visual de los 4 segmentos del archivo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((segNum) => {
                  const isLost = segNum === 2 && simStep === 1;
                  const isRetransmitting = segNum === 2 && simStep === 2;
                  const isDelivered =
                    segNum === 1 ||
                    (segNum === 3 && simStep >= 1) ||
                    (segNum === 2 && simStep >= 3) ||
                    (segNum === 4 && simStep >= 3);

                  return (
                    <div
                      key={segNum}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        isLost
                          ? 'bg-rose-500/20 border-rose-500 text-rose-200 animate-pulse'
                          : isRetransmitting
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : isDelivered
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-mono uppercase">Segmento #{segNum}</div>
                      <div className="text-sm font-bold mt-1">
                        {isLost
                          ? '✕ PERDIDO'
                          : isRetransmitting
                          ? '↻ RETRANSMITIENDO'
                          : isDelivered
                          ? '✓ RECIBIDO (ACK)'
                          : 'En espera'}
                      </div>
                      <div className="text-[10px] font-mono mt-1 opacity-80">
                        Seq={(segNum - 1) * 1460 + 1}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Control Deslizante Interactivo de Ventana de Recepción (rwnd) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-cyan-400">
                    Simulador de Ventana de Recepción Deslizante (Control de Flujo - rwnd)
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    rwnd = {rwndSize} KB ({Math.round(rwndSize / 16)} segmentos en vuelo máx.)
                  </span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="128"
                  step="16"
                  value={rwndSize}
                  onChange={(e) => setRwndSize(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-xs text-slate-400">
                  {rwndSize <= 32
                    ? 'Receptor con buffer muy ocupado: anuncia una ventana pequeña para frenar el envío de Samba y evitar perder paquetes por desborde local.'
                    : rwndSize >= 96
                    ? 'Receptor con amplia memoria libre: anuncia una ventana grande permitiendo a Samba enviar varios segmentos continuos.'
                    : 'Equilibrio estándar de ventana deslizante anunciada por el equipo destino.'}
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Sección 8: Confiabilidad y Control de Flujo
                </span>
                <h3 className="text-xl font-bold text-white">{SAMBA_STEPS[simStep].title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{SAMBA_STEPS[simStep].desc}</p>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-rose-300">¿Qué pasaría si Samba utilizara UDP?</div>
                <p>
                  UDP no posee números de secuencia ni retransmisión automática. Ante la pérdida del Segmento #2, el documento descargado por el docente o estudiante quedaría corrupto o incompleto.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ESCENARIO 3: MULTIPLEXACIÓN Y DEMULTIPLEXACIÓN SIMULTÁNEA */}
        {simScenario === 'mux' && (
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Multiplexación y Demultiplexación en una PC de Administración (172.16.50.15)
                </h3>
                <p className="text-xs text-slate-400">
                  Una única dirección IP mantiene 3 comunicaciones simultáneas sin mezclar los datos gracias a los puertos efímeros de origen y los puertos de destino.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'Ver los 3 Flujos Simultáneos' },
                  { id: 'dns', label: 'Socket 1: OpenDNS (UDP 53)' },
                  { id: 'web', label: 'Socket 2: Nginx (TCP 443)' },
                  { id: 'samba', label: 'Socket 3: Samba (TCP 445)' }
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setActiveMuxSocket(btn.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all ${
                      activeMuxSocket === btn.id
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Socket 1: DNS */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  activeMuxSocket === 'all' || activeMuxSocket === 'dns'
                    ? 'bg-amber-500/10 border-amber-500/40 opacity-100'
                    : 'bg-slate-950 border-slate-800 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-300">PROCESO 1: RESOLUCIÓN DNS</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">UDP</span>
                </div>
                <div className="mt-3 space-y-1.5 font-mono text-xs">
                  <div className="text-slate-400">
                    Origen: <span className="text-white">172.16.50.15:51204</span>
                  </div>
                  <div className="text-slate-400">
                    Destino: <span className="text-amber-300">Cisco OpenDNS :53</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-3">
                  Consulta rápida de nombre de dominio mediante un datagrama UDP sin conexión previa.
                </p>
              </div>

              {/* Socket 2: Nginx HTTPS */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  activeMuxSocket === 'all' || activeMuxSocket === 'web'
                    ? 'bg-cyan-500/10 border-cyan-500/40 opacity-100'
                    : 'bg-slate-950 border-slate-800 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">PROCESO 2: NAVEGADOR WEB</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">TCP</span>
                </div>
                <div className="mt-3 space-y-1.5 font-mono text-xs">
                  <div className="text-slate-400">
                    Origen: <span className="text-white">172.16.50.15:53000</span>
                  </div>
                  <div className="text-slate-400">
                    Destino: <span className="text-cyan-300">172.16.10.12:443 (Nginx)</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-3">
                  Al regresar los segmentos desde Nginx al puerto <code className="font-mono">53000</code>, la demultiplexación los entrega exactamente a la pestaña del navegador.
                </p>
              </div>

              {/* Socket 3: Samba */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  activeMuxSocket === 'all' || activeMuxSocket === 'samba'
                    ? 'bg-emerald-500/10 border-emerald-500/40 opacity-100'
                    : 'bg-slate-950 border-slate-800 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-300">PROCESO 3: CARPETA SAMBA</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">TCP</span>
                </div>
                <div className="mt-3 space-y-1.5 font-mono text-xs">
                  <div className="text-slate-400">
                    Origen: <span className="text-white">172.16.50.15:53015</span>
                  </div>
                  <div className="text-slate-400">
                    Destino: <span className="text-emerald-300">172.16.10.13:445 (Samba)</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-3">
                  El explorador de archivos descarga una planilla de administración en paralelo usando el puerto efímero <code className="font-mono">53015</code>.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  };

  // ============================================================================
  // MÓDULO 5: CONTROL DE CONGESTIÓN VS FLUJO Y BALANCEO PCC MIKROTIK (SECCIÓN 9)
  // ============================================================================
  const renderScene5CongestionAndPcc = () => (
    <section id="modulo-5" className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            Módulo 5 • Sección 9 del Informe
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Control de Congestión vs. Control de Flujo y el Balanceo PCC
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-md">
          Por qué el router MikroTik RB750Gr3 y el firewall Meraki MX100 complementan pero no reemplazan el control de congestión de TCP.
        </p>
      </div>

      {/* Comparador Directo: Control de Flujo vs Control de Congestión */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-cyan-500/15 text-cyan-300">
              Protege al Receptor (Equipo Destino)
            </span>
            <span className="font-mono text-sm font-bold text-cyan-400">rwnd (Receive Window)</span>
          </div>
          <h3 className="text-xl font-bold text-white">Control de Flujo</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Evita que el emisor envíe datos a una velocidad superior a la que el <strong className="text-white">equipo receptor</strong> puede procesar en su buffer de memoria. Utiliza la ventana de recepción anunciada en cada encabezado TCP y el mecanismo de ventana deslizante.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-violet-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-violet-500/15 text-violet-300">
              Protege a la Red Intermedia
            </span>
            <span className="font-mono text-sm font-bold text-violet-400">cwnd (Congestion Window)</span>
          </div>
          <h3 className="text-xl font-bold text-white">Control de Congestión</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Evita que el emisor sobrecargue los enlaces, switches y routers de la <strong className="text-white">red entre los extremos</strong>. Utiliza la ventana de congestión (<code className="font-mono">cwnd</code>), <em>Slow Start</em>, <em>Congestion Avoidance</em> y <em>Fast Retransmit</em>.
          </p>
        </div>
      </div>

      {/* Gráfico Interactivo de Mecanismos de Congestión TCP */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              Evolución Dinámica de la Ventana de Congestión TCP (cwnd)
            </h3>
            <p className="text-xs text-slate-400">
              Selecciona cada fase para analizar cómo TCP adapta su velocidad de transmisión en la red escolar.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Ciclo Completo' },
              { id: 'slow_start', label: '1. Slow Start (1 MSS → Exponencial)' },
              { id: 'avoidance', label: '2. Congestion Avoidance (Lineal)' },
              { id: 'retransmit', label: '3. Fast Retransmit (Pérdida detectada)' }
            ].map((phase) => (
              <button
                key={phase.id}
                onClick={() => setCwndPhase(phase.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all ${
                  cwndPhase === phase.id
                    ? 'bg-violet-500 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {phase.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gráfico SVG de la curva cwnd */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <svg viewBox="0 0 600 220" className="w-full h-48 overflow-visible">
              {/* Líneas guía */}
              <line x1="40" y1="190" x2="570" y2="190" stroke="#334155" strokeWidth="1.5" />
              <line x1="40" y1="20" x2="40" y2="190" stroke="#334155" strokeWidth="1.5" />
              {/* Umbral ssthresh */}
              <line x1="40" y1="95" x2="570" y2="95" stroke="#F59E0B" strokeWidth="1" strokeDasharray="5,5" />
              <text x="48" y="88" fill="#F59E0B" fontSize="10" fontFamily="monospace">
                Umbral ssthresh
              </text>

              {/* Fase 1: Slow Start */}
              <path
                d="M 40 180 Q 120 170 190 95"
                fill="none"
                stroke="#00E5FF"
                strokeWidth={cwndPhase === 'slow_start' || cwndPhase === 'all' ? '4' : '1.5'}
                opacity={cwndPhase === 'slow_start' || cwndPhase === 'all' ? '1' : '0.3'}
              />
              <text x="65" y="155" fill="#00E5FF" fontSize="11" fontFamily="monospace" fontWeight="bold">
                Slow Start (1 MSS)
              </text>

              {/* Fase 2: Congestion Avoidance */}
              <path
                d="M 190 95 L 380 35"
                fill="none"
                stroke="#10B981"
                strokeWidth={cwndPhase === 'avoidance' || cwndPhase === 'all' ? '4' : '1.5'}
                opacity={cwndPhase === 'avoidance' || cwndPhase === 'all' ? '1' : '0.3'}
              />
              <text x="220" y="55" fill="#10B981" fontSize="11" fontFamily="monospace" fontWeight="bold">
                Congestion Avoidance
              </text>

              {/* Fase 3: Pérdida y Fast Retransmit */}
              <path
                d="M 380 35 L 400 115 L 550 65"
                fill="none"
                stroke="#F43F5E"
                strokeWidth={cwndPhase === 'retransmit' || cwndPhase === 'all' ? '4' : '1.5'}
                opacity={cwndPhase === 'retransmit' || cwndPhase === 'all' ? '1' : '0.3'}
              />
              <circle cx="380" cy="35" r="5" fill="#F43F5E" />
              <text x="392" y="32" fill="#F43F5E" fontSize="10" fontFamily="monospace" fontWeight="bold">
                3 ACK Duplicados (Fast Retransmit)
              </text>
            </svg>
          </div>

          <div className="lg:col-span-5 space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30">
              <div className="font-mono font-bold text-cyan-300">1. Slow Start (Arranque Lento)</div>
              <p className="text-slate-300 mt-1">
                Comienza con una ventana reducida (generalmente de <strong className="text-white">1 MSS</strong>) y la incrementa progresivamente con cada ACK recibido hasta alcanzar el umbral.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30">
              <div className="font-mono font-bold text-emerald-300">2. Congestion Avoidance (Prevención)</div>
              <p className="text-slate-300 mt-1">
                Superado el umbral, aumenta la tasa de transmisión de forma más moderada (lineal) para evitar saturar los enlaces de la escuela.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30">
              <div className="font-mono font-bold text-rose-300">3. Fast Retransmit (Retransmisión Rápida)</div>
              <p className="text-slate-300 mt-1">
                Permite retransmitir un segmento perdido ante señales de pérdida (ACKs duplicados) sin esperar siempre al vencimiento del temporizador.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desmitificador Técnico: Balanceo PCC en MikroTik hEX RB750Gr3 */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-[#0B0F17] to-slate-900 border border-amber-500/30 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase text-amber-400">
              Aclaración Técnica de Defensa (Sección 9)
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
              MikroTik hEX RB750Gr3 (Balanceo PCC): ¿Por qué una conexión TCP NO suma los 3 proveedores?
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              El balanceo PCC distribuye las conexiones entre <strong className="text-white">WestNet, Starlink y Tachicom</strong>, pero <strong className="text-amber-300">normalmente cada flujo TCP individual se asigna a una única conexión WAN</strong> para mantener la misma IP pública y evitar desorden masivo de paquetes.
            </p>
          </div>

          <button
            onClick={addNewPccFlow}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Zap className="w-4 h-4" />
            <span>Simular Nueva Conexión TCP Escolar</span>
          </button>
        </div>

        {/* Los 3 Proveedores WAN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'WAN 1: WestNet', type: 'Vínculo Principal', color: 'cyan' },
            { name: 'WAN 2: Starlink', type: 'Satelital Baja Latencia', color: 'emerald' },
            { name: 'WAN 3: Tachicom', type: 'Enlace Respaldo / Balanceo', color: 'violet' }
          ].map((wan) => {
            const assignedFlows = pccFlows.filter((f) => wan.name.includes(f.isp));
            return (
              <div key={wan.name} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <div className="text-sm font-bold text-white">{wan.name}</div>
                    <div className="text-[11px] text-slate-400">{wan.type}</div>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                    {assignedFlows.length} Flujos TCP
                  </span>
                </div>

                <div className="space-y-2">
                  {assignedFlows.map((flow) => (
                    <div key={flow.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                      <div className="text-cyan-300 truncate">{flow.src}</div>
                      <div className="text-slate-400 truncate mt-0.5">→ {flow.dst}</div>
                      <div className="text-[10px] text-amber-400 mt-1">Clasificador PCC: {flow.hash}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  // ============================================================================
  // MÓDULO 6: VLANS, SEGURIDAD ACL Y LABORATORIO DHCP RELAY (SECCIÓN 10)
  // ============================================================================
  const renderScene6SecurityAndDhcp = () => {
    const ACL_TESTS = [
      {
        id: 0,
        name: 'Caso 1: Estudiante (VLAN 20) → Nginx HTTPS (TCP 443)',
        src: '172.16.20.10 (VLAN 20)',
        dst: '172.16.10.12:443 (Nginx VLAN 10)',
        proto: 'TCP 443',
        result: 'PERMIT',
        device: 'Cisco Catalyst C9200 ACL Inter-VLAN',
        explanation:
          'Política permitida: Los estudiantes tienen acceso autorizado a los servicios web publicados a través del proxy inverso Nginx por TCP 80/443.'
      },
      {
        id: 1,
        name: 'Caso 2: Estudiante (VLAN 20) → Acceso Directo a Apache (TCP 8080)',
        src: '172.16.20.10 (VLAN 20)',
        dst: '172.16.10.11:8080 (Apache VLAN 10)',
        proto: 'TCP 8080',
        result: 'DENY',
        device: 'Bloqueado por ACL en Cisco Catalyst C9200',
        explanation:
          '¡Acceso Bloqueado! El puerto interno TCP 8080 de Apache no debe exponerse a las VLANs de usuarios. Solo el servidor Nginx (172.16.10.12) tiene permiso en la ACL para alcanzar el puerto 8080.'
      },
      {
        id: 2,
        name: 'Caso 3: Nginx (172.16.10.12) → Apache Backend (TCP 8080)',
        src: '172.16.10.12 (Nginx)',
        dst: '172.16.10.11:8080 (Apache)',
        proto: 'TCP 8080',
        result: 'PERMIT',
        device: 'Tráfico Interno VLAN 10 Permitido',
        explanation:
          'Política permitida: Nginx inicia la segunda conexión TCP interna hacia Apache en el puerto 8080 para obtener el contenido de la aplicación.'
      },
      {
        id: 3,
        name: 'Caso 4: Usuarios Autorizados → Servidor Samba (TCP 445)',
        src: 'VLAN 30 / VLAN 50 Autorizados',
        dst: '172.16.10.13:445 (Samba VLAN 10)',
        proto: 'TCP 445',
        result: 'PERMIT',
        device: 'Cisco Catalyst C9200 ACL',
        explanation:
          'Se prioriza TCP 445 (SMB moderno). Los puertos NetBIOS (TCP 139 y UDP 137/138) permanecen cerrados salvo que una configuración específica de compatibilidad lo requiera.'
      },
      {
        id: 4,
        name: 'Caso 5: Equipos Escolares → Cisco OpenDNS (UDP/TCP 53)',
        src: 'VLANs Internas',
        dst: 'Cisco OpenDNS (Servicio Externo)',
        proto: 'UDP 53 / TCP 53',
        result: 'PERMIT',
        device: 'Firewall Perimetral Cisco Meraki MX100',
        explanation:
          'El Meraki MX100 permite las consultas DNS salientes hacia Cisco OpenDNS en UDP 53 (y TCP 53 cuando corresponda) para garantizar resolución y filtrado de contenido.'
      }
    ];

    const currentAcl = ACL_TESTS[selectedAclTest];

    return (
      <section id="modulo-6" className="space-y-8 animate-fadeIn">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-rose-400">
              Módulo 6 • Sección 10 del Informe
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              VLANs, Políticas ACL por Puerto y el Caso Crítico de DHCP Relay
            </h2>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
            Enrutamiento Inter-VLAN en Cisco Catalyst C9200
          </span>
        </div>

        {/* Simulador de Reglas ACL por Puerto TCP/UDP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Simulador de Políticas de Acceso (Haz clic para probar el tráfico)
            </h3>

            <div className="space-y-2.5">
              {ACL_TESTS.map((test, idx) => (
                <button
                  key={test.id}
                  onClick={() => setSelectedAclTest(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selectedAclTest === idx
                      ? test.result === 'PERMIT'
                        ? 'bg-emerald-500/15 border-emerald-400'
                        : 'bg-rose-500/20 border-rose-400'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">{test.name}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {test.src} → {test.dst}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded shrink-0 ${
                      test.result === 'PERMIT'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {test.result}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Resultado de la Inspección ACL */}
          <div className="lg:col-span-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">{currentAcl.device}</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                    currentAcl.result === 'PERMIT'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  }`}
                >
                  {currentAcl.result === 'PERMIT' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {currentAcl.result === 'PERMIT' ? 'TRÁFICO PERMITIDO (PERMIT)' : 'TRÁFICO BLOQUEADO (ACL DENY)'}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white">{currentAcl.name}</h3>

              <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">ORIGEN</div>
                  <div className="text-white mt-0.5">{currentAcl.src}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">PROTOCOLO/PUERTO</div>
                  <div className="text-cyan-300 font-bold mt-0.5">{currentAcl.proto}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">DESTINO</div>
                  <div className="text-white mt-0.5">{currentAcl.dst}</div>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border text-sm leading-relaxed ${
                  currentAcl.result === 'PERMIT'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-200'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-100'
                }`}
              >
                {currentAcl.explanation}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
              ! Ejemplo ACL Extendida en Cisco Catalyst C9200:{'\n'}
              <div className="text-emerald-400 mt-1">
                permit tcp host 172.16.10.12 host 172.16.10.11 eq 8080
              </div>
              <div className="text-rose-400">
                deny tcp 172.16.20.0 0.0.0.255 host 172.16.10.11 eq 8080
              </div>
            </div>
          </div>
        </div>

        {/* Laboratorio Interactivo Crítico: DHCP Relay (ip helper-address 172.16.10.14) */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-[#0B0F17] to-slate-900 border border-cyan-500/30 p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-amber-400">
                Condición Crítica de Implementación (Sección 10)
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                Laboratorio DHCP Relay: ¿Cómo llegan los Broadcasts UDP 67/68 a la VLAN 10?
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                El servidor Windows DHCP (<code className="font-mono text-amber-300">172.16.10.14</code>) está en la{' '}
                <strong className="text-white">VLAN 10</strong>, mientras que los clientes están en las{' '}
                <strong className="text-white">VLAN 20, 30 y 50</strong>. Los mensajes DHCP iniciales se envían por broadcast y no atraviesan automáticamente un router.
              </p>
            </div>

            {/* Toggle Interactivo DHCP Relay */}
            <div className="inline-flex p-1.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
              <button
                onClick={() => setDhcpRelayEnabled(false)}
                className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  !dhcpRelayEnabled
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SIN DHCP Relay (Falla)
              </button>
              <button
                onClick={() => setDhcpRelayEnabled(true)}
                className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  dhcpRelayEnabled
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                CON ip helper-address (Activo)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Visualización del Camino del Paquete UDP 68 -> 67 */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Paso 1: Cliente en VLAN 20/30/50 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-mono text-cyan-400">1. Cliente VLAN 20 / 30 / 50</div>
                <div className="text-sm font-bold text-white">Envía DHCP Discover</div>
                <div className="text-xs font-mono text-slate-300">
                  Origen: <span className="text-amber-300">0.0.0.0 : UDP 68</span>
                </div>
                <div className="text-xs font-mono text-slate-300">
                  Destino: <span className="text-amber-300">255.255.255.255 : UDP 67</span>
                </div>
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                  Trama Broadcast L2
                </span>
              </div>

              {/* Paso 2: Switch Capa 3 Cisco Catalyst C9200 */}
              <div
                className={`p-4 rounded-xl border space-y-2 transition-all ${
                  dhcpRelayEnabled
                    ? 'bg-cyan-500/10 border-cyan-400'
                    : 'bg-rose-500/15 border-rose-500'
                }`}
              >
                <div className="text-xs font-mono text-white font-bold">2. Cisco Catalyst C9200 (SVI)</div>
                <div className="text-sm font-bold text-white">
                  {dhcpRelayEnabled ? 'DHCP Relay Convierte a Unicast' : '✕ Broadcast Detenido en L3'}
                </div>
                <p className="text-xs text-slate-300">
                  {dhcpRelayEnabled
                    ? 'La interfaz VLAN intercepta el broadcast UDP 67 y lo reenvía como paquete Unicast hacia 172.16.10.14.'
                    : 'Por diseño de red, los broadcasts no cruzan hacia la VLAN 10. El cliente queda sin dirección IP (APIPA 169.254.x.x).'}
                </p>
              </div>

              {/* Paso 3: Servidor Windows DHCP en VLAN 10 */}
              <div
                className={`p-4 rounded-xl border space-y-2 transition-all ${
                  dhcpRelayEnabled
                    ? 'bg-emerald-500/15 border-emerald-400 opacity-100'
                    : 'bg-slate-950 border-slate-800 opacity-40'
                }`}
              >
                <div className="text-xs font-mono text-emerald-400">3. Windows DHCP (VLAN 10)</div>
                <div className="text-sm font-bold text-white">172.16.10.14 (UDP 67)</div>
                <p className="text-xs text-slate-300">
                  {dhcpRelayEnabled
                    ? '✓ Recibe la petición y completa el ciclo DORA (Offer, Request, ACK) entregando IP, máscara, gateway y DNS.'
                    : 'Nunca se entera de la solicitud del cliente porque el broadcast murió en la VLAN de origen.'}
                </p>
              </div>
            </div>

            {/* Consola CLI Cisco IOS del C9200 */}
            <div className="lg:col-span-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  C9200-Core-Corralitos(config)#
                </span>
                <span className="text-[10px] text-emerald-400">Cisco IOS XE</span>
              </div>
              <div className="text-slate-300">interface Vlan20</div>
              <div className="text-slate-400 pl-3">description Red_Estudiantes</div>
              <div className="text-slate-300 pl-3">ip address 172.16.20.1 255.255.255.0</div>
              {dhcpRelayEnabled ? (
                <div className="text-emerald-400 font-bold pl-3 bg-emerald-500/10 py-1 px-2 rounded border border-emerald-500/30">
                  ip helper-address 172.16.10.14
                </div>
              ) : (
                <div className="text-rose-400 line-through pl-3 opacity-70">
                  ! ip helper-address 172.16.10.14 (Faltante)
                </div>
              )}
              <div className="text-slate-400 pt-1 text-[11px]">
                ! Repetir en interface Vlan30 (Maestros) e interface Vlan50 (Administración)
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // ============================================================================
  // ESCENA 7: CONCLUSIÓN INTEGRADORA Y DEFENSA ORAL (SECCIÓN 11)
  // ============================================================================
  const renderScene7Conclusion = () => (
    <section id="modulo-7" className="space-y-8 animate-fadeIn">
      {/* Banner de Conclusión */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#0B0F17] to-emerald-950/30 border border-emerald-500/30 p-6 sm:p-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono uppercase">
          <CheckCircle2 className="w-4 h-4" />
          Sección 11 • Conclusión del Informe
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
          Síntesis: La Capa de Transporte como Eje Articulador de la Escuela 4-025 Los Corralitos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300 leading-relaxed">
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="font-mono text-xs uppercase text-cyan-400 font-bold">1. Diferenciación de Servicios</div>
            <p className="text-xs sm:text-sm">
              Hace posible que cada equipo estudiantil, docente o administrativo se comunique con el proceso correcto mediante puertos, eligiendo <strong className="text-white">TCP</strong> para la confiabilidad de Nginx, Apache y Samba, y <strong className="text-white">UDP</strong> para la agilidad de DHCP y OpenDNS.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="font-mono text-xs uppercase text-emerald-400 font-bold">2. Seguridad y Mínimo Privilegio</div>
            <p className="text-xs sm:text-sm">
              La planificación de puertos permite definir ACLs precisas en el <strong className="text-white">Cisco Catalyst C9200</strong> y reglas en el <strong className="text-white">Meraki MX100</strong>, aislando el puerto interno <code className="font-mono text-emerald-300">TCP 8080</code> de Apache detrás del proxy inverso Nginx.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="font-mono text-xs uppercase text-amber-400 font-bold">3. Integración con Capa 3 y WAN</div>
            <p className="text-xs sm:text-sm">
              Permite comprender por qué la arquitectura requiere medidas complementarias como el <code className="font-mono text-amber-300">ip helper-address</code> para cruzar VLANs con DHCP y cómo interactúa el control de congestión TCP con el balanceo PCC del <strong className="text-white">MikroTik RB750Gr3</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Banco Interactivo de Preguntas de Defensa Oral */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            Preguntas Clave para la Defensa Oral ante la Cátedra
          </h3>
          <span className="text-xs font-mono text-slate-400">Respuestas fundamentadas en el informe</span>
        </div>

        <div className="space-y-3">
          {ORAL_DEFENSE_QA.map((item, idx) => {
            const isOpen = openQaIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenQaIndex(isOpen ? -1 : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-bold text-white">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 bg-cyan-500/5">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  // ============================================================================
  // LAYOUT GENERAL, HEADER SUPERIOR Y BARRA DE CONTROL TIPO KEYNOTE
  // ============================================================================

  const activeSceneObj = SCENES[currentScene];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Barra Superior Fija */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Identidad Izquierda */}
          <div
            onClick={() => setCurrentScene(0)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center text-slate-950 font-extrabold shadow-md shadow-cyan-500/20">
              L4
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                <span>CAPA DE TRANSPORTE</span>
                <span className="hidden md:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                  4-025 Escuela Los Corralitos
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                UTN FRM • Redes de Datos • Tonelli / Cutuli
              </div>
            </div>
          </div>

          {/* Controles Superiores Derecha */}
          <div className="flex items-center gap-2.5">
            {viewMode === 'presentation' && (
              <button
                onClick={() => setShowSpeakerNotes((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all flex items-center gap-1.5 cursor-pointer ${
                  showSpeakerNotes
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guía Orador</span>
              </button>
            )}

            <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setViewMode('presentation')}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  viewMode === 'presentation'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Modo Exposición
              </button>
              <button
                onClick={() => setViewMode('scroll')}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  viewMode === 'scroll'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Scroll Completo
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Progreso de Exposición */}
        {viewMode === 'presentation' && (
          <div className="w-full h-1 bg-slate-900">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-500 transition-all duration-300"
              style={{ width: `${((currentScene + 1) / SCENES.length) * 100}%` }}
            />
          </div>
        )}
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 pb-28">
        {/* Notas de Orador (Speaker Notes) para guiar la defensa oral */}
        {viewMode === 'presentation' && showSpeakerNotes && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-200">
                <span className="font-mono font-bold uppercase text-amber-300 mr-2">
                  Guía de Defensa Oral ({activeSceneObj.sections}):
                </span>
                {activeSceneObj.speakerNotes}
              </div>
            </div>
            <button
              onClick={() => setShowSpeakerNotes(false)}
              className="text-xs font-mono text-slate-400 hover:text-white shrink-0 cursor-pointer"
            >
              Ocultar
            </button>
          </div>
        )}

        {/* Renderizado según el modo elegido */}
        {viewMode === 'presentation' ? (
          <>
            {currentScene === 0 && renderScene0Hero()}
            {currentScene === 1 && renderScene1Infrastructure()}
            {currentScene === 2 && renderScene2Headers()}
            {currentScene === 3 && renderScene3PortsAndProxy()}
            {currentScene === 4 && renderScene4Simulator()}
            {currentScene === 5 && renderScene5CongestionAndPcc()}
            {currentScene === 6 && renderScene6SecurityAndDhcp()}
            {currentScene === 7 && renderScene7Conclusion()}
          </>
        ) : (
          <div className="space-y-20">
            {renderScene0Hero()}
            {renderScene1Infrastructure()}
            {renderScene2Headers()}
            {renderScene3PortsAndProxy()}
            {renderScene4Simulator()}
            {renderScene5CongestionAndPcc()}
            {renderScene6SecurityAndDhcp()}
            {renderScene7Conclusion()}
          </div>
        )}
      </main>

      {/* Barra de Control Fija Inferior estilo Keynote / Presentación */}
      <footer className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-800/90 bg-[#0B0F17]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Botón Escena Anterior */}
          <button
            onClick={() => {
              setViewMode('presentation');
              handlePrevScene();
            }}
            disabled={viewMode === 'presentation' && currentScene === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-xs font-mono text-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {/* Selector Rápido de Escenas (Dock Inferior) */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            {SCENES.map((scene) => {
              const isActive = viewMode === 'presentation' && currentScene === scene.id;
              return (
                <button
                  key={scene.id}
                  onClick={() => {
                    if (viewMode === 'presentation') {
                      setCurrentScene(scene.id);
                    } else if (scene.id === 0) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      document.getElementById(`modulo-${scene.id}`)?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800/80'
                  }`}
                >
                  {scene.short}
                </button>
              );
            })}
          </div>

          {/* Botón Siguiente Escena */}
          <button
            onClick={() => {
              setViewMode('presentation');
              handleNextScene();
            }}
            disabled={viewMode === 'presentation' && currentScene === SCENES.length - 1}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-xs font-mono font-bold text-slate-950 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}