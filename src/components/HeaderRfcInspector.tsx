import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Shield, CheckCircle, Zap } from 'lucide-react';

interface HeaderField {
  nombre: string;
  bits: string;
  bytes: string;
  descripcion: string;
  aplicacionEscuela: string;
}

export const HeaderRfcInspector: React.FC = () => {
  const [proto, setProto] = useState<'TCP' | 'UDP'>('TCP');
  const [selectedField, setSelectedField] = useState<HeaderField>({
    nombre: 'Puerto de Destino (Destination Port)',
    bits: '16 bits (bits 16 a 31)',
    bytes: '2 bytes',
    descripcion: 'Identifica el proceso o servicio receptor en el equipo de destino dentro del rango 0 a 65535.',
    aplicacionEscuela: 'En nuestra red se utiliza 443 para HTTPS (Nginx), 8080 para Apache interno, 445 para Samba y 53 para Cisco OpenDNS.'
  });

  const tcpFields: HeaderField[] = [
    {
      nombre: 'Puerto de Origen (Source Port)',
      bits: '16 bits',
      bytes: '2 bytes',
      descripcion: 'Puerto efímero elegido al azar por el sistema operativo del cliente (49152 - 65535).',
      aplicacionEscuela: 'Ejemplo: 53120 asignado por una PC de la VLAN 20 de Estudiantes al abrir el navegador web.'
    },
    {
      nombre: 'Puerto de Destino (Destination Port)',
      bits: '16 bits',
      bytes: '2 bytes',
      descripcion: 'Puerto bien conocido o registrado del servicio de destino.',
      aplicacionEscuela: 'TCP 80 / 443 en Nginx, TCP 8080 en Apache, TCP 445 en Samba.'
    },
    {
      nombre: 'Número de Secuencia (Sequence Number)',
      bits: '32 bits',
      bytes: '4 bytes',
      descripcion: 'Rastrea el orden exacto de cada byte de datos transmitido para permitir la reconstrucción sin desorden.',
      aplicacionEscuela: 'Vital en Samba para que un documento PDF o archivo administrativo no se corrompa.'
    },
    {
      nombre: 'Número de Reconocimiento (ACK Number)',
      bits: '32 bits',
      bytes: '4 bytes',
      descripcion: 'Informa cuál es el siguiente byte que el receptor espera recibir, confirmando los anteriores.',
      aplicacionEscuela: 'Utilizado en el 3-Way Handshake y en cada transferencia de archivos compartidos.'
    },
    {
      nombre: 'Banderas de Control (Flags: SYN, ACK, FIN...)',
      bits: '9 bits',
      bytes: '1 byte aprox.',
      descripcion: 'Bits individuales que determinan el propósito del segmento (SYN=iniciar, ACK=confirmar, FIN=cerrar, RST=rechazar).',
      aplicacionEscuela: 'RST se activa si un alumno intenta conectarse al puerto 8080 de Apache bloqueado por la ACL.'
    },
    {
      nombre: 'Ventana de Recepción (Window Size - rwnd)',
      bits: '16 bits',
      bytes: '2 bytes',
      descripcion: 'Indica la cantidad de bytes que el receptor puede almacenar en su buffer antes de saturarse (Control de Flujo).',
      aplicacionEscuela: 'Permite a los servidores de la escuela atender múltiples solicitudes sin colapsar su memoria RAM.'
    },
    {
      nombre: 'Checksum (Suma de Comprobación)',
      bits: '16 bits',
      bytes: '2 bytes',
      descripcion: 'Verifica la integridad matemática de los encabezados y datos para detectar alteraciones o ruido físico.',
      aplicacionEscuela: 'Calculado tanto en TCP como en UDP para proteger las tramas que circulan por los switches.'
    }
  ];

  const udpFields: HeaderField[] = [
    {
      nombre: 'Puerto de Origen UDP',
      bits: '16 bits',
      bytes: '2 bytes',
      descripcion: 'Puerto efímero o bien conocido del emisor.',
      aplicacionEscuela: 'UDP 68 en los clientes que solicitan configuración DHCP.'
    },
    {
      nombre: 'Puerto de Destino UDP',
      bits: '16 bits',
      bytes: '2 bytes',
      descripcion: 'Puerto del servicio destino sin orientación a conexión.',
      aplicacionEscuela: 'UDP 67 en el servidor Windows DHCP y UDP 53 en Cisco OpenDNS.'
    },
    {
      nombre: 'Longitud del Datagrama (Length)',
      bits: '16 bits',
      bytes: '2 bytes',
      descripcion: 'Tamaño total del datagrama UDP en bytes (encabezado de 8 bytes + datos de aplicación).',
      aplicacionEscuela: 'Tamaño mínimo de 8 bytes cuando no lleva carga útil.'
    },
    {
      nombre: 'Checksum UDP',
      bits: '16 bits',
      bytes: '2 bytes',
      descripcion: 'Detección de errores en tránsito. En IPv4 es opcional pero se utiliza en nuestra red.',
      aplicacionEscuela: 'Garantiza que una consulta DNS o paquete DHCP no haya sufrido alteraciones por ruido.'
    }
  ];

  return (
    <div className="w-full rounded-3xl bg-slate-950 border border-slate-800 p-6 lg:p-8 space-y-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase text-violet-400 tracking-wider">
            Secciones 3 y 6 del Informe • Anatomía de Encabezados
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Inspector RFC de Campos de Transporte (TCP vs UDP)
          </h3>
        </div>

        <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => {
              setProto('TCP');
              setSelectedField(tcpFields[1]);
            }}
            className={`px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              proto === 'TCP'
                ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            TCP (20 Bytes Mínimo)
          </button>
          <button
            onClick={() => {
              setProto('UDP');
              setSelectedField(udpFields[1]);
            }}
            className={`px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              proto === 'UDP'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            UDP (8 Bytes Fijos)
          </button>
        </div>
      </div>

      {/* Grid de Campos del Encabezado */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-slate-400 uppercase">
          Haz clic en cada campo para analizar su función en la red escolar:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(proto === 'TCP' ? tcpFields : udpFields).map((f) => {
            const isSelected = selectedField.nombre === f.nombre;
            return (
              <div
                key={f.nombre}
                onClick={() => setSelectedField(f)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? proto === 'TCP'
                      ? 'bg-violet-500/15 border-violet-400 shadow-md shadow-violet-500/20'
                      : 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>{f.bits}</span>
                  <span className="text-white font-bold">{f.bytes}</span>
                </div>
                <div className="text-xs font-bold text-slate-200">{f.nombre}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tarjeta de Inspección del Campo Seleccionado */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            {selectedField.nombre}
          </h4>
          <span className="text-xs font-mono text-cyan-400 font-bold">{selectedField.bits}</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          {selectedField.descripcion}
        </p>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300">
          <strong className="text-white block mb-0.5">Aplicación en la Escuela 4-025 Los Corralitos:</strong>
          {selectedField.aplicacionEscuela}
        </div>
      </div>
    </div>
  );
};
