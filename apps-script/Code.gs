/**
 * TaskMaster — Google Apps Script Web App
 *
 * Handles two event types via HTTP POST:
 *   { type: "404",      url, referrer, userAgent, timestamp }
 *   { type: "waitlist", name, email, distraction, comments, source, timestamp }
 *
 * Deploy as: Execute as "Me", Access "Anyone"
 * Copy the Web App URL into APPS_SCRIPT_URL in main.js
 */

const SHEET_ID   = "REEMPLAZA_CON_TU_GOOGLE_SHEET_ID"; // ← ID de tu Google Sheet
const SHEET_404  = "404 Hits";
const SHEET_LIST = "Waitlist";

/* ── Entry point ─────────────────────────────────────────── */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.type === "404")           handle404(data);
    else if (data.type === "waitlist") handleWaitlist(data);
    return jsonOk({ saved: true });
  } catch (err) {
    return jsonError(err.message);
  }
}

// Responde al preflight CORS
function doGet() {
  return ContentService.createTextOutput("OK");
}

/* ── 404 handler ─────────────────────────────────────────── */

function handle404(data) {
  const sheet = getOrCreateSheet(SHEET_404, ["Fecha", "URL que falló", "Referrer", "User Agent"]);
  sheet.appendRow([
    new Date(),
    data.url       || "(desconocida)",
    data.referrer  || "(directo)",
    data.userAgent || "",
  ]);
}

/* ── Waitlist handler ────────────────────────────────────── */

function handleWaitlist(data) {
  const sheet = getOrCreateSheet(SHEET_LIST, ["Fecha", "Nombre", "Email", "¿Qué te distrae?", "Comentarios", "Fuente"]);

  // Evita emails duplicados
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const emails = sheet.getRange(2, 3, lastRow - 1, 1).getValues().flat();
    if (emails.includes(data.email)) return;
  }

  sheet.appendRow([
    new Date(),
    data.name        || "",
    data.email       || "",
    data.distraction || "",
    data.comments    || "",
    data.source      || "index",
  ]);
}

/* ── Helpers ─────────────────────────────────────────────── */

function getOrCreateSheet(name, headers) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground("#4f46e5")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    sheet.setColumnWidths(1, headers.length, 220);
  }
  return sheet;
}

function jsonOk(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
