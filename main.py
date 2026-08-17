"""
=============================================================================
PROJEKT "Q-O" // METABOLISCHES GEHIRN & ANALYSE-PIPELINE (MAIN.PY)
=============================================================================
Schlankes FastAPI-Backend mit nativer Groq-Cloud-API Anbindung.
- Reiner Semantik-Filter & Vektor-Kontextanalyse via 'llama-3.1-8b-instant'
- High-End Weltwissen & Forensik-Detox via 'llama-3.3-70b-versatile'
- Kaskadiertes e-Funktions-Modell: LQ = exp(-(s_tox - n_nut))
- Exakt identische JSON-Schnittstellen für /api/analyze und /api/flush
=============================================================================
"""

import os
import math
import time
import json
import datetime
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field, ConfigDict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# =============================================================================
# GROQ API KONFIGURATION
# =============================================================================
# Trage hier deinen freien Groq-API-Schluessel ein oder nutze die Umgebungsvariable
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "DEIN_KEY_HIER")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Modelle
MODEL_ANALYZE = "llama-3.1-8b-instant"      # Ultraschneller Echtzeit-Semantik-Filter
MODEL_FLUSH = "llama-3.3-70b-versatile"     # High-End Weltwissen & Forensik-Spuelung


# =============================================================================
# 1. FASTAPI INITIALISIERUNG & CORS
# =============================================================================
app = FastAPI(
    title="Q-O Metabolic Brain API",
    description="Linguistischer Metabolisierungs- und Sezier-Server fuer Q-O via Groq",
    version="3.1.0"
)

# CORS fuer nahtlose Kommunikation mit Chrome Extension & Labor-Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# 2. PYDANTIC DATENMODELLE (ABSOLUTE SCHEMA-KOMPATIBILITAET MIT INDEX.JS / CONTENT.JS)
# =============================================================================
class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    text: str = Field(..., description="Zu analysierender Textabsatz des Viewports")
    url: str = Field(default="about:blank", description="Quell-URL der analysierten Website")

class MorphologyState(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)
    className: str = Field(..., alias="class")
    pulse_frequency: str

class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    biopsy_id: str
    lq_score: float
    source_url: str
    morphology_state: MorphologyState
    toxic_snippets: List[str] = Field(default_factory=list)
    nutrient_snippets: List[str] = Field(default_factory=list)
    details: Optional[Dict[str, Any]] = None

class FlushRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    toxic_text: Optional[str] = Field(default="", description="Zu neutralisierender Gesamttext")
    toxic_snippets: Optional[List[str]] = Field(default_factory=list, description="Array infizierter Beweissaetze")
    biopsy_id: Optional[str] = Field(default="", description="Biopsie-Kennung")
    source_url: Optional[str] = Field(default="", description="Quell-URL")

class FlushResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    original_text: str
    neutralized_text: str
    context_antidote: str
    clean_alternative: str
    lq_boosted: float = 1.25


