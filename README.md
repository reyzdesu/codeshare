# codeshare

Platform berbagi code snippet, minimalist & fast.

## Tech Stack
- **Backend**: Node.js + Express + MongoDB + JWT
- **Frontend**: React + Vite (no CSS framework, pure inline styles)

---

## Setup

### Prerequisites
- Node.js v18+
- MongoDB running di `localhost:27017`

---

### 1. Backend

```bash
cd server
npm install
npm run dev
```

Server jalan di: `http://localhost:3001`

#### Environment Variables (opsional)
```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/codeshare
JWT_SECRET=your_secret_key
```

---

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Frontend jalan di: `http://localhost:5173`

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/auth/register` | ❌ | Daftar akun |
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/auth/me` | ✅ | Info user login |

### Snippets
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/snippets` | ❌ | List semua snippet (paginated) |
| POST | `/api/snippets` | ✅ | Buat snippet baru |
| GET | `/api/snippets/:slug` | ❌ | Lihat snippet |
| GET | `/api/snippets/:slug/raw` | ❌ | Raw code (plain text) |
| PUT | `/api/snippets/:slug` | ✅ | Edit snippet (owner only) |
| DELETE | `/api/snippets/:slug` | ✅ | Hapus snippet (owner only) |

### Users
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/users/:username` | ❌ | Profile + semua snippet user |
| PUT | `/api/users/me/bio` | ✅ | Update bio |

---

## Fitur

- ✅ Login / register via username + password
- ✅ Upload code snippet dengan judul, bahasa, dan deskripsi
- ✅ Syntax highlighting (built-in, no lib)
- ✅ Line numbers
- ✅ Raw endpoint per snippet (`/snippets/:slug/raw`)
- ✅ Permalink per snippet
- ✅ Counter views
- ✅ Tab key berfungsi di editor
- ✅ Profile page + edit bio
- ✅ Delete snippet (owner only)
- ✅ Explore + search
- ✅ Data tersimpan permanent di MongoDB
- ✅ JWT auth (7 hari)

---

## Struktur

```
codeshare/
├── server/
│   ├── server.js        ← semua endpoint
│   └── package.json
└── client/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        └── App.jsx      ← seluruh frontend (single file)
```
