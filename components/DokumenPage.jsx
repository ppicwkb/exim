import React, { useState, useEffect, useCallback } from 'react'
import {
  Search, Filter, Grid, List, ExternalLink, Trash2, Eye,
  FileText, AlertTriangle, Clock, XCircle, ChevronDown, RefreshCw, FileX
} from 'lucide-react'
import { searchDokumen, deleteDokumenByRow } from '../src/sheets'
import { deleteFileFromDrive, getFileBlob } from '../src/googleDrive'
import { TIPE_DOKUMEN, STATUS_DOKUMEN, APP_CONFIG } from '../src/config'

function formatBytes(b) {
  if (!b) return '-'
  const n = Number(b)
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getDays(iso) {
  if (!iso) return null
  return Math.ceil((new Date(iso) - new Date()) / (1000 * 60 * 60 * 24))
}

function StatusBadge({ status, tanggal_expired }) {
  const days = getDays(tanggal_expired)
  if (days !== null && days <= 0)
    return <span className="inline-flex items-center gap-1 text-xs font-600 px-2 py-0.5 rounded-full text-red-600 bg-red-50 border border-red-200"><XCircle className="w-3 h-3" />Expired</span>
  if (days !== null && days <= APP_CONFIG.EXPIRY_WARNING_DAYS)
    return <span className="inline-flex items-center gap-1 text-xs font-600 px-2 py-0.5 rounded-full text-amber-600 bg-amber-50 border border-amber-200"><Clock className="w-3 h-3" />{days}h lagi</span>
  const s = STATUS_DOKUMEN.find(x => x.value === status)
  return <span className={`inline-flex items-center gap-1 text-xs font-600 px-2 py-0.5 rounded-full border ${s?.color || 'text-slate-500 bg-slate-100 border-slate-200'}`}>{status}</span>
}

function PreviewModal({ doc, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let url
    getFileBlob(doc.drive_file_id)
      .then(blob => { url = URL.createObjectURL(blob); setBlobUrl(url) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [doc.drive_file_id])

  const isPdf   = doc.tipe_mime === 'application/pdf'
  const isImage = doc.tipe_mime?.startsWith('image/')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="font-600 text-slate-800 text-sm truncate max-w-md">{doc.nama_file}</p>
            <p className="text-xs text-slate-400">{doc.tipe_dokumen} · {formatBytes(doc.ukuran_file)}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={doc.drive_web_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-600 text-brand-600 border border-brand-200 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors">
              <ExternalLink className="w-3 h-3" /> Buka di Drive
            </a>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden bg-slate-100 flex items-center justify-center min-h-64">
          {loading && <div className="text-center text-slate-400"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-sm">Memuat...</p></div>}
          {error   && <div className="text-center p-8"><AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2" /><p className="text-sm text-slate-500">{error}</p><a href={doc.drive_web_link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" />Buka di Google Drive</a></div>}
          {blobUrl && isPdf   && <iframe src={blobUrl} className="w-full h-full" style={{ minHeight: '60vh' }} title={doc.nama_file} />}
          {blobUrl && isImage && <img src={blobUrl} alt={doc.nama_file} className="max-w-full max-h-full object-contain p-4" />}
          {blobUrl && !isPdf && !isImage && <div className="text-center p-8"><FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-sm text-slate-500">Preview tidak tersedia</p><a href={doc.drive_web_link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" />Buka di Google Drive</a></div>}
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex gap-6 flex-wrap text-xs text-slate-500">
          <span>Ref: <strong className="text-slate-700">{doc.no_referensi || '-'}</strong></span>
          <span>Upload: <strong className="text-slate-700">{formatDate(doc.tanggal_upload)}</strong></span>
          {doc.tanggal_expired && <span>Expired: <strong className="text-slate-700">{formatDate(doc.tanggal_expired)}</strong></span>}
          {doc.tags?.length > 0 && <span className="flex gap-1 flex-wrap">{doc.tags.map(t => <span key={t} className="bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded">{t}</span>)}</span>}
        </div>
      </div>
    </div>
  )
}

export default function DokumenPage({ onGoUpload }) {
  const [docs, setDocs]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [view, setView]               = useState('list')
  const [preview, setPreview]         = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting]       = useState(false)
  const [showFilter, setShowFilter]   = useState(false)
  const [filters, setFilters]         = useState({ query: '', tipe: 'Semua', status: 'Semua', dateFrom: '', dateTo: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try { setDocs(await searchDokumen(filters)) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  async function handleDelete(doc) {
    setDeleting(true)
    try {
      // FIX: Hapus Drive dulu, pastu Sheets — kalau Drive fail, stop (jangan orphan metadata)
      // Kalau Drive 404 (file dah takde), tetap proceed delete metadata Sheets
      await deleteFileFromDrive(doc.drive_file_id)
      await deleteDokumenByRow(doc._row)
    } catch (e) {
      // Kalau Drive berjaya tapi Sheets fail, cuba delete Sheets lagi
      // Supaya takde orphan metadata
      if (e.message?.includes('Sheets') || e.message?.includes('sheets')) {
        try { await deleteDokumenByRow(doc._row) } catch {}
      }
      console.error('Delete error:', e)
    }
    setDeleteConfirm(null)
    setDeleting(false)
    load()
  }

  const activeFilterCount = [filters.tipe !== 'Semua', filters.status !== 'Semua', filters.dateFrom, filters.dateTo].filter(Boolean).length

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-700 text-slate-800">Semua Dokumen</h1>
          <p className="text-slate-500 text-sm mt-0.5">{docs.length} dokumen · tersimpan di Google Sheets & Drive</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setView(v => v === 'list' ? 'grid' : 'list')} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
            {view === 'list' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Cari nama file, no. referensi, tags..."
            value={filters.query} onChange={e => setFilters(f => ({ ...f, query: e.target.value }))}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white" />
        </div>
        <button onClick={() => setShowFilter(f => !f)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-600 rounded-xl border transition-all ${showFilter || activeFilterCount > 0 ? 'border-brand-400 text-brand-600 bg-brand-50' : 'border-slate-200 text-slate-600 hover:border-brand-300 bg-white'}`}>
          <Filter className="w-4 h-4" />Filter
          {activeFilterCount > 0 && <span className="w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center">{activeFilterCount}</span>}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showFilter && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-600 text-slate-500 mb-1 block">Tipe</label>
            <select value={filters.tipe} onChange={e => setFilters(f => ({ ...f, tipe: e.target.value }))}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300">
              <option>Semua</option>
              {TIPE_DOKUMEN.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-600 text-slate-500 mb-1 block">Status</label>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300">
              <option>Semua</option>
              {STATUS_DOKUMEN.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-600 text-slate-500 mb-1 block">Dari</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div>
            <label className="text-xs font-600 text-slate-500 mb-1 block">Sampai</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div className="col-span-2 md:col-span-4 flex justify-end">
            <button onClick={() => setFilters({ query: '', tipe: 'Semua', status: 'Semua', dateFrom: '', dateTo: '' })}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors">Reset filter</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="w-7 h-7 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mr-3" />
          Memuat dari Google Sheets...
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20">
          <FileX className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-600 text-slate-500">Belum ada dokumen</p>
          <button onClick={onGoUpload} className="mt-4 px-4 py-2 text-sm font-600 text-brand-600 border border-brand-200 hover:bg-brand-50 rounded-xl transition-colors">Upload Sekarang</button>
        </div>
      ) : view === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Dokumen','Tipe','Status','Tanggal Upload','Ukuran','Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-700 text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-brand-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-500 text-slate-800 truncate max-w-xs">{doc.nama_file}</p>
                        {doc.no_referensi && <p className="text-xs text-slate-400">{doc.no_referensi}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-500">{doc.tipe_dokumen}</td>
                  <td className="px-4 py-3"><StatusBadge status={doc.status} tanggal_expired={doc.tanggal_expired} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(doc.tanggal_upload)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatBytes(doc.ukuran_file)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setPreview(doc)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                      <a href={doc.drive_web_link} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><ExternalLink className="w-4 h-4" /></a>
                      <button onClick={() => setDeleteConfirm(doc)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {docs.map(doc => (
            <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-brand-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5 text-brand-500" /></div>
                <StatusBadge status={doc.status} tanggal_expired={doc.tanggal_expired} />
              </div>
              <p className="text-sm font-600 text-slate-800 truncate mb-0.5">{doc.nama_file}</p>
              <p className="text-xs text-slate-400 mb-3">{doc.tipe_dokumen} · {formatBytes(doc.ukuran_file)}</p>
              <div className="flex gap-2">
                <button onClick={() => setPreview(doc)} className="flex-1 flex items-center justify-center gap-1 text-xs font-600 text-brand-600 bg-brand-50 hover:bg-brand-100 py-1.5 rounded-lg transition-colors"><Eye className="w-3 h-3" />Preview</button>
                <a href={doc.drive_web_link} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 text-xs font-600 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-1.5 rounded-lg transition-colors"><ExternalLink className="w-3 h-3" />Drive</a>
                <button onClick={() => setDeleteConfirm(doc)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && <PreviewModal doc={preview} onClose={() => setPreview(null)} />}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
            <h3 className="font-700 text-slate-800 mb-1">Hapus Dokumen?</h3>
            <p className="text-sm text-slate-500 mb-1">Akan dihapus dari Drive dan Sheets:</p>
            <p className="text-sm font-600 text-slate-700 bg-slate-50 rounded-xl px-3 py-2 mb-5 truncate">{deleteConfirm.nama_file}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 text-sm font-600 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                className="flex-1 py-2.5 text-sm font-600 text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60">
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
