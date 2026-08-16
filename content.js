// ============================================================================
// LINGU-BLOB ERWEITERUNG — FINALE SYSTEM-STEUERUNG (CONTENT.JS)
// ============================================================================

(function () {
  // 1. GLOBALER METABOLISCHER PUFFER (Echtzeit-Gedächtnis)
  let latestMetabolicData = {
    biopsy_id: 'bio_init',
    lq_score: 1.0,
    source_url: window.location.href,
    morphology_class: 'q-o-hud-stable'
  };

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
      <!-- Der gläserne Tiefsee-Zellkörper -->
      <div id="q-o-blob-container" class="q-o-hud-stable">
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
  }

  // 3. HAPTISCHE INTERAKTIONEN (Drag, Hover-Latenz & Klicks)
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
  // Wartet 200 Millisekunden, bevor es schließt – das fängt dein Hochwischen perfekt ab!
  setTimeout(() => {
    if (!wrapper.matches(':hover')) {
      hud.classList.remove('visible');
    }
  }, 200);
});

    // --- DRAG & DROP LOGIK WITH MUSKELSPANNUNG ---
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
        
        // Grenzen abfangen
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
      openLaboratoryPortal('Doppelklick', null);
    });

    // --- HUD BUTTON KLICKS ---
    document.getElementById('opt-meta-on').addEventListener('click', (e) => {
      e.stopPropagation();
      blob.className = 'q-o-hud-stable';
    });

    document.getElementById('opt-meta-off').addEventListener('click', (e) => {
      e.stopPropagation();
      blob.className = 'q-o-hud-kryo'; // Gefrorener Zustand
    });

    document.getElementById('opt-biopsy').addEventListener('click', (e) => {
      e.stopPropagation();
      executeBiopsyExtraction(blob);
    });
  }

  // 4. SCHMUGGLER-ANBINDUNG (Live-Sync via background.js)
  async function syncMetabolismWithBackend() {
    const blobElement = document.getElementById('q-o-blob-container');
    if (!blobElement || isDragging) return;

    if (!chrome.runtime || !chrome.runtime.id) {
      console.warn('[Q-O] Erweiterungs-Kontext ungültig. Bitte Seite neu laden.');
      return;
    }

    // Interner Funk an background.js um PNA/CORS zu tunneln
    chrome.runtime.sendMessage(
      {
        type: "ANALYZE_TEXT",
        text: document.body.innerText.slice(0, 4000),
        url: window.location.href
      },
      function (response) {
        if (chrome.runtime.lastError || !response || !response.success) {
          console.log('[Q-O Live] Backend offline oder blockiert. Halte Basis-Metabolismus.');
          return;
        }

        const data = response.data;
        latestMetabolicData = {
          biopsy_id: data.biopsy_id,
          lq_score: data.lq_score,
          source_url: data.source_url,
          morphology_class: data.morphology_state.class
        };

        // Visueller Zustands-Wechsel
        blobElement.className = data.morphology_state.class;
        console.log(`[Q-O Metabolismus] Score: ${data.lq_score} -> Zustand: ${data.morphology_state.class}`);
      }
    );
  }

  // 5. INTERAKTIVE BIOPSIE WITH VISUELLEM LEERSAUGEN
  function executeBiopsyExtraction(blobElement) {
    const generatedId = `bio_${Date.now()}`;
    if (latestMetabolicData.biopsy_id === 'bio_init') {
      latestMetabolicData.biopsy_id = generatedId;
    }

    // Visuelles Leersaugen (Toxische Transparenz)
    blobElement.className = 'q-o-hud-extracted';

    // IndexedDB öffnen und Probe für das Labor einfrieren
    const request = indexedDB.open('QO_Metabolic_Vault', 1);
    
    request.onupgradeneeded = function (e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('biopsy_archive')) {
        db.createObjectStore('biopsy_archive', { keyPath: 'biopsy_id' });
      }
    };

    request.onsuccess = function (e) {
      const db = e.target.result;
      const transaction = db.transaction(['biopsy_archive'], 'readwrite');
      const store = transaction.objectStore('biopsy_archive');
      
      const putRequest = store.put({
        biopsy_id: latestMetabolicData.biopsy_id,
        lq_score: latestMetabolicData.lq_score,
        source_url: latestMetabolicData.source_url
      });

      putRequest.onsuccess = function () {
        console.log('[Q-O] Biopsie-Zelle eingefroren:', latestMetabolicData.biopsy_id);
        openLaboratoryPortal('Biopsie', latestMetabolicData.biopsy_id);
      };
    };
  }

  // 6. BLOCKADESICHERER PORTAL-SPRUNG (ABSOLUTER CHROME-PFAD)
  function openLaboratoryPortal(actionContext, targetBiopsyId) {
    console.log(`[Q-O Portal] Sprung ins Labor (${actionContext})`);
    const path = targetBiopsyId ? `index.html?id=${targetBiopsyId}` : 'index.html';
    
    // Zwingend absoluter Erweiterungs-Pfad von der Festplatte
    const portalUrl = chrome.runtime.getURL(path);
    window.open(portalUrl, '_blank');
  }

  // Initialer Start & Event-Schleifen
  window.addEventListener('DOMContentLoaded', injectLinguBlob);
  window.addEventListener('load', () => {
    setTimeout(injectLinguBlob, 500); // Sicherheits-Injektion
    setInterval(syncMetabolismWithBackend, 4000); // Alarmiert alle 4 Sekunden frisch
  });
})();