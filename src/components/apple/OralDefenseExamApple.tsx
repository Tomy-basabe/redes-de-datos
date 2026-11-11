import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Award, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export const OralDefenseExamApple: React.FC = () => {
  const questions: QuizQuestion[] = [
    {
      id: 1,
      question: '¿Por qué Nginx se interpone entre los estudiantes y Apache?',
      options: [
        'Para duplicar la velocidad del cable Ethernet.',
        'Como proxy inverso: separa las conexiones externas en 443 de las internas en 8080.',
        'Porque Apache no soporta direcciones IP privadas.'
      ],
      correct: 1,
      explanation: 'Nginx termina la sesión TLS externa y abre una segunda conexión TCP independiente hacia Apache en el puerto 8080 interno, permitiendo bloquear el 8080 con ACLs en el C9200.'
    },
    {
      id: 2,
      question: 'Si MikroTik balancea 3 proveedores con PCC, ¿una sola descarga suma 330 Mbps?',
      options: [
        'Sí, TCP une los 3 enlaces automáticamente.',
        'No, cada conexión TCP se asigna a un solo enlace para no desordenar los segmentos.',
        'Solo si el cable es de categoría 6.'
      ],
      correct: 1,
      explanation: 'PCC asigna la tupla completa a una única WAN. Un solo socket viaja por un solo proveedor; la sumatoria se aprovecha en la concurrencia de la escuela.'
    },
    {
      id: 3,
      question: '¿Cuál es la función exacta de "ip helper-address 172.16.10.14" en el Catalyst C9200?',
      options: [
        'Aumentar el ancho de banda del switch.',
        'Interceptar el broadcast DHCP (UDP 67/68) de las VLANs de usuarios y enviarlo como unicast al servidor en VLAN 10.',
        'Bloquear el acceso a Internet de los alumnos.'
      ],
      correct: 1,
      explanation: 'Los broadcasts no cruzan routers ni interfaces L3. El helper-address actúa como agente DHCP Relay convirtiendo la trama en unicast.'
    },
    {
      id: 4,
      question: '¿Qué mecanismo protege al RECEPTOR de no saturar su memoria?',
      options: [
        'Control de Congestión (cwnd).',
        'Control de Flujo mediante la Ventana de Recepción (rwnd).',
        'El Checksum de UDP.'
      ],
      correct: 1,
      explanation: 'El Control de Flujo protege al receptor (rwnd anunciada), mientras que el Control de Congestión protege a la red intermedia (cwnd).'
    }
  ];

  const [currentQ, setCurrentQ] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [finished, setFinished] = useState<boolean>(false);

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    setShowResult(true);

    if (idx === questions[currentQ].correct) {
      setScore((s) => s + 2.5);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelectedOpt(null);
      setShowResult(false);
    } else {
      setFinished(true);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    }
  };

  const restartQuiz = () => {
    setCurrentQ(0);
    setSelectedOpt(null);
    setShowResult(false);
    setScore(0);
    setFinished(false);
  };

  const q = questions[currentQ];

  return (
    <section id="examen-coloquio" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
          Evaluación de Cátedra • Simulador de Examen Oral
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold apple-headline text-white">
          Simulador de Defensa Cátedra Tonelli - Cutuli.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg apple-subheadline">
          Pon a prueba el dominio conceptual del grupo sobre la Capa de Transporte de la Escuela 4-025 Los Corralitos.
        </p>
      </div>

      <div className="p-8 sm:p-12 rounded-[36px] apple-glass border border-white/[0.08] max-w-3xl mx-auto space-y-8">
        {!finished ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500 border-b border-white/[0.08] pb-4">
              <span>Pregunta {currentQ + 1} de {questions.length}</span>
              <span className="text-cyan-400 font-bold">Puntuación: {score} / 10 pts</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {q.question}
            </h3>

            {/* Opciones */}
            <div className="space-y-3">
              {q.options.map((opt, idx) => {
                const isSelected = selectedOpt === idx;
                const isCorrect = idx === q.correct;
                let btnStyle = 'bg-white/[0.02] border-white/[0.06] text-zinc-300 hover:border-white/[0.2]';

                if (showResult) {
                  if (isCorrect) btnStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-300';
                  else if (isSelected) btnStyle = 'bg-rose-500/20 border-rose-400 text-rose-300';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-sans transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Retroalimentación */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono space-y-1"
              >
                <div className="text-cyan-400 font-bold uppercase text-[11px]">Fundamento Técnico de la Cátedra:</div>
                <p className="text-zinc-300 font-sans leading-relaxed">{q.explanation}</p>
              </motion.div>
            )}

            {showResult && (
              <button
                onClick={nextQuestion}
                className="w-full py-3.5 rounded-2xl bg-white text-black font-semibold text-xs tracking-wide hover:bg-zinc-200 transition-all cursor-pointer shadow-lg shadow-white/10"
              >
                {currentQ < questions.length - 1 ? 'Siguiente Pregunta' : 'Ver Calificación Final'}
              </button>
            )}
          </div>
        ) : (
          /* PANTALLA DE RESULTADOS */
          <div className="text-center space-y-6 py-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-black flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Calificación de Defensa Obtenida
              </div>
              <h3 className="text-4xl sm:text-5xl font-black text-white font-mono">
                {score} / 10 Puntos
              </h3>
              <p className="text-sm text-zinc-400 font-sans max-w-md mx-auto pt-2">
                {score >= 8
                  ? '¡Sobresaliente! El grupo demuestra dominio absoluto de la Capa de Transporte, puertos L4, enrutamiento inter-VLAN y balanceo WAN.'
                  : 'Defensa completada. Se recomienda repasar los conceptos de DHCP Relay y el desacoplamiento de Nginx frente a Apache.'}
              </p>
            </div>

            <button
              onClick={restartQuiz}
              className="px-6 py-3 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white text-xs font-mono font-semibold transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Simulación de Examen</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
