// ─────────────────────────────────────────────────────────────────────────────
// KONFIGURASI UTAMA
// ─────────────────────────────────────────────────────────────────────────────

export const GOOGLE_CONFIG = {
  CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

  // Scope: Drive (upload file) + Sheets (baca/tulis metadata)
  SCOPES: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
  ].join(' '),

  // Google Drive Folder ID tempat file disimpan
  FOLDER_ID: '1JozsXF_7ooZYRcHzjAk8YQllfAnS03fW',

  // Google Sheets ID tempat metadata disimpan
  SHEET_ID: '1db0D1yTN2w7kv8N2mOG-p6mSk-ZmsuDqbcoXdagEoKE',

  // Nama sheet/tab di dalam spreadsheet
  SHEET_TAB: 'Dokumen',
}

export const APP_CONFIG = {
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB
  ALLOWED_EXTENSIONS: ['.pdf', '.xls', '.xlsx', '.docx', '.jpg', '.jpeg', '.png', '.webp', '.zip'],
  EXPIRY_WARNING_DAYS: 30,
}

// Header kolom Google Sheets — urutan ini HARUS konsisten
export const SHEET_HEADERS = [
  'id', 'nama_file', 'tipe_dokumen', 'no_referensi',
  'tanggal_upload', 'tanggal_dokumen', 'tanggal_expired',
  'status', 'ukuran_file', 'tipe_mime',
  'drive_file_id', 'drive_web_link',
  'upload_oleh', 'keterangan', 'tags',
]

export const TIPE_DOKUMEN = [
  { value: 'Invoice',   label: 'Commercial Invoice',         hasExpiry: false },
  { value: 'PL',        label: 'Packing List',               hasExpiry: false },
  { value: 'BL',        label: 'Bill of Lading',             hasExpiry: false },
  { value: 'AWB',       label: 'Air Waybill',                hasExpiry: false },
  { value: 'PIB',       label: 'Pemberitahuan Impor Barang', hasExpiry: false },
  { value: 'PEB',       label: 'Pemberitahuan Ekspor Barang',hasExpiry: false },
  { value: 'COO',       label: 'Certificate of Origin',      hasExpiry: true  },
  { value: 'SKA',       label: 'Surat Keterangan Asal',      hasExpiry: true  },
  { value: 'LC',        label: 'Letter of Credit',           hasExpiry: true  },
  { value: 'Phyto',     label: 'Phytosanitary Certificate',  hasExpiry: true  },
  { value: 'Fumigasi',  label: 'Fumigation Certificate',     hasExpiry: true  },
  { value: 'Lainnya',   label: 'Lainnya',                    hasExpiry: false },
]

export const STATUS_DOKUMEN = [
  { value: 'Draft',      label: 'Draft',      color: 'text-amber-600  bg-amber-50  border-amber-200'  },
  { value: 'Final',      label: 'Final',      color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'Expired',    label: 'Expired',    color: 'text-red-600    bg-red-50    border-red-200'    },
  { value: 'Dibatalkan', label: 'Dibatalkan', color: 'text-slate-500  bg-slate-100 border-slate-200'  },
]
