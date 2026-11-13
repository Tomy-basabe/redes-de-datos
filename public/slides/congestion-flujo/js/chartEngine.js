/**
 * chartEngine.js - Motor Gráfico Dinámico de Ventana de Congestión TCP
 * Genera el gráfico en tiempo real basado en la Figura 3.53 de Kurose & Ross.
 * Adaptado a la interfaz de colores moderna y clara solicitada por el usuario.
 */

class CongestionChartEngine {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.options = {
      showTahoeComparison: options.showTahoeComparison || false,
      showPhaseBands: options.showPhaseBands !== false,
      mss: options.mss || 1460,
      maxRoundsDisplay: options.maxRoundsDisplay || 16
    };

    this.dataPoints = [];
    this.tahoePoints = [];
    this.hoveredPoint = null;

    // Paleta de colores moderna, clara y tecnológica (inspirada en la estética solicitada)
    this.colors = {
      bg: '#ffffff',
      grid: '#e2e8f0',           // Gris suave para cuadrícula
      textMuted: '#64748b',      // Slate intermedio
      textBright: '#0f172a',     // Slate oscuro legible
      cwndLine: '#0284c7',       // Azul vibrante primario (Reno)
      cwndGlow: 'rgba(2, 132, 199, 0.25)',
      ssthreshLine: '#ea580c',   // Naranja / Ámbar umbral
      tahoeLine: '#0d9488',      // Turquesa / Teal para Tahoe
      lossMarker: '#ef4444',     // Rojo para pérdidas
      slowStartBand: 'rgba(99, 102, 241, 0.07)',       // Indigo suave
      congestionAvoidanceBand: 'rgba(2, 132, 199, 0.05)', // Azul suave
      fastRecoveryBand: 'rgba(234, 88, 12, 0.08)'      // Ámbar suave
    };

