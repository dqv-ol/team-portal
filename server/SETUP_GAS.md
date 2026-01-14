# Google Apps Script Setup

Diese Anleitung erklärt, wie Sie das Backend auf Google Apps Script deployen.

## Schritt 1: GAS Projekt erstellen

1. Öffnen Sie [script.google.com](https://script.google.com)
2. Klicken Sie auf **"Neues Projekt"**
3. Geben Sie einen Namen ein (z.B. "DQV Team Portal Backend")

## Schritt 2: Code kopieren

1. Öffnen Sie `gas_team_portal.gs` aus diesem Ordner
2. Kopieren Sie den **gesamten Code**
3. Fügen Sie ihn in den Google Apps Script Editor ein (ersetzen Sie die `Code.gs`)
4. **Speichern** Sie mit Strg+S oder Cmd+S

## Schritt 3: SHEET_ID speichern

### Option A: Über Project Settings (Einfach)

1. Klicken Sie auf das **⚙️ Zahnrad** (Project Settings) unten links
2. Scrollen Sie zu **"Script properties"**
3. Klicken Sie **"Add script property"**
4. Tragen Sie ein:
   - **Property:** `SHEET_ID`
   - **Value:** Ihre Google Sheet ID
     - Diese finden Sie in der URL: `docs.google.com/spreadsheets/d/**HIER_IST_DIE_ID**/edit`
5. Klicken Sie **"Save"**

### Option B: Über Code (Automatisch)

Führen Sie diese Funktion einmalig aus:

```javascript
function setupProperties() {
  const sheetId = "1W4DQ4K5SsqikfbZG38ea7zNcSx98jlrKYxdNheTU4AA"; // ← Ihre ID hier
  PropertiesService.getScriptProperties()
    .setProperty("SHEET_ID", sheetId);
  Logger.log("✅ SHEET_ID erfolgreich gespeichert!");
}
```

Dann:
1. Wählen Sie `setupProperties` aus der Dropdown
2. Klicken Sie ▶ **Run**
3. Erteilen Sie die Berechtigungen
4. Löschen Sie die Funktion wieder

## Schritt 4: Als Web App deployen

1. Klicken Sie auf **"Deploy"** (oben rechts)
2. Wählen Sie **"New deployment"**
3. Typ: **"Web app"**
4. Konfigurieren Sie:
   - **Execute as:** Ihr Google Account
   - **Who has access:** **"Anyone"**
5. Klicken Sie **"Deploy"**
6. Kopieren Sie die **Deployment URL** (Sie werden sie für das Frontend brauchen)

## Schritt 5: Testen

Öffnen Sie die Deployment URL mit diesem Parameter:

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=debugTeams
```

Sie sollten eine JSON-Response mit allen Teams sehen.

Wenn Sie einen Fehler sehen:
- "SHEET_ID nicht gespeichert" → Gehen Sie zu Schritt 3 zurück
- "Sheet nicht gefunden" → Überprüfen Sie die Sheet-Namen (Konfiguration, Teams, Matches)

## Weitere Endpoints

Nachdem Sie deployt haben:

**Teams debuggen:**
```
?action=debugTeams
```

**Portal-Daten für ein Team:**
```
?action=teamPortalData&loginId=TEAM_OR_CAPTAIN_ID
```

**Cache löschen:**
```
?clearcache=true
```

## Nächste Schritte

1. Notieren Sie die **Deployment URL**
2. Gehen Sie zu [Frontend Setup](../SETUP.md#teil-2-frontend-setup)
3. Tragen Sie die URL in `client/index.html` ein
