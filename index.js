/**
 * ==========================================================================
 * PROJEKT "Q-O" // CYBER-MEDIZINISCHES ANALYSELABOR (INDEX.JS)
 * ==========================================================================
 * Strikt CSP-konform, keine Inline-Scripts, vollständige Event-Listener-Anbindung.
 */

(function () {
  'use strict';

  // IndexedDB Konfiguration
  const DB_NAME = 'QO_Metabolic_Vault';
  const STORE_NAME = 'biopsy_archive';
  const DB_VERSION = 1;

  // DOM Elemente Zone 1 (Gewebebank)
  const capsuleListWrapper = document.getElementById('capsule-list-wrapper');
  const capsuleCountBadge = document.getElementById('capsule-count-badge');

  // DOM Elemente Zone 2 (Seziertisch / Sezier-Zelle)
  const cryoHolder = document.getElementById('cryo-holder');
  const dropInstruction = document.getElementById('drop-instruction');
  const largeCell = document.getElementById('large-cell');
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

  // DOM Elemente Zone 3 (Werkzeugkasten)
  const zoneToolsPanel = document.getElementById('zone-tools-panel');
  const toolsStatusBadge = document.getElementById('tools-status-badge');
  const herdFocusLabel = document.getElementById('herd-focus-label');
  const toxicWordsContainer = document.getElementById('toxic-words-container');
  const toxicUrlsContainer = document.getElementById('toxic-urls-container');
  const schadstoffCircle = document.getElementById('schadstoff-circle');
  const schadstoffVal = document.getElementById('schadstoff-val');
  const valAffekt = document.getElementById('val-affekt');
  const valSyntakt = document.getElementById('val-syntakt');
  const valNaehrwert = document.getElementById('val-naehrwert');
  const btnLinguisticFlush = document.getElementById('btn-linguistic-flush');
  const flushFeedback = document.getElementById('flush-feedback');

  // Aktiver Probenzustand
  let currentSample = null;

  // ==========================================================================
  // 1. DAS E-FUNKTIONS-MODELL: LQ = e^(-(S_tox - N_nut))
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
  // 2. HTML5 DRAG & DROP LOGIK (ZWISCHEN ZONE 1 & ZONE 2)
  // ==========================================================================
  function bindCapsuleEvents(capsule) {
    capsule.addEventListener('dragstart', function (e) {
      capsule.style.opacity = '0.5';
      const payload = {
        biopsy_id: capsule.getAttribute('data-biopsy-id'),
        lq: parseFloat(capsule.getAttribute('data-lq')),
        s_tox: parseFloat(capsule.getAttribute('data-stox') || '2.0'),
        n_nut: parseFloat(capsule.getAttribute('data-nnut') || '1.0')
      };
      e.dataTransfer.setData('text/plain', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'copy';
    });

    capsule.addEventListener('dragend', function () {
      capsule.style.opacity = '1';
    });

    // Direkter Klick auf Kapsel als intuitive Alternative
    capsule.addEventListener('click', function () {
      const payload = {
        biopsy_id: capsule.getAttribute('data-biopsy-id'),
        lq: parseFloat(capsule.getAttribute('data-lq')),
        s_tox: parseFloat(capsule.getAttribute('data-stox') || '2.0'),
        n_nut: parseFloat(capsule.getAttribute('data-nnut') || '1.0')
      };
      loadSampleIntoSeziertisch(payload);
    });
  }

  // Drag-Over auf Kryo-Halterung
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

  // ==========================================================================
  // 3. SEZIERTISCH AKTIVIEREN & ZELL-MORPHOLOGIE RENDERN
  // ==========================================================================
  function loadSampleIntoSeziertisch(sample) {
    currentSample = sample;

    // 1. Kryo-Halterung blitzt weiß/cyan auf
    cryoHolder.classList.remove('cryo-flash-anim');
    void cryoHolder.offsetWidth; // Reflow erzwingen
    cryoHolder.classList.add('cryo-flash-anim');

    // 2. Platzhalter-Text ausblenden, große Zelle einblenden
    dropInstruction.style.opacity = '0';
    dropInstruction.style.pointerEvents = 'none';

    largeCell.style.opacity = '1';
    largeCell.style.transform = 'scale(1)';
    largeCell.style.pointerEvents = 'auto';

    // 3. Morphologie basierend auf LQ anwenden
    const morph = getMorphologyState(sample.lq);
    largeCell.className = 'relative flex items-center justify-center transition-all duration-700 opacity-100 transform scale-100 ' + morph.className;

    // 4. Telemetrie-Werte synchronisieren
    teleSampleId.textContent = sample.biopsy_id;
    teleLqVal.textContent = sample.lq.toFixed(2);
    teleLqVal.style.color = morph.colorHex;
    teleRatioVal.textContent = `${sample.s_tox.toFixed(2)} / ${sample.n_nut.toFixed(2)}`;

    teleStateBadge.textContent = morph.label;
    teleStateBadge.className = 'font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-xs border ' + morph.badgeClass;

    headerSampleLabel.textContent = `${sample.biopsy_id} (${morph.label})`;
    headerSampleLabel.style.color = morph.colorHex;

    // 5. Zone 3 (Werkzeuge) freischalten
    unlockToolsPanel(morph, sample);
  }

  // ==========================================================================
  // 4. WERKZEUGKASTEN (ZONE 3) AKTIVIEREN & HERD-FILTER
  // ==========================================================================
  function unlockToolsPanel(morph, sample) {
    zoneToolsPanel.classList.remove('opacity-30', 'pointer-events-none');
    zoneToolsPanel.classList.add('opacity-100');

    toolsStatusBadge.textContent = 'Aktiv';
    toolsStatusBadge.className = 'text-xs font-mono px-2 py-0.5 rounded-full text-cyan-400 border border-cyan-400';
    toolsStatusBadge.style.backgroundColor = 'rgba(0, 242, 254, 0.15)';

    // Standard-Fokus: Herd 3 (Nekrotisch)
    activateHerdInspection(3, 'Nekrotischer Herd (Toxizitäts-Zentrum)');
  }

  function activateHerdInspection(herdNumber, herdName) {
    // Kurzer visueller Impuls auf der Zelle
    largeCell.style.transform = 'scale(1.03)';
    setTimeout(function () {
      largeCell.style.transform = 'scale(1)';
    }, 200);

    herdFocusLabel.textContent = herdName;

    if (herdNumber === 1) {
      // 1. Synthetischer Herd: Geometrische Cluster
      renderToxicWords(['Synthese-Drift', 'Token-Cluster', 'Algorithmen-Spike', 'Muster-Enge'], '#00f2fe');
      renderToxicUrls(['🔗 www.synth-matrix.io/ai-stream', '🔗 www.tech-pipeline.dev/token-feed'], '#00f2fe');
      updateSpectrogram(32, '3.2 / 10', '7.4 / 10', '6.8 / 10', '#00f2fe');
    } else if (herdNumber === 2) {
      // 2. Diffuser Entzündungsherd: Reizflut
      renderToxicWords(['Überforderung', 'Alarmismus', 'Verunsicherung', 'Reizflut', 'Dauerfeuer'], '#ff9900');
      renderToxicUrls(['🔗 www.infotainment-feed.net/breaking-loop', '🔗 www.social-rage.app/infinite-feed'], '#ff9900');
      updateSpectrogram(64, '6.8 / 10', '5.5 / 10', '2.8 / 10', '#ff9900');
    } else {
      // 3. Nekrotischer Herd: Akute Toxizität
      renderToxicWords(['Eskalation', 'Kollaps', 'Skandal', 'Torschlusspanik', 'Katastrophe'], '#f43f5e');
      renderToxicUrls(['🔗 www.reisserische-news.de/apokalypse', '🔗 www.rage-feed.net/endless-alarm'], '#f43f5e');
      updateSpectrogram(82, '8.9 / 10', '6.8 / 10', '0.9 / 10', '#f43f5e');
    }
  }

  function renderToxicWords(words, hexColor) {
    toxicWordsContainer.innerHTML = '';
    words.forEach(function (w) {
      const chip = document.createElement('span');
      chip.className = 'px-2 py-1 rounded text-xs font-mono border';
      chip.style.color = hexColor;
      chip.style.borderColor = hexColor;
      chip.style.backgroundColor = hexColor + '22';
      chip.textContent = w;
      toxicWordsContainer.appendChild(chip);
    });
  }

  function renderToxicUrls(urls, hexColor) {
    toxicUrlsContainer.innerHTML = '';
    urls.forEach(function (u) {
      const link = document.createElement('a');
      link.href = '#';
      link.className = 'p-2 rounded border text-xs truncate block hover:underline';
      link.style.color = hexColor;
      link.style.borderColor = hexColor + '66';
      link.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
      link.textContent = u;
      link.addEventListener('click', function (e) {
        e.preventDefault();
      });
      toxicUrlsContainer.appendChild(link);
    });
  }

  function updateSpectrogram(percentage, affekt, syntakt, naehrwert, strokeHex) {
    schadstoffVal.textContent = percentage + '%';
    schadstoffCircle.setAttribute('stroke-dasharray', `${percentage}, 100`);
    schadstoffCircle.style.color = strokeHex;

    valAffekt.textContent = affekt;
    valAffekt.style.color = strokeHex;
    valSyntakt.textContent = syntakt;
    valNaehrwert.textContent = naehrwert;
  }

  // Event Listener für die 3 Gewebeherde
  herd1Synthetic.addEventListener('click', function (e) {
    e.stopPropagation();
    activateHerdInspection(1, 'Synthetischer Herd (Geometrisch)');
  });

  herd2Diffuse.addEventListener('click', function (e) {
    e.stopPropagation();
    activateHerdInspection(2, 'Diffuser Entzündungsherd (Nebel)');
  });

  herd3Necrotic.addEventListener('click', function (e) {
    e.stopPropagation();
    activateHerdInspection(3, 'Nekrotischer Herd (Akut Toxisch)');
  });

  // ==========================================================================
  // 5. LINGUISTISCHER SPÜL-AKTIVATOR (DETOX HOMÖOSTASE-SIMULATION)
  // ==========================================================================
  btnLinguisticFlush.addEventListener('click', function () {
    if (!currentSample) return;

    btnLinguisticFlush.disabled = true;
    flushFeedback.textContent = 'Spülung aktiv: Neutralisiere Gift-Cluster...';
    flushFeedback.style.color = '#00f2fe';

    // Große Zelle morphiert fließend zurück in den gesunden Zustand (Cyan)
    largeCell.className = 'relative flex items-center justify-center transition-all duration-700 opacity-100 transform scale-100 q-o-hud-stable';

    setTimeout(function () {
      currentSample.lq = 1.25;
      currentSample.s_tox = 0.20;
      currentSample.n_nut = 3.10;

      teleLqVal.textContent = '1.25';
      teleLqVal.style.color = '#00f2fe';
      teleRatioVal.textContent = '0.20 / 3.10';

      teleStateBadge.textContent = 'Homöostase Erreicht';
      teleStateBadge.className = 'font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-xs text-cyan-400 border border-cyan-400';
      teleStateBadge.style.backgroundColor = 'rgba(0, 242, 254, 0.15)';

      updateSpectrogram(8, '0.6 / 10', '1.1 / 10', '9.5 / 10', '#00f2fe');
      renderToxicWords(['Geklärt', 'Syntaktische Weite', 'Homöostase'], '#00f2fe');

      flushFeedback.textContent = '✓ Detox abgeschlossen: Homöostase wiederhergestellt.';
      flushFeedback.style.color = '#34d399';

      btnLinguisticFlush.disabled = false;
    }, 1200);
  });

  // ==========================================================================
  // 6. INDEXEDDB KOPPLUNG BEIM START & INITIALISIERUNG
  // ==========================================================================
  function initLaboratory() {
    // 1. Alle vorhandenen statischen Kapseln initialisieren
    const initialCapsules = document.querySelectorAll('.biopsy-capsule');
    initialCapsules.forEach(bindCapsuleEvents);

    if (capsuleCountBadge) {
      capsuleCountBadge.textContent = `${initialCapsules.length} Proben`;
    }

    // 2. URL-Parameter prüfen (z.B. index.html?id=bio_...)
    const urlParams = new URLSearchParams(window.location.search);
    const requestedId = urlParams.get('id');

    // 3. Verbindung zur IndexedDB herstellen
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
        dbIndicator.style.backgroundColor = '#00f2fe';
        dbStatusLabel.textContent = 'Vault: Verbunden';

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const getAllReq = store.getAll();

        getAllReq.onsuccess = function () {
          const records = getAllReq.result || [];
          console.log(`[Q-O Labor] ${records.length} Proben in IndexedDB archiviert.`);

          if (records.length > 0) {
            records.forEach(function (rec) {
              if (!document.querySelector(`[data-biopsy-id="${rec.biopsy_id}"]`)) {
                prependDynamicCapsule(rec);
              }
            });
          }

          // Wenn eine ID übergeben wurde, lade diese sofort in den Seziertisch
          if (requestedId) {
            const found = records.find(function (r) { return r.biopsy_id === requestedId; });
            if (found) {
              loadSampleIntoSeziertisch({
                biopsy_id: found.biopsy_id,
                lq: found.lq_score !== undefined ? found.lq_score : 0.35,
                s_tox: 3.2,
                n_nut: 0.8
              });
            } else {
              loadSampleIntoSeziertisch({
                biopsy_id: requestedId,
                lq: 0.35,
                s_tox: 3.4,
                n_nut: 0.75
              });
            }
          }
        };
      };

      request.onerror = function () {
        dbIndicator.style.backgroundColor = '#f43f5e';
        dbStatusLabel.textContent = 'Vault: Lokaler Modus';
      };
    }
  }

  function prependDynamicCapsule(data) {
    const lq = data.lq_score !== undefined ? data.lq_score : 0.35;
    const morph = getMorphologyState(lq);

    const card = document.createElement('div');
    card.id = `capsule-${data.biopsy_id}`;
    card.draggable = true;
    card.setAttribute('data-biopsy-id', data.biopsy_id);
    card.setAttribute('data-lq', lq);
    card.setAttribute('data-stox', ((1 - lq) * 4).toFixed(2));
    card.setAttribute('data-nnut', (lq * 3).toFixed(2));
    card.className = 'biopsy-capsule p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing relative flex flex-col space-y-2';
    card.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
    card.style.borderColor = morph.colorHex + '66';
    card.style.boxShadow = `0 0 12px ${morph.colorHex}22`;

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-mono text-xs text-gray-300">${data.biopsy_id}</span>
        <span class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${morph.badgeClass}" style="background-color: ${morph.colorHex}22;">${morph.label}</span>
      </div>
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-full flex-shrink-0 border shadow" style="background: radial-gradient(circle at 35% 35%, #ffffff, ${morph.colorHex} 70%, #000000 100%); border-color: ${morph.colorHex}; box-shadow: 0 0 10px ${morph.colorHex}88;"></div>
        <div class="flex-1 font-mono text-xs">
          <div class="flex justify-between text-gray-300">LQ: <span class="text-white font-bold">${lq.toFixed(2)}</span></div>
          <div class="text-gray-500 text-xs truncate">${data.source_url || 'Lokale Biopsie'}</div>
        </div>
      </div>
      <div class="text-xs text-gray-500 font-mono flex items-center justify-between border-t border-gray-800 pt-1.5">
        <span>Neu archiviert</span>
        <span class="font-semibold" style="color: ${morph.colorHex};">Ziehen &rarr;</span>
      </div>
    `;

    capsuleListWrapper.prepend(card);
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
