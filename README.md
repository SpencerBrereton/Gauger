# Gauger

A contractor expense tracking app — receipt uploads, expense forms, invoice tracking, and reconciliation. Single Expo codebase targeting **Android** and **Web**, backed by a **Ruby on Rails API**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Ruby on Rails 7 (API mode) |
| Database | PostgreSQL via Supabase |
| File Storage | Cloudflare R2 (S3-compatible, via ActiveStorage) |
| Auth | Devise + devise-jwt (JWT only) |
| Email | Resend (transactional) |
| Frontend | Expo (managed workflow) — Android + Web |
| Mobile Build | EAS Build |

---

## Repo Structure

```
Gauger/
├── backend/          # Rails API
├── app/              # Expo app (Android + Web)
├── docs/
│   └── architecture.md
├── .gitignore
└── README.md
```

---

## Local Setup

### Prerequisites

- Ruby 3.2+ with Bundler
- Rails 7.1+
- Node.js 18+ and npm
- PostgreSQL client (or Supabase connection)
- Expo CLI: `npm install -g expo-cli` (optional — `npx` works too)

---

### Backend (`/backend`)

```bash
cd backend

# 1. Install gems
bundle install

# 2. Copy and fill in environment variables
cp .env.example .env
# Edit .env with your Supabase and R2 credentials

# 3. Set up the database
rails db:create
rails db:migrate

# 4. Start the server (default port 3000)
rails server
```

**Required environment variables** (see `backend/.env.example`):

| Variable | Description |
|----------|-------------|
| `SUPABASE_DB_HOST` | Supabase PostgreSQL host |
| `SUPABASE_DB_NAME` | Database name |
| `SUPABASE_DB_USER` | Database user |
| `SUPABASE_DB_PASSWORD` | Database password |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET` | R2 bucket name |
| `RESEND_API_KEY` | Resend API key for email |
| `DEVISE_JWT_SECRET_KEY` | Secret key for JWT signing |
| `FRONTEND_URL` | Production Expo web URL (for CORS) |

---

### Frontend App (`/app`)

```bash
cd app

# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.example .env
# Edit EXPO_PUBLIC_API_BASE_URL if your backend runs on a different port

# 3a. Run on Web
npx expo start --web

# 3b. Run on Android emulator or device
npx expo start --android
```

**Required environment variables** (see `app/.env.example`):

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | Rails API base URL (e.g. `http://localhost:3000/api/v1`) |

---

### Android Production Build (EAS)

```bash
cd app

# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build APK
eas build --platform android --profile production
```

---

## End-to-End Flow

1. User logs in → Expo calls `POST /api/v1/users/sign_in` → JWT returned and stored securely
2. User creates expense → `POST /api/v1/expenses` with optional receipt image upload
3. Receipt uploaded → ActiveStorage stores file in Cloudflare R2
4. User creates invoice → `POST /api/v1/invoices` → Resend sends email notification
5. Reconciliation report generated → `POST /api/v1/reconciliation_reports`

See [`docs/architecture.md`](docs/architecture.md) for a full system overview.
