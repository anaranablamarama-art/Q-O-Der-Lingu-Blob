/**
 * ============================================================================
 * Q-O LABOR // SYMMETRISCHES 2-BOXEN-TAB-SYSTEM & FORENSIK-STEUERUNG (INDEX.JS)
 * ============================================================================
 * 
 * STRATEGISCHE TRENNUNG:
 * - ZONE 2 (MITTE): Fester Reaktor / Petrischale für die GESAMTE Biopsie
 *   (Wird beim Kapsel-Drop/Laden einmalig steril eingefärbt & bleibt eingefroren)
 * - ZONE 3 (RECHTS): Symmetrisches 2-Boxen-System mit Tab-Reitern ([STRUKTUR] / [ZITATE])
 *   (Mutiert beim Klick auf eine URL NUR das Status-Dach & die 2 Anzeige-Listen)
 * 
 * SYMMETRISCHES 2-BOXEN-TAB-SYSTEM:
 * 1. #toxic-main-vault (#tab-toxic-macro, #tab-toxic-micro, #toxic-display-list)
 * 2. #nutrient-main-vault (#tab-nutrient-macro, #tab-nutrient-micro, #nutrient-display-list)
 * 
 * ISOLIERTER FLUSH (#btn-linguistic-flush):
 * - Greift sich schreibgeschützt die echten Zitate aus sourceItem.toxic_snippets ab
 * - PERSISTENZ: Multi-Layer (IndexedDB 'QO_Metabolic_Vault' & LocalStorage)
 */

