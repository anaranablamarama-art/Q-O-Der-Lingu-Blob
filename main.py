"""
=============================================================================
PROJEKT "Q-O" // METABOLISCHES GEHIRN & ANALYSE-PIPELINE (MAIN.PY)
=============================================================================
FastAPI-Backend für das Live-Browser-HUD und das Drei-Zonen-Sezier-Labor.
- Kaskadiertes e-Funktions-Modell: LQ = exp(-(S_tox_final - N_nut_final))
- Zweig 1 (Toxizität): Regex Vorfilterung (Alpha/Beta) + Sentiment-BERT-Sensor
- Zweig 2 (Nährstoff): Regex Fakten/Logik + Gemini Validierungs-Sezierer
- REST-Schnittstellen: /api/analyze und /api/flush
=============================================================================
"""

import os
import re
import math
import time
import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Optionales Google GenAI SDK (nutzt Umgebungsvariable GEMINI_API_KEY)
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


# =============================================================================
# 1. FASTAPI INITIALISIERUNG & CORS
# =============================================================================
app = FastAPI(
    title="Q-O Metabolic Brain API",
    description="Linguistischer Metabolisierungs- und Sezier-Server für Q-O",
    version="1.0.0"
)

# CORS für nahtlose Kommunikation mit Chrome Extension & Labor-Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Für Browser-Extension & lokales Dashboard
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# 2. PYDANTIC DATENMODELLE (SCHEMA-INTEGRITÄT)
# =============================================================================
class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Zu analysierender Textabsatz des Viewports")
    url: str = Field(default="about:blank", description="Quell-URL der analysierten Website")

class MorphologyState(BaseModel):
    className: str = Field(..., alias="class")
    pulse_frequency: str

    class Config:
        populate_by_name = True

class AnalyzeResponse(BaseModel):
    biopsy_id: str
    lq_score: float
    source_url: str
    morphology_state: MorphologyState
    details: Optional[Dict[str, Any]] = None

class FlushRequest(BaseModel):
    toxic_text: str = Field(..., description="Zu neutralisierender Text")

class FlushResponse(BaseModel):
    original_text: str
    clean_alternative: str


# =============================================================================
# 3. REGEX-PATTERNS FÜR STATISTISCHE VORFILTERUNG
# =============================================================================
# Toxin Alpha: Clickbait & Alarmismus
REGEX_TOXIN_ALPHA = re.compile(
    r"\b(Schock|Katastrophe|Unglaublich|Enthüllung|Skandal|Panik|Wahnsinn|Alarm|Horror|Geheim|Zerstörung|Fassungslos|Eskalation|Wut)\b",
    re.IGNORECASE
)

# Toxin Beta: Ideologisches Framing & Polarisierung
REGEX_TOXIN_BETA = re.compile(
    r"\b(Mainstream|Systemmedien|Verrat|Umerziehung|Lügenpresse|Diktatur|Volksverräter|Zensur|Propaganda|Marionetten|Gleichschaltung|Eliten)\b",
    re.IGNORECASE
)

# Nährstoff - Fakten: Zahlen, Prozentangaben, Jahre, Studien
REGEX_FACTS = re.compile(
    r"(\d+([.,]\d+)?\s*%|\b\d{4}\b|\b(Studie|Institut|Untersuchung|Statistik|Daten|Quelle|Universität|Forscher|Analyse|Peer-Review|Messung)\b)",
    re.IGNORECASE
)

# Nährstoff - Logik: Kausale Konjunktionen & Begründungen
REGEX_LOGIC = re.compile(
    r"\b(weil|daher|infolgedessen|folglich|aufgrund|deshalb|demnach|somit|weshalb|dadurch|insofern|vorausgesetzt|schlussfolgernd)\b",
    re.IGNORECASE
)


