/**
 * uiController.js - Controlador Principal del Laboratorio Interactivo TCP
 * Coordina TCPEngine, CongestionChartEngine y NetworkVisualizer (Ladder Diagram).
 * Adaptado a la interfaz de 3 columnas moderna y a colores (Dashboard layout).
 */

class UIController {
  constructor() {
    this.currentScenarioId = 'SCENARIO_1_KUROSE_FIG_353';
    this.currentScenarioScript = null;
    this.currentRoundIndex = 0;
    this.isPlaying = false;
    this.playbackInterval = null;
    this.playbackSpeedMs = 1200;
    this.pendingManualLoss = null;

    this.engine = null;
    this.chart = null;
    this.flowChart = null;
    this.flowVisualizer = null;
    this.visualizer = null;

    this.init();
  }

  init() {
    // 1. Instanciar el motor TCP con números de secuencia independientes
    this.engine = new TCPEngine({
      algorithm: 'RENO',
      mss: 1460,
      initialCwnd: 1,
      initialSsthresh: null,  // ssthresh nace ante la primera congestión
      rtt: 50,
      rto: 150,
      clientISN: 1000,
      serverISN: 50000,
      receiverProfile: 'NGINX_NORMAL'
    });

    // 2. Instanciar el motor de gráfico Canvas de Congestión (Sector B)
    const chartCanvas = document.getElementById('congestion-chart');
    if (chartCanvas) {
      this.chart = new CongestionChartEngine(chartCanvas, {
        showTahoeComparison: false,
        mss: 1460,
        maxRoundsDisplay: 16
      });
    }

    // 2.bis Instanciar el motor de gráfico Canvas de Control de Flujo (Sector C - rwnd si existe canvas)
    const flowChartCanvas = document.getElementById('flow-control-chart');
    if (flowChartCanvas && typeof FlowControlChartEngine !== 'undefined') {
      this.flowChart = new FlowControlChartEngine(flowChartCanvas, {
        mss: 1460,
        rcvBufferMSS: 16,
        maxRoundsDisplay: 16
      });
    }

    // 2.ter Instanciar el visualizador dinámico del Balde de Recepción TCP (Sector C)
    const sectorCElem = document.getElementById('sector-c-flow-control');
    if (sectorCElem && typeof FlowControlVisualizer !== 'undefined') {
      this.flowVisualizer = new FlowControlVisualizer('sector-c-flow-control');
    }

    // 3. Instanciar el visualizador de diagrama espacio-tiempo (Ladder)
    const ladderContainer = document.getElementById('ladder-visualizer-container');
    if (ladderContainer) {
      this.visualizer = new NetworkVisualizer(ladderContainer, {
        mss: 1460,
        clientIP: '172.16.20.10',
        serverIP: '172.16.10.12'
      });
    }

    // 4. Cargar el escenario por defecto
    this.loadScenario('SCENARIO_1_KUROSE_FIG_353');

    // 5. Vincular eventos de la interfaz
    this.bindEvents();

    // 6. Actualizar todas las vistas
    this.updateAllViews();
  }

  loadScenario(scenarioId) {
    this.pause();
    this.currentScenarioId = scenarioId;

    const customParams = this.getAdvancedParams();
    this.currentScenarioScript = TCPEngine.getScenarioScript(scenarioId, customParams);
    this.currentRoundIndex = 0;

    this.engine.initConfig(this.currentScenarioScript.config);
    this.engine.reset();

    if (this.chart) {
      this.chart.setMSS(this.engine.config.mss);
      this.chart.setAlgorithm(this.engine.config.algorithm);
      this.chart.updateData(this.engine.state.historyRounds);
    }
    if (this.flowChart) {
      this.flowChart.setMSS(this.engine.config.mss);
      this.flowChart.updateData(this.engine.state.historyRounds);
    }
    if (this.visualizer) {
      this.visualizer.options.mss = this.engine.config.mss;
      this.visualizer.updateTelemetry(this.engine.getTelemetry());
    }

    this.updateScenarioInfoUI();
    this.clearEventLog();
    this.logEvent(this.engine.state.lastEvent, 0);
    this.updateAllViews();
  }

  getAdvancedParams() {
    const mssSelect = document.getElementById('param-mss');
    const algoSelect = document.getElementById('param-algorithm');
    const bufferSelect = document.getElementById('param-buffer');

    return {
      mss: mssSelect ? parseInt(mssSelect.value, 10) : 1460,
      algorithm: algoSelect ? algoSelect.value : 'RENO',
      bufferCapacity: bufferSelect ? parseInt(bufferSelect.value, 10) : 8,
      enforceBufferLimit: true
    };
  }

