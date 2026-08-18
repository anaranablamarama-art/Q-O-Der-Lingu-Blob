// ============================================================================
// LINGU-BLOB ERWEITERUNG — REAKTIVE MIKRO-GEOMETRIE & FLUID-KINETIK (CONTENT.JS)
// ============================================================================
// Stummer, unaufdringlicher Lese-Begleiter mit non-disruptiver peripherer
// Fluid-Kinetik, 3 skalierten Mikro-Organellen (8-10px), einmaligem Zell-Blitz
// (600ms) bei Schwellenwert-Wechsel, amöbenartigem Atmen und asymmetrischem kinetischen Anker.
// Vollständig integriert mit dem privilegierten background.js Tunnel & FastAPI Port 8000.
// ============================================================================

(function () {
  // 1. SITZUNGS-LOGBUCH & GLOBALER METABOLISCHER PUFFER
  let session_history = []; // Lückenloses Multi-Quellen Logbuch aller besuchten URLs der aktuellen Session
  let currentSessionId = null; // Vom Service-Worker zugewiesene Session-ID

  let latestMetabolicData = {
    biopsy_id: 'bio_init',
    session_id: null,
    lq_score: 1.0,
    s_tox: 0.5,
    n_nut: 1.5,
    source_url: window.location.href,
    morphology_class: 'q-o-hud-kryo',
    toxic_snippets: [],
    nutrient_snippets: []
  };

  let globalMetabolismState = 'kryo'; // Standardmäßig matt-grau und leblos
  let currentThresholdCategory = null; // 'stable' (>=1.0), 'deformed' (<1.0), 'toxic' (<0.5), 'kryo'
  let flashTimeout = null;
  let hoverTimer = null;
  let isDragging = false;

  // 2. DOM-INJEKTION (Reaktiver Zellkörper mit 3 plastischen Mikro-Organellen & Fluid-Körper)
  function injectLinguBlob() {
    if (document.getElementById('q-o-symbiont-wrapper')) return;

    // Erschaffung des gemeinsamen übergeordneten Wrappers (Container-Trick)
    const wrapper = document.createElement('div');
    wrapper.id = 'q-o-symbiont-wrapper';

    // Position aus dem localStorage laden oder Standard unten rechts setzen
    const savedX = localStorage.getItem('q-o-pos-x') || (window.innerWidth - 120) + 'px';
    const savedY = localStorage.getItem('q-o-pos-y') || (window.innerHeight - 120) + 'px';
    wrapper.style.left = savedX;
    wrapper.style.top = savedY;

    wrapper.innerHTML = `
      <!-- Der gläserne Tiefsee-Zellkörper (Initial im Kryo-Zustand) -->
      <div id="q-o-blob-container" class="q-o-hud-kryo">
        <div class="large-membrane">
          <!-- Dreiecks-Konstellation der 3 plastischen Mikro-Organellen (8px-10px) -->
          <div class="q-o-organelles-constellation">
            <!-- 1. Cyan Mikro-Kreis (8x8px, border-radius: 50%) -->
            <div class="q-o-organelle q-o-dot-cyan" title="LQ Symmetrie-Punkt (Cyan, 8px Kreis)"></div>
            <!-- 2. Orange Mikro-Oval (10x6px, plastisch gestrecktes Oval) -->
            <div class="q-o-organelle q-o-dot-orange" title="LQ Deformations-Punkt (Orange, 10x6px Oval)"></div>
            <!-- 3. Rotes Mikro-Fragment (9x9px, unregelmäßiger Splitter) -->
            <div class="q-o-organelle q-o-dot-red" title="LQ Toxizitäts-Fragment (Rot, 9x9px Splitter)"></div>
          </div>

          <!-- Zytoplasma Nervenbahnen (SVG) -->
          <svg class="large-cytoplasm-svg" viewBox="0 0 200 200">
            <path class="large-neural-path" d="M 40,100 Q 70,70 100,100 T 160,100" />
            <path class="large-neural-path secondary" d="M 100,40 Q 100,80 100,100 T 100,160" />
            <circle class="large-neural-node" cx="70" cy="85" r="4" />
            <circle class="large-neural-node" cx="130" cy="115" r="4" />
          </svg>

          <!-- Der leuchtende Sichel-Kern (Nucleus) -->
          <div class="large-nucleus-wrapper">
            <div class="large-crescent"></div>
            <div class="large-nucleus-body"></div>
          </div>
        </div>
      </div>

      <!-- Das sterile Hover-Steuerfeld (HUD) -->
      <div id="q-o-control-hud">
        <div class="hud-title">Q-O // LINGU-BLOB</div>
        <div class="hud-option" id="opt-meta-on">⚡ Metabolismus an</div>
        <div class="hud-option" id="opt-meta-off">💤 Metabolismus aus</div>
        <div class="hud-option" id="opt-biopsy" style="color: #f43f5e; font-weight: bold;">🧪 Biopsie</div>
      </div>
    `;

    document.body.appendChild(wrapper);
    setupInteractions(wrapper);
    initGlobalBroadcastListener();
  }

  // 3. NON-DISRUPTIVE KONTRAKTION & ZUSTANDS-UMSCHALTUNG
  // Berechnet die diskrete Schwellenwert-Kategorie anhand des LQ-Scores
  function calculateThresholdCategory(lqScore) {
    if (typeof lqScore !== 'number' || isNaN(lqScore)) return 'stable';
    if (lqScore >= 1.0) return 'stable';      // Tiefsee-Cyan
    if (lqScore >= 0.5) return 'deformed';    // Neon-Orange
    return 'toxic';                           // Metabolismus-Rot
  }

  // Führt die sanfte periphere Zustands-Umschaltung mit reaktiver Fluid-Physik durch
  function updateWidgetState(lqScore, explicitMorphClass) {
    const blob = document.getElementById('q-o-blob-container');
    if (!blob) return;

    if (globalMetabolismState === 'kryo') {
      blob.className = 'q-o-hud-kryo';
      currentThresholdCategory = 'kryo';
      return;
    }

    const newCategory = calculateThresholdCategory(lqScore);
    const targetClass = explicitMorphClass || `q-o-hud-${newCategory}`;

    // 1. ZELL-BLITZ: Nur bei echtem Wechsel der Grenzwert-Kategorie EINMALIG für 600ms zünden
    if (currentThresholdCategory !== null && currentThresholdCategory !== 'kryo' && currentThresholdCategory !== newCategory) {
      triggerCellFlash(blob);
    }

    currentThresholdCategory = newCategory;
    blob.className = targetClass;
  }

  // Sanfter Zell-Blitz (600ms weicher radialer Glow, der sich im Glaskörper auflöst)
  function triggerCellFlash(blobElement) {
    const membrane = blobElement.querySelector('.large-membrane');
    if (!membrane) return;

    if (flashTimeout) {
      clearTimeout(flashTimeout);
      membrane.classList.remove('q-o-cell-flash');
    }

    membrane.classList.add('q-o-cell-flash');
    flashTimeout = setTimeout(() => {
      membrane.classList.remove('q-o-cell-flash');
      flashTimeout = null;
    }, 600);
  }

  // 4. GLOBALE ZUSTANDS-SYNCHRONISATION (ÜBER ALLE TABS)
  function applyGlobalState(state) {
    globalMetabolismState = state;
    const blob = document.getElementById('q-o-blob-container');
    if (!blob) return;

    if (state === 'kryo') {
      blob.className = 'q-o-hud-kryo';
      currentThresholdCategory = 'kryo';
      console.log('[Q-O Homöostase] Globaler Zustand: KRYO (Schlaf)');
    } else {
      console.log('[Q-O Homöostase] Globaler Zustand: AKTIV');
      updateWidgetState(latestMetabolicData.lq_score, latestMetabolicData.morphology_class);
      syncMetabolismWithBackend(); // Analyse-Schleife auf aktivem Tab sofort zünden
    }
  }

  function initGlobalBroadcastListener() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message) => {
          if (!message) return;

          // Globaler Zustand geändert
          if (message.type === 'GLOBAL_STATE_CHANGED') {
            applyGlobalState(message.state);
          }

          // Session wurde nach Biopsie rotiert
          if (message.type === 'SESSION_ROTATED' && message.newSessionId) {
            console.log('[Q-O] Neue Browsing-Session initialisiert:', message.newSessionId);
            currentSessionId = message.newSessionId;
            session_history = []; // Vorherige Historie versiegelt, neues Logbuch starten
          }
        });

        // Initialen Zustand & Session-ID vom Service Worker abfragen
        chrome.runtime.sendMessage({ type: 'GET_GLOBAL_STATE' }, (response) => {
          if (chrome.runtime.lastError) return;
          if (response) {
            if (response.sessionId) currentSessionId = response.sessionId;
            if (response.state) applyGlobalState(response.state);
          }
        });
      }
    } catch (e) {
      console.warn('[Q-O] Broadcast-Listener nicht initialisierbar:', e);
    }
  }

  // 5. HAPTISCHE INTERAKTIONEN (Drag, Hover-Latenz & Klicks)
  function setupInteractions(wrapper) {
    const blob = document.getElementById('q-o-blob-container');
    const hud = document.getElementById('q-o-control-hud');

    // --- HOVER-LOGIK ÜBER DEN WRAPPER (CONTAINER-TRICK) ---
    wrapper.addEventListener('mouseenter', () => {
      if (isDragging) return;
      hoverTimer = setTimeout(() => {
        hud.classList.add('visible');
      }, 450); // 450ms Latenz
    });

    wrapper.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      setTimeout(() => {
        if (!wrapper.matches(':hover')) {
          hud.classList.remove('visible');
        }
      }, 200);
    });

    // --- DRAG & DROP LOGIK MIT MUSKELSPANNUNG ---
    blob.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Nur linke Maustaste
      isDragging = true;
      clearTimeout(hoverTimer);
      hud.classList.remove('visible');
      blob.style.transform = 'scale(0.88)'; // Elastisches Zusammenziehen

      const rect = wrapper.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      function onMouseMove(moveEvent) {
        let x = moveEvent.clientX - offsetX;
        let y = moveEvent.clientY - offsetY;

        // Grenzen des Viewports abfangen
        x = Math.max(0, Math.min(window.innerWidth - 100, x));
        y = Math.max(0, Math.min(window.innerHeight - 100, y));

        wrapper.style.left = x + 'px';
        wrapper.style.top = y + 'px';
      }

      function onMouseUp() {
        isDragging = false;
        blob.style.transform = 'scale(1)'; // Nachwabern auf Normalgröße
        localStorage.setItem('q-o-pos-x', wrapper.style.left);
        localStorage.setItem('q-o-pos-y', wrapper.style.top);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    // --- PORTAL-SPRUNG (DOPPELKLICK) ---
    blob.addEventListener('dblclick', () => {
      openLaboratoryPortal('Doppelklick', currentSessionId || latestMetabolicData.biopsy_id);
    });

    // --- HUD BUTTON KLICKS MIT GLOBALEM FUNK ---
    document.getElementById('opt-meta-on').addEventListener('click', (e) => {
      e.stopPropagation();
      applyGlobalState('stable');
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
          chrome.runtime.sendMessage({ type: 'SET_GLOBAL_STATE', state: 'stable' });
        }
      } catch (err) {}
    });

    document.getElementById('opt-meta-off').addEventListener('click', (e) => {
      e.stopPropagation();
      applyGlobalState('kryo');
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
          chrome.runtime.sendMessage({ type: 'SET_GLOBAL_STATE', state: 'kryo' });
        }
      } catch (err) {}
    });

    document.getElementById('opt-biopsy').addEventListener('click', (e) => {
      e.stopPropagation();
      executeBiopsyExtraction(blob);
    });
  }

  // 6. SCHMUGGLER-ANBINDUNG & SITZUNGS-LOGBUCH (Live-Sync via background.js & FastAPI Port 8000)
  async function syncMetabolismWithBackend() {
    const blobElement = document.getElementById('q-o-blob-container');
    if (!blobElement || isDragging) return;

    // Block solange der globale Zustand auf 'kryo' steht
    if (globalMetabolismState === 'kryo') {
      return;
    }

    // Typ-Validierung
    try {
      if (typeof chrome === 'undefined' || !chrome || !chrome.runtime || !chrome.runtime.id) {
        if (window.qoLinguBlobInterval) {
          clearInterval(window.qoLinguBlobInterval);
        }
        return;
      }
    } catch (err) {
      return;
    }

    // Funk-Tunnel an background.js
    const currentUrl = window.location.href;
    chrome.runtime.sendMessage(
      {
        type: 'ANALYZE_TEXT',
        text: document.body.innerText.slice(0, 4000),
        url: currentUrl
      },
      function (response) {
        if (chrome.runtime.lastError) return;
        if (response && response.success && response.data) {
          const data = response.data;
          if (response.sessionId) currentSessionId = response.sessionId;

          const lqScore = typeof data.lq_score === 'number' ? data.lq_score : 1.0;
          const sTox = (data.details && typeof data.details.s_tox_final === 'number')
            ? data.details.s_tox_final
            : parseFloat(((1 - lqScore) * 4).toFixed(2));
          const nNut = (data.details && typeof data.details.n_nut_final === 'number')
            ? data.details.n_nut_final
            : parseFloat((lqScore * 3).toFixed(2));

          const toxSnippets = Array.isArray(data.toxic_snippets) ? data.toxic_snippets : [];
          const nutSnippets = Array.isArray(data.nutrient_snippets) ? data.nutrient_snippets : [];
          const morphClass = data.morphology_state ? data.morphology_state.class : null;

          latestMetabolicData = {
            biopsy_id: currentSessionId || data.biopsy_id || 'session_' + Date.now(),
            session_id: currentSessionId,
            lq_score: lqScore,
            s_tox: sTox,
            n_nut: nNut,
            source_url: data.source_url || currentUrl,
            morphology_class: morphClass || 'q-o-hud-stable',
            toxic_snippets: toxSnippets,
            nutrient_snippets: nutSnippets
          };

          // Sitzungs-Logbuch führen (Duplikate aktualisieren, neue URLs pushen)
          const historyEntry = {
            url: currentUrl,
            lq_score: lqScore,
            s_tox: sTox,
            n_nut: nNut,
            toxic_snippets: toxSnippets,
            nutrient_snippets: nutSnippets,
            timestamp: Date.now()
          };

          const existingIdx = session_history.findIndex((item) => item.url === currentUrl);
          if (existingIdx >= 0) {
            session_history[existingIdx] = historyEntry;
          } else {
            session_history.push(historyEntry);
          }

          // Periphere Zustandsaktualisierung mit reaktivem Zell-Blitz & Kinetik
          if (globalMetabolismState !== 'kryo') {
            updateWidgetState(lqScore, morphClass);
          }
        }
      }
    );
  }

  // 7. INTERAKTIVE BIOPSIE MIT MULTIQUELLEN-HISTORIE (ÜBERTRAGUNG AN SERVICE-WORKER)
  function executeBiopsyExtraction(blobElement) {
    const sealedSessionId = currentSessionId || latestMetabolicData.session_id || 'session_' + Date.now();
    latestMetabolicData.biopsy_id = sealedSessionId;

    // Visuelles Leersaugen (Toxische Transparenz)
    blobElement.className = 'q-o-hud-extracted';

    // Falls die aktuelle URL noch nicht in session_history steht, einfügen
    if (session_history.length === 0) {
      session_history.push({
        url: latestMetabolicData.source_url || window.location.href,
        lq_score: typeof latestMetabolicData.lq_score === 'number' ? latestMetabolicData.lq_score : 1.0,
        s_tox: typeof latestMetabolicData.s_tox === 'number' ? latestMetabolicData.s_tox : 0.5,
        n_nut: typeof latestMetabolicData.n_nut === 'number' ? latestMetabolicData.n_nut : 1.5,
        toxic_snippets: latestMetabolicData.toxic_snippets || [],
        nutrient_snippets: latestMetabolicData.nutrient_snippets || [],
        timestamp: Date.now()
      });
    }

    const biopsyPayload = {
      biopsy_id: sealedSessionId,
      session_id: sealedSessionId,
      lq_score: typeof latestMetabolicData.lq_score === 'number' ? latestMetabolicData.lq_score : 1.0,
      s_tox: typeof latestMetabolicData.s_tox === 'number' ? latestMetabolicData.s_tox : 0.5,
      n_nut: typeof latestMetabolicData.n_nut === 'number' ? latestMetabolicData.n_nut : 1.5,
      source_url: latestMetabolicData.source_url || window.location.href,
      toxic_snippets: latestMetabolicData.toxic_snippets || [],
      nutrient_snippets: latestMetabolicData.nutrient_snippets || [],
      session_history: [...session_history],
      timestamp: Date.now()
    };

    // Lokale Historie nach Biopsie-Extraktion leeren
    session_history = [];

    let portalOpened = false;
    const triggerPortalOnce = () => {
      if (!portalOpened) {
        portalOpened = true;
        openLaboratoryPortal('Biopsie', sealedSessionId);
      }
    };

    // Zentrale Speicherung über den privilegierten Service Worker (background.js)
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
        chrome.runtime.sendMessage(
          {
            type: 'SAVE_BIOPSY',
            data: biopsyPayload
          },
          (response) => {
            console.log('[Q-O] Konsolidierte Biopsie im Vault versiegelt:', response);
            if (response && response.newSessionId) {
              currentSessionId = response.newSessionId;
            }
            triggerPortalOnce();
          }
        );
      } else {
        triggerPortalOnce();
      }
    } catch (err) {
      console.warn('[Q-O] Fehler beim Senden der Biopsie an den Service Worker:', err);
      triggerPortalOnce();
    }

    // Sicherheits-Timeout falls der Service Worker verzögert antwortet
    setTimeout(triggerPortalOnce, 350);
  }

  // 8. BLOCKADESICHERER PORTAL-SPRUNG
  function openLaboratoryPortal(actionContext, targetBiopsyId) {
    console.log('[Q-O Portal] Sprung ins Labor (' + actionContext + ')');
    const path = targetBiopsyId ? 'index.html?id=' + encodeURIComponent(targetBiopsyId) : 'index.html';

    let portalUrl = path;
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function') {
        portalUrl = chrome.runtime.getURL(path);
      }
    } catch (err) {
      console.warn('[Q-O Portal] Extension-Kontext ungültig, nutze direkten Pfad:', err);
      portalUrl = path;
    }

    window.open(portalUrl, '_blank');
  }

  // Initialer Start & Event-Schleifen
  window.addEventListener('DOMContentLoaded', injectLinguBlob);
  window.addEventListener('load', () => {
    setTimeout(injectLinguBlob, 500);
    if (window.qoLinguBlobInterval) {
      clearInterval(window.qoLinguBlobInterval);
    }
    window.qoLinguBlobInterval = setInterval(syncMetabolismWithBackend, 4000);
  });
})();
