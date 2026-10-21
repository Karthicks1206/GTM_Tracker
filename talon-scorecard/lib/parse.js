import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { SPECS, detectKind, cleanRows, norm } from './sheets.js';

// exceljs cell values can be rich text, hyperlinks, formulas or dates.
function cellValue(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v;
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('');
    if ('text' in v) return v.text; // hyperlink, e.g. an email
    if ('result' in v) return cellValue(v.result); // formula
    if ('error' in v) return '';
    return String(v);
  }
  return v;
}

async function parseXlsx(buffer, warnings) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const found = {};
  wb.eachSheet((ws) => {
    const headerRow = ws.getRow(1).values; // 1-indexed
    const headers = [];
    for (let c = 1; c < headerRow.length; c++) headers[c] = String(cellValue(headerRow[c]) ?? '').trim();
    const named = Object.entries(SPECS).find(([, s]) => s.sheetName === norm(ws.name))?.[0];
    const kind = named ?? detectKind(headers.filter(Boolean));
    if (!kind) return; // e.g. the Instructions sheet
    if (found[kind]) {
      warnings.push(`More than one ${kind} sheet found; used the first.`);
      return;
    }
    const missing = SPECS[kind].required.filter((h) => !headers.some((x) => norm(x) === h));
    if (missing.length) {
      warnings.push(`Sheet "${ws.name}" is missing column(s): ${missing.join(', ')}. Skipped.`);
      return;
    }
    const rows = [];
    ws.eachRow({ includeEmpty: false }, (row, n) => {
      if (n === 1) return;
      const obj = {};
      headers.forEach((h, c) => {
        if (h) obj[h] = cellValue(row.getCell(c).value);
      });
      rows.push(obj);
    });
    found[kind] = cleanRows(kind, rows, warnings);
  });
  return found;
}

function parseCsv(text, warnings) {
  const res = Papa.parse(text.replace(/^﻿/, ''), { header: true, skipEmptyLines: 'greedy' });
  const kind = detectKind(res.meta.fields ?? []);
  if (!kind) return {};
  if (res.errors.length) warnings.push(`CSV: ${res.errors.length} row(s) could not be read cleanly.`);
  return { [kind]: cleanRows(kind, res.data, warnings) };
}

export async function parseUpload(fileName, buffer) {
  const warnings = [];
  const lower = fileName.toLowerCase();
  let parts;
  if (lower.endsWith('.xlsx')) parts = await parseXlsx(buffer, warnings);
  else if (lower.endsWith('.csv')) parts = parseCsv(new TextDecoder().decode(buffer), warnings);
  else throw new Error('Upload an .xlsx or .csv file.');
  if (!Object.keys(parts).length) {
    throw new Error('No Contacts, Weekly metrics or Activities sheet found. Check the sheet names and headers match the template.');
  }
  return { parts, warnings };
}
