import React, { useEffect, useState } from 'react'
import { AlertTriangle, Clock, CheckCircle2, FileText, ExternalLink } from 'lucide-react'
import { getAllDokumen } from '../src/sheets'
import { APP_CONFIG } from '../src/config'

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

// FIX: Null-safe getDays
function getDays(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24))
}

export default function NotifPage() {
  const [expired, setExpired] = useState([])
  const [warning, setWarning] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllDokumen().then(docs => {
      // FIX: filter dengan getDays null-safe
      const withExpiry = docs.filter(d => {
        const days = getDays(d.tanggal_expired)
        return days !== null
      })
      setExpired(withExpiry.filter(d => getDays(d.tanggal_expired) <= 0))
      setWarning(
        withExpiry
          .filter(d => { const days = getDays(d.tanggal_expired); return days !== null && days > 0 && days <= APP_CONFIG.EXPIRY_WARNING_DAYS })
          .sort((a, b) => new Date(a.tanggal_expired) - new Date(b.tanggal_expired))
      )
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mr-3" />
      Memuat dari Sheets...
    </div>
  )

  const total = expired.length + warning.length

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Notifikasi</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {total === 0 ? 'Semua dokumen dalam kondisi baik' : `${total} dokumen memerlukan perhatian`}
        </p>
      </div>

      {total === 0 && (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Tidak ada notifikasi</p>
        </div>
      )}

      {expired.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-bold text-red-600 text-sm">Sudah Expired ({expired.length})</h2>
          </div>
          <div className="space-y-2">
            {expired.map(doc => (
              <div key={doc.id} className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{doc.nama_file}</p>
                  <p className="text-xs text-slate-500">{doc.tipe_dokumen} · {doc.no_referensi || '-'}</p>
                  <p className="text-xs text-red-500 mt-0.5 font-semibold">Expired: {formatDate(doc.tanggal_expired)}</p>
                </div>
                {doc.drive_web_link && (
                  <a href={doc.drive_web_link} target="_blank" rel="noopener noreferrer"
                    className="text-slate-400 hover:text-brand-500 transition-colors mt-0.5">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {warning.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-amber-600 text-sm">Akan Expired dalam {APP_CONFIG.EXPIRY_WARNING_DAYS} Hari ({warning.length})</h2>
          </div>
          <div className="space-y-2">
            {warning.map(doc => {
              const days = getDays(doc.tanggal_expired)
              return (
                <div key={doc.id} className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{doc.nama_file}</p>
                    <p className="text-xs text-slate-500">{doc.tipe_dokumen} · {doc.no_referensi || '-'}</p>
                    <p className="text-xs text-amber-600 mt-0.5 font-semibold">{days} hari lagi · {formatDate(doc.tanggal_expired)}</p>
                  </div>
                  {doc.drive_web_link && (
                    <a href={doc.drive_web_link} target="_blank" rel="noopener noreferrer"
                      className="text-slate-400 hover:text-brand-500 transition-colors mt-0.5">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
