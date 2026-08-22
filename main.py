"""
=============================================================================
PROJEKT "Q-O" // METABOLISCHES GEHIRN & ANALYSE-PIPELINE (MAIN.PY)
=============================================================================
Schlankes FastAPI-Backend mit nativer Groq-Cloud-API Anbindung.
- Parallele Multi-Agenten-Forensik via asyncio.gather (Agent 1: Ankläger / Agent 2: Gutachter)
- Asymmetrisches Teilstring-Veto-Protokoll (Mengenlehre Substring-Axiom)
- Intelligenter MD5-Hash-Schutzschirm gegen Groq-Limit-Sperren (Rate Limits)
- Duale Gewebe-Zufuhr: 'raw_context' (Makro-Analyse) & 'sanitized_sentences' (Mikro-Zitate)
- HTML/Script/Style-Bereinigung für unfehlbare, dichte Makro-Struktur-Analyse
- Reiner Semantik-Filter & Vektor-Kontextanalyse via 'llama-3.1-8b-instant'
- High-End Weltwissen & Forensik-Detox via 'llama-3.3-70b-versatile'
- Mikro-Makro-Matrix & Dialektische Symmetrie (Debatten-Richter)
- Hybrid-Rechnung & Vier-Kanal-Trennung: LQ = exp(-(s_tox - n_nut))
- Geöffnete Direktive: Dynamische Kriterien (z.B. 'Aggressive Schlagzeilen-Dichte', 'Boulevard-Framing')
- Exakt identische JSON-Schnittstellen für /api/analyze und /api/flush
- Vollständiges Acht-Kanal-Ausgabeschema (t_mikro, t_makro, n_mikro, n_makro, toxic_snippets, nutrient_snippets, macro_tox_categories, macro_nut_categories)
=============================================================================
"""

import os
import re
import math
import time
import json
import hashlib
import asyncio
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
# GLOBALER IN-MEMORY HASH-CACHE (GROQ-LIMIT-SCHUTZSCHIRM)
# =============================================================================
# Speichert die letzten Text-Hashes und fertigen Analyseergebnisse pro Session/URL
ANALYSIS_CACHE: Dict[str, Dict[str, Any]] = {}


