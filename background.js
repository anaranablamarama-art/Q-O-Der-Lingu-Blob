// ==============================================================================
// PROJEKT "Q-O" // BACKGROUND SERVICE WORKER (BACKGROUND.JS)
// ==============================================================================
// Privilegiertes Relais zur Umgehung von CORS- und PNA-Blockaden.
// Verwaltet globale Homöostase, Biopsie-Tresor ('QO_Metabolic_Vault' IndexedDB & Storage)
// mit akkumulierendem Read-Modify-Write für 'session_history', Snippets,
// Makro-Kategorien (macro_tox_categories & macro_nut_categories),
// Pro-/Contra-Argumente und Symmetrie-Scores der Mikro-Makro-Matrix.
// Singleton-Labor-Tabs mit Ursprungs-Tab-Gedächtnis und
// strikte Phasen-Trennung mit asynchron abgesichertem Transaktions-Reset.
// ==============================================================================

const BACKEND_API_URL = 'http://localhost:8000/api/analyze';
const BACKEND_FLUSH_URL = 'http://localhost:8000/api/flush';

// IndexedDB Konfiguration für den Vault
const DB_NAME = 'QO_Metabolic_Vault';
const STORE_NAME = 'biopsy_archive';
const DB_VERSION = 1;

// ==============================================================================
// 1. DIE SPEICHER-STRUKTUR IM RAM DES SERVICE WORKERS
// ==============================================================================
let currentSessionId = 'session_' + Date.now();
let globalSessionHistory = [];
let globalToxicSnippets = [];
let globalNutrientSnippets = [];
let globalMacroToxCategories = [];
let globalMacroNutCategories = [];
let globalProArguments = [];
let globalContraArguments = [];

// Globaler metabolischer Zustand des Lingu-Blobs (Standard: kryo)
let globalMetabolismState = 'kryo';

// Gedächtnis für Ursprungs-Tab & Fenster für den Begleitermodus-Rücksprung
let lastSourceTabId = null;
let lastSourceWindowId = null;

// Beim Start aus storage laden falls vorhanden
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(['qo_global_state', 'qo_current_session_id'], (res) => {
    if (res && res.qo_global_state) {
      globalMetabolismState = res.qo_global_state;
    }
    if (res && res.qo_current_session_id) {
      currentSessionId = res.qo_current_session_id;
    } else {
      chrome.storage.local.set({ qo_current_session_id: currentSessionId });
    }
  });
}

// IndexedDB Helper für den Vault
function openVaultDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB nicht verfügbar im Kontext'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'biopsy_id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// ==============================================================================
// ZENTRALER SPEICHER-HELFER IN DEN VAULT (INDEXEDDB & STORAGE-SPIEGELUNG)
// ==============================================================================
function writeRecordToVault(record) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openVaultDB();
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(record);

      tx.oncomplete = () => {
        // Redundanz & Spiegelung in chrome.storage.local
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['qo_biopsies'], (res) => {
            let list = (res && Array.isArray(res.qo_biopsies)) ? res.qo_biopsies : [];
            list = list.filter((b) => b.biopsy_id !== record.biopsy_id);
            list.unshift(record);
            if (list.length > 30) list = list.slice(0, 30);
            chrome.storage.local.set({ qo_biopsies: list, qo_current_session_id: currentSessionId });
          });
        }
        resolve(record);
      };

      tx.onerror = (e) => {
        console.warn('[Q-O Background] Transaktions-Fehler beim Vault-Schreiben:', e);
        reject(e.target.error);
      };
    } catch (err) {
      console.warn('[Q-O Background] IndexedDB nicht erreichbar, Fallback auf chrome.storage:', err);
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['qo_biopsies'], (res) => {
          let list = (res && Array.isArray(res.qo_biopsies)) ? res.qo_biopsies : [];
          list = list.filter((b) => b.biopsy_id !== record.biopsy_id);
          list.unshift(record);
          if (list.length > 30) list = list.slice(0, 30);
          chrome.storage.local.set({ qo_biopsies: list, qo_current_session_id: currentSessionId });
        });
      }
      resolve(record);
    }
  });
}

