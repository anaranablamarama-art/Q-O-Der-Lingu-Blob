// ==============================================================================
// 🪐 PROJEKT "Q-O" // CONTENT.JS - HARDWARE-CORE DECENTRALIZED REAKTOR
// ==============================================================================
// DIE 3 UNANTASTBAREN SÄULEN:
// 1. SÄULE I: DIE REINGEWASCHENE HELIX-FUSION (60 FPS // 0 ZENTRUM // STRAIN-DERIVATION)
// 2. SÄULE II: LAUTERES INSEL-SPAWNING AUF DER RAM-KARTE (Score >= 0.5 -> stroke: none, #010005 Teer)
// 3. SÄULE III: AXIOM XII - DEZENTRALES PROXIMITY-GEFÄLLE (Score < 0.5 -> Dichte-basiertes Amethyst-Skelett; < 0.25 -> 3.0px Kollaps)
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

  // Dezentraler Teer-Partikel-Pool (Akkumuliert in den Buchten)
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
  // 2. DOM-INJEKTION DES BIO-SENSORS (<svg viewBox="0 0 100 100">)
  // ============================================================================
  function injectMetabolicWidget() {
    if (document.getElementById('q-o-widget-container')) return;

    const container = document.createElement('div');
    container.id = 'q-o-widget-container';

    container.innerHTML = `
      <div id="biomorphic-blob-wrapper" title="Q-O Symbiont // Dezentrale Bio-Matrix">
        <svg id="biomorphic-blob" viewBox="0 0 100 100" width="92" height="92">
          <defs>
            <!-- 🔮 SÄULE I: 45°-HELIX-GRADIENT (Neon-Cyan links, Void-Zentrum, Vapor-Violett rechts) -->
            <linearGradient id="qo-helix-ocean-grad" x1="15%" y1="85%" x2="85%" y2="15%">
              <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.98" />
              <stop offset="28%" stop-color="#00d4ff" stop-opacity="0.75" />
              <stop offset="50%" stop-color="#010005" stop-opacity="0.0" />
              <stop offset="72%" stop-color="#9333ea" stop-opacity="0.75" />
              <stop offset="100%" stop-color="#e879f9" stop-opacity="0.98" />
            </linearGradient>

            <!-- ✨ SPEKULARER KUPPEN-GLANZ -->
            <linearGradient id="qo-specular-ocean-rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
              <stop offset="35%" stop-color="#00f0ff" stop-opacity="0.7" />
              <stop offset="65%" stop-color="#a855f7" stop-opacity="0.7" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95" />
            </linearGradient>

            <!-- 🖤 SÄULE II: SOLID-MATTE DIGITALER TEER -->
            <radialGradient id="qo-tar-particle-grad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#18002e" stop-opacity="1" />
              <stop offset="60%" stop-color="#070010" stop-opacity="0.98" />
              <stop offset="100%" stop-color="#010005" stop-opacity="1" />
            </radialGradient>

            <!-- 🌌 INNERE REFRAKTIONS-FILAMENTE -->
            <linearGradient id="qo-filament-refract-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.85" />
              <stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#ec4899" stop-opacity="0.85" />
            </linearGradient>
          </defs>

          <!-- 🌌 LAYER -1: FEINE RADIALE ORIENTIERUNGS-RINGE -->
          <g id="qo-background-celestial-rings" opacity="0.22">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(0, 240, 255, 0.22)" stroke-width="0.4" stroke-dasharray="2 6" />
            <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(168, 85, 247, 0.22)" stroke-width="0.4" />
            <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(0, 240, 255, 0.15)" stroke-width="0.3" stroke-dasharray="1 3" />
          </g>

          <!-- 🧪 LAYER 0: DIE KAPPILLAR-STRÄNGE (SÄULE III: PROXIMITY-GEFÄLLE) -->
          <g id="qo-ghost-capillaries">
            <path id="qo-capillary-0" fill="none" stroke="none" stroke-width="0" stroke-linecap="round" />
            <path id="qo-capillary-1" fill="none" stroke="none" stroke-width="0" stroke-linecap="round" />
            <path id="qo-capillary-2" fill="none" stroke="none" stroke-width="0" stroke-linecap="round" />
            <path id="qo-capillary-3" fill="none" stroke="none" stroke-width="0" stroke-linecap="round" />
            <path id="qo-capillary-4" fill="none" stroke="none" stroke-width="0" stroke-linecap="round" />
            <path id="qo-capillary-5" fill="none" stroke="none" stroke-width="0" stroke-linecap="round" />
            <path id="qo-capillary-6" fill="none" stroke="none" stroke-width="0" stroke-linecap="round" />
            <path id="qo-capillary-7" fill="none" stroke="none" stroke-width="0" stroke-linecap="round" />
            <path id="qo-capillary-bridge" fill="none" stroke="none" stroke-width="0" stroke-linecap="round" />
          </g>

          <!-- 🖤 LAYER 0.5: INSEL-TEERSCHWARM (SPAWNT REIN AUF DEN BUCHT-KOORDINATEN) -->
          <g id="qo-tar-bubbles-swarm"></g>

          <!-- 🔮 LAYER 1: DAS OZEAN-GEWEBE / WELLIGE FARBHAUT (45° HELIX, KEIN KERN) -->
          <path id="qo-ocean-membrane" 
                fill="url(#qo-helix-ocean-grad)" 
                stroke="url(#qo-specular-ocean-rim)" 
                stroke-width="1.2" 
                stroke-linejoin="round" />

          <!-- 🌀 INNERE REFRAKTIONS-STRÖME -->
          <path id="qo-inner-refract-1" fill="none" stroke="url(#qo-filament-refract-grad)" stroke-width="1.0" stroke-linecap="round" opacity="0.7" />
          <path id="qo-inner-refract-2" fill="none" stroke="#00f0ff" stroke-width="0.8" stroke-linecap="round" opacity="0.6" />

          <!-- ✨ SPITZLICHTER & KINETISCHE SATELLITEN-ORBS -->
          <circle id="qo-crest-light-1" cx="26" cy="24" r="2.2" fill="#ffffff" opacity="0.95" />
          <circle id="qo-crest-light-2" cx="74" cy="26" r="2.0" fill="#ffffff" opacity="0.9" />
          <circle id="qo-sat-orb-cw" cx="14" cy="30" r="1.4" fill="#00f0ff" opacity="0.75" />
          <circle id="qo-sat-orb-ccw" cx="86" cy="70" r="1.5" fill="#e879f9" opacity="0.7" />
        </svg>
      </div>

      <!-- 🎛️ VALORANT COCKPIT KOMMANDO-DOCK -->
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
          <button id="btn-start" title="Reaktiviert den 4-Sekunden-Metabolismus">[ ZÜND ]</button>
          <button id="btn-stop" title="Friert das System im Kryo-Schlaf ein">[ FREEZE ]</button>
          <button id="btn-biopsy" title="Siegelt die Biopsie und öffnet das Labor">[ BIOPSY ]</button>
        </div>
      </div>
    `;

    document.body.appendChild(container);
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
  // 4. LIVE 60-FPS VEKTOR-RENDERSCHLEIFE (DIE 3 HARDWARE-SÄULEN)
  // ============================================================================
  function renderFluidVortex(timestamp) {
    const dt = Math.min(0.1, (timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;

    if (!isKryoSleep) {
      // ------------------------------------------------------------------------
      // A. TRÄGHEITS-DÄMPFUNG & DERIVATION DER 'viscoelasticStrain' VARIABLE
      // ------------------------------------------------------------------------
      currentLqScore += (targetLqScore - currentLqScore) * 0.05;

      if (currentLqScore >= 1.0) {
        targetStrain = 0.0;
      } else {
        targetStrain = Math.min(1.0, Math.max(0.0, (1.0 - currentLqScore) * currentSensitivity));
      }
      viscoelasticStrain += (targetStrain - viscoelasticStrain) * 0.05;

      // Skelett-Basis-Zielwert (Axiom XII)
      let targetStroke = 0.0;
      if (currentLqScore >= 0.5) {
        targetStroke = 0.0;
      } else if (currentLqScore >= 0.25) {
        const awakeningProgress = (0.5 - currentLqScore) / 0.25;
        targetStroke = awakeningProgress * 2.0; // Stufenlos 0.0 -> 2.0px
      } else {
        targetStroke = 3.0; // Metabolischer Kollaps -> 3.0px
      }
      globalSkeletonStroke += (targetStroke - globalSkeletonStroke) * 0.05;

      // ------------------------------------------------------------------------
      // B. SÄULE I: ASYNCHRONE PHASENWINKEL (20s CW vs. 26s CCW)
      // ------------------------------------------------------------------------
      const kineticFactor = currentLqScore < 0.25 ? 0.05 : (1.0 + viscoelasticStrain * 0.35);

      const omegaCW = (Math.PI * 2) / 20.0;
      phaseHelixCW = (phaseHelixCW + omegaCW * kineticFactor * dt) % (Math.PI * 2);

      const omegaCCW = (Math.PI * 2) / 26.0;
      phaseShadowCCW = (phaseShadowCCW - omegaCCW * kineticFactor * dt) % (Math.PI * 2);

      phaseHarmonicA = (phaseHarmonicA + 1.1 * kineticFactor * dt) % (Math.PI * 2);
      phaseHarmonicB = (phaseHarmonicB + 0.75 * kineticFactor * dt) % (Math.PI * 2);

      // ------------------------------------------------------------------------
      // C. METABOLISCHER KOLLAPS: 0.05s ZITTERSCHOCK & SCALE(0.8)
      // ------------------------------------------------------------------------
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

      // =======================================================================
      // D. SÄULE I: LAYER 1 DAS OZEAN-GEWEBE (45° HELIX, KEIN ZENTRALER KERN)
      // =======================================================================
      const numOuterPoints = 24;
      const outerPoints = [];

      const amp1 = (4.6 + Math.sin(phaseHarmonicB) * 1.2) * (1.0 - Math.min(0.4, viscoelasticStrain * 0.3));
      const amp2 = (2.6 + Math.cos(phaseHarmonicA) * 0.8) * (1.0 - Math.min(0.4, viscoelasticStrain * 0.3));

      for (let i = 0; i < numOuterPoints; i++) {
        const theta = (i / numOuterPoints) * Math.PI * 2;

        const wave =
          Math.sin(5 * theta + phaseHelixCW) * amp1 +
          Math.cos(3 * theta - phaseHarmonicB) * amp2;

        const strainDip = viscoelasticStrain > 0.02
          ? Math.abs(Math.sin(4 * theta + phaseShadowCCW)) * (viscoelasticStrain * 3.2)
          : 0;

        const r = Math.max(10, baseOuterRadius + wave - strainDip);

        outerPoints.push({
          x: cx + Math.cos(theta) * r,
          y: cy + Math.sin(theta) * r,
          r: r,
          theta: theta
        });
      }

      const membraneEl = document.getElementById('qo-ocean-membrane');
      if (membraneEl) {
        membraneEl.setAttribute('d', pointsToClosedBezierSpline(outerPoints, 0.95));
      }

      // =======================================================================
      // E. SÄULE II: UNSICHTBARE RAM-KOORDINATEN (ghostFractureNodes // 8 BUCHTEN)
      // =======================================================================
      const ghostCapillaryNodes = [];
      const numBays = 8;
      const bayParticleCounts = new Array(numBays).fill(0);

      for (let b = 0; b < numBays; b++) {
        const bayTheta = (b / numBays) * Math.PI * 2 + (Math.PI / 8);

        // Dezentral an der äußeren Peripherie entlanggekrümmt (Keine Speichen ins Zentrum)
        const pEntry = {
          x: cx + Math.cos(bayTheta + phaseShadowCCW * 0.22) * (baseOuterRadius - 3.5),
          y: cy + Math.sin(bayTheta + phaseShadowCCW * 0.22) * (baseOuterRadius - 3.5)
        };

        const pMid = {
          x: cx + Math.cos(bayTheta + 0.35 + phaseHelixCW * 0.15) * (baseOuterRadius * 0.72),
          y: cy + Math.sin(bayTheta + 0.35 + phaseHelixCW * 0.15) * (baseOuterRadius * 0.72)
        };

        const pEnd = {
          x: cx + Math.cos(bayTheta + 0.65 + phaseShadowCCW * 0.18) * (baseOuterRadius * 0.55),
          y: cy + Math.sin(bayTheta + 0.65 + phaseShadowCCW * 0.18) * (baseOuterRadius * 0.55)
        };

        ghostCapillaryNodes.push({ p0: pEntry, p1: pMid, p2: pEnd });
      }

      // =======================================================================
      // F. SÄULE II: LAUTERES INSEL-SPAWNING DER TEERBLASEN (STRIKT #010005)
      // =======================================================================
      const tarSwarmGroup = document.getElementById('qo-tar-bubbles-swarm');
      if (tarSwarmGroup) {
        let activeTarCount = 0;
        if (viscoelasticStrain > 0.01) {
          activeTarCount = Math.min(
            MAX_TAR_PARTICLES,
            Math.floor(viscoelasticStrain * 38)
          );
        }

        let swarmSvgHtml = '';

        for (let i = 0; i < MAX_TAR_PARTICLES; i++) {
          const p = tarParticles[i];

          if (i < activeTarCount && !isKryoSleep) {
            p.active = true;

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
            const growthFactor = 1.0 + viscoelasticStrain * 0.8;
            const pulse = 0.88 + Math.sin(p.pulsePhase) * 0.22;
            const curRadius = p.baseRadius * growthFactor * pulse;

            const tarOpacity = Math.min(0.98, 0.4 + p.t * 0.45 + viscoelasticStrain * 0.2);

            // STRIKT #010005 (KEINE LILA VERFÄRBUNG)
            swarmSvgHtml += `
              <circle cx="${p.currentX.toFixed(1)}" cy="${p.currentY.toFixed(1)}" r="${curRadius.toFixed(1)}" 
                      fill="url(#qo-tar-particle-grad)" 
                      stroke="#010005" 
                      stroke-width="0.4" 
                      opacity="${tarOpacity.toFixed(2)}" />
            `;
          } else {
            p.active = false;
          }
        }

        tarSwarmGroup.innerHTML = swarmSvgHtml;
      }

      // =======================================================================
      // G. SÄULE III: AXIOM XII - DEZENTRALES PROXIMITY-GEFÄLLE DES SKELETTS
      // =======================================================================
      const capillariesGroup = document.getElementById('qo-ghost-capillaries');
      if (capillariesGroup) {
        if (currentLqScore >= 0.5 || globalSkeletonStroke <= 0.04) {
          // LINIEN-SPERRE: Keine Kanten vor / zwischen den Partikeln
          for (let b = 0; b < numBays; b++) {
            const lineEl = document.getElementById(`qo-capillary-${b}`);
            if (lineEl) {
              lineEl.setAttribute('stroke', 'none');
              lineEl.setAttribute('stroke-width', '0');
            }
          }
          const bridgeEl = document.getElementById('qo-capillary-bridge');
          if (bridgeEl) {
            bridgeEl.setAttribute('stroke', 'none');
            bridgeEl.setAttribute('stroke-width', '0');
          }
        } else {
          // Erwachen der Kapillaren: Proportional zur lokalen Dichte (Insel-Hotspots)
          const isKollaps = currentLqScore < 0.25;
          const solidColor = isKollaps ? '#010005' : '#8b5cf6'; // Solider Cyber-Amethyst

          let bridgeD = '';

          for (let b = 0; b < numBays; b++) {
            const lineEl = document.getElementById(`qo-capillary-${b}`);
            const density = bayParticleCounts[b]; // Lokale Proximity
            const curve = ghostCapillaryNodes[b];

            if (lineEl && curve) {
              // Nur Hotspots mit Teerblasen erhalten sichtbare Kapillaren
              if (density > 0 || isKollaps) {
                const localStroke = isKollaps 
                  ? 3.0 
                  : Math.min(2.0, globalSkeletonStroke * (0.6 + Math.min(1.0, density * 0.25)));

                lineEl.setAttribute('d', `M ${curve.p0.x.toFixed(1)} ${curve.p0.y.toFixed(1)} Q ${curve.p1.x.toFixed(1)} ${curve.p1.y.toFixed(1)} ${curve.p2.x.toFixed(1)} ${curve.p2.x.toFixed(1)}`);
                lineEl.setAttribute('stroke', solidColor);
                lineEl.setAttribute('stroke-width', localStroke.toFixed(2));
                lineEl.setAttribute('opacity', isKollaps ? '1' : '0.85');

                if (b % 2 === 0) {
                  const nextCurve = ghostCapillaryNodes[(b + 1) % numBays];
                  bridgeD += `M ${curve.p1.x.toFixed(1)} ${curve.p1.y.toFixed(1)} L ${nextCurve.p1.x.toFixed(1)} ${nextCurve.p1.y.toFixed(1)} `;
                }
              } else {
                // Partikelarme Zonen bleiben stroke-frei
                lineEl.setAttribute('stroke', 'none');
                lineEl.setAttribute('stroke-width', '0');
              }
            }
          }

          const bridgeEl = document.getElementById('qo-capillary-bridge');
          if (bridgeEl) {
            if (bridgeD.length > 0) {
              bridgeEl.setAttribute('d', bridgeD);
              bridgeEl.setAttribute('stroke', solidColor);
              bridgeEl.setAttribute('stroke-width', (globalSkeletonStroke * 0.6).toFixed(2));
              bridgeEl.setAttribute('opacity', isKollaps ? '1' : '0.7');
            } else {
              bridgeEl.setAttribute('stroke', 'none');
            }
          }
        }
      }

      // =======================================================================
      // H. INNERE REFRAKTIONS-STRÖME & SPITZLICHTER
      // =======================================================================
      const refract1 = document.getElementById('qo-inner-refract-1');
      const refract2 = document.getElementById('qo-inner-refract-2');

      if (refract1) {
        const a1 = phaseHelixCW;
        const x1 = cx + Math.cos(a1) * (25 * hostScale);
        const y1 = cy + Math.sin(a1) * (25 * hostScale);
        const x2 = cx + Math.cos(a1 + 1.1) * (14 * hostScale);
        const y2 = cy + Math.sin(a1 + 1.1) * (14 * hostScale);
        const x3 = cx + Math.cos(a1 + 2.0) * 6;
        const y3 = cy + Math.sin(a1 + 2.0) * 6;
        refract1.setAttribute('d', `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${x2.toFixed(1)} ${y2.toFixed(1)} ${x3.toFixed(1)} ${y3.toFixed(1)}`);
      }

      if (refract2) {
        const a2 = phaseHelixCW + Math.PI;
        const x1 = cx + Math.cos(a2) * (21 * hostScale);
        const y1 = cy + Math.sin(a2) * (21 * hostScale);
        const x2 = cx + Math.cos(a2 + 1.0) * (12 * hostScale);
        const y2 = cy + Math.sin(a2 + 1.0) * (12 * hostScale);
        const x3 = cx + Math.cos(a2 + 1.9) * 5;
        const y3 = cy + Math.sin(a2 + 1.9) * 5;
        refract2.setAttribute('d', `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${x2.toFixed(1)} ${y2.toFixed(1)} ${x3.toFixed(1)} ${y3.toFixed(1)}`);
      }

      const crest1 = document.getElementById('qo-crest-light-1');
      const crest2 = document.getElementById('qo-crest-light-2');
      if (crest1 && outerPoints.length > 2) {
        crest1.setAttribute('cx', outerPoints[2].x.toFixed(1));
        crest1.setAttribute('cy', outerPoints[2].y.toFixed(1));
      }
      if (crest2 && outerPoints.length > 14) {
        crest2.setAttribute('cx', outerPoints[14].x.toFixed(1));
        crest2.setAttribute('cy', outerPoints[14].y.toFixed(1));
      }

      const satCW = document.getElementById('qo-sat-orb-cw');
      const satCCW = document.getElementById('qo-sat-orb-ccw');
      if (satCW) {
        const sA = phaseHelixCW * 0.6;
        satCW.setAttribute('cx', (50 + Math.cos(sA) * 44).toFixed(1));
        satCW.setAttribute('cy', (50 + Math.sin(sA) * 40).toFixed(1));
      }
      if (satCCW) {
        const sB = phaseShadowCCW * 0.5 + 2.2;
        satCCW.setAttribute('cx', (50 + Math.cos(sB) * 42).toFixed(1));
        satCCW.setAttribute('cy', (50 + Math.sin(sB) * 45).toFixed(1));
      }
    }

    animFrameId = requestAnimationFrame(renderFluidVortex);
  }

  // ============================================================================
  // 5. DOM-TEXTEXTRAKTION & HASH-PRÜFUNG (4s METABOLISMUS-PULS)
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
            if (['script', 'style', 'noscript', 'svg', 'canvas', 'template'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (node.parentElement.closest('#q-o-widget-container')) {
              return NodeFilter.FILTER_REJECT;
            }
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
  // 6. ANALYSE-ABFRAGE AN FASTAPI (PORT 8000) & BACKGROUND.JS
  // ============================================================================
  async function triggerMetabolicScan() {
    if (!isMetabolismActive || isKryoSleep) return;

    const extractedText = extractCleanViewportText();
    if (!extractedText || extractedText.length < 20) return;

    const textHash = computeQuickHash(extractedText);
    if (textHash === lastScannedTextHash) return;
    lastScannedTextHash = textHash;

    const pageUrl = window.location.href;

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
        chrome.runtime.sendMessage(
          {
            type: 'ANALYZE_TEXT',
            text: extractedText,
            url: pageUrl,
            sessionId: currentSessionId
          },
          (response) => {
            if (response && response.success && response.data) {
              applyAnalysisPayload(response.data, pageUrl);
            } else {
              fallbackDirectFastApi(extractedText, pageUrl);
            }
          }
        );
      } else {
        fallbackDirectFastApi(extractedText, pageUrl);
      }
    } catch (err) {
      fallbackDirectFastApi(extractedText, pageUrl);
    }
  }

  async function fallbackDirectFastApi(text, url) {
    try {
      const res = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, url: url })
      });
      if (res.ok) {
        const data = await res.json();
        applyAnalysisPayload(data, url);
      }
    } catch (e) {}
  }

  function applyAnalysisPayload(data, url) {
    if (!data) return;

    const rawLq = typeof data.lq_score === 'number' ? data.lq_score : 1.0;
    targetLqScore = rawLq;

    if (Array.isArray(data.toxic_snippets)) {
      data.toxic_snippets.forEach((s) => {
        if (s && !currentToxicSnippets.includes(s)) currentToxicSnippets.push(s);
      });
    }

    if (Array.isArray(data.nutrient_snippets)) {
      data.nutrient_snippets.forEach((s) => {
        if (s && !currentNutrientSnippets.includes(s)) currentNutrientSnippets.push(s);
      });
    }

    if (Array.isArray(data.macro_tox_categories)) {
      data.macro_tox_categories.forEach((c) => {
        if (c && !currentMacroToxCategories.includes(c)) currentMacroToxCategories.push(c);
      });
    }

    if (Array.isArray(data.macro_nut_categories)) {
      data.macro_nut_categories.forEach((c) => {
        if (c && !currentMacroNutCategories.includes(c)) currentMacroNutCategories.push(c);
      });
    }

    if (Array.isArray(data.pro_arguments)) {
      data.pro_arguments.forEach((a) => {
        if (a && !currentProArguments.includes(a)) currentProArguments.push(a);
      });
    }

    if (Array.isArray(data.contra_arguments)) {
      data.contra_arguments.forEach((a) => {
        if (a && !currentContraArguments.includes(a)) currentContraArguments.push(a);
      });
    }

    currentSessionHistory.push({
      url: url,
      lq_score: rawLq,
      s_tox: typeof data.t_makro === 'number' ? data.t_makro : 0.5,
      n_nut: typeof data.n_makro === 'number' ? data.n_makro : 1.5,
      symmetry_score: typeof data.symmetry_score === 'number' ? data.symmetry_score : 100.0,
      timestamp: Date.now()
    });

    if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
      chrome.runtime.sendMessage({
        type: 'LQ_SCORE_UPDATED',
        lq_score: rawLq,
        adjusted_score: targetLqScore,
        source_url: url,
        session_id: currentSessionId
      }).catch(() => {});
    }
  }

  // ============================================================================
  // 7. EVENT-BINDINGS FÜR DAS VALORANT COCKPIT PANEL
  // ============================================================================
  function bindWidgetEvents() {
    const slider = document.getElementById('morphology-sensitivity');
    const badge = document.getElementById('sensitivity-status-badge');
    const valDisplay = document.getElementById('sensitivity-display-value');

    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnBiopsy = document.getElementById('btn-biopsy');
    const blobWrapper = document.getElementById('biomorphic-blob-wrapper');

    if (blobWrapper) {
      blobWrapper.addEventListener('click', () => {
        sealBiopsyAndOpenLab();
      });
    }

    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        currentSensitivity = val;
        if (valDisplay) valDisplay.textContent = val.toFixed(1) + 'x';

        if (badge) {
          if (val === 0.0) {
            badge.textContent = 'BLIND';
            badge.className = 'hud-status-badge status-blind';
          } else if (val <= 1.2) {
            badge.textContent = 'NORMAL';
            badge.className = 'hud-status-badge status-normal';
          } else {
            badge.textContent = 'FORENSISCH';
            badge.className = 'hud-status-badge status-forensic';
          }
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

    if (btnBiopsy) {
      btnBiopsy.addEventListener('click', () => {
        sealBiopsyAndOpenLab();
      });
    }
  }

  // ============================================================================
  // 8. BIOPSIE VERSIEGELN & LABOR ÖFFNEN
  // ============================================================================
  function sealBiopsyAndOpenLab() {
    const payload = {
      session_id: currentSessionId,
      source_url: window.location.href,
      lq_score: targetLqScore,
      toxic_snippets: [...currentToxicSnippets],
      nutrient_snippets: [...currentNutrientSnippets],
      macro_tox_categories: [...currentMacroToxCategories],
      macro_nut_categories: [...currentMacroNutCategories],
      pro_arguments: [...currentProArguments],
      contra_arguments: [...currentContraArguments],
      session_history: [...currentSessionHistory],
      timestamp: Date.now()
    };

    const previousId = currentSessionId;
    currentSessionId = 'session_' + Date.now();
    currentSessionHistory = [];
    currentToxicSnippets = [];
    currentNutrientSnippets = [];
    currentMacroToxCategories = [];
    currentMacroNutCategories = [];
    currentProArguments = [];
    currentContraArguments = [];

    if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_BIOPSY',
          data: payload
        },
        () => {
          chrome.runtime.sendMessage({
            type: 'OPEN_LABORATORY',
            biopsy_id: previousId
          }).catch(() => {});
        }
      );
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('qo_biopsies') || '[]');
        saved.unshift(payload);
        localStorage.setItem('qo_biopsies', JSON.stringify(saved.slice(0, 30)));
      } catch (e) {}
    }
  }

  // ============================================================================
  // 9. METABOLISCHER CYCLE INITIALISIERUNG
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
