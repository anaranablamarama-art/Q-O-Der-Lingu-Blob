/**
 * ==============================================================================
 * PROJEKT "Q-O" // BACKGROUND SERVICE WORKER (BACKGROUND.JS)
 * ==============================================================================
 * Privilegiertes Relais zur Umgehung von CORS- und PNA-Blockaden.
 * Lauscht auf Nachrichten von content.js und führt den Fetch an das
 * lokale Python-Backend (http://localhost:8000/api/analyze) sicher aus.
 * ==============================================================================
 */

const BACKEND_API_URL = 'http://localhost:8000/api/analyze';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'ANALYZE_TEXT') {
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
          throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }
        const data = await response.json();
        sendResponse({ success: true, data: data });
      })
      .catch((error) => {
        console.warn('[Q-O Background Relais] Backend-Fehler:', error.message);
        sendResponse({
          success: false,
          error: error.message,
          fallbackData: {
            biopsy_id: 'bio_offline_' + Date.now(),
            lq_score: 1.0,
            source_url: payload.url,
            morphology_state: {
              class: 'q-o-hud-stable',
              pulse_frequency: 'smooth_gentle'
            }
          }
        });
      });

    // Erforderlich für asynchrone sendResponse-Abwicklung in Chrome Extensions
    return true;
  }
});
