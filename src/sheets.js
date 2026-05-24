import { GOOGLE_CONFIG, SHEET_HEADERS } from './config'

// ─────────────────────────────────────────────────────────────────────────────
// Google Sheets API v4 — pengganti IndexedDB
// Semua metadata dokumen disimpan di Google Sheets
// ─────────────────────────────────────────────────────────────────────────────

let accessToken = null

export function setSheetToken(token) { accessToken = token }

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const SID  = GOOGLE_CONFIG.SHEET_ID
const TAB  = GOOGLE_CONFIG.SHEET_TAB

async function sheetsRequest(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Sheets API error ${res.status}`)
  }
  return res.json()
}

// ── Init: pastikan sheet & header sudah ada ───────────────────────────────────

export async function initSheet(token) {
  accessToken = token

  // Cek apakah tab sudah ada
  const meta = await sheetsRequest(`${BASE}/${SID}?fields=sheets.properties.title`)
  const exists = meta.sheets?.some(s => s.properties.title === TAB)

  if (!exists) {
    // Buat tab baru
    await sheetsRequest(`${BASE}/${SID}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: TAB } } }]
      })
    })
  }

  // Cek apakah header sudah ada
  const rows = await getRows()
  if (rows.length === 0) {
    // Tulis header
    await sheetsRequest(`${BASE}/${SID}/values/${TAB}!A1?valueInputOption=RAW`, {
      method: 'PUT',
      body: JSON.stringify({ values: [SHEET_HEADERS] })
    })
  }
}

// ── Baca semua baris (skip header) ───────────────────────────────────────────

async function getRows() {
  const res = await sheetsRequest(`${BASE}/${SID}/values/${TAB}`)
  return res.values || []
}

function rowToDoc(row, rowIndex) {
  const obj = {}
  SHEET_HEADERS.forEach((h, i) => {
    obj[h] = row[i] ?? ''
  })
  obj._row = rowIndex + 1 // 1-based, +1 karena header di row 1
  obj.id = obj.id || String(rowIndex)
  // parse tags
  if (typeof obj.tags === 'string') {
    obj.tags = obj.tags ? obj.tags.split(';').map(t => t.trim()).filter(Boolean) : []
  }
  return obj
}

function docToRow(doc) {
  return SHEET_HEADERS.map(h => {
    if (h === 'tags') return Array.isArray(doc.tags) ? doc.tags.join(';') : (doc.tags || '')
    return doc[h] ?? ''
  })
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function addDokumen(data) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const doc = {
    ...data,
    id,
    tanggal_upload: new Date().toISOString(),
  }
  const row = docToRow(doc)
  await sheetsRequest(`${BASE}/${SID}/values/${TAB}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values: [row] })
  })
  return id
}

export async function getAllDokumen() {
  const rows = await getRows()
  if (rows.length <= 1) return [] // hanya header atau kosong
  // rows[0] = header, rows[1..] = data
  return rows.slice(1).map((row, i) => rowToDoc(row, i + 1)).reverse()
}

export async function searchDokumen({ query, tipe, status, dateFrom, dateTo }) {
  const all = await getAllDokumen()
  return all.filter(doc => {
    if (query) {
      const q = query.toLowerCase()
      const match =
        doc.nama_file?.toLowerCase().includes(q) ||
        doc.no_referensi?.toLowerCase().includes(q) ||
        doc.keterangan?.toLowerCase().includes(q) ||
        doc.tags?.some?.(t => t.toLowerCase().includes(q))
      if (!match) return false
    }
    if (tipe && tipe !== 'Semua' && doc.tipe_dokumen !== tipe) return false
    if (status && status !== 'Semua' && doc.status !== status) return false
    if (dateFrom && new Date(doc.tanggal_upload) < new Date(dateFrom)) return false
    if (dateTo) {
      const to = new Date(dateTo); to.setHours(23, 59, 59)
      if (new Date(doc.tanggal_upload) > to) return false
    }
    return true
  })
}

export async function deleteDokumenByRow(rowNum) {
  // rowNum adalah nomor baris di sheet (1-based, termasuk header)
  await sheetsRequest(`${BASE}/${SID}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: {
            sheetId: await getSheetTabId(),
            dimension: 'ROWS',
            startIndex: rowNum - 1, // 0-based
            endIndex: rowNum,       // exclusive
          }
        }
      }]
    })
  })
}

export async function updateDokumenByRow(rowNum, data) {
  const row = docToRow(data)
  const colEnd = String.fromCharCode(65 + SHEET_HEADERS.length - 1)
  await sheetsRequest(
    `${BASE}/${SID}/values/${TAB}!A${rowNum}:${colEnd}${rowNum}?valueInputOption=RAW`,
    { method: 'PUT', body: JSON.stringify({ values: [row] }) }
  )
}

// ── Helper: ambil sheetId numerik untuk batchUpdate ──────────────────────────

let _sheetTabId = null
async function getSheetTabId() {
  if (_sheetTabId !== null) return _sheetTabId
  const meta = await sheetsRequest(`${BASE}/${SID}?fields=sheets.properties`)
  const sheet = meta.sheets?.find(s => s.properties.title === TAB)
  _sheetTabId = sheet?.properties?.sheetId ?? 0
  return _sheetTabId
}

// ── Export CSV dari Sheets ───────────────────────────────────────────────────

export function exportToCSV(docs) {
  const header = SHEET_HEADERS.join(',')
  const rows = docs.map(d =>
    SHEET_HEADERS.map(h => `"${(d[h] ?? '').toString().replace(/"/g, '""')}"`).join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `DMS_ExportImport_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
