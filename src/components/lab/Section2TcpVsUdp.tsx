import React, { useState, useEffect } from 'react';
import { CupertinoHeader } from '../cupertino/CupertinoHeader';
import { Module1HeadersTuples } from '../cupertino/Module1HeadersTuples';
import { HeaderSizeComparisonFooter } from '../cupertino/HeaderSizeComparisonFooter';
import { DynamicIslandTeleprompter } from '../cupertino/DynamicIslandTeleprompter';
import { TransportFlowId } from '../../data/cupertinoCorralitosData';

const TOTAL_TALK_SECONDS = 150; // 2 minutos 30 segundos

export const Section2TcpVsUdp: React.FC = () => {
  // Tema Claro Unificado Cupertino para toda la presentación
  const [isDark, setIsDark] = useState<boolean>(false);
  const [activeFlow, setActiveFlow] = useState<TransportFlowId>('dhcp');
  const [viewLayer, setViewLayer] = useState<'physical' | 'logical'>('physical');
  const [secondsLeft, setSecondsLeft] = useState<number>(TOTAL_TALK_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Cronómetro 2:30 de exposición continua sobre la vista unificada
  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning]);

  const handleResetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(TOTAL_TALK_SECONDS);
  };

  return (
    <section
      className={`apple-pro-canvas relative rounded-[30px] border p-3.5 sm:p-4 lg:p-5 transition-colors duration-300 overflow-hidden ${
        isDark
          ? 'bg-[#09090B] border-white/[0.09] text-[#F5F5F7] shadow-[0_24px_64px_-20px_rgba(0,0,0,0.9)]'
          : 'bg-[#F5F5F7] border-black/[0.07] text-[#1D1D1F] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)]'
      }`}
    >
      {/* Iluminación especular sutil de Apple Hardware Studio */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[30px]">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[780px] h-[280px] rounded-full blur-3xl transition-opacity duration-500"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 72%)'
              : 'radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, transparent 72%)'
          }}
        />
      </div>

      {/* Bento Unificado (Solo 1. TCP vs UDP & Cabeceras) */}
      <div className="relative z-10 flex flex-col gap-3.5">
        <CupertinoHeader
          viewLayer={viewLayer}
          onToggleViewLayer={setViewLayer}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          secondsLeft={secondsLeft}
          isRunning={isRunning}
          onToggleRun={() => setIsRunning((r) => !r)}
          onResetTimer={handleResetTimer}
        />

        {/* Topología interactiva principal (Capa Física vs Capa Lógica estrictas) */}
        <Module1HeadersTuples
          isDark={isDark}
          viewLayer={viewLayer}
          onToggleViewLayer={setViewLayer}
          activeFlow={activeFlow}
          onSelectFlow={setActiveFlow}
        />

        {/* Comparativa proporcional abajo de la diapositiva: Cabecera UDP (8 B) vs Cabecera TCP (20 B) */}
        <HeaderSizeComparisonFooter isDark={isDark} />

        {/* Teleprompter Dynamic Island sincronizado con el servicio activo */}
        <DynamicIslandTeleprompter
          activeFlow={activeFlow}
          onSelectFlow={setActiveFlow}
          isDark={isDark}
        />
      </div>
    </section>
  );
};
