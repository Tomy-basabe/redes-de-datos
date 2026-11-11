import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, 
  Shield, 
  Router as RouterIcon, 
  Globe, 
  Wifi, 
  CheckCircle2, 
  AlertTriangle, 
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { VLANS_TP1, SERVICIOS_TRANSPORTE, EQUIPAMIENTO_TP1, ISPS_TP1 } from '../../data/topologyTp1';

export const Section10TopologyTp1: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string>('c9200');

  const currentDev = EQUIPAMIENTO_TP1.find((d) => d.id === selectedDevice) || EQUIPAMIENTO_TP1[0];

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold block">
            Sección 10 • Aplicación al Proyecto de Red de la Escuela
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold apple-headline text-white mt-1">
            Topología TP1: Escuela 4-025 Los Corralitos
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-3xl">
            Integración de los protocolos de transporte sobre el diseño de red oficial: núcleo L3 Cisco Catalyst C9200, firewall perimetral Meraki MX100, router MikroTik multi-enlace y segmentación de las 4 VLANs.
          </p>
        </div>

        <div className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
          Gabinete MDF • Piso Tecnológico
        </div>
      </div>

      {/* Regla Fundamental de Arquitectura (No confusión de roles) */}
      <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-xs font-mono text-zinc-300 space-y-1">
        <strong className="text-cyan-300 block font-sans text-sm">Principio Arquitectónico Fundamental (Cátedra de Redes):</strong>
        <p className="leading-relaxed font-sans">
          Los switches y routers de la infraestructura (<strong className="text-white">C9200, Meraki y MikroTik</strong>) encaminan o filtran tramas y paquetes, pero <strong>no ejecutan los protocolos de transporte extremo a extremo</strong> en nombre de las aplicaciones. La comunicación lógica TCP/UDP, el cálculo de secuencia, el checksum y las ventanas residen exclusivamente en los equipos terminales: las computadoras de alumnos/docentes y los servidores de la VLAN 10.
        </p>
      </div>

      {/* Selector de Dispositivos de Infraestructura del TP1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EQUIPAMIENTO_TP1.map((eq) => {
          const isSelected = selectedDevice === eq.id;
          return (
            <div
              key={eq.id}
              onClick={() => setSelectedDevice(eq.id)}
              className={`p-6 rounded-[28px] border transition-all cursor-pointer ${
                isSelected
                  ? 'apple-glass border-cyan-400/80 bg-white/[0.06] shadow-xl shadow-cyan-500/10'
                  : 'apple-glass border-white/[0.06] hover:border-white/[0.14]'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {eq.id === 'c9200' && <RouterIcon className="w-6 h-6 text-cyan-400" />}
                {eq.id === 'meraki' && <Shield className="w-6 h-6 text-rose-400" />}
                {eq.id === 'mikrotik' && <Globe className="w-6 h-6 text-amber-400" />}
                <div>
                  <div className="text-sm font-bold text-white font-mono">{eq.nombre}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{eq.ubicacion}</div>
                </div>
              </div>
              <div className="text-xs text-zinc-300 font-sans mt-2">{eq.funcionTP1}</div>
            </div>
          );
        })}
      </div>

      {/* Detalle Técnico del Dispositivo Seleccionado */}
      <div className="p-6 sm:p-8 rounded-[32px] apple-glass border border-white/[0.08] space-y-3">
        <span className="text-xs font-mono uppercase text-cyan-400 font-semibold block">
          Impacto en la Capa de Transporte • {currentDev.nombre}
        </span>
        <p className="text-sm font-sans text-white leading-relaxed">
          {currentDev.rolTransporte}
        </p>
      </div>

      {/* Tabla Oficial de las 4 VLANs del TP1 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white font-display">
          Segmentación Lógica Oficial del TP1 (VLANs & Subredes)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VLANS_TP1.map((vlan) => (
            <div
              key={vlan.id}
              className="p-6 rounded-[28px] apple-glass border border-white/[0.08] space-y-3"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  VLAN {vlan.id} • {vlan.nombre}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300">
                  {vlan.cidr}
                </span>
              </div>

              <div className="space-y-1 text-xs font-mono text-zinc-400">
                <div>Red: <strong className="text-white">{vlan.subred}</strong> | Máscara: {vlan.mascara}</div>
                <div>Gateway SVI: <strong className="text-cyan-300">{vlan.gateway}</strong></div>
                <div>Rango Útil: {vlan.rangoHost}</div>
                <div>Host Lógico de Prueba: <strong className="text-emerald-400">{vlan.hostEjemploLogico}</strong></div>
              </div>

              <p className="text-xs font-sans text-zinc-300 pt-1">
                {vlan.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Matriz Oficial de Servicios en VLAN 10 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white font-display">
            Planificación Oficial de Servidores en VLAN 10 (172.16.10.0/26)
          </h3>
          <span className="text-xs font-mono text-zinc-500">5 Servicios Documentados</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICIOS_TRANSPORTE.map((srv, idx) => (
            <div
              key={idx}
              className="p-5 rounded-[26px] apple-glass border border-white/[0.08] space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">{srv.nombre}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    srv.protocolo === 'TCP' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {srv.protocolo}
                  </span>
                </div>

                <div className="text-xs font-mono text-cyan-400 font-bold">{srv.ip}</div>
                <div className="text-xs font-mono text-zinc-300">{srv.puertoTransporte}</div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 block w-fit">
                  {srv.estadoImplementacion}
                </span>

                <p className="text-xs font-sans text-zinc-300 pt-1 leading-relaxed">
                  {srv.rol}
                </p>
              </div>

              <div className="pt-2 border-t border-white/[0.04] text-[11px] font-mono text-zinc-400">
                {srv.justificacionL4}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Los 3 Proveedores WAN Balanceados por MikroTik PCC */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white font-display">
          Multi-WAN Oficial: WestNet, Starlink y Tachicom
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {ISPS_TP1.map((isp) => (
            <div key={isp.id} className="p-5 rounded-[24px] apple-glass border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">{isp.nombre}</span>
                <span className="text-cyan-400 font-bold">{isp.anchoBanda}</span>
              </div>
              <div className="text-zinc-400">Tipo: {isp.tipo}</div>
              <div className="text-[11px] text-emerald-400 pt-1">RouterOS: {isp.hashPcc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