# =============================================================================
# 4. KI-SENSORIK & KASKADEN-LOGIK
# =============================================================================
def get_sentiment_bert_factor(text: str) -> float:
    """
    Simuliert/berechnet den Aggressions-Multiplikator P_BERT (1.0 bis 3.0).
    Prüft Großbuchstaben-Häufigkeit, Ausrufezeichen-Kaskaden und affektive Ladung.
    """
    if not text.strip():
        return 1.0

    score = 1.0

    # 1. Ausrufezeichen-Häufungen
    exclamations = text.count("!")
    if exclamations >= 3:
        score += 0.8
    elif exclamations >= 1:
        score += 0.3

    # 2. CAPSLOCK / Schreien (Wörter > 3 Buchstaben)
    words = text.split()
    caps_words = [w for w in words if len(w) > 3 and w.isupper()]
    if len(caps_words) >= 3:
        score += 0.9
    elif len(caps_words) >= 1:
        score += 0.4

    # 3. Emotionale / affektive Adjektive
    aggressive_cues = re.findall(
        r"\b(unfassbar|skrupellos|schamlos|widerlich|radikal|brutal|abartig|kriminell)\b",
        text,
        re.IGNORECASE
    )
    score += len(aggressive_cues) * 0.5

    # Strikt begrenzen zwischen 1.0 (neutral) und 3.0 (hochgradig toxisch)
    return min(3.0, max(1.0, round(score, 2)))


async def get_gemini_validity_factor(text: str) -> float:
    """
    Logischer Seziertisch via Gemini Light API (oder Heuristik-Fallback).
    Prüft argumentative Konsistenz und liefert S_Gemini (0.1 bis 1.0).
    """
    api_key = os.environ.get("GEMINI_API_KEY")

    if GEMINI_AVAILABLE and api_key:
        try:
            client = genai.Client(api_key=api_key)
            prompt = (
                "Bewerte die argumentative und logische Validität des folgenden Textes auf einer "
                "Skala von 0.1 bis 1.0 (0.1 = reine Fake News/unbelegte Hetze/Zirkelschluss, 1.0 = exakte wissenschaftliche Logik/Fundierung).\n"
                "Antworte NUR mit einer einzigen Zahl zwischen 0.1 und 1.0.\n\n"
                f"Text:\n{text[:1000]}"
            )

            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            raw_text = response.text.strip()
            match = re.search(r"(\d+(\.\d+)?)", raw_text)
            if match:
                val = float(match.group(1))
                return min(1.0, max(0.1, round(val, 2)))
        except Exception as e:
            print(f"[Q-O Brain] Gemini API Call fehlgeschlagen, nutze Heuristik: {e}")

    # Robuster Heuristik-Fallback:
    # Manipulative Texte mit hoher Wortdichte, aber ohne Kausalverknüpfungen abwerten
    words = text.split()
    if len(words) < 5:
        return 0.5

    logic_count = len(REGEX_LOGIC.findall(text))
    facts_count = len(REGEX_FACTS.findall(text))

    if facts_count > 3 and logic_count == 0:
        # Pseudo-Fakten ohne logische Herleitung (Zirkelschluss-Indikator)
        return 0.25
    elif logic_count >= 2 and facts_count >= 1:
        return 0.85
    elif facts_count >= 1:
        return 0.65
    return 0.40


