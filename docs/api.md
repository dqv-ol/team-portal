# API Dokumentation

Das Backend stellt eine JSONP/JSON API bereit zum Abrufen von Portal-Daten.

## Base URL

```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

## Endpoints

### 1. teamPortalData

Gibt alle Portal-Daten für ein bestimmtes Team zurück.

**Request:**
```
GET /exec?action=teamPortalData&loginId=TEAM_OR_CAPTAIN_ID&format=jsonp&callback=handlePortalData
```

**Parameter:**
| Name | Typ | Required | Beschreibung |
|------|-----|----------|-------------|
| action | string | ✅ | Muss `teamPortalData` sein |
| loginId | string | ✅ | Team-ID oder Captain-ID (mindestens 8 Zeichen) |
| format | string | ❌ | `json` oder `jsonp` (default: json) |
| callback | string | ❌ | JSONP Callback-Funktion (default: handlePortalData) |

**Response (Success):**
```json
{
  "success": true,
  "team": {
    "name": "Gemischtes Pack",
    "kuerzel": "GEP"
  },
  "isCaptain": true,
  "zoomUrl": "https://us06web.zoom.us/j/...",
  "inquiryFormUrl": "https://forms.gle/...",
  "categoryFolderUrl": "https://drive.google.com/...",
  "questionsFolderUrl": "https://drive.google.com/...",
  "matches": [
    {
      "gruppe": "B",
      "teamA": "Die Quizbegierigen",
      "teamB": "Gemischtes Pack",
      "kuerzelA": "DQB",
      "kuerzelB": "GEP",
      "startzeitISO": "2026-01-08T08:00:00.000Z",
      "accessTimeISO": "2026-01-08T07:50:00.000Z",
      "endDateISO": "2026-01-09T08:00:00.000Z",
      "isAccessible": true,
      "isLive": true,
      "isTeamA": false,
      "countingFormUrl": "https://results.quiznations.com/match/...",
      "passwordHalves": {
        "HZ1": "2Zwei",
        "HZ2": "4Vier"
      }
    }
  ]
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Team nicht gefunden",
  "debug": {
    "loginIdLength": 8,
    "loginIdPreview": "ABC1...",
    "teamsLoaded": 12,
    "hint": "Nutze ?action=debugTeams um alle verfügbaren Teams zu sehen"
  }
}
```

**Conditional Fields:**
- `categoryFolderUrl` - Nur wenn ein Match im Zugriffsfenster ist
- `questionsFolderUrl` - Nur wenn User Captain ist UND ein Match LIVE
- `passwordHalves` - Nur wenn User Captain ist UND Match LIVE

### 2. debugTeams

Debug-Endpoint zur Überprüfung der Konfiguration.

**Request:**
```
GET /exec?action=debugTeams&format=jsonp&callback=handleDebugInfo
```

**Response:**
```json
{
  "success": true,
  "debug": true,
  "teamsCount": 12,
  "matchesCount": 24,
  "teams": [
    {
      "name": "Team ABC",
      "kuerzel": "ABC",
      "teamIdLength": 8,
      "teamIdPreview": "ABC1...",
      "captainIdLength": 8,
      "captainIdPreview": "ABC_...",
    }
  ],
  "configKeys": [
    "ZOOM_URL",
    "INQUIRY_FORM_URL",
    "CATEGORY_FOLDER_URL",
    ...
  ]
}
```

### 3. Cache Control

Löscht den internen Cache.

**Request:**
```
GET /exec?clearcache=true&clear=teams
```

**Parameter:**
| Name | Typ | Values | Beschreibung |
|------|-----|--------|-------------|
| clearcache | string | `true` | Cache-Löschen aktivieren |
| clear | string | `config`, `teams`, `matches`, `all` | Was gelöscht werden soll |

**Response:**
```json
{
  "ok": true,
  "cleared": "teams"
}
```

## Response Format

### JSON
```javascript
fetch(url)
  .then(r => r.json())
  .then(data => console.log(data))
```

### JSONP
```javascript
// Der Callback wird automatisch aufgerufen
function handlePortalData(data) {
  console.log(data);
}
// Script-Tag wird vom Frontend hinzugefügt
```

## Fehler-Codes

| Fehler | HTTP | Grund | Lösung |
|--------|------|-------|--------|
| "SHEET_ID nicht gespeichert" | 500 | Property nicht gesetzt | Siehe server/SETUP_GAS.md |
| "Team nicht gefunden" | 200 | Login-ID falsch | Überprüfen Sie die ID |
| "Blatt nicht gefunden" | 500 | Google Sheet Struktur falsch | Blatt-Namen überprüfen |
| "ID muss mindestens 8 Zeichen lang sein" | 200 | Zu kurze Input | Längere ID verwenden |

## Timeout & Rate Limits

- **Timeout:** 30 Sekunden (Google Apps Script Standard)
- **Rate Limit:** Keine offiziellen Limits, aber beachten Sie die Caching-Policies
- **Cache TTL:** Config (30 min), Teams (5 hours), Matches (30 min)

## Beispiele

### cURL
```bash
curl "https://script.google.com/macros/s/YOUR_ID/exec?action=teamPortalData&loginId=ABC12345&format=json"
```

### JavaScript
```javascript
const GAS_URL = "https://script.google.com/macros/s/YOUR_ID/exec";

async function getPortalData(loginId) {
  const url = `${GAS_URL}?action=teamPortalData&loginId=${loginId}`;
  const response = await fetch(url);
  return await response.json();
}

getPortalData("ABC12345").then(data => {
  console.log(data.team.name);
  console.log(data.matches);
});
```

### JavaScript (JSONP)
```javascript
function handlePortalData(data) {
  console.log(data);
}

const script = document.createElement('script');
script.src = `${GAS_URL}?action=teamPortalData&loginId=ABC12345&format=jsonp&callback=handlePortalData`;
document.body.appendChild(script);
```

## Datentypen

| Feld | Typ | Format |
|------|-----|--------|
| startzeitISO | string | ISO 8601 |
| teamA | string | Text |
| isCaptain | boolean | true/false |
| isLive | boolean | true/false |
| passwordHalves | object | {HZ1: string, HZ2: string} |

## Häufige Fragen

**Q: Warum JSONP statt REST?**
A: JSONP funktioniert ohne CORS-Konfiguration auf dem Backend.

**Q: Kann ich die API von einer anderen Domain aufrufen?**
A: Ja, JSONP erlaubt Cross-Domain Requests.

**Q: Wie often sollte ich die API aufrufen?**
A: Das Frontend ruft einmal beim Login auf. Caching auf dem Backend ist aktiviert.

**Q: Kann ich die Teams über die API aktualisieren?**
A: Nein, derzeit nur Lesezugriff. Schreiben erfolgt über das Google Sheet direkt.
