// ==============================================================================
// 🪐 PROJEKT "Q-O" // COMPONENT C: BACKGROUND.JS (DATENTRESOR)
// ==============================================================================
// GOLDSTANDARD REFIT:
// - Beseitigung des MV3 State-Loss (Verlustfreie Reaktivierung nach Idle-Terminierung)
// - Sofortige atomare Persistierung in chrome.storage.local & IndexedDB
// ==============================================================================

const BACKEND_API_URL = 'http://localhost:8000/api/analyze';
const BACKEND_FLUSH_URL = 'http://localhost:8000/api/flush';

const DB_NAME = 'QO_Metabolic_Vault';
const STORE_NAME = 'biopsy_archive';
const DB_VERSION = 1;

// 1. ATOMARE STATE-HELFER (CHROME.STORAGE.LOCAL)
async function getStorageData(keys) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(keys, (res) => resolve(res || {}));
    } else {
      resolve({});
    }
  });
}

async function setStorageData(data) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(data, () => resolve());
    } else {
      resolve();
    }
  });
}

// 2. INDEXEDDB TRANSAKTIONS-HELFER
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

async function writeRecordToVault(record) {
  try {
    const db = await openVaultDB();
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(record);

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(record);
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('[Q-O Background] IDB-Transaktion fehlgeschlagen, Fallback auf Storage:', err);
  }

  // Atomar auch in chrome.storage.local spiegeln
  const current = await getStorageData(['qo_biopsies', 'qo_current_session_id']);
  let list = Array.isArray(current.qo_biopsies) ? current.qo_biopsies : [];
  list = list.filter((b) => b.biopsy_id !== record.biopsy_id);
  list.unshift(record);
  if (list.length > 30) list = list.slice(0, 30);

  await setStorageData({
    qo_biopsies: list,
    qo_current_session_id: record.session_id || current.qo_current_session_id
  });

  return record;
}

