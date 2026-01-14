# Automatisierter QuizNations Scraper

Automatisierte Extraktion und Verarbeitung von QuizNations.com Ergebnissen mit Selenium und Scrapy.

## 🚀 Setup

### 1. Dependencies installieren

```powershell
.\setup.ps1
```

Oder manuell:

```bash
pip install -r requirements.txt
```

### 2. Chrome installieren

- Installiere Google Chrome von https://www.google.com/chrome/
- ChromeDriver wird automatisch heruntergeladen (via webdriver-manager)

## 📖 Verwendung

### Automatische URL-Extraktion + Verarbeitung

```powershell
# Extrahiert URLs für Gruppe 1, Woche 11 und erstellt JSON/CSV
.\run_scraper.ps1 -Group 1 -Week 11

# Extrahiert URLs für Gruppe 3, Woche 13 und erstellt JSON/CSV
.\run_scraper.ps1 -Group 3 -Week 13
```

### Nur URL-Extraktion (ohne Verarbeitung)

```powershell
# Erstellt nur die TXT-Datei mit URLs
.\run_scraper.ps1 -Group 1 -Week 11 -ExtractOnly
```

### Verarbeitung existierender TXT-Dateien

```powershell
# Verarbeitet bereits vorhandene TXT-Dateien
.\run_scraper.ps1 2025-R13-HR1 2025-R13-HR2 2025-R13-HR3
```

## 🔧 Funktionsweise

1. **URL-Extraktion**: Selenium navigiert zu https://results.quiznations.com/gerVII
2. **Gruppe auswählen**: Klickt auf den entsprechenden Gruppenlink
3. **Woche finden**: Sucht die angegebene Woche in der Tabelle
4. **Match-URLs extrahieren**: Sammelt alle `/matchview/` URLs der Woche
5. **Datei speichern**: Speichert URLs in `2025_urls/2025-R##-HR#.txt`
6. **Scraping**: Verwendet die URLs für Scrapy-Extraktion
7. **Konvertierung**: Erstellt JSON und CSV Dateien

## 📁 Dateistruktur

```
2025_urls/           # URL-Dateien
├── 2025-R11-HR1.txt
├── 2025-R11-HR2.txt
└── ...

2025_results/        # Ergebnis-Dateien
├── 2025-R11-HR1.json
├── 2025-R11-HR1.csv
├── 2025-R11-HR2.json
├── 2025-R11-HR2.csv
└── ...

2025_mappings/       # DQV-Kategorie-Mappings
├── 2025-R11.csv
├── 2025-R12.csv
└── ...
```

## 🎯 Dateinamen-Format

- **URL-Dateien**: `2025-R{Woche:02d}-HR{Gruppe}.txt`
  - Beispiel: `2025-R11-HR1.txt` (Woche 11, Gruppe 1)
- **Ergebnis-Dateien**: Gleicher Name mit `.json`/`.csv` Endung

## ⚠️ Fehlerbehebung

### ChromeDriver Issues

```bash
pip install webdriver-manager
```

### Selenium Issues

```bash
pip install --upgrade selenium
```

### Timeout/Network Issues

- Prüfe Internetverbindung
- Website könnte temporär nicht verfügbar sein
- Verwende `--headless=false` für Debug-Modus

## 📊 Beispiel-Output

```
🌐 URL Extraction Mode
Group: 1, Week: 11
Target file: 2025-R11-HR1.txt

🌐 Navigating to: https://results.quiznations.com/gerVII
✅ Using webdriver-manager for ChromeDriver
🔍 Looking for group: Gruppe 1
🔗 Found group URL: https://results.quiznations.com/gerVII/group/...
🔍 Looking for week: Week 11
✅ Found table for Week 11
📋 Found match URL: https://results.quiznations.com/gerVII/matchview/...
📋 Found match URL: https://results.quiznations.com/gerVII/matchview/...
✅ Extracted 8 match URLs
✅ Saved 8 URLs to: 2025_urls/2025-R11-HR1.txt

🚀 Processing: 2025-R11-HR1
📂 URL file: 2025_urls\2025-R11-HR1.txt
✅ Updated source in result_spider.py to: 2025-R11-HR1.txt
✅ Running: scrapy crawl results -o 2025_results\2025-R11-HR1.json
✅ JSON creation completed!
✅ Converting JSON to CSV...
🎉 File completed! Results are available as:
  📄 JSON: 2025_results\2025-R11-HR1.json
  📊 CSV:  2025_results\2025-R11-HR1.csv
```