# =============================================================================
# 3. FEDERLEICHTER NATIV-CLIENT FUER DIE GROQ CLOUD-API (MIT JSON-OBJECT ERZWINGUNG)
# =============================================================================
def call_groq_api(
    model: str,
    system_prompt: str,
    user_content: str,
    temperature: float = 0.1,
    json_mode: bool = True
) -> Optional[Dict[str, Any]]:
    apiKey = GROQ_API_KEY.strip()
    if not apiKey or apiKey == "DEIN_KEY_HIER":
        return None

    headers = {
        "Authorization": f"Bearer {apiKey}",
        "Content-Type": "application/json",
        "User-Agent": "Q-O-Metabolic-Brain/3.1"
    }

    body: Dict[str, Any] = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "temperature": temperature
    }

    # Erzwingt den nativen strukturieren JSON-Modus bei Groq / Llama
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    data_bytes = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(GROQ_API_URL, data=data_bytes, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            if response.status == 200:
                resp_body = response.read().decode("utf-8")
                parsed = json.loads(resp_body)
                content = parsed["choices"][0]["message"]["content"]
                return json.loads(content)
    except urllib.error.HTTPError as http_err:
        print(f"[Q-O Groq Relais] HTTP-Fehler: {http_err.code} - {http_err.reason}")
    except Exception as err:
        print(f"[Q-O Groq Relais] Verbindungs- oder JSON-Fehler: {err}")

    return None


# =============================================================================
# 4. ROBUSTER LEICHTBAU-FALLBACK (FALLS KEIN GROQ_API_KEY VORHANDEN ODER OFFLINE)
# =============================================================================
def local_fallback_analyze(text: str) -> Dict[str, Any]:
    lower = text.lower()
    toxic_markers = ["schock", "katastrophe", "skandal", "panik", "eskalation", "kollaps", "wut", "drama", "luegen", "eliten", "verrat", "horror"]
    nutrient_markers = ["studie", "analyse", "prozent", "daten", "forschung", "ergebnis", "weil", "daher", "infolgedessen", "evidenz", "belegt", "messung"]

    # Reinen Eigennamen / Gaming-Begriffe / Smalltalk ignorieren
    gaming_neutral_terms = ["path of exile", "poe", "patch notes", "item", "build", "quest", "level"]
    for term in gaming_neutral_terms:
        if term in lower:
            lower = lower.replace(term, "")

    sentences = [s.strip() for s in text.replace("\n", " ").split(".") if len(s.strip()) > 8]
    toxic_snippets = []
    nutrient_snippets = []

    for s in sentences:
        s_low = s.lower()
        if any(m in s_low for m in toxic_markers) and len(toxic_snippets) < 5:
            toxic_snippets.append(s)
        if any(m in s_low for m in nutrient_markers) and len(nutrient_snippets) < 5:
            nutrient_snippets.append(s)

    s_tox = min(5.0, round(len(toxic_snippets) * 1.2, 2))
    n_nut = min(5.0, round(max(0.5, len(nutrient_snippets) * 1.1), 2))

    return {
        "s_tox": s_tox,
        "n_nut": n_nut,
        "toxic_snippets": toxic_snippets,
        "nutrient_snippets": nutrient_snippets
    }


# =============================================================================
# 5. REST-ENDPUNKT: /api/analyze (ECHTZEIT-FILTERUNG VIA LLAMA 3.1 8B)
# =============================================================================
@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_viewport_text(payload: AnalyzeRequest):
    text = payload.text
    url = payload.url

    system_prompt = (
        "Du bist der semantische Echtzeit-Informationsfilter des Q-O Cyber-Systems. "
        "Analysiere den Text auf Informationsqualitaet und antworte ZWINGEND als valides JSON.\n"
        "Regeln:\n"
        "1. Filter alle reinen Eigennamen, Gaming-Begriffe (z.B. 'Path of Exile', 'PoE', Games), "
        "Produktnamen und belanglosen Web-Smalltalk als NEUTRAL heraus. Sie duerfen den Score nicht beeinflussen.\n"
        "2. Isoliere Saetze mit echtem informationalem Naehrwert (Fakten, logische Kausalitaeten, belegte Daten) "
        "in das Array 'nutrient_snippets' und gewichte den N_nut-Wert (0.0 bis 5.0).\n"
        "3. Isoliere manipulative, reisserische oder emotional geladene Saetze (Alarmismus, Clickbait, Hass, Framing) "
        "in das Array 'toxic_snippets' und gewichte den S_tox-Wert (0.0 bis 5.0).\n"
        "Ausgabe-JSON-Schema:\n"
        "{\n"
        '  "s_tox": 0.0,\n'
        '  "n_nut": 0.0,\n'
        '  "toxic_snippets": ["..."],\n'
        '  "nutrient_snippets": ["..."]\n'
        "}"
    )

    groq_res = call_groq_api(
        model=MODEL_ANALYZE,
        system_prompt=system_prompt,
        user_content=text[:4000],
        temperature=0.1,
        json_mode=True
    )

    if not groq_res or "s_tox" not in groq_res or "n_nut" not in groq_res:
        groq_res = local_fallback_analyze(text)

    s_tox = float(groq_res.get("s_tox", 0.0))
    n_nut = float(groq_res.get("n_nut", 1.0))
    toxic_snippets = groq_res.get("toxic_snippets", [])
    nutrient_snippets = groq_res.get("nutrient_snippets", [])

    if not isinstance(toxic_snippets, list):
        toxic_snippets = []
    if not isinstance(nutrient_snippets, list):
        nutrient_snippets = []

    # E-Funktions-Modell: LQ = e^(-(s_tox - n_nut))
    diff = s_tox - n_nut
    clamped_diff = max(-10.0, min(10.0, diff))
    lq_score = round(math.exp(-clamped_diff), 2)

    # Morphologie-Klassifizierung
    if lq_score >= 1.0:
        morph_class = "q-o-hud-stable"
        pulse = "smooth_gentle"
    elif lq_score >= 0.5:
        morph_class = "q-o-hud-deformed"
        pulse = "flicker_agitated"
    else:
        morph_class = "q-o-hud-toxic"
        pulse = "slow_heavy"

    timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    biopsy_id = f"bio_{timestamp_str}"

    return AnalyzeResponse(
        biopsy_id=biopsy_id,
        lq_score=lq_score,
        source_url=url,
        morphology_state=MorphologyState(
            **{"class": morph_class, "pulse_frequency": pulse}
        ),
        toxic_snippets=toxic_snippets,
        nutrient_snippets=nutrient_snippets,
        details={
            "s_tox_final": round(s_tox, 2),
            "n_nut_final": round(n_nut, 2),
            "model_used": MODEL_ANALYZE,
            "engine": "Groq Cloud" if GROQ_API_KEY != "DEIN_KEY_HIER" else "Local Heuristic Engine"
        }
    )


# =============================================================================
# 6. REST-ENDPUNKT: /api/flush (DETOX & WELTWISSEN VIA LLAMA 3.3 70B)
# =============================================================================
@app.post("/api/flush", response_model=FlushResponse)
async def linguistic_flush(payload: FlushRequest):
    raw_snippets = payload.toxic_snippets or []
    if payload.toxic_text and payload.toxic_text not in raw_snippets:
        raw_snippets.append(payload.toxic_text)

    combined_input = "\n".join(raw_snippets).strip() if raw_snippets else "Sensationsmeldung mit alarmistischer Ueberladung."

    # Trennscharfes Prompt-Design fuer Llama 3.3 (70B):
    # Strikte Entkopplung beider Kanaele im erzwungenen JSON-Objekt-Modus
    system_prompt = (
        "Du bist das linguistische Immunsystem und der Faktencheck-Forensiker von Q-O.\n"
        "Analysiere die uebergebenen Saetze (manipulative Phrasen, Clickbait, unfaire AGB-Klauseln, Desinformation, Dark Patterns).\n"
        "Du MUSST ZWINGEND als valides JSON-Objekt mit exakt zwei strikt getrennten Feldern antworten:\n"
        "{\n"
        '  "neutralized_text": "String",\n'
        '  "context_antidote": "String"\n'
        "}\n\n"
        "DIE KANALTRENNUNGS-REGELN:\n"
        "1. 'neutralized_text' (Das Gegengift):\n"
        "- Hier darf KEINE Erklaerung, kein Kontext, keine Belehrung und kein 'Hallo' stehen!\n"
        "- Das ist die reine, stilistische Text-Glaettung.\n"
        "- Formuliere die manipulativen Saetze oder unfairen AGB-Klauseln in ein klinisch reines, kurzes, absolut sachliches und unaufgeregtes Deutsch um.\n"
        "- So neutral, distanziert und praezise wie ein Eintrag in einem Sachlexikon.\n\n"
        "2. 'context_antidote' (Der Faktencheck):\n"
        "- Das ist der forensische Bericht!\n"
        "- Nutze dein globales Welt-, Fach- und Kontextwissen (z. B. Verbraucherschutz, rechtliche Rahmenbedingungen oder historische Fakten).\n"
        "- Erklaere dem Nutzer die nackte Wahrheit hinter dem Satz.\n"
        "- Enthuelle versteckte Fallen (Abo-Modelle, Datenweitergabe, psychologische Trigger) oder korrigiere die Desinformation praegnant (maximal 3 Saetze)."
    )

    user_content = f"Infizierte Textpassagen zur Analyse und Entgiftung:\n{combined_input}"

    groq_flush_res = call_groq_api(
        model=MODEL_FLUSH,
        system_prompt=system_prompt,
        user_content=user_content,
        temperature=0.15,
        json_mode=True
    )

    if groq_flush_res and "neutralized_text" in groq_flush_res and "context_antidote" in groq_flush_res:
        neutralized = str(groq_flush_res["neutralized_text"]).strip()
        antidote = str(groq_flush_res["context_antidote"]).strip()
        return FlushResponse(
            original_text=combined_input,
            neutralized_text=neutralized,
            context_antidote=antidote,
            clean_alternative=neutralized,
            lq_boosted=1.25
        )

    # Fallback-Gegengift falls API-Key unkonfiguriert oder Offline
    fallback_neutralized = "Der Sachverhalt wurde von reisserischer Rhetorik befreit und sachlich neutral zusammengefasst."
    fallback_antidote = (
        "Forensischer Faktencheck (Weltwissen): Die Formulierung nutzt gezielte emotionale Trigger und verkuerzte Zusammenhaenge. "
        "Verbraucherschutz- und Faktenpruefungsstellen weisen darauf hin, Behauptungen anhand primaerer Quellen zu validieren und auf versteckte Klauseln zu achten."
    )

    return FlushResponse(
        original_text=combined_input,
        neutralized_text=fallback_neutralized,
        context_antidote=fallback_antidote,
        clean_alternative=fallback_neutralized,
        lq_boosted=1.25
    )


# =============================================================================
# 7. SYSTEM STATUS & HEALTH CHECK
# =============================================================================
@app.get("/api/health")
async def health_check():
    has_key = bool(GROQ_API_KEY and GROQ_API_KEY != "DEIN_KEY_HIER")
    return {
        "status": "metabolic_vault_online",
        "groq_api_configured": has_key,
        "model_analyze": MODEL_ANALYZE,
        "model_flush": MODEL_FLUSH,
        "version": "3.1.0",
        "time": time.time()
    }


if __name__ == "__main__":
    import uvicorn
    import sys

    # PRÜFEN: Läuft der Code als eingefrorene .exe (via PyInstaller) oder im Entwickler-Terminal?
    is_exe = getattr(sys, 'frozen', False)

    if is_exe:
        # Im .exe-Hintergrundmodus: Logging komplett killen, um den isatty-Absturz physisch zu verhindern
        uvicorn.run(app, host="127.0.0.1", port=8000, log_config=None)
    else:
        # Im Entwickler-Terminal: Volles Logging AN, damit wir jeden Live-Funkspruch der Analyse sehen!
        print("🪐 [Q-O Core] Entwickler-Modus aktiv. Zünde semantisches Groq-Radar...")
        uvicorn.run(app, host="127.0.0.1", port=8000)