// 3. CHROME RUNTIME MESSAGE LISTENER (ATOMAR & STATELESS)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return;

  // A. LQ_SCORE_UPDATED -> ATOMARE PERSISTIERUNG
  if (message.type === 'LQ_SCORE_UPDATED') {
    (async () => {
      const store = await getStorageData(['qo_current_session_id']);
      const sessionId = message.session_id || store.qo_current_session_id || ('session_' + Date.now());
      const rawScore = typeof message.lq_score === 'number' ? message.lq_score : 1.0;
      const adjustedScore = typeof message.adjusted_score === 'number' ? message.adjusted_score : rawScore;
      const currentUrl = message.source_url || (sender.tab ? sender.tab.url : 'about:blank');

      const quickRecord = {
        biopsy_id: sessionId,
        session_id: sessionId,
        lq_score: rawScore,
        adjusted_score: adjustedScore,
        source_url: currentUrl,
        timestamp: Date.now()
      };

      await writeRecordToVault(quickRecord);
      sendResponse({ success: true, recorded: true });
    })();
    return true;
  }

  // B. GLOBAL STATE & SESSION-ID
  if (message.type === 'GET_GLOBAL_STATE') {
    (async () => {
      const store = await getStorageData(['qo_global_state', 'qo_current_session_id']);
      sendResponse({
        success: true,
        state: store.qo_global_state || 'stable',
        sessionId: store.qo_current_session_id || ('session_' + Date.now())
      });
    })();
    return true;
  }

  if (message.type === 'SET_GLOBAL_STATE') {
    (async () => {
      const newState = message.state || 'stable';
      await setStorageData({ qo_global_state: newState });

      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab && tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'GLOBAL_STATE_CHANGED',
                state: newState
              }).catch(() => {});
            }
          });
        });
      }
      sendResponse({ success: true, state: newState });
    })();
    return true;
  }

  // C. SAVE_BIOPSY -> ATOMARE TRANSAKTIONS-KLAMMER
  if (message.type === 'SAVE_BIOPSY') {
    (async () => {
      const biopsyData = message.data || {};
      const sealedSessionId = biopsyData.session_id || ('session_' + Date.now());
      const newSessionId = 'session_' + (Date.now() + 1);

      const finalRecord = {
        biopsy_id: sealedSessionId,
        session_id: sealedSessionId,
        lq_score: typeof biopsyData.lq_score === 'number' ? biopsyData.lq_score : 1.0,
        s_tox: typeof biopsyData.s_tox === 'number' ? biopsyData.s_tox : 0.5,
        n_nut: typeof biopsyData.n_nut === 'number' ? biopsyData.n_nut : 1.5,
        symmetry_score: typeof biopsyData.symmetry_score === 'number' ? biopsyData.symmetry_score : 100.0,
        source_url: biopsyData.source_url || (sender.tab ? sender.tab.url : 'about:blank'),
        toxic_snippets: Array.isArray(biopsyData.toxic_snippets) ? biopsyData.toxic_snippets : [],
        nutrient_snippets: Array.isArray(biopsyData.nutrient_snippets) ? biopsyData.nutrient_snippets : [],
        macro_tox_categories: Array.isArray(biopsyData.macro_tox_categories) ? biopsyData.macro_tox_categories : [],
        macro_nut_categories: Array.isArray(biopsyData.macro_nut_categories) ? biopsyData.macro_nut_categories : [],
        pro_arguments: Array.isArray(biopsyData.pro_arguments) ? biopsyData.pro_arguments : [],
        contra_arguments: Array.isArray(biopsyData.contra_arguments) ? biopsyData.contra_arguments : [],
        session_history: Array.isArray(biopsyData.session_history) ? biopsyData.session_history : [],
        timestamp: Date.now()
      };

      await writeRecordToVault(finalRecord);
      await setStorageData({ qo_current_session_id: newSessionId });

      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab && tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'BIOPSY_STORED',
                record: finalRecord,
                sealedSessionId: sealedSessionId,
                newSessionId: newSessionId
              }).catch(() => {});
              chrome.tabs.sendMessage(tab.id, {
                type: 'SESSION_ROTATED',
                newSessionId: newSessionId,
                previousSessionId: sealedSessionId
              }).catch(() => {});
            }
          });
        });
      }

      sendResponse({
        success: true,
        record: finalRecord,
        sealedSessionId: sealedSessionId,
        newSessionId: newSessionId
      });
    })();
    return true;
  }

  // D. GET_ALL_BIOPSIES
  if (message.type === 'GET_ALL_BIOPSIES') {
    (async () => {
      try {
        const db = await openVaultDB();
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => sendResponse({ success: true, records: req.result || [] });
        req.onerror = async () => {
          const fallback = await getStorageData(['qo_biopsies']);
          sendResponse({ success: true, records: fallback.qo_biopsies || [] });
        };
      } catch (e) {
        const fallback = await getStorageData(['qo_biopsies']);
        sendResponse({ success: true, records: fallback.qo_biopsies || [] });
      }
    })();
    return true;
  }

  // E. OPEN_LABORATORY
  if (message.type === 'OPEN_LABORATORY') {
    const biopsyId = message.biopsy_id || message.id;
    const targetUrl = chrome.runtime.getURL(biopsyId ? 'index.html?id=' + encodeURIComponent(biopsyId) : 'index.html');

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
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

  // F. ANALYZE_TEXT (PROXY POST /api/analyze)
  if (message.type === 'ANALYZE_TEXT') {
    const payload = {
      text: message.text || '',
      url: message.url || (sender.tab ? sender.tab.url : 'about:blank')
    };

    fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        sendResponse({ success: true, data: data });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  // G. FLUSH_TEXT (PROXY POST /api/flush)
  if (message.type === 'FLUSH_TEXT' || message.type === 'EXECUTE_FLUSH' || message.type === 'FLUSH_BIOPSY') {
    const payload = {
      toxic_text: message.toxic_text || '',
      toxic_snippets: Array.isArray(message.toxic_snippets) ? message.toxic_snippets : [],
      biopsy_id: message.biopsy_id || '',
      source_url: message.source_url || message.url || ''
    };

    fetch(BACKEND_FLUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Flush HTTP ' + response.status);
        const data = await response.json();
        sendResponse({ success: true, flush_result: data, data: data });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});