# =============================================================================
# 5. REST ENDPUNKTE
# =============================================================================

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_viewport_text(payload: AnalyzeRequest):
    """
    Zweigeteilte Kaskaden-Berechnung nach dem metabolischen Gesetz:
    LQ = e^(-(S_tox_final - N_nut_final))
    """
    text = payload.text
    url = payload.url

    # -------------------------------------------------------------------------
    # ZWEIG 1: TOXIZITÄT (S_tox_final)
    # -------------------------------------------------------------------------
    toxin_alpha_matches = REGEX_TOXIN_ALPHA.findall(text)
    toxin_beta_matches = REGEX_TOXIN_BETA.findall(text)

    count_alpha = len(toxin_alpha_matches)
    count_beta = len(toxin_beta_matches)

    p_bert = get_sentiment_bert_factor(text)
    s_tox_final = (count_alpha + count_beta) * p_bert

    # -------------------------------------------------------------------------
    # ZWEIG 2: NÄHRWERT (N_nut_final)
    # -------------------------------------------------------------------------
    facts_matches = REGEX_FACTS.findall(text)
    logic_matches = REGEX_LOGIC.findall(text)

    count_facts = len(facts_matches)
    count_logic = len(logic_matches)

    s_gemini = await get_gemini_validity_factor(text)
    n_nut_final = (count_facts + count_logic) * s_gemini

    # -------------------------------------------------------------------------
    # 3. DAS E-FUNKTIONS-MODELL: LQ = e^(-(S_tox - N_nut))
    # -------------------------------------------------------------------------
    exponent = -(s_tox_final - n_nut_final)
    # Schutz vor mathematischem Überlauf
    clamped_exponent = max(-10.0, min(10.0, exponent))
    lq_score = round(math.exp(clamped_exponent), 2)

    # Morphologie-Zustand für das Widget / Dashboard ableiten
    if lq_score >= 1.0:
        morph_class = "q-o-hud-stable"
        pulse = "smooth_gentle"
    elif lq_score >= 0.5:
        morph_class = "q-o-hud-deformed"
        pulse = "flicker_agitated"
    else:
        morph_class = "q-o-hud-toxic"
        pulse = "slow_heavy"

    # Eindeutige Biopsie-ID generieren (Format: bio_YYYYMMDD_HHMMSS)
    timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    biopsy_id = f"bio_{timestamp_str}"

    return AnalyzeResponse(
        biopsy_id=biopsy_id,
        lq_score=lq_score,
        source_url=url,
        morphology_state=MorphologyState(
            **{"class": morph_class, "pulse_frequency": pulse}
        ),
        details={
            "s_tox_final": round(s_tox_final, 2),
            "p_bert_multiplier": p_bert,
            "toxin_alpha_count": count_alpha,
            "toxin_beta_count": count_beta,
            "n_nut_final": round(n_nut_final, 2),
            "s_gemini_factor": s_gemini,
            "facts_count": count_facts,
            "logic_count": count_logic
        }
    )


@app.post("/api/flush", response_model=FlushResponse)
async def linguistic_flush(payload: FlushRequest):
    """
    Linguistische Spülung (Live-Detox im Arbeitsspeicher des Seziertisches).
    Neutralisiert Framing, Clickbait und affektive Überladung.
    """
    raw_text = payload.toxic_text
    api_key = os.environ.get("GEMINI_API_KEY")

    if GEMINI_AVAILABLE and api_key:
        try:
            client = genai.Client(api_key=api_key)
            system_instruction = (
                "Übersetze diesen manipulativen oder emotional aufgeladenen Text in eine absolut "
                "sachliche, neutrale und faktenbasierte Sprache. Isoliere den reinen Informationsgehalt, "
                "ohne das Framing zu übernehmen. Antworte direkt mit dem bereinigten deutschen Text."
            )

            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=f"{system_instruction}\n\nZu bereinigender Text:\n{raw_text}"
            )
            clean_text = response.text.strip()
            return FlushResponse(original_text=raw_text, clean_alternative=clean_text)
        except Exception as e:
            print(f"[Q-O Brain] Flush API Error, Fallback aktiv: {e}")

    # Robuste, deterministische Bereinigung (Fallback)
    cleaned = raw_text
    # Entferne typische Toxin-Alpha Triggerwörter
    cleaned = REGEX_TOXIN_ALPHA.sub("", cleaned)
    # Entferne typische Toxin-Beta Framingbegriffe
    cleaned = REGEX_TOXIN_BETA.sub("", cleaned)
    # Entferne überflüssige Satzzeichen
    cleaned = re.sub(r"!+", ".", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()

    if not cleaned:
        cleaned = "Sachverhalt wurde auf neutrale Basisdaten reduziert."

    return FlushResponse(
        original_text=raw_text,
        clean_alternative=f"[Neutralisiert]: {cleaned}"
    )


# =============================================================================
# 6. HEALTH CHECK
# =============================================================================
@app.get("/api/health")
async def health_check():
    return {
        "status": "metabolic_vault_online",
        "gemini_active": GEMINI_AVAILABLE and bool(os.environ.get("GEMINI_API_KEY")),
        "time": time.time()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)