(function () {
  'use strict';

  // ==========================================================================
  // DOM-ELEMENTE
  // ==========================================================================
  // Zone 1: Gewebebank
  const capsuleListWrapper = document.getElementById('capsule-list-wrapper');
  const capsuleCountBadge = document.getElementById('capsule-count-badge');
  const btnClearVault = document.getElementById('btn-clear-vault');

  // Zone 2: Seziertisch & Petrischale (Das Reaktor-Denkmal der Biopsie)
  const cryoHolder = document.getElementById('cryo-holder');
  const dropInstruction = document.getElementById('drop-instruction');
  const largeCell = document.getElementById('large-cell');
  const reactorBlobCore = document.getElementById('reactor-blob-core') || 
                          document.querySelector('.large-membrane') || 
                          largeCell;
  const reactorScoreDisplay = document.getElementById('reactor-score-display') || 
                              document.getElementById('tele-lq-val');
  const teleSampleId = document.getElementById('tele-sample-id');
  const teleLqVal = document.getElementById('tele-lq-val');
  const teleRatioVal = document.getElementById('tele-ratio-val');
  const teleStateBadge = document.getElementById('tele-state-badge');
  const headerSampleLabel = document.getElementById('header-sample-label');

  // Herde im Zytoplasma
  const herd1Synthetic = document.getElementById('herd-1-synthetic');
  const herd2Diffuse = document.getElementById('herd-2-diffuse');
  const herd3Necrotic = document.getElementById('herd-3-necrotic');

  // Zone 3: Puristische Forensik & Quellen-Umschalter
  const btnBegleitermodus = document.getElementById('btn-begleitermodus');
  const sessionHistoryPanel = document.getElementById('session-history-panel');
  const toolsStatusTitle = document.getElementById('tools-status-title');
  const toolsStatusBadge = document.getElementById('tools-status-badge');
  const urlHistoryList = document.getElementById('url-history-list');
  const urlHistoryCount = document.getElementById('url-history-count');

  // SYMMETRISCHES 2-BOXEN-TAB-SYSTEM
  // 1. Schadstoff-Gefäß
  const tabToxicMacro = document.getElementById('tab-toxic-macro');
  const tabToxicMicro = document.getElementById('tab-toxic-micro');
  const toxicDisplayList = document.getElementById('toxic-display-list');
  const microToxicBadge = document.getElementById('micro-toxic-badge');

  // 2. Nährstoff-Gefäß
  const tabNutrientMacro = document.getElementById('tab-nutrient-macro');
  const tabNutrientMicro = document.getElementById('tab-nutrient-micro');
  const nutrientDisplayList = document.getElementById('nutrient-display-list');
  const microNutrientBadge = document.getElementById('micro-nutrient-badge');

  // Spül-Kanal
  const btnLinguisticFlush = document.getElementById('btn-linguistic-flush');
  const btnFlushLabel = document.getElementById('btn-flush-label');
  const flushSpinnerIcon = document.getElementById('flush-spinner-icon');
  const flushFeedback = document.getElementById('flush-feedback');
  const antidotePanel = document.getElementById('antidote-panel');
  const antidoteTextNeutral = document.getElementById('antidote-text-neutral');

  // Aktiver Sitzungs-Zustand & aktiver URL-Filter & Aktive Tabs ('macro' | 'micro')
  let currentSample = null;
  let selectedUrlFilter = null;
  let activeSourceData = null;
  let currentToxicTab = 'macro';      // Standard: 'macro' (STRUKTUR)
  let currentNutrientTab = 'macro';   // Standard: 'macro' (STRUKTUR)

  // ==========================================================================
  // SICHERE NUMERISCHE EXTRAKTION
  // ==========================================================================
  function safeNum(val, fallback = 0) {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) return parsed;
    }
    return fallback;
  }

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
  // 2. MORPHOLOGISCHE ZUSTANDSMASCHINE (LQ-DEFINITION)
  // ==========================================================================
  function getMorphologyState(lq) {
    if (lq >= 1.0) {
      return {
        key: 'stable',
        className: 'q-o-hud-stable',
        label: 'Gesund / Stabil',
        colorHex: '#00f2fe',
        badgeClass: 'text-cyan-400 border-cyan-400 bg-cyan-950/60'
      };
    } else if (lq >= 0.5) {
      return {
        key: 'deformed',
        className: 'q-o-hud-deformed',
        label: 'Deformiert / Erregt',
        colorHex: '#ff9900',
        badgeClass: 'text-amber-400 border-amber-500 bg-amber-950/60'
      };
    } else {
      return {
        key: 'toxic',
        className: 'q-o-hud-toxic',
        label: 'Toxisch / Entzündet',
        colorHex: '#e11d48',
        badgeClass: 'text-rose-400 border-rose-500 bg-rose-950/60'
      };
    }
  }

  // ==========================================================================
  // 3. STERILE REINIGUNG & EINMALIGE REAKTOR-FARBGEBUNG (NUR ZONE 2 MITTE)
  // ==========================================================================
  function applySterileReactorColoring(data) {
    if (!data) return;

    const lqScore = safeNum(data.lq_score ?? data.lq, 1.0);
    const morph = getMorphologyState(lqScore);
    const blobCore = document.getElementById('reactor-blob-core') || 
                     document.querySelector('.large-membrane') || 
                     largeCell;
    const scoreDisplay = document.getElementById('reactor-score-display') || 
                         teleLqVal;

    // 1. STERILE REINIGUNG: Alle alten Farb- und Morphologie-Klassen restlos entfernen
    if (blobCore) {
      blobCore.classList.remove(
        'border-rose-500/30', 'bg-rose-950/10', 'text-rose-400',
        'border-amber-500/30', 'bg-amber-950/10', 'text-amber-400',
        'border-cyan-500/20', 'bg-cyan-950/10', 'text-cyan-400',
        'q-o-hud-stable', 'q-o-hud-deformed', 'q-o-hud-toxic'
      );

      // 2. NEU-EINFÄRBUNG: Exakt synchron zum Gesamt-LQ der Biopsie einrasten
      if (lqScore < 0.5) {
        blobCore.classList.add('border-rose-500/30', 'bg-rose-950/10', 'text-rose-400', 'q-o-hud-toxic');
        blobCore.style.boxShadow = '0 0 50px rgba(244, 63, 94, 0.2)';
      } else if (lqScore < 1.0) {
        blobCore.classList.add('border-amber-500/30', 'bg-amber-950/10', 'text-amber-400', 'q-o-hud-deformed');
        blobCore.style.boxShadow = '0 0 50px rgba(255, 153, 0, 0.2)';
      } else {
        blobCore.classList.add('border-cyan-500/20', 'bg-cyan-950/10', 'text-cyan-400', 'q-o-hud-stable');
        blobCore.style.boxShadow = '0 0 50px rgba(0, 242, 254, 0.2)';
      }
    }

    if (largeCell) {
      largeCell.className = 'relative flex items-center justify-center transition-all duration-700 opacity-100 transform scale-100 ' + morph.className;
    }

    if (scoreDisplay) {
      scoreDisplay.className = 'font-bold text-sm font-mono';
      scoreDisplay.style.color = morph.colorHex;
    }
  }

  // ==========================================================================
  // 4. HTML5 DRAG & DROP LOGIK FÜR DEN SEZIERTISCH (ZONE 1 -> ZONE 2)
  // ==========================================================================
  function setupDragAndDrop() {
    if (!cryoHolder) return;

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
          // Einmaliges steriles Einstellen des Reaktor-Blobs auf den Gesamt-Score der Kapsel
          applySterileReactorColoring(data);
          loadSampleIntoSeziertisch(data);
        }
      } catch (err) {
        console.error('[Q-O Labor] Drop-Fehler:', err);
      }
    });
  }

  function bindCapsuleEvents(capsule) {
    function extractPayload() {
      const rawLq = parseFloat(capsule.getAttribute('data-lq'));
      const rawStox = parseFloat(capsule.getAttribute('data-stox'));
      const rawNnut = parseFloat(capsule.getAttribute('data-nnut'));

      let toxicSnippets = [];
      let nutrientSnippets = [];
      let macroToxCategories = [];
      let macroNutCategories = [];
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
        const rawMacroTox = capsule.getAttribute('data-macro-tox-categories');
        if (rawMacroTox) macroToxCategories = JSON.parse(rawMacroTox);
      } catch (e) {
        macroToxCategories = [];
      }
      try {
        const rawMacroNut = capsule.getAttribute('data-macro-nut-categories');
        if (rawMacroNut) macroNutCategories = JSON.parse(rawMacroNut);
      } catch (e) {
        macroNutCategories = [];
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
          macro_tox_categories: macroToxCategories,
          macro_nut_categories: macroNutCategories,
          timestamp: Date.now()
        }];
      }

      return {
        biopsy_id: capsule.getAttribute('data-biopsy-id') || 'bio_sample',
        lq: finalLq,
        lq_score: finalLq,
        s_tox: finalStox,
        n_nut: finalNnut,
        source_url: srcUrl,
        toxic_snippets: Array.isArray(toxicSnippets) ? toxicSnippets : [],
        nutrient_snippets: Array.isArray(nutrientSnippets) ? nutrientSnippets : [],
        macro_tox_categories: Array.isArray(macroToxCategories) ? macroToxCategories : [],
        macro_nut_categories: Array.isArray(macroNutCategories) ? macroNutCategories : [],
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

    // Direkter Klick auf Kapsel in der Gewebebank
    capsule.addEventListener('click', function () {
      const payload = extractPayload();
      applySterileReactorColoring(payload);
      loadSampleIntoSeziertisch(payload);
    });
  }

  // ==========================================================================
  // 5. SEZIERTISCH-LADEN: INITIALISIERT DEN GESAMT-BIOPSIE-ZUSTAND
  // ==========================================================================
  function loadSampleIntoSeziertisch(sample) {
    if (!sample) return;
    currentSample = sample;
    selectedUrlFilter = null;

    // 1. Visueller Aufbau der Makro-Zelle im Seziertisch
    if (dropInstruction) {
      dropInstruction.style.opacity = '0';
      dropInstruction.style.pointerEvents = 'none';
    }

    if (largeCell) {
      largeCell.style.opacity = '1';
      largeCell.style.pointerEvents = 'auto';
      largeCell.style.transform = 'scale(1)';
    }

    // 2. Gesamt-Score der Biopsie für den Reaktor
    const sampleLq = safeNum(sample.lq_score ?? sample.lq, 1.0);
    const sampleStox = safeNum(sample.s_tox ?? sample.stox, 0.5);
    const sampleNnut = safeNum(sample.n_nut ?? sample.nnut, 1.5);
    const overallMorph = getMorphologyState(sampleLq);

    // Einmalige sterile Einfärbung des Reaktor-Blobs
    applySterileReactorColoring(sample);

    // 3. Header & Feste Reaktor-Telemetrie am Seziertisch unten
    if (headerSampleLabel) {
      headerSampleLabel.textContent = `${sample.biopsy_id} (${sample.source_url || 'Sitzung'})`;
      headerSampleLabel.style.color = overallMorph.colorHex;
    }
    if (teleSampleId) {
      teleSampleId.textContent = sample.biopsy_id;
    }
    if (teleLqVal) {
      teleLqVal.textContent = sampleLq.toFixed(2);
      teleLqVal.style.color = overallMorph.colorHex;
    }
    if (teleRatioVal) {
      teleRatioVal.textContent = `${sampleStox.toFixed(2)} / ${sampleNnut.toFixed(2)}`;
    }
    if (teleStateBadge) {
      teleStateBadge.textContent = overallMorph.label;
      teleStateBadge.className = 'font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-xs border ' + overallMorph.badgeClass;
    }

    // 4. Antidote-Panel schließen & Feedback leeren
    if (antidotePanel) antidotePanel.classList.add('hidden');
    if (flushFeedback) flushFeedback.textContent = '';

    // 5. Sourcing-Logbuch aufbauen & ERST-FOKUS auf den ersten Tab setzen
    const historyList = Array.isArray(sample.session_history) && sample.session_history.length > 0
      ? sample.session_history
      : [{
          url: sample.source_url || 'https://journal-nature.org/cell-study-2026',
          lq_score: sampleLq,
          s_tox: sampleStox,
          n_nut: sampleNnut,
          toxic_snippets: Array.isArray(sample.toxic_snippets) ? sample.toxic_snippets : [],
          nutrient_snippets: Array.isArray(sample.nutrient_snippets) ? sample.nutrient_snippets : [],
          macro_tox_categories: Array.isArray(sample.macro_tox_categories) ? sample.macro_tox_categories : (sample.macro_reasons || []),
          macro_nut_categories: Array.isArray(sample.macro_nut_categories) ? sample.macro_nut_categories : [],
          timestamp: sample.timestamp || Date.now()
        }];

    renderSessionHistory(historyList);

    // Automatischer Erst-Fokus auf den ersten Tab (steuert NUR Zone 3 rechts an)
    if (historyList.length > 0) {
      selectSpecificSourceData(historyList[0]);
    }
  }

  // ==========================================================================
  // 6. SOURCING-LOGBUCH RENDERN (ZONE 3)
  // ==========================================================================
  function renderSessionHistory(historyList) {
    if (!urlHistoryList) return;
    urlHistoryList.innerHTML = '';

    if (urlHistoryCount) {
      urlHistoryCount.textContent = `${historyList.length} ${historyList.length === 1 ? 'Quelle' : 'Quellen'}`;
    }

    historyList.forEach(function (entry, index) {
      const urlStr = entry.url || 'Unbekannte Quelle';
      const entryLq = safeNum(entry.lq_score ?? entry.lq, 1.0);
      const morph = getMorphologyState(entryLq);

      let cleanHostname = urlStr;
      try {
        const u = new URL(urlStr);
        cleanHostname = u.hostname + (u.pathname.length > 1 ? u.pathname.slice(0, 16) + '...' : '');
      } catch (e) {
        cleanHostname = urlStr.slice(0, 22) + '...';
      }

      const isSelected = selectedUrlFilter === urlStr || (!selectedUrlFilter && index === 0);

      const item = document.createElement('div');
      item.className = `p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs font-mono ${
        isSelected
          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-md'
          : 'border-gray-800 bg-gray-900/40 hover:bg-gray-800 text-gray-400 hover:text-white'
      }`;

      item.innerHTML = `
        <div class="flex items-center space-x-2 truncate mr-2">
          <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background-color: ${morph.colorHex};"></span>
          <span class="truncate" title="${urlStr}">${cleanHostname}</span>
        </div>
        <div class="flex items-center space-x-1 flex-shrink-0">
          <span class="text-[10px] font-bold" style="color: ${morph.colorHex};">LQ ${entryLq.toFixed(2)}</span>
          <span class="text-gray-500 text-[10px]">${isSelected ? '●' : '○'}</span>
        </div>
      `;

      item.addEventListener('click', function () {
        selectSpecificSourceData(entry);
      });

      urlHistoryList.appendChild(item);
    });
  }

  // ==========================================================================
  // 7. STRATEGISCHE QUELLENAUSWAHL MIT SYMMETRISCHEM 2-BOXEN-TAB-SYSTEM
  // ==========================================================================
  // WICHTIG: Hier wird KEINESFALLS blobCore, scoreDisplay oder largeCell
  // (Zone 2 Mitte) modifiziert! Die Petrischale bleibt unberührt eingefroren!
  function selectSpecificSourceData(sourceEntry) {
    if (!sourceEntry) return;

    const urlStr = typeof sourceEntry === 'string' ? sourceEntry : sourceEntry.url;
    selectedUrlFilter = urlStr;

    // Quelleneintrag auflösen
    let entryData = typeof sourceEntry === 'object' ? sourceEntry : null;
    if (!entryData && currentSample && Array.isArray(currentSample.session_history)) {
      entryData = currentSample.session_history.find((item) => item.url === urlStr);
    }
    if (!entryData) {
      entryData = currentSample || {
        lq_score: 1.0,
        s_tox: 0.5,
        n_nut: 1.5,
        toxic_snippets: [],
        nutrient_snippets: [],
        macro_tox_categories: [],
        macro_nut_categories: []
      };
    }

    activeSourceData = entryData;

    // 1. ABSOLUTE VARIABLEN-SICHERUNG (Exakte Kopplung an Python-Datenströme mit Fallbacks)
    const macrosTox = Array.isArray(entryData.macro_tox_categories) 
      ? entryData.macro_tox_categories 
      : (Array.isArray(entryData.macro_reasons) ? entryData.macro_reasons : []);
    const snippetsTox = Array.isArray(entryData.toxic_snippets) ? entryData.toxic_snippets : [];
    const macrosNut = Array.isArray(entryData.macro_nut_categories) ? entryData.macro_nut_categories : [];
    const snippetsNut = Array.isArray(entryData.nutrient_snippets) ? entryData.nutrient_snippets : [];

    const tabLq = safeNum(entryData.lq_score ?? entryData.lq, 1.0);
    const tabMorph = getMorphologyState(tabLq);

    // 2. STATUS-DACH GANZ RECHTS ANSTEUERN (#tools-status-badge & #tools-status-title)
    if (toolsStatusBadge) {
      toolsStatusBadge.textContent = `Tab LQ: ${tabLq.toFixed(2)}`;
      toolsStatusBadge.className = 'text-[10px] px-2 py-0.5 rounded-full font-bold font-mono border transition-all ' + tabMorph.badgeClass;
      toolsStatusBadge.style.color = tabMorph.colorHex;
    }

    if (toolsStatusTitle) {
      toolsStatusTitle.style.color = tabMorph.colorHex;
    }

    // 3. BADGES MIT DER GESAMTSUMME AKTUALISIEREN
    if (microToxicBadge) {
      microToxicBadge.textContent = (macrosTox.length + snippetsTox.length).toString();
    }
    if (microNutrientBadge) {
      microNutrientBadge.textContent = (macrosNut.length + snippetsNut.length).toString();
    }

    // 4. Sourcing-Logbuch Markierung synchronisieren
    if (currentSample && Array.isArray(currentSample.session_history)) {
      renderSessionHistory(currentSample.session_history);
    }

    // 5. SITZUNGS-DEFAULT & AUTOMATISCHER REFLOW:
    // Jedes Mal, wenn eine neue URL angeklickt wird, beide Boxen standardmäßig auf STRUKTUR ('macro')
    // zurücksetzen und aktiv die Tabs simulieren!
    currentToxicTab = 'macro';
    currentNutrientTab = 'macro';

    // 6. Anzeige für beide Haupt-Gefäße aktualisieren
    renderToxicBox();
    renderNutrientBox();
  }

  // ==========================================================================
  // 7.1 RENDERN DES SCHADSTOFF-GEFÄSSES (BOX 1: #toxic-display-list)
  // ==========================================================================
  function renderToxicBox() {
    if (!tabToxicMacro || !tabToxicMicro || !toxicDisplayList) return;

    const entryData = activeSourceData || currentSample || {};
    const macrosTox = Array.isArray(entryData.macro_tox_categories) 
      ? entryData.macro_tox_categories 
      : (Array.isArray(entryData.macro_reasons) ? entryData.macro_reasons : []);
    const snippetsTox = Array.isArray(entryData.toxic_snippets) ? entryData.toxic_snippets : [];

    // Badge synchron halten
    if (microToxicBadge) {
      microToxicBadge.textContent = (macrosTox.length + snippetsTox.length).toString();
    }

    // Tab-Styling umschalten
    if (currentToxicTab === 'macro') {
      tabToxicMacro.className = 'cursor-pointer font-bold transition-all text-purple-400 border-b border-purple-500/40 pb-0.5';
      tabToxicMicro.className = 'cursor-pointer font-bold transition-all text-gray-600 hover:text-gray-400';
    } else {
      tabToxicMacro.className = 'cursor-pointer font-bold transition-all text-gray-600 hover:text-gray-400';
      tabToxicMicro.className = 'cursor-pointer font-bold transition-all text-red-400 border-b border-red-500/40 pb-0.5';
    }

    toxicDisplayList.innerHTML = '';

    if (currentToxicTab === 'macro') {
      // STRUKTUR (Macro-Schadstoffe)
      if (macrosTox.length === 0) {
        toxicDisplayList.innerHTML = '<div class="text-gray-500 italic text-[9px] py-1.5 font-mono">• Keine strukturellen Makro-Toxine erkannt.</div>';
      } else {
        macrosTox.forEach(function (cat) {
          const item = document.createElement('div');
          item.className = 'p-1.5 rounded-lg bg-purple-950/20 border border-purple-900/40 text-purple-300 text-[10px] leading-relaxed flex items-start space-x-1.5 select-text shadow-sm';
          item.innerHTML = `
            <span class="text-purple-400 font-bold flex-shrink-0">📊 [MAKRO]</span>
            <span class="flex-1">${cat}</span>
          `;
          toxicDisplayList.appendChild(item);
        });
      }
    } else {
      // ZITATE (Micro-Toxine / Originalsätze)
      if (snippetsTox.length === 0) {
        toxicDisplayList.innerHTML = '<div class="text-gray-500 italic text-[9px] py-1.5 font-mono">🚨 Keine akuten Mikro-Toxin-Phrasen auf dieser Seite.</div>';
      } else {
        snippetsTox.forEach(function (snippet) {
          const item = document.createElement('div');
          item.className = 'p-1.5 rounded-lg bg-black/40 border border-red-950/60 text-red-400 text-[10px] leading-relaxed flex items-start space-x-1.5 select-text';
          item.innerHTML = `
            <span class="flex-shrink-0 text-red-400 font-bold">🚨</span>
            <span class="flex-1">${snippet}</span>
          `;
          toxicDisplayList.appendChild(item);
        });
      }
    }
  }

  // ==========================================================================
  // 7.2 RENDERN DES NÄHRSTOFF-GEFÄSSES (BOX 2: #nutrient-display-list)
  // ==========================================================================
  function renderNutrientBox() {
    if (!tabNutrientMacro || !tabNutrientMicro || !nutrientDisplayList) return;

    const entryData = activeSourceData || currentSample || {};
    const macrosNut = Array.isArray(entryData.macro_nut_categories) ? entryData.macro_nut_categories : [];
    const snippetsNut = Array.isArray(entryData.nutrient_snippets) ? entryData.nutrient_snippets : [];

    // Badge synchron halten
    if (microNutrientBadge) {
      microNutrientBadge.textContent = (macrosNut.length + snippetsNut.length).toString();
    }

    // Tab-Styling umschalten
    if (currentNutrientTab === 'macro') {
      tabNutrientMacro.className = 'cursor-pointer font-bold transition-all text-cyan-400 border-b border-cyan-500/40 pb-0.5';
      tabNutrientMicro.className = 'cursor-pointer font-bold transition-all text-gray-600 hover:text-gray-400';
    } else {
      tabNutrientMacro.className = 'cursor-pointer font-bold transition-all text-gray-600 hover:text-gray-400';
      tabNutrientMicro.className = 'cursor-pointer font-bold transition-all text-cyan-300 border-b border-cyan-500/40 pb-0.5';
    }

    nutrientDisplayList.innerHTML = '';

    if (currentNutrientTab === 'macro') {
      // STRUKTUR (Macro-Nährwert)
      if (macrosNut.length === 0) {
        nutrientDisplayList.innerHTML = '<div class="text-gray-500 italic text-[9px] py-1.5 font-mono">• Keine Makro-Nährstoffe isoliert.</div>';
      } else {
        macrosNut.forEach(function (cat) {
          const item = document.createElement('div');
          item.className = 'p-1.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-[10px] leading-relaxed flex items-start space-x-1.5 select-text shadow-sm';
          item.innerHTML = `
            <span class="text-emerald-400 font-bold flex-shrink-0">📊 [MAKRO]</span>
            <span class="flex-1">${cat}</span>
          `;
          nutrientDisplayList.appendChild(item);
        });
      }
    } else {
      // ZITATE (Micro-Nährwert / Evidenz-Originalsätze)
      if (snippetsNut.length === 0) {
        nutrientDisplayList.innerHTML = '<div class="text-gray-500 italic text-[9px] py-1.5 font-mono">💎 Keine Mikro-Nährstoff-Zitate vorhanden.</div>';
      } else {
        snippetsNut.forEach(function (snippet) {
          const item = document.createElement('div');
          item.className = 'p-1.5 rounded-lg bg-black/40 border border-cyan-950/60 text-cyan-300 text-[10px] leading-relaxed flex items-start space-x-1.5 select-text';
          item.innerHTML = `
            <span class="flex-shrink-0 text-cyan-400 font-bold">💎</span>
            <span class="flex-1">${snippet}</span>
          `;
          nutrientDisplayList.appendChild(item);
        });
      }
    }
  }

  // ==========================================================================
  // 7.3 EVENT-LISTENER FÜR DIE TABS
  // ==========================================================================
  if (tabToxicMacro) {
    tabToxicMacro.addEventListener('click', function () {
      currentToxicTab = 'macro';
      renderToxicBox();
    });
  }
  if (tabToxicMicro) {
    tabToxicMicro.addEventListener('click', function () {
      currentToxicTab = 'micro';
      renderToxicBox();
    });
  }
  if (tabNutrientMacro) {
    tabNutrientMacro.addEventListener('click', function () {
      currentNutrientTab = 'macro';
      renderNutrientBox();
    });
  }
  if (tabNutrientMicro) {
    tabNutrientMicro.addEventListener('click', function () {
      currentNutrientTab = 'micro';
      renderNutrientBox();
    });
  }

  // ==========================================================================
  // 8. DER ISOLIERTE FLUSH (SCHREIBGESCHÜTZT, KEINE SCORE-MANIPULATION)
  // ==========================================================================
  if (btnLinguisticFlush) {
    btnLinguisticFlush.addEventListener('click', function () {
      if (!currentSample) {
        alert('Bitte wähle zuerst eine Biopsie-Probe aus der linken Gewebebank!');
        return;
      }

      // Greift sich schreibgeschützt immer alle Sätze ab, die sich AKTUELL im Array 'toxic_snippets' befinden
      const entryData = activeSourceData || currentSample;
      let toxicSentences = Array.isArray(entryData.toxic_snippets) && entryData.toxic_snippets.length > 0
        ? [...entryData.toxic_snippets]
        : (Array.isArray(currentSample.toxic_snippets) ? [...currentSample.toxic_snippets] : []);

      // Wenn keine Mikro-Zitate vorhanden sind, Makro-Gründe einbinden für eine inhaltliche Spülung
      if (toxicSentences.length === 0) {
        const macroTox = Array.isArray(entryData.macro_tox_categories) 
          ? entryData.macro_tox_categories 
          : (Array.isArray(entryData.macro_reasons) ? entryData.macro_reasons : []);
        if (macroTox.length > 0) {
          toxicSentences = [...macroTox];
        }
      }

      const rawToxicText = toxicSentences.join(' ') || 'Die Krise eskaliert dramatisch und bedroht das gesamte System!';
      const activeUrl = selectedUrlFilter || entryData.url || currentSample.source_url || 'https://journal-nature.org';

      // UI Feedback
      btnLinguisticFlush.disabled = true;
      if (btnFlushLabel) btnFlushLabel.textContent = 'Spülung aktiv...';
      if (flushSpinnerIcon) flushSpinnerIcon.classList.add('animate-spin');
      if (flushFeedback) {
        flushFeedback.textContent = 'Neutralisiere Toxin-Phrasen...';
        flushFeedback.style.color = '#34d399';
      }

      // Primär über chrome.runtime.sendMessage an den Service Worker
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(
          {
            type: 'FLUSH_BIOPSY',
            biopsy_id: currentSample.biopsy_id,
            toxic_snippets: toxicSentences,
            raw_text: rawToxicText,
            url: activeUrl
          },
          function (response) {
            if (response && response.success && response.flush_result) {
              displayAntidoteText(response.flush_result.neutralized_text);
            } else {
              fallbackDirectApiFlush(rawToxicText, activeUrl);
            }
          }
        );
      } else {
        fallbackDirectApiFlush(rawToxicText, activeUrl);
      }
    });
  }

  // Fallback: Direkter API-Aufruf an /api/flush
  function fallbackDirectApiFlush(rawText, sourceUrl) {
    fetch('http://127.0.0.1:8000/api/flush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText, url: sourceUrl })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('API Flush Status ' + res.status);
        return res.json();
      })
      .then(function (data) {
        displayAntidoteText(data.neutralized_text);
      })
      .catch(function (err) {
        console.warn('[Q-O Labor] Autonome Glättung:', err);
        const simulatedClean = (rawText || '')
          .replace(/Schock|Alarm|Drama|Panik|Horror|Kollaps|Zerstörung|Todes-Angst/gi, 'Sachverhalt')
          .replace(/dramatisch|radikal|brutal|unfassbar/gi, 'gemessen')
          .replace(/droht alles zu vernichten|bedroht das gesamte System/gi, 'wird derzeit sachlich evaluiert');

        displayAntidoteText(simulatedClean || 'Der Sachverhalt wurde neutralisiert und nüchtern formuliert.');
      });
  }

  // Schreibt das Ergebnis isoliert in das untere Antidote-Panel
  function displayAntidoteText(neutralizedText) {
    if (antidoteTextNeutral) {
      antidoteTextNeutral.textContent = neutralizedText || 'Text bereinigt und neutralisiert.';
    }
    if (antidotePanel) {
      antidotePanel.classList.remove('hidden');
    }
    if (flushFeedback) {
      flushFeedback.textContent = '✓ Detox abgeschlossen: Textfeld neutralisiert.';
      flushFeedback.style.color = '#34d399';
    }
    if (btnFlushLabel) btnFlushLabel.textContent = 'Linguistische Spülung einleiten';
    if (flushSpinnerIcon) flushSpinnerIcon.classList.remove('animate-spin');
    btnLinguisticFlush.disabled = false;
  }

  // ==========================================================================
  // 9. VAULT-STERILISATION (GEWEBEBANK LEEREN)
  // ==========================================================================
  if (btnClearVault) {
    btnClearVault.addEventListener('click', function () {
      const confirmDetox = confirm('Möchtest du wirklich alle Proben aus dem Vault löschen und die Gewebebank sterilisieren?');
      if (!confirmDetox) return;

      console.log('[Q-O Labor] Initiiere Vault-Vaporisierung...');

      function resetLaboratoryUI() {
        if (capsuleListWrapper) {
          capsuleListWrapper.innerHTML = '<div class="text-xs text-gray-600 text-center py-4 font-mono">Gewebebank sterilisiert. Keine Proben im Vault.</div>';
        }
        if (capsuleCountBadge) capsuleCountBadge.textContent = '0 Proben';

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
        }

        if (toolsStatusBadge) {
          toolsStatusBadge.textContent = 'Tab LQ: --';
          toolsStatusBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-bold font-mono';
          toolsStatusBadge.style.color = '';
        }
        if (toolsStatusTitle) {
          toolsStatusTitle.style.color = '';
        }

        if (urlHistoryList) urlHistoryList.innerHTML = '';
        if (urlHistoryCount) urlHistoryCount.textContent = '0 Quellen';
        
        // Tab-Boxen zurücksetzen
        currentToxicTab = 'macro';
        currentNutrientTab = 'macro';
        if (toxicDisplayList) toxicDisplayList.innerHTML = '<div class="text-gray-500 italic text-[9px] py-1">Keine Kriterien isoliert.</div>';
        if (nutrientDisplayList) nutrientDisplayList.innerHTML = '<div class="text-gray-500 italic text-[9px] py-1">Keine Kriterien isoliert.</div>';

        if (antidotePanel) antidotePanel.classList.add('hidden');
        if (antidoteTextNeutral) antidoteTextNeutral.textContent = 'Warte auf biochemische Glättung...';
        if (flushFeedback) flushFeedback.textContent = '';

        currentSample = null;
        selectedUrlFilter = null;
        activeSourceData = null;
      }

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ qo_biopsies: [] });
      }

      if (typeof indexedDB !== 'undefined') {
        const req = indexedDB.open('QO_Metabolic_Vault', 2);
        req.onsuccess = function (e) {
          const db = e.target.result;
          if (db.objectStoreNames.contains('biopsy_archive')) {
            const tx = db.transaction('biopsy_archive', 'readwrite');
            const store = tx.objectStore('biopsy_archive');
            store.clear();
          }
        };
      }

      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'CLEAR_BIOPSY_VAULT' });
      }

      resetLaboratoryUI();
    });
  }

  // ==========================================================================
  // 10. INITIALISIERUNG & MULTI-LAYER VAULT-LADEN
  // ==========================================================================
  function initLaboratory() {
    console.log('[Q-O Labor] Initialisiere symmetrisches 2-Boxen-Tab-System...');

    const urlParams = new URLSearchParams(window.location.search);
    const requestedId = urlParams.get('id');

    // Statische HTML-Kapseln sofort mit Drag & Drop / Click Event-Listenern verdrahten
    document.querySelectorAll('.biopsy-capsule').forEach(bindCapsuleEvents);

    // Drag and Drop Zone aktivieren
    setupDragAndDrop();

    initRealtimeBiopsyListener();

    fetchAllBiopsyRecords(function (records) {
      if (records && records.length > 0 && capsuleListWrapper) {
        capsuleListWrapper.innerHTML = '';
        records.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        for (let i = records.length - 1; i >= 0; i--) {
          prependDynamicCapsule(records[i]);
        }

        if (requestedId) {
          const found = records.find((r) => r && r.biopsy_id === requestedId);
          if (found) {
            applySterileReactorColoring(found);
            loadSampleIntoSeziertisch(found);
            return;
          }
        }
        applySterileReactorColoring(records[0]);
        loadSampleIntoSeziertisch(records[0]);
      } else {
        // Falls keine Vault-Daten vorliegen, erste statische Labor-Probe automatisch aktivieren
        const staticCapsules = document.querySelectorAll('.biopsy-capsule');
        if (staticCapsules.length > 0) {
          staticCapsules[0].click();
        }
      }
    });
  }

  function fetchAllBiopsyRecords(callback) {
    let combinedRecords = [];
    let storageChecked = false;

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['qo_biopsies'], function (result) {
        if (result && Array.isArray(result.qo_biopsies)) {
          combinedRecords = [...result.qo_biopsies];
        }
        storageChecked = true;
        checkIndexedDb();
      });
    } else {
      storageChecked = true;
      checkIndexedDb();
    }

    function checkIndexedDb() {
      if (typeof indexedDB !== 'undefined') {
        const req = indexedDB.open('QO_Metabolic_Vault', 2);
        req.onerror = function () { callback(combinedRecords); };
        req.onsuccess = function (e) {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('biopsy_archive')) {
            callback(combinedRecords);
            return;
          }
          const tx = db.transaction('biopsy_archive', 'readonly');
          const store = tx.objectStore('biopsy_archive');
          const getAllReq = store.getAll();
          getAllReq.onsuccess = function () {
            const dbRecords = getAllReq.result || [];
            dbRecords.forEach(function (rec) {
              if (rec && rec.biopsy_id && !combinedRecords.some((r) => r.biopsy_id === rec.biopsy_id)) {
                combinedRecords.push(rec);
              }
            });
            callback(combinedRecords);
          };
          getAllReq.onerror = function () { callback(combinedRecords); };
        };
      } else {
        callback(combinedRecords);
      }
    }
  }

  function initRealtimeBiopsyListener() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener(function (message) {
          if (message && message.type === 'BIOPSY_STORED' && message.record) {
            prependDynamicCapsule(message.record);
          }
        });
      }
    } catch (e) {
      console.warn('[Q-O Labor] Broadcast-Empfang nicht aktiv:', e);
    }
  }

  function prependDynamicCapsule(data) {
    if (!capsuleListWrapper || !data) return;

    const existingElement = document.getElementById(`capsule-${data.biopsy_id}`);
    if (existingElement) existingElement.remove();

    const lq = safeNum(data.lq_score ?? data.lq, 0.35);
    const morph = getMorphologyState(lq);
    const sTox = safeNum(data.s_tox ?? data.stox, parseFloat(((1 - lq) * 4).toFixed(2)));
    const nNut = safeNum(data.n_nut ?? data.nnut, parseFloat((lq * 3).toFixed(2)));
    const sourceUrl = data.source_url || 'Konsolidierte Sitzung';
    const toxicSnippets = Array.isArray(data.toxic_snippets) ? data.toxic_snippets : [];
    const nutrientSnippets = Array.isArray(data.nutrient_snippets) ? data.nutrient_snippets : [];
    const macroToxCategories = Array.isArray(data.macro_tox_categories) 
      ? data.macro_tox_categories 
      : (Array.isArray(data.macro_reasons) ? data.macro_reasons : []);
    const macroNutCategories = Array.isArray(data.macro_nut_categories) 
      ? data.macro_nut_categories 
      : [];

    const sessionHistory = Array.isArray(data.session_history) && data.session_history.length > 0
      ? data.session_history
      : [{
          url: sourceUrl,
          lq_score: lq,
          s_tox: sTox,
          n_nut: nNut,
          toxic_snippets: toxicSnippets,
          nutrient_snippets: nutrientSnippets,
          macro_tox_categories: macroToxCategories,
          macro_nut_categories: macroNutCategories,
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
    card.setAttribute('data-macro-tox-categories', JSON.stringify(macroToxCategories));
    card.setAttribute('data-macro-nut-categories', JSON.stringify(macroNutCategories));
    card.setAttribute('data-session-history', JSON.stringify(sessionHistory));
    card.className = 'biopsy-capsule p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing relative flex flex-col space-y-2';
    card.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
    card.style.borderColor = morph.colorHex + '66';
    card.style.boxShadow = `0 0 12px ${morph.colorHex}22`;

    const histCount = sessionHistory.length;

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

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLaboratory);
  } else {
    initLaboratory();
  }
})();
