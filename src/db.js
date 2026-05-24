import Dexie from 'dexie'

// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB via Dexie.js — menyimpan metadata dokumen secara lokal
// ─────────────────────────────────────────────────────────────────────────────

export const db = new Dexie('DMS_ExportImport')

db.version(1).stores({
  dokumen: '++id, tipe_dokumen, status, tanggal_upload, tanggal_expired, no_referensi, drive_file_id',
})

// ── CRUD helpers ──────────────────────────────────────────────────────────────

export async function addDokumen(data) {
  return db.dokumen.add({
    ...data,
    tanggal_upload: new Date().toISOString(),
  })
}

export async function getAllDokumen() {
  return db.dokumen.orderBy('tanggal_upload').reverse().toArray()
}

export async function getDokumenById(id) {
  return db.dokumen.get(id)
}

export async function updateDokumen(id, data) {
  return db.dokumen.update(id, data)
}

export async function deleteDokumen(id) {
  return db.dokumen.delete(id)
}

export async function searchDokumen({ query, tipe, status, dateFrom, dateTo }) {
  let collection = db.dokumen.orderBy('tanggal_upload').reverse()

  const results = await collection.toArray()

  return results.filter(doc => {
    if (query) {
      const q = query.toLowerCase()
      const match =
        doc.nama_file?.toLowerCase().includes(q) ||
        doc.no_referensi?.toLowerCase().includes(q) ||
        doc.keterangan?.toLowerCase().includes(q) ||
        doc.tags?.some(t => t.toLowerCase().includes(q))
      if (!match) return false
    }
    if (tipe && tipe !== 'Semua') {
      if (doc.tipe_dokumen !== tipe) return false
    }
    if (status && status !== 'Semua') {
      if (doc.status !== status) return false
    }
    if (dateFrom) {
      if (new Date(doc.tanggal_upload) < new Date(dateFrom)) return false
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59)
      if (new Date(doc.tanggal_upload) > to) return false
    }
    return true
  })
}
