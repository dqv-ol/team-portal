/**
 * DQV Team Portal — Google Apps Script (Backend JSON/JSONP)
 *
 * Provides a JSON/JSONP API for GitHub Pages frontend.
 * - Loads config, teams, and matches from Google Sheets
 * - Optional OneDrive CSV fallback for matches (via ONEDRIVE_EXCEL_URL)
 * - Implements time-based access window and captain-only password halves
 * - Caches data to reduce load
 */

// ===== Configuration (adjust to your setup) =====
// Get SHEET_ID from Script Properties (set via setProperties() or Properties UI)
const scriptProperties = PropertiesService.getScriptProperties();
const SHEET_ID = scriptProperties.getProperty("SHEET_ID");

if (!SHEET_ID) {
  throw new Error(
    "SHEET_ID nicht in Script Properties gespeichert! " +
    "Bitte setzen Sie die Property 'SHEET_ID' mit Ihrer Google Sheet ID."
  );
}

const CONFIG_SHEET = "Konfiguration";
const TEAMS_SHEET = "Teams";
const MATCHES_SHEET = "Matches";

// Cache TTLs (seconds)
const TTL_CONFIG = 1800; // 30 minutes
const TTL_TEAMS = 18000; // 5 hours
const TTL_MATCHES = 1800; // 30 minutes

// Cache keys
const CACHE_KEYS = {
  CONFIG: "config",
  TEAMS: "teams",
  MATCHES: "matches",
};

