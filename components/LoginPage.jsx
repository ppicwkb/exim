import React from 'react'
import { FileStack, ShieldCheck, HardDrive, Search } from 'lucide-react'

export default function LoginPage({ onLogin, loading }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4 border border-white/20">
            <FileStack className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">DMS Export-Import</h1>
          <p className="text-brand-200 mt-1 text-sm">Document Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-brand-900/40 p-8">
          <h2 className="text-xl font-700 text-slate-800 mb-1">Masuk ke Sistem</h2>
          <p className="text-slate-500 text-sm mb-6">
            Login dengan akun Google Workspace perusahaan untuk mengakses dokumen.
          </p>

          <button
            onClick={onLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50 text-slate-700 font-600 py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Menghubungkan...' : 'Login dengan Google'}
          </button>

          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-3 gap-3">
            {[
              { icon: HardDrive, label: 'Google Drive', desc: 'Storage aman' },
              { icon: ShieldCheck, label: 'OAuth 2.0', desc: 'Login terenkripsi' },
              { icon: Search, label: 'Pencarian', desc: 'Cepat & mudah' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-brand-50 rounded-lg mb-1">
                  <Icon className="w-4 h-4 text-brand-600" />
                </div>
                <p className="text-xs font-600 text-slate-700">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-brand-300 text-xs mt-6">
          Hanya mengakses file yang dibuat oleh aplikasi ini
        </p>
      </div>
    </div>
  )
}
