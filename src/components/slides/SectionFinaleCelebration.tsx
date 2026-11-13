import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  PartyPopper,
  Sparkles,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Zap,
  BookOpen,
  FileCode2,
  Network,
  GraduationCap,
  Radio
} from 'lucide-react';

type ConfettiIntensity = 'exagerado' | 'normal' | 'pausa';

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  aspect: number;
  colorIdx: number;
  rot: number;
  vRot: number;
  tilt: number;
  vTilt: number;
  wobble: number;
  vWobble: number;
  shape: 0 | 1 | 2 | 3; // 0: rect, 1: streamer, 2: circle, 3: star-diamond
  alpha: number;
  gravity: number;
  drag: number;
}

const CONFETTI_COLORS = [
  '#22d3ee', // cyan
  '#f43f5e', // rose
  '#fbbf24', // amber gold
  '#a855f7', // violet
  '#34d399', // emerald
  '#38bdf8', // sky
  '#fb7185', // pink
  '#facc15', // yellow
  '#f472b6', // fuchsia
  '#ffffff'  // white sparkle
];

const MOLE_QUOTES = [
  '¡0% pérdida en el recital! 🎈',
  '¡Último tema: FIN-ACK en vivo!',
  '¡Aprobado con 10 puntos! 🏆',
  '¡Tocá mis globos para más confeti!',
  '¡Gracias Escuela 4-025 y UTN FRM!'
];

const CROWD_SIGNS = [
  { label: 'SYN-ACK 🙌', bg: 'bg-sky-500 text-white border-sky-300' },
  { label: '0% LOSS', bg: 'bg-emerald-500 text-white border-emerald-300' },
  { label: 'TCP RENO 🔥', bg: 'bg-amber-400 text-slate-950 border-amber-200' },
  { label: 'VLAN 10/20', bg: 'bg-indigo-500 text-white border-indigo-300' },
  { label: 'PUERTO :443', bg: 'bg-fuchsia-500 text-white border-fuchsia-300' },
  { label: '10 ★', bg: 'bg-yellow-400 text-slate-950 border-yellow-200' },
  { label: 'FIN-ACK ✓', bg: 'bg-rose-500 text-white border-rose-300' }
];

const MAX_PARTICLES = 1350;

function createPool(): Particle[] {
  const pool: Particle[] = new Array(MAX_PARTICLES);
  for (let i = 0; i < MAX_PARTICLES; i++) {
    pool[i] = {
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 8,
      aspect: 0.55,
      colorIdx: 0,
      rot: 0,
      vRot: 0,
      tilt: 0,
      vTilt: 0,
      wobble: 0,
      vWobble: 0,
      shape: 0,
      alpha: 1,
      gravity: 0.16,
      drag: 0.992
    };
  }
  return pool;
}