// ===== Entry point =====
function doGet(e) {
  const params = (e && e.parameter) || {};

  // Optional cache clearing: ?clearcache=true or ?clearcache=true&clear=teams
  if (params.clearcache === "true") {
    const which = (params.clear || "").toLowerCase();
    clearCaches(which);
    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, cleared: which || "all" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // DEBUG: action=debugTeams - zeigt alle Teams
  if ((params.action || "").toLowerCase() === "debugteams") {
    try {
      const config = loadConfig();
      const teams = loadTeams();
      const matches = loadMatches(config);

      const debugInfo = {
        success: true,
        debug: true,
        teamsCount: Array.isArray(teams) ? teams.length : 0,
        matchesCount: Array.isArray(matches) ? matches.length : 0,
        teams: Array.isArray(teams)
          ? teams.map((t) => ({
              name: t.name,
              kuerzel: t.kuerzel,
              teamIdLength: (t.id || "").length,
              teamIdPreview: (t.id || "").substring(0, 4) + "...",
              captainIdLength: (t.captainId || "").length,
              captainIdPreview: (t.captainId || "").substring(0, 4) + "...",
            }))
          : [],
        configKeys: Object.keys(config),
      };

      if ((params.format || "").toLowerCase() === "jsonp") {
        const cb = params.callback || "handlePortalData";
        const body = `${cb}(${JSON.stringify(debugInfo)})`;
        return ContentService.createTextOutput(body).setMimeType(
          ContentService.MimeType.JAVASCRIPT
        );
      }
      return ContentService.createTextOutput(
        JSON.stringify(debugInfo)
      ).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      const errInfo = {
        success: false,
        error: String((err && err.message) || err),
      };
      return ContentService.createTextOutput(
        JSON.stringify(errInfo)
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // API: action=teamPortalData
  if ((params.action || "").toLowerCase() === "teamportaldata") {
    const loginId = (params.loginId || "").trim();
    const payload = buildPortalData(loginId);

    // JSONP support: ?format=jsonp&callback=handlePortalData
    if ((params.format || "").toLowerCase() === "jsonp") {
      const cb = params.callback || "handlePortalData";
      const body = `${cb}(${JSON.stringify(payload)})`;
      return ContentService.createTextOutput(body).setMimeType(
        ContentService.MimeType.JAVASCRIPT
      );
    }

    // Default: JSON
    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
      ContentService.MimeType.JSON
    );
  }

  // Default info page
  const html = `<!DOCTYPE html>
  <html><head><meta charset="utf-8"><title>DQV GAS Backend</title></head>
  <body>
    <h1>DQV Team Portal – GAS Backend</h1>
    <p>Nutzen Sie die API wie folgt:</p>
    <pre>
      GET .../exec?action=teamPortalData&loginId=TEAM_OR_CAPTAIN_ID
      Optional: &format=jsonp&callback=handlePortalData
      Optional: &clearcache=true&clear=teams
    </pre>
  </body></html>`;
  return HtmlService.createHtmlOutput(html);
}

// ===== Core API builder =====
function buildPortalData(loginId) {
  try {
    if (!loginId || loginId.length < 8) {
      return {
        success: false,
        message: "ID muss mindestens 8 Zeichen lang sein",
      };
    }

    const config = loadConfig();
    const teams = loadTeams();
    const matches = loadMatches(config);

    const team = getTeamByLoginId(loginId, teams);
    if (!team) {
      // Enhanced error message with debug info
      return {
        success: false,
        message: "Team nicht gefunden",
        debug: {
          loginIdLength: loginId.length,
          loginIdPreview: loginId.substring(0, 4) + "...",
          teamsLoaded: teams.length,
          hint: "Nutze ?action=debugTeams um alle verfügbaren Teams zu sehen",
        },
      };
    }

    const now = new Date();
    const matchesForTeam = findAllMatchesForTeam(team, matches, now, config);

    const isCaptain = team.captainId && team.captainId === loginId;

    // Base payload
    const payload = {
      success: true,
      team: { name: team.name, kuerzel: team.kuerzel },
      isCaptain: !!isCaptain,
      zoomUrl: config.ZOOM_URL || "",
      inquiryFormUrl: config.INQUIRY_FORM_URL || "",
      matches: [],
    };

    if (!matchesForTeam || matchesForTeam.length === 0) {
      return payload;
    }

    // Access and live windows - gleich für alle Matches
    const accessMinutes = toInt(config.ACCESS_MINUTES_BEFORE, 30);
    const activeHours = toInt(config.MATCH_ACTIVE_HOURS, 4);

    // Prozessiere Matches — Group by unique startDate (da HZ1 + HZ2 identisch sind außer Passwort)
    const matchMap = {}; // Key: startDate.getTime()

    for (let i = 0; i < matchesForTeam.length; i++) {
      const match = matchesForTeam[i];
      const key = match.startDate.getTime();

      if (!matchMap[key]) {
        matchMap[key] = match;
      }
    }

    // Convert map to array
    const uniqueMatches = Object.keys(matchMap).map((k) => matchMap[k]);

    // Flags für conditional URLs
    let hasAccessibleMatch = false;
    let hasLiveMatch = false;

    for (let i = 0; i < uniqueMatches.length; i++) {
      const match = uniqueMatches[i];

      const accessTime = new Date(
        match.startDate.getTime() - accessMinutes * 60000
      );
      const endDate = new Date(
        match.startDate.getTime() + activeHours * 3600000
      );

      const isAccessible =
        now.getTime() >= accessTime.getTime() &&
        now.getTime() <= endDate.getTime();
      const isLive =
        now.getTime() >= match.startDate.getTime() &&
        now.getTime() <= endDate.getTime();

      // Setze Flags
      if (isAccessible) hasAccessibleMatch = true;
      if (isLive) hasLiveMatch = true;

      const isTeamA =
        eqTeam(match.teamA, team.name) || eqTeam(match.kuerzelA, team.kuerzel);

      // Passworthälften für beide Halbzeiten
      const passwordHalves = {};
      if (isCaptain && isLive) {
        const teamKey = isTeamA ? "A" : "B";
        passwordHalves.HZ1 =
          config["PASSWORT_HAELFTE_" + teamKey + "_HZ1"] || "";
        passwordHalves.HZ2 =
          config["PASSWORT_HAELFTE_" + teamKey + "_HZ2"] || "";
      }

      payload.matches.push({
        gruppe: match.gruppe,
        teamA: match.teamA,
        teamB: match.teamB,
        kuerzelA: match.kuerzelA,
        kuerzelB: match.kuerzelB,
        startzeitISO: toISO(match.startDate),
        accessTimeISO: toISO(accessTime),
        endDateISO: toISO(endDate),
        isAccessible: !!isAccessible,
        isLive: !!isLive,
        isTeamA: !!isTeamA,
        countingFormUrl: match.countingFormUrl || "",
        passwordHalves:
          Object.keys(passwordHalves).length > 0 ? passwordHalves : undefined,
      });
    }

    // Conditional URLs: nur wenn Bedingungen erfüllt
    if (hasAccessibleMatch) {
      payload.categoryFolderUrl =
        config.CATEGORY_FOLDER_URL ||
        config.FOLDER_URL ||
        config.FOLDER_URL_ONEDRIVE ||
        "";
    }

    if (isCaptain && hasLiveMatch) {
      payload.questionsFolderUrl = config.QUESTIONS_FOLDER_URL || "";
    }

    return payload;
  } catch (err) {
    return { success: false, message: String((err && err.message) || err) };
  }
}

// ===== Loaders =====
function loadConfig() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEYS.CONFIG);
  if (cached) return JSON.parse(cached);

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(CONFIG_SHEET);
  if (!sheet) throw new Error("Konfiguration Blatt nicht gefunden");

  const values = sheet.getDataRange().getValues();
  const config = {};
  for (let i = 1; i < values.length; i++) {
    const key = String(values[i][0] || "").trim();
    const val = String(values[i][1] || "").trim();
    if (key) config[key] = val;
  }

  cache.put(CACHE_KEYS.CONFIG, JSON.stringify(config), TTL_CONFIG);
  return config;
}

function loadTeams() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEYS.TEAMS);
  if (cached) return JSON.parse(cached);

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(TEAMS_SHEET);
  if (!sheet) throw new Error("Teams Blatt nicht gefunden");

  const values = sheet.getDataRange().getValues();
  const header = values[0].map((v) => String(v || "").trim());

  const idx = {
    name:
      header.indexOf("Teamname") >= 0
        ? header.indexOf("Teamname")
        : header.indexOf("Name"),
    kuerzel: header.indexOf("Kürzel"),
    teamId: header.indexOf("Team-ID"),
    captainId: header.indexOf("Captain-ID"),
  };

  const out = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const t = {
      name: asString(row[idx.name]),
      kuerzel: asString(row[idx.kuerzel]),
      id: asString(row[idx.teamId]),
      captainId: asString(row[idx.captainId]),
    };
    if (t.name || t.kuerzel) out.push(t);
  }

  cache.put(CACHE_KEYS.TEAMS, JSON.stringify(out), TTL_TEAMS);
  return out;
}

