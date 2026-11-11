import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, CheckCircle2, Sparkles, GraduationCap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PREGUNTAS_DEFENSA } from '../data/reportData';

export const DefenseOralQandA: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [approved, setApproved] = useState<boolean>(false);

  const triggerCelebration = () => {
    setApproved(true);
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 60,
        origin: { x: 0.1, y: 0.7 }
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 60,
        origin: { x: 0.9, y: 0.7 }
      });
    }, 300);
  };

  return (
    <div className="w-full rounded-3xl bg-slate-950 border border-slate-800 p-6 lg:p-8 space-y-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider">
            Sección 11 del Informe • Conclusión y Coloquio
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Banco de Preguntas para la Defensa Oral (Tonelli / Cutuli)
          </h3>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          Cátedra de Redes de Datos • UTN FRM
        </span>
      </div>

      {/* Preguntas Desplegables con Acordeón */}
      <div className="space-y-3">
        {PREGUNTAS_DEFENSA.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-850 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-xs font-mono text-cyan-400 block mb-0.5">{item.pilar}</span>
                    <span className="text-sm sm:text-base font-bold text-white">{item.pregunta}</span>
                  </div>
                </div>

                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
                    isOpen ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 bg-cyan-500/5 font-sans"
                  >
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-200">
                      <strong className="text-cyan-300 block mb-1">Fundamento Técnico:</strong>
                      {item.respuesta}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Panel de Cierre y Aprobación de la Defensa */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Veredicto Académico
          </div>
          <h4 className="text-lg font-bold text-white">
            {approved ? '¡Defensa Oral Concluida con Éxito!' : 'Finalizar Exposición ante la Cátedra'}
          </h4>
          <p className="text-xs text-slate-400 max-w-lg mt-0.5">
            {approved
              ? 'Los 6 integrantes del grupo han defendido con rigor la arquitectura L4 propuesta para la Escuela 4-025 Los Corralitos.'
              : 'Haz clic para simular la aprobación de la defensa del trabajo práctico y activar la celebración.'}
          </p>
        </div>

        <button
          onClick={triggerCelebration}
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold font-mono text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer whitespace-nowrap flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{approved ? '¡Celebrar de Nuevo!' : 'Aprobar Defensa Oral'}</span>
        </button>
      </div>
    </div>
  );
};
