# DMS Export-Import

Document Management System untuk dokumen export-import — upload ke Google Drive, metadata di Google Sheets.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Konfigurasi environment
```bash
cp .env.example .env
```
Edit `.env` dan isi nilai yang betul:
```
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_GOOGLE_FOLDER_ID=your-drive-folder-id
VITE_GOOGLE_SHEET_ID=your-sheets-id
```

### 3. Jalankan dev server
```bash
npm run dev
```

### 4. Build untuk production
```bash
npm run build
```

## Stack
- React 19 + Vite
- Tailwind CSS v3
- Google OAuth 2.0 (GSI)
- Google Drive API v3
- Google Sheets API v4

## Fixes (v1.1)
- **Tailwind content path** — tambah `/components/**` supaya styles tak di-purge masa build
- **Environment variables** — config sensitive guna `VITE_` prefix, baca dari `.env`
- **Token race condition** — hapus `window.__onDmsToken` pattern, guna React callback terus
- **Upload audit trail** — `upload_oleh` kini diisi dengan email user yang login
- **Delete error handling** — Drive 404 tak block delete metadata; better error reporting
- **Null-safe expired check** — `getDays()` handle empty string dan invalid date
- **Dead code** — hapus `db.js` (IndexedDB/Dexie) yang tak dipakai
