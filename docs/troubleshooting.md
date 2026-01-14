# Troubleshooting Guide

Wenn etwas nicht funktioniert, folgen Sie dieser Anleitung.

## Häufige Fehler

### ❌ "SHEET_ID nicht in Script Properties gespeichert"

**Problem:** Das Backend kann die Google Sheet nicht finden.

**Lösung:**
1. Öffnen Sie Ihr GAS Project auf script.google.com
2. Gehen Sie zu ⚙️ **Project Settings**
3. Scrollen Sie zu **"Script properties"**
4. Klicken Sie **"Add script property"**
5. Tragen Sie ein:
   - **Property:** `SHEET_ID`
   - **Value:** Ihre Google Sheet ID (aus der URL)
6. Speichern Sie

**Alternativ** über Code:
```javascript
function setupProperties() {
  PropertiesService.getScriptProperties()
    .setProperty("SHEET_ID", "1W4DQ4K5SsqikfbZG38ea7zNcSx98jlrKYxdNheTU4AA");
}
```

---

### ❌ "Team nicht gefunden"

**Problem:** Sie bekommen diesen Fehler beim Login.

**Ursachen & Lösungen:**

1. **Falsche Team-ID**
   ```
   ?action=debugTeams
   ```
   Öffnen Sie diese URL, um alle verfügbaren Teams zu sehen.

2. **Leerzeichen in der ID**
   - Überprüfen Sie, ob Sie versehentlich Leerzeichen eingegeben haben
   - Die ID wird automatisch trimmed, aber Leerzeichen sollten es nicht geben

3. **Zu kurze ID**
   - Team-IDs müssen mindestens 8 Zeichen lang sein
   - Captain-IDs auch

4. **Google Sheet ist nicht geteilt**
   - Das GAS Script braucht Zugriff auf das Sheet
   - Sie sollten als Eigentümer des Sheets das Script erstellen

---

### ❌ "Zeiten Blatt nicht gefunden" / "Teams Blatt nicht gefunden"

**Problem:** Backend kann ein wichtiges Sheet nicht finden.

**Lösung:**
1. Öffnen Sie Ihr Google Sheet
2. Überprüfen Sie die Tab-Namen (unten im Sheet):
   - `Konfiguration` (exakt so geschrieben)
   - `Teams` (exakt so geschrieben)
   - `Matches` (exakt so geschrieben)
3. Die Namen müssen exakt passen (Großschreibung beachten)

---

### ❌ Frontend zeigt "Daten werden geladen..." und friert ein

**Problem:** Der Loading-Spinner dreht sich endlos.

**Ursachen:**

1. **GAS_WEB_APP_URL ist falsch**
   - Öffnen Sie `client/index.html`
   - Überprüfen Sie die Zeile:
   ```javascript
   const GAS_WEB_APP_URL = "https://script.google.com/macros/s/...";
   ```
   - Kopieren Sie die URL aus Ihrem GAS Deployment

2. **GAS Web App nicht deployed**
   - Gehen Sie zu script.google.com
   - Klicken Sie **"Deploy"**
   - Wählen Sie **"New deployment"**
   - Typ: **"Web app"**
   - Execute as: Ihr Account
   - Who has access: **"Anyone"**

3. **Netzwerkfehler**
   - Öffnen Sie F12 (Entwickler-Tools)
   - Gehen Sie zu **"Network"** Tab
   - Führen Sie einen Login aus
   - Suchen Sie nach dem Request zu script.google.com
   - Überprüfen Sie die Antwort (sollte JSON sein)

---

### ❌ "Ungültige ID - mindestens 8 Zeichen erforderlich"

**Problem:** Sie versuchen, sich mit einer ID anmelden, die zu kurz ist.

**Lösung:**
- Team-IDs müssen mindestens 8 Zeichen lang sein
- Überprüfen Sie im Google Sheet die Länge
- Passen Sie die Länge an (z.B. "ABC12345" statt "ABC123")

---

### ❌ Browser Console zeigt CORS Fehler

**Problem:** "Access to XMLHttpRequest ... has been blocked by CORS policy"

**Lösung:**
Das ist normal bei direkten Requests. Das Frontend verwendet **JSONP**, nicht XMLHttpRequest.
- Überprüfen Sie, dass `format=jsonp` in der Request-URL ist
- Im Code: `const script = document.createElement('script');`