function loadMatches(config) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEYS.MATCHES);
  if (cached) {
    const parsed = JSON.parse(cached);
    // Restore Date objects from ISO strings
    return parsed
      .map((m) => ({
        ...m,
        startDate: m.startDate ? new Date(m.startDate) : null,
      }))
      .filter((m) => m.startDate);
  }

  let matches = [];
  try {
    matches = loadMatchesFromGoogleSheets();
  } catch (e) {
    // continue to fallback
  }

  if (
    (!matches || matches.length === 0) &&
    config &&
    config.ONEDRIVE_EXCEL_URL
  ) {
    try {
      matches = loadMatchesFromOneDriveCsv(config.ONEDRIVE_EXCEL_URL);
    } catch (e) {
      // ignore, leave matches empty
    }
  }

  cache.put(CACHE_KEYS.MATCHES, JSON.stringify(matches || []), TTL_MATCHES);
  return matches || [];
}

function loadMatchesFromGoogleSheets() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MATCHES_SHEET);
  if (!sheet) throw new Error("Matches Tabseite nicht gefunden");

  // Lade Config für Spieltag-Datum
  const config = loadConfig();
  const spieltagDatum = config.SPIELTAG_DATUM || null;

  const values = sheet.getDataRange().getValues();
  const header = values[0].map((v) => String(v || "").trim());

  const idx = {
    gruppe: header.indexOf("Gruppe"),
    kuerzelA: header.indexOf("Kürzel A"),
    kuerzelB: header.indexOf("Kürzel B"),
    teamA: header.indexOf("Team A"),
    teamB: header.indexOf("Team B"),
    startzeit: header.indexOf("Startzeit"),
    countingFormUrl: header.indexOf("Zähl-Link"),
  };

  const out = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const startVal = row[idx.startzeit];

    let startDate = null;

    // Wenn startVal ein Date-Objekt ist
    if (startVal instanceof Date) {
      // Prüfe ob es ein vollständiges Datum ist (Jahr > 1900)
      if (startVal.getFullYear() > 1900) {
        startDate = startVal;
      } else {
        // Es ist nur eine Uhrzeit (Excel Seriennummer, Basis 1899-12-30)
        // Kombiniere mit Spieltag-Datum
        if (spieltagDatum) {
          const timeStr = Utilities.formatDate(
            startVal,
            Session.getScriptTimeZone(),
            "HH:mm"
          );
          startDate = parseTimeWithDate(timeStr, spieltagDatum);
        }
      }
    } else if (startVal) {
      // Versuche zunächst als vollständiges Datum zu parsen
      startDate = parseDateLoose(startVal);

      // Wenn das fehlschlägt und wir nur Zeit haben (HH:MM), kombiniere mit Spieltag-Datum
      if (!startDate && spieltagDatum) {
        startDate = parseTimeWithDate(startVal, spieltagDatum);
      }
    }

    if (!startDate) continue;

    // Erzeugt zwei Halbzeiten für jedes Match: HZ1 und HZ2
    const baseMatch = {
      gruppe: asString(row[idx.gruppe]),
      kuerzelA: asString(row[idx.kuerzelA]),
      kuerzelB: asString(row[idx.kuerzelB]),
      teamA: asString(row[idx.teamA]),
      teamB: asString(row[idx.teamB]),
      startDate: startDate,
      countingFormUrl: asString(row[idx.countingFormUrl]),
    };

    // HZ1 und HZ2 mit gleicher Startzeit
    out.push({ ...baseMatch, halbzeit: "HZ1" });
    out.push({ ...baseMatch, halbzeit: "HZ2" });
  }

  return out;
}

