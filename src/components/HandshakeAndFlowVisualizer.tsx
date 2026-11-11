import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, AlertTriangle, CheckCircle, ShieldCheck, Zap, Sliders } from 'lucide-react';

export const HandshakeAndFlowVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'handshake' | 'samba' | 'rwnd'>('handshake');
  
  // Handshake State
  const [hsStep, setHsStep] = useState<number>(0);
  const [isHsAuto, setIsHsAuto] = useState<boolean>(false);

  // Samba Loss & Retransmission State
  const [sambaStep, setSambaStep] = useState<number>(0);
  const [packetDropped, setPacketDropped] = useState<boolean>(false);

  // Flow Control rwnd State
  const [clientBuffer, setClientBuffer] = useState<number>(64); // KB

  useEffect(() => {
    if (!isHsAuto) return;
    const interval = setInterval(() => {
      setHsStep((prev) => (prev >= 3 ? 0 : prev + 1));
    }, 2400);
    return () => clearInterval(interval);
  }, [isHsAuto]);

  const handshakeSteps = [
    {
      paso: 0,
      emisor: 'Cliente (172.16.20.10:53000)',
      receptor: 'Nginx (172.16.10.12:443)',
      tipo: 'SYN',
      seq: 1000,
      ack: 0,
      descripcion: 'El cliente inicia la conexión enviando un segmento con la bandera SYN activa y un número de secuencia inicial aleatorio (ISN = 1000).',
      estadoSocket: 'SYN_SENT'
    },
    {
      paso: 1,
      emisor: 'Nginx (172.16.10.12:443)',
      receptor: 'Cliente (172.16.20.10:53000)',
      tipo: 'SYN-ACK',
      seq: 5000,
      ack: 1001,
      descripcion: 'El servidor responde aceptando la solicitud con SYN y reconociendo el ISN del cliente incrementándolo en 1 (ACK = 1001).',
      estadoSocket: 'SYN_RCVD'
    },
    {
      paso: 2,
      emisor: 'Cliente (172.16.20.10:53000)',
      receptor: 'Nginx (172.16.10.12:443)',
      tipo: 'ACK',
      seq: 1001,
      ack: 5001,
      descripcion: 'El cliente confirma la recepción del SYN del servidor. A partir de este momento la conexión lógica queda establecida.',
      estadoSocket: 'ESTABLISHED'
    },
    {
      paso: 3,
      emisor: 'Ambos Extremos',
      receptor: 'Sesión Cifrada TLS',
      tipo: 'DATOS HTTPS',
      seq: 1001,
      ack: 5001,
      descripcion: 'Conexión bidireccional lista para transferir la página web del colegio o el campus escolar sin riesgo de pérdida.',
      estadoSocket: 'TRANSMITIENDO'
    }
  ];

  return (
    <div className="w-full rounded-3xl bg-slate-950 border border-slate-800 p-6 lg:p-8 space-y-6 shadow-2xl">
      {/* Selector de Pestañas con animación elástica */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase text-cyan-400 tracking-wider">
            Secciones 7 y 8 del Informe • Confiabilidad TCP
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Simulador de Mecanismos Internos de Transporte
          </h3>
        </div>

        <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono">
          {[
            { id: 'handshake', label: '1. Three-Way Handshake' },
            { id: 'samba', label: '2. Pérdida y Retransmisión' },
            { id: 'rwnd', label: '3. Control de Flujo (rwnd)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PESTAÑA 1: THREE-WAY HANDSHAKE */}
      {activeTab === 'handshake' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400 font-mono">
              Paso {hsStep + 1} de {handshakeSteps.length} • Estado:{' '}
              <span className="text-cyan-400 font-bold">{handshakeSteps[hsStep].estadoSocket}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsHsAuto(!isHsAuto)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isHsAuto
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {isHsAuto ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isHsAuto ? 'Pausar' : 'Auto-Play'}</span>
              </button>

              <button
                onClick={() => setHsStep(0)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Gráfico de Línea de Tiempo del Handshake */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400 px-6">
              <span className="text-cyan-400">CLIENTE (VLAN 20)</span>
              <span className="text-emerald-400">NGINX (VLAN 10:443)</span>
            </div>

            {/* Representación visual de los 3 pasos */}
            <div className="space-y-4">
              {handshakeSteps.map((step, idx) => {
                const isActive = hsStep === idx;
                const isPassed = hsStep > idx;
                const isClientToServer = idx === 0 || idx === 2;

                return (
                  <motion.div
                    key={idx}
                    animate={{ opacity: isActive ? 1 : isPassed ? 0.7 : 0.25 }}
                    onClick={() => setHsStep(idx)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                          isActive ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-white font-bold">{step.tipo}</span>
                      </div>

                      <div className="text-[11px] text-slate-300">
                        {isClientToServer ? 'Cliente ───▶ Servidor' : 'Servidor ───▶ Cliente'}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Seq={step.seq} | Ack={step.ack}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-2 font-sans pl-8">
                      {step.descripcion}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: SAMBA PÉRDIDA Y RETRANSMISIÓN */}
      {activeTab === 'samba' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono text-amber-300 font-bold uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Caso Real: Descarga de Archivo en Samba (TCP 445)
              </div>
              <p className="text-xs text-slate-300">
                A diferencia de UDP, si un segmento de un archivo compartido se pierde por ruido en el switch, TCP detecta la falta de ACK y retransmite automáticamente el bloque faltante.
              </p>
            </div>

            <button
              onClick={() => {
                setPacketDropped(true);
                setSambaStep(1);
                setTimeout(() => setSambaStep(2), 1500);
                setTimeout(() => setSambaStep(3), 3000);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer whitespace-nowrap"
            >
              Simular Pérdida de Segmento #2
            </button>
          </div>

          {/* Gráfico de los 4 Segmentos */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((seg) => {
              const isLost = packetDropped && seg === 2 && sambaStep === 1;
              const isRetransmitted = packetDropped && seg === 2 && sambaStep >= 2;

              return (
                <div
                  key={seg}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    isLost
                      ? 'bg-rose-500/20 border-rose-400 animate-pulse'
                      : isRetransmitted
                      ? 'bg-emerald-500/20 border-emerald-400'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="text-xs font-mono text-slate-400">Segmento #{seg}</div>
                  <div className="text-base font-bold text-white mt-1">1460 Bytes</div>
                  <div className="text-[11px] font-mono mt-2">
                    {isLost && <span className="text-rose-400 font-bold">¡PERDIDO EN SWITCH!</span>}
                    {isRetransmitted && <span className="text-emerald-400 font-bold">RETRANSMITIDO OK</span>}
                    {!isLost && !isRetransmitted && <span className="text-slate-500">Enviado</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-white block">Diagnóstico de la Cátedra:</span>
            {sambaStep === 0 && 'Todos los segmentos fluyen con normalidad hacia la PC del docente.'}
            {sambaStep === 1 && 'El segmento #2 no recibió ACK antes del vencimiento del temporizador RTO (Retransmission Timeout).'}
            {sambaStep === 2 && 'TCP activa Fast Retransmit / RTO y retransmite únicamente el segmento #2 faltante.'}
            {sambaStep === 3 && 'Archivo descargado íntegramente. El receptor reensambla los datos ordenados sin corrupción.'}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: CONTROL DE FLUJO (rwnd) */}
      {activeTab === 'rwnd' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-cyan-300 font-bold">
                  Mecanismo de Ventana Deslizante (Receive Window - rwnd)
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">
                  Regulación de Velocidad entre Emisor y Receptor
                </h4>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-slate-400">Buffer Disponible:</span>
                <div className="text-lg font-bold font-mono text-cyan-400">{clientBuffer} KB</div>
              </div>
            </div>

            {/* Slider interactivo de tamaño de ventana */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="64"
                step="8"
                value={clientBuffer}
                onChange={(e) => setClientBuffer(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>0 KB (Buffer Lleno - Zero Window)</span>
                <span>32 KB (Moderado)</span>
                <span>64 KB (Máximo - Enlace Despejado)</span>
              </div>
            </div>
          </div>

          {/* Estado del Emisor ante el tamaño del buffer */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <div className="text-sm font-bold text-white">Comportamiento del Emisor TCP:</div>
            </div>

            {clientBuffer === 0 ? (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                <strong>¡Transmisión Pausada (Zero Window)!</strong> El receptor tiene su buffer lleno procesando otras tareas. TCP detiene el envío de nuevos datos y envía periódicamente paquetes de sondeo (Zero Window Probe) hasta que el receptor anuncie espacio disponible.
              </div>
            ) : clientBuffer < 32 ? (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                <strong>Velocidad Reducida (Control de Flujo Activo):</strong> El emisor adapta su tasa de transferencia a {clientBuffer} KB para evitar desbordar la memoria RAM del receptor.
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                <strong>Transmisión Óptima:</strong> Ventana abierta en {clientBuffer} KB. El emisor transmite paquetes a máxima velocidad sin esperas.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
