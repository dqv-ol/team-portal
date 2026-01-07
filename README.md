# DQV Team Portal

Ein rollenbasiertes Portal für die DQV Online-Liga, das Teams zeitgesteuerten Zugriff auf alle Informationen zum aktuellen Spieltag gewährt. Dazu gehören Startzeit, Link zum Download der Kategorien (wird zeitgesteuert angezeigt) und für die Team-Captains die jeweilige Passworthälften.

## 🎯 Überblick

Das Team Portal ermöglicht Teams und Captains den Zugriff auf Kategorien-Downloads zu festgelegten Zeiten vor und während ihrer Matches. Das System nutzt eine Split-Architektur:

- **Backend:** Google Apps Script (GAS) als JSON/JSONP API
- **Frontend:** Statische HTML-Seite auf GitHub Pages
- **Datenhaltung:** Google Sheets

## ✨ Features

### Rollenbasierter Zugriff

- **Team-Mitglieder:** Zugriff auf Kategorien-Downloads im definierten Zeitfenster
- **Captains:** Zusätzlich Zugriff auf unterschiedliche Passworthälften für **beide Halbzeiten** (HZ1 und HZ2)
- **Captains:** Zusätzlich Link zum Download der Fragen (QUESTIONS_FOLDER_URL)

### Zwei Halbzeiten pro Spieltag

- Jedes Match hat zwei Halbzeiten (HZ1 und HZ2)
- Captains erhalten separate Passworthälften für jede Halbzeit
- Captains haben Zugriff auf separate Ordner für Kategorien und Fragen

- Downloads verfügbar ab X Minuten vor Spielbeginn (konfigurierbar)
- Zugriff aktiv für Y Stunden nach Spielbeginn (konfigurierbar)
- Countdown-Anzeige bis zur Verfügbarkeit
- LIVE-Badge während aktiver Matches

### Sicherheit & Performance

- Eindeutige Team-IDs und Captain-IDs (min. 8 Zeichen)
- JSONP-basierte API-Kommunikation (kein CORS-Problem)
- Intelligentes Caching (Config: 30min, Teams: 5h, Matches: 30min)
- Kein Zugriff auf sensible Daten durch Sheet-ID allein

## 🏗️ Architektur

```
┌─────────────────────┐
│   GitHub Pages      │
│   (index.html)      │
│   Statische Seite   │
└──────────┬──────────┘
           │ JSONP
           │ Calls
           ▼
┌─────────────────────┐
│  Google Apps Script │
│  (gas_team_portal)  │
│  JSON/JSONP API     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Google Sheets     │
│   - Konfiguration   │
│   - Teams           │
│   - Zeiten          │
└─────────────────────┘
```

## 📋 Voraussetzungen

- Google Account mit Zugriff auf Google Sheets & Apps Script
- GitHub Account (für Pages Hosting)
- Google Sheet mit folgenden Tabs:
  - **Konfiguration** (Key-Value Paare)
  - **Teams** (Spalten: Kürzel, Teamname, Team-ID, Captain-ID)
  - **Zeiten** (Spalten: Gruppe, Kürzel A, Kürzel B, Team A, Team B, Startzeit)

## 🚀 Setup

### 1. Google Sheet vorbereiten

#### Tab: Konfiguration

```
Schlüssel                   | Wert
----------------------------|---------------------------
CATEGORY_FOLDER_URL         | https://drive.google.com/...
QUESTIONS_FOLDER_URL        | https://drive.google.com/...
ACCESS_MINUTES_BEFORE       | 30
MATCH_ACTIVE_HOURS          | 4
PASSWORT_HAELFTE_A_HZ1      | Passwort Team A (Halbzeit 1)
PASSWORT_HAELFTE_B_HZ1      | Passwort Team B (Halbzeit 1)
PASSWORT_HAELFTE_A_HZ2      | Passwort Team A (Halbzeit 2)
PASSWORT_HAELFTE_B_HZ2      | Passwort Team B (Halbzeit 2)
SPIELTAG_DATUM              | 15.01.2026
```