// ==============================================================================
// 2. DER AUTOMATISCHE TAKT (UNIQUE URL-SAMMLUNG, MATRIX & LIVE-VAULT SCHREIBEN)
// ==============================================================================
async function recordAnalysisCycle(
  incomingUrl,
  lqScore,
  sTox,
  nNut,
  toxicSnippets,
  nutrientSnippets,
  macroToxCategories,
  macroNutCategories,
  proArguments,
  contraArguments,
  symmetryScore,
  tMikro,
  tMakro,
  nMikro,
  nMakro
) {
  const safeUrl = incomingUrl || 'about:blank';
  const safeLq = typeof lqScore === 'number' ? lqScore : 1.0;
  const safeStox = typeof sTox === 'number' ? sTox : parseFloat(((1 - safeLq) * 4).toFixed(2));
  const safeNnut = typeof nNut === 'number' ? nNut : parseFloat((safeLq * 3).toFixed(2));
  const toxList = Array.isArray(toxicSnippets) ? toxicSnippets : [];
  const nutList = Array.isArray(nutrientSnippets) ? nutrientSnippets : [];
  const macroToxList = Array.isArray(macroToxCategories) ? macroToxCategories : [];
  const macroNutList = Array.isArray(macroNutCategories) ? macroNutCategories : [];
  const proList = Array.isArray(proArguments) ? proArguments : [];
  const contraList = Array.isArray(contraArguments) ? contraArguments : [];
  const safeSymmetry = typeof symmetryScore === 'number' ? symmetryScore : 100.0;

  // Unique-Prüfung: Verhindert Mehrfach-Einträge derselben URL bei Verweildauer
  const existingIndex = globalSessionHistory.findIndex((entry) => {
    if (typeof entry === 'string') return entry === safeUrl;
    return entry && entry.url === safeUrl;
  });

  const urlEntry = {
    url: safeUrl,
    lq_score: safeLq,
    s_tox: safeStox,
    n_nut: safeNnut,
    t_mikro: typeof tMikro === 'number' ? tMikro : safeStox,
    t_makro: typeof tMakro === 'number' ? tMakro : 0.0,
    n_mikro: typeof nMikro === 'number' ? nMikro : safeNnut,
    n_makro: typeof nMakro === 'number' ? nMakro : 1.0,
    symmetry_score: safeSymmetry,
    toxic_snippets: toxList,
    nutrient_snippets: nutList,
    macro_tox_categories: macroToxList,
    macro_nut_categories: macroNutList,
    pro_arguments: proList,
    contra_arguments: contraList,
    timestamp: Date.now()
  };

  if (existingIndex >= 0) {
    const oldEntry = globalSessionHistory[existingIndex];
    globalSessionHistory[existingIndex] = {
      ...oldEntry,
      lq_score: safeLq,
      s_tox: safeStox,
      n_nut: safeNnut,
      t_mikro: typeof tMikro === 'number' ? tMikro : oldEntry.t_mikro,
      t_makro: typeof tMakro === 'number' ? tMakro : oldEntry.t_makro,
      n_mikro: typeof nMikro === 'number' ? nMikro : oldEntry.n_mikro,
      n_makro: typeof nMakro === 'number' ? nMakro : oldEntry.n_makro,
      symmetry_score: safeSymmetry,
      toxic_snippets: toxList.length > 0 ? toxList : (oldEntry.toxic_snippets || []),
      nutrient_snippets: nutList.length > 0 ? nutList : (oldEntry.nutrient_snippets || []),
      macro_tox_categories: macroToxList.length > 0 ? macroToxList : (oldEntry.macro_tox_categories || []),
      macro_nut_categories: macroNutList.length > 0 ? macroNutList : (oldEntry.macro_nut_categories || []),
      pro_arguments: proList.length > 0 ? proList : (oldEntry.pro_arguments || []),
      contra_arguments: contraList.length > 0 ? contraList : (oldEntry.contra_arguments || []),
      timestamp: Date.now()
    };
  } else {
    globalSessionHistory.push(urlEntry);
  }

  // Snippets, Makro-Kategorien & Argumente global akkumulieren (ohne Duplikate)
  toxList.forEach((s) => {
    if (s && !globalToxicSnippets.includes(s)) {
      globalToxicSnippets.push(s);
    }
  });

  nutList.forEach((s) => {
    if (s && !globalNutrientSnippets.includes(s)) {
      globalNutrientSnippets.push(s);
    }
  });

  macroToxList.forEach((c) => {
    if (c && !globalMacroToxCategories.includes(c)) {
      globalMacroToxCategories.push(c);
    }
  });

  macroNutList.forEach((c) => {
    if (c && !globalMacroNutCategories.includes(c)) {
      globalMacroNutCategories.push(c);
    }
  });

  proList.forEach((p) => {
    if (p && !globalProArguments.includes(p)) {
      globalProArguments.push(p);
    }
  });

  contraList.forEach((c) => {
    if (c && !globalContraArguments.includes(c)) {
      globalContraArguments.push(c);
    }
  });

  // Mittelwerte berechnen
  let totalLq = 0;
  let totalStox = 0;
  let totalNnut = 0;
  let totalSymmetry = 0;
  const uniqueCount = Math.max(1, globalSessionHistory.length);

  globalSessionHistory.forEach((item) => {
    totalLq += typeof item.lq_score === 'number' ? item.lq_score : safeLq;
    totalStox += typeof item.s_tox === 'number' ? item.s_tox : safeStox;
    totalNnut += typeof item.n_nut === 'number' ? item.n_nut : safeNnut;
    totalSymmetry += typeof item.symmetry_score === 'number' ? item.symmetry_score : safeSymmetry;
  });

  const avgLq = parseFloat((totalLq / uniqueCount).toFixed(2));
  const avgStox = parseFloat((totalStox / uniqueCount).toFixed(2));
  const avgNnut = parseFloat((totalNnut / uniqueCount).toFixed(2));
  const avgSymmetry = parseFloat((totalSymmetry / uniqueCount).toFixed(1));

  // Kumuliertes unzerstörbares Gesamtpaket für den Vault erstellen und via store.put schreiben
  const cumulativeRecord = {
    biopsy_id: currentSessionId,
    session_id: currentSessionId,
    lq_score: avgLq,
    s_tox: avgStox,
    n_nut: avgNnut,
    symmetry_score: avgSymmetry,
    source_url: safeUrl,
    toxic_snippets: [...globalToxicSnippets],
    nutrient_snippets: [...globalNutrientSnippets],
    macro_tox_categories: [...globalMacroToxCategories],
    macro_nut_categories: [...globalMacroNutCategories],
    pro_arguments: [...globalProArguments],
    contra_arguments: [...globalContraArguments],
    session_history: [...globalSessionHistory],
    timestamp: Date.now()
  };

  await writeRecordToVault(cumulativeRecord);
  return cumulativeRecord;
}

