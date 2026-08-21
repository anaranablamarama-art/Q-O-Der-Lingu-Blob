"""
=============================================================================
PROJEKT "Q-O" // METABOLISCHES GEHIRN & ANALYSE-PIPELINE (MAIN.PY)
=============================================================================
GOLDSTANDARD REFIT:
- Vollständig asynchroner HTTP-Client via 'httpx.AsyncClient()' (Kein blockierendes urllib)
- Deckelung des In-Memory Cache via OrderedDict LRU/TTL (Max 100 Sessions, kein Memory Leak)
- 100% Erhalt der mathematischen Homöostase, Exponenten-Kaskade & Asymmetrisches Teilstring-Veto
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
from collections import OrderedDict
from typing import Dict, Any, Optional, List
import httpx
from pydantic import BaseModel, Field, ConfigDict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# =============================================================================
# GROQ API KONFIGURATION
# =============================================================================
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "DEIN_KEY_HIER")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

MODEL_ANALYZE = "llama-3.1-8b-instant"      # Ultraschneller Echtzeit-Semantik-Filter
MODEL_FLUSH = "llama-3.3-70b-versatile"     # High-End Weltwissen & Forensik-Spülung


# =============================================================================
# 1. LRU & TTL BOUNDED IN-MEMORY CACHE (LEAK-SCHUTZSCHIRM)
# =============================================================================
class BoundedLRUCache:
    def __init__(self, max_size: int = 100, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()

    def get(self, key: str, current_hash: str) -> Optional[Any]:
        if key not in self.cache:
            return None
        entry = self.cache[key]
        if time.time() - entry["timestamp"] > self.ttl_seconds:
            del self.cache[key]
            return None
        if entry.get("hash") == current_hash:
            self.cache.move_to_end(key)
            return entry["response"]
        return None

    def put(self, key: str, text_hash: str, response: Any):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = {
            "hash": text_hash,
            "response": response,
            "timestamp": time.time()
        }
        if len(self.cache) > self.max_size:
            self.cache.popitem(last=False)

ANALYSIS_CACHE = BoundedLRUCache(max_size=100, ttl_seconds=3600)


# =============================================================================
# 2. FASTAPI INITIALISIERUNG & CORS
# =============================================================================
app = FastAPI(
    title="Q-O Metabolic Brain API",
    description="Asynchroner linguistischer Metabolisierungs- und Sezier-Server fuer Q-O via Groq",
    version="3.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# 3. PYDANTIC DATENMODELLE
# =============================================================================
class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    text: str = Field(..., description="Zu analysierender Textabsatz des Viewports")
    url: str = Field(default="about:blank", description="Quell-URL der analysierten Website")
    sociological_mode: Optional[bool] = Field(default=False, description="Wissenschaftlich soziologische Filter-Option")

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
# 4. NATIVES ASYNCHRONES HTTPX-RELAIS FÜR DIE GROQ CLOUD-API
# =============================================================================
async def async_call_groq_api(
    model: str,
    system_prompt: str,
    user_content: str,
    temperature: float = 0.1,
    json_mode: bool = True
) -> Optional[Dict[str, Any]]:
    api_key = GROQ_API_KEY.strip()
    if not api_key or api_key == "DEIN_KEY_HIER":
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Q-O-Async-Brain/3.4"
    }

    body: Dict[str, Any] = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "temperature": temperature
    }

    if json_mode:
        body["response_format"] = {"type": "json_object"}

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(GROQ_API_URL, headers=headers, json=body)
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
            else:
                print(f"[Q-O Groq Relais] HTTP-Fehler: {response.status_code}")
    except Exception as err:
        print(f"[Q-O Groq Relais] Async I/O Fehler: {err}")

    return None


# =============================================================================
# 5. DUAL-TISSUE BEREINIGUNG & ATOMARER SATZSPLITTER
# =============================================================================
def prepare_dual_tissue_input(text: str) -> tuple[str, List[str]]:
    cleaned = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', ' ', text, flags=re.IGNORECASE)
    cleaned = re.sub(r'<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>', ' ', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'<[^>]+>', ' ', cleaned)
    cleaned = re.sub(r'&[a-zA-Z0-9#]+;', ' ', cleaned)
    cleaned = re.sub(r'[\r\n\t]+', ' ', cleaned)
    raw_context = re.sub(r'\s{2,}', ' ', cleaned).strip()

    raw_parts = re.split(r'(?<=[.!?])\s+', raw_context)
    sanitized_sentences: List[str] = []

    for part in raw_parts:
        part_clean = part.strip()
        if len(part_clean) >= 10:
            words = part_clean.split()
            if 3 <= len(words) <= 30:
                sanitized_sentences.append(part_clean)
            elif len(words) > 30:
                sub_parts = re.split(r'[,;]\s+', part_clean)
                for sp in sub_parts:
                    sp_clean = sp.strip()
                    sp_words = sp_clean.split()
                    if 4 <= len(sp_words) <= 22 and len(sp_clean) >= 12:
                        sanitized_sentences.append(sp_clean)

    return raw_context, sanitized_sentences


# =============================================================================
# 6. REST-ENDPUNKT: /api/analyze (ASYNC MULTI-AGENT + ASYMMETRISCHES VETO)
# =============================================================================
@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_viewport_text(payload: AnalyzeRequest):
    text = payload.text
    url = payload.url
    sociological_mode = bool(payload.sociological_mode)

    text_hash = hashlib.md5(f"{text.strip()}_{sociological_mode}".encode("utf-8")).hexdigest()
    cache_key = f"{url.strip() or 'default_session'}_{sociological_mode}"

    cached_response = ANALYSIS_CACHE.get(cache_key, text_hash)
    if cached_response:
        return cached_response

    raw_context, sanitized_sentences = prepare_dual_tissue_input(text)

    user_payload_dict = {
        "raw_context": raw_context[:3500],
        "sanitized_sentences": sanitized_sentences[:35]
    }
    user_content = json.dumps(user_payload_dict, ensure_ascii=False)

    if sociological_mode:
        system_prompt_accuser = """Du bist ein unbestechlicher Forensiker der kritischen Gesellschaftstheorie (Bourdieu, Luhmann, Chomsky) des Q-O Systems.