  updateScenarioInfoUI() {
    // La tarjeta de texto redundante fue eliminada a solicitud del usuario
  }

  bindEvents() {
    // Selector de Escenario
    const scenarioSelect = document.getElementById('scenario-selector');
    if (scenarioSelect) {
      scenarioSelect.addEventListener('change', (e) => {
        this.loadScenario(e.target.value);
      });
    }

    // Botones de Reproducción
    const btnPlayPause = document.getElementById('btn-play-pause');
    if (btnPlayPause) {
      btnPlayPause.addEventListener('click', () => {
        if (this.isPlaying) {
          this.pause();
        } else {
          this.play();
        }
      });
    }

    const btnNext = document.getElementById('btn-step-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        this.pause();
        this.stepForward();
      });
    }

    const btnPrev = document.getElementById('btn-step-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        this.pause();
        this.stepBackward();
      });
    }

    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.loadScenario(this.currentScenarioId);
      });
    }

    // Control de Velocidad
    const speedSelect = document.getElementById('playback-speed');
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        this.playbackSpeedMs = parseInt(e.target.value, 10);
        if (this.isPlaying) {
          this.pause();
          this.play();
        }
      });
    }

    // Checkbox Comparativa Tahoe
    const checkTahoe = document.getElementById('check-tahoe-compare');
    if (checkTahoe) {
      checkTahoe.addEventListener('change', (e) => {
        if (this.chart) {
          this.chart.setTahoeComparison(e.target.checked);
        }
      });
    }

    // Parámetros Rápidos
    const paramMss = document.getElementById('param-mss');
    if (paramMss) {
      paramMss.addEventListener('change', () => this.applyParams());
    }

    const paramAlgo = document.getElementById('param-algorithm');
    if (paramAlgo) {
      paramAlgo.addEventListener('change', () => this.applyParams());
    }

    const paramBuffer = document.getElementById('param-buffer');
    if (paramBuffer) {
      paramBuffer.addEventListener('change', () => this.applyParams());
    }

    // Selector de Perfil de Receptor (Control de Flujo - Sector C)
    const flowProfileSelect = document.getElementById('flow-receiver-profile');
    if (flowProfileSelect) {
      flowProfileSelect.addEventListener('change', (e) => {
        this.engine.setReceiverProfile(e.target.value);
        if (this.flowChart) {
          this.flowChart.updateData(this.engine.state.historyRounds);
        }
        this.updateAllViews();
      });
    }

    // Inyección de Pérdida
    const btnInject = document.getElementById('btn-inject-loss');
    if (btnInject) {
      btnInject.addEventListener('click', () => {
        const lossSelect = document.getElementById('inject-loss-type');
        const lossType = lossSelect ? lossSelect.value : 'TRIPLE_DUP_ACK';
        this.pendingManualLoss = lossType;
        this.logEvent({
          type: 'MANUAL_INJECTION',
          title: 'Pérdida Programada',
          description: `Se forzará ${lossType} en la próxima ráfaga de segmentos.`,
          action: 'Avanzá un paso para observar la reacción de TCP.'
        }, this.engine.state.round);
      });
    }

    // Modales
    const btnOpenTheory = document.getElementById('btn-open-theory-modal');
    if (btnOpenTheory) {
      btnOpenTheory.addEventListener('click', () => {
        const modal = document.getElementById('theory-modal-backdrop');
        if (modal) modal.classList.add('active');
      });
    }

    const btnCloseTheory = document.getElementById('btn-close-theory-modal');
    if (btnCloseTheory) {
      btnCloseTheory.addEventListener('click', () => {
        const modal = document.getElementById('theory-modal-backdrop');
        if (modal) modal.classList.remove('active');
      });
    }

    const theoryModal = document.getElementById('theory-modal-backdrop');
    if (theoryModal) {
      theoryModal.addEventListener('click', (e) => {
        if (e.target === theoryModal) theoryModal.classList.remove('active');
      });
    }
  }

  applyParams() {
    const params = this.getAdvancedParams();
    this.engine.initConfig({
      ...this.engine.config,
      ...params
    });
    this.engine.reset();

    if (this.chart) {
      this.chart.setMSS(params.mss);
      this.chart.setAlgorithm(params.algorithm);
      this.chart.updateData(this.engine.state.historyRounds);
    }
    if (this.flowChart) {
      this.flowChart.setMSS(params.mss);
      this.flowChart.updateData(this.engine.state.historyRounds);
    }
    if (this.visualizer) {
      this.visualizer.options.mss = params.mss;
      this.visualizer.updateTelemetry(this.engine.getTelemetry());
    }

    this.currentRoundIndex = 0;
    this.clearEventLog();
    this.logEvent({
      type: 'CONFIG_APPLIED',
      title: 'Parámetros Actualizados',
      description: `MSS=${params.mss}B, Algoritmo=${params.algorithm}, Búfer C9200=${params.bufferCapacity} pkts.`,
      action: 'Simulación reiniciada.'
    }, 0);
    this.updateAllViews();
  }

  play() {
    this.isPlaying = true;
    const btnPlay = document.getElementById('btn-play-pause');
    if (btnPlay) {
      btnPlay.innerHTML = '<span>⏸</span> Pausar Simulación';
      btnPlay.classList.add('playing');
    }

    this.playbackInterval = setInterval(() => {
      const hasMore = this.stepForward();
      if (!hasMore) {
        this.pause();
      }
    }, this.playbackSpeedMs);
  }

  pause() {
    this.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    const btnPlay = document.getElementById('btn-play-pause');
    if (btnPlay) {
      btnPlay.innerHTML = '<span>▶</span> Iniciar Simulación';
      btnPlay.classList.remove('playing');
    }
  }

  stepForward() {
    let roundOptions = {};

    if (this.pendingManualLoss) {
      roundOptions.lossEvent = this.pendingManualLoss;
      roundOptions.lostSegmentIndex = Math.min(1, Math.max(0, Math.round(this.engine.state.cwnd) - 1));
      this.pendingManualLoss = null;
    } else if (this.currentScenarioScript && this.currentRoundIndex < this.currentScenarioScript.roundsPlan.length) {
      const planItem = this.currentScenarioScript.roundsPlan[this.currentRoundIndex];
      roundOptions = { ...planItem };
      this.currentRoundIndex++;
    } else {
      roundOptions.lossEvent = null;
      this.currentRoundIndex++;
    }

    const telemetry = this.engine.executeTransmissionRound(roundOptions);

    if (this.visualizer) {
      this.visualizer.updateTelemetry(telemetry);
    }

    if (this.chart) {
      this.chart.updateData(telemetry.historyRounds);
    }

    if (this.flowChart) {
      this.flowChart.updateData(telemetry.historyRounds);
    }

    this.logEvent(telemetry.lastEvent, telemetry.round - 1);
    this.updateAllViews();

    if (this.currentScenarioScript && this.currentRoundIndex >= this.currentScenarioScript.roundsPlan.length) {
      return false;
    }
    return true;
  }

  stepBackward() {
    const restored = this.engine.stepBack();
    if (restored) {
      if (this.currentRoundIndex > 0) {
        this.currentRoundIndex--;
      }
      const telemetry = this.engine.getTelemetry();

      if (this.chart) {
        this.chart.updateData(telemetry.historyRounds);
      }
      if (this.flowChart) {
        this.flowChart.updateData(telemetry.historyRounds);
      }
      if (this.visualizer) {
        this.visualizer.updateTelemetry(telemetry);
      }
      this.updateAllViews();
      this.logEvent({
        type: 'STEP_BACK',
        title: `Paso Revertido ↶ (Regreso a Ciclo ${telemetry.round})`,
        description: `Estado restaurado con éxito mediante snapshot de memoria determinístico.`,
      action: `cwnd = ${telemetry.cwndMSS} MSS, ssthresh = ${telemetry.ssthreshMSS !== null ? telemetry.ssthreshMSS + ' MSS' : 'Pendiente'}, Fase = ${telemetry.phase}.`
      }, telemetry.round);
    }
  }

  updateAllViews() {
    const t = this.engine.getTelemetry();

    this.setElText('metric-cwnd', `${t.cwndMSS} MSS`);
    this.setElText('metric-cwnd-bytes', `${t.cwndBytes.toLocaleString()} B (${(t.cwndBytes / 1024).toFixed(1)} KB)`);

    // ssthresh: mostrar "Pendiente" si aún no hubo congestión
    if (t.ssthreshMSS === null || t.ssthreshMSS === undefined) {
      this.setElText('metric-ssthresh', 'Pendiente');
      this.setElText('metric-ssthresh-bytes', '—');
    } else {
      this.setElText('metric-ssthresh', `${t.ssthreshMSS} MSS`);
      this.setElText('metric-ssthresh-bytes', `${t.ssthreshBytes !== null ? t.ssthreshBytes.toLocaleString() : '—'} B`);
    }

    this.setElText('metric-round', `Ciclo RTT ${t.round}`);
    this.setElText('metric-inflight', `${t.clientBuffer.inFlightBytes.toLocaleString()} B`);
    this.setElText('metric-rtt', `${t.rtt} ms`);

    const phaseEl = document.getElementById('metric-phase');
    if (phaseEl) {
      let phaseLabel = 'Arranque Lento (Slow Start)';
      let phaseClass = 'phase-slow-start';
      if (t.phase === 'CONGESTION_AVOIDANCE') {
        phaseLabel = 'Evitación de Congestión (AIMD)';
        phaseClass = 'phase-congestion-avoidance';
      } else if (t.phase === 'FAST_RECOVERY') {
        phaseLabel = 'Recuperación Rápida (Reno - Fast Recovery)';
        phaseClass = 'phase-fast-recovery';
      } else if (t.phase === 'SLOW_START' && t.algorithm === 'TAHOE' && t.hasCongestionOccurred) {
        phaseLabel = 'Arranque Lento (Tahoe: Caída a 1 MSS)';
        phaseClass = 'phase-slow-start';
      }
      phaseEl.textContent = phaseLabel;
      phaseEl.className = `phase-banner ${phaseClass}`;
    }

    this.setElText('action-title', t.lastEvent.title);
    this.setElText('action-desc', t.lastEvent.description);
    this.setElText('action-tcp-behavior', t.lastEvent.action);

    // Actualizar KPIs de Control de Flujo (Sector C)
    if (t.rwndMSS !== undefined) {
      this.setElText('flow-metric-rwnd', `${t.rwndMSS.toFixed(1)} MSS`);
      this.setElText('flow-metric-rwnd-bytes', `${t.rwndBytes.toLocaleString()} B (${(t.rwndBytes / 1024).toFixed(1)} KB libre)`);

      this.setElText('flow-metric-cwnd', `${t.cwndMSS.toFixed(1)} MSS`);
      this.setElText('flow-metric-cwnd-bytes', `${t.cwndBytes.toLocaleString()} B (${(t.cwndBytes / 1024).toFixed(1)} KB red)`);

      this.setElText('flow-metric-effective', `${t.effectiveWindowMSS.toFixed(1)} MSS`);
      this.setElText('flow-metric-effective-bytes', `${t.effectiveWindowBytes.toLocaleString()} B en vuelo máx`);

      const flowLimitingEl = document.getElementById('flow-metric-limiting');
      const flowBottleneckEl = document.getElementById('flow-metric-bottleneck');
      if (flowLimitingEl) {
        if (t.isZeroWindow) {
          flowLimitingEl.textContent = 'Búfer Lleno (rwnd = 0)';
          flowLimitingEl.className = 'fk-badge fk-badge-zero';
          if (flowBottleneckEl) flowBottleneckEl.textContent = 'Emitiendo Sondas de 1 Byte';
        } else if (t.isFlowThrottled) {
          flowLimitingEl.textContent = 'Control de Flujo (rwnd)';
          flowLimitingEl.className = 'fk-badge fk-badge-throttle';
          if (flowBottleneckEl) flowBottleneckEl.textContent = `Receptor limita (${t.rwndMSS} < ${t.cwndMSS} cwnd)`;
        } else {
          flowLimitingEl.textContent = 'Congestión de Red (cwnd)';
          flowLimitingEl.className = 'fk-badge fk-badge-normal';
          if (flowBottleneckEl) flowBottleneckEl.textContent = `Red limita (${t.cwndMSS} ≤ ${t.rwndMSS} rwnd)`;
        }
      }
    }
  }

  setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  logEvent(eventObj, round) {
    const logContainer = document.getElementById('event-log-container');
    if (!logContainer) return;

    const logEntry = document.createElement('div');
    let entryClass = 'log-entry-item';

    if (eventObj.type === 'TRIPLE_DUP_ACK') {
      entryClass += ' log-dup';
    } else if (eventObj.type === 'TIMEOUT' || eventObj.type === 'QUEUE_OVERFLOW' || eventObj.type === 'QUEUE_DROP') {
      entryClass += ' log-loss';
    } else if (eventObj.type === 'SUCCESS_ROUND') {
      entryClass += ' log-ok';
    }

    logEntry.className = entryClass;
    logEntry.innerHTML = `
      <div class="log-top-row">
        <span class="log-badge font-mono">RTT ${round}</span>
        <span class="log-name">${eventObj.title}</span>
      </div>
      <div class="log-body">${eventObj.description}</div>
      <div style="font-size: 0.78rem; color: #0071e3; font-weight: 600;">➔ ${eventObj.action}</div>
    `;

    logContainer.prepend(logEntry);

    while (logContainer.children.length > 30) {
      logContainer.removeChild(logContainer.lastChild);
    }
  }

  clearEventLog() {
    const logContainer = document.getElementById('event-log-container');
    if (logContainer) logContainer.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appController = new UIController();
});
