import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  Layers, 
  Cpu, 
  Server, 
  Laptop, 
  ShieldCheck, 
  AlertOctagon, 
  Play, 
  RotateCcw, 
  Binary, 
  Search, 
  Hash,
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle2
} from 'lucide-react';

interface ServiceDetail {
  id: string;
  nombre: string;
  ip: string;
  vlan: string;
  proto: 'TCP' | 'UDP';
  puertos: string;
  rol: string;
  justificacion: string;
  seguridad: string;
}

const SERVICIOS: ServiceDetail[] = [
  {
    id: 'nginx',
    nombre: 'Nginx (Front-End & Proxy)',
    ip: '172.16.10.12',
    vlan: 'VLAN 10',
    proto: 'TCP',
    puertos: 'TCP 80 y 443',
    rol: 'Front-End público y terminación TLS',
    justificacion: 'TCP garantiza entrega sin pérdidas para páginas web y portales.',
    seguridad: 'Escucha frente a usuarios (VLAN 20, 30 y 50).'
  },
  {
    id: 'apache',
    nombre: 'Apache (Web Backend)',
    ip: '172.16.10.11',
    vlan: 'VLAN 10',
    proto: 'TCP',
    puertos: 'TCP 8080 (Interno)',
    rol: 'Servidor interno de aplicaciones web',
    justificacion: 'Puerto registrado 8080 aislado; no expuesto a usuarios.',
    seguridad: 'Bloqueado por ACL en Cisco C9200: solo acepta conexiones de Nginx.'
  },
  {
    id: 'samba',
    nombre: 'Samba (Archivos SMB)',
    ip: '172.16.10.13',
    vlan: 'VLAN 10',
    proto: 'TCP',
    puertos: 'TCP 445 (SMB directo)',
    rol: 'Carpetas compartidas para docentes y administración',
    justificacion: 'TCP retransmite segmentos perdidos evitando archivos dañados.',
    seguridad: 'Prioriza TCP 445 moderno; NetBIOS (139/137/138) opcional.'
  },
  {
    id: 'dhcp',
    nombre: 'Windows Server DHCP',
    ip: '172.16.10.14',
    vlan: 'VLAN 10',
    proto: 'UDP',
    puertos: 'UDP 67 (Srv) / 68 (Clt)',
    rol: 'Asignación dinámica de IP a las VLANs',
    justificacion: 'UDP sin conexión permite peticiones broadcast sin IP previa.',
    seguridad: 'Requiere "ip helper-address 172.16.10.14" en Cisco C9200.'
  },
  {
    id: 'dns',
    nombre: 'Cisco OpenDNS',
    ip: '208.67.222.222',
    vlan: 'WAN Externa',
    proto: 'UDP',
    puertos: 'UDP 53 (TCP 53 >512B)',
    rol: 'Resolución de nombres y filtrado perimetral',
    justificacion: 'UDP 53 da mínima latencia en consultas frecuentes.',
    seguridad: 'Firewall Cisco Meraki MX100 inspecciona el tráfico saliente.'
  }
];

