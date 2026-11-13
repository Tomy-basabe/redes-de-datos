import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from 'lucide-react';
import { FLOW_ORAL_CUES, TransportFlowId } from '../../data/cupertinoCorralitosData';

interface DynamicIslandTeleprompterProps {
  activeFlow: TransportFlowId;
  onSelectFlow: (flow: TransportFlowId) => void;
  isDark: boolean;
}

const APPLE_EASE = [0.16, 1, 0.3, 1] as const;
const FLOW_ORDER: TransportFlowId[] = ['dhcp', 'opendns', 'samba', 'nginx', 'pcc'];

export const DynamicIslandTeleprompter: React.FC<DynamicIslandTeleprompterProps> = ({
  activeFlow,
  onSelectFlow,
  isDark
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const cue = FLOW_ORAL_CUES[activeFlow];
  const idx = FLOW_ORDER.indexOf(activeFlow);

  return (
    <motion.div
      layout
      transition={{ duration: 0.35, ease: APPLE_EASE }}
      className={`rounded-[22px] border backdrop-blur-2xl px-4 py-2 sm:px-5 transition-colors duration-300 ${
        isDark
          ? 'bg-[#09090B]/95 border-white/[0.10] text-[#F5F5F7]'
          : 'bg-[#1D1D1F] border-black/15 text-[#F5F5F7] shadow-[0_8px_28px_-10px_rgba(0,0,0,0.35)]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2.5 text-left group cursor-pointer min-w-0"
        >
          <span className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center relative shrink-0">
            <span
              className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5"
              style={{ backgroundColor: cue.protocol === 'UDP' ? '#38BDF8' : '#0A84FF' }}
            />
            <Mic className="w-3.5 h-3.5 text-[#F5F5F7]" strokeWidth={1.8} />
          </span>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#D1D1D6] truncate">
              Guía Oral • {cue.stepLabel}
            </span>
            <span className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.12] text-white apple-tabular shrink-0">
              {cue.timeRange}
            </span>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-[#AEAEB2] group-hover:text-white transition-colors shrink-0" />
          ) : (
            <ChevronUp className="w-4 h-4 text-[#AEAEB2] group-hover:text-white transition-colors shrink-0" />
          )}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            disabled={idx <= 0}
            onClick={() => onSelectFlow(FLOW_ORDER[idx - 1])}
            className="p-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-30 transition-colors cursor-pointer"
            title="Servicio anterior"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            disabled={idx >= FLOW_ORDER.length - 1}
            onClick={() => onSelectFlow(FLOW_ORDER[idx + 1])}
            className="p-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-30 transition-colors cursor-pointer"
            title="Siguiente servicio"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key={activeFlow}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: APPLE_EASE }}
            className="overflow-hidden"
          >
            <div className="pt-2.5 mt-2 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px] leading-relaxed tracking-[-0.005em]">
              <p className="text-[#F5F5F7]">
                <span className="font-mono text-[11px] text-[#86868B] mr-1.5">01</span>
                {cue.line1}
              </p>
              <p className="text-[#A1A1A6]">
                <span className="font-mono text-[11px] text-[#86868B] mr-1.5">02</span>
                {cue.line2}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