**Hinweise:**

- `CATEGORY_FOLDER_URL` - Link zum Google Drive Ordner mit den Kategorien (für alle Teams)
- `QUESTIONS_FOLDER_URL` - Link zum Google Drive Ordner mit den Fragen (nur für Captains)
- `PASSWORT_HAELFTE_*_HZ1/HZ2` - Separate Passworthälften für Halbzeit 1 und 2
- `SPIELTAG_DATUM` (Format: DD.MM.YYYY) - Erforderlich, wenn im Tab "Zeiten" nur Uhrzeiten stehen

#### Tab: Teams

```
Kürzel | Teamname              | Team-ID        | Captain-ID
-------|-----------------------|----------------|---------------
ABC    | Awesome Quiz Team     | T12345678X     | C87654321Y
...
```

**Wichtig:** IDs müssen mindestens 8 Zeichen lang und eindeutig sein!

#### Tab: Zeiten

```
Gruppe | Kürzel A | Kürzel B | Team A        | Team B        | Startzeit
-------|----------|----------|---------------|---------------|-------------
A      | ABC      | XYZ      | Team Alpha    | Team Beta     | 19:00
B      | GEP      | DQB      | Gemischtes... | Die Quiz...   | 20:30
```

**Hinweis zu zwei Halbzeiten:**

- Eine Zeile pro Match mit einer Startzeit
- Das System erzeugt automatisch zwei Halbzeiten (HZ1 und HZ2) intern
- Beide Halbzeiten haben die gleiche Startzeit, aber unterschiedliche Passwörter
- Bei nur Uhrzeit (z.B. `19:00`) wird automatisch `SPIELTAG_DATUM` aus der Konfiguration ergänzt

### 2. Google Apps Script erstellen

1. Öffne dein Google Sheet → **Erweiterungen** → **Apps Script**
2. Lösche den Standardcode
3. Kopiere den Inhalt von `gas_team_portal.gs` ein
4. **Wichtig:** Passe `SHEET_ID` in Zeile 12 an:
   ```javascript
   const SHEET_ID = "DEINE_SHEET_ID_HIER";
   ```
5. Speichern (Strg+S)

### 3. Web App deployen

1. Im Apps Script Editor: **Bereitstellen** → **Neue Bereitstellung**
2. Typ: **Web-App**
3. Einstellungen:
   - **Ausführen als:** Ich
   - **Zugriff:** Jeder
4. **Bereitstellen** klicken
5. **Web-App URL** kopieren (z.B. `https://script.google.com/macros/s/AKfycb.../exec`)

### 4. Frontend konfigurieren

1. Öffne `index.html`
2. Füge die Web App URL ein (Zeile ~228):
   ```javascript
   const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycb.../exec";
   ```
3. Optional: Logo anpassen (Base64-String in `LOGO_BASE64`)

### 5. GitHub Pages aktivieren

1. Pushe `index.html` in dein GitHub Repo
2. **Settings** → **Pages**
3. **Source:** main branch, root folder
4. Speichern
5. Seite verfügbar unter: `https://<username>.github.io/<repo>/index.html`

## 🧪 Testing

### Test Tools

#### 1. PowerShell Script (test_gas_api.ps1)

```powershell
.\test_gas_api.ps1 -GasUrl "https://script.google.com/macros/s/AKfycb.../exec"
```

Tests:

- ✅ Base URL erreichbar
- ✅ Debug Endpoint (alle Teams)
- ✅ Cache Clearing
- ✅ Optional: Login Test mit Team-ID

#### 2. Debug HTML (test_jsonp.html)

Öffne `test_jsonp.html` im Browser:

