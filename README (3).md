# 🪐 PROJEKT „Q-O“: DEZENTRALES BIOMORPH-LINGUISTISCHES CYBER-HUD

Das Projekt **Q-O** ist ein dezentrales, reaktives Echtzeit-Analyse-Ökosystem, das direkt im Viewport des Browsers operiert. Es seziert semantische Datenströme, isoliert informationelle Toxine von rationalen Nährstoffen und überführt diese über eine mathematisch-metabolische Homöostase in eine kinetische Interface-Matrix.

---

## 🏗️ DIE SYSTEM-ARCHITEKTUR (DER FEHLERFREIE KERN)

Das Gesamtsystem operiert über eine strikte Dreiteilung der Gewalten, um maximale Resilienz, Unzerstörbarkeit und Performance im 60-FPS-Zyklus zu garantieren:

### 1. Das metabolische Gehirn (`main.py`)
Das FastAPI-Backend fungiert als asynchroner Multi-Agenten-Reaktor. Über eine parallele `asyncio.gather`-Pipeline werden zwei diametral agierende LLM-Agenten (Ankläger vs. Gutachter) geschaltet.
*   **Asynchrone Skalierung:** Durch den vollständigen Verzicht auf blockierenden I/O (`httpx.AsyncClient`) arbeitet das Backend ohne native Thread-Pausen.
*   **Memory-Leak-Schutz:** Ein integrierter `BoundedLRUCache` deckelt den Speicherverbrauch deterministisch auf maximal 100 Sessions bei einer Stunde Time-to-Live (TTL).

### 2. Der Datentresor & Signal-Relais (`background.js`)
Das Hintergrund-Skript verwaltet den Zustand und überbrückt die flüchtigen Intervalle moderner Browser-Architekturen.
*   **Manifest V3 Resilienz:** Um dem automatischen Terminierungstod von MV3 Service Workern verlustfrei zu begegnen, spiegelt das Relais alle eingehenden Datenströme atomar und persistent in die lokale `IndexedDB` (`QO_Metabolic_Vault`) und den `chrome.storage.local`.

### 3. Der kinetische Reaktor (`content.js` & `content.css`)
Das Frontend injiziert das HUD direkt in das Ziel-DOM, ist dabei jedoch über ein geschlossenes Shadow-DOM (`mode: 'closed'`) vollkommen isoliert von CSS-Resets oder globalen Skript-Injektionen der Trägerwebseite.
*   **Zero DOM-Thrashing:** String-Konkatenationen via `innerHTML` im Animations-Loop wurden zu 100 % eliminiert. Das System recycelt einen statischen Partikel-Pool aus 40 persistenten SVG-Instanzen ausschließlich über atomare, GPU-beschleunigte `setAttribute`-Operationen.

---

## 🦠 DIE PARTIKULÄRE NEKROTISCHE INFUSION (DER KINETISCHE REAKTOR)

![Partikuläre nekrotische Infusion](assets/widget_prev.gif "Nekrotischer Teerschwarm Kinetik")
*(Hinweis: Ersetze diesen Platzhalter-Link in deiner lokalen Datei durch den realen Pfad zu deinem GIF, z. B. `assets/infusion.gif`)*

### Was das Verhalten des Teerschwarms so besonders macht:

*   **Direkte mathematische Kopplung:** Der Partikelschwarm ist kein loses Grafik-Overlay. Seine Dichte, Rotationsgeschwindigkeit und viskoelastische Trägheit sind über die Exponenten-Kaskade direkt mit dem **Linguistic Quality Score (LQ)** des Backends verschaltet. Sinkt die Textqualität, kollabiert der Organismus synchron vor deinen Augen.
*   **Der teerschwarze Metabolismus:** Die Partikel verhalten sich wie ein flüssiges, biologisches Toxin. Sie werden entlang der simulierten Membran-Buchten injiziert und "fressen" sich visuell in den cyanfarbenen Kern hinein, wodurch eine plastische mechanische Deformation (`strainDip`) erzwungen wird.
*   **Garbage-Collection-Immunität:** Im Gegensatz zu herkömmlichen Web-Animationen, die bei hoher Partikeldichte ins Ruckeln geraten, arbeitet der Reaktor mit einem **statischen Objekt-Pooling**. Es werden keine DOM-Knoten im Loop erzeugt oder vernichtet. Die Verformung und Bewegung der 40 Teer-Bubbles erfolgt rein über GPU-beschleunigte Vektortransformationen – absolut flüssig im unerbittlichen 60-FPS-Takt.

## 🎨 DER ERGONOMISCHE GOLDSTANDARD (DAS WORTLOSE CHIFFRE)

