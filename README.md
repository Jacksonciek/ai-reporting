# AI Reporting Copilot

AI Reporting Copilot adalah sistem end-to-end yang menghadirkan chatbot analitik untuk data penjualan. Proyek ini terdiri dari dua bagian utama:

- **server/** – Backend Flask + SQLAlchemy yang menyediakan API, autentikasi JWT, manajemen dokumen, parsing transaksi, dan integrasi AI menggunakan model `gpt-5-mini`.
- **client/** – Frontend React (Vite + TypeScript) yang menyediakan antarmuka login/register, chatbot, serta dashboard admin untuk mengelola dokumen, transaksi, dan audit log.

Folder `visualization-aidece/` menyimpan prompt sistem bawaan yang digunakan kembali oleh layanan AI. Jangan ubah kontennya ketika melakukan penyesuaian lanjutan.

## Arsitektur

### Backend
- Flask app modular dengan blueprints untuk autentikasi, percakapan chatbot, dokumen, transaksi, dan audit log.
- SQLAlchemy model mengikuti desain skema yang diberikan (ID biner, relasi role/permission, audit log, dll).
- Manajemen migrasi menggunakan Alembic/Flask-Migrate.
- Integrasi OpenAI (`gpt-5-mini`) + LangChain + FAISS untuk retrieval augmented generation (RAG).
- Parsing dokumen CSV/Excel/PDF untuk mengisi tabel `transactions` secara otomatis dan mengekstrak teks konteks AI.

### Frontend
- React Router untuk routing halaman (Login, Register, Chat, Documents, Transactions, Audit Logs).
- Context API menyimpan token JWT & data user, termasuk role (admin vs user).
- UI siap pakai berbasis CSS sederhana.
- Fitur Admin: upload/rename/delete dokumen, lihat transaksi, pantau audit log.
- Fitur User: akses chatbot, memilih dokumen sebagai konteks percakapan, riwayat chat.

## Persiapan Lingkungan

### Prasyarat
- Python 3.11+
- Node.js 18+
- MySQL 8.x berjalan di `localhost` (tanpa password untuk user `root`, atau sesuaikan `DATABASE_URL`).

### Konfigurasi Backend
1. Masuk ke folder `server/` dan buat environment:
   ```bash
   cd server
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   ```
2. Edit `.env` bila perlu (DATABASE_URL, OPENAI_API_KEY, dsb).
3. Siapkan database MySQL kosong bernama `ai_reporting` (atau sesuai `DATABASE_URL`).
4. Inisialisasi & jalankan migrasi:
   ```bash
   flask db init  # sekali saja
   flask db migrate -m "init schema"
   flask db upgrade
   ```
   > Note: `FLASK_APP=server.app:create_app` dan variabel `.env` akan dibaca otomatis ketika menjalankan perintah `flask`.
5. Jalankan server pengembangan:
   ```bash
   flask --app server.app:create_app run --debug
   ```

### Konfigurasi Frontend
1. Masuk ke folder `client/`:
   ```bash
   cd client
   npm install
   npm run dev
   ```
2. Aplikasi akan aktif di `http://localhost:5173` dengan proxy ke backend (`http://localhost:5000`).

## Alur Fitur Utama

1. **Registrasi & Login**
   - Endpoint `POST /api/auth/register` & `POST /api/auth/login` mengembalikan token JWT + informasi role.
   - Frontend menyimpan token, mengatur header Authorization, dan melakukan proteksi route.

2. **Percakapan Chatbot**
   - Endpoint `POST /api/conversation_chatbots` membuat sesi baru sekaligus mengirim pesan awal ke AI.
   - Endpoint `POST /api/conversation_chatbots/<id>/messages` meneruskan percakapan.
   - Chatbot menggunakan dokumen yang dipilih (atau seluruh dokumen yang sudah diproses) sebagai konteks RAG.

3. **Manajemen Dokumen** (admin)
   - `POST /api/documents` – upload file CSV/XLSX/PDF.
   - `PATCH /api/documents/<id>` – rename.
   - `DELETE /api/documents/<id>` – hapus file + rekaman database.
   - Parsing otomatis menyimpan transaksi ke tabel `transactions` dan mencatat audit log.

4. **Transaksi & Audit Log** (admin)
   - `GET /api/transactions` – menampilkan data transaksi terstruktur.
   - `GET /api/logs` – menampilkan catatan tindakan penting (upload, rename, delete, kegagalan parsing).

## Pengujian Manual
- Gunakan Postman/HTTPie untuk memanggil endpoint API.
- Frontend dev server memudahkan integrasi langsung dengan backend.
- Pastikan `OPENAI_API_KEY` aktif agar chatbot memberikan respons.

## Struktur Direktori
```
client/                # React frontend
server/                # Flask backend
visualization-aidece/  # Prompt sistem AI
README.md
```

## Catatan Lanjutan
- Pastikan direktori `uploads/` & `vectorstore/` dapat ditulisi oleh aplikasi.
- Sesuaikan strategi penyimpanan file (mis. Cloudinary/S3) dengan mengganti implementasi `DocumentService._save_file`.
- Untuk produksi, gunakan reverse proxy (nginx) dan harden konfigurasi (HTTPS, JWT refresh, dsb).
- Tambahkan worker async (mis. Celery) jika proses parsing dokumen perlu dipindahkan dari request thread.