Wenn Sie trotzdem diesen Fehler sehen:
- Der JSONP-Callback wird wahrscheinlich nicht aufgerufen
- Überprüfen Sie die GAS_WEB_APP_URL

---

### ❌ Matches werden nicht angezeigt

**Problem:** Portal öffnet, aber keine Matches sichtbar.

**Ursachen:**

1. **Keine Matches für dieses Team**
   - Überprüfen Sie das "Matches" Sheet
   - Gibt es Einträge für Team A oder Team B?

2. **Spieldatum liegt in der Zukunft**
   - Matches werden nur angezeigt, wenn sie aktuell oder bald sind
   - Nach Match-Ende (nach 4 Stunden) verschwinden sie

3. **Startzeit im falschen Format**
   - Überprüfen Sie die Spalte "Startzeit"
   - Format sollte sein: `HH:MM` (z.B. `14:00`)
   - Oder vollständiges Datum: `DD.MM.YYYY HH:MM`

4. **Spieltag-Datum nicht gespeichert**
   - Wenn Sie nur Zeiten (HH:MM) verwenden, braucht das Backend SPIELTAG_DATUM
   - Gehen Sie zu "Konfiguration" Sheet
   - Fügen Sie die Zeile ein: `SPIELTAG_DATUM | 14.01.2026`

---

### ❌ Zoom-Link oder Download-Links funktionieren nicht

**Problem:** Links führen zu 404 oder sind leer.

**Ursachen:**

1. **URLs nicht in Google Sheet konfiguriert**
   - Öffnen Sie "Konfiguration" Sheet
   - Überprüfen Sie:
     ```
     ZOOM_URL = https://...
     CATEGORY_FOLDER_URL = https://...
     QUESTIONS_FOLDER_URL = https://...
     ```

2. **Conditional URL Bedingungen nicht erfüllt**
   - `categoryFolderUrl` nur wenn Match im **Zugriffsfenster**
   - `questionsFolderUrl` nur wenn User **Captain** UND Match **LIVE**

3. **Falsche Google Drive Links**
   - Überprüfen Sie, dass die Links gültig sind
   - Öffnen Sie sie manuell im Browser
   - Stellen Sie sicher, dass die Ordner freigegeben sind

---

### ❌ Passwort-Hälfte wird nicht angezeigt

**Problem:** Captain sieht keine Password-Felder.

**Ursachen:**

1. **User ist nicht Captain**
   - Überprüfen Sie im Google Sheet:
   - Captain-ID muss genau der Login-ID entsprechen

2. **Match ist nicht LIVE**
   - Passwörter sind nur während der Match-Livezeit sichtbar
   - Aktuelle Zeit muss zwischen Startzeit und Endzeit (Startzeit + 4h) sein

3. **Passwort nicht in Config gespeichert**
   - Gehen Sie zu "Konfiguration" Sheet
   - Überprüfen Sie:
     ```
     PASSWORT_HAELFTE_A_HZ1 = ...
     PASSWORT_HAELFTE_B_HZ1 = ...
     ```

---

## Debug-Tipps

### 1. Browser Console nutzen (F12)

```javascript
// Überprüfen, ob GAS_WEB_APP_URL gesetzt ist
console.log(GAS_WEB_APP_URL);

// Manuell API aufrufen
fetch(GAS_WEB_APP_URL + "?action=debugTeams")
  .then(r => r.json())
  .then(d => console.log(d));
```

### 2. GAS Debug-Endpoint

Öffnen Sie diese URL:
```
https://script.google.com/macros/s/YOUR_ID/exec?action=debugTeams
```

Sie sollten alle Teams und Matches sehen.

### 3. Cache löschen

Wenn alte Daten angezeigt werden:
```
https://script.google.com/macros/s/YOUR_ID/exec?clearcache=true
```

### 4. Logs in GAS anschauen

1. Öffnen Sie script.google.com
2. Klicken Sie auf **"Execution log"**
3. Führen Sie eine Funktion aus
4. Überprüfen Sie die Logs auf Fehler

---

## Kontakt & Support

Wenn das Problem weiterhin besteht:

1. **Überprüfen Sie** die [API Dokumentation](api.md)
2. **Lesen Sie** die [Architektur](architecture.md)
3. **Kontrollieren Sie** alle Sheet-Namen und URLs

Oder öffnen Sie ein **GitHub Issue** mit:
- Was funktioniert nicht?
- Was haben Sie bereits versucht?
- Welche Fehlermeldung sehen Sie?