// ==============================================================================
// CHROME RUNTIME MESSAGE LISTENER (HAUPTRELAIS)
// ==============================================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return;

  // 1. GLOBALEN ZUSTAND & SESSION-ID ABFRAGEN
  if (message.type === 'GET_GLOBAL_STATE') {
    sendResponse({ success: true, state: globalMetabolismState, sessionId: currentSessionId });
    return true;
  }

  if (message.type === 'GET_SESSION_ID') {
    sendResponse({ success: true, sessionId: currentSessionId });
    return true;
  }

  // 2. GLOBALEN ZUSTAND SETZEN & AUF ALLE TABS BROADCASTEN
  if (message.type === 'SET_GLOBAL_STATE') {
    globalMetabolismState = message.state || 'kryo';

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ qo_global_state: globalMetabolismState });
    }

    if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.query === 'function') {
      chrome.tabs.query({}, (tabs) => {
        if (!tabs || !tabs.length) return;
        tabs.forEach((tab) => {
          if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'GLOBAL_STATE_CHANGED',
              state: globalMetabolismState
            }).catch(() => {});
          }
        });
      });
    }

    sendResponse({ success: true, state: globalMetabolismState });
    return true;
  }

  // ============================================================================
  // 3. DER HARTE PHASEN-CUTTER BEI 'SAVE_BIOPSY' (ASYNCHRONE TRANSAKTIONS-KLAMMER)
  // ============================================================================
  if (message.type === 'SAVE_BIOPSY') {
    const biopsyData = message.data || {};
    const sealedSessionId = biopsyData.session_id || currentSessionId;

    // Nur Daten dieser spezifischen Phase erfassen
    if (Array.isArray(biopsyData.session_history)) {
      biopsyData.session_history.forEach((h) => {
        if (!h || !h.url) return;
        const exists = globalSessionHistory.some((item) => (typeof item === 'string' ? item === h.url : item.url === h.url));
        if (!exists) {
          globalSessionHistory.push(h);
        }
      });
    }

    if (Array.isArray(biopsyData.toxic_snippets)) {
      biopsyData.toxic_snippets.forEach((s) => {
        if (s && !globalToxicSnippets.includes(s)) globalToxicSnippets.push(s);
      });
    }

    if (Array.isArray(biopsyData.nutrient_snippets)) {
      biopsyData.nutrient_snippets.forEach((s) => {
        if (s && !globalNutrientSnippets.includes(s)) globalNutrientSnippets.push(s);
      });
    }

    if (Array.isArray(biopsyData.macro_tox_categories)) {
      biopsyData.macro_tox_categories.forEach((c) => {
        if (c && !globalMacroToxCategories.includes(c)) globalMacroToxCategories.push(c);
      });
    }

    if (Array.isArray(biopsyData.macro_nut_categories)) {
      biopsyData.macro_nut_categories.forEach((c) => {
        if (c && !globalMacroNutCategories.includes(c)) globalMacroNutCategories.push(c);
      });
    }

    if (Array.isArray(biopsyData.pro_arguments)) {
      biopsyData.pro_arguments.forEach((p) => {
        if (p && !globalProArguments.includes(p)) globalProArguments.push(p);
      });
    }

    if (Array.isArray(biopsyData.contra_arguments)) {
      biopsyData.contra_arguments.forEach((c) => {
        if (c && !globalContraArguments.includes(c)) globalContraArguments.push(c);
      });
    }

    if (globalSessionHistory.length === 0) {
      globalSessionHistory.push({
        url: biopsyData.source_url || (sender.tab ? sender.tab.url : 'about:blank'),
        lq_score: typeof biopsyData.lq_score === 'number' ? biopsyData.lq_score : 1.0,
        s_tox: typeof biopsyData.s_tox === 'number' ? biopsyData.s_tox : 0.5,
        n_nut: typeof biopsyData.n_nut === 'number' ? biopsyData.n_nut : 1.5,
        symmetry_score: typeof biopsyData.symmetry_score === 'number' ? biopsyData.symmetry_score : 100.0,
        toxic_snippets: [...globalToxicSnippets],
        nutrient_snippets: [...globalNutrientSnippets],
        macro_tox_categories: [...globalMacroToxCategories],
        macro_nut_categories: [...globalMacroNutCategories],
        pro_arguments: [...globalProArguments],
        contra_arguments: [...globalContraArguments],
        timestamp: Date.now()
      });
    }

    let totalLq = 0;
    let totalStox = 0;
    let totalNnut = 0;
    let totalSymmetry = 0;
    const count = Math.max(1, globalSessionHistory.length);

    globalSessionHistory.forEach((item) => {
      totalLq += typeof item.lq_score === 'number' ? item.lq_score : (typeof biopsyData.lq_score === 'number' ? biopsyData.lq_score : 1.0);
      totalStox += typeof item.s_tox === 'number' ? item.s_tox : (typeof biopsyData.s_tox === 'number' ? biopsyData.s_tox : 0.5);
      totalNnut += typeof item.n_nut === 'number' ? item.n_nut : (typeof biopsyData.n_nut === 'number' ? biopsyData.n_nut : 1.5);
      totalSymmetry += typeof item.symmetry_score === 'number' ? item.symmetry_score : (typeof biopsyData.symmetry_score === 'number' ? biopsyData.symmetry_score : 100.0);
    });

    const finalRecord = {
      biopsy_id: sealedSessionId,
      session_id: sealedSessionId,
      lq_score: parseFloat((totalLq / count).toFixed(2)),
      s_tox: parseFloat((totalStox / count).toFixed(2)),
      n_nut: parseFloat((totalNnut / count).toFixed(2)),
      symmetry_score: parseFloat((totalSymmetry / count).toFixed(1)),
      source_url: biopsyData.source_url || (globalSessionHistory[0] ? globalSessionHistory[0].url : 'about:blank'),
      toxic_snippets: [...globalToxicSnippets],
      nutrient_snippets: [...globalNutrientSnippets],
      macro_tox_categories: [...globalMacroToxCategories],
      macro_nut_categories: [...globalMacroNutCategories],
      pro_arguments: [...globalProArguments],
      contra_arguments: [...globalContraArguments],
      session_history: [...globalSessionHistory],
      timestamp: Date.now()
    };

    // ASYNCHRONE TRANS-SPEICHER-REGEL:
    // Der RAM-Reset erfolgt AUSSCHLIESSLICH im oncomplete-Handler der Transaktion!
    openVaultDB()
      .then((db) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(finalRecord);

        transaction.oncomplete = function () {
          // ERST HIER, WENN DIE DATEN SICHER AUF DER FESTPLATTE LIEGEN, ERFOLGT DER RESET!
          globalSessionHistory = [];
          globalToxicSnippets = [];
          globalNutrientSnippets = [];
          globalMacroToxCategories = [];
          globalMacroNutCategories = [];
          globalProArguments = [];
          globalContraArguments = [];
          const previousSessionId = sealedSessionId;
          currentSessionId = 'session_' + Date.now();
          console.log('[Q-O Background] Transaktion abgeschlossen. RAM-Gedächtnis JETZT steril resettet.');

          // Redundanz & Spiegelung in chrome.storage.local
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['qo_biopsies'], (res) => {
              let list = (res && Array.isArray(res.qo_biopsies)) ? res.qo_biopsies : [];
              list = list.filter((b) => b.biopsy_id !== finalRecord.biopsy_id);
              list.unshift(finalRecord);
              if (list.length > 30) list = list.slice(0, 30);
              chrome.storage.local.set({
                qo_biopsies: list,
                qo_current_session_id: currentSessionId
              });
            });
          }

          // Broadcast an alle Tabs (Labor aktualisieren & Content-Scripts rotieren)
          if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.query === 'function') {
            chrome.tabs.query({}, (tabs) => {
              if (!tabs || !tabs.length) return;
              tabs.forEach((tab) => {
                if (tab && tab.id) {
                  chrome.tabs.sendMessage(tab.id, {
                    type: 'BIOPSY_STORED',
                    record: finalRecord,
                    sealedSessionId: previousSessionId,
                    newSessionId: currentSessionId
                  }).catch(() => {});

                  chrome.tabs.sendMessage(tab.id, {
                    type: 'SESSION_ROTATED',
                    newSessionId: currentSessionId,
                    previousSessionId: previousSessionId
                  }).catch(() => {});
                }
              });
            });
          }

          sendResponse({
            success: true,
            record: finalRecord,
            sealedSessionId: previousSessionId,
            newSessionId: currentSessionId
          });
        };

        transaction.onerror = function (e) {
          console.error('[Q-O Background] Transaktions-Fehler beim Versiegeln der Biopsie:', e);
          sendResponse({ success: false, error: e.target ? e.target.error : 'Transaction Error' });
        };
      })
      .catch((err) => {
        console.warn('[Q-O Background] IndexedDB Fehler beim Versiegeln, Fallback auf chrome.storage:', err);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['qo_biopsies'], (res) => {
            let list = (res && Array.isArray(res.qo_biopsies)) ? res.qo_biopsies : [];
            list = list.filter((b) => b.biopsy_id !== finalRecord.biopsy_id);
            list.unshift(finalRecord);
            if (list.length > 30) list = list.slice(0, 30);
            
            globalSessionHistory = [];
            globalToxicSnippets = [];
            globalNutrientSnippets = [];
            globalMacroToxCategories = [];
            globalMacroNutCategories = [];
            globalProArguments = [];
            globalContraArguments = [];
            const previousSessionId = sealedSessionId;
            currentSessionId = 'session_' + Date.now();

            chrome.storage.local.set({
              qo_biopsies: list,
              qo_current_session_id: currentSessionId
            }, () => {
              sendResponse({
                success: true,
                record: finalRecord,
                sealedSessionId: previousSessionId,
                newSessionId: currentSessionId
              });
            });
          });
        } else {
          sendResponse({ success: false, error: err.message });
        }
      });

    return true;
  }

  // 4. ALLE GESPEICHERTEN KONSOLIDIERTEN BIOPSIEN ABFRAGEN
  if (message.type === 'GET_ALL_BIOPSIES') {
    openVaultDB()
      .then((db) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const idbRecords = req.result || [];
          if (idbRecords.length > 0) {
            sendResponse({ success: true, records: idbRecords });
          } else {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
              chrome.storage.local.get(['qo_biopsies'], (res) => {
                const list = (res && Array.isArray(res.qo_biopsies)) ? res.qo_biopsies : [];
                sendResponse({ success: true, records: list });
              });
            } else {
              sendResponse({ success: true, records: [] });
            }
          }
        };
        req.onerror = () => {
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['qo_biopsies'], (res) => {
              const list = (res && Array.isArray(res.qo_biopsies)) ? res.qo_biopsies : [];
              sendResponse({ success: true, records: list });
            });
          } else {
            sendResponse({ success: true, records: [] });
          }
        };
      })
      .catch(() => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['qo_biopsies'], (res) => {
            const list = (res && Array.isArray(res.qo_biopsies)) ? res.qo_biopsies : [];
            sendResponse({ success: true, records: list });
          });
        } else {
          sendResponse({ success: true, records: [] });
        }
      });
    return true;
  }

  // 5. LABOR ÖFFNEN / AKTIVIEREN (SINGLETON TAB-MANAGER MIT URSPRUNGS-GEDÄCHTNIS)
  if (message.type === 'OPEN_LABORATORY') {
    if (sender && sender.tab) {
      lastSourceTabId = sender.tab.id;
      lastSourceWindowId = sender.tab.windowId;
    }

    const biopsyId = message.biopsy_id || message.id || currentSessionId;
    const targetUrl = chrome.runtime.getURL(biopsyId ? 'index.html?id=' + encodeURIComponent(biopsyId) : 'index.html');

    if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.query === 'function') {
      const labBaseUrl = chrome.runtime.getURL('index.html');
      chrome.tabs.query({}, (tabs) => {
        const existingLabTab = tabs.find((t) => t.url && t.url.startsWith(labBaseUrl));
        if (existingLabTab && existingLabTab.id) {
          chrome.tabs.update(existingLabTab.id, { url: targetUrl, active: true }, () => {
            if (existingLabTab.windowId && chrome.windows) {
              chrome.windows.update(existingLabTab.windowId, { focused: true });
            }
            sendResponse({ success: true, tabId: existingLabTab.id, reused: true });
          });
        } else {
          chrome.tabs.create({ url: targetUrl, active: true }, (newTab) => {
            sendResponse({ success: true, tabId: newTab.id, reused: false });
          });
        }
      });
    } else {
      sendResponse({ success: true });
    }
    return true;
  }

  // 6. BEGLEITERMODUS: LABOR SCHLIESSEN & ZUM URSPRUNGS-TAB ZURÜCKKEHREN
  if (message.type === 'CLOSE_LABORATORY_AND_RETURN') {
    if (lastSourceTabId && typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.update(lastSourceTabId, { active: true }, () => {
        if (chrome.runtime.lastError) {
          console.warn('[Q-O Background] Ursprungs-Tab nicht mehr auffindbar:', chrome.runtime.lastError.message);
        }
      });
    }

    if (lastSourceWindowId && typeof chrome !== 'undefined' && chrome.windows) {
      chrome.windows.update(lastSourceWindowId, { focused: true }, () => {
        if (chrome.runtime.lastError) {}
      });
    }

    if (sender && sender.tab && sender.tab.id && typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.remove(sender.tab.id);
    }

    sendResponse({ success: true });
    return true;
  }

  // 7. TEXTANALYSE WEITERLEITEN & AKKUMULIEREN (POST /api/analyze)
  if (message.type === 'ANALYZE_TEXT') {
    const payload = {
      text: message.text || '',
      url: message.url || (sender.tab ? sender.tab.url : 'about:blank')
    };

    fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('HTTP-Fehler! Status: ' + response.status);
        }
        const data = await response.json();
        data.session_id = currentSessionId;

        const sTox = (data.details && typeof data.details.s_tox_final === 'number')
          ? data.details.s_tox_final
          : parseFloat(((1 - data.lq_score) * 4).toFixed(2));
        const nNut = (data.details && typeof data.details.n_nut_final === 'number')
          ? data.details.n_nut_final
          : parseFloat((data.lq_score * 3).toFixed(2));

        const tMikro = typeof data.t_mikro === 'number'
          ? data.t_mikro
          : ((data.details && typeof data.details.t_mikro === 'number') ? data.details.t_mikro : sTox);
        const tMakro = typeof data.t_makro === 'number'
          ? data.t_makro
          : ((data.details && typeof data.details.t_makro === 'number') ? data.details.t_makro : 0.0);
        const nMikro = typeof data.n_mikro === 'number'
          ? data.n_mikro
          : ((data.details && typeof data.details.n_mikro === 'number') ? data.details.n_mikro : nNut);
        const nMakro = typeof data.n_makro === 'number'
          ? data.n_makro
          : ((data.details && typeof data.details.n_makro === 'number') ? data.details.n_makro : 1.0);
        const symmetryScore = typeof data.symmetry_score === 'number'
          ? data.symmetry_score
          : ((data.details && typeof data.details.symmetry_score === 'number') ? data.details.symmetry_score : 100.0);

        const toxSnippets = Array.isArray(data.toxic_snippets) ? data.toxic_snippets : [];
        const nutSnippets = Array.isArray(data.nutrient_snippets) ? data.nutrient_snippets : [];
        const macroTox = Array.isArray(data.macro_tox_categories)
          ? data.macro_tox_categories
          : (Array.isArray(data.macro_reasons) ? data.macro_reasons : []);
        const macroNut = Array.isArray(data.macro_nut_categories) ? data.macro_nut_categories : [];

        const proArgs = Array.isArray(data.pro_arguments) ? data.pro_arguments : [];
        const contraArgs = Array.isArray(data.contra_arguments) ? data.contra_arguments : [];

        // Automatische Zwischenakkumulierung mit UNIQUE-URL-Filter & vollständigem 4-Kanal-Hybrid-Schema
        recordAnalysisCycle(
          payload.url,
          data.lq_score,
          sTox,
          nNut,
          toxSnippets,
          nutSnippets,
          macroTox,
          macroNut,
          proArgs,
          contraArgs,
          symmetryScore,
          tMikro,
          tMakro,
          nMikro,
          nMakro
        ).catch((err) => {
          console.warn('[Q-O Background] Zwischen-Akkumulierung Warnung:', err);
        });

        sendResponse({ success: true, data: data, sessionId: currentSessionId });
      })
      .catch((error) => {
        console.warn('[Q-O Background Relais] Backend-Fehler:', error.message);
        sendResponse({
          success: false,
          error: error.message,
          sessionId: currentSessionId,
          fallbackData: {
            biopsy_id: currentSessionId,
            session_id: currentSessionId,
            lq_score: 1.0,
            t_mikro: 0.0,
            t_makro: 0.0,
            n_mikro: 1.0,
            n_makro: 1.0,
            source_url: payload.url,
            toxic_snippets: [],
            nutrient_snippets: [],
            macro_tox_categories: [],
            macro_nut_categories: [],
            pro_arguments: [],
            contra_arguments: [],
            symmetry_score: 100.0,
            morphology_state: {
              class: 'q-o-hud-stable',
              pulse_frequency: 'smooth_gentle'
            }
          }
        });
      });

    return true;
  }

  // 8. LINGUISTISCHE SPÜLUNG WEITERLEITEN (POST /api/flush)
  if (message.type === 'FLUSH_TEXT' || message.type === 'EXECUTE_FLUSH' || message.type === 'FLUSH_BIOPSY') {
    const payload = {
      toxic_text: message.toxic_text || message.raw_text || '',
      toxic_snippets: Array.isArray(message.toxic_snippets) ? message.toxic_snippets : [],
      biopsy_id: message.biopsy_id || currentSessionId,
      source_url: message.source_url || message.url || ''
    };

    fetch(BACKEND_FLUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Flush-HTTP-Fehler! Status: ' + response.status);
        }
        const data = await response.json();
        sendResponse({ success: true, flush_result: data, data: data });
      })
      .catch((error) => {
        console.warn('[Q-O Background Relais] Flush-Relais Fehler:', error.message);
        sendResponse({
          success: false,
          error: error.message,
          fallbackData: {
            original_text: payload.toxic_text,
            neutralized_text: 'Sachverhalt: Affekt-Überladung durch linguistische Homöostase neutralisiert.',
            context_antidote: 'Forensischer Faktencheck: Alarmistische Signal-Muster wurden isoliert und wissenschaftlich bereinigt.',
            clean_alternative: 'Sachverhalt bereinigt.',
            lq_boosted: 1.25
          }
        });
      });

    return true;
  }

  // 9. VAULT LEEREN / STERILISIEREN
  if (message.type === 'CLEAR_BIOPSY_VAULT') {
    openVaultDB()
      .then((db) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
      })
      .catch((e) => console.warn('[Q-O Background] IndexedDB Clear Warnung:', e));

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ qo_biopsies: [] });
    }

    currentSessionId = 'session_' + Date.now();
    globalSessionHistory = [];
    globalToxicSnippets = [];
    globalNutrientSnippets = [];
    globalMacroToxCategories = [];
    globalMacroNutCategories = [];
    globalProArguments = [];
    globalContraArguments = [];

    sendResponse({ success: true, newSessionId: currentSessionId });
    return true;
  }
});