export const Slide1PortsAndServers: React.FC = () => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('nginx');
  const [aclTestState, setAclTestState] = useState<'idle' | 'allowed' | 'blocked'>('idle');
  const [flowPulse, setFlowPulse] = useState<number>(0);

  // Animación continua y suave del ciclo de 4 pasos (Doble Salto TCP)
  useEffect(() => {
    const timer = setInterval(() => {
      setFlowPulse((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const selectedService = SERVICIOS.find((s) => s.id === selectedServiceId) || SERVICIOS[0];

  const handleTestAllowed = () => {
    setAclTestState('allowed');
  };

  const handleTestBlocked = () => {
    setAclTestState('blocked');
  };

  return (
    <section className="apple-pro-canvas apple-slide-canvas relative p-4 sm:p-5 space-y-4 animate-fadeIn">
      {/* Encabezado Conciso Cupertino */}
      <div className="apple-bento flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[13px] bg-gradient-to-b from-[#0A84FF] to-[#0071E3] border border-[#0058B8]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_10px_-2px_rgba(0,113,227,0.35)] flex items-center justify-center text-white shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F] tracking-tight leading-tight">
              Puertos, Servicios Centrales y Proxy Inverso
            </h2>
            <p className="text-xs sm:text-[13px] text-[#515154] font-medium mt-0.5">
              Identificación de procesos en Capa 4 • Reglas de acceso Switch C9200 • Escuela 4-025
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold text-[#1D1D1F] bg-[#F5F5F7] px-3.5 py-1.5 rounded-full border border-black/[0.08] hidden sm:inline-flex items-center gap-1.5 shrink-0">
          <span>Capa de Transporte</span>
          <span className="text-[#8E8E93]">•</span>
          <span className="font-mono text-[#0071E3]">16 bits (0–65535)</span>
        </div>
      </div>

      {/* BLOQUE DESTACADO: CONCEPTO L4 VS L3 Y CLASIFICACIÓN DE PUERTOS */}
      <div className="apple-bento p-4 sm:p-5 space-y-3">
        {/* Definición Conceptual Exacta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0071E3] shrink-0"></span>
            <p className="text-[#3A3A3C] text-xs sm:text-[13.5px] leading-snug">
              <strong className="text-[#1D1D1F]">La dirección IP identifica al equipo;</strong> el <strong className="text-[#0071E3]">puerto identifica el servicio o proceso de comunicación</strong> dentro de ese equipo.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#515154] shrink-0">
            <span>Rango de <strong className="text-[#1D1D1F]">16 bits</strong>:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-[#F5F5F7] text-[#1D1D1F] font-mono font-bold border border-black/[0.08]">0 a 65535</span>
          </div>
        </div>

        {/* Las 3 Clasificaciones de Puertos IANA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* 1. Conocidos */}
          <div className="p-3 rounded-2xl bg-[#0071E3]/[0.05] border border-[#0071E3]/20 flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0071E3] shrink-0 mt-1"></span>
            <div>
              <div className="text-[#0058B8] text-[13px] font-bold">Conocidos (0 – 1023)</div>
              <div className="text-xs text-[#3A3A3C] mt-1 leading-relaxed">
                Servicios del sistema y puertos estándar: <span className="font-mono font-semibold text-[#1D1D1F]">HTTP 80, HTTPS 443, SMB 445, DHCP 67/68, DNS 53</span>.
              </div>
            </div>
          </div>

          {/* 2. Registrados */}
          <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1"></span>
            <div>
              <div className="text-amber-900 text-[13px] font-bold">Registrados (1024 – 49151)</div>
              <div className="text-xs text-[#3A3A3C] mt-1 leading-relaxed">
                Servicios y aplicaciones específicas: <span className="font-mono font-semibold text-[#1D1D1F]">Apache interno en puerto TCP 8080</span>.
              </div>
            </div>
          </div>

          {/* 3. Dinámicos o Privados */}
          <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 mt-1"></span>
            <div>
              <div className="text-emerald-900 text-[13px] font-bold">Dinámicos o Privados (49152 – 65535)</div>
              <div className="text-xs text-[#3A3A3C] mt-1 leading-relaxed">
                Asignados por el SO al cliente para sesiones salientes (<span className="font-mono font-semibold text-[#1D1D1F]">efímeros, ej. 53000</span>).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal: 2 Columnas de igual altura */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* COLUMNA IZQUIERDA: MATRIZ DE SERVICIOS (L4) */}
        <div className="lg:col-span-6 apple-bento p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5 mb-3">
              <div className="flex items-center gap-2 text-emerald-800 text-xs sm:text-[13px] font-bold tracking-tight">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>Servicios Centrales de la Escuela</span>
              </div>
              <span className="text-[11px] font-semibold text-[#515154] bg-[#F5F5F7] px-2.5 py-0.5 rounded-full border border-black/[0.07]">
                VLAN 10 &amp; WAN
              </span>
            </div>

            {/* Lista interactiva */}
            <div className="space-y-2">
              {SERVICIOS.map((s) => {
                const isSelected = selectedServiceId === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 select-none ${
                      isSelected
                        ? 'bg-[#0071E3]/[0.06] border-[#0071E3]/50 shadow-[0_2px_10px_-2px_rgba(0,113,227,0.18)] ring-2 ring-[#0071E3]/15'
                        : 'bg-[#F5F5F7]/75 border-black/[0.06] hover:bg-white hover:border-black/[0.14]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border shrink-0 ${
                        s.proto === 'TCP'
                          ? 'bg-sky-100 text-sky-900 border-sky-200'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                      }`}>
                        {s.proto}
                      </span>
                      <span className="font-semibold text-[#1D1D1F] text-xs sm:text-[13px] truncate">{s.nombre}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#1D1D1F] bg-white px-2.5 py-0.5 rounded-lg border border-black/[0.08] shrink-0">
                      {s.puertos}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ficha técnica del servicio seleccionado */}
          <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-1.5">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-black/[0.07]">
              <span className="text-[#1D1D1F] font-bold text-[13px]">{selectedService.nombre}</span>
              <span className="text-[#0071E3] font-mono font-bold">{selectedService.ip}</span>
            </div>
            <div className="text-[#3A3A3C] text-xs leading-relaxed">
              • <strong className="text-[#1D1D1F]">Rol:</strong> {selectedService.rol}
            </div>
            <div className="text-[#3A3A3C] text-xs leading-relaxed">
              • <strong className="text-[#0071E3]">Justificación {selectedService.proto}:</strong> {selectedService.justificacion}
            </div>
            <div className="text-[#3A3A3C] text-xs leading-relaxed">
              • <strong className="text-amber-800">Seguridad:</strong> {selectedService.seguridad}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: PROXY INVERSO & POLÍTICAS DE ACCESO (C9200) */}
        <div className="lg:col-span-6 apple-bento p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5 mb-3">
              <div className="flex items-center gap-2 text-[#0071E3] text-xs sm:text-[13px] font-bold tracking-tight">
                <ShieldCheck className="w-4 h-4" />
                <span>Proxy Inverso: Flujo Alumno → Nginx → Apache</span>
              </div>
              <span className="text-[11px] font-semibold text-[#515154] bg-[#F5F5F7] px-2.5 py-0.5 rounded-full border border-black/[0.07]">
                Doble Conexión TCP
              </span>
            </div>

            {/* DIAGRAMA DE 3 NODOS CON FLECHAS DE FLUJO ANIMADAS */}
            <div className="p-3 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2.5 mb-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-xs">
                {/* Nodo 1: PC Alumno */}
                <div className={`p-2.5 rounded-2xl border text-center space-y-1 transition-all duration-300 bg-white ${
                  flowPulse === 0 || flowPulse === 3
                    ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20 shadow-sm'
                    : 'border-black/[0.08]'
                }`}>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold inline-block">
                    PC Alumno
                  </span>
                  <div className="font-mono font-bold text-[#1D1D1F] text-xs">172.16.20.10</div>
                  <div className="text-[11px] text-[#3A3A3C]">
                    Origen: <strong className="font-mono text-[#0071E3]">:53000</strong>
                  </div>
                  <span className="text-[10.5px] font-medium text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-200 block">
                    Puerto dinámico
                  </span>
                </div>

                {/* Flechas entre Alumno y Nginx (① y ④) */}
                <div className="flex md:flex-col items-center justify-center gap-1.5 px-1 shrink-0">
                  <motion.div
                    animate={flowPulse === 0 ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                    transition={{ duration: 0.45 }}
                    className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border transition-all duration-300 ${
                      flowPulse === 0
                        ? 'bg-[#0071E3] text-white border-[#0058B8] shadow-sm ring-2 ring-[#0071E3]/25'
                        : 'text-[#0071E3] bg-white border-sky-200'
                    }`}
                  >
                    <span>① :443</span>
                    <ArrowRight className="w-3 h-3" />
                  </motion.div>

                  <motion.div
                    animate={flowPulse === 3 ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                    transition={{ duration: 0.45 }}
                    className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border transition-all duration-300 ${
                      flowPulse === 3
                        ? 'bg-[#189E32] text-white border-[#14802A] shadow-sm ring-2 ring-emerald-500/25'
                        : 'text-emerald-800 bg-white border-emerald-200'
                    }`}
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>④ :53000</span>
                  </motion.div>
                </div>

                {/* Nodo 2: Nginx Proxy */}
                <div className="p-2.5 rounded-2xl bg-white border border-black/[0.12] text-center space-y-1 shadow-xs">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1D1D1F] text-white font-bold inline-block">
                    Nginx Proxy
                  </span>
                  <div className="font-mono font-bold text-[#1D1D1F] text-xs">172.16.10.12</div>
                  <div className="text-[11px] text-[#0071E3] font-medium">
                    Escucha: <strong className="font-mono">:443</strong>
                  </div>
                  <div className="text-[11px] text-amber-800 font-medium">
                    Sale por: <strong className="font-mono">:49820</strong>
                  </div>
                </div>

                {/* Flechas entre Nginx y Apache (② y ③) */}
                <div className="flex md:flex-col items-center justify-center gap-1.5 px-1 shrink-0">
                  <motion.div
                    animate={flowPulse === 1 ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                    transition={{ duration: 0.45 }}
                    className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border transition-all duration-300 ${
                      flowPulse === 1
                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400/30'
                        : 'text-amber-800 bg-white border-amber-200'
                    }`}
                  >
                    <span>② :8080</span>
                    <ArrowRight className="w-3 h-3" />
                  </motion.div>

                  <motion.div
                    animate={flowPulse === 2 ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                    transition={{ duration: 0.45 }}
                    className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border transition-all duration-300 ${
                      flowPulse === 2
                        ? 'bg-amber-700 text-white border-amber-800 shadow-sm ring-2 ring-amber-400/30'
                        : 'text-amber-800 bg-white border-amber-200'
                    }`}
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>③ HTML</span>
                  </motion.div>
                </div>

                {/* Nodo 3: Apache Backend */}
                <div className={`p-2.5 rounded-2xl border text-center space-y-1 transition-all duration-300 bg-white ${
                  flowPulse === 1 || flowPulse === 2
                    ? 'border-amber-500 ring-2 ring-amber-400/25 shadow-sm'
                    : 'border-black/[0.08]'
                }`}>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold inline-block">
                    Apache Backend
                  </span>
                  <div className="font-mono font-bold text-[#1D1D1F] text-xs">172.16.10.11</div>
                  <div className="text-[11px] text-[#3A3A3C]">
                    Escucha: <strong className="font-mono text-amber-800">:8080</strong>
                  </div>
                  <span className="text-[10.5px] font-medium text-[#515154] bg-[#F5F5F7] px-1.5 py-0.5 rounded-md border border-black/[0.06] block">
                    Aislado por C9200
                  </span>
                </div>
              </div>

              {/* Leyenda inmediata de los 4 pasos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 text-[11.5px] border-t border-black/[0.06]">
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  flowPulse === 0 ? 'bg-white text-[#1D1D1F] font-semibold border border-[#0071E3]/40 shadow-xs' : 'text-[#515154]'
                }`}>
                  <strong className={flowPulse === 0 ? 'text-[#0071E3]' : 'text-[#1D1D1F]'}>① Petición TLS:</strong> Alumno (:53000) → Nginx (:443).
                </div>
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  flowPulse === 1 ? 'bg-white text-[#1D1D1F] font-semibold border border-amber-400 shadow-xs' : 'text-[#515154]'
                }`}>
                  <strong className={flowPulse === 1 ? 'text-amber-700' : 'text-[#1D1D1F]'}>② Proxy Pass:</strong> Nginx (:49820) → Apache (:8080).
                </div>
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  flowPulse === 2 ? 'bg-white text-[#1D1D1F] font-semibold border border-amber-400 shadow-xs' : 'text-[#515154]'
                }`}>
                  <strong className={flowPulse === 2 ? 'text-amber-700' : 'text-[#1D1D1F]'}>③ Respuesta Backend:</strong> Apache devuelve HTML a Nginx.
                </div>
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  flowPulse === 3 ? 'bg-white text-[#1D1D1F] font-semibold border border-emerald-400 shadow-xs' : 'text-[#515154]'
                }`}>
                  <strong className={flowPulse === 3 ? 'text-emerald-700' : 'text-[#1D1D1F]'}>④ Entrega Cifrada:</strong> Nginx cifra y responde al alumno.
                </div>
              </div>
            </div>

            {/* Selector de Prueba de Tráfico: Permitido vs Bloqueado */}
            <div className="p-3 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2 mb-2.5">
              <div className="text-xs font-semibold text-[#3A3A3C]">
                Probar Políticas de Acceso en Switch Cisco C9200:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleTestAllowed}
                  className={`apple-btn px-3 py-2 rounded-xl text-xs ${
                    aclTestState === 'allowed'
                      ? 'apple-btn-emerald'
                      : 'apple-btn-secondary'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${aclTestState === 'allowed' ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Alumno → Nginx (:443)</span>
                </button>

                <button
                  onClick={handleTestBlocked}
                  className={`apple-btn px-3 py-2 rounded-xl text-xs ${
                    aclTestState === 'blocked'
                      ? 'apple-btn-rose'
                      : 'apple-btn-secondary'
                  }`}
                >
                  <AlertOctagon className={`w-4 h-4 ${aclTestState === 'blocked' ? 'text-white' : 'text-rose-600'}`} />
                  <span>Alumno → Apache (:8080)</span>
                </button>
              </div>
            </div>

            {/* Banner de Resultado de la Evaluación del C9200 */}
            {aclTestState === 'allowed' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 mb-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>PERMITIDO:</strong> C9200 enruta a Nginx (<span className="font-mono">172.16.10.12:443</span>). Tráfico autorizado.</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10.5px] font-bold shrink-0">ACCEPT</span>
              </motion.div>
            )}

            {aclTestState === 'blocked' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 mb-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                  <span><strong>BLOQUEADO POR ACL:</strong> C9200 rechaza acceso directo a Apache (<span className="font-mono">:8080</span>) desde VLAN 20.</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10.5px] font-bold shrink-0">DROP</span>
              </motion.div>
            )}
          </div>

          {/* ¿Por qué usamos un proxy inverso? */}
          <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-1.5">
            <div className="text-[#0071E3] font-bold text-xs sm:text-[13px]">
              ¿Por qué usamos un proxy inverso?
            </div>
            <ul className="text-[#3A3A3C] text-xs space-y-1 leading-relaxed list-disc list-inside">
              <li>Punto de entrada único para los servicios web escolares.</li>
              <li>Apache queda aislado y protegido frente a conexiones directas.</li>
              <li>Nginx centraliza certificados y recepción de sesiones HTTPS.</li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
};
