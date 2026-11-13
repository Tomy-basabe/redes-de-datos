import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Copy, Check, ChevronDown, ChevronUp, Sparkles, Mic, Lightbulb } from 'lucide-react';

interface SpeakerNotesCardProps {
  guionText: string;
  tipsOral?: string[];
  transicion?: string;
}

export const SpeakerNotesCard: React.FC<SpeakerNotesCardProps> = ({
  guionText,
  tipsOral = [],
  transicion
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(guionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-cyan-500/30 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Barra superior de notas de orador */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-4 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900/80 border-b border-white/[0.08] flex items-center justify-between cursor-pointer select-none group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-2">
              <span>Guión de Exposición • Ignacio Generoso</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Orador L4
              </span>
            </div>
            <div className="text-xs text-zinc-400">
              Palabras exactas para la defensa oral y tips técnicos de cátedra
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
            title="Copiar guión al portapapeles"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span className="hidden sm:inline">{copied ? '¡Copiado!' : 'Copiar Guión'}</span>
          </button>

          <button 
            className="p-1.5 text-zinc-400 group-hover:text-white transition-colors"
            aria-label="Alternar panel de notas"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Contenido expandible del guión */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="p-6 space-y-4"
          >
            {/* Texto del guión */}
            <div className="p-4 rounded-2xl bg-black/50 border border-cyan-500/20 space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400/90 font-semibold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Lo que debes decir (Guión del Orador):</span>
              </div>
              <p className="text-sm font-sans text-zinc-100 leading-relaxed italic bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                "{guionText}"
              </p>
            </div>

            {/* Tips orales y preguntas de cátedra */}
            {tipsOral.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Tips Técnicos para la Defensa (Tonelli / Cutuli):</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-sans text-zinc-300">
                  {tipsOral.map((tip, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2">
                      <span className="text-amber-400 font-mono font-bold">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Frase de transición */}
            {transicion && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-sans text-emerald-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <strong className="font-mono uppercase text-[10px] text-emerald-400 block">Pase al siguiente bloque / compañero:</strong>
                  {transicion}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