Detektiere rücksichtslos toxische Manipulation im 'raw_context' und 'sanitized_sentences'.
Schema: {"t_mikro": 0.0, "t_makro": 0.0, "t_norm": 0.0, "habitus_distortion": 1.0, "toxic_snippets": [], "macro_tox_categories": []}"""

        system_prompt_evaluator = """Du bist AGENT 2 (DER GUTACHTER) des Q-O Systems (Soziologischer Modus).
Isoliere den Habermas'schen herrschaftsfreien Diskurs und empirische Evidenz.
Schema: {"n_mikro": 0.0, "n_makro": 0.0, "n_disk": 0.0, "nutrient_snippets": [], "macro_nut_categories": [], "pro_arguments": [], "contra_arguments": []}"""
    else:
        system_prompt_accuser = """Du bist AGENT 1 (DER ANKLÄGER) des Q-O Systems. Detektiere Clickbait, Framing und Toxine.
Schema: {"t_mikro": 0.0, "t_makro": 0.0, "toxic_snippets": [], "macro_tox_categories": []}"""

        system_prompt_evaluator = """Du bist AGENT 2 (DER GUTACHTER) des Q-O Systems. Isoliere harte Fakten, Evidenz und Dialektik.
Schema: {"n_mikro": 0.0, "n_makro": 0.0, "nutrient_snippets": [], "macro_nut_categories": [], "pro_arguments": [], "contra_arguments": []}"""

    accuser_task = async_call_groq_api(MODEL_ANALYZE, system_prompt_accuser, user_content, temperature=0.1)
    evaluator_task = async_call_groq_api(MODEL_ANALYZE, system_prompt_evaluator, user_content, temperature=0.1)

    groq_accuser_res, groq_evaluator_res = await asyncio.gather(accuser_task, evaluator_task)

    groq_accuser_res = groq_accuser_res or {"t_mikro": 1.0, "t_makro": 1.0, "toxic_snippets": [], "macro_tox_categories": []}
    groq_evaluator_res = groq_evaluator_res or {"n_mikro": 1.5, "n_makro": 1.5, "nutrient_snippets": [], "macro_nut_categories": [], "pro_arguments": [], "contra_arguments": []}

    t_mikro = float(groq_accuser_res.get("t_mikro", 0.0))
    t_makro = float(groq_accuser_res.get("t_makro", 0.0))
    t_norm = float(groq_accuser_res.get("t_norm", 0.0)) if sociological_mode else 0.0
    habitus_distortion = float(groq_accuser_res.get("habitus_distortion", 1.0)) if sociological_mode else 1.0
    habitus_distortion = max(1.0, min(1.5, habitus_distortion))

    n_mikro = float(groq_evaluator_res.get("n_mikro", 1.0))
    n_makro = float(groq_evaluator_res.get("n_makro", 1.0))
    n_disk = float(groq_evaluator_res.get("n_disk", 1.0)) if sociological_mode else 0.0

    raw_toxic_snippets = [s for s in groq_accuser_res.get("toxic_snippets", []) if isinstance(s, str) and len(s.split()) <= 25]
    raw_nutrient_snippets = [s for s in groq_evaluator_res.get("nutrient_snippets", []) if isinstance(s, str) and len(s.split()) <= 25]

    # ASYMMETRISCHES TEILSTRING-VETO
    clean_nutrient_snippets = []
    for nut_sentence in raw_nutrient_snippets:
        infected = False
        for tox_sentence in raw_toxic_snippets:
            if nut_sentence.lower() in tox_sentence.lower() or tox_sentence.lower() in nut_sentence.lower():
                infected = True
                break
        if not infected:
            clean_nutrient_snippets.append(nut_sentence)

    if len(clean_nutrient_snippets) == 0:
        n_mikro = 0.0
        if sociological_mode:
            n_disk = 0.0

    # EXPONENTEN-KASKADE & HOMÖOSTASE
    if sociological_mode:
        s_tox = (t_mikro + (t_makro * habitus_distortion) + (t_norm * 1.5)) / 3.0
        n_nut = (n_mikro + n_makro + n_disk) / 3.0
    else:
        s_tox = (t_mikro + t_makro) / 2.0
        n_nut = (n_mikro + n_makro) / 2.0

    delta = s_tox - n_nut

    if delta <= 0:
        raw_lq = math.exp(-delta)
    elif 0 < delta <= 2.0:
        raw_lq = math.exp(-delta * 1.2)
    else:
        raw_lq = math.exp(-(delta ** 2))

    lq_score = round(raw_lq, 2)
    raw_symmetry = 100.0 - (abs(t_makro - n_makro) * 20.0)
    symmetry_score = round(max(0.0, min(100.0, raw_symmetry)), 1)

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
        toxic_snippets=raw_toxic_snippets,
        nutrient_snippets=clean_nutrient_snippets,
        macro_tox_categories=groq_accuser_res.get("macro_tox_categories", []),
        macro_nut_categories=groq_evaluator_res.get("macro_nut_categories", []),
        morphology_state=MorphologyState(**{"class": morph_class, "pulse_frequency": pulse}),
        pro_arguments=groq_evaluator_res.get("pro_arguments", []),
        contra_arguments=groq_evaluator_res.get("contra_arguments", []),
        symmetry_score=symmetry_score,
        details={
            "delta": round(delta, 2),
            "s_tox_final": round(s_tox, 2),
            "n_nut_final": round(n_nut, 2),
            "pipeline": "Async httpx Dual-Agent + Substring Veto + Exponent Cascade"
        }
    )

    ANALYSIS_CACHE.put(cache_key, text_hash, response_obj)
    return response_obj


# =============================================================================
# 7. REST-ENDPUNKT: /api/flush (ASYNC DETOX VIA LLAMA 3.3 70B)
# =============================================================================
@app.post("/api/flush", response_model=FlushResponse)
async def linguistic_flush(payload: FlushRequest):
    raw_snippets = payload.toxic_snippets or []
    if payload.toxic_text and payload.toxic_text not in raw_snippets:
        raw_snippets.append(payload.toxic_text)

    combined_input = "\n".join(raw_snippets).strip() if raw_snippets else "Sensationsmeldung mit alarmistischer Ueberladung."

    system_prompt = """Du bist das linguistische Immunsystem und der Faktencheck-Forensiker von Q-O.
