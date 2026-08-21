// ==============================================================================
// 🪐 PROJEKT "Q-O" // CONTENT.JS - HARDWARE-CORE DECENTRALIZED REAKTOR
// ==============================================================================
// DIE 3 UNANTASTBAREN SÄULEN (GOLDSTANDARD REFIT):
// 1. SÄULE I: DIE REINGEWASCHENE HELIX-FUSION (60 FPS // 0 ZENTRUM // STRAIN-DERIVATION)
// 2. SÄULE II: STATISCHES SVG-PARTIKEL-POOLING (0 innerHTML im 60-FPS Render-Loop)
// 3. SÄULE III: AXIOM XII - DEZENTRALES PROXIMITY-GEFÄLLE MIT CLOSED SHADOW DOM
// ==============================================================================

(function () {
  'use strict';

  // ============================================================================
  // 1. ZELLULÄRE STEUERUNG & TRÄGHEITS-MISCHPULT
  // ============================================================================
  let currentLqScore = 1.0;
  let targetLqScore = 1.0;
  let currentSensitivity = 1.0;
  let viscoelasticStrain = 0.0;
  let targetStrain = 0.0;
  let globalSkeletonStroke = 0.0;
  let isMetabolismActive = true;
  let isKryoSleep = false;
  let currentSessionId = 'session_' + Date.now();
  let lastScannedTextHash = '';
  let scanIntervalId = null;

  // Akkumulierte Session-Zellproben (Labor & Biopsie)
  let currentSessionHistory = [];
  let currentToxicSnippets = [];
  let currentNutrientSnippets = [];
  let currentMacroToxCategories = [];
  let currentMacroNutCategories = [];
  let currentProArguments = [];
  let currentContraArguments = [];

  // Mathematische Phasen-Akkumulatoren im RAM (Trigonometrisch, 0 CSS-Drehungen)
  let animFrameId = null;
  let phaseHelixCW = 0.0;     // Layer 1: Majestätischer 20s-Takt im Uhrzeigersinn
  let phaseShadowCCW = 0.0;   // Layer 0: Asynchroner 26s-Takt gegen den Uhrzeigersinn
  let phaseHarmonicA = 0.0;
  let phaseHarmonicB = 0.0;
  let lastTimestamp = performance.now();

  // Shadow Root & statische DOM-Element-Referenzen
  let shadowRoot = null;
  let membranePathEl = null;
  let tarSwarmGroupEl = null;
  let tarParticleNodes = [];
  let capillaryElements = [];
  let capillaryBridgeEl = null;
  let refract1El = null;
  let refract2El = null;
  let crest1El = null;
  let crest2El = null;
  let satCWEl = null;
  let satCCWEl = null;

  // Dezentraler Teer-Partikel-Pool im RAM
  const MAX_TAR_PARTICLES = 40;
  const tarParticles = [];

  for (let i = 0; i < MAX_TAR_PARTICLES; i++) {
    tarParticles.push({
      bayIndex: i % 8,
      t: Math.random(),                 // 0.0 (Bucht-Rand) -> 1.0 (Kapillar-Knoten)
      speed: 0.08 + Math.random() * 0.14,
      baseRadius: 1.1 + Math.random() * 1.6,
      pulsePhase: Math.random() * Math.PI * 2,
      lateralOffset: (Math.random() - 0.5) * 2.2,
      active: false,
      currentX: 50,
      currentY: 50
    });
  }

  // ============================================================================
  // 2. DOM-INJEKTION IN CLOSED SHADOW DOM (UNZERSTÖRBARE KAPSELUNG)
  // ============================================================================
  function injectMetabolicWidget() {
    if (document.getElementById('q-o-widget-container')) return;

    const hostContainer = document.createElement('div');
    hostContainer.id = 'q-o-widget-container';
    hostContainer.style.cssText = 'position:fixed!important;top:20px!important;right:20px!important;width:96px!important;height:96px!important;z-index:2147483647!important;pointer-events:auto!important;';

    // 🔒 CLOSED SHADOW DOM
    shadowRoot = hostContainer.attachShadow({ mode: 'closed' });

    // Stylesheet direkt im Shadow Root instanziieren
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      :host {
        all: initial;
        display: block;
        width: 96px;
        height: 96px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        pointer-events: auto;
        user-select: none;
        -webkit-user-select: none;
      }
      #biomorphic-blob-wrapper {
        position: relative;
        width: 92px;
        height: 92px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        z-index: 10;
      }
      #biomorphic-blob {
        width: 100%;
        height: 100%;
        overflow: visible;
        display: block;
        filter: drop-shadow(0 6px 18px rgba(0, 240, 255, 0.22));
        pointer-events: none;
      }
      .q-o-control-panel {
        position: absolute;
        top: 90px;
        right: 0;
        width: 156px;
        background: rgba(2, 0, 10, 0.96);
        border: 1px solid rgba(0, 240, 255, 0.32);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.94), 0 0 14px rgba(0, 240, 255, 0.16);
        border-radius: 4px;
        padding: 7px 9px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        opacity: 0;
        transform: translateY(-5px);
        transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                    transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      :host(:hover) .q-o-control-panel,
      .q-o-control-panel:hover {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
      .hud-slider-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
      .hud-label-tech {
        font-size: 8px;
        color: rgba(255, 255, 255, 0.7);
        letter-spacing: 0.5px;
        font-weight: 700;
      }
      .hud-status-badge {
        font-size: 7px;
        font-weight: 900;
        padding: 1.5px 4px;
        border-radius: 2px;
        color: #020008;
        background: #00f0ff;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .hud-status-badge.status-blind { background: #475569; color: #f8fafc; }
      .hud-status-badge.status-normal { background: #00f0ff; color: #020008; }
      .hud-status-badge.status-forensic { background: #a855f7; color: #ffffff; }
      .slider-wrapper-tech {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 8px;
        color: #00f0ff;
        font-weight: 700;
      }
      #morphology-sensitivity {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        background: rgba(0, 240, 255, 0.2);
        height: 3px;
        border-radius: 1.5px;
        outline: none;
        cursor: pointer;
      }
      #morphology-sensitivity::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 8px;
        height: 8px;
        background: #00f0ff;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 6px #00f0ff;
      }
      .hud-action-row {
        display: flex;
        justify-content: space-between;
        gap: 4px;
        margin-top: 2px;
      }
      .hud-action-row button {
        flex: 1;
        background: rgba(0, 240, 255, 0.06);
        border: 1px solid rgba(0, 240, 255, 0.3);
        color: #00f0ff;
        font-size: 7.5px;
        font-weight: 900;
        padding: 3px 2px;
        cursor: pointer;
        border-radius: 2px;
        transition: all 0.18s ease;
        font-family: inherit;
        letter-spacing: 0.4px;
        text-align: center;
      }
      .hud-action-row button:hover {
        background: rgba(0, 240, 255, 0.2);
        box-shadow: 0 0 7px rgba(0, 240, 255, 0.4);
        color: #ffffff;
      }
      #btn-stop {
        border-color: rgba(148, 163, 184, 0.4);
        color: #94a3b8;
      }
      #btn-biopsy {
        border-color: rgba(168, 85, 247, 0.45);
        color: #c084fc;
      }
    `;
    shadowRoot.appendChild(styleEl);

    const innerWrapper = document.createElement('div');
    innerWrapper.innerHTML = `
      <div id="biomorphic-blob-wrapper" title="Q-O Symbiont // Dezentrale Bio-Matrix">
        <svg id="biomorphic-blob" viewBox="0 0 100 100" width="92" height="92">
          <defs>
            <linearGradient id="qo-helix-ocean-grad" x1="15%" y1="85%" x2="85%" y2="15%">
              <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.98" />
              <stop offset="28%" stop-color="#00d4ff" stop-opacity="0.75" />
              <stop offset="50%" stop-color="#010005" stop-opacity="0.0" />
              <stop offset="72%" stop-color="#9333ea" stop-opacity="0.75" />
              <stop offset="100%" stop-color="#e879f9" stop-opacity="0.98" />
            </linearGradient>

            <linearGradient id="qo-specular-ocean-rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
              <stop offset="35%" stop-color="#00f0ff" stop-opacity="0.7" />
              <stop offset="65%" stop-color="#a855f7" stop-opacity="0.7" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95" />
            </linearGradient>

            <radialGradient id="qo-tar-particle-grad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#18002e" stop-opacity="1" />
              <stop offset="60%" stop-color="#070010" stop-opacity="0.98" />
              <stop offset="100%" stop-color="#010005" stop-opacity="1" />
            </radialGradient>

            <linearGradient id="qo-filament-refract-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.85" />
              <stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#ec4899" stop-opacity="0.85" />
            </linearGradient>
          </defs>

          <g id="qo-background-celestial-rings" opacity="0.22">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(0, 240, 255, 0.22)" stroke-width="0.4" stroke-dasharray="2 6" />
            <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(168, 85, 247, 0.22)" stroke-width="0.4" />
            <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(0, 240, 255, 0.15)" stroke-width="0.3" stroke-dasharray="1 3" />
          </g>

          <g id="qo-ghost-capillaries">
            ${Array.from({ length: 8 }, (_, i) => `<path id="qo-capillary-${i}" fill="none" stroke="none" stroke-width="0" stroke-linecap="round" />`).join('')}
            <path id="qo-capillary-bridge" fill="none" stroke="none" stroke-width="0" stroke-linecap="round" />
          </g>

          <!-- STATISCHES POOL-GEFÄSS FÜR TEER-BLASEN -->
          <g id="qo-tar-bubbles-swarm"></g>

          <path id="qo-ocean-membrane" 
                fill="url(#qo-helix-ocean-grad)" 
                stroke="url(#qo-specular-ocean-rim)" 
                stroke-width="1.2" 
                stroke-linejoin="round" />

          <path id="qo-inner-refract-1" fill="none" stroke="url(#qo-filament-refract-grad)" stroke-width="1.0" stroke-linecap="round" opacity="0.7" />
          <path id="qo-inner-refract-2" fill="none" stroke="#00f0ff" stroke-width="0.8" stroke-linecap="round" opacity="0.6" />

          <circle id="qo-crest-light-1" cx="26" cy="24" r="2.2" fill="#ffffff" opacity="0.95" />
          <circle id="qo-crest-light-2" cx="74" cy="26" r="2.0" fill="#ffffff" opacity="0.9" />
          <circle id="qo-sat-orb-cw" cx="14" cy="30" r="1.4" fill="#00f0ff" opacity="0.75" />
          <circle id="qo-sat-orb-ccw" cx="86" cy="70" r="1.5" fill="#e879f9" opacity="0.7" />
        </svg>
      </div>

      <div class="q-o-control-panel">
        <div class="hud-slider-header">
          <span class="hud-label-tech">METABOLISCHE SENSITIVITÄT</span>
          <span id="sensitivity-status-badge" class="hud-status-badge status-normal">NORMAL</span>
        </div>

        <div class="slider-wrapper-tech">
          <input type="range" id="morphology-sensitivity" min="0.0" max="2.5" step="0.1" value="1.0" />
          <span id="sensitivity-display-value">1.0x</span>
        </div>

        <div class="hud-action-row">
          <button id="btn-start">[ ZÜND ]</button>
          <button id="btn-stop">[ FREEZE ]</button>
          <button id="btn-biopsy">[ BIOPSY ]</button>
        </div>
      </div>
    `;

    shadowRoot.appendChild(innerWrapper);
    document.body.appendChild(hostContainer);

    // DOM-Referenzen cachen
    membranePathEl = shadowRoot.getElementById('qo-ocean-membrane');
    tarSwarmGroupEl = shadowRoot.getElementById('qo-tar-bubbles-swarm');
    capillaryBridgeEl = shadowRoot.getElementById('qo-capillary-bridge');
    refract1El = shadowRoot.getElementById('qo-inner-refract-1');
    refract2El = shadowRoot.getElementById('qo-inner-refract-2');
    crest1El = shadowRoot.getElementById('qo-crest-light-1');
    crest2El = shadowRoot.getElementById('qo-crest-light-2');
    satCWEl = shadowRoot.getElementById('qo-sat-orb-cw');
    satCCWEl = shadowRoot.getElementById('qo-sat-orb-ccw');

    capillaryElements = [];
    for (let i = 0; i < 8; i++) {
      capillaryElements.push(shadowRoot.getElementById(`qo-capillary-${i}`));
    }

    // 🚀 EINMALIGE INITIALISIERUNG DES PARTIKEL-DOM-POOLS (40 Circles)
    tarParticleNodes = [];
    for (let i = 0; i < MAX_TAR_PARTICLES; i++) {
      const circleNode = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleNode.setAttribute('cx', '50');
      circleNode.setAttribute('cy', '50');
      circleNode.setAttribute('r', '0');
      circleNode.setAttribute('fill', 'url(#qo-tar-particle-grad)');
      circleNode.setAttribute('stroke', '#010005');
      circleNode.setAttribute('stroke-width', '0.4');
      circleNode.setAttribute('opacity', '0');
      tarSwarmGroupEl.appendChild(circleNode);
      tarParticleNodes.push(circleNode);
    }

    bindWidgetEvents();
  }

  // ============================================================================
  // 3. MATHEMATISCHE VEKTOR-INTERPOLATION
  // ============================================================================
  function pointsToClosedBezierSpline(pts, tension = 0.95) {
    if (!pts || pts.length < 3) return '';
    const n = pts.length;
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} `;

    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];

      const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;

      const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

      d += `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
    }

    return d + 'Z';
  }

  function getQuadBezierPoint(p0, p1, p2, t) {
    const mt = 1 - t;
    return {
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
    };
  }

  // ============================================================================
  // 4. LIVE 60-FPS RENDERSCHLEIFE (0 innerHTML // STATISCHES NODE-RECYCLING)
  // ============================================================================
  function renderFluidVortex(timestamp) {
    const dt = Math.min(0.1, (timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;

    if (!isKryoSleep && membranePathEl) {
      // Trägheitsdämpfung & Strain
      currentLqScore += (targetLqScore - currentLqScore) * 0.05;
      targetStrain = currentLqScore >= 1.0 ? 0.0 : Math.min(1.0, Math.max(0.0, (1.0 - currentLqScore) * currentSensitivity));
      viscoelasticStrain += (targetStrain - viscoelasticStrain) * 0.05;

      let targetStroke = 0.0;
      if (currentLqScore < 0.25) targetStroke = 3.0;
      else if (currentLqScore < 0.5) targetStroke = ((0.5 - currentLqScore) / 0.25) * 2.0;
      globalSkeletonStroke += (targetStroke - globalSkeletonStroke) * 0.05;

      const kineticFactor = currentLqScore < 0.25 ? 0.05 : (1.0 + viscoelasticStrain * 0.35);
      phaseHelixCW = (phaseHelixCW + ((Math.PI * 2) / 20.0) * kineticFactor * dt) % (Math.PI * 2);
      phaseShadowCCW = (phaseShadowCCW - ((Math.PI * 2) / 26.0) * kineticFactor * dt) % (Math.PI * 2);
      phaseHarmonicA = (phaseHarmonicA + 1.1 * kineticFactor * dt) % (Math.PI * 2);
      phaseHarmonicB = (phaseHarmonicB + 0.75 * kineticFactor * dt) % (Math.PI * 2);

      let centerJitterX = 0;
      let centerJitterY = 0;
      let hostScale = 1.0;

      if (currentLqScore < 0.25) {
        hostScale = 0.8 + (currentLqScore / 0.25) * 0.16;
        const tremorAmp = (0.25 - currentLqScore) * 2.6;
        centerJitterX = (Math.random() - 0.5) * tremorAmp;
        centerJitterY = (Math.random() - 0.5) * tremorAmp;
      }

      const cx = 50 + centerJitterX;
      const cy = 50 + centerJitterY;
      const baseOuterRadius = 37.0 * hostScale;

      // Layer 1: Ozean-Membran
      const numOuterPoints = 24;
      const outerPoints = [];
      const amp1 = (4.6 + Math.sin(phaseHarmonicB) * 1.2) * (1.0 - Math.min(0.4, viscoelasticStrain * 0.3));
      const amp2 = (2.6 + Math.cos(phaseHarmonicA) * 0.8) * (1.0 - Math.min(0.4, viscoelasticStrain * 0.3));

      for (let i = 0; i < numOuterPoints; i++) {
        const theta = (i / numOuterPoints) * Math.PI * 2;
        const wave = Math.sin(5 * theta + phaseHelixCW) * amp1 + Math.cos(3 * theta - phaseHarmonicB) * amp2;
        const strainDip = viscoelasticStrain > 0.02 ? Math.abs(Math.sin(4 * theta + phaseShadowCCW)) * (viscoelasticStrain * 3.2) : 0;
        const r = Math.max(10, baseOuterRadius + wave - strainDip);
        outerPoints.push({ x: cx + Math.cos(theta) * r, y: cy + Math.sin(theta) * r });
      }

      membranePathEl.setAttribute('d', pointsToClosedBezierSpline(outerPoints, 0.95));

      // Ghost-Capillary Nodes
      const ghostCapillaryNodes = [];
      const numBays = 8;
      const bayParticleCounts = new Array(numBays).fill(0);

      for (let b = 0; b < numBays; b++) {
        const bayTheta = (b / numBays) * Math.PI * 2 + (Math.PI / 8);
        ghostCapillaryNodes.push({
          p0: { x: cx + Math.cos(bayTheta + phaseShadowCCW * 0.22) * (baseOuterRadius - 3.5), y: cy + Math.sin(bayTheta + phaseShadowCCW * 0.22) * (baseOuterRadius - 3.5) },
          p1: { x: cx + Math.cos(bayTheta + 0.35 + phaseHelixCW * 0.15) * (baseOuterRadius * 0.72), y: cy + Math.sin(bayTheta + 0.35 + phaseHelixCW * 0.15) * (baseOuterRadius * 0.72) },
          p2: { x: cx + Math.cos(bayTheta + 0.65 + phaseShadowCCW * 0.18) * (baseOuterRadius * 0.55), y: cy + Math.sin(bayTheta + 0.65 + phaseShadowCCW * 0.18) * (baseOuterRadius * 0.55) }
        });
      }

      // 🧹 REINE ATTRIBUT-AKTUALISIERUNG IM STATISCHEN POOL (KEIN innerHTML!)
      const activeTarCount = viscoelasticStrain > 0.01 ? Math.min(MAX_TAR_PARTICLES, Math.floor(viscoelasticStrain * 38)) : 0;

      for (let i = 0; i < MAX_TAR_PARTICLES; i++) {
        const p = tarParticles[i];
        const circleNode = tarParticleNodes[i];

        if (i < activeTarCount && circleNode) {
          const speedMod = currentLqScore < 0.25 ? 0.03 : p.speed * (0.8 + viscoelasticStrain * 0.4);
          p.t += speedMod * dt;
          if (p.t > 1.0) {
            p.t = 0.0;
            p.bayIndex = (p.bayIndex + 1) % numBays;
          }
          bayParticleCounts[p.bayIndex]++;

          const curve = ghostCapillaryNodes[p.bayIndex];
          const pt = getQuadBezierPoint(curve.p0, curve.p1, curve.p2, p.t);
          p.currentX = pt.x + p.lateralOffset * (1.0 - p.t);
          p.currentY = pt.y + p.lateralOffset * (1.0 - p.t);
          p.pulsePhase += 2.4 * dt;
          const curRadius = p.baseRadius * (1.0 + viscoelasticStrain * 0.8) * (0.88 + Math.sin(p.pulsePhase) * 0.22);
          const tarOpacity = Math.min(0.98, 0.4 + p.t * 0.45 + viscoelasticStrain * 0.2);

          circleNode.setAttribute('cx', p.currentX.toFixed(1));
          circleNode.setAttribute('cy', p.currentY.toFixed(1));
          circleNode.setAttribute('r', curRadius.toFixed(1));
          circleNode.setAttribute('opacity', tarOpacity.toFixed(2));
        } else if (circleNode && circleNode.getAttribute('opacity') !== '0') {
          circleNode.setAttribute('opacity', '0');
        }
      }

      // Skelett & Kapillaren
      if (currentLqScore >= 0.5 || globalSkeletonStroke <= 0.04) {
        for (let b = 0; b < numBays; b++) {
          if (capillaryElements[b]) {
            capillaryElements[b].setAttribute('stroke', 'none');
            capillaryElements[b].setAttribute('stroke-width', '0');
          }
        }
        if (capillaryBridgeEl) capillaryBridgeEl.setAttribute('stroke', 'none');
      } else {
        const isKollaps = currentLqScore < 0.25;
        const solidColor = isKollaps ? '#010005' : '#8b5cf6';
        let bridgeD = '';

        for (let b = 0; b < numBays; b++) {
          const lineEl = capillaryElements[b];
          const density = bayParticleCounts[b];
          const curve = ghostCapillaryNodes[b];

          if (lineEl && curve) {
            if (density > 0 || isKollaps) {
              const localStroke = isKollaps ? 3.0 : Math.min(2.0, globalSkeletonStroke * (0.6 + Math.min(1.0, density * 0.25)));
              lineEl.setAttribute('d', `M ${curve.p0.x.toFixed(1)} ${curve.p0.y.toFixed(1)} Q ${curve.p1.x.toFixed(1)} ${curve.p1.y.toFixed(1)} ${curve.p2.x.toFixed(1)} ${curve.p2.x.toFixed(1)}`);
              lineEl.setAttribute('stroke', solidColor);
              lineEl.setAttribute('stroke-width', localStroke.toFixed(2));
              lineEl.setAttribute('opacity', isKollaps ? '1' : '0.85');

              if (b % 2 === 0) {
                const nextCurve = ghostCapillaryNodes[(b + 1) % numBays];
                bridgeD += `M ${curve.p1.x.toFixed(1)} ${curve.p1.y.toFixed(1)} L ${nextCurve.p1.x.toFixed(1)} ${nextCurve.p1.y.toFixed(1)} `;
              }
            } else {
              lineEl.setAttribute('stroke', 'none');
            }
          }
        }

        if (capillaryBridgeEl) {
          if (bridgeD.length > 0) {
            capillaryBridgeEl.setAttribute('d', bridgeD);
            capillaryBridgeEl.setAttribute('stroke', solidColor);
            capillaryBridgeEl.setAttribute('stroke-width', (globalSkeletonStroke * 0.6).toFixed(2));
            capillaryBridgeEl.setAttribute('opacity', isKollaps ? '1' : '0.7');
          } else {
            capillaryBridgeEl.setAttribute('stroke', 'none');
          }
        }
      }

      // Refraktionsfilamente & Orbs
      if (refract1El) {
        const a1 = phaseHelixCW;
        refract1El.setAttribute('d', `M ${(cx + Math.cos(a1) * (25 * hostScale)).toFixed(1)} ${(cy + Math.sin(a1) * (25 * hostScale)).toFixed(1)} Q ${(cx + Math.cos(a1 + 1.1) * (14 * hostScale)).toFixed(1)} ${(cy + Math.sin(a1 + 1.1) * (14 * hostScale)).toFixed(1)} ${(cx + Math.cos(a1 + 2.0) * 6).toFixed(1)} ${(cy + Math.sin(a1 + 2.0) * 6).toFixed(1)}`);
      }
      if (refract2El) {
        const a2 = phaseHelixCW + Math.PI;
        refract2El.setAttribute('d', `M ${(cx + Math.cos(a2) * (21 * hostScale)).toFixed(1)} ${(cy + Math.sin(a2) * (21 * hostScale)).toFixed(1)} Q ${(cx + Math.cos(a2 + 1.0) * (12 * hostScale)).toFixed(1)} ${(cy + Math.sin(a2 + 1.0) * (12 * hostScale)).toFixed(1)} ${(cx + Math.cos(a2 + 1.9) * 5).toFixed(1)} ${(cy + Math.sin(a2 + 1.9) * 5).toFixed(1)}`);
      }
      if (crest1El && outerPoints[2]) { crest1El.setAttribute('cx', outerPoints[2].x.toFixed(1)); crest1El.setAttribute('cy', outerPoints[2].y.toFixed(1)); }
      if (crest2El && outerPoints[14]) { crest2El.setAttribute('cx', outerPoints[14].x.toFixed(1)); crest2El.setAttribute('cy', outerPoints[14].y.toFixed(1)); }
      if (satCWEl) { satCWEl.setAttribute('cx', (50 + Math.cos(phaseHelixCW * 0.6) * 44).toFixed(1)); satCWEl.setAttribute('cy', (50 + Math.sin(phaseHelixCW * 0.6) * 40).toFixed(1)); }
      if (satCCWEl) { satCCWEl.setAttribute('cx', (50 + Math.cos(phaseShadowCCW * 0.5 + 2.2) * 42).toFixed(1)); satCCWEl.setAttribute('cy', (50 + Math.sin(phaseShadowCCW * 0.5 + 2.2) * 45).toFixed(1)); }
    }

    animFrameId = requestAnimationFrame(renderFluidVortex);
  }

  // ============================================================================
  // 5. DOM-TEXTEXTRAKTION & HASH-FILTER
  // ============================================================================
  function extractCleanViewportText() {
    try {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {
            if (!node || !node.parentElement) return NodeFilter.FILTER_REJECT;
            const tag = node.parentElement.tagName.toLowerCase();
            if (['script', 'style', 'noscript', 'svg', 'canvas', 'template'].includes(tag)) return NodeFilter.FILTER_REJECT;
            if (node.parentElement.closest('#q-o-widget-container')) return NodeFilter.FILTER_REJECT;
            const str = node.textContent.trim();
            return str.length > 12 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        }
      );

      const chunks = [];
      let totalLen = 0;
      let node;
      while ((node = walker.nextNode()) && totalLen < 4000) {
        const clean = node.textContent.replace(/\s+/g, ' ').trim();
        if (clean.length > 12) {
          chunks.push(clean);
          totalLen += clean.length;
        }
      }
      return chunks.join(' ');
    } catch (e) {
      return document.body ? document.body.innerText.slice(0, 3000) : '';
    }
  }

  function computeQuickHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return 'h_' + Math.abs(hash);
  }

  // ============================================================================
  // 6. METABOLISCHER SCAN
  // ============================================================================
  async function triggerMetabolicScan() {
    if (!isMetabolismActive || isKryoSleep) return;

    const text = extractCleanViewportText();
    if (!text || text.length < 20) return;

    const hash = computeQuickHash(text);
    if (hash === lastScannedTextHash) return;
    lastScannedTextHash = hash;

    const pageUrl = window.location.href;

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        { type: 'ANALYZE_TEXT', text: text, url: pageUrl, sessionId: currentSessionId },
        (res) => {
          if (res && res.success && res.data) {
            applyAnalysisPayload(res.data, pageUrl);
          }
        }
      );
    }
  }

  function applyAnalysisPayload(data, url) {
    if (!data) return;
    targetLqScore = typeof data.lq_score === 'number' ? data.lq_score : 1.0;

    if (Array.isArray(data.toxic_snippets)) {
      data.toxic_snippets.forEach((s) => s && !currentToxicSnippets.includes(s) && currentToxicSnippets.push(s));
    }
    if (Array.isArray(data.nutrient_snippets)) {
      data.nutrient_snippets.forEach((s) => s && !currentNutrientSnippets.includes(s) && currentNutrientSnippets.push(s));
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'LQ_SCORE_UPDATED',
        lq_score: targetLqScore,
        source_url: url,
        session_id: currentSessionId
      }).catch(() => {});
    }
  }

  // ============================================================================
  // 7. EVENT-BINDINGS IM SHADOW-DOM
  // ============================================================================
  function bindWidgetEvents() {
    const slider = shadowRoot.getElementById('morphology-sensitivity');
    const badge = shadowRoot.getElementById('sensitivity-status-badge');
    const valDisplay = shadowRoot.getElementById('sensitivity-display-value');
    const btnStart = shadowRoot.getElementById('btn-start');
    const btnStop = shadowRoot.getElementById('btn-stop');
    const btnBiopsy = shadowRoot.getElementById('btn-biopsy');
    const blobWrapper = shadowRoot.getElementById('biomorphic-blob-wrapper');

    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        currentSensitivity = val;
        if (valDisplay) valDisplay.textContent = val.toFixed(1) + 'x';
        if (badge) {
          badge.textContent = val === 0.0 ? 'BLIND' : val <= 1.2 ? 'NORMAL' : 'FORENSISCH';
          badge.className = `hud-status-badge status-${val === 0.0 ? 'blind' : val <= 1.2 ? 'normal' : 'forensic'}`;
        }
      });
    }

    if (btnStart) {
      btnStart.addEventListener('click', () => {
        isMetabolismActive = true;
        isKryoSleep = false;
        triggerMetabolicScan();
      });
    }

    if (btnStop) {
      btnStop.addEventListener('click', () => {
        isKryoSleep = true;
        isMetabolismActive = false;
      });
    }

    const openLabHandler = () => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'OPEN_LABORATORY',
          biopsy_id: currentSessionId
        });
      }
    };

    if (btnBiopsy) btnBiopsy.addEventListener('click', openLabHandler);
    if (blobWrapper) blobWrapper.addEventListener('click', openLabHandler);
  }

  // ============================================================================
  // 8. INITIALISIERUNG
  // ============================================================================
  function initializeEngine() {
    injectMetabolicWidget();
    lastTimestamp = performance.now();
    animFrameId = requestAnimationFrame(renderFluidVortex);
    setTimeout(triggerMetabolicScan, 1500);
    scanIntervalId = setInterval(triggerMetabolicScan, 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEngine);
  } else {
    initializeEngine();
  }
})();
