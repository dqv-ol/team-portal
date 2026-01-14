# Komplette Installationsanleitung

Dieses Projekt besteht aus zwei Teilen:

1. **Backend** (Google Apps Script) - Daten aus Google Sheets auslesen
2. **Frontend** (GitHub Pages) - Portal für Teams

Folgen Sie beiden Anweisungen für die komplette Einrichtung.

## Teil 1: Backend Setup

Siehe [server/SETUP_GAS.md](server/SETUP_GAS.md)

**Zusammengefasst:**

1. GAS Script auf script.google.com erstellen
2. Code von `gas_team_portal.gs` kopieren
3. Als Web App deployen
4. SHEET_ID in Script Properties speichern
5. Web App URL notieren

## Teil 2: Frontend Setup

### 2.1 Google Sheet vorbereiten

Sie benötigen ein Google Sheet mit folgenden Tabs:

- **Konfiguration** - URLs und Einstellungen
- **Teams** - Team-Namen und Login-IDs
- **Matches** - Spieldaten mit Zeiten

Siehe [config/example-config.json](config/example-config.json) für die erwartete Struktur.

### 2.2 Frontend deployen

1. Die Datei `index.html` auf GitHub Pages uploaden
2. In der `index.html` die GAS_WEB_APP_URL anpassen:
   ```javascript
   const GAS_WEB_APP_URL =
     "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
   ```
3. GitHub Pages aktivieren (Settings → Pages → main branch)

### 2.3 Fertig!

Die Site ist jetzt unter `https://ihr-github-username.github.io/dqv-team-portal/` erreichbar.

## Testen

1. Öffnen Sie das Portal im Browser
2. Versuchen Sie, sich mit einer Team-ID anmelden
3. Wenn Fehler auftreten → siehe [Troubleshooting](docs/troubleshooting.md)

## Troubleshooting

### SHEET_ID nicht gespeichert?

Siehe [server/SETUP_GAS.md](server/SETUP_GAS.md) → "SHEET_ID eintragen"

### "Team nicht gefunden" Error?

1. Führen Sie `?action=debugTeams` aus, um alle Teams zu sehen
2. Überprüfen Sie die Team-ID im Google Sheet
3. Clear Cache: `?clearcache=true`

### Frontend zeigt keine Daten?

1. Öffnen Sie Browser Console (F12)
2. Überprüfen Sie, ob GAS_WEB_APP_URL korrekt ist
3. Überprüfen Sie CORS (sollte kein Problem sein mit JSONP)

Weitere Hilfe in [docs/troubleshooting.md](docs/troubleshooting.md)
