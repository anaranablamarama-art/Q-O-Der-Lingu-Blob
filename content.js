// ============================================================================
// LINGU-BLOB ERWEITERUNG — GLOBALE SYNC-HOMÖOSTASE & SITZUNGS-LOGBUCH (CONTENT.JS)
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
    morphology_class: 'q-o-hud-kryo', // Beim allerersten Laden standardmäßig Kryo
    toxic_snippets: [],
    nutrient_snippets: []
  };

  let globalMetabolismState = 'kryo'; // Standardmäßig matt-grau und leblos
  let hoverTimer = null;
  let isDragging = false;

  // 2. DOM-INJEKTION (Der unzerstörbare biologische Bauplan)
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
      <!-- Der gläserne Tiefsee-Zellkörper (Initial im Schock-Frost Zustand) -->
      <div id="q-o-blob-container" class="q-o-hud-kryo">
        <div class="large-membrane">
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
            <div class="large-nucleolus"></div>
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

  // 3. GLOBALE ZUSTANDS-SYNCHRONISATION (ÜBER ALLE TABS)
  function applyGlobalState(state) {
    globalMetabolismState = state;
    const blob = document.getElementById('q-o-blob-container');
    if (!blob) return;

    if (state === 'kryo') {
      blob.className = 'q-o-hud-kryo';
      console.log('[Q-O Homöostase] Globaler Zustand: KRYO (Schlaf)');
    } else {
      const targetClass = (latestMetabolicData.morphology_class && latestMetabolicData.morphology_class !== 'q-o-hud-kryo')
        ? latestMetabolicData.morphology_class
        : 'q-o-hud-stable';
      blob.className = targetClass;
      console.log('[Q-O Homöostase] Globaler Zustand: STABIL (Aktiv)');
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

          // ERGÄNZUNGS-DIREKTIVE: Session wurde nach Biopsie rotiert
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

  // 4. HAPTISCHE INTERAKTIONEN (Drag, Hover-Latenz & Klicks)
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
      // Wartet 200 Millisekunden, bevor es schließt – das fängt schnelles Hochwischen ab
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

  // 5. SCHMUGGLER-ANBINDUNG & SITZUNGS-LOGBUCH (Live-Sync via background.js)
  async function syncMetabolismWithBackend() {
    const blobElement = document.getElementById('q-o-blob-container');
    if (!blobElement || isDragging) return;

    // Rigoroser Block solange der globale Zustand auf 'kryo' steht
    if (globalMetabolismState === 'kryo') {
      return;
    }
    
    // 1. ABSOLUTE TYP-VALIDIERUNG
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

    // 2. FUNK-TUNNEL AN BACKGROUND.JS
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

          const sTox = (data.details && typeof data.details.s_tox_final === 'number')
            ? data.details.s_tox_final
            : parseFloat(((1 - data.lq_score) * 4).toFixed(2));
          const nNut = (data.details && typeof data.details.n_nut_final === 'number')
            ? data.details.n_nut_final
            : parseFloat((data.lq_score * 3).toFixed(2));

          const toxSnippets = Array.isArray(data.toxic_snippets) ? data.toxic_snippets : [];
          const nutSnippets = Array.isArray(data.nutrient_snippets) ? data.nutrient_snippets : [];

          latestMetabolicData = {
            biopsy_id: currentSessionId || data.biopsy_id || 'session_' + Date.now(),
            session_id: currentSessionId,
            lq_score: data.lq_score,
            s_tox: sTox,
            n_nut: nNut,
            source_url: data.source_url || currentUrl,
            morphology_class: data.morphology_state ? data.morphology_state.class : 'q-o-hud-stable',
            toxic_snippets: toxSnippets,
            nutrient_snippets: nutSnippets
          };

          // DIREKTIVE 1: Sitzungs-Logbuch führen (Duplikate aktualisieren, neue URLs pushen)
          const historyEntry = {
            url: currentUrl,
            lq_score: data.lq_score,
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

          // Nur anwenden wenn nicht zwischenzeitlich in Kryo versetzt
          if (globalMetabolismState !== 'kryo' && data.morphology_state) {
            blobElement.className = data.morphology_state.class;
          }
        }
      }
    );
  }

  // 6. INTERAKTIVE BIOPSIE MIT MULTIQUELLEN-HISTORIE (ÜBERTRAGUNG AN SERVICE-WORKER)
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
      biopsy_id: sealedSessionId, // Eindeutiger Primärschlüssel für die versiegelte Sitzung
      session_id: sealedSessionId,
      lq_score: typeof latestMetabolicData.lq_score === 'number' ? latestMetabolicData.lq_score : 1.0,
      s_tox: typeof latestMetabolicData.s_tox === 'number' ? latestMetabolicData.s_tox : 0.5,
      n_nut: typeof latestMetabolicData.n_nut === 'number' ? latestMetabolicData.n_nut : 1.5,
      source_url: latestMetabolicData.source_url || window.location.href,
      toxic_snippets: latestMetabolicData.toxic_snippets || [],
      nutrient_snippets: latestMetabolicData.nutrient_snippets || [],
      session_history: [...session_history], // Komplettes unverkürztes Sitzungs-Logbuch
      timestamp: Date.now()
    };

    // Lokale Historie nach Biopsie-Extraktion sofort leeren für die nächste Sitzung
    session_history = [];

    let portalOpened = false;
    const triggerPortalOnce = () => {
      if (!portalOpened) {
        portalOpened = true;
        openLaboratoryPortal('Biopsie', sealedSessionId);
      }
    };

    // 1. Primär: Zentrale Speicherung über den privilegierten Service Worker (background.js)
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

    // 2. Sicherheits-Timeout falls der Service Worker verzögert antwortet
    setTimeout(triggerPortalOnce, 350);
  }

  // 7. BLOCKADESICHERER PORTAL-SPRUNG (ABSOLUTER CHROME-PFAD MIT TRY/CATCH-SICHERHEITSGURT)
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
    setTimeout(injectLinguBlob, 500); // Sicherheits-Injektion
    if (window.qoLinguBlobInterval) {
      clearInterval(window.qoLinguBlobInterval);
    }
    window.qoLinguBlobInterval = setInterval(syncMetabolismWithBackend, 4000); // Alarmiert alle 4 Sekunden frisch
  });
})();