// Fallback: OneDrive CSV export (expects headers similar to Google Sheet)
function loadMatchesFromOneDriveCsv(url) {
  const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() >= 300)
    throw new Error("OneDrive CSV nicht erreichbar");
  const csv = resp.getContentText();
  const rows = Utilities.parseCsv(csv, ";"); // adjust delimiter if needed
  if (!rows || rows.length < 2) return [];

  // Hole Config für Spieltag-Datum
  const config = loadConfig();
  const spieltagDatum = config.SPIELTAG_DATUM || null;

  const header = rows[0].map((v) => String(v || "").trim());
  const idx = {
    gruppe: header.indexOf("Gruppe"),
    kuerzelA: header.indexOf("Kürzel A"),
    kuerzelB: header.indexOf("Kürzel B"),
    teamA: header.indexOf("Team A"),
    teamB: header.indexOf("Team B"),
    startzeit: header.indexOf("Startzeit"),
  };

  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const startVal = row[idx.startzeit];

    // Versuche zunächst als vollständiges Datum zu parsen
    let startDate = parseDateLoose(startVal);

    // Wenn das fehlschlägt, versuche Zeit + Datum zu kombinieren
    if (!startDate && spieltagDatum) {
      startDate = parseTimeWithDate(startVal, spieltagDatum);
    }

    if (!startDate) continue;

    // Erzeugt zwei Halbzeiten für jedes Match: HZ1 und HZ2
    const baseMatch = {
      gruppe: asString(row[idx.gruppe]),
      kuerzelA: asString(row[idx.kuerzelA]),
      kuerzelB: asString(row[idx.kuerzelB]),
      teamA: asString(row[idx.teamA]),
      teamB: asString(row[idx.teamB]),
      startDate: startDate,
    };

    // HZ1 und HZ2 mit gleicher Startzeit
    out.push({ ...baseMatch, halbzeit: "HZ1" });
    out.push({ ...baseMatch, halbzeit: "HZ2" });
  }
  return out;
}

