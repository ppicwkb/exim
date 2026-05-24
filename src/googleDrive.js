import { GOOGLE_CONFIG } from './config'

let accessToken = null
let tokenClient = null

// FIX: initGoogleAuth kini terima onToken callback terus, tanpa guna window.__onDmsToken
export function initGoogleAuth(onSignIn, onSignOut) {
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CONFIG.CLIENT_ID,
    scope: GOOGLE_CONFIG.SCOPES,
    callback: async (response) => {
      if (response.error) { onSignOut?.(); return }
      accessToken = response.access_token
      try {
        const profile = await fetchUserProfile()
        // Pass profile DAN token terus — onSignIn akan handle initSheet
        onSignIn?.(profile, accessToken)
      } catch {
        onSignOut?.()
      }
    },
  })
}

export function requestAccessToken() {
  tokenClient?.requestAccessToken({ prompt: '' })
}

export function revokeToken() {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken)
    accessToken = null
  }
}

async function fetchUserProfile() {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Gagal fetch profile')
  return res.json()
}

// ── Drive: upload ke folder spesifik ─────────────────────────────────────────

export async function uploadFileToDrive(file, onProgress) {
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [GOOGLE_CONFIG.FOLDER_ID],
  }
  const boundary = '-------DMS_BOUNDARY'
  const enc = new TextEncoder()
  const metaPart = enc.encode(
    `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`
  )
  const closeDelim = enc.encode(`\r\n--${boundary}--`)
  const fileBuffer = await file.arrayBuffer()
  const body = new Blob([metaPart, fileBuffer, closeDelim])

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size')
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.setRequestHeader('Content-Type', `multipart/related; boundary="${boundary}"`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText))
      else reject(new Error(`Upload gagal: ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('Network error saat upload'))
    xhr.send(body)
  })
}

export async function deleteFileFromDrive(fileId) {
  if (!fileId) return
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  // 404 = file sudah takde, bukan error fatal
  if (!res.ok && res.status !== 404) {
    throw new Error(`Gagal hapus file dari Drive: ${res.status}`)
  }
}

export async function getFileBlob(fileId) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Gagal ambil file dari Drive')
  return res.blob()
}
