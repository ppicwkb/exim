import React from 'react'
import { FileStack, Upload, Files, Bell, Settings, LogOut, ChevronRight } from 'lucide-react'

const menu = [
  { id: 'dokumen',  label: 'Semua Dokumen', icon: Files },
  { id: 'upload',   label: 'Upload Dokumen', icon: Upload },
  { id: 'notif',    label: 'Notifikasi',     icon: Bell },
  { id: 'settings', label: 'Pengaturan',     icon: Settings },
]

export default function Sidebar({ active, onNav, user, onLogout, expiredCount }) {
  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-200 flex flex-col shadow-sm">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <FileStack className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-700 text-slate-800 text-sm leading-tight">DMS</p>
            <p className="text-xs text-slate-400 leading-tight">Export-Import</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {menu.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          const badge = id === 'notif' && expiredCount > 0 ? expiredCount : null
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-500 transition-all duration-150 group ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge && (
                <span className={`text-xs font-700 px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
                  {badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-slate-100">
        <div className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors">
          {user?.picture ? (
            <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-700 text-brand-700">{user?.name?.[0] || 'U'}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-600 text-slate-700 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
          </div>
          <button onClick={onLogout} title="Logout" className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
