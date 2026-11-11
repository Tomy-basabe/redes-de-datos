import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, ChevronRight, GraduationCap, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PREGUNTAS_DEFENSA, DOCENTES, INSTITUCIONAL } from '../../data/reportData';

export const OralDefenseBentoApple: React.FC = () => {
  const [approved, setApproved] = useState<boolean>(false);
  const [activeCard, setActiveCard] = useState<number | null>(0);

  const triggerCelebration = () => {
    setApproved(true);
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 65,
        origin: { x: 0.1, y: 0.65 }
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 65,
        origin: { x: 0.9, y: 0.65 }
      });
    }, 280);
  };

  return (
    <section id="defensa-oral" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
      {/* Encabezado */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
          Defensa Final • Sección 11 del Informe
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold apple-headline text-white">
          Coloquio de Cátedra. Respuestas de Ingeniería.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg apple-subheadline">
          Los 4 pilares fundamentales evaluados por los profesores Raúl Tonelli y Roberto Cutuli en la defensa oral del trabajo práctico.
        </p>
      </div>

      {/* Grilla Bento Estilo Apple */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PREGUNTAS_DEFENSA.map((item, idx) => {
          const isSelected = activeCard === idx;
          return (
            <motion.div
              key={idx}
              onClick={() => setActiveCard(isSelected ? null : idx)}
              whileHover={{ scale: 1.01 }}
              className={`p-8 rounded-[36px] apple-glass border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'border-cyan-400/80 bg-white/[0.05] shadow-2xl shadow-cyan-500/10'
                  : 'border-white/[0.08] hover:border-white/[0.16]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                    {item.pilar}
                  </span>
                  <span className="w-7 h-7 rounded-full bg-white/[0.06] text-zinc-300 font-mono text-xs font-bold flex items-center justify-center">
                    0{idx + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight">
                  {item.pregunta}
                </h3>
              </div>

              <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-zinc-300 leading-relaxed">
                <strong className="text-emerald-400 block mb-1">Fundamento Académico:</strong>
                <p className="font-sans text-sm text-zinc-300">{item.respuesta}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tarjeta de Aprobación Formal y Certificación Cátedra */}
      <div className="p-8 sm:p-12 rounded-[40px] apple-glass border border-white/[0.12] flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-mono font-semibold uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Acreditación de Redes de Datos
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {approved ? '¡Defensa Oral Aprobada!' : 'Concluir Exposición ante Tonelli & Cutuli'}
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed font-sans">
            {approved
              ? 'El equipo de la Escuela 4-025 Los Corralitos (Basabe, Blanes, Generoso, Gutierrez, Moreno y Vega Maiquez) ha sustentado la totalidad del modelo TCP/IP en la infraestructura relevada.'
              : 'Presiona el botón para certificar la presentación del trabajo práctico de la Universidad Tecnológica Nacional (FRM).'}
          </p>
        </div>

        <button
          onClick={triggerCelebration}
          className="px-8 py-4 rounded-full bg-white text-black font-semibold text-sm tracking-wide hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer shadow-2xl shadow-white/20 whitespace-nowrap flex items-center gap-2 self-start md:self-auto"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{approved ? '¡Festejar Nuevamente!' : 'Certificar Defensa Oral'}</span>
        </button>
      </div>
    </section>
  );
};