Antworte zwingend als JSON mit:
{
  "neutralized_text": "Klinisch neutrale Text-Glaettung",
  "context_antidote": "Forensischer Faktencheck mit Weltwissen (max 3 Saetze)"
}"""

    user_content = f"Infizierte Textpassagen zur Analyse und Entgiftung:\n{combined_input}"

    groq_flush_res = await async_call_groq_api(MODEL_FLUSH, system_prompt, user_content, temperature=0.15)

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

    fallback_neutralized = "Der Sachverhalt wurde von reisserischer Rhetorik befreit und sachlich neutral zusammengefasst."
    fallback_antidote = "Forensischer Faktencheck: Formulierung nutzt emotionale Trigger zur Aufmerksamkeitserzeugung."

    return FlushResponse(
        original_text=combined_input,
        neutralized_text=fallback_neutralized,
        context_antidote=fallback_antidote,
        clean_alternative=fallback_neutralized,
        lq_boosted=1.25
    )


# =============================================================================
# 8. SYSTEM STATUS & HEALTH CHECK
# =============================================================================
@app.get("/api/health")
async def health_check():
    return {
        "status": "metabolic_vault_online",
        "pipeline": "Async httpx Dual Multi-Agent + Asymmetric Substring Veto",
        "engine": "httpx_async_lru",
        "version": "3.4.0",
        "cached_sessions": len(ANALYSIS_CACHE.cache),
        "time": time.time()
    }


if __name__ == "__main__":
    import uvicorn
    import sys

    is_exe = getattr(sys, 'frozen', False)
    if is_exe:
        uvicorn.run(app, host="127.0.0.1", port=8000, log_config=None)
    else:
        print("🪐 [Q-O Core] Zünde asynchrone Multi-Agenten-Pipeline mit httpx & Bounded LRU Cache...")
        uvicorn.run(app, host="127.0.0.1", port=8000)