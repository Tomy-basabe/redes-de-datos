/**
 * flowControlChartEngine.js - Motor Gráfico Dinámico de Control de Flujo TCP
 * 
 * Basado rigurosamente en Kurose & Ross (Cap. 3.5.5 "Control de flujo"):
 * - RcvBuffer: Tamaño del búfer del receptor (Host B / Nginx - Samba VLAN 10).
 * - rwnd = RcvBuffer - (LastByteRcvd - LastByteRead): Espacio libre en búfer receptor.
 * - Ventana Efectiva de Envío = min(cwnd, rwnd): Restricción real de transmisión.
 * - Caso especial: rwnd = 0 y emisión de sondas de 1 byte para evitar interbloqueo (deadlock).
 */

class FlowControlChartEngine {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    if (!this.canvas) return;
    this.ctx = canvasElement.getContext('2d');
    this.options = {
      mss: options.mss || 1460,
      rcvBufferMSS: options.rcvBufferMSS || 16,
      maxRoundsDisplay: options.maxRoundsDisplay || 16
    };

    this.dataPoints = [];
    this.hoveredPoint = null;

    // Paleta visual armónica para control de flujo
    this.colors = {
      bg: '#ffffff',
      grid: '#e2e8f0',
      textMuted: '#64748b',
      textBright: '#0f172a',
      rwndLine: '#059669',            // Verde esmeralda para Ventana de Recepción
      rwndGlow: 'rgba(5, 150, 105, 0.25)',
      cwndLine: '#0284c7',            // Azul primario para Ventana de Congestión
      effectiveLine: '#7c3aed',       // Violeta / Púrpura para Ventana Efectiva = min(cwnd, rwnd)
      effectiveFill: 'rgba(124, 58, 237, 0.12)',
      rcvBufferRef: '#94a3b8',        // Gris para tope físico del búfer
      throttleBadge: '#ea580c',       // Naranja de advertencia (flujo estrangulado)
      zeroBadge: '#ef4444'            // Rojo de bloqueo (rwnd = 0)
    };