- **Teams anzeigen:** Zeigt alle geladenen Teams mit ID-Längen
- **Login Test:** Testet vollständigen Login-Flow mit einer ID
- **Cache prüfen:** Zeigt Config-Keys, Team-Count, Match-Count

### Debug Endpoints

#### Alle Teams anzeigen

```
GET https://.../exec?action=debugTeams
```

Zeigt: Team-Namen, Kürzel, ID-Längen (erste 4 Zeichen)

#### Cache leeren

```
GET https://.../exec?clearcache=true
GET https://.../exec?clearcache=true&clear=teams  # Nur Teams
```

## 🔧 Konfiguration

### Cache TTLs anpassen

In `gas_team_portal.gs`:

```javascript
const TTL_CONFIG = 1800; // 30 Minuten
const TTL_TEAMS = 18000; // 5 Stunden
const TTL_MATCHES = 1800; // 30 Minuten
```

### Zeitfenster anpassen

Im Google Sheet → Tab "Konfiguration":

- `ACCESS_MINUTES_BEFORE`: Minuten vor Spielbeginn (z.B. 30)
- `MATCH_ACTIVE_HOURS`: Stunden nach Spielbeginn (z.B. 4)

### OneDrive Fallback (optional)

Falls Zeiten aus OneDrive CSV geladen werden sollen:

```
Schlüssel           | Wert
--------------------|--------------------------------
ONEDRIVE_EXCEL_URL  | https://onedrive.live.com/...
```

## 🐛 Troubleshooting

### Problem: "Team nicht gefunden"

**Ursachen:**

- Team-ID/Captain-ID falsch eingegeben
- ID zu kurz (< 8 Zeichen)
- Teams-Tab im Sheet fehlerhaft

**Lösung:**

1. Debug-Endpoint aufrufen: `?action=debugTeams`
2. Prüfen: Sind alle Teams geladen?
3. ID-Länge überprüfen (min. 8 Zeichen)
4. Cache leeren: `?clearcache=true`

### Problem: Falsches Datum (31. Dezember 1899)

**Ursache:**
Im Sheet steht nur Uhrzeit (z.B. "19:00"), aber `SPIELTAG_DATUM` fehlt in der Konfiguration.

**Lösung:**

1. Google Sheet → Tab "Konfiguration"
2. Neue Zeile: `SPIELTAG_DATUM | 15.01.2026`
3. Cache leeren: `?clearcache=true`

### Problem: Fragen-Button wird nicht angezeigt

**Ursache:**
Captains sehen nur den Fragen-Button, wenn `QUESTIONS_FOLDER_URL` in der Konfiguration gesetzt ist.

**Lösung:**

1. Google Sheet → Tab "Konfiguration"
2. Neue Zeile: `QUESTIONS_FOLDER_URL | https://drive.google.com/...`
3. Cache leeren: `?clearcache=true`

### Problem: Alte FOLDER_URL wird nicht erkannt

**Ursache:**
Das System wurde auf `CATEGORY_FOLDER_URL` aktualisiert. Die alte `FOLDER_URL` wird noch als Fallback akzeptiert.

**Lösung (empfohlen):**

1. Alte Zeile entfernen: `FOLDER_URL`
2. Neue Zeile hinzufügen: `CATEGORY_FOLDER_URL | https://drive.google.com/...`
3. Cache leeren: `?clearcache=true`

### Problem: Team-Name wird nicht angezeigt

**Ursache:**
Spalte im Teams-Tab heißt anders als erwartet.

**Lösung:**

- Spaltenname sollte `Teamname` oder `Name` sein
- Bei leerem Namen wird automatisch `Kürzel` als Fallback genutzt

### Problem: CORS-Fehler

**Ursache:**
Frontend versucht direkten JSON-Request (statt JSONP).

**Lösung:**

- Prüfe: Wird `format=jsonp&callback=...` an die URL angehängt?
- Im GAS Script wird JSONP korrekt zurückgegeben (MimeType.JAVASCRIPT)?