# =============================================================================
# 1. FASTAPI INITIALISIERUNG & CORS
# =============================================================================
app = FastAPI(
    title="Q-O Metabolic Brain API",
    description="Linguistischer Metabolisierungs- und Sezier-Server fuer Q-O via Groq",
    version="3.4.0"
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
    sociological_mode: Optional[bool] = Field(default=False, description="Wissenschaftlich soziologische Filter-Option")
    intensity: float = Field(default=0.5, description="Stufenloser Intensitätswert des Mond-Reglers (0.0 bis 1.0)")

class MorphologyState(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)
    className: str = Field(..., alias="class")
    pulse_frequency: str

class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    biopsy_id: str
    lq_score: float
    source_url: str
    t_mikro: float = 0.0
    t_makro: float = 0.0
    n_mikro: float = 0.0
    n_makro: float = 0.0
    t_norm: Optional[float] = 0.0
    n_disk: Optional[float] = 0.0
    habitus_distortion: Optional[float] = 1.0
    sociological_mode: bool = False
    toxic_snippets: List[str] = Field(default_factory=list)
    nutrient_snippets: List[str] = Field(default_factory=list)
    macro_tox_categories: List[str] = Field(default_factory=list)
    macro_nut_categories: List[str] = Field(default_factory=list)
    morphology_state: MorphologyState
    pro_arguments: List[str] = Field(default_factory=list)
    contra_arguments: List[str] = Field(default_factory=list)
    symmetry_score: float = 100.0
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
# 3. FEDERLEICHTER NATIV-CLIENT FUER DIE GROQ CLOUD-API (MIT ASYNC-THREAD-POOL)
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
        "User-Agent": "Q-O-Metabolic-Brain/3.4"
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


async def async_call_groq_api(
    model: str,
    system_prompt: str,
    user_content: str,
    temperature: float = 0.1,
    json_mode: bool = True
) -> Optional[Dict[str, Any]]:
    # Führt den synchronen HTTP-Aufruf non-blocking in einem Thread-Pool aus
    return await asyncio.to_thread(
        call_groq_api,
        model=model,
        system_prompt=system_prompt,
        user_content=user_content,
        temperature=temperature,
        json_mode=json_mode
    )


# =============================================================================
# 4. ERWEITERTE TEXT-BEREINIGUNG & ATOMARER SATZSPLITTER
# =============================================================================
def prepare_dual_tissue_input(text: str) -> tuple[str, List[str]]:
    # 1. raw_context RADIKAL REINIGEN:
    # Entferne JavaScript-Blöcke (<script>...</script>), CSS-Styles (<style>...</style>)
    cleaned = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', ' ', text, flags=re.IGNORECASE)
    cleaned = re.sub(r'<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>', ' ', cleaned, flags=re.IGNORECASE)
    # Entferne alle verbliebenen HTML-Tags
    cleaned = re.sub(r'<[^>]+>', ' ', cleaned)
    # Entferne typischen Script-/Tracker-Code-Müll & Escapes
    cleaned = re.sub(r'&[a-zA-Z0-9#]+;', ' ', cleaned)
    # Entferne multiple Whitespaces, Tabs und Zeilenumbrüche
    cleaned = re.sub(r'[\r\n\t]+', ' ', cleaned)
    cleaned = re.sub(r'\s{2,}', ' ', cleaned).strip()

    # Das komprimierte, dichte Textgewebe für den Makro-Kontext
    raw_context = cleaned

    # 2. sanitized_sentences: Zerlegt denselben gereinigten Text algorithmisch anhand von Satzzeichen in atomare Einzelsätze
    raw_parts = re.split(r'(?<=[.!?])\s+', raw_context)
    sanitized_sentences: List[str] = []

    for part in raw_parts:
        part_clean = part.strip()
        # Nur prägnante, lesbare Einzelsätze (mindestens 10 Zeichen, ca. 3 bis 30 Wörter)
        if len(part_clean) >= 10:
            words = part_clean.split()
            if 3 <= len(words) <= 30:
                sanitized_sentences.append(part_clean)
            elif len(words) > 30:
                # Falls ein Satz zu lang ist, an Kommas oder Semikolons teilen für atomare Mikro-Zitate
                sub_parts = re.split(r'[,;]\s+', part_clean)
                for sp in sub_parts:
                    sp_clean = sp.strip()
                    sp_words = sp_clean.split()
                    if 4 <= len(sp_words) <= 22 and len(sp_clean) >= 12:
                        sanitized_sentences.append(sp_clean)

    return raw_context, sanitized_sentences


# =============================================================================
# 5. ROBUSTER LEICHTBAU-FALLBACK (FALLS KEIN GROQ_API_KEY VORHANDEN ODER OFFLINE)
# =============================================================================
def local_fallback_analyze(raw_context: str, sanitized_sentences: List[str], sociological_mode: bool = False) -> Dict[str, Any]:
    lower = raw_context.lower()
    toxic_markers = ["schock", "katastrophe", "skandal", "panik", "eskalation", "kollaps", "wut", "drama", "luegen", "eliten", "verrat", "horror", "angst", "droht", "alarm", "krise"]
    nutrient_markers = ["studie", "analyse", "prozent", "daten", "forschung", "ergebnis", "weil", "daher", "infolgedessen", "evidenz", "belegt", "messung", "wissenschaft", "statistik"]
    norm_markers = ["moral", "schuld", "verbieten", "pflicht", "schande", "anstand", "empoerung", "suende", "tabu", "norm"]
    disk_markers = ["diskurs", "dialektik", "argument", "begruendung", "perspektive", "reflexion", "oeffentlichkeit", "rational", "konsens"]
    pro_markers = ["vorteil", "chance", "gewinn", "positiv", "erfolg", "unterstuetzt", "befuerwortet"]
    contra_markers = ["risiko", "nachteil", "gefahr", "kritik", "verlust", "problem", "hindernis"]

    # Reinen Eigennamen / Gaming-Begriffe / Smalltalk ignorieren
    gaming_neutral_terms = ["path of exile", "poe", "patch notes", "item", "build", "quest", "level"]
    for term in gaming_neutral_terms:
        if term in lower:
            lower = lower.replace(term, "")

    toxic_snippets = []
    nutrient_snippets = []
    macro_tox_categories = []
    macro_nut_categories = []
    pro_arguments = []
    contra_arguments = []

    # Mikro-Zitate ausschließlich aus den vorbereiteten atomaren sanitized_sentences extrahieren
    for s in sanitized_sentences:
        s_low = s.lower()
        if any(m in s_low for m in toxic_markers) and len(toxic_snippets) < 5:
            toxic_snippets.append(s)
        if any(m in s_low for m in nutrient_markers) and len(nutrient_snippets) < 5:
            nutrient_snippets.append(s)
        if any(m in s_low for m in pro_markers) and len(pro_arguments) < 3:
            pro_arguments.append(s)
        if any(m in s_low for m in contra_markers) and len(contra_arguments) < 3:
            contra_arguments.append(s)

    # ASYMMETRISCHES TEILSTRING-MATCHING (Das unbestechliche Axiom im Fallback)
    for nut_sentence in list(nutrient_snippets):
        for tox_sentence in toxic_snippets:
            if nut_sentence.lower() in tox_sentence.lower() or tox_sentence.lower() in nut_sentence.lower():
                if nut_sentence in nutrient_snippets:
                    nutrient_snippets.remove(nut_sentence)
                break

    t_mikro = min(5.0, round(len(toxic_snippets) * 1.2, 2))
    n_mikro = min(5.0, round(max(0.0, len(nutrient_snippets) * 1.1), 2)) if len(nutrient_snippets) > 0 else 0.0

    # Makro-Ebene über den Gesamtzusammenhang des gereinigten raw_context
    arg_diff = abs(len(pro_arguments) - len(contra_arguments))
    toxic_word_density = sum(lower.count(m) for m in toxic_markers)
    
    # Makro-Scores kalkulieren
    t_makro = min(5.0, round(max(arg_diff * 1.0, toxic_word_density * 0.4), 2))
    n_makro = min(5.0, round(min(len(pro_arguments), len(contra_arguments)) * 1.5, 2))

    # Soziologische Indikatoren kalkulieren
    t_norm = min(5.0, round(sum(lower.count(m) for m in norm_markers) * 0.8, 2)) if sociological_mode else 0.0
    n_disk = min(5.0, round(sum(lower.count(m) for m in disk_markers) * 0.8, 2)) if (sociological_mode and len(nutrient_snippets) > 0) else 0.0
    habitus_distortion = min(1.5, round(1.0 + (sum(lower.count(m) for m in toxic_markers) * 0.05), 2)) if sociological_mode else 1.0

    # Makro-Kategorien dynamisch isolieren
    if toxic_word_density >= 3:
        macro_tox_categories.append("Aggressive Schlagzeilen-Dichte")
        macro_tox_categories.append("Boulevard-Framing")
    elif t_makro >= 1.5:
        if arg_diff >= 2:
            macro_tox_categories.append("Argumentative Asymmetrie (Echokammer)")
        macro_tox_categories.append("Emotionales Framing")

    if sociological_mode and t_norm >= 1.0:
        macro_tox_categories.append("Moralische Normierung (Bourdieu/Luhmann)")
    
    # Fallback bei dichter News-Seite
    if not macro_tox_categories and len(sanitized_sentences) > 5 and any(m in lower for m in ["krise", "angst", "droht", "alarm", "schock"]):
        macro_tox_categories.append("Reißerischer journalistischer Grundton")

    if n_makro >= 1.0 or (len(pro_arguments) > 0 and len(contra_arguments) > 0):
        macro_nut_categories.append("Dialektische Symmetrie")
        if len(pro_arguments) >= 2 and len(contra_arguments) >= 2:
            macro_nut_categories.append("Ausgewogene Multiperspektive")

    if sociological_mode and n_disk >= 1.0:
        macro_nut_categories.append("Herrschaftsfreier Diskurs (Habermas)")

    return {
        "t_mikro": t_mikro,
        "t_makro": t_makro,
        "t_norm": t_norm,
        "habitus_distortion": habitus_distortion,
        "n_mikro": n_mikro,
        "n_makro": n_makro,
        "n_disk": n_disk,
        "toxic_snippets": toxic_snippets,
        "nutrient_snippets": nutrient_snippets,
        "macro_tox_categories": macro_tox_categories,
        "macro_nut_categories": macro_nut_categories,
        "pro_arguments": pro_arguments,
        "contra_arguments": contra_arguments
    }


# =============================================================================
# 6. REST-ENDPUNKT: /api/analyze (ASYNC MULTI-AGENTEN-PIPELINE MIT TEILSTRING-AXIOM)
# =============================================================================
@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_viewport_text(payload: AnalyzeRequest):
    text = payload.text
    url = payload.url
    sociological_mode = bool(payload.sociological_mode)
    intensity = float(payload.intensity)

    # 1. ALGORITHMISCHER MD5-HASH-FILTER GEGEN GROQ-LIMIT-SPERREN
    # Berechne schnellen MD5-Hash aus dem eintreffenden rohen Text, Modus und Intensitätsstufe
    text_hash = hashlib.md5(f"{text.strip()}_{sociological_mode}_{round(intensity, 2)}".encode("utf-8")).hexdigest()
    cache_key = f"{url.strip() or 'default_session'}_{sociological_mode}_{round(intensity, 2)}"

    # PRÜFUNG IM REAKTOR:
    # Wenn der berechnete Hash identisch ist mit der vorherigen Anfrage: Groq-Aufruf blockieren!
    if cache_key in ANALYSIS_CACHE and ANALYSIS_CACHE[cache_key].get("hash") == text_hash:
        cached_response: AnalyzeResponse = ANALYSIS_CACHE[cache_key]["response"]
        return cached_response

    # 2. Duale Gewebe-Zufuhr vorbereiten: Gereinigter raw_context & sanitized_sentences
    raw_context, sanitized_sentences = prepare_dual_tissue_input(text)

    # Konstruktion des dualen User-Payloads
    user_payload_dict = {
        "raw_context": raw_context[:3500],
        "sanitized_sentences": sanitized_sentences[:35]
    }
    user_content = json.dumps(user_payload_dict, ensure_ascii=False)

    # 3. DYNAMISCHE INVERSE TEMPERATUR-STEUERUNG (0.0 -> 0.8 / 1.0 -> 0.1)
    computed_temp = max(0.1, min(0.8, 0.8 - (intensity * 0.7)))

    # FORENSISCHE SCHÄRFE-DIREKTIVE FÜR SYSTEM-PROMPTS
    forensic_sharpness_directive = (
        f"Analysiere das Textgewebe mit einem forensischen Strenge-Index von genau {intensity:.2f}. "
        "Ein Wert von 0.0 bedeutet extreme Toleranz für sprachliche Unschärfen; "
        "ein Wert von 1.0 bedeutet gnadenlose, mikro-strukturelle Sezierung kleinster Framing-Muster und manipulativer Vorannahmen."
    )

    # 4. DIE ZWEI GETRENNTEN KI-AGENTEN-PROMPTS (TRENNUNG DER GEWALTEN)

    # AGENT 1: DER ANKLÄGER (Schadstoff-Fokus)
    if sociological_mode:
        system_prompt_accuser = (
            "Du bist ein unbestechlicher Forensiker der kritischen Gesellschaftstheorie (nach Pierre Bourdieu, Niklas Luhmann und Noam Chomsky) des Q-O Cyber-Systems.\n"
            f"{forensic_sharpness_directive}\n"
            "Deine oberste Norm ist das unerbittliche Aufdecken von struktureller Gewalt, Manipulation, 'Manufacturing Consent' und manipulativen Kampagnen in der Sprachumwelt. Analysiere das Gewebe im 'raw_context' und den 'sanitized_sentences' rücksichtslos auf Schadstoffe. Ignoriere jegliche positiven Aspekte.\n\n"
            "Du musst zwingend als valides JSON-Objekt mit exakt folgendem Schema antworten:\n"
            "{\n"
            '  "t_mikro": 0.0,\n'
            '  "t_makro": 0.0,\n'
            '  "t_norm": 0.0,\n'
            '  "habitus_distortion": 1.0,\n'
            '  "toxic_snippets": [],\n'
            '  "macro_tox_categories": []\n'
            "}\n\n"
            "SOZIOLOGISCHE NORMGEBUNGS-GESETZE FÜR DEN ANKLÄGER:\n"
            "1. 't_mikro' / 'toxic_snippets': Akute Mikro-Toxin-Sätze (Clickbait, reißerischer Sprachstil, emotionale Erregung, unfaire Klauseln, verbale Gewalt). Mikro-Zitate dürfen nur echte Toxine sein. Sätze mit reißerischen, emotionalen Phrasen (wie 'Stütze weg!') gehören zwingend hierher. Jeder Eintrag MUSS ein einzelner, kurzer Satz aus den gelieferten 'sanitized_sentences' sein.\n"
            "2. 't_makro' / 'macro_tox_categories': Struktureller Makro-Schadstoff. Wenn das Gesamtklima Boulevard-Stil, Desinformation oder Framing ist, logge es zwingend in 'macro_tox_categories' (z.B. 'Aggressive Schlagzeilen-Dichte', 'Boulevard-Framing', 'Informations-Überladung', 'Argumentative Asymmetrie', 'Manufacturing Consent').\n"
            "3. 't_norm' (SOZIOLOGISCHER KONFORMITÄTSDRUCK): Die Wucht der künstlichen moralischen Normierung, Erzeugung von Konformitätsdruck (Flak) oder sozialer Spaltung ('Moral Panic') nach Bourdieu und Luhmann. Skala 0.0 bis 5.0 als numerischer Float.\n"
            "4. 'habitus_distortion' (SPRACHHABITUS-MANIPULATION): Der Grad der bewussten populistisch-emotionalen Verzerrung des Sprachhabitus (Sensationstransfer im News-Feed, Ticker-Trick nach Bourdieu), um kognitive Autonomie zu untergraben. Skala 1.0 bis 1.5 als numerischer Float.\n"
            "5. Filter reine Eigennamen, Gaming-Begriffe ('Path of Exile', 'PoE', Games) und belanglosen Web-Smalltalk als NEUTRAL heraus."
        )
    else:
        system_prompt_accuser = (
            "Du bist AGENT 1 (DER ANKLÄGER) des Q-O Cyber-Systems.\n"
            f"{forensic_sharpness_directive}\n"
            "Deine einzige Aufgabe ist die gnadenlose Detektion von Manipulation, Erregung, Clickbait und Framing im 'raw_context' und den 'sanitized_sentences'. Ignoriere jegliche positiven Aspekte.\n\n"
            "Du musst zwingend als valides JSON-Objekt mit exakt folgendem Schema antworten:\n"
            "{\n"
            '  "t_mikro": 0.0,\n'
            '  "t_makro": 0.0,\n'
            '  "toxic_snippets": [],\n'
            '  "macro_tox_categories": []\n'
            "}\n\n"
            "GEWICHTUNGS-GESETZE FÜR DEN ANKLÄGER (Skala 0.0 bis 5.0):\n"
            "1. 't_mikro' / 'toxic_snippets': Akute Mikro-Toxin-Sätze (Clickbait, reißerischer Sprachstil, emotionale Erregung, unfaire Klauseln). Mikro-Zitate dürfen nur echte Toxine sein. Sätze mit reißerischen, emotionalen Phrasen (wie 'Stütze weg!') gehören zwingend hierher. Jeder Eintrag MUSS ein einzelner, kurzer Satz aus den gelieferten 'sanitized_sentences' sein.\n"
            "2. 't_makro' / 'macro_tox_categories': Struktureller Makro-Schadstoff. Wenn das Gesamtklima Boulevard-Stil ist, logge es zwingend in das Makro-Array 'macro_tox_categories' (z.B. 'Aggressive Schlagzeilen-Dichte', 'Boulevard-Framing', 'Informations-Überladung', 'Argumentative Asymmetrie').\n"
            "3. Filter reine Eigennamen, Gaming-Begriffe ('Path of Exile', 'PoE', Games) und belanglosen Web-Smalltalk als NEUTRAL heraus."
        )

    # AGENT 2: DER GUTACHTER (Nährstoff-Fokus)
    if sociological_mode:
        system_prompt_evaluator = (
            "Du bist AGENT 2 (DER GUTACHTER) des Q-O Cyber-Systems (SOZIOLOGISCHER MODUS AKTIV).\n"
            f"{forensic_sharpness_directive}\n"
            "Deine einzige Norm ist die Isolation des Habermas'schen 'herrschaftsfreien Diskurses'. Du suchst im Text-Sumpf nach klinisch reinen Oasen der Wahrheit. Ignoriere das manipulative Umfeld.\n\n"
            "Du musst zwingend als valides JSON-Objekt mit exakt folgendem Schema antworten:\n"
            "{\n"
            '  "n_mikro": 0.0,\n'
            '  "n_makro": 0.0,\n'
            '  "n_disk": 0.0,\n'
            '  "nutrient_snippets": [],\n'
            '  "macro_nut_categories": [],\n'
            '  "pro_arguments": [],\n'
            '  "contra_arguments": []\n'
            "}\n\n"
            "SOZIOLOGISCHE NORMGEBUNGS-GESETZE FÜR DEN GUTACHTER:\n"
            "1. 'n_mikro' / 'nutrient_snippets': Ein Satz darf NUR dann als Nährstoff zitiert werden, wenn er trotz eines toxischen Umfelds einen unbestechlichen, rationalen Mehrwert liefert (empirische Evidenz, Primärquellen, dialektische Offenheit, wissenschaftliche Daten). Ist ein Satz durch manipulative Framing-Teilstrings infiziert, ignoriere ihn! Jeder Eintrag MUSS ein einzelner, kurzer Satz aus 'sanitized_sentences' sein.\n"
            "2. 'n_makro' / 'macro_nut_categories': Journalistische Makro-Ausgewogenheit (Dialektische Symmetrie, faire Pro- und Contra-Debattenstruktur, Multiperspektive).\n"
            "3. 'n_disk' (HERRSCHAFTSFREIER DISKURS): Grad der diskursiven Symmetrie, sachlichen Validität, empirischen Evidenz und dialektischen Offenheit von 0.0 bis 5.0 nach Jürgen Habermas. Liefere 'n_disk' als numerischen Float-Wert im JSON-Output.\n"
            "4. 'pro_arguments' und 'contra_arguments': Fasse sachliche Pro- und Kontra-Punkte prägnant zusammen."
        )
    else:
        system_prompt_evaluator = (
            "Du bist AGENT 2 (DER GUTACHTER) des Q-O Cyber-Systems.\n"
            f"{forensic_sharpness_directive}\n"
            "Deine einzige Aufgabe ist die unvoreingenommene Isolation von harten Fakten, empirischer Evidenz, Dialektik und sachlichem Informationsmehrwert. Ignoriere das manipulative Umfeld.\n\n"
            "Du musst zwingend als valides JSON-Objekt mit exakt folgendem Schema antworten:\n"
            "{\n"
            '  "n_mikro": 0.0,\n'
            '  "n_makro": 0.0,\n'
            '  "nutrient_snippets": [],\n'
            '  "macro_nut_categories": [],\n'
            '  "pro_arguments": [],\n'
            '  "contra_arguments": []\n'
            "}\n\n"
            "GEWICHTUNGS-GESETZE FÜR DEN GUTACHTER (Skala 0.0 bis 5.0):\n"
            "1. 'n_mikro' / 'nutrient_snippets': Empirische Mikro-Nährstoff-Sätze (Fakten, Zahlen, Daten, verifizierbare Belege, Studien). Ein Satz wird NUR dann zitiert, wenn er trotz Clickbait-Sumpf echte, überprüfbare Substanz besitzt (z.B. exakte Statistiken, offizielle Behördenzitate oder wissenschaftliche Fakten). Reine Meinungen oder emotionale Boulevard-Phrasen fliegen rigoros raus! Jeder Eintrag MUSS ein einzelner, kurzer Satz aus 'sanitized_sentences' sein.\n"
            "2. 'n_makro' / 'macro_nut_categories': Journalistische Makro-Ausgewogenheit (Dialektische Symmetrie, faire Pro- und Contra-Debattenstruktur, Multiperspektive).\n"
            "3. 'pro_arguments' und 'contra_arguments': Fasse sachliche Pro- und Kontra-Punkte prägnant zusammen."
        )

    # 5. PARALLELES ABFEUERN BEIDER AGENTEN VIA ASYNCIO.GATHER MIT DYNAMISCHER INVERSER TEMPERATUR
    accuser_task = async_call_groq_api(
        model=MODEL_ANALYZE,
        system_prompt=system_prompt_accuser,
        user_content=user_content,
        temperature=computed_temp,
        json_mode=True
    )

    evaluator_task = async_call_groq_api(
        model=MODEL_ANALYZE,
        system_prompt=system_prompt_evaluator,
        user_content=user_content,
        temperature=computed_temp,
        json_mode=True
    )

    groq_accuser_res, groq_evaluator_res = await asyncio.gather(accuser_task, evaluator_task)

    # 5. ROBUSTER FALLBACK BEI FEHLENDER ANTWORT
    fallback_res = local_fallback_analyze(raw_context, sanitized_sentences, sociological_mode=sociological_mode)

    if not groq_accuser_res or ("t_mikro" not in groq_accuser_res and "t_makro" not in groq_accuser_res):
        groq_accuser_res = {
            "t_mikro": fallback_res["t_mikro"],
            "t_makro": fallback_res["t_makro"],
            "t_norm": fallback_res.get("t_norm", 0.0),
            "toxic_snippets": fallback_res["toxic_snippets"],
            "macro_tox_categories": fallback_res["macro_tox_categories"]
        }

    if not groq_evaluator_res or ("n_mikro" not in groq_evaluator_res and "n_makro" not in groq_evaluator_res):
        groq_evaluator_res = {
            "n_mikro": fallback_res["n_mikro"],
            "n_makro": fallback_res["n_makro"],
            "n_disk": fallback_res.get("n_disk", 0.0),
            "nutrient_snippets": fallback_res["nutrient_snippets"],
            "macro_nut_categories": fallback_res["macro_nut_categories"],
            "pro_arguments": fallback_res["pro_arguments"],
            "contra_arguments": fallback_res["contra_arguments"]
        }

    # 6. FUSION DER GETRENNTEN AGENTEN-DATENSTRÖME
    t_mikro = float(groq_accuser_res.get("t_mikro", 0.0))
    t_makro = float(groq_accuser_res.get("t_makro", 0.0))
    t_norm = float(groq_accuser_res.get("t_norm", 0.0)) if sociological_mode else 0.0
    habitus_distortion = float(groq_accuser_res.get("habitus_distortion", 1.0)) if sociological_mode else 1.0
    # Clamping habitus_distortion between 1.0 and 1.5
    habitus_distortion = max(1.0, min(1.5, habitus_distortion))

    n_mikro = float(groq_evaluator_res.get("n_mikro", 1.0))
    n_makro = float(groq_evaluator_res.get("n_makro", 1.0))
    n_disk = float(groq_evaluator_res.get("n_disk", 1.0)) if sociological_mode else 0.0

    raw_toxic_snippets = groq_accuser_res.get("toxic_snippets", [])
    raw_nutrient_snippets = groq_evaluator_res.get("nutrient_snippets", [])
    macro_tox_categories = groq_accuser_res.get("macro_tox_categories", [])
    macro_nut_categories = groq_evaluator_res.get("macro_nut_categories", [])
    pro_arguments = groq_evaluator_res.get("pro_arguments", [])
    contra_arguments = groq_evaluator_res.get("contra_arguments", [])

    if not isinstance(raw_toxic_snippets, list):
        raw_toxic_snippets = []
    if not isinstance(raw_nutrient_snippets, list):
        raw_nutrient_snippets = []
    if not isinstance(macro_tox_categories, list):
        macro_tox_categories = []
    if not isinstance(macro_nut_categories, list):
        macro_nut_categories = []
    if not isinstance(pro_arguments, list):
        pro_arguments = []
    if not isinstance(contra_arguments, list):
        contra_arguments = []

    # Backend-Filterung: Absicherung gegen zusammenhaengende Textbloecke im Mikro-Array
    toxic_snippets = []
    for snippet in raw_toxic_snippets:
        if isinstance(snippet, str):
            cleaned = snippet.strip()
            word_count = len(cleaned.split())
            if word_count > 25 or "\n" in cleaned:
                if "Reißerisches Überschriften-Framing" not in macro_tox_categories:
                    macro_tox_categories.append("Reißerisches Überschriften-Framing")
            elif cleaned:
                toxic_snippets.append(cleaned)

    nutrient_snippets = []
    for snippet in raw_nutrient_snippets:
        if isinstance(snippet, str):
            cleaned = snippet.strip()
            word_count = len(cleaned.split())
            if word_count <= 25 and "\n" not in cleaned and cleaned:
                nutrient_snippets.append(cleaned)

    # =========================================================================
    # 7. ASYMMETRISCHES TEILSTRING-VETO-PROTOKOLL (DAS UNBESTECHLICHE AXIOM)
    # =========================================================================
    for nut_sentence in list(nutrient_snippets):
        for tox_sentence in toxic_snippets:
            # ASYMMETRISCHES TEILSTRING-MATCHING (Das unbestechliche Axiom)
            if nut_sentence.lower() in tox_sentence.lower() or tox_sentence.lower() in nut_sentence.lower():
                # Wenn ein grüner Satz auch nur zu einem Bruchteil mit der roten Schadstoff-Liste infiziert ist:
                if nut_sentence in nutrient_snippets:
                    nutrient_snippets.remove(nut_sentence) # Physisch im Backend ertränken!
                break # Schleife abbrechen, nächster Satz

    # Wenn durch diese Reinigung das gesamte Nährstoff-Array leer wird, setze den Wert 'n_mikro' und 'n_disk' konsequent auf 0.0 zurück
    if len(nutrient_snippets) == 0:
        n_mikro = 0.0
        if sociological_mode:
            n_disk = 0.0

    # Fallback-Kategorien absichern bei struktureller Makro-Toxizität
    if t_makro >= 1.0 and len(macro_tox_categories) == 0:
        macro_tox_categories.append("Aggressive Schlagzeilen-Dichte")
        macro_tox_categories.append("Boulevard-Framing")

    if n_makro >= 1.0 and len(macro_nut_categories) == 0:
        macro_nut_categories.append("Dialektische Symmetrie")

    # =========================================================================
    # MATHEMATISCHE FUSION & AXIOMATISCHE EXPONENTEN-KASKADE (METABOLISCHE HOMÖOSTASE)
    # =========================================================================
    if sociological_mode:
        # Verschärfte Formel mit Habitus-Katalysator (t_makro * habitus_distortion) und Norm-Druck (t_norm * 1.5)
        s_tox = (t_mikro + (t_makro * habitus_distortion) + (t_norm * 1.5)) / 3.0
        n_nut = (n_mikro + n_makro + n_disk) / 3.0
    else:
        # Standardmäßiges mathematisches Dual-Gesetz
        s_tox = (t_mikro + t_makro) / 2.0
        n_nut = (n_mikro + n_makro) / 2.0

    # Netto-Gefälle (Delta) ermitteln
    delta = s_tox - n_nut

    # Dreistufige axiomatische Exponenten-Kaskade
    if delta <= 0:
        # AXIOM I (Cyan - Gleichgewicht)
        raw_lq = math.exp(-delta)
    elif 0 < delta <= 2.0:
        # AXIOM II (Orange - Kompression)
        raw_lq = math.exp(-delta * 1.2)
    else:
        # AXIOM III (Rot - Implosion: Exponentielle Quadrierung für den totalen Kollaps)
        raw_lq = math.exp(-(delta ** 2))

    lq_score = round(raw_lq, 2)

    # Symmetrie-Score: 100 - (|t_makro - n_makro| * 20)
    raw_symmetry = 100.0 - (abs(t_makro - n_makro) * 20.0)
    symmetry_score = round(max(0.0, min(100.0, raw_symmetry)), 1)

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

    response_obj = AnalyzeResponse(
        biopsy_id=biopsy_id,
        lq_score=lq_score,
        source_url=url,
        t_mikro=round(t_mikro, 2),
        t_makro=round(t_makro, 2),
        n_mikro=round(n_mikro, 2),
        n_makro=round(n_makro, 2),
        t_norm=round(t_norm, 2) if sociological_mode else 0.0,
        n_disk=round(n_disk, 2) if sociological_mode else 0.0,
        habitus_distortion=round(habitus_distortion, 2) if sociological_mode else 1.0,
        sociological_mode=sociological_mode,
        toxic_snippets=toxic_snippets,
        nutrient_snippets=nutrient_snippets,
        macro_tox_categories=macro_tox_categories,
        macro_nut_categories=macro_nut_categories,
        morphology_state=MorphologyState(
            **{"class": morph_class, "pulse_frequency": pulse}
        ),
        pro_arguments=pro_arguments,
        contra_arguments=contra_arguments,
        symmetry_score=symmetry_score,
        details={
            "t_mikro": round(t_mikro, 2),
            "t_makro": round(t_makro, 2),
            "t_norm": round(t_norm, 2) if sociological_mode else 0.0,
            "habitus_distortion": round(habitus_distortion, 2) if sociological_mode else 1.0,
            "n_mikro": round(n_mikro, 2),
            "n_makro": round(n_makro, 2),
            "n_disk": round(n_disk, 2) if sociological_mode else 0.0,
            "sociological_mode": sociological_mode,
            "delta": round(delta, 2),
            "s_tox_final": round(s_tox, 2),
            "n_nut_final": round(n_nut, 2),
            "symmetry_score": symmetry_score,
            "macro_tox_categories": macro_tox_categories,
            "macro_nut_categories": macro_nut_categories,
            "pipeline": "Async Dual Multi-Agent (Accuser + Evaluator) + Asymmetric Substring Veto + Axiomatic Stage-Coupling" + (" + Sociological Habitus Mode" if sociological_mode else ""),
            "model_used": MODEL_ANALYZE,
            "engine": "Groq Cloud" if GROQ_API_KEY != "DEIN_KEY_HIER" else "Local Heuristic Engine",
            "cached": False
        }
    )

    # Aktualisiere den Hash-Cache fuer diese Session/URL
    ANALYSIS_CACHE[cache_key] = {
        "hash": text_hash,
        "response": response_obj
    }

    return response_obj


# =============================================================================
# 8. REST-ENDPUNKT: /api/flush (DETOX & WELTWISSEN VIA LLAMA 3.3 70B)
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
# 9. SYSTEM STATUS & HEALTH CHECK
# =============================================================================
@app.get("/api/health")
async def health_check():
    has_key = bool(GROQ_API_KEY and GROQ_API_KEY != "DEIN_KEY_HIER")
    return {
        "status": "metabolic_vault_online",
        "pipeline": "Async Dual Multi-Agent (Accuser + Evaluator) + Asymmetric Substring Veto",
        "groq_api_configured": has_key,
        "model_analyze": MODEL_ANALYZE,
        "model_flush": MODEL_FLUSH,
        "version": "3.4.0",
        "cached_sessions_count": len(ANALYSIS_CACHE),
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
        print("🪐 [Q-O Core] Entwickler-Modus aktiv. Zünde asynchrone Multi-Agenten-Pipeline mit asymmetrischem Teilstring-Axiom...")
        uvicorn.run(app, host="127.0.0.1", port=8000)