    this.setupCanvas();
    this.attachEventListeners();
    this.render();
  }

  setupCanvas() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 280;

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = width;
    this.height = height;

    this.padding = {
      top: 30,
      right: 28,
      bottom: 40,
      left: 60
    };
  }

  attachEventListeners() {
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.render();
    });

    if (this.canvas) {
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        this.handleMouseMove(mouseX, mouseY);
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.hoveredPoint = null;
        this.render();
      });
    }
  }

  setMSS(mss) {
    this.options.mss = mss;
    this.render();
  }

  updateData(historyRounds) {
    if (!Array.isArray(historyRounds)) return;

    this.dataPoints = historyRounds.map((hr, idx) => {
      const cwnd = hr.cwnd || 1;
      const rwnd = hr.rwnd !== undefined ? hr.rwnd : 16;
      const rcvBuffer = hr.rcvBuffer || 16;
      const effectiveWindow = Math.min(cwnd, rwnd);
      const isThrottled = rwnd < cwnd;
      const isZero = rwnd === 0;

      return {
        round: hr.round !== undefined ? hr.round : idx + 1,
        cwnd: cwnd,
        rwnd: rwnd,
        effectiveWindow: effectiveWindow,
        rcvBuffer: rcvBuffer,
        isThrottled: isThrottled,
        isZero: isZero,
        flowState: isZero ? 'ZERO_WINDOW' : (isThrottled ? 'FLOW_LIMITED' : 'CONGESTION_LIMITED'),
        receiverProfile: hr.receiverProfile || 'NGINX_NORMAL'
      };
    });

    this.render();
  }

  handleMouseMove(mouseX, mouseY) {
    if (!this.dataPoints || this.dataPoints.length === 0) return;

    let closest = null;
    let minDist = 24;

    this.dataPoints.forEach((pt) => {
      if (pt.screenX !== undefined && pt.screenY !== undefined) {
        const dist = Math.hypot(mouseX - pt.screenX, mouseY - pt.screenY);
        if (dist < minDist) {
          minDist = dist;
          closest = pt;
        }
      }
    });

    if (this.hoveredPoint !== closest) {
      this.hoveredPoint = closest;
      this.render();
    }
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const pad = this.padding;

    ctx.clearRect(0, 0, w, h);

    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Rango dinámico
    const maxRound = Math.max(16, this.dataPoints.length > 0 ? this.dataPoints[this.dataPoints.length - 1].round : 16);
    let maxYVal = 18;
    this.dataPoints.forEach((pt) => {
      if (pt.cwnd > maxYVal) maxYVal = pt.cwnd + 2;
      if (pt.rwnd > maxYVal) maxYVal = pt.rwnd + 2;
      if (pt.rcvBuffer > maxYVal) maxYVal = pt.rcvBuffer + 2;
    });

    const getX = (round) => pad.left + ((round - 1) / (maxRound - 1)) * plotW;
    const getY = (val) => pad.top + plotH - (val / maxYVal) * plotH;

    // 1. Cuadrícula de Fondo
    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 1;

    // Líneas Horizontales (MSS)
    const yStep = maxYVal > 24 ? 4 : (maxYVal > 12 ? 3 : 2);
    ctx.fillStyle = this.colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let yVal = 0; yVal <= maxYVal; yVal += yStep) {
      const yPos = getY(yVal);
      ctx.beginPath();
      ctx.moveTo(pad.left, yPos);
      ctx.lineTo(w - pad.right, yPos);
      ctx.stroke();
      ctx.fillText(`${yVal} MSS`, pad.left - 8, yPos);
    }

    // Líneas Verticales (Rounds)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let r = 1; r <= maxRound; r++) {
      if (maxRound <= 16 || r % 2 === 1 || r === maxRound) {
        const xPos = getX(r);
        ctx.beginPath();
        ctx.moveTo(xPos, pad.top);
        ctx.lineTo(xPos, h - pad.bottom);
        ctx.stroke();
        ctx.fillText(`${r}`, xPos, h - pad.bottom + 8);
      }
    }

    // Título de Eje X
    ctx.fillStyle = this.colors.textMuted;
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ciclo de Transmisión / RTT', pad.left + plotW / 2, h - pad.bottom + 24);

    // 2. Línea de Referencia de RcvBuffer (Capacidad Máxima)
    const rcvBufVal = this.options.rcvBufferMSS || 16;
    const yRcvBuf = getY(rcvBufVal);
    ctx.save();
    ctx.strokeStyle = this.colors.rcvBufferRef;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, yRcvBuf);
    ctx.lineTo(w - pad.right, yRcvBuf);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`RcvBuffer = ${rcvBufVal} MSS (Límite Físico de Memoria en Host B)`, pad.left + 8, yRcvBuf - 7);
    ctx.restore();

    if (this.dataPoints.length === 0) return;

    // Calcular coordenadas de pantalla para los puntos
    this.dataPoints.forEach((pt) => {
      pt.screenX = getX(pt.round);
      pt.screenY = getY(pt.effectiveWindow);
      pt.screenYRwnd = getY(pt.rwnd);
      pt.screenYCwnd = getY(pt.cwnd);
    });

    // 3. Área Sombreada de Ventana Efectiva min(cwnd, rwnd)
    ctx.fillStyle = this.colors.effectiveFill;
    ctx.beginPath();
    ctx.moveTo(this.dataPoints[0].screenX, getY(0));
    this.dataPoints.forEach((pt) => {
      ctx.lineTo(pt.screenX, getY(pt.effectiveWindow));
    });
    ctx.lineTo(this.dataPoints[this.dataPoints.length - 1].screenX, getY(0));
    ctx.closePath();
    ctx.fill();

    // 4. Trazo de Ventana de Congestión (cwnd) - Azul Punteado
    ctx.save();
    ctx.strokeStyle = this.colors.cwndLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    this.dataPoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.screenX, pt.screenYCwnd);
      else ctx.lineTo(pt.screenX, pt.screenYCwnd);
    });
    ctx.stroke();
    ctx.restore();

    // 5. Trazo de Ventana de Recepción (rwnd) - Verde Esmeralda Continuo
    ctx.strokeStyle = this.colors.rwndLine;
    ctx.lineWidth = 2.8;
    ctx.shadowColor = this.colors.rwndGlow;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    this.dataPoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.screenX, pt.screenYRwnd);
      else ctx.lineTo(pt.screenX, pt.screenYRwnd);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 6. Trazo de Ventana Efectiva min(cwnd, rwnd) - Violeta Continuo
    ctx.strokeStyle = this.colors.effectiveLine;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    this.dataPoints.forEach((pt, idx) => {
      const yEff = getY(pt.effectiveWindow);
      if (idx === 0) ctx.moveTo(pt.screenX, yEff);
      else ctx.lineTo(pt.screenX, yEff);
    });
    ctx.stroke();

    // 7. Puntos y Alertas de Flujo
    this.dataPoints.forEach((pt) => {
      // Punto en rwnd (Verde)
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = this.colors.rwndLine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.screenX, pt.screenYRwnd, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Punto en Ventana Efectiva (Violeta)
      const yEff = getY(pt.effectiveWindow);
      ctx.fillStyle = pt.isZero ? this.colors.zeroBadge : (pt.isThrottled ? this.colors.throttleBadge : this.colors.effectiveLine);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.screenX, yEff, pt.isThrottled || pt.isZero ? 5.5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Etiqueta de advertencia si rwnd < cwnd o rwnd == 0
      if (pt.isZero) {
        ctx.fillStyle = this.colors.zeroBadge;
        ctx.font = 'bold 10.5px ui-monospace, "SF Mono", "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('rwnd=0 (Sonda)', pt.screenX, yEff - 11);
      } else if (pt.isThrottled) {
        ctx.fillStyle = this.colors.throttleBadge;
        ctx.font = 'bold 10px ui-monospace, "SF Mono", "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Flujo: ${pt.rwnd}M`, pt.screenX, yEff - 10);
      }
    });

    // 8. Tooltip interactivo al posar el cursor
    if (this.hoveredPoint) {
      this.drawTooltip(ctx, this.hoveredPoint);
    }
  }

  drawTooltip(ctx, pt) {
    const bytesCwnd = Math.round(pt.cwnd * this.options.mss);
    const bytesRwnd = Math.round(pt.rwnd * this.options.mss);
    const bytesEff = Math.round(pt.effectiveWindow * this.options.mss);
    const bufferUsed = pt.rcvBuffer - pt.rwnd;

    const lines = [
      `Ciclo RTT ${pt.round}`,
      `rwnd (Receptor Host B): ${pt.rwnd} MSS (${bytesRwnd.toLocaleString()} B)`,
      `cwnd (Emisor Host A): ${pt.cwnd} MSS (${bytesCwnd.toLocaleString()} B)`,
      `Ventana Efectiva: min(cwnd, rwnd) = ${pt.effectiveWindow} MSS (${bytesEff.toLocaleString()} B)`,
      `Búfer en uso: ${bufferUsed} / ${pt.rcvBuffer} MSS (${(bufferUsed * this.options.mss).toLocaleString()} B)`,
      `Limitado por: ${pt.isZero ? '🛑 BÚFER LLENO (rwnd = 0 · Sondas 1 Byte)' : (pt.isThrottled ? '⚠️ CONTROL DE FLUJO (Receptor Lento)' : '🌐 CONTROL DE CONGESTIÓN (Red)')}`
    ];

    ctx.font = '11px "JetBrains Mono", monospace';
    let maxW = 0;
    lines.forEach(l => {
      const w = ctx.measureText(l).width;
      if (w > maxW) maxW = w;
    });

    const boxW = maxW + 22;
    const boxH = lines.length * 18 + 14;
    let boxX = pt.screenX + 12;
    let boxY = pt.screenY - boxH / 2;

    if (boxX + boxW > this.width - this.padding.right) {
      boxX = pt.screenX - boxW - 12;
    }
    if (boxY < this.padding.top) boxY = this.padding.top;
    if (boxY + boxH > this.height - this.padding.bottom) {
      boxY = this.height - this.padding.bottom - boxH;
    }

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = pt.isThrottled || pt.isZero ? '#ea580c' : '#059669';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    lines.forEach((line, idx) => {
      if (idx === 0) {
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
      } else if (line.includes('Limitado por:')) {
        ctx.fillStyle = pt.isZero ? this.colors.zeroBadge : (pt.isThrottled ? this.colors.throttleBadge : '#0284c7');
        ctx.font = 'bold 10.5px "JetBrains Mono", monospace';
      } else {
        ctx.fillStyle = '#475569';
        ctx.font = '10.5px "JetBrains Mono", monospace';
      }
      ctx.fillText(line, boxX + 10, boxY + 8 + idx * 18);
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlowControlChartEngine;
} else {
  window.FlowControlChartEngine = FlowControlChartEngine;
}