## 📁 Dateistruktur

```
.
├── gas_team_portal.gs      # Google Apps Script (Backend)
├── index.html              # Frontend (GitHub Pages)
├── test_jsonp.html         # Debug Tool (Browser)
├── test_gas_api.ps1        # Test Script (PowerShell)
├── DEPLOYMENT.md           # Deployment Guide
└── ReadMe-TeamPortal.md    # Diese Datei
```

## 🔒 Sicherheitshinweise

### Was NICHT committen:

- `gas_team_portal.gs` (enthält `SHEET_ID`)
- `test_gas_api.ps1` (kann Login-Credentials enthalten)

Erstelle `.gitignore`:

```gitignore
gas_team_portal.gs
*.gs
test_gas_api.ps1
```

### Warum ist SHEET_ID nicht kritisch?

Die Sheet-ID allein gewährt **keinen Zugriff** auf die Daten. Zugriff auf Google Sheets wird über Berechtigungen gesteuert. Dennoch ist es best practice, Backend-Code nicht öffentlich zu teilen.

## 📝 API Dokumentation

### Endpoint: teamPortalData

**Request:**

```
GET /exec?action=teamPortalData&loginId=TEAM_OR_CAPTAIN_ID&format=jsonp&callback=handlePortalData
```

**Response (JSONP):**

```javascript
handlePortalData({
  success: true,
  team: {
    name: "Teamname",
    kuerzel: "ABC",
  },
  isCaptain: true,
  categoryFolderUrl: "https://drive.google.com/...",
  questionsFolderUrl: "https://drive.google.com/...",
  matches: [
    {
      gruppe: "A",
      teamA: "Team Alpha",
      teamB: "Team Beta",
      kuerzelA: "ABC",
      kuerzelB: "XYZ",
      startzeitISO: "2026-01-15T19:00:00.000Z",
      accessTimeISO: "2026-01-15T18:30:00.000Z",
      endDateISO: "2026-01-15T23:00:00.000Z",
      isAccessible: true,
      isLive: false,
      isTeamA: true,
      passwordHalves: {
        HZ1: "Passwort HZ1 für Team A",
        HZ2: "Passwort HZ2 für Team A",
      },
    },
  ],
});
```

### Endpoint: debugTeams

**Request:**

```
GET /exec?action=debugTeams&format=jsonp&callback=handleDebugResponse
```

**Response:**

```javascript
handleDebugResponse({
  "success": true,
  "debug": true,
  "teamsCount": 104,
  "matchesCount": 50,
  "teams": [
    {
      "name": "Teamname",
      "kuerzel": "ABC",
      "teamIdLength": 10,
      "teamIdPreview": "T123...",
      "captainIdLength": 10,
      "captainIdPreview": "C987..."
    }
  ],
  "configKeys": ["FOLDER_URL", "ACCESS_MINUTES_BEFORE", ...]
})
```

## 🤝 Collaboration

### Zweiten Nutzer hinzufügen

**Methode 1: Direkt im Apps Script**

1. Apps Script Editor öffnen
2. Rechts oben: **Freigeben** (Share-Icon)
3. E-Mail-Adresse eingeben
4. Rolle: **Bearbeiter** oder **Betrachter**

**Methode 2: Via Google Sheet**

1. Google Sheet öffnen
2. **Freigeben** → E-Mail-Adresse + Rolle
3. Zugriff auf Sheet = Zugriff auf verknüpfte Scripts

## 🆘 Support

Bei Problemen:

1. Debug-Tools nutzen (`test_jsonp.html`, `test_gas_api.ps1`)
2. Cache leeren: `?clearcache=true`
3. Browser-Konsole prüfen (F12)
4. Apps Script Logs prüfen (Ansicht → Logs)

## 📜 Lizenz

Projekt für DQV Online-Liga.

---

**Version:** 1.1.0  
**Letzte Aktualisierung:** Januar 2026

