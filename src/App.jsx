import React, { useState, useEffect, createContext, useCallback } from 'react'
import { initGoogleAuth, requestAccessToken, revokeToken } from './googleDrive'
import { initSheet, getAllDokumen } from './sheets'
import { APP_CONFIG } from './config'
import LoginPage from '../components/LoginPage'
import Sidebar from '../components/Sidebar'
import DokumenPage from '../components/DokumenPage'
import UploadPage from '../components/UploadPage'
import NotifPage from '../components/NotifPage'
import SettingsPage from '../components/SettingsPage'

// Context untuk share accessToken ke komponen lain
export const TokenContext = createContext(null)

function getDaysToExpiry(iso) {
  if (!iso) return null
  return Math.ceil((new Date(iso) - new Date()) / (1000 * 60 * 60 * 24))
}

export default function App() {
  const [user, setUser]               = useState(null)
  const [token, setToken]             = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [sheetReady, setSheetReady]   = useState(false)
  const [sheetError, setSheetError]   = useState(null)
  const [page, setPage]               = useState('dokumen')
  const [expiredCount, setExpiredCount] = useState(0)
  const [googleReady, setGoogleReady] = useState(false)

  // FIX: Token handler sebagai useCallback supaya stable reference
  const handleToken = useCallback(async (tok) => {
    setToken(tok)
    try {
      await initSheet(tok)
      setSheetReady(true)
    } catch (e) {
      setSheetError(e.message)
    }
  }, [])

  // Tunggu Google GSI script siap
  useEffect(() => {
    function check() {
      if (window.google?.accounts?.oauth2) setGoogleReady(true)
      else setTimeout(check, 200)
    }
    check()
  }, [])

  useEffect(() => {
    if (!googleReady) return
    // FIX: Pass handleToken terus ke initGoogleAuth, tanpa guna window.__onDmsToken
    initGoogleAuth(
      async (profile, tok) => {
        setUser(profile)
        setAuthLoading(false)
        await handleToken(tok)
      },
      () => {
        setUser(null)
        setToken(null)
        setAuthLoading(false)
        setSheetReady(false)
      }
    )
  }, [googleReady, handleToken])

  // Hitung notifikasi expired
  useEffect(() => {
    if (!sheetReady) return
    getAllDokumen().then(docs => {
      const count = docs.filter(d => {
        const days = getDaysToExpiry(d.tanggal_expired)
        return days !== null && days <= APP_CONFIG.EXPIRY_WARNING_DAYS
      }).length
      setExpiredCount(count)
    }).catch(() => {})
  }, [sheetReady, page])

  function handleLogin() {
    setAuthLoading(true)
    requestAccessToken()
  }

  function handleLogout() {
    revokeToken()
    setUser(null)
    setToken(null)
    setSheetReady(false)
    setSheetError(null)
    setPage('dokumen')
  }

  if (!user) return <LoginPage onLogin={handleLogin} loading={authLoading} />

  if (!sheetReady) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        {sheetError ? (
          <>
            <p className="text-red-500 font-semibold mb-2">Gagal terhubung ke Google Sheets</p>
            <p className="text-sm text-slate-500 mb-4">{sheetError}</p>
            <button onClick={handleLogout} className="text-sm text-brand-600 hover:underline">Coba lagi</button>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Menghubungkan ke Google Sheets...</p>
          </>
        )}
      </div>
    </div>
  )

  return (
    <TokenContext.Provider value={token}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar active={page} onNav={setPage} user={user} onLogout={handleLogout} expiredCount={expiredCount} />
        <main className="flex-1 p-6 overflow-auto">
          {/* FIX: Pass user ke UploadPage untuk audit trail upload_oleh */}
          {page === 'dokumen'  && <DokumenPage onGoUpload={() => setPage('upload')} />}
          {page === 'upload'   && <UploadPage onUploadDone={() => setPage('dokumen')} user={user} />}
          {page === 'notif'    && <NotifPage />}
          {page === 'settings' && <SettingsPage user={user} />}
        </main>
      </div>
    </TokenContext.Provider>
  )
}