export const SectionFinaleCelebration: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const poolRef = useRef<Particle[]>(createPool());
  const cursorRef = useRef<number>(0);
  const intensityRef = useRef<ConfettiIntensity>('exagerado');
  const sizeRef = useRef<{ w: number; h: number }>({ w: 1280, h: 720 });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beatTimerRef = useRef<number | null>(null);

  const [intensity, setIntensity] = useState<ConfettiIntensity>('exagerado');
  const [burstCount, setBurstCount] = useState<number>(3);
  const [extraBalloons, setExtraBalloons] = useState<number>(0);
  const [quoteIdx, setQuoteIdx] = useState<number>(0);
  const [musicOn, setMusicOn] = useState<boolean>(false);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % MOLE_QUOTES.length);
    }, 3800);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (beatTimerRef.current !== null) {
        window.clearInterval(beatTimerRef.current);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const spawnParticle = useCallback(
    (
      x: number,
      y: number,
      vx: number,
      vy: number,
      gravity = 0.17,
      drag = 0.991,
      sizeMult = 1
    ) => {
      const pool = poolRef.current;
      const p = pool[cursorRef.current];
      cursorRef.current = (cursorRef.current + 1) % MAX_PARTICLES;

      const rShape = Math.random();
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.size = (6 + Math.random() * 8) * sizeMult;
      p.aspect = rShape > 0.65 ? 1.8 + Math.random() * 1.4 : 0.45 + Math.random() * 0.45;
      p.colorIdx = (Math.random() * CONFETTI_COLORS.length) | 0;
      p.rot = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 0.16;
      p.tilt = Math.random() * Math.PI * 2;
      p.vTilt = 0.08 + Math.random() * 0.14;
      p.wobble = Math.random() * Math.PI * 2;
      p.vWobble = 0.04 + Math.random() * 0.07;
      p.shape = rShape < 0.52 ? 0 : rShape < 0.78 ? 1 : rShape < 0.92 ? 2 : 3;
      p.alpha = 1;
      p.gravity = gravity;
      p.drag = drag;
    },
    []
  );

  const fireCannon = useCallback(
    (originX: number, originY: number, angleCenter: number, spread: number, count: number, power = 18) => {
      for (let i = 0; i < count; i++) {
        const angle = angleCenter + (Math.random() - 0.5) * spread;
        const speed = power * (0.45 + Math.random() * 0.85);
        spawnParticle(
          originX + (Math.random() - 0.5) * 20,
          originY + (Math.random() - 0.5) * 20,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.22 + Math.random() * 0.1,
          0.986,
          1 + Math.random() * 0.35
        );
      }
    },
    [spawnParticle]
  );

  const triggerMegaBarrage = useCallback(() => {
    const { w, h } = sizeRef.current;
    fireCannon(w * 0.06, h * 0.84, -Math.PI * 0.32, 0.65, 200, 24);
    fireCannon(w * 0.94, h * 0.84, -Math.PI * 0.68, 0.65, 200, 24);
    fireCannon(w * 0.5, h * 0.25, Math.PI * 0.5, Math.PI * 1.9, 150, 15);
    setBurstCount((c) => c + 1);
  }, [fireCannon]);

  const playPopSound = useCallback(() => {
    if (!musicOn) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.11);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignorar si navegador bloquea audio
    }
  }, [musicOn]);

  const toggleCelebrationAudio = useCallback(() => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!musicOn) {
        if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          const t0 = ctx.currentTime + idx * 0.065;
          osc.frequency.setValueAtTime(freq, t0);
          gain.gain.setValueAtTime(0.001, t0);
          gain.gain.linearRampToValueAtTime(0.09, t0 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.65);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t0);
          osc.stop(t0 + 0.68);
        });

        let step = 0;
        const bassScale = [130.81, 164.81, 196.0, 220.0];
        beatTimerRef.current = window.setInterval(() => {
          if (!audioCtxRef.current) return;
          const c = audioCtxRef.current;
          const now = c.currentTime;
          const kick = c.createOscillator();
          const kGain = c.createGain();
          kick.type = 'sine';
          kick.frequency.setValueAtTime(115, now);
          kick.frequency.exponentialRampToValueAtTime(42, now + 0.14);
          kGain.gain.setValueAtTime(0.11, now);
          kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          kick.connect(kGain);
          kGain.connect(c.destination);
          kick.start(now);
          kick.stop(now + 0.17);

          const mel = c.createOscillator();
          const mGain = c.createGain();
          mel.type = 'sine';
          mel.frequency.setValueAtTime(bassScale[step % bassScale.length] * (step % 2 === 0 ? 2 : 4), now + 0.25);
          mGain.gain.setValueAtTime(0.04, now + 0.25);
          mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          mel.connect(mGain);
          mGain.connect(c.destination);
          mel.start(now + 0.25);
          mel.stop(now + 0.46);
          step++;
        }, 500);

        setMusicOn(true);
      } else {
        if (beatTimerRef.current !== null) {
          window.clearInterval(beatTimerRef.current);
          beatTimerRef.current = null;
        }
        setMusicOn(false);
      }
    } catch {
      setMusicOn(false);
    }
  }, [musicOn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeRef.current = { w, h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const { w, h } = sizeRef.current;
    fireCannon(w * 0.06, h * 0.85, -Math.PI * 0.3, 0.7, 230, 25);
    fireCannon(w * 0.94, h * 0.85, -Math.PI * 0.7, 0.7, 230, 25);
    for (let i = 0; i < 260; i++) {
      spawnParticle(
        Math.random() * w,
        -Math.random() * h * 0.65,
        (Math.random() - 0.5) * 3.5,
        2 + Math.random() * 5,
        0.1 + Math.random() * 0.08,
        0.995
      );
    }

    let rafId = 0;
    let tick = 0;

    const renderFrame = () => {
      tick++;
      const { w: width, h: height } = sizeRef.current;
      const mode = intensityRef.current;
      const pool = poolRef.current;

      ctx.clearRect(0, 0, width, height);

      if (mode !== 'pausa') {
        const rainPerFrame = mode === 'exagerado' ? 9 : 3;
        for (let s = 0; s < rainPerFrame; s++) {
          spawnParticle(
            Math.random() * width,
            -14,
            (Math.random() - 0.5) * 2.8,
            2.2 + Math.random() * 4.2,
            0.09 + Math.random() * 0.08,
            0.994
          );
        }

        if (mode === 'exagerado' && tick % 135 === 0) {
          const fromLeft = ((tick / 135) | 0) % 2 === 0;
          fireCannon(
            fromLeft ? width * 0.06 : width * 0.94,
            height * 0.88,
            fromLeft ? -Math.PI * 0.28 : -Math.PI * 0.72,
            0.55,
            110,
            23
          );
        }
      }

      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = pool[i];
        if (!p.active) continue;

        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.wobble += p.vWobble;
        p.x += p.vx + Math.sin(p.wobble) * 1.1;
        p.y += p.vy;
        p.rot += p.vRot;
        p.tilt += p.vTilt;

        if (p.y > height + 30 || p.x < -60 || p.x > width + 60) {
          p.active = false;
          continue;
        }

        if (p.y > height * 0.86) {
          p.alpha = Math.max(0, 1 - (p.y - height * 0.86) / (height * 0.15));
        }

        const flipScale = 0.25 + 0.75 * Math.abs(Math.cos(p.tilt));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, flipScale);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = CONFETTI_COLORS[p.colorIdx];

        if (p.shape === 0 || p.shape === 1) {
          const pw = p.size;
          const ph = p.size * p.aspect;
          ctx.fillRect(-pw * 0.5, -ph * 0.5, pw, ph);
        } else if (p.shape === 2) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.36, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const hs = p.size * 0.52;
          ctx.beginPath();
          ctx.moveTo(0, -hs);
          ctx.lineTo(hs * 0.65, 0);
          ctx.lineTo(0, hs);
          ctx.lineTo(-hs * 0.65, 0);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [fireCannon, spawnParticle]);

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    fireCannon(e.clientX, e.clientY, -Math.PI * 0.5, Math.PI * 1.9, 140, 18);
    setBurstCount((c) => c + 1);
    playPopSound();
  };

  const handleMoleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.25;
    fireCannon(cx, cy, -Math.PI * 0.5, Math.PI * 2, 165, 19);
    setExtraBalloons((b) => (b + 1) % 4);
    setQuoteIdx((q) => (q + 1) % MOLE_QUOTES.length);
    setBurstCount((c) => c + 1);
    playPopSound();
  };

  return (
    <section className="apple-pro-canvas relative rounded-[30px] border border-black/[0.07] bg-[#F5F5F7] text-[#1D1D1F] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] p-4 sm:p-5 space-y-4">
      <style>{`
        @keyframes finGlowPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 18px rgba(251, 191, 36, 0.55)); }
          50% { transform: scale(1.035); filter: drop-shadow(0 0 34px rgba(34, 211, 238, 0.78)); }
        }
        @keyframes marqueeBulb {
          0%, 100% { opacity: 1; transform: scale(1.12); }
          50% { opacity: 0.35; transform: scale(0.8); }
        }
        @keyframes discoSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes discoBeam {
          0%, 100% { transform: rotate(-20deg) scaleY(1); opacity: 0.38; }
          50% { transform: rotate(20deg) scaleY(1.06); opacity: 0.62; }
        }
        @keyframes eqBar {
          0%, 100% { transform: scaleY(0.22); }
          50% { transform: scaleY(1); }
        }
        @keyframes wooferPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.09); }
        }
        @keyframes vinylSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes danceBounceA {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-3deg); }
          50% { transform: translate3d(0, -18px, 0) rotate(3deg); }
        }
        @keyframes danceBounceB {
          0%, 100% { transform: translate3d(-5px, 0, 0) rotate(4deg); }
          50% { transform: translate3d(5px, -14px, 0) rotate(-4deg); }
        }
        @keyframes danceSpinHop {
          0%, 100% { transform: translate3d(0, 0, 0) scaleX(1); }
          25% { transform: translate3d(0, -18px, 0) scaleX(0.92); }
          50% { transform: translate3d(0, -4px, 0) scaleX(-1); }
          75% { transform: translate3d(0, -14px, 0) scaleX(0.95); }
        }
        @keyframes crowdWave {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -9px, 0); }
        }
        @keyframes armWaveLeft {
          0%, 100% { transform: rotate(-16deg); }
          50% { transform: rotate(32deg); }
        }
        @keyframes armWaveRight {
          0%, 100% { transform: rotate(16deg); }
          50% { transform: rotate(-34deg); }
        }
        @keyframes moleFlightAcross {
          0% { transform: translate3d(-240px, 18px, 0) rotate(-4deg); }
          25% { transform: translate3d(26%, -16px, 0) rotate(3deg); }
          50% { transform: translate3d(52%, 12px, 0) rotate(-2deg); }
          75% { transform: translate3d(78%, -18px, 0) rotate(4deg); }
          100% { transform: translate3d(105%, 8px, 0) rotate(-3deg); }
        }
        @keyframes moleBobGentle {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-2deg); }
          50% { transform: translate3d(0, -12px, 0) rotate(2.5deg); }
        }
        @keyframes balloonSway {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(5deg); }
        }
        .gpu-anim { will-change: transform; }
      `}</style>

      {/* Canvas fijo en pantalla completa para que el confeti llueva por TODA la presentación */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-screen h-screen pointer-events-none z-50"
      />

      {/* BARRA SUPERIOR CUPERTINO CLARA */}
      <div className="apple-bento p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-b from-[#0A84FF] to-[#0071E3] border border-[#0066CC] flex items-center justify-center text-white shadow-[0_6px_14px_rgba(0,113,227,0.28),inset_0_1px_0_rgba(255,255,255,0.35)] shrink-0">
            <PartyPopper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#EAF3FF] text-[#0071E3] border border-[#0071E3]/20">
                Diapositiva 7 • Concierto de Cierre 60 FPS
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F] tracking-tight">
                Fin de la Presentación • Recital de Capa de Transporte
              </h2>
            </div>
            <p className="text-xs text-[#515154]">
              Hacé clic en el escenario o en los globos del topo para disparar los cañones de confeti.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              triggerMegaBarrage();
              playPopSound();
            }}
            className="apple-btn apple-btn-primary text-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            ¡Disparar Cañones! ({burstCount})
          </button>

          <div className="apple-segmented gap-1">
            <button
              onClick={() => setIntensity('exagerado')}
              className={`cursor-pointer px-3 py-1 rounded-[10px] text-xs font-semibold transition-all ${
                intensity === 'exagerado'
                  ? 'apple-segment-active text-[#1D1D1F]'
                  : 'text-[#515154] hover:text-[#1D1D1F]'
              }`}
            >
              Exagerado x3
            </button>
            <button
              onClick={() => setIntensity('normal')}
              className={`cursor-pointer px-3 py-1 rounded-[10px] text-xs font-semibold transition-all ${
                intensity === 'normal'
                  ? 'apple-segment-active text-[#1D1D1F]'
                  : 'text-[#515154] hover:text-[#1D1D1F]'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setIntensity(intensity === 'pausa' ? 'exagerado' : 'pausa')}
              className="cursor-pointer px-2.5 py-1 rounded-[10px] text-xs font-semibold text-[#515154] hover:text-[#1D1D1F] flex items-center gap-1"
              title="Pausar/Reanudar lluvia continua"
            >
              {intensity === 'pausa' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={toggleCelebrationAudio}
            className={`apple-btn text-xs ${
              musicOn ? 'apple-btn-emerald' : 'apple-btn-secondary'
            }`}
          >
            {musicOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {musicOn ? 'Beat ON' : 'Fanfarria Live'}
          </button>
        </div>
      </div>

      {/* ESCENARIO MONUMENTAL DE CONCIERTO EN VIVO */}
      <div
        ref={stageRef}
        onClick={handleStageClick}
        className="relative overflow-hidden rounded-[26px] border border-slate-900/15 bg-gradient-to-b from-[#070b1a] via-[#110c2e] to-[#080d1d] min-h-[600px] flex flex-col justify-between shadow-[0_24px_70px_-20px_rgba(15,23,42,0.5)] select-none cursor-crosshair"
      >
        {/* Estrellas sutiles de estadio nocturno */}
        <div
          className="absolute inset-0 pointer-events-none opacity-45"
          style={{
            backgroundImage:
              'radial-gradient(1.5px 1.5px at 14% 18%, #fff 99%, transparent), radial-gradient(1.5px 1.5px at 38% 12%, #38bdf8 99%, transparent), radial-gradient(2px 2px at 66% 16%, #fde047 99%, transparent), radial-gradient(1.5px 1.5px at 84% 22%, #f472b6 99%, transparent), radial-gradient(1.5px 1.5px at 52% 9%, #ffffff 99%, transparent)'
          }}
        />

        {/* HACES DE FOCOS MÓVILES DE RECITAL */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="gpu-anim absolute -top-20 left-[18%] w-72 h-[540px] origin-top"
            style={{
              background: 'conic-gradient(from 168deg at 50% 0%, transparent 0deg, rgba(34,211,238,0.28) 15deg, transparent 30deg)',
              animation: 'discoBeam 5.2s ease-in-out infinite'
            }}
          />
          <div
            className="gpu-anim absolute -top-20 right-[18%] w-72 h-[540px] origin-top"
            style={{
              background: 'conic-gradient(from 168deg at 50% 0%, transparent 0deg, rgba(244,63,94,0.28) 15deg, transparent 30deg)',
              animation: 'discoBeam 4.4s ease-in-out infinite reverse'
            }}
          />
          <div
            className="gpu-anim absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-[540px] origin-top"
            style={{
              background: 'conic-gradient(from 168deg at 50% 0%, transparent 0deg, rgba(250,204,21,0.22) 13deg, transparent 27deg)',
              animation: 'discoBeam 6.0s ease-in-out infinite'
            }}
          />
        </div>

        {/* ESTRUCTURA TRUSS METÁLICA SUPERIOR CON CABEZAS MÓVILES + BOLA DISCO */}
        <div className="relative z-10 w-full pointer-events-none">
          <div
            className="h-5 w-full border-y border-slate-500/50 bg-slate-900/90 flex items-center justify-around px-6"
            style={{
              backgroundImage:
                'repeating-linear-gradient(60deg, rgba(148,163,184,0.25) 0 2px, transparent 2px 14px), repeating-linear-gradient(-60deg, rgba(148,163,184,0.25) 0 2px, transparent 2px 14px)'
            }}
          >
            {['#22d3ee', '#f43f5e', '#facc15', '#34d399', '#a855f7', '#38bdf8'].map((color, idx) => (
              <div key={idx} className="flex flex-col items-center translate-y-2">
                <div className="w-5 h-3 rounded-b-md bg-slate-800 border border-slate-500" />
                <div
                  className="w-3.5 h-2 rounded-full mt-0.5"
                  style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-1">
            <div className="flex flex-col items-center">
              <div className="w-[2px] h-5 bg-gradient-to-b from-slate-300 to-slate-500" />
              <div
                className="gpu-anim w-11 h-11 rounded-full border border-white/60 shadow-[0_0_28px_rgba(255,255,255,0.45)] relative overflow-hidden"
                style={{
                  background: 'radial-gradient(circle at 32% 30%, #ffffff 0%, #cbd5e1 28%, #475569 75%, #1e293b 100%)',
                  animation: 'discoSpin 9s linear infinite'
                }}
              >
                <div
                  className="absolute inset-0 opacity-65"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, rgba(255,255,255,0.45) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(15,23,42,0.5) 0 1px, transparent 1px 6px)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* TOPO CON GLOBOS VOLANDO POR ENCIMA DEL FESTIVAL */}
        <div
          className="gpu-anim absolute top-10 inset-x-0 pointer-events-none z-30 overflow-visible"
          style={{ height: '220px' }}
        >
          <div className="gpu-anim w-full" style={{ animation: 'moleFlightAcross 18s linear infinite' }}>
            <div
              className="gpu-anim relative w-48 sm:w-56 pointer-events-auto cursor-pointer"
              onClick={handleMoleClick}
              title="¡Tocá al topo o sus globos!"
              style={{ animation: 'moleBobGentle 2.3s ease-in-out infinite' }}
            >
              <div className="absolute -top-5 -right-10 sm:-right-14 bg-white text-slate-950 font-bold text-[10.5px] px-2.5 py-1 rounded-2xl rounded-bl-none shadow-lg border-2 border-amber-300 whitespace-nowrap">
                {MOLE_QUOTES[quoteIdx]}
              </div>

              <svg viewBox="0 0 220 250" className="w-full h-auto drop-shadow-[0_14px_24px_rgba(0,0,0,0.55)]">
                <g stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" fill="none">
                  <path d="M55,78 Q62,126 86,174" />
                  <path d="M80,62 Q82,118 86,174" />
                  <path d="M108,54 Q102,114 86,174" />
                  <path d="M138,62 Q122,120 86,174" />
                  <path d="M162,80 Q132,128 86,174" />
                  <path d="M92,88 Q90,130 86,174" />
                  <path d="M126,88 Q112,132 86,174" />
                  {extraBalloons > 0 && <path d="M36,96 Q58,136 86,174" />}
                  {extraBalloons > 1 && <path d="M180,100 Q144,136 86,174" />}
                  {extraBalloons > 2 && <path d="M110,36 Q100,105 86,174" />}
                </g>

                <g className="gpu-anim" style={{ transformOrigin: '86px 174px', animation: 'balloonSway 2.8s ease-in-out infinite' }}>
                  {[
                    { cx: 55, cy: 56, rx: 19, ry: 23, fill: '#f43f5e' },
                    { cx: 80, cy: 40, rx: 20, ry: 24, fill: '#22d3ee' },
                    { cx: 108, cy: 32, rx: 21, ry: 25, fill: '#facc15' },
                    { cx: 138, cy: 40, rx: 20, ry: 24, fill: '#a855f7' },
                    { cx: 162, cy: 58, rx: 19, ry: 23, fill: '#34d399' },
                    { cx: 92, cy: 66, rx: 18, ry: 22, fill: '#fb7185' },
                    { cx: 126, cy: 66, rx: 18, ry: 22, fill: '#f97316' },
                    ...(extraBalloons > 0 ? [{ cx: 36, cy: 76, rx: 17, ry: 21, fill: '#38bdf8' }] : []),
                    ...(extraBalloons > 1 ? [{ cx: 180, cy: 80, rx: 17, ry: 21, fill: '#e879f9' }] : []),
                    ...(extraBalloons > 2 ? [{ cx: 110, cy: 18, rx: 18, ry: 22, fill: '#fde047' }] : [])
                  ].map((b, idx) => (
                    <g key={idx}>
                      <ellipse cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={b.fill} stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
                      <polygon points={`${b.cx - 3},${b.cy + b.ry} ${b.cx + 3},${b.cy + b.ry} ${b.cx},${b.cy + b.ry + 4}`} fill={b.fill} />
                      <ellipse
                        cx={b.cx - b.rx * 0.34}
                        cy={b.cy - b.ry * 0.34}
                        rx={b.rx * 0.22}
                        ry={b.ry * 0.32}
                        transform={`rotate(-24 ${b.cx - b.rx * 0.34} ${b.cy - b.ry * 0.34})`}
                        fill="rgba(255,255,255,0.65)"
                      />
                    </g>
                  ))}
                </g>

                <g>
                  <ellipse cx="95" cy="233" rx="11" ry="7" fill="#f9a8d4" stroke="#6b4423" strokeWidth="1.5" />
                  <ellipse cx="131" cy="233" rx="11" ry="7" fill="#f9a8d4" stroke="#6b4423" strokeWidth="1.5" />
                  <ellipse cx="113" cy="194" rx="34" ry="37" fill="#6b4423" stroke="#3f240e" strokeWidth="2" />
                  <ellipse cx="113" cy="199" rx="22" ry="26" fill="#e7cfa9" />
                  <circle cx="84" cy="150" r="9" fill="#5c391b" />
                  <circle cx="84" cy="150" r="4.5" fill="#f472b6" />
                  <circle cx="142" cy="150" r="9" fill="#5c391b" />
                  <circle cx="142" cy="150" r="4.5" fill="#f472b6" />
                  <ellipse cx="113" cy="159" rx="30" ry="25" fill="#784d28" stroke="#3f240e" strokeWidth="1.8" />
                  <polygon points="113,108 97,138 129,138" fill="#ec4899" stroke="#fde047" strokeWidth="1.6" />
                  <line x1="103" y1="127" x2="123" y2="127" stroke="#22d3ee" strokeWidth="3" />
                  <circle cx="113" cy="107" r="5" fill="#facc15" />
                  <rect x="89" y="146" width="20" height="12" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
                  <rect x="117" y="146" width="20" height="12" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
                  <line x1="109" y1="151" x2="117" y2="151" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="93" y1="149" x2="99" y2="155" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="121" y1="149" x2="127" y2="155" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round" />
                  <ellipse cx="113" cy="168" rx="15" ry="10" fill="#fbcfe8" />
                  <ellipse cx="113" cy="164" rx="6.5" ry="4.5" fill="#e11d48" />
                  <path d="M105,172 Q113,178 121,172" stroke="#451a03" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                  <g stroke="#3f240e" strokeWidth="1.4" strokeLinecap="round">
                    <line x1="96" y1="166" x2="80" y2="163" />
                    <line x1="96" y1="170" x2="80" y2="173" />
                    <line x1="130" y1="166" x2="146" y2="163" />
                    <line x1="130" y1="170" x2="146" y2="173" />
                  </g>
                  <path d="M84,185 Q75,178 86,174" stroke="#6b4423" strokeWidth="11" strokeLinecap="round" fill="none" />
                  <circle cx="86" cy="174" r="6.5" fill="#f9a8d4" />
                  <g style={{ transformOrigin: '140px 185px', animation: 'armWaveRight 0.7s ease-in-out infinite' }}>
                    <path d="M140,185 Q156,174 162,162" stroke="#6b4423" strokeWidth="11" strokeLinecap="round" fill="none" />
                    <circle cx="163" cy="160" r="6.5" fill="#f9a8d4" />
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* ZONA MEDIA DEL RECITAL: PANTALLA LED IZQ + CARTEL PRINCIPAL "FIN" + PANTALLA LED DER */}
        <div className="relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-3 px-4 sm:px-6 pt-6 items-center">
          {/* PANTALLA LED IZQUIERDA + TORRE LINE ARRAY */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-2.5">
            <div className="rounded-2xl bg-slate-950/90 border border-cyan-400/40 p-3.5 shadow-[0_0_24px_rgba(34,211,238,0.2)]">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 border-b border-cyan-500/20 pb-1.5 mb-2">
                <span className="flex items-center gap-1 font-bold">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                  LED STAGE • TELEMETRÍA
                </span>
                <span className="text-emerald-400 font-bold">LIVE</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11.5px] text-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-300">Congestión Reno:</span>
                  <span className="text-cyan-300 font-bold">0% LOSS ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Checksum Comp.1:</span>
                  <span className="text-emerald-300 font-bold">0xFFFF ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Cierre 4-Way:</span>
                  <span className="text-amber-300 font-bold">FIN-ACK ✓</span>
                </div>
              </div>
              <div className="flex items-end gap-1 h-7 mt-2.5 pt-1 border-t border-white/10">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    className="gpu-anim flex-1 rounded-t-sm origin-bottom h-full"
                    style={{
                      background: i % 2 === 0 ? '#22d3ee' : '#f43f5e',
                      animation: `eqBar ${0.38 + (i % 4) * 0.1}s ease-in-out ${(i % 5) * 0.08}s infinite`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CARTEL PRINCIPAL GIGANTE DEL SHOW: "FIN" */}
          <div className="lg:col-span-6 flex flex-col items-center text-center">
            <div className="relative px-8 sm:px-14 py-5 sm:py-7 rounded-[2.2rem] bg-slate-950/80 backdrop-blur-md border-2 border-amber-300/60 shadow-[0_0_65px_-10px_rgba(251,191,36,0.55),inset_0_0_25px_rgba(34,211,238,0.18)]">
              <div className="flex justify-around gap-2.5 mb-2.5 px-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={`top-${i}`}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: i % 3 === 0 ? '#facc15' : i % 3 === 1 ? '#22d3ee' : '#f43f5e',
                      boxShadow: `0 0 8px ${i % 3 === 0 ? '#facc15' : i % 3 === 1 ? '#22d3ee' : '#f43f5e'}`,
                      animation: `marqueeBulb 0.85s ease-in-out ${(i % 3) * 0.25}s infinite`
                    }}
                  />
                ))}
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10.5px] font-mono tracking-widest uppercase text-amber-200 mb-1.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                FIN-ACK RECIBIDO • CONCIERTO DE CIERRE
                <Sparkles className="w-3 h-3 text-cyan-300" />
              </div>

              <h1
                className="gpu-anim font-black tracking-[0.06em] leading-none bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-300 bg-clip-text text-transparent select-none"
                style={{
                  fontSize: 'clamp(4rem, 10vw, 7.8rem)',
                  animation: 'finGlowPulse 2.4s ease-in-out infinite'
                }}
              >
                FIN
              </h1>

              <p className="mt-1.5 text-sm sm:text-lg font-bold text-white tracking-tight">
                ¡Muchas gracias por su atención! 🎸🎉
              </p>
              <p className="mt-0.5 text-[11px] sm:text-xs font-mono text-cyan-200/90">
                Escuela 4-025 Los Corralitos • UTN FRM • Redes de Datos
              </p>

              <div className="flex justify-around gap-2.5 mt-3 px-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={`bot-${i}`}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#f43f5e' : '#facc15',
                      boxShadow: `0 0 8px ${i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#f43f5e' : '#facc15'}`,
                      animation: `marqueeBulb 0.85s ease-in-out ${((i + 1) % 3) * 0.25}s infinite`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* PANTALLA LED DERECHA */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-2.5">
            <div className="rounded-2xl bg-slate-950/90 border border-fuchsia-400/40 p-3.5 shadow-[0_0_24px_rgba(232,121,249,0.2)]">
              <div className="flex items-center justify-between text-[11px] font-mono text-fuchsia-300 border-b border-fuchsia-500/20 pb-1.5 mb-2">
                <span className="font-bold">LED STAGE • RED ESCOLAR</span>
                <span className="text-amber-300 font-bold">UTN FRM</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11.5px] text-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-300">Proxy Inverso:</span>
                  <span className="text-cyan-300 font-bold">Nginx :443</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Backend Web:</span>
                  <span className="text-amber-300 font-bold">Apache :8080</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Core L3 + FW:</span>
                  <span className="text-emerald-300 font-bold">C9200 + MX100</span>
                </div>
              </div>
              <div className="flex items-end gap-1 h-7 mt-2.5 pt-1 border-t border-white/10">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    className="gpu-anim flex-1 rounded-t-sm origin-bottom h-full"
                    style={{
                      background: i % 2 === 0 ? '#e879f9' : '#facc15',
                      animation: `eqBar ${0.42 + ((13 - i) % 4) * 0.09}s ease-in-out ${(i % 5) * 0.08}s infinite`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TARIMA DEL CONCIERTO: SUBWOOFERS + BANDA/DJ + BAILARINES + PÚBLICO CON CARTELES */}
        <div className="relative z-20 pt-3">
          {/* 1. Tarima principal */}
          <div className="relative px-3 sm:px-6 flex items-end justify-between gap-2 pointer-events-none">
            {/* Torre Subwoofer Izquierda */}
            <div className="hidden sm:flex flex-col items-center gap-1 bg-slate-900/95 border border-slate-600/70 rounded-xl p-1.5 shadow-lg">
              {[0, 1].map((sp) => (
                <div key={sp} className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center">
                  <div
                    className="gpu-anim w-7 h-7 rounded-full border-2 border-cyan-400 bg-slate-800 flex items-center justify-center"
                    style={{ animation: `wooferPulse 0.5s ease-in-out ${sp * 0.12}s infinite` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-300" />
                  </div>
                </div>
              ))}
            </div>

            {/* Personajes sobre Tarima */}
            <div className="flex-1 flex items-end justify-around gap-1 sm:gap-2">
              {/* Chico con gorra */}
              <svg viewBox="0 0 90 120" className="gpu-anim w-14 sm:w-18 h-auto" style={{ animation: 'danceBounceA 0.52s ease-in-out infinite' }}>
                <ellipse cx="45" cy="114" rx="22" ry="4" fill="rgba(34,211,238,0.35)" />
                <path d="M38,84 L32,110" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                <path d="M52,84 L58,110" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                <rect x="24" y="106" width="12" height="6" rx="3" fill="#22d3ee" />
                <rect x="54" y="106" width="12" height="6" rx="3" fill="#22d3ee" />
                <rect x="30" y="46" width="30" height="40" rx="10" fill="#06b6d4" />
                <g style={{ transformOrigin: '30px 54px', animation: 'armWaveLeft 0.5s ease-in-out infinite' }}>
                  <path d="M30,54 L14,32" stroke="#f5c6a5" strokeWidth="7" strokeLinecap="round" />
                </g>
                <g style={{ transformOrigin: '60px 54px', animation: 'armWaveRight 0.5s ease-in-out infinite' }}>
                  <path d="M60,54 L76,32" stroke="#f5c6a5" strokeWidth="7" strokeLinecap="round" />
                </g>
                <circle cx="45" cy="30" r="14" fill="#f5c6a5" />
                <path d="M31,26 Q45,12 59,26 Z" fill="#f43f5e" />
                <rect x="54" y="22" width="11" height="4" rx="2" fill="#f43f5e" />
                <circle cx="40" cy="31" r="1.8" fill="#0f172a" />
                <circle cx="50" cy="31" r="1.8" fill="#0f172a" />
                <path d="M40,36 Q45,40 50,36" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>

              {/* Breakdancer */}
              <svg viewBox="0 0 90 120" className="gpu-anim w-14 sm:w-18 h-auto hidden sm:block" style={{ animation: 'danceSpinHop 1.1s ease-in-out infinite' }}>
                <ellipse cx="45" cy="114" rx="22" ry="4" fill="rgba(250,204,21,0.35)" />
                <path d="M39,82 L30,108" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                <path d="M51,82 L61,106" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                <rect x="23" y="104" width="12" height="6" rx="3" fill="#facc15" />
                <rect x="56" y="102" width="12" height="6" rx="3" fill="#facc15" />
                <rect x="30" y="46" width="30" height="39" rx="9" fill="#f59e0b" />
                <path d="M30,54 L12,48" stroke="#f5c6a5" strokeWidth="7" strokeLinecap="round" />
                <path d="M60,54 L78,34" stroke="#f5c6a5" strokeWidth="7" strokeLinecap="round" />
                <circle cx="45" cy="30" r="13.5" fill="#f5c6a5" />
                <rect x="34" y="25" width="22" height="6" rx="2" fill="#0f172a" />
                <path d="M40,36 Q45,40 50,36" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>

              {/* CABINA DJ CON CHICA DJ + TORNAMESAS LUMINOSAS */}
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 90 92" className="gpu-anim w-14 sm:w-18 h-auto -mb-2" style={{ animation: 'danceBounceB 0.56s ease-in-out 0.1s infinite' }}>
                  <path d="M30,48 L60,48 L64,86 L26,86 Z" fill="#a855f7" />
                  <g style={{ transformOrigin: '30px 54px', animation: 'armWaveLeft 0.55s ease-in-out 0.2s infinite' }}>
                    <path d="M30,54 L16,42" stroke="#e2a888" strokeWidth="6.5" strokeLinecap="round" />
                  </g>
                  <g style={{ transformOrigin: '60px 54px', animation: 'armWaveRight 0.55s ease-in-out 0.2s infinite' }}>
                    <path d="M60,54 L75,62" stroke="#e2a888" strokeWidth="6.5" strokeLinecap="round" />
                  </g>
                  <circle cx="45" cy="30" r="15" fill="#1e1b4b" />
                  <circle cx="45" cy="31" r="12.5" fill="#e2a888" />
                  <path d="M29,28 Q45,9 61,28" stroke="#22d3ee" strokeWidth="4" fill="none" />
                  <rect x="27" y="25" width="6" height="12" rx="3" fill="#22d3ee" />
                  <rect x="57" y="25" width="6" height="12" rx="3" fill="#22d3ee" />
                  <circle cx="41" cy="31" r="1.7" fill="#0f172a" />
                  <circle cx="49" cy="31" r="1.7" fill="#0f172a" />
                  <path d="M41,36 Q45,40 49,36" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
                {/* Consola DJ frontal */}
                <div className="w-32 sm:w-40 h-11 rounded-t-xl bg-slate-900 border-2 border-cyan-400/70 shadow-[0_0_24px_rgba(34,211,238,0.35)] px-2.5 flex items-center justify-between">
                  <div className="gpu-anim w-7 h-7 rounded-full border-2 border-pink-400 bg-slate-950 flex items-center justify-center" style={{ animation: 'vinylSpin 2s linear infinite' }}>
                    <div className="w-2 h-2 rounded-full bg-amber-300" />
                  </div>
                  <div className="text-center">
                    <div className="text-[10.5px] font-mono font-black text-cyan-300 tracking-wider">DJ MIXER L4</div>
                    <div className="flex gap-0.5 justify-center mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    </div>
                  </div>
                  <div className="gpu-anim w-7 h-7 rounded-full border-2 border-cyan-400 bg-slate-950 flex items-center justify-center" style={{ animation: 'vinylSpin 2s linear infinite reverse' }}>
                    <div className="w-2 h-2 rounded-full bg-pink-400" />
                  </div>
                </div>
              </div>

              {/* Router Cisco Vocalista con Micrófono */}
              <svg viewBox="0 0 100 120" className="gpu-anim w-16 sm:w-22 h-auto" style={{ animation: 'danceBounceA 0.48s ease-in-out 0.08s infinite' }}>
                <ellipse cx="50" cy="114" rx="26" ry="4" fill="rgba(52,211,153,0.4)" />
                <line x1="30" y1="54" x2="22" y2="24" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                <circle cx="22" cy="22" r="4" fill="#22d3ee" />
                <line x1="70" y1="54" x2="78" y2="24" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                <circle cx="78" cy="22" r="4" fill="#f43f5e" />
                <path d="M38,88 L35,110" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
                <path d="M62,88 L65,110" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
                <rect x="20" y="52" width="60" height="38" rx="9" fill="#0f766e" stroke="#2dd4bf" strokeWidth="2.5" />
                <path d="M34,66 Q38,61 42,66" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M58,66 Q62,61 66,66" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M42,74 Q50,81 58,74" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <circle cx="28" cy="82" r="2.5" fill="#4ade80" />
                <circle cx="36" cy="82" r="2.5" fill="#22d3ee" />
                <circle cx="44" cy="82" r="2.5" fill="#facc15" />
                <g style={{ transformOrigin: '20px 68px', animation: 'armWaveLeft 0.45s ease-in-out infinite' }}>
                  <path d="M20,68 L6,50" stroke="#cbd5e1" strokeWidth="5.5" strokeLinecap="round" />
                  <circle cx="5" cy="46" r="4.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                </g>
                <g style={{ transformOrigin: '80px 68px', animation: 'armWaveRight 0.45s ease-in-out infinite' }}>
                  <path d="M80,68 L94,50" stroke="#cbd5e1" strokeWidth="5.5" strokeLinecap="round" />
                </g>
              </svg>

              {/* Estudiante con Laptop 200 OK + Chica cartel 10★ */}
              <svg viewBox="0 0 90 120" className="gpu-anim w-14 sm:w-18 h-auto" style={{ animation: 'danceBounceB 0.54s ease-in-out 0.18s infinite' }}>
                <ellipse cx="45" cy="114" rx="22" ry="4" fill="rgba(56,189,248,0.35)" />
                <path d="M38,84 L33,110" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                <path d="M52,84 L57,110" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                <rect x="26" y="106" width="11" height="6" rx="3" fill="#34d399" />
                <rect x="53" y="106" width="11" height="6" rx="3" fill="#34d399" />
                <rect x="30" y="46" width="30" height="40" rx="9" fill="#10b981" />
                <g style={{ transformOrigin: '30px 54px', animation: 'armWaveLeft 0.52s ease-in-out 0.1s infinite' }}>
                  <path d="M30,54 L13,34" stroke="#f5c6a5" strokeWidth="7" strokeLinecap="round" />
                  <rect x="2" y="18" width="20" height="14" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="12" y="28" textAnchor="middle" fill="#4ade80" fontSize="6" fontFamily="monospace" fontWeight="bold">OK</text>
                </g>
                <g style={{ transformOrigin: '60px 54px', animation: 'armWaveRight 0.52s ease-in-out 0.1s infinite' }}>
                  <path d="M60,54 L76,38" stroke="#f5c6a5" strokeWidth="7" strokeLinecap="round" />
                </g>
                <circle cx="45" cy="30" r="14" fill="#f5c6a5" />
                <path d="M31,26 Q45,14 59,26 Q55,15 45,15 Q35,15 31,26 Z" fill="#451a03" />
                <circle cx="40" cy="31" r="1.8" fill="#0f172a" />
                <circle cx="50" cy="31" r="1.8" fill="#0f172a" />
                <path d="M40,36 Q45,40 50,36" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* Torre Subwoofer Derecha */}
            <div className="hidden sm:flex flex-col items-center gap-1 bg-slate-900/95 border border-slate-600/70 rounded-xl p-1.5 shadow-lg">
              {[0, 1].map((sp) => (
                <div key={sp} className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center">
                  <div
                    className="gpu-anim w-7 h-7 rounded-full border-2 border-rose-400 bg-slate-800 flex items-center justify-center"
                    style={{ animation: `wooferPulse 0.5s ease-in-out ${sp * 0.12}s infinite` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Borde luminoso de Tarima */}
          <div className="h-2.5 w-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 shadow-[0_0_18px_rgba(232,121,249,0.5)]" />

          {/* 3. MULTITUD DEL CONCIERTO SALTANDO CON LINTERNAS Y CARTELES */}
          <div className="bg-gradient-to-b from-slate-950/90 to-[#040711] px-3 pt-2.5 pb-2 border-t border-white/15">
            {/* Cartelitos del público levantados */}
            <div className="flex flex-wrap items-center justify-around gap-1.5 mb-2">
              {CROWD_SIGNS.map((sign, i) => (
                <div
                  key={sign.label}
                  className={`gpu-anim px-2.5 py-0.5 rounded-md border text-[11px] font-mono font-extrabold shadow-md ${sign.bg}`}
                  style={{ animation: `crowdWave ${0.65 + (i % 3) * 0.14}s ease-in-out ${i * 0.08}s infinite` }}
                >
                  {sign.label}
                </div>
              ))}
            </div>

            {/* Siluetas de multitud con lucecitas de celulares */}
            <div className="flex items-end justify-around gap-1 overflow-hidden h-9">
              {Array.from({ length: 22 }).map((_, i) => (
                <div
                  key={i}
                  className="gpu-anim flex flex-col items-center"
                  style={{ animation: `crowdWave ${0.52 + (i % 4) * 0.1}s ease-in-out ${(i % 5) * 0.09}s infinite` }}
                >
                  {i % 3 === 0 && (
                    <span
                      className="w-1.5 h-1.5 rounded-full mb-0.5"
                      style={{
                        backgroundColor: i % 2 === 0 ? '#fde047' : '#38bdf8',
                        boxShadow: `0 0 8px ${i % 2 === 0 ? '#fde047' : '#38bdf8'}`
                      }}
                    />
                  )}
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border border-white/20" />
                  <div className="w-5 h-3.5 rounded-t-md bg-slate-800 border-x border-t border-white/15 -mt-0.5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE INTEGRADO DE REFERENCIAS BIBLIOGRÁFICAS, RFCS E INFRAESTRUCTURA (CUPERTINO CLARO) */}
      <div className="apple-bento p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EAF3FF] border border-[#0071E3]/20 flex items-center justify-center text-[#0071E3]">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#1D1D1F]">
              Referencias Bibliográficas, Estándares RFC e Infraestructura
            </h3>
          </div>
          <span className="text-xs font-medium text-[#515154] bg-[#F5F5F7] px-3 py-1 rounded-full border border-black/[0.07]">
            Fuentes Académicas &amp; Topología Verificada
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 text-xs">
          {/* Ref 1: Bibliografía Académica */}
          <div className="p-4 rounded-[18px] bg-[#F5F5F7] border border-black/[0.06] space-y-2">
            <div className="flex items-center gap-1.5 text-[#0071E3] font-bold text-[13px]">
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Bibliografía Base</span>
            </div>
            <ul className="text-xs text-[#3A3A3C] space-y-1.5 leading-relaxed">
              <li>
                <strong className="text-[#1D1D1F]">Kurose, J. F. &amp; Ross, K. W.:</strong>{' '}
                <em>Computer Networking: A Top-Down Approach</em> (Cap. 3 — Capa de Transporte, Multiplexación, RDT y Control de Congestión).
              </li>
              <li>
                <strong className="text-[#1D1D1F]">Tanenbaum, A. S.:</strong>{' '}
                <em>Computer Networks</em> (Cap. 6 — Protocolos TCP/UDP y Gestión de Conexiones).
              </li>
            </ul>
          </div>

          {/* Ref 2: RFCs IETF */}
          <div className="p-4 rounded-[18px] bg-[#F5F5F7] border border-black/[0.06] space-y-2">
            <div className="flex items-center gap-1.5 text-[#5856D6] font-bold text-[13px]">
              <FileCode2 className="w-4 h-4 shrink-0" />
              <span>Estándares IETF (RFCs)</span>
            </div>
            <ul className="text-xs text-[#3A3A3C] space-y-1.5 leading-relaxed font-mono">
              <li>
                <strong className="text-[#1D1D1F]">RFC 9293:</strong> TCP (Handshake 3-Way, RST, Teardown 4-Way).
              </li>
              <li>
                <strong className="text-[#1D1D1F]">RFC 5681:</strong> TCP Congestion Control (Slow Start, AIMD, Fast Recovery).
              </li>
              <li>
                <strong className="text-[#1D1D1F]">RFC 1071 &amp; RFC 768:</strong> Checksum Complemento a 1 e IANA UDP.
              </li>
            </ul>
          </div>

          {/* Ref 3: Infraestructura Escuela 4-025 */}
          <div className="p-4 rounded-[18px] bg-[#F5F5F7] border border-black/[0.06] space-y-2">
            <div className="flex items-center gap-1.5 text-[#047857] font-bold text-[13px]">
              <Network className="w-4 h-4 shrink-0" />
              <span>Topología Escuela 4-025</span>
            </div>
            <ul className="text-xs text-[#3A3A3C] space-y-1.5 leading-relaxed font-mono">
              <li>• <strong className="text-[#1D1D1F]">Proxmox &amp; Web:</strong> Nginx (:443) → Apache (:8080)</li>
              <li>• <strong className="text-[#1D1D1F]">LAN / Auth:</strong> Samba (:445) • DHCP (:67/68)</li>
              <li>• <strong className="text-[#1D1D1F]">Core &amp; WAN:</strong> Cisco C9200 (SVI) • Meraki MX100 • MikroTik PCC</li>
            </ul>
          </div>

          {/* Ref 4: Cátedra UTN */}
          <div className="p-4 rounded-[18px] bg-[#F5F5F7] border border-black/[0.06] space-y-2">
            <div className="flex items-center gap-1.5 text-[#BE123C] font-bold text-[13px]">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Cátedra &amp; Proyecto</span>
            </div>
            <ul className="text-xs text-[#3A3A3C] space-y-1.5 leading-relaxed">
              <li>
                <strong className="text-[#1D1D1F]">Institución:</strong> UTN Facultad Regional Mendoza (FR Mendoza).
              </li>
              <li>
                <strong className="text-[#1D1D1F]">Materia:</strong> Redes de Información / Redes de Datos (Docentes: Tonelli / Cutuli).
              </li>
              <li>
                <strong className="text-[#1D1D1F]">Escenario Real:</strong> Red Educativa Escuela 4-025 Los Corralitos.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
