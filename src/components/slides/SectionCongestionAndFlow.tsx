import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Contenedor integrado sin marco externo para el simulador de Congestión y Flujo TCP.
 * Usa la misma carcasa Cupertino Clara que el resto de las diapositivas y ajusta
 * la altura del iframe automáticamente al contenido para evitar scrollbars internos.
 */
export const SectionCongestionAndFlow: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [frameHeight, setFrameHeight] = useState<number>(920);

  const syncHeight = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (!doc?.body) return;
    const measured = Math.max(
      doc.body.scrollHeight,
      doc.documentElement?.scrollHeight ?? 0,
      780
    );
    setFrameHeight((prev) => (Math.abs(prev - measured) > 2 ? measured : prev));
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let observer: ResizeObserver | null = null;

    const attachObserver = () => {
      syncHeight();
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc?.body || typeof ResizeObserver === 'undefined') return;
      observer?.disconnect();
      observer = new ResizeObserver(() => syncHeight());
      observer.observe(doc.body);
    };

    if (iframe.contentDocument?.readyState === 'complete') {
      attachObserver();
    }

    iframe.addEventListener('load', attachObserver);
    window.addEventListener('resize', syncHeight);

    return () => {
      iframe.removeEventListener('load', attachObserver);
      window.removeEventListener('resize', syncHeight);
      observer?.disconnect();
    };
  }, [syncHeight]);

  return (
    <section
      aria-label="Control de Congestión y Búferes TCP"
      className="apple-pro-canvas relative rounded-[30px] bg-[#F5F5F7] border border-black/[0.07] text-[#1D1D1F] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] overflow-hidden transition-all"
    >
      <iframe
        ref={iframeRef}
        src="/slides/congestion-flujo/index.html"
        title="Simulador de Control de Congestión y Búferes TCP"
        scrolling="no"
        onLoad={syncHeight}
        style={{ height: `${frameHeight}px` }}
        className="w-full min-h-[780px] border-0 block bg-[#F5F5F7]"
      />
    </section>
  );
};
