# System Architektur

## Überblick

Das DQV Team Portal besteht aus zwei Teilen:

```
┌─────────────────────────────────────────────────────┐
│            GitHub Pages Frontend                     │
│           (index.html + JavaScript)                 │
│         Team Portal UI mit Login & Matches          │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ JSONP API Calls
                      │
┌─────────────────────▼───────────────────────────────┐
│      Google Apps Script Backend (doGet)             │
│         JSON/JSONP API für Datenabruf              │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ Reads
                      │
┌─────────────────────▼───────────────────────────────┐
│         Google Sheets Datenquellen                   │
│  (Konfiguration, Teams, Matches)                    │
└──────────────────────────────────────────────────────┘
```

## Frontend (Client)

**Datei:** `index.html` (Root-Verzeichnis für GitHub Pages)

### Funktionsweise:

1. User öffnet Portal im Browser
2. Gibt Team-ID oder Captain-ID ein
3. JavaScript sendet JSONP-Request an Backend
4. Backend antwortet mit Match-Daten
5. Frontend rendert Match-Informationen

### Technologie:

- HTML5 + CSS3 (Responsive Design)
- Vanilla JavaScript (keine Abhängigkeiten)
- JSONP für Cross-Domain Requests
- Fallback auf `navigator.clipboard` für Copy-To-Clipboard

## Backend (Server)

**Datei:** `server/gas_team_portal.gs`

### Funktionsweise:

1. **doGet(e)** - Haupteinstiegspunkt

   - Verarbeitet Query-Parameter
   - Routet zu verschiedenen Aktionen
   - Unterstützt JSON und JSONP

2. **buildPortalData(loginId)** - Core Logik

   - Lädt Config, Teams und Matches
   - Filtered Matches für das Team
   - Berechnet Zugangszeiten
   - Gibt Portal-Daten zurück

3. **Loaders** - Datenbeschaffung

   - `loadConfig()` - Konfiguration aus Google Sheets
   - `loadTeams()` - Team-Daten
   - `loadMatches()` - Match-Daten (mit OneDrive Fallback)

4. **Caching** - Performance
   - Config: 30 Minuten Cache
   - Teams: 5 Stunden Cache
   - Matches: 30 Minuten Cache
   - Manuell löschbar via `?clearcache=true`

## Datenbeschaffung

### Google Sheets Struktur

```
"Konfiguration" Sheet:
┌───────────────────┬──────────────────────────┐
│ Key               │ Value                    │
├───────────────────┼──────────────────────────┤
│ ZOOM_URL          │ https://zoom.us/...      │
│ CATEGORY_FOLDER   │ https://drive.google...  │
│ ACCESS_MINUTES    │ 30                       │
└───────────────────┴──────────────────────────┘

"Teams" Sheet:
┌──────────────┬─────────┬──────────┬────────────┐
│ Teamname     │ Kürzel  │ Team-ID  │ Captain-ID │
├──────────────┼─────────┼──────────┼────────────┤
│ Team ABC     │ ABC     │ ABC12345 │ ABC_CAPT   │
└──────────────┴─────────┴──────────┴────────────┘

"Matches" Sheet:
┌────┬──────────┬────────┬─────────┬──────────────┐
│ ...│ Team A   │ Team B │ Startzeit│ Zähl-Link   │
├────┼──────────┼────────┼─────────┼──────────────┤
│ ...│ Team ABC │ Team XY│ 14:00   │ https://...  │
└────┴──────────┴────────┴─────────┴──────────────┘
```

## API Endpoints

### 1. teamPortalData

```
GET /exec?action=teamPortalData&loginId=TEAM_ID
```

Gibt Portal-Daten für ein Team zurück.

**Response:**

```json
{
  "success": true,
  "team": { "name": "...", "kuerzel": "..." },
  "isCaptain": true,
  "matches": [
    {
      "gruppe": "B",
      "teamA": "Team A",
      "teamB": "Team B",
      "isLive": true,
      "isAccessible": true,
      "countingFormUrl": "https://...",
      "passwordHalves": { "HZ1": "...", "HZ2": "..." }
    }
  ]
}
```

### 2. debugTeams

```
GET /exec?action=debugTeams
```

Debug-Endpoint mit Übersicht aller Teams und Matches.

### 3. Cache Control

```
GET /exec?clearcache=true&clear=teams
```

Löscht Cache (teams, config, matches oder all)

## Zeiten & Zugangskontrollen

### Access Window

```
startTime = Match Startzeit
accessTime = startTime - ACCESS_MINUTES_BEFORE (default: 30)
endTime = startTime + MATCH_ACTIVE_HOURS (default: 4)

isAccessible = now zwischen accessTime und endTime
```

Beispiel:

- Match: 14:00
- Access: 13:30 (30 Minuten vorher)
- Ende: 18:00 (4 Stunden später)

### Captain-Only Info

- Password-Hälfte nur sichtbar wenn:
  - User ist Captain
  - Match ist LIVE (isLive = true)

## Sicherheit

### Verschlüsselung

- ✅ HTTPS erzwungen (Google Apps Script)
- ✅ JSONP zur Cross-Origin Kommunikation
- ⚠️ Team-IDs sind plaintext (keine echte Auth)

### Datenschutz

- ✅ SHEET_ID in Script Properties (nicht auf GitHub)
- ✅ Passwort-Hälften nur für Captains und während LIVE
- ⚠️ Keine Authentifizierung gegen externe Systeme

## Fehlerbehandlung

### Backend Fehler

1. SHEET_ID nicht gespeichert → Error Message
2. Google Sheet nicht erreichbar → Error Message
3. Team nicht gefunden → Debug Info mit Tips

### Frontend Fehler

1. JSONP-Callback fehlgeschlagen → Login-Fehler
2. Netzwerkfehler → Loading Spinner
3. Ungültige Eingabe → Validierungsmeldung

## Performance Optimierungen

1. **Caching** - Reduziert API-Aufrufe
2. **Matching by startDate** - Nur ein Match pro Zeit
3. **Lazy Loading** - HTML wird erst nach Login aufgebaut
4. **JSONP** - Kein CORS-Overhead
5. **Lokale Berechnungen** - Zeiten im Frontend berechnet

## Zukünftige Verbesserungen

- [ ] Echte Authentifizierung (OAuth2)
- [ ] Verschlüsselte Passwörter
- [ ] REST API statt JSONP
- [ ] Mobile App
- [ ] WebSocket für Live-Updates
- [ ] Datenbank statt Google Sheets
