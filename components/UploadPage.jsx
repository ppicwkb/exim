import React, { useState, useRef } from 'react'
import { Upload, X, FileText, CheckCircle2, AlertCircle, CloudUpload } from 'lucide-react'
import { TIPE_DOKUMEN, STATUS_DOKUMEN, APP_CONFIG } from '../config'
import { uploadFileToDrive } from '../googleDrive'
import { addDokumen } from '../sheets'

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function FileItem({ file, onRemove, progress, status, error }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <div className="w-9 h-9 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-brand-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-500 text-slate-800 truncate">{file.name}</p>
        <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
        {progress !== null && status === 'uploading' && (
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}
        {status === 'done'  && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Berhasil diupload ke Drive + Sheets</p>}
        {status === 'error' && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      </div>
      {status !== 'uploading' && (
        <button onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors mt-0.5">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default function UploadPage({ onUploadDone }) {
  const [files, setFiles]       = useState([])
  const [dragging, setDragging] = useState(false)
  const [fileStates, setFileStates] = useState({})
  const [uploading, setUploading]   = useState(false)
  const [form, setForm] = useState({
    tipe_dokumen: 'Invoice', no_referensi: '', tanggal_dokumen: '',
    tanggal_expired: '', status: 'Final', keterangan: '', tags: '',
  })
  const inputRef = useRef()

  const tipeDef = TIPE_DOKUMEN.find(t => t.value === form.tipe_dokumen)

  function addFiles(newFiles) {
    const valid = Array.from(newFiles).filter(f => {
      if (f.size > APP_CONFIG.MAX_FILE_SIZE_BYTES) return false
      const ext = '.' + f.name.split('.').pop().toLowerCase()
      return APP_CONFIG.ALLOWED_EXTENSIONS.includes(ext)
    })
    setFiles(prev => [...prev, ...valid.map(f => ({ file: f, id: Math.random().toString(36).slice(2) }))])
  }

  function onDrop(e) {
    e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files)
  }

  async function handleUpload() {
    if (!files.length) return
    setUploading(true)
    const tagsArr = form.tags.split(',').map(t => t.trim()).filter(Boolean)

    for (const { file, id } of files) {
      setFileStates(prev => ({ ...prev, [id]: { progress: 0, status: 'uploading', error: null } }))
      try {
        // 1. Upload file ke Google Drive folder
        const driveFile = await uploadFileToDrive(file, (p) => {
          setFileStates(prev => ({ ...prev, [id]: { ...prev[id], progress: p } }))
        })
        // 2. Simpan metadata ke Google Sheets
        await addDokumen({
          nama_file:       file.name,
          tipe_dokumen:    form.tipe_dokumen,
          no_referensi:    form.no_referensi,
          tanggal_dokumen: form.tanggal_dokumen || '',
          tanggal_expired: form.tanggal_expired || '',
          status:          form.status,
          keterangan:      form.keterangan,
          tags:            tagsArr,
          ukuran_file:     file.size,
          tipe_mime:       file.type,
          drive_file_id:   driveFile.id,
          drive_web_link:  driveFile.webViewLink,
          upload_oleh:     '',
        })
        setFileStates(prev => ({ ...prev, [id]: { progress: 100, status: 'done', error: null } }))
      } catch (err) {
        setFileStates(prev => ({ ...prev, [id]: { progress: 0, status: 'error', error: err.message } }))
      }
    }
    setUploading(false)
    setTimeout(() => onUploadDone?.(), 1200)
  }

  const allDone = files.length > 0 && files.every(({ id }) => fileStates[id]?.status === 'done')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-700 text-slate-800">Upload Dokumen</h1>
        <p className="text-slate-500 text-sm mt-1">File → Google Drive · Metadata → Google Sheets</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 mb-5 ${
          dragging ? 'border-brand-400 bg-brand-50' : 'border-slate-300 hover:border-brand-300 hover:bg-slate-50'
        }`}
      >
        <input ref={inputRef} type="file" multiple className="hidden"
          accept={APP_CONFIG.ALLOWED_EXTENSIONS.join(',')}
          onChange={e => addFiles(e.target.files)}
        />
        <CloudUpload className={`w-10 h-10 mx-auto mb-3 ${dragging ? 'text-brand-500' : 'text-slate-300'}`} />
        <p className="font-600 text-slate-700 text-sm">Drag & drop file ke sini</p>
        <p className="text-xs text-slate-400 mt-1">atau klik untuk pilih file</p>
        <p className="text-xs text-slate-300 mt-2">PDF · Excel · Word · Image · ZIP · Maks 50 MB</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 mb-5">
          {files.map(({ file, id }) => (
            <FileItem key={id} file={file}
              progress={fileStates[id]?.progress ?? null}
              status={fileStates[id]?.status}
              error={fileStates[id]?.error}
              onRemove={() => setFiles(f => f.filter(x => x.id !== id))}
            />
          ))}
        </div>
      )}

      {/* Form metadata */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-600 text-slate-700 text-sm">Informasi Dokumen</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-600 text-slate-600 mb-1 block">Tipe Dokumen *</label>
            <select value={form.tipe_dokumen}
              onChange={e => setForm(f => ({ ...f, tipe_dokumen: e.target.value, tanggal_expired: '' }))}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300">
              {TIPE_DOKUMEN.map(t => <option key={t.value} value={t.value}>{t.value} — {t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-600 text-slate-600 mb-1 block">Status *</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300">
              {STATUS_DOKUMEN.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-600 text-slate-600 mb-1 block">No. Referensi (PO / Shipment / Kontrak)</label>
          <input type="text" placeholder="Contoh: SHP-2026-001"
            value={form.no_referensi} onChange={e => setForm(f => ({ ...f, no_referensi: e.target.value }))}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-600 text-slate-600 mb-1 block">Tanggal Dokumen</label>
            <input type="date" value={form.tanggal_dokumen}
              onChange={e => setForm(f => ({ ...f, tanggal_dokumen: e.target.value }))}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          {tipeDef?.hasExpiry && (
            <div>
              <label className="text-xs font-600 text-slate-600 mb-1 block">Tanggal Expired</label>
              <input type="date" value={form.tanggal_expired}
                onChange={e => setForm(f => ({ ...f, tanggal_expired: e.target.value }))}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-600 text-slate-600 mb-1 block">Tags (pisah dengan koma)</label>
          <input type="text" placeholder="urgent, Q1-2026, tanjung-priok"
            value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>
        <div>
          <label className="text-xs font-600 text-slate-600 mb-1 block">Keterangan</label>
          <textarea rows={2} placeholder="Catatan tambahan..."
            value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
        </div>
      </div>

      <button onClick={handleUpload} disabled={!files.length || uploading || allDone}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-600 py-3 rounded-xl transition-all text-sm">
        {uploading ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Mengupload...</>
        ) : allDone ? (
          <><CheckCircle2 className="w-4 h-4" />Selesai!</>
        ) : (
          <><Upload className="w-4 h-4" />Upload {files.length > 0 ? `${files.length} File` : 'Dokumen'}</>
        )}
      </button>
    </div>
  )
}
