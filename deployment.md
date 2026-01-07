# DQV Team Portal – Deployment Guide

## Schritt 1: Google Apps Script deployen

1. **Script erstellen**

   - Gehe zu [script.google.com](https://script.google.com)
   - Erstelle ein neues Projekt: **Neues Projekt**
   - Benenne es z.B. "DQV Team Portal Backend"

2. **Code einfügen**

   - Lösche den Standardcode
   - Kopiere den kompletten Inhalt aus `gas_team_portal.gs`
   - Füge ihn in den Editor ein
   - **Speichern** (Strg+S)

3. **Web App deployen**

   - Klicke oben rechts auf **Bereitstellen** → **Neue Bereitstellung**
   - Typ auswählen: **Web-App**
   - Beschreibung: "DQV Team Portal API v1"
   - **Ausführen als**: Ich (deine E-Mail-Adresse)
   - **Zugriff**: **Jeder** (oder "Jeder mit Google-Konto" je nach Anforderung)
   - Klicke auf **Bereitstellen**

4. **Web App URL kopieren**

   - Nach dem Deployment erscheint eine URL wie:
     ```
     https://script.google.com/macros/s/AKfycbxxx...xxx/exec
     ```
   - **Diese URL kopieren!** (du brauchst sie gleich)

5. **Autorisierung (beim ersten Mal)**
   - Beim ersten Deployment wirst du aufgefordert, Berechtigungen zu erteilen
   - Klicke auf **Berechtigungen prüfen**
   - Wähle dein Google-Konto
   - Klicke auf **Erweitert** → **Zu [Projektname] wechseln (unsicher)**
   - Klicke auf **Zulassen**

## Schritt 2: Web App URL in index.html eintragen

1. **Öffne** `index.html`

2. **Finde diese Zeile** (ca. Zeile 211):

   ```javascript
   const GAS_WEB_APP_URL = "REPLACE_WITH_YOUR_GAS_WEB_APP_URL";
   ```

3. **Ersetze den Platzhalter** mit deiner kopierten URL:

   ```javascript
   const GAS_WEB_APP_URL =
     "https://script.google.com/macros/s/AKfycbxxx...xxx/exec";
   ```

4. **Speichern** (Strg+S)

## Schritt 3: Lokal testen (Optional)

Vor dem GitHub Pages Deployment kannst du lokal testen:

```powershell
# Im Scrapy-Ordner:
cd d:\Git\OneIm91\dqvquiznations\Scrapy

# Einfachen HTTP-Server starten (Python):
python -m http.server 8000

# Oder mit Node.js (npx http-server):
npx http-server -p 8000
```

Dann öffne im Browser: `http://localhost:8000/index.html`

**Alternative:** Nutze die Test-Datei `test_jsonp.html` (siehe unten)

## Schritt 4: GitHub Pages aktivieren

1. **Repository vorbereiten**

   - Stelle sicher, dass `index.html` im Root oder in einem `/docs` Ordner liegt
   - Commit & Push zu GitHub:
     ```powershell
     git add index.html
     git commit -m "Add DQV Team Portal frontend"
     git push
     ```

2. **Pages aktivieren**

   - Gehe zu deinem GitHub Repo → **Settings** → **Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** (oder **master**)
   - Folder: **/ (root)** oder **/docs** (je nachdem wo index.html liegt)
   - Klicke auf **Save**

3. **URL notieren**
   - Nach 1-2 Minuten ist deine Seite verfügbar unter:
     ```
     https://<dein-username>.github.io/<repo-name>/index.html
     ```
   - Diese URL kannst du an deine Teams weitergeben

## Schritt 5: Testen

1. **Öffne deine GitHub Pages URL**
2. **Login testen** mit einer gültigen Team-ID oder Captain-ID (min. 8 Zeichen)
3. **Erwartetes Verhalten:**
   - Login erfolgreich → Portal mit Match-Infos wird angezeigt
   - Bei Captain-Login + LIVE-Match → Passworthälfte wird angezeigt

## Troubleshooting

### "Team nicht gefunden"

- Prüfe, ob die Team-ID/Captain-ID in der Google Sheet "Teams" existiert
- Mindestlänge: 8 Zeichen

### "Fehler beim Laden der Daten"

- Prüfe die GAS_WEB_APP_URL in index.html
- Öffne die GAS URL direkt im Browser → sollte Infoseite anzeigen
- Prüfe Browser-Konsole (F12) auf CORS/Netzwerkfehler

### Cache leeren

Wenn Daten nicht aktuell sind:

```
https://script.google.com/macros/s/AKfycbxxx...xxx/exec?clearcache=true
```

Nur Teams-Cache:

```
https://script.google.com/macros/s/AKfycbxxx...xxx/exec?clearcache=true&clear=teams
```

### Script aktualisieren

Wenn du Änderungen am GAS-Code machst:

1. **Speichern** im Script-Editor
2. **Neue Bereitstellung** ODER **Bereitstellungen verwalten** → vorhandene Deployment bearbeiten
3. Version hochzählen (z.B. "v2")
4. URL bleibt gleich!

## Konfiguration anpassen

Wichtige Konstanten in `gas_team_portal.gs`:

```javascript
const SHEET_ID = "1W4DQ4K5SsqikfbZG38ea7zNcSx98jlrKYxdNheTU4AA";
const CONFIG_SHEET = "Konfiguration";
const TEAMS_SHEET = "Teams";
const TIMES_SHEET = "Zeiten";

const TTL_CONFIG = 1800; // 30 Minuten Cache
const TTL_TEAMS = 18000; // 5 Stunden Cache
const TTL_MATCHES = 1800; // 30 Minuten Cache
```

**Wichtig:** Nach Änderungen neue Bereitstellung erstellen oder bestehende aktualisieren!
