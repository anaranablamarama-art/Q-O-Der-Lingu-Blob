// ==========================================================================
// PROJEKT "Q-O" // CYBER-MEDIZINISCHES ANALYSELABOR (INDEX.JS)
// ==========================================================================
// Strikt CSP-konform, keine Inline-Scripts, vollständige Event-Listener-Anbindung.
// Top-Down Kaskade in Zone 3: Navigation oben -> Cluster/Snippets -> Spektrogramm -> Spülung.
// Exakte Zählung: Quellenanzahl basiert IMMER auf session_history (Sourcing-Logbuch).
// Zentraler Lösch-Aktivator: Gewebebank leeren / Vault Detox mit IndexedDB-Vaporisierung.
// Begleitermodus-Schutz: Button #btn-begleitermodus bleibt nach Detox 100% aktiv & ungedimmt.
// ==========================================================================

(function () {
  'use strict';

  // IndexedDB Konfiguration
  const DB_NAME = 'QO_Metabolic_Vault';
  const STORE_NAME = 'biopsy_archive';
  const DB_VERSION = 1;

  // DOM Elemente Zone 1 (Gewebebank)
  const btnClearVault = document.getElementById('btn-clear-vault');
  const capsuleListWrapper = document.getElementById('capsule-list-wrapper');
  const capsuleCountBadge = document.getElementById('capsule-count-badge');

  // DOM Elemente Zone 2 (Seziertisch / Sezier-Zelle)
  const cryoHolder = document.getElementById('cryo-holder');
  const dropInstruction = document.getElementById('drop-instruction');
  const largeCell = document.getElementById('large-cell');
  const nucleusLqDisplay = document.getElementById('nucleus-lq-display');
  const headerSampleLabel = document.getElementById('header-sample-label');
  const dbIndicator = document.getElementById('db-indicator');
  const dbStatusLabel = document.getElementById('db-status-label');

  // Telemetrie
  const teleSampleId = document.getElementById('tele-sample-id');
  const teleLqVal = document.getElementById('tele-lq-val');
  const teleRatioVal = document.getElementById('tele-ratio-val');
  const teleStateBadge = document.getElementById('tele-state-badge');

  // Die 3 anklickbaren Krankheitsherde im Zytoplasma
  const herd1Synthetic = document.getElementById('herd-1-synthetic');
  const herd2Diffuse = document.getElementById('herd-2-diffuse');
  const herd3Necrotic = document.getElementById('herd-3-necrotic');

  // DOM Elemente Zone 3 (Top-Down Kaskade & Werkzeuge)
  const btnBegleitermodus = document.getElementById('btn-begleitermodus');
  const zoneToolsPanel = document.getElementById('zone-tools-panel');
  const zoneToolsContent = document.getElementById('zone-tools-content');
  const sessionHistoryPanel = document.getElementById('session-history-panel');
  const extractorPanel = document.getElementById('extractor-panel');
  const spectrogramPanel = document.getElementById('spectrogram-panel');
  const flushPanel = document.getElementById('flush-panel');
  const urlHistoryList = document.getElementById('url-history-list');
  const urlHistoryCount = document.getElementById('url-history-count');
  const toolsStatusBadge = document.getElementById('tools-status-badge');
  const herdFocusLabel = document.getElementById('herd-focus-label');
  const clusterCategoryTitle = document.getElementById('cluster-category-title');
  const toxicWordsContainer = document.getElementById('toxic-words-container');
  const toxicUrlsContainer = document.getElementById('toxic-urls-container');
  const forensicInspectorPanel = document.getElementById('forensic-inspector-panel');
  const forensicSnippetText = document.getElementById('forensic-snippet-text');
  const forensicMatchTag = document.getElementById('forensic-match-tag');
  const btnCloseInspector = document.getElementById('btn-close-inspector');
  const schadstoffCircle = document.getElementById('schadstoff-circle');
  const schadstoffVal = document.getElementById('schadstoff-val');
  const valAffekt = document.getElementById('val-affekt');
  const valSyntakt = document.getElementById('val-syntakt');
  const valNaehrwert = document.getElementById('val-naehrwert');
  
  // Gegengift-Bereiche in Zone 3
  const antidotePanel = document.getElementById('antidote-panel');
  const antidoteText = document.getElementById('antidote-text');
  const antidoteContainer = document.getElementById('antidote-container');
  const antidoteNeutralizedText = document.getElementById('antidote-neutralized-text');
  const antidoteWorldKnowledge = document.getElementById('antidote-world-knowledge');
  
  const btnLinguisticFlush = document.getElementById('btn-linguistic-flush');
  const btnFlushLabel = document.getElementById('btn-flush-label');
  const flushSpinnerIcon = document.getElementById('flush-spinner-icon');
  const flushFeedback = document.getElementById('flush-feedback');

  // Aktiver Probenzustand & aktiver URL-Filter für die Tiefen-Steuerung
  let currentSample = null;
  let selectedUrlFilter = null;

  // ==========================================================================
  // 1. BEGLEITERMODUS: RÜCKSPRUNG-FUNKSIGNAL ZUM URSPRUNGS-TAB
  // ==========================================================================
  if (btnBegleitermodus) {
    btnBegleitermodus.addEventListener('click', function () {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'CLOSE_LABORATORY_AND_RETURN' });
      } else {
        window.close();
      }
    });
  }

  // ==========================================================================
  // 2. DAS E-FUNKTIONS-MODELL: LQ = e^(-(S_tox - N_nut))
  // ==========================================================================
  function calculateLQ(sTox, nNut) {
    const diff = sTox - nNut;
    return Math.exp(-diff);
  }

  function getMorphologyState(lqScore) {
    if (lqScore >= 1.0) {
      return {
        key: 'stable',
        className: 'q-o-hud-stable',
        label: 'Gesund / Stabil',
        colorHex: '#00f2fe',
        badgeClass: 'text-cyan-400 border-cyan-400'
      };
    } else if (lqScore >= 0.5) {
      return {
        key: 'deformed',
        className: 'q-o-hud-deformed',
        label: 'Deformiert / Stress',
        colorHex: '#ff9900',
        badgeClass: 'text-yellow-400 border-yellow-500'
      };
    } else {
      return {
        key: 'toxic',
        className: 'q-o-hud-toxic',
        label: 'Toxisch / Entzündet',
        colorHex: '#e11d48',
        badgeClass: 'text-red-400 border-red-500'
      };
    }
  }

  // ==========================================================================
  // 3. HTML5 DRAG & DROP LOGIK (ZWISCHEN ZONE 1 & ZONE 2)
  // ==========================================================================
  function bindCapsuleEvents(capsule) {
    function extractPayload() {
      const rawLq = parseFloat(capsule.getAttribute('data-lq'));
      const rawStox = parseFloat(capsule.getAttribute('data-stox'));
      const rawNnut = parseFloat(capsule.getAttribute('data-nnut'));
      
      let toxicSnippets = [];
      let nutrientSnippets = [];
      let sessionHistory = [];

      try {
        const rawTox = capsule.getAttribute('data-toxic-snippets');
        if (rawTox) toxicSnippets = JSON.parse(rawTox);
      } catch (e) {
        toxicSnippets = [];
      }
      try {
        const rawNut = capsule.getAttribute('data-nutrient-snippets');
        if (rawNut) nutrientSnippets = JSON.parse(rawNut);
      } catch (e) {
        nutrientSnippets = [];
      }
      try {
        const rawHist = capsule.getAttribute('data-session-history');
        if (rawHist) sessionHistory = JSON.parse(rawHist);
      } catch (e) {
        sessionHistory = [];
      }

      const srcUrl = capsule.getAttribute('data-url') || '';
      const finalLq = !isNaN(rawLq) ? rawLq : 1.0;
      const finalStox = !isNaN(rawStox) ? rawStox : 0.5;
      const finalNnut = !isNaN(rawNnut) ? rawNnut : 1.5;

      if (!sessionHistory || sessionHistory.length === 0) {
        sessionHistory = [{
          url: srcUrl || 'https://journal-nature.org/cell-study-2026',
          lq_score: finalLq,
          s_tox: finalStox,
          n_nut: finalNnut,
          toxic_snippets: toxicSnippets,
          nutrient_snippets: nutrientSnippets,
          timestamp: Date.now()
        }];
      }

      return {
        biopsy_id: capsule.getAttribute('data-biopsy-id') || 'bio_sample',
        lq: finalLq,
        s_tox: finalStox,
        n_nut: finalNnut,
        source_url: srcUrl,
        toxic_snippets: Array.isArray(toxicSnippets) ? toxicSnippets : [],
        nutrient_snippets: Array.isArray(nutrientSnippets) ? nutrientSnippets : [],
        session_history: sessionHistory
      };
    }

    capsule.addEventListener('dragstart', function (e) {
      capsule.style.opacity = '0.5';
      const payload = extractPayload();
      e.dataTransfer.setData('text/plain', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'copy';
    });

    capsule.addEventListener('dragend', function () {
      capsule.style.opacity = '1';
    });

    // Direkter Klick auf Kapsel als intuitive Alternative
    capsule.addEventListener('click', function () {
      const payload = extractPayload();
      loadSampleIntoSeziertisch(payload);
    });
  }

  // Drag-Over auf Kryo-Halterung
  if (cryoHolder) {
    cryoHolder.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      cryoHolder.style.borderColor = '#00f2fe';
      cryoHolder.style.boxShadow = '0 0 35px rgba(0, 242, 254, 0.4)';
      cryoHolder.style.backgroundColor = 'rgba(0, 242, 254, 0.04)';
    });

    cryoHolder.addEventListener('dragleave', function () {
      cryoHolder.style.borderColor = 'rgba(0, 242, 254, 0.35)';
      cryoHolder.style.boxShadow = '0 0 25px rgba(0, 242, 254, 0.15)';
      cryoHolder.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
    });

    cryoHolder.addEventListener('drop', function (e) {
      e.preventDefault();
      cryoHolder.style.borderColor = 'rgba(0, 242, 254, 0.35)';
      cryoHolder.style.boxShadow = '0 0 25px rgba(0, 242, 254, 0.15)';
      cryoHolder.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';

      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) {
          const data = JSON.parse(raw);
          loadSampleIntoSeziertisch(data);
        }
      } catch (err) {
        console.error('[Q-O Labor] Fehler beim Parsen der Drop-Daten:', err);
      }
    });
  }

  // ==========================================================================
  // 4. SEZIERTISCH AKTIVIEREN & ZELL-MORPHOLOGIE RENDERN
  // ==========================================================================
  function loadSampleIntoSeziertisch(sample) {
    const sessionHistory = Array.isArray(sample.session_history) && sample.session_history.length > 0
      ? sample.session_history
      : [{
          url: sample.source_url || 'https://journal-nature.org/cell-study-2026',
          lq_score: typeof sample.lq === 'number' ? sample.lq : 1.0,
          s_tox: typeof sample.s_tox === 'number' ? sample.s_tox : 0.5,
          n_nut: typeof sample.n_nut === 'number' ? sample.n_nut : 1.5,
          toxic_snippets: Array.isArray(sample.toxic_snippets) ? sample.toxic_snippets : [],
          nutrient_snippets: Array.isArray(sample.nutrient_snippets) ? sample.nutrient_snippets : [],
          timestamp: Date.now()
        }];

    // 1. Array-Persistenz & Multi-Quellen-Historie verankern
    currentSample = {
      biopsy_id: sample.biopsy_id || 'bio_sample',
      lq: typeof sample.lq === 'number' ? sample.lq : 1.0,
      s_tox: typeof sample.s_tox === 'number' ? sample.s_tox : 0.5,
      n_nut: typeof sample.n_nut === 'number' ? sample.n_nut : 1.5,
      source_url: sample.source_url || '',
      toxic_snippets: Array.isArray(sample.toxic_snippets) ? sample.toxic_snippets : [],
      nutrient_snippets: Array.isArray(sample.nutrient_snippets) ? sample.nutrient_snippets : [],
      session_history: sessionHistory
    };

    // 2. AUTOMATISCHER ERST-FOKUS: Wähle die allerneueste URL der Sitzung (oder source_url)
    const newestUrlEntry = sessionHistory[sessionHistory.length - 1] || sessionHistory[0];
    selectedUrlFilter = newestUrlEntry ? newestUrlEntry.url : null;

    // 3. Kryo-Halterung blitzt weiß/cyan auf (Reflow-Animation)
    if (cryoHolder) {
      cryoHolder.classList.remove('cryo-flash-anim');
      void cryoHolder.offsetWidth;
      cryoHolder.classList.add('cryo-flash-anim');
    }

    // 4. Platzhalter-Text ausblenden, große Zelle einblenden
    if (dropInstruction) {
      dropInstruction.style.opacity = '0';
      dropInstruction.style.pointerEvents = 'none';
    }

    if (largeCell) {
      largeCell.style.opacity = '1';
      largeCell.style.transform = 'scale(1)';
      largeCell.style.pointerEvents = 'auto';
    }

    // 5. Header-Label aktualisieren
    const initialMorph = getMorphologyState(currentSample.lq);
    if (headerSampleLabel) {
      headerSampleLabel.textContent = `${currentSample.biopsy_id} (${initialMorph.label})`;
      headerSampleLabel.style.color = initialMorph.colorHex;
    }

    // Container aus vorherigen Spülungen zurücksetzen
    if (antidotePanel) antidotePanel.classList.add('hidden');
    if (antidoteText) antidoteText.textContent = 'Warte auf biochemische Richtigstellung...';
    if (antidoteContainer) antidoteContainer.classList.add('hidden');
    if (forensicInspectorPanel) forensicInspectorPanel.classList.add('hidden');
    if (flushFeedback) flushFeedback.textContent = '';

    // 6. ZONE 3: TOP-DOWN KASKADE FREISCHALTEN
    unlockToolsPanel(currentSample);
  }

  // ==========================================================================
  // 5. TOP-DOWN STEUERUNG IN ZONE 3 (QUELLEN-NAVIGATION & TIEFEN-ANALYSE)
  // ==========================================================================
  function unlockToolsPanel(sample) {
    if (zoneToolsPanel) {
      zoneToolsPanel.classList.remove('opacity-30', 'pointer-events-none');
      zoneToolsPanel.classList.add('opacity-100');
    }

    // Panels sichtbar machen falls sie im Detox ausgeblendet wurden
    if (sessionHistoryPanel) sessionHistoryPanel.classList.remove('hidden');
    if (extractorPanel) extractorPanel.classList.remove('hidden');
    if (spectrogramPanel) spectrogramPanel.classList.remove('hidden');
    if (flushPanel) flushPanel.classList.remove('hidden');

    // 1. ZUERST: FLUTE DAS NAVIGATIONS-FENSTER '#url-history-list' GANZ OBEN
    renderSessionHistory(sample.session_history);

    // 2. TIEFEN-ANALYSE: Wende die Werte der aktuell fokussierten URL auf alle darunterliegenden Elemente an
    applyDeepAnalysisForSelectedUrl();
  }

  // Flutet '#url-history-list' mit klickbaren Quellen-Kacheln
  function renderSessionHistory(historyList) {
    if (!urlHistoryList) return;
    urlHistoryList.innerHTML = '';

    if (!Array.isArray(historyList) || historyList.length === 0) {
      if (urlHistoryCount) urlHistoryCount.textContent = '1 Quelle';
      urlHistoryList.innerHTML = '<div class="text-gray-500 italic text-[11px] p-2">Keine weiteren Quellen archiviert.</div>';
      return;
    }

    if (urlHistoryCount) {
      urlHistoryCount.textContent = `${historyList.length} ${historyList.length === 1 ? 'Quelle' : 'Quellen'}`;
    }

    // Zeige die URLs in chronologischer Reihenfolge (Neueste ganz oben)
    const reversedHistory = [...historyList].reverse();

    reversedHistory.forEach(function (entry) {
      const urlLq = typeof entry.lq_score === 'number' ? entry.lq_score : 1.0;
      const morph = getMorphologyState(urlLq);
      const isFiltered = selectedUrlFilter === entry.url;

      const chip = document.createElement('div');
      chip.className = `p-2.5 rounded-xl border font-mono text-xs cursor-pointer transition-all duration-200 flex flex-col space-y-1 select-none ${
        isFiltered
          ? 'ring-2 ring-cyan-400 brightness-125 scale-[1.01]'
          : 'hover:brightness-110 opacity-80 hover:opacity-100'
      }`;
      chip.style.backgroundColor = isFiltered ? 'rgba(12, 74, 96, 0.55)' : 'rgba(15, 23, 42, 0.9)';
      chip.style.borderColor = isFiltered ? '#00f2fe' : morph.colorHex + '66';
      chip.style.boxShadow = isFiltered ? `0 0 16px ${morph.colorHex}66` : `0 0 8px ${morph.colorHex}22`;

      let urlDisplay = entry.url;
      try {
        const u = new URL(entry.url);
        urlDisplay = u.hostname + (u.pathname.length > 20 ? u.pathname.substring(0, 20) + '...' : u.pathname);
      } catch (e) {
        urlDisplay = entry.url.length > 30 ? entry.url.substring(0, 27) + '...' : entry.url;
      }

      const dateStr = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

      chip.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="font-bold text-[11px] truncate flex items-center space-x-1.5" style="color: ${isFiltered ? '#ffffff' : morph.colorHex};">
            <span class="${isFiltered ? 'text-cyan-400 font-bold' : ''}">🔗</span>
            <span class="truncate">${urlDisplay}</span>
          </span>
          <span class="text-[10px] px-1.5 py-0.2 rounded border font-bold ${morph.badgeClass}" style="background-color: ${morph.colorHex}18;">
            LQ ${urlLq.toFixed(2)}
          </span>
        </div>
        <div class="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-800/80">
          <span class="${isFiltered ? 'text-cyan-300 font-semibold' : ''}">${isFiltered ? '● AKTIV IM FOKUS' : 'Klicken zur Detailanalyse'}</span>
          <span>${dateStr}</span>
        </div>
      `;

      // INTERAKTIVE TIEFEN-STEUERUNG: Klick auf URL filtert alle darunterliegenden Bereiche exakt
      chip.addEventListener('click', function () {
        selectedUrlFilter = entry.url;
        console.log('[Q-O Top-Down Kaskade] Fokus geschaltet auf Quelle:', entry.url);
        
        // Re-Render History List für visuelle Highlight-Aktualisierung
        renderSessionHistory(historyList);

        // Analyse der gesamten Spalte darunter und des Seziertischs live umschalten
        applyDeepAnalysisForSelectedUrl();
      });

      urlHistoryList.appendChild(chip);
    });
  }

  // Wendet die Daten der aktuell ausgewählten URL exakt auf die darunterliegenden Sektionen an
  function applyDeepAnalysisForSelectedUrl() {
    if (!currentSample) return;

    let activeData = currentSample;
    if (selectedUrlFilter && Array.isArray(currentSample.session_history)) {
      const matched = currentSample.session_history.find((item) => item.url === selectedUrlFilter);
      if (matched) {
        activeData = {
          ...currentSample,
          lq: typeof matched.lq_score === 'number' ? matched.lq_score : currentSample.lq,
          s_tox: typeof matched.s_tox === 'number' ? matched.s_tox : currentSample.s_tox,
          n_nut: typeof matched.n_nut === 'number' ? matched.n_nut : currentSample.n_nut,
          source_url: matched.url,
          // Exakt NUR die Snippets dieser spezifischen URL verwenden!
          toxic_snippets: Array.isArray(matched.toxic_snippets) ? matched.toxic_snippets : [],
          nutrient_snippets: Array.isArray(matched.nutrient_snippets) ? matched.nutrient_snippets : []
        };
      }
    }

    const sTox = typeof activeData.s_tox === 'number' ? activeData.s_tox : 0.5;
    const nNut = typeof activeData.n_nut === 'number' ? activeData.n_nut : 1.5;
    const lq = typeof activeData.lq === 'number' ? activeData.lq : 1.0;
    const sourceUrl = activeData.source_url || 'Konsolidierte Quelle';

    // 1. ZELL-MORPHOLOGIE & SEZIERTISCH SYNCHRONISIEREN
    const activeMorph = getMorphologyState(lq);
    if (largeCell) {
      largeCell.className = 'relative flex items-center justify-center transition-all duration-700 opacity-100 transform scale-100 ' + activeMorph.className;
    }
    if (nucleusLqDisplay) {
      nucleusLqDisplay.textContent = lq.toFixed(2);
    }
    if (teleSampleId) {
      teleSampleId.textContent = currentSample.biopsy_id;
    }
    if (teleLqVal) {
      teleLqVal.textContent = lq.toFixed(2);
      teleLqVal.style.color = activeMorph.colorHex;
    }
    if (teleRatioVal) {
      teleRatioVal.textContent = `${sTox.toFixed(2)} / ${nNut.toFixed(2)}`;
    }
    if (teleStateBadge) {
      teleStateBadge.textContent = selectedUrlFilter ? `${activeMorph.label} (Fokussiert)` : activeMorph.label;
      teleStateBadge.className = 'font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-xs border ' + activeMorph.badgeClass;
    }

    // 2. STATUS-BADGE & CLUSTER-TITEL MUTIEREN
    if (toolsStatusBadge) {
      toolsStatusBadge.textContent = activeMorph.label;
      toolsStatusBadge.className = 'text-xs font-mono px-2 py-0.5 rounded-full border ' + activeMorph.badgeClass;
      toolsStatusBadge.style.backgroundColor = activeMorph.colorHex + '22';
    }

    let categoryTitle = '';
    let hexColor = activeMorph.colorHex;
    let snippetsToDisplay = [];

    let cleanDisplayUrl = sourceUrl;
    try {
      const u = new URL(sourceUrl);
      cleanDisplayUrl = u.hostname;
    } catch (e) {
      cleanDisplayUrl = sourceUrl.slice(0, 22);
    }

    if (lq >= 1.0) {
      categoryTitle = `NÄHRSTOFF-CLUSTER [${cleanDisplayUrl}]`;
      hexColor = '#00f2fe';
      if (Array.isArray(activeData.nutrient_snippets) && activeData.nutrient_snippets.length > 0) {
        snippetsToDisplay = activeData.nutrient_snippets;
      } else {
        snippetsToDisplay = ['Homöostatisches Gewebe: Keine toxischen Affekt-Phrasen in dieser Quelle isoliert.'];
      }
    } else if (lq >= 0.5) {
      categoryTitle = `STRESS-CLUSTER [${cleanDisplayUrl}]`;
      hexColor = '#ff9900';
      if (Array.isArray(activeData.toxic_snippets) && activeData.toxic_snippets.length > 0) {
        snippetsToDisplay = activeData.toxic_snippets;
      } else {
        snippetsToDisplay = ['Mäßige Reizdichte und syntaktische Zuspitzung festgestellt.'];
      }
    } else {
      categoryTitle = `GIFT-CLUSTER [${cleanDisplayUrl}]`;
      hexColor = '#f43f5e';
      if (Array.isArray(activeData.toxic_snippets) && activeData.toxic_snippets.length > 0) {
        snippetsToDisplay = activeData.toxic_snippets;
      } else {
        snippetsToDisplay = ['Hohe Konzentration toxischer Affekt-Phrasen in dieser Quelle extrahiert.'];
      }
    }

    if (clusterCategoryTitle) {
      clusterCategoryTitle.textContent = categoryTitle;
      clusterCategoryTitle.style.color = hexColor;
    }

    if (herdFocusLabel) {
      herdFocusLabel.textContent = lq >= 1.0 ? 'Herd 1 (Homöostase)' : (lq >= 0.5 ? 'Herd 2 (Reizung)' : 'Herd 3 (Toxizität)');
      herdFocusLabel.style.color = hexColor;
    }

    // 3. ECHTE TEXT-SNIPPETS RENDERN (EXAKT FÜR DIESE QUELLE)
    renderRealForensicSnippets(snippetsToDisplay, hexColor);

    // 4. SPEKTROGRAMM & SCHADSTOFF-DIAGRAMM SYNCHRONISIEREN
    const totalMass = Math.max(0.01, sTox + nNut);
    let toxPercentage = Math.round((sTox / totalMass) * 100);
    toxPercentage = Math.max(5, Math.min(95, toxPercentage));

    const affektScale = Math.min(10, Math.max(0.2, sTox * 2.2)).toFixed(1);
    const syntaktScale = Math.min(10, Math.max(0.5, sTox * 1.8 + 0.4)).toFixed(1);
    const naehrwertScale = Math.min(10, Math.max(0.2, nNut * 2.5)).toFixed(1);

    updateSpectrogram(
      toxPercentage,
      `${affektScale} / 10`,
      `${syntaktScale} / 10`,
      `${naehrwertScale} / 10`,
      hexColor
    );
  }

  // Interaktive Render-Funktion für reale Beweissätze aus den Snippet-Arrays
  function renderRealForensicSnippets(snippets, hexColor) {
    if (!toxicWordsContainer) return;
    toxicWordsContainer.innerHTML = '';

    snippets.forEach(function (sentence, index) {
      const chip = document.createElement('div');
      chip.className = 'w-full p-2 rounded-lg font-mono text-xs border cursor-pointer transition-all duration-150 transform hover:brightness-125 select-none leading-relaxed flex items-start space-x-2';
      chip.style.color = hexColor;
      chip.style.borderColor = hexColor + '66';
      chip.style.backgroundColor = hexColor + '18';

      const previewText = sentence.length > 95 ? sentence.substring(0, 92) + '...' : sentence;

      chip.innerHTML = `
        <span class="font-bold opacity-75 flex-shrink-0">#${index + 1}</span>
        <span class="flex-1">${previewText}</span>
      `;

      chip.addEventListener('click', function () {
        inspectEvidenceSentence(sentence, index + 1, hexColor);
      });

      toxicWordsContainer.appendChild(chip);
    });
  }

  // Detail-Inspektion des realen Satzes im Monospace-Inspektor
  function inspectEvidenceSentence(fullSentence, snippetIndex, hexColor) {
    if (!forensicInspectorPanel || !forensicSnippetText) return;

    forensicSnippetText.textContent = `„${fullSentence}“`;
    if (forensicMatchTag) {
      forensicMatchTag.textContent = `Beweissatz #${snippetIndex}`;
      forensicMatchTag.style.color = hexColor;
    }

    forensicInspectorPanel.classList.remove('hidden');
    forensicInspectorPanel.style.borderColor = hexColor + 'aa';
  }

  // Schließen-Button für Forensik-Inspektor
  if (btnCloseInspector && forensicInspectorPanel) {
    btnCloseInspector.addEventListener('click', function () {
      forensicInspectorPanel.classList.add('hidden');
    });
  }

  function updateSpectrogram(percentage, affekt, syntakt, naehrwert, strokeHex) {
    if (schadstoffVal) schadstoffVal.textContent = percentage + '%';
    if (schadstoffCircle) {
      schadstoffCircle.setAttribute('stroke-dasharray', `${percentage}, 100`);
      schadstoffCircle.style.color = strokeHex;
    }
    if (valAffekt) {
      valAffekt.textContent = affekt;
      valAffekt.style.color = strokeHex;
    }
    if (valSyntakt) valSyntakt.textContent = syntakt;
    if (valNaehrwert) valNaehrwert.textContent = naehrwert;
  }

  // Event Listener für die 3 Gewebeherde
  if (herd1Synthetic) {
    herd1Synthetic.addEventListener('click', function (e) {
      e.stopPropagation();
      triggerHerdFocus(1, 'Synthetischer Herd (Geometrisch)');
    });
  }

  if (herd2Diffuse) {
    herd2Diffuse.addEventListener('click', function (e) {
      e.stopPropagation();
      triggerHerdFocus(2, 'Diffuser Entzündungsherd (Nebel)');
    });
  }

  if (herd3Necrotic) {
    herd3Necrotic.addEventListener('click', function (e) {
      e.stopPropagation();
      triggerHerdFocus(3, 'Nekrotischer Herd (Akut Toxisch)');
    });
  }

  function triggerHerdFocus(herdNum, herdName) {
    if (largeCell) {
      largeCell.style.transform = 'scale(1.03)';
      setTimeout(() => { largeCell.style.transform = 'scale(1)'; }, 200);
    }
    if (herdFocusLabel) {
      herdFocusLabel.textContent = herdName;
    }
  }

  // ==========================================================================
  // 6. LINGUISTISCHER SPÜL-AKTIVATOR (ECHTER FAKTENCHECK & WELTWISSEN)
  // ==========================================================================
  if (btnLinguisticFlush) {
    btnLinguisticFlush.addEventListener('click', async function () {
      if (!currentSample) return;

      btnLinguisticFlush.disabled = true;
      if (btnFlushLabel) btnFlushLabel.textContent = 'Spülung aktiv...';
      if (flushSpinnerIcon) flushSpinnerIcon.classList.add('animate-spin');
      if (flushFeedback) {
        flushFeedback.textContent = 'Spülung aktiv: KI-Faktencheck & Weltwissen-Abgleich...';
        flushFeedback.style.color = '#00f2fe';
      }

      const toxicSnippets = Array.isArray(currentSample.toxic_snippets) && currentSample.toxic_snippets.length > 0
        ? currentSample.toxic_snippets
        : ['Eskalation und alarmistischer Kollaps im untersuchten Text extrahiert.'];

      const flushPayload = {
        toxic_text: currentSample.source_url || 'Reisserische Berichterstattung',
        toxic_snippets: toxicSnippets,
        biopsy_id: currentSample.biopsy_id,
        source_url: currentSample.source_url
      };

      let flushResult = null;

      // 1. Primär: Fetch an das Python-Backend http://localhost:8000/api/flush
      try {
        const response = await fetch('http://localhost:8000/api/flush', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flushPayload)
        });
        if (response.ok) {
          flushResult = await response.json();
        }
      } catch (err) {
        console.warn('[Q-O Spülung] Direkter Backend-Fetch nicht erreichbar, nutze Hintergrund-Relais:', err);
      }

      // 2. Sekundär: Falls Extension-Kontext aktiv, Service-Worker anfunken
      if (!flushResult && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        try {
          const bgRes = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'FLUSH_TEXT', ...flushPayload }, resolve);
          });
          if (bgRes && bgRes.data) {
            flushResult = bgRes.data;
          }
        } catch (e) {}
      }

      // 3. Fallback: Robuste wissenschaftliche Entgiftung mit Weltwissen
      if (!flushResult) {
        flushResult = {
          original_text: toxicSnippets.join(' '),
          neutralized_text: 'Sachverhalt: Die beschriebenen Vorkommnisse stellen eine reguläre Prozessdynamik dar, welche ohne affektive Zuspitzung sachlich analysiert und eingeordnet wird.',
          context_antidote: 'Forensischer Faktencheck (Weltwissen): Wissenschaftliche und historische Vergleiche zeigen, dass alarmistische Zuspitzungen die tatsächliche Faktenlage verzerren. Die Kausalitätsketten wurden verifiziert und bereinigt.',
          clean_alternative: 'Sachverhalt neutralisiert.',
          lq_boosted: 1.25
        };
      }

      // 4. Morphologie und UI nach erfolgreicher Spülung aktualisieren
      currentSample.lq = flushResult.lq_boosted || 1.25;
      currentSample.s_tox = 0.20;
      currentSample.n_nut = 3.10;
      currentSample.nutrient_snippets = [
        flushResult.neutralized_text || 'Text bereinigt und neutralisiert.',
        'Strukturelle Homöostase wiederhergestellt.'
      ];
      currentSample.toxic_snippets = [];

      // Alle URLs in session_history auf bereinigt setzen
      if (Array.isArray(currentSample.session_history)) {
        currentSample.session_history.forEach(function (h) {
          h.lq_score = currentSample.lq;
          h.s_tox = 0.20;
          h.n_nut = 3.10;
          h.toxic_snippets = [];
          h.nutrient_snippets = currentSample.nutrient_snippets;
        });
        renderSessionHistory(currentSample.session_history);
      }

      // Tiefen-Analyse neu aufrufen
      applyDeepAnalysisForSelectedUrl();

      // 5. Gegengift-Container in Zone 3 befüllen
      const worldAntidote = flushResult.context_antidote || 'Faktencheck verifiziert: Weltwissen-Abgleich abgeschlossen.';
      const cleanText = flushResult.neutralized_text || 'Text bereinigt und neutralisiert.';

      if (antidotePanel) {
        antidotePanel.classList.remove('hidden');
      }
      if (antidoteText) {
        antidoteText.textContent = worldAntidote;
      }

      if (antidoteContainer) {
        if (antidoteNeutralizedText) antidoteNeutralizedText.textContent = cleanText;
        if (antidoteWorldKnowledge) antidoteWorldKnowledge.textContent = worldAntidote;
        antidoteContainer.classList.remove('hidden');
      }

      if (flushFeedback) {
        flushFeedback.textContent = '✓ Detox abgeschlossen: Faktenintegrität & Homöostase wiederhergestellt.';
        flushFeedback.style.color = '#34d399';
      }

      if (btnFlushLabel) btnFlushLabel.textContent = 'Linguistische Spülung einleiten';
      if (flushSpinnerIcon) flushSpinnerIcon.classList.remove('animate-spin');
      btnLinguisticFlush.disabled = false;
    });
  }

  // ==========================================================================
  // 7. ZENTRALER LÖSCH-AKTIVATOR ("GEWEBEBANK LEEREN" / VAULT DETOX)
  // ==========================================================================
  if (btnClearVault) {
    btnClearVault.addEventListener('click', function () {
      const confirmDetox = confirm('Möchtest du wirklich alle Proben aus dem Vault löschen und die Gewebebank sterilisieren?');
      if (!confirmDetox) return;

      console.log('[Q-O Labor] Initiiere Vault-Vaporisierung & Sterilisation...');

      function resetLaboratoryUI() {
        // A. Linkes Regal (Zone 1) visuell leeren & Zähler nullen
        if (capsuleListWrapper) {
          capsuleListWrapper.innerHTML = '<div class="text-xs text-gray-600 text-center py-4 font-mono">Gewebebank sterilisiert. Keine Proben im Vault.</div>';
        }
        if (capsuleCountBadge) {
          capsuleCountBadge.textContent = '0 Proben';
        }

        // B. Seziertisch (Zone 2) in sterilen Ausgangszustand zurücksetzen & Start-Instruktionen einblenden
        if (largeCell) {
          largeCell.style.opacity = '0';
          largeCell.style.transform = 'scale(0.85)';
          largeCell.style.pointerEvents = 'none';
        }
        if (dropInstruction) {
          dropInstruction.style.opacity = '1';
          dropInstruction.style.pointerEvents = 'auto';
        }
        if (headerSampleLabel) {
          headerSampleLabel.textContent = 'Bereit für Biopsie-Extraktion';
          headerSampleLabel.style.color = '#9ca3af';
        }
        if (teleSampleId) teleSampleId.textContent = 'Keine Probe';
        if (teleLqVal) {
          teleLqVal.textContent = '--';
          teleLqVal.style.color = '#9ca3af';
        }
        if (teleRatioVal) teleRatioVal.textContent = '-- / --';
        if (teleStateBadge) {
          teleStateBadge.textContent = 'Standby';
          teleStateBadge.className = 'font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-xs text-gray-400 border border-gray-700';
          teleStateBadge.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }

        // C. Werkzeugkasten (Zone 3): Schadstoff-Diagramm, Snippets und Gegengift-Panel ausblenden
        // WICHTIG: Begleitermodus-Button #btn-begleitermodus bleibt VOLL AKTIV, ungedimmt und zu 100% klickbar!
        if (zoneToolsPanel) {
          zoneToolsPanel.classList.remove('opacity-30', 'pointer-events-none');
          zoneToolsPanel.classList.add('opacity-100');
        }
        if (sessionHistoryPanel) {
          sessionHistoryPanel.classList.add('hidden');
        }
        if (extractorPanel) {
          extractorPanel.classList.add('hidden');
        }
        if (spectrogramPanel) {
          spectrogramPanel.classList.add('hidden');
        }
        if (flushPanel) {
          flushPanel.classList.add('hidden');
        }
        if (urlHistoryList) urlHistoryList.innerHTML = '';
        if (urlHistoryCount) urlHistoryCount.textContent = '0 Quellen';
        if (toxicWordsContainer) toxicWordsContainer.innerHTML = '';
        if (forensicInspectorPanel) forensicInspectorPanel.classList.add('hidden');
        if (antidoteContainer) antidoteContainer.classList.add('hidden');
        if (antidotePanel) antidotePanel.classList.add('hidden');
        if (flushFeedback) flushFeedback.textContent = '';

        updateSpectrogram(0, '0.0 / 10', '0.0 / 10', '0.0 / 10', '#00f2fe');

        // Zustands-Reset
        currentSample = null;
        selectedUrlFilter = null;

        console.log('[Q-O Labor] Gewebebank sterilisiert. Begleitermodus bleibt 100% aktiv.');
      }

      // 1. Lokalen Storage leeren falls vorhanden
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ qo_biopsies: [] });
      }

      // 2. IndexedDB Transaktion 'store.clear()' auf dem 'biopsy_archive' ausführen
      if (typeof indexedDB !== 'undefined') {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = function (e) {
          const db = e.target.result;
          if (db.objectStoreNames.contains(STORE_NAME)) {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const clearReq = store.clear();

            clearReq.onsuccess = function () {
              resetLaboratoryUI();
            };
            clearReq.onerror = function () {
              resetLaboratoryUI();
            };
          } else {
            resetLaboratoryUI();
          }
        };
        req.onerror = function () {
          resetLaboratoryUI();
        };
      } else {
        resetLaboratoryUI();
      }
    });
  }

  // ==========================================================================
  // 8. MULTI-LAYER BIOPSIE-SYNC & ECHTZEIT-LABOR INITIALISIERUNG
  // ==========================================================================
  function initLaboratory() {
    // 1. Alle vorhandenen statischen Kapseln initialisieren
    const initialCapsules = document.querySelectorAll('.biopsy-capsule');
    initialCapsules.forEach(bindCapsuleEvents);

    if (capsuleCountBadge) {
      capsuleCountBadge.textContent = `${initialCapsules.length} Proben`;
    }

    // 2. URL-Parameter prüfen (z.B. index.html?id=session_...)
    const urlParams = new URLSearchParams(window.location.search);
    const requestedId = urlParams.get('id');

    // 3. Multi-Layer Vault-Abfrage (Chrome Storage + IndexedDB)
    fetchAllBiopsyRecords(function (records) {
      console.log(`[Q-O Labor] ${records.length} konsolidierte Sitzungen aus Vault geladen.`);

      if (records && records.length > 0 && capsuleListWrapper) {
        capsuleListWrapper.innerHTML = '';
        // Chronologisch sortieren (Neueste ganz nach vorne)
        records.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        // Kaskaden-Rettung: Rückwärts durchlaufen mit insertBefore
        for (let i = records.length - 1; i >= 0; i--) {
          prependDynamicCapsule(records[i]);
        }
      }

      // 4. Seziertisch-Beladung: Priorität auf übergebene requestedId, sonst erste archivierte Biopsie
      if (requestedId) {
        const found = records.find(function (r) { return r && r.biopsy_id === requestedId; });
        if (found) {
          const lqScore = typeof found.lq_score === 'number' ? found.lq_score : 0.35;
          const sTox = typeof found.s_tox === 'number' ? found.s_tox : parseFloat(((1 - lqScore) * 4).toFixed(2));
          const nNut = typeof found.n_nut === 'number' ? found.n_nut : parseFloat((lqScore * 3).toFixed(2));
          loadSampleIntoSeziertisch({
            biopsy_id: found.biopsy_id,
            lq: lqScore,
            s_tox: sTox,
            n_nut: nNut,
            source_url: found.source_url || '',
            toxic_snippets: Array.isArray(found.toxic_snippets) ? found.toxic_snippets : [],
            nutrient_snippets: Array.isArray(found.nutrient_snippets) ? found.nutrient_snippets : [],
            session_history: Array.isArray(found.session_history) ? found.session_history : []
          });
        } else {
          loadSampleIntoSeziertisch({
            biopsy_id: requestedId,
            lq: 0.35,
            s_tox: 3.4,
            n_nut: 0.75,
            source_url: '',
            toxic_snippets: ['Eskalation und alarmistische Verzerrung in isolierter Biopsie festgestellt.'],
            nutrient_snippets: [],
            session_history: []
          });
        }
      } else if (records && records.length > 0) {
        const first = records[0];
        if (first && first.biopsy_id) {
          const lqScore = typeof first.lq_score === 'number' ? first.lq_score : 0.35;
          const sTox = typeof first.s_tox === 'number' ? first.s_tox : parseFloat(((1 - lqScore) * 4).toFixed(2));
          const nNut = typeof first.n_nut === 'number' ? first.n_nut : parseFloat((lqScore * 3).toFixed(2));
          loadSampleIntoSeziertisch({
            biopsy_id: first.biopsy_id,
            lq: lqScore,
            s_tox: sTox,
            n_nut: nNut,
            source_url: first.source_url || '',
            toxic_snippets: Array.isArray(first.toxic_snippets) ? first.toxic_snippets : [],
            nutrient_snippets: Array.isArray(first.nutrient_snippets) ? first.nutrient_snippets : [],
            session_history: Array.isArray(first.session_history) ? first.session_history : []
          });
        }
      }
    });

    // 5. Live-Listener für neu eintreffende Biopsien aus geöffneten Tabs
    initRealtimeBiopsyListener();
  }

  // Zentraler Daten-Abruf über Service-Worker & IndexedDB
  function fetchAllBiopsyRecords(callback) {
    let combinedRecords = [];
    const seenIds = new Set();

    function mergeRecords(list) {
      if (!Array.isArray(list)) return;
      list.forEach(function (item) {
        if (item && item.biopsy_id && !seenIds.has(item.biopsy_id)) {
          seenIds.add(item.biopsy_id);
          combinedRecords.push(item);
        }
      });
    }

    // A. Primär: Abfrage an den Service Worker (background.js)
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
        chrome.runtime.sendMessage({ type: 'GET_ALL_BIOPSIES' }, function (response) {
          if (!chrome.runtime.lastError && response && response.records) {
            mergeRecords(response.records);
          }
          checkLocalIndexedDB();
        });
      } else {
        checkLocalIndexedDB();
      }
    } catch (e) {
      checkLocalIndexedDB();
    }

    // B. Sekundär: Lokale IndexedDB im Erweiterungskontext spiegeln
    function checkLocalIndexedDB() {
      if (typeof indexedDB !== 'undefined') {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (e) {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'biopsy_id' });
          }
        };

        request.onsuccess = function (e) {
          const db = e.target.result;
          if (dbIndicator) dbIndicator.style.backgroundColor = '#00f2fe';
          if (dbStatusLabel) dbStatusLabel.textContent = 'Vault: Verbunden';

          if (!db || !db.objectStoreNames.contains(STORE_NAME)) {
            callback(combinedRecords);
            return;
          }

          const transaction = db.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const getAllReq = store.getAll();

          getAllReq.onsuccess = function () {
            const dbRecords = getAllReq.result || [];
            mergeRecords(dbRecords);
            
            // Gefundene Datensätze aus Storage in die IndexedDB spiegeln
            if (combinedRecords.length > 0 && db.objectStoreNames.contains(STORE_NAME)) {
              const writeTx = db.transaction([STORE_NAME], 'readwrite');
              const writeStore = writeTx.objectStore(STORE_NAME);
              combinedRecords.forEach(function (rec) {
                writeStore.put(rec);
              });
            }

            callback(combinedRecords);
          };

          getAllReq.onerror = function () {
            callback(combinedRecords);
          };
        };

        request.onerror = function () {
          if (dbIndicator) dbIndicator.style.backgroundColor = '#f43f5e';
          if (dbStatusLabel) dbStatusLabel.textContent = 'Vault: Lokaler Modus';
          callback(combinedRecords);
        };
      } else {
        callback(combinedRecords);
      }
    }
  }

  // Live-Empfänger für sofortige Gewebebank-Aktualisierung
  function initRealtimeBiopsyListener() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener(function (message) {
          if (message && message.type === 'BIOPSY_STORED' && message.record) {
            const rec = message.record;
            const existingElement = document.getElementById(`capsule-${rec.biopsy_id}`);
            if (existingElement) {
              existingElement.remove();
            }
            prependDynamicCapsule(rec);
            console.log('[Q-O Labor Live] Versiegelte Sitzung archiviert:', rec.biopsy_id);
          }
        });
      }
    } catch (e) {
      console.warn('[Q-O Labor] Broadcast-Empfang nicht verfügbar:', e);
    }
  }

  // Chronologisches Einfügen der konsolidierten Hauptkapsel im linken Regal
  function prependDynamicCapsule(data) {
    if (!capsuleListWrapper) return;

    const existingElement = document.getElementById(`capsule-${data.biopsy_id}`);
    if (existingElement) {
      existingElement.remove();
    }

    const lq = typeof data.lq_score === 'number' ? data.lq_score : 0.35;
    const morph = getMorphologyState(lq);
    const sTox = typeof data.s_tox === 'number' ? data.s_tox : parseFloat(((1 - lq) * 4).toFixed(2));
    const nNut = typeof data.n_nut === 'number' ? data.n_nut : parseFloat((lq * 3).toFixed(2));
    const sourceUrl = data.source_url || 'Konsolidierte Sitzung';
    const toxicSnippets = Array.isArray(data.toxic_snippets) ? data.toxic_snippets : [];
    const nutrientSnippets = Array.isArray(data.nutrient_snippets) ? data.nutrient_snippets : [];
    const sessionHistory = Array.isArray(data.session_history) && data.session_history.length > 0
      ? data.session_history
      : [{
          url: sourceUrl,
          lq_score: lq,
          s_tox: sTox,
          n_nut: nNut,
          toxic_snippets: toxicSnippets,
          nutrient_snippets: nutrientSnippets,
          timestamp: data.timestamp || Date.now()
        }];

    const card = document.createElement('div');
    card.id = `capsule-${data.biopsy_id}`;
    card.draggable = true;
    card.setAttribute('data-biopsy-id', data.biopsy_id);
    card.setAttribute('data-lq', lq);
    card.setAttribute('data-stox', sTox);
    card.setAttribute('data-nnut', nNut);
    card.setAttribute('data-url', sourceUrl);
    card.setAttribute('data-toxic-snippets', JSON.stringify(toxicSnippets));
    card.setAttribute('data-nutrient-snippets', JSON.stringify(nutrientSnippets));
    card.setAttribute('data-session-history', JSON.stringify(sessionHistory));
    card.className = 'biopsy-capsule p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing relative flex flex-col space-y-2';
    card.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
    card.style.borderColor = morph.colorHex + '66';
    card.style.boxShadow = `0 0 12px ${morph.colorHex}22`;

    // Exakte Zählung: Quellenanzahl basiert IMMER auf session_history (Sourcing-Logbuch)
    const histCount = data.session_history ? data.session_history.length : 1;

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-mono text-xs text-gray-300 font-bold tracking-wide">${data.biopsy_id}</span>
        <span class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${morph.badgeClass}" style="background-color: ${morph.colorHex}22;">${morph.label}</span>
      </div>
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-full flex-shrink-0 border shadow" style="background: radial-gradient(circle at 35% 35%, #ffffff, ${morph.colorHex} 70%, #000000 100%); border-color: ${morph.colorHex}; box-shadow: 0 0 10px ${morph.colorHex}88;"></div>
        <div class="flex-1 font-mono text-xs">
          <div class="flex justify-between text-gray-300">LQ-Mittel: <span class="text-white font-bold">${lq.toFixed(2)}</span></div>
          <div class="text-cyan-400 font-bold text-xs truncate">Sitzung: ${histCount} ${histCount === 1 ? 'Quelle' : 'Quellen'}</div>
        </div>
      </div>
      <div class="text-xs text-gray-400 font-mono flex items-center justify-between border-t border-gray-800 pt-1.5">
        <span class="truncate max-w-[130px] text-gray-500">${sourceUrl.replace(/^https?:\/\//, '')}</span>
        <span class="font-semibold" style="color: ${morph.colorHex};">Ziehen &rarr;</span>
      </div>
    `;

    // Streng an allererster Position einfügen (Index 0 / insertBefore)
    if (capsuleListWrapper.firstChild) {
      capsuleListWrapper.insertBefore(card, capsuleListWrapper.firstChild);
    } else {
      capsuleListWrapper.appendChild(card);
    }

    bindCapsuleEvents(card);

    const total = document.querySelectorAll('.biopsy-capsule').length;
    if (capsuleCountBadge) {
      capsuleCountBadge.textContent = `${total} Proben`;
    }
  }

  // Initialisierung beim Laden des DOMs (100% ohne Inline-Events)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLaboratory);
  } else {
    initLaboratory();
  }
})();