    this.setupCanvas();
    this.attachEventListeners();
    this.render();
  }

  setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(320, rect.width || 800);
    const height = Math.max(260, rect.height || 350);

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = width;
    this.height = height;

    this.padding = {
      top: 46,
      right: 30,
      bottom: 52,
      left: 64
    };
  }

  attachEventListeners() {
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.render();
    });

    if (typeof ResizeObserver !== 'undefined') {
      const target = this.canvas.parentElement || this.canvas;
      this.resizeObserver = new ResizeObserver(() => {
        this.setupCanvas();
        this.render();
      });
      this.resizeObserver.observe(target);
    }

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

  setMSS(mss) {
    this.options.mss = mss;
    this.render();
  }

  setAlgorithm(algo) {
    this.options.algorithm = algo || 'RENO';
    if (this.options.showTahoeComparison) {
      this.recalculateTahoePoints();
    }
    this.render();
  }

  setTahoeComparison(enabled) {
    this.options.showTahoeComparison = enabled;
    this.recalculateTahoePoints();
    this.render();
  }

  updateData(historyRounds) {
    this.dataPoints = historyRounds || [];
    if (this.options.showTahoeComparison) {
      this.recalculateTahoePoints();
    }
    this.render();
  }

  recalculateTahoePoints() {
    this.tahoePoints = [];
    if (this.dataPoints.length === 0) return;

    let tahoeCwnd = this.dataPoints[0].cwnd || 1;
    let tahoeSsthresh = this.dataPoints[0].ssthresh !== undefined ? this.dataPoints[0].ssthresh : null;
    let tahoePhase = 'SLOW_START';

    this.dataPoints.forEach((pt, idx) => {
      if (idx === 0) {
        this.tahoePoints.push({
          round: pt.round,
          cwnd: tahoeCwnd,
          ssthresh: tahoeSsthresh,
          phase: tahoePhase
        });
        return;
      }

      const prevPt = this.dataPoints[idx - 1];
      if (prevPt.lossType) {
        // Pérdida: Tahoe calcula ssthresh y reinicia a 1 MSS en Arranque Lento
        tahoeSsthresh = Math.max(2, Math.floor(prevPt.cwnd / 2));
        tahoeCwnd = 1.0;
        tahoePhase = 'SLOW_START';
      } else {
        if (tahoePhase === 'SLOW_START') {
          if (tahoeSsthresh !== null) {
            // Con umbral fijado tras pérdida: crece exponencialmente hasta ssthresh
            tahoeCwnd = tahoeCwnd * 2;
            if (tahoeCwnd >= tahoeSsthresh) {
              tahoeCwnd = tahoeSsthresh;
              tahoePhase = 'CONGESTION_AVOIDANCE';
            }
          } else {
            // Sin umbral inicial: duplica idéntico a Reno en Arranque Lento
            tahoeCwnd = pt.cwnd;
          }
        } else {
          // Evitación de congestión: +1 MSS lineal
          tahoeCwnd += 1.0;
        }
      }

      this.tahoePoints.push({
        round: pt.round,
        cwnd: tahoeCwnd,
        ssthresh: tahoeSsthresh,
        phase: tahoePhase
      });
    });
  }

  handleMouseMove(mouseX, mouseY) {
    if (this.dataPoints.length === 0) return;

    const plotW = this.width - this.padding.left - this.padding.right;
    const lastRound = this.dataPoints[this.dataPoints.length - 1].round;
    const maxRounds = Math.max(this.options.maxRoundsDisplay, lastRound + 1);

    let closest = null;
    let minDistance = 28;

    this.dataPoints.forEach((pt) => {
      const x = this.padding.left + (pt.round / maxRounds) * plotW;
      const y = this.getYCoord(pt.cwnd);

      const dist = Math.hypot(mouseX - x, mouseY - y);
      if (dist < minDistance) {
        closest = { ...pt, screenX: x, screenY: y };
        minDistance = dist;
      }
    });

    if (this.hoveredPoint !== closest) {
      this.hoveredPoint = closest;
      this.render();
    }
  }

  getYCoord(cwndValue) {
    const plotH = this.height - this.padding.top - this.padding.bottom;
    const maxCwnd = this.getMaxCwnd();
    return this.height - this.padding.bottom - (cwndValue / maxCwnd) * plotH;
  }

  getYScale() {
    let rawMax = 10;
    this.dataPoints.forEach(p => {
      if (p.cwnd > rawMax) rawMax = p.cwnd;
      if (p.ssthresh !== null && p.ssthresh !== undefined && p.ssthresh > rawMax) rawMax = p.ssthresh;
    });
    if (this.options.showTahoeComparison) {
      this.tahoePoints.forEach(p => {
        if (p.cwnd > rawMax) rawMax = p.cwnd;
      });
    }

    const padded = rawMax * 1.18;
    let step = 2;
    if (padded > 48) step = 10;
    else if (padded > 32) step = 5;
    else if (padded > 18) step = 4;
    else if (padded <= 10) step = 2;

    const maxCwnd = Math.max(12, Math.ceil(padded / step) * step);
    return { maxCwnd, step };
  }

  getMaxCwnd() {
    return this.getYScale().maxCwnd;
  }

  getXCoord(round, maxRounds, plotW) {
    return this.padding.left + (round / maxRounds) * plotW;
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const plotW = w - this.padding.left - this.padding.right;
    const plotH = h - this.padding.top - this.padding.bottom;
    const lastRound = this.dataPoints.length > 0 ? this.dataPoints[this.dataPoints.length - 1].round : 0;
    const maxRounds = Math.max(this.options.maxRoundsDisplay, lastRound + 1);
    const { maxCwnd, step: yStep } = this.getYScale();

    this.drawGrid(maxRounds, maxCwnd, yStep, plotW, plotH);

    if (this.options.showPhaseBands && this.dataPoints.length > 1) {
      this.drawPhaseBands(maxRounds, plotW, plotH);
    }

    this.drawSsthreshLine(maxRounds, maxCwnd, plotW, plotH);

    if (this.options.showTahoeComparison && this.tahoePoints.length > 1) {
      this.drawTahoeCurve(maxRounds, maxCwnd, plotW, plotH);
    }

    if (this.dataPoints.length > 0) {
      this.drawCwndCurve(maxRounds, maxCwnd, plotW, plotH);
    }

    this.drawLossMarkers(maxRounds, maxCwnd, plotW, plotH);
    this.drawLegend();

    if (this.hoveredPoint) {
      this.drawTooltip(this.hoveredPoint);
    }
  }

  drawGrid(maxRounds, maxCwnd, yStep, plotW, plotH) {
    const ctx = this.ctx;
    ctx.font = '10.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Grilla Horizontal limpia por múltiplos exactos de yStep
    for (let val = 0; val <= maxCwnd; val += yStep) {
      const y = this.height - this.padding.bottom - (val / maxCwnd) * plotH;

      ctx.beginPath();
      ctx.strokeStyle = val === 0 ? '#cbd5e1' : this.colors.grid;
      ctx.lineWidth = val === 0 ? 1.5 : 1;
      ctx.moveTo(this.padding.left, y);
      ctx.lineTo(this.width - this.padding.right, y);
      ctx.stroke();

      ctx.fillStyle = this.colors.textMuted;
      ctx.fillText(`${val} MSS`, this.padding.left - 8, y);
    }

    // Grilla Vertical adaptativa según ancho real disponible
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const pxPerRound = plotW / maxRounds;
    const roundStep = pxPerRound < 18 ? 4 : pxPerRound < 28 ? 2 : 1;

    for (let r = 0; r <= maxRounds; r += roundStep) {
      const x = this.padding.left + (r / maxRounds) * plotW;

      ctx.beginPath();
      ctx.strokeStyle = r === 0 ? '#cbd5e1' : this.colors.grid;
      ctx.lineWidth = r === 0 ? 1.5 : 1;
      ctx.moveTo(x, this.padding.top);
      ctx.lineTo(x, this.height - this.padding.bottom);
      ctx.stroke();

      ctx.fillStyle = this.colors.textMuted;
      ctx.fillText(`${r}`, x, this.height - this.padding.bottom + 8);
    }

    // Títulos de Ejes
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = this.colors.textBright;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Ciclo de Transmisión / RTT (Figura 3.53)', this.padding.left + plotW / 2, this.height - 10);

    ctx.save();
    ctx.translate(16, this.padding.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('cwnd (MSS)', 0, 0);
    ctx.restore();
  }

  drawPhaseBands(maxRounds, plotW, plotH) {
    const ctx = this.ctx;
    for (let i = 0; i < this.dataPoints.length - 1; i++) {
      const pt1 = this.dataPoints[i];
      const pt2 = this.dataPoints[i + 1];

      const x1 = this.padding.left + (pt1.round / maxRounds) * plotW;
      const x2 = this.padding.left + (pt2.round / maxRounds) * plotW;
      const bandW = x2 - x1;

      let bandColor = this.colors.slowStartBand;
      if (pt1.phase === 'CONGESTION_AVOIDANCE') {
        bandColor = this.colors.congestionAvoidanceBand;
      } else if (pt1.phase === 'FAST_RECOVERY') {
        bandColor = this.colors.fastRecoveryBand;
      }

      ctx.fillStyle = bandColor;
      ctx.fillRect(x1, this.padding.top, bandW, plotH);
    }
  }

  drawSsthreshLine(maxRounds, maxCwnd, plotW, plotH) {
    if (this.dataPoints.length === 0) return;

    // Solo dibujar a partir del primer punto donde ssthresh ya fue calculado (no es null)
    const firstCongestionIdx = this.dataPoints.findIndex(p => p.ssthresh !== null && p.ssthresh !== undefined);
    if (firstCongestionIdx === -1) return; // No hubo congestión aún: no dibujar nada

    const ctx = this.ctx;

    ctx.beginPath();
    ctx.strokeStyle = this.colors.ssthreshLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);

    let started = false;
    this.dataPoints.forEach((pt, idx) => {
      if (pt.ssthresh === null || pt.ssthresh === undefined) return; // Saltar puntos sin ssthresh
      const x = this.padding.left + (pt.round / maxRounds) * plotW;
      const y = this.getYCoord(pt.ssthresh);

      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        const prevPt = this.dataPoints[idx - 1];
        const prevSsthresh = prevPt.ssthresh !== null && prevPt.ssthresh !== undefined ? prevPt.ssthresh : pt.ssthresh;
        ctx.lineTo(x, this.getYCoord(prevSsthresh));
        ctx.lineTo(x, y);
      }
    });

    if (started) {
      const lastPt = [...this.dataPoints].reverse().find(p => p.ssthresh !== null && p.ssthresh !== undefined);
      if (lastPt) {
        const lastY = this.getYCoord(lastPt.ssthresh);
        ctx.lineTo(this.width - this.padding.right, lastY);
      }
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawTahoeCurve(maxRounds, maxCwnd, plotW, plotH) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.strokeStyle = this.colors.tahoeLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);

    this.tahoePoints.forEach((pt, idx) => {
      const x = this.padding.left + (pt.round / maxRounds) * plotW;
      const y = this.getYCoord(pt.cwnd);

      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
    ctx.setLineDash([]);

    this.tahoePoints.forEach((pt) => {
      const x = this.padding.left + (pt.round / maxRounds) * plotW;
      const y = this.getYCoord(pt.cwnd);

      ctx.beginPath();
      ctx.fillStyle = this.colors.tahoeLine;
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawCwndCurve(maxRounds, maxCwnd, plotW, plotH) {
    const ctx = this.ctx;

    // Relleno sutil bajo la curva
    const gradient = ctx.createLinearGradient(0, this.padding.top, 0, this.height - this.padding.bottom);
    gradient.addColorStop(0, 'rgba(2, 132, 199, 0.16)');
    gradient.addColorStop(1, 'rgba(2, 132, 199, 0.01)');

    ctx.beginPath();
    this.dataPoints.forEach((pt, idx) => {
      const x = this.padding.left + (pt.round / maxRounds) * plotW;
      const y = this.getYCoord(pt.cwnd);

      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    const lastPt = this.dataPoints[this.dataPoints.length - 1];
    const lastX = this.padding.left + (lastPt.round / maxRounds) * plotW;
    const firstX = this.padding.left + (this.dataPoints[0].round / maxRounds) * plotW;
    const baseY = this.height - this.padding.bottom;

    ctx.lineTo(lastX, baseY);
    ctx.lineTo(firstX, baseY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Línea de cwnd principal
    ctx.beginPath();
    ctx.strokeStyle = this.colors.cwndLine;
    ctx.lineWidth = 2.5;

    this.dataPoints.forEach((pt, idx) => {
      const x = this.padding.left + (pt.round / maxRounds) * plotW;
      const y = this.getYCoord(pt.cwnd);

      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Nodos circulares y valores discretos sin superposición
    const pxPerPoint = plotW / Math.max(1, maxRounds);
    const totalPts = this.dataPoints.length;

    this.dataPoints.forEach((pt, idx) => {
      const x = this.padding.left + (pt.round / maxRounds) * plotW;
      const y = this.getYCoord(pt.cwnd);
      const isLast = idx === totalPts - 1;
      const isHovered = this.hoveredPoint && this.hoveredPoint.round === pt.round;

      ctx.beginPath();
      ctx.fillStyle = isLast ? this.colors.cwndLine : '#ffffff';
      ctx.arc(x, y, isHovered ? 6 : isLast ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = isLast ? '#ffffff' : this.colors.cwndLine;
      ctx.lineWidth = isLast ? 2 : 2.2;
      ctx.arc(x, y, isHovered ? 6 : isLast ? 5 : 4, 0, Math.PI * 2);
      ctx.stroke();

      // Mostrar número de cwnd sobre puntos clave o si hay espacio holgado
      const prevLoss = idx > 0 && this.dataPoints[idx - 1].lossType;
      const showValue = !pt.lossType && (isLast || idx === 0 || prevLoss || (pxPerPoint >= 28 && idx % 2 === 0));
      if (showValue) {
        const valText = `${Number.isInteger(pt.cwnd) ? pt.cwnd : pt.cwnd.toFixed(1)}`;
        const labelY = y - 10 > this.padding.top + 8 ? y - 10 : y + 16;
        ctx.font = 'bold 10.5px ui-monospace, "SF Mono", "JetBrains Mono", monospace';
        ctx.fillStyle = isLast ? '#0071e3' : '#1d1d1f';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(valText, x, labelY);
      }
    });
  }

  drawLossMarkers(maxRounds, maxCwnd, plotW, plotH) {
    const ctx = this.ctx;
    let lossOrder = 0;

    this.dataPoints.forEach((pt) => {
      if (!pt.lossType) return;

      const x = this.padding.left + (pt.round / maxRounds) * plotW;
      const y = this.getYCoord(pt.cwnd);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 1.25;
      ctx.setLineDash([3, 3]);
      ctx.moveTo(x, this.padding.top);
      ctx.lineTo(x, this.height - this.padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.fillStyle = this.colors.lossMarker;
      ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      ctx.stroke();

      let labelText = 'Timeout (RTO)';
      if (pt.lossType === 'TRIPLE_DUP_ACK') {
        labelText = '3x Dup ACK';
      } else if (pt.lossType === 'QUEUE_DROP') {
        labelText = 'Cola Llena (RTO)';
      } else if (pt.lossType === 'TIMEOUT') {
        labelText = 'Timeout (RTO)';
      }

      ctx.font = 'bold 10.5px ui-monospace, "SF Mono", "JetBrains Mono", monospace';
      const textW = ctx.measureText(labelText).width;
      const pillW = textW + 14;
      const pillH = 20;

      const minCenterX = this.padding.left + pillW / 2 + 4;
      const maxCenterX = this.width - this.padding.right - pillW / 2 - 4;
      const clampedX = Math.max(minCenterX, Math.min(maxCenterX, x));

      // Colocar arriba si hay espacio suficiente respecto al borde superior; sino abajo del punto
      const offsetLevel = (lossOrder % 2) * 18;
      let pillCenterY = y - 19 - offsetLevel;
      if (pillCenterY - pillH / 2 < this.padding.top + 4) {
        pillCenterY = Math.min(this.height - this.padding.bottom - pillH / 2 - 4, y + 20);
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(clampedX - pillW / 2, pillCenterY - pillH / 2, pillW, pillH, 5);
      } else {
        ctx.rect(clampedX - pillW / 2, pillCenterY - pillH / 2, pillW, pillH);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = this.colors.lossMarker;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, clampedX, pillCenterY + 0.5);

      lossOrder++;
    });
  }

  drawLegend() {
    const ctx = this.ctx;
    const isTahoe = this.options.algorithm === 'TAHOE';
    const primaryLabel = isTahoe ? 'cwnd (TCP Tahoe)' : 'cwnd (TCP Reno)';
    const compLabel = isTahoe ? 'Comparativa (TCP Reno)' : 'Comparativa (TCP Tahoe)';
    const hasSsthresh = this.dataPoints.some(p => p.ssthresh !== null && p.ssthresh !== undefined);

    const items = [
      { kind: 'solid', color: this.colors.cwndLine, label: primaryLabel }
    ];
    if (hasSsthresh) {
      items.push({ kind: 'dashed', color: this.colors.ssthreshLine, label: 'ssthresh (Umbral)' });
    }
    if (this.options.showTahoeComparison) {
      items.push({ kind: 'dotted', color: this.colors.tahoeLine, label: compLabel });
    }

    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    let cursorX = this.padding.left;
    const y = 18;

    items.forEach((item) => {
      if (item.kind === 'solid') {
        ctx.fillStyle = item.color;
        ctx.fillRect(cursorX, y - 4, 14, 8);
      } else {
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2.2;
        ctx.setLineDash(item.kind === 'dashed' ? [5, 3] : [2, 3]);
        ctx.beginPath();
        ctx.moveTo(cursorX, y);
        ctx.lineTo(cursorX + 16, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = this.colors.textBright;
      ctx.fillText(item.label, cursorX + 21, y);
      cursorX += 21 + ctx.measureText(item.label).width + 20;
    });
  }

  drawTooltip(pt) {
    const ctx = this.ctx;
    const ssthreshLabel = (pt.ssthresh !== null && pt.ssthresh !== undefined)
      ? `ssthresh: ${pt.ssthresh} MSS`
      : `ssthresh: Pendiente`;
    const textLines = [
      `Ciclo RTT: ${pt.round}`,
      `cwnd: ${pt.cwnd} MSS (${((pt.cwnd * this.options.mss) / 1024).toFixed(1)} KB)`,
      ssthreshLabel,
      `Fase: ${pt.phase === 'SLOW_START' ? 'Arranque Lento' : (pt.phase === 'FAST_RECOVERY' ? 'Recuperación Rápida' : 'Evitación de Congestión')}`
    ];

    if (pt.lossType) {
      let lossDesc = 'Timeout (RTO)';
      if (pt.lossType === 'TRIPLE_DUP_ACK') {
        lossDesc = '3x Dup ACK (Fast Retransmit)';
      } else if (pt.lossType === 'QUEUE_DROP') {
        lossDesc = 'Descarte por Cola L3 (Timeout)';
      } else if (pt.lossType === 'TIMEOUT') {
        lossDesc = 'Timeout (Expiración RTO)';
      }
      textLines.push(`Pérdida: ${lossDesc}`);
      if (pt.cwndBeforeLoss && pt.cwndAfterLoss) {
        textLines.push(`Reacción: ${pt.cwndBeforeLoss} MSS ➔ ${pt.cwndAfterLoss} MSS`);
      }
    }

    ctx.font = '11px "JetBrains Mono", monospace';
    let maxW = 0;
    textLines.forEach(line => {
      const w = ctx.measureText(line).width;
      if (w > maxW) maxW = w;
    });

    const boxW = maxW + 20;
    const boxH = textLines.length * 18 + 12;

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
    ctx.strokeStyle = '#0284c7';
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
    textLines.forEach((line, idx) => {
      ctx.fillStyle = idx === 0 ? '#0f172a' : (line.startsWith('Pérdida:') || line.startsWith('Reacción:') ? this.colors.lossMarker : '#475569');
      ctx.fillText(line, boxX + 10, boxY + 8 + idx * 18);
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CongestionChartEngine;
} else {
  window.CongestionChartEngine = CongestionChartEngine;
}