// ===== Helpers =====
function getTeamByLoginId(loginId, teams) {
  const id = (loginId || "").trim();
  for (let i = 0; i < teams.length; i++) {
    const t = teams[i];
    if (t.id === id || t.captainId === id) return t;
  }
  return null;
}

function findNextMatchForTeam(team, matches, now, config) {
  const list = findAllMatchesForTeam(team, matches, now, config);
  return list.length > 0 ? list[0] : null;
}

function findAllMatchesForTeam(team, matches, now, config) {
  const list = matches.filter((m) => {
    return (
      eqTeam(m.teamA, team.name) ||
      eqTeam(m.teamB, team.name) ||
      eqTeam(m.kuerzelA, team.kuerzel) ||
      eqTeam(m.kuerzelB, team.kuerzel)
    );
  });

  // Sort by startDate ascending
  list.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  // Return alle aktuellen und zukünftigen Matches (meist HZ1 und HZ2)
  const result = [];
  const activeHours = toInt(config.MATCH_ACTIVE_HOURS, 4);
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    // Prüfe: Match ist noch zukünftig ODER gerade live/aktiv
    const endTime = m.startDate.getTime() + activeHours * 3600000;
    if (m.startDate.getTime() >= now.getTime() || now.getTime() <= endTime) {
      result.push(m);
    }
  }
  return result;
}

function eqTeam(a, b) {
  return String(a || "").trim() === String(b || "").trim();
}

function toISO(d) {
  if (!d) return null;
  if (d.toISOString) return d.toISOString();
  // Fallback für GAS Date-Objekte ohne toISOString()
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${date}T${hours}:${minutes}:${seconds}.000Z`;
}

function toInt(v, defVal) {
  var n = parseInt(String(v || "").trim(), 10);
  return isFinite(n) ? n : defVal;
}

function asString(v) {
  return String(v == null ? "" : v).trim();
}

function parseDateLoose(v) {
  if (v instanceof Date) return v;
  const s = String(v || "").trim();
  if (!s) return null;
  // Try ISO first
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  // Try DD.MM.YYYY HH:MM
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
  if (m) {
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10) - 1;
    const yyyy = parseInt(m[3], 10);
    const HH = parseInt(m[4], 10);
    const MM = parseInt(m[5], 10);
    d = new Date(yyyy, mm, dd, HH, MM, 0);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/**
 * Parse time string (HH:MM) and combine with date from SPIELTAG_DATUM
 * @param {string} timeStr - Time in format "HH:MM" or "H:MM"
 * @param {string|Date} datum - Date from config (DD.MM.YYYY or Date object)
 * @return {Date|null}
 */
function parseTimeWithDate(timeStr, datum) {
  if (!timeStr || !datum) return null;

  const timeS = String(timeStr).trim();
  // Match HH:MM or H:MM
  const timeMatch = timeS.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) return null;

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);

  // Parse datum
  let baseDate = null;
  if (datum instanceof Date) {
    baseDate = datum;
  } else {
    const datumS = String(datum).trim();
    // Try DD.MM.YYYY
    const dateMatch = datumS.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dateMatch) {
      baseDate = new Date(
        parseInt(dateMatch[3], 10),
        parseInt(dateMatch[2], 10) - 1,
        parseInt(dateMatch[1], 10)
      );
    } else {
      // Try parsing as ISO or other format
      baseDate = new Date(datumS);
    }
  }

  if (!baseDate || isNaN(baseDate.getTime())) return null;

  // Combine date with time
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes,
    0,
    0
  );
}

function clearCaches(which) {
  const cache = CacheService.getScriptCache();
  const w = which || "all";
  if (w === "teams") {
    cache.remove(CACHE_KEYS.TEAMS);
    return;
  }
  cache.remove(CACHE_KEYS.CONFIG);
  cache.remove(CACHE_KEYS.TEAMS);
  cache.remove(CACHE_KEYS.MATCHES);
}