Das Interface bricht radikal mit konventionellen UI-Formaten. Es existiert kein Text, keine Statuszeile und kein lebloser Schatten auf dem Bildschirm. Die Form wird rein über eine suggestionsbasierte, geometrische Matrix vermittelt


*   **Der Z-Index-Schachzug:** Das Biomorph-Widget thront permanent sichtbar auf Schicht `z-index: 100`, während das HUD-Overlay physisch auf Schicht `z-index: 10` dahinterliegt. Das garantiert ein sofortiges, latenzfreies Drag-and-Drop des Widgets zu jedem Zeitpunkt.
*   **Asymmetrische Diagonal-Luminiszenz:** Das gedachte 9:16-Smartphone-Format wird ausschließlich durch zwei hauchdünne Lichtwinkel (Oben-Links in Cyan, Unten-Rechts in Lila/Violett) mit 12px Radius angedeutet. Die Linienmitten laufen linear auf 0% Opacity aus.

---

## 🎛️ DIE VIER GLEICHRANGIGEN STEUERMODULE

Das System verwaltet seine Zustände über ein dezentrales Netzwerk autonomer, gleichberechtigter Sensoren, die parallel auf das globale HTML5-Datenattribut `data-hud-state` (`IDLE` / `LATENCY` / `ACTIVE` / `INTERACTING`) reagieren:

*   **Modul I: Der „Kryo-Fokus“ (Tiefenunschärfe)**
    Im reinen Beobachtungsmodus (`ACTIVE`) liegt ein zarter Hintergrund-Blur von `2px` über der Trägerwebseite. Sobald der Cursor den Funktionsbereich im unteren Drittel (Y >= 420px) betritt (`INTERACTING`), bricht die Tiefenunschärfe selektiv auf `6px` bis `8px` hochzuführen. Die Webseite verschwimmt radikal; die Steuerung gewinnt absolute Plastizität.
*   **Modul II: Die „Taktile Nut“ (Glas-Gravur)**
    Die 160px kurze Umlaufbahn des Reglers ist als physikalische Gravur im Glas konstruiert. Zwei parallel verlaufende, mikroskopisch dünne Haarlinien (obere Schattenkante, untere Lichtkante) erzeugen die dreidimensionale visuelle Illusion einer eingeätzten Vertiefung.
*   **Modul III: Die „Vektor-Elongation“ (Masse & Kinetik)**
    Der stufenlose 4px-Mondpunkt besitzt eine simulierte physikalische Trägheit. Bei schneller Cursor-Bewegung verformt sich der Kreis im 60-FPS-Loop zu einer horizontal gestreckten Ellipse und zieht einen flüchtigen Lichtschweif nach sich. An den Interaktions-Grenzen prallt der Mond über eine Hookesche Federgleichung elastisch ab.
*   **Modul IV: Das „Chromatische Echo“ (Resonanz)**
    Die diagonalen Lichtkanten stehen in direkter Resonanz mit dem inneren Organismus. Sie absorbieren die Farbdynamik des biologischen Kerns in Echtzeit und spiegeln energetische Schwankungen und toxische Verdichtungen des Textgewebes an den äußeren Kanten wider.

---

## 🚀 INITIALISIERUNG & ZÜNDUNG

1.  **Backend starten:**
    Initalisiere das FastAPI-Backend im entsprechenden Verzeichnis über die Konsole:
    ```bash
    python main.py
    ```
2.  **Chrome Erweiterung laden:**
    *   Öffne Google Chrome und navigiere zu `chrome://extensions/`.
    *   Aktiviere oben rechts den **Entwicklermodus**.
    *   Klicke auf **Entpackte Erweiterung laden** und wähle den Projektordner aus.
3.  **Metabolismus starten:**
    Bewege den Cursor auf einer beliebigen Webseite über das frei schwebende Widget. Nach Ablauf der 400ms Hover-Latenz entfaltet sich die wortlose, haptische Geometrie der Matrix im Hintergrund.

---

## ⚠️ SYSTEMISCHE DISCLAIMER

*   **Nutzungskontext:** Das Projekt Q-O ist ein experimentelles, biomorph-linguistisches Interventions- und Analysewerkzeug. Die Nutzung erfolgt vollständig auf eigene Verantwortung.
*   **API-Infrastruktur:** Das System setzt für die dialektische Echtzeitanalyse externe Sprachmodell-Schnittstellen (Groq Cloud API) voraus. Für das Aufkommen und die Verwaltung anfallender API-Kosten oder Ratenbegrenzungen (Rate-Limits) ist der Anwender selbst verantwortlich.
