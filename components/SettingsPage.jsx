import React, { useState } from 'react'
import { Download, Trash2, Info, CheckCircle2, Table2 } from 'lucide-react'
import { getAllDokumen, exportToCSV } from '../src/sheets'
import { GOOGLE_CONFIG } from '../src/config'

export default function SettingsPage({ user }) {
  const [exporting, setExporting] = useState(false)
  const [msg, setMsg] = useState(null)

  function showMsg(text, type = 'success') {
    setMsg({ text, type }); setTimeout(() => setMsg(null), 3000)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const docs = await getAllDokumen()
      exportToCSV(docs)
      showMsg(`${docs.length} dokumen berhasil diekspor`)
    } catch (e) { showMsg(e.message, 'error') }
    setExporting(false)
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-700 text-slate-800">Pengaturan</h1>
        <p className="text-slate-500 text-sm mt-0.5">Konfigurasi dan manajemen data</p>
      </div>

      {msg && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-500 ${msg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{msg.text}
        </div>
      )}

      {/* Info Akun */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
        <h3 className="font-700 text-slate-700 text-sm mb-3 flex items-center gap-2"><Info className="w-4 h-4" />Informasi Akun</h3>
        <div className="space-y-2 text-sm">
          {[
            ['Nama', user?.name],
            ['Email', user?.email],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-slate-500">{k}</span>
              <span className="font-500 text-slate-700">{v || '-'}</span>
            </div>
          ))}
          <div className="flex justify-between"><span className="text-slate-500">Scope OAuth</span><span className="text-xs text-emerald-600 font-500">drive.file + spreadsheets ✓</span></div>
        </div>
      </div>

      {/* Storage info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
        <h3 className="font-700 text-slate-700 text-sm mb-3 flex items-center gap-2"><Table2 className="w-4 h-4" />Storage</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-500 text-slate-700">Google Sheets (Metadata)</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-64">{GOOGLE_CONFIG.SHEET_ID}</p>
            </div>
            <a href={`https://docs.google.com/spreadsheets/d/${GOOGLE_CONFIG.SHEET_ID}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand-600 hover:underline flex-shrink-0 ml-2">Buka ↗</a>
          </div>
          <div className="border-t border-slate-100 pt-3 flex items-start justify-between">
            <div>
              <p className="font-500 text-slate-700">Google Drive (File)</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-64">{GOOGLE_CONFIG.FOLDER_ID}</p>
            </div>
            <a href={`https://drive.google.com/drive/folders/${GOOGLE_CONFIG.FOLDER_ID}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand-600 hover:underline flex-shrink-0 ml-2">Buka ↗</a>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-600 text-slate-700">Export List Dokumen</p>
            <p className="text-xs text-slate-400 mt-0.5">Download semua metadata dari Sheets sebagai CSV</p>
          </div>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 text-xs font-600 text-brand-600 border border-brand-200 hover:bg-brand-50 px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
            <Download className="w-3.5 h-3.5" />{exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <p className="text-xs font-700 text-slate-500 mb-2 uppercase tracking-wide">Info Teknis</p>
        <div className="space-y-1 text-xs text-slate-500">
          <p>• Metadata dokumen tersimpan di <strong>Google Sheets</strong> (bisa dilihat/edit langsung)</p>
          <p>• File asli tersimpan di <strong>Google Drive</strong> folder yang sudah ditentukan</p>
          <p>• Data bisa diakses dari device & browser manapun setelah login</p>
          <p>• Backup otomatis oleh Google — tidak ada data di browser lokal</p>
        </div>
      </div>
    </div>
  )
}
