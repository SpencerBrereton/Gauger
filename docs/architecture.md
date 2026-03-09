# Gauger — System Architecture

## Overview

Gauger is a monorepo containing two sub-projects:

- **`/backend`** — Ruby on Rails 7 API (JSON only, no views)
- **`/app`** — Expo managed-workflow app targeting Android and Web from a single codebase

---

## System Diagram

```
┌─────────────────────────────────────────────┐
│               Client Layer                  │
│                                             │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Expo Web App   │  │  Expo Android    │  │
│  │ (react-native-  │  │  App (EAS Build) │  │
│  │    web)         │  │                  │  │
│  └────────┬────────┘  └────────┬─────────┘  │
└───────────┼────────────────────┼────────────┘
            │  HTTPS / JWT       │
            ▼                    ▼
┌─────────────────────────────────────────────┐
│          Rails API (Render)                 │
│                                             │
│  POST /api/v1/users/sign_in   (JWT auth)    │
│  CRUD /api/v1/expenses                      │
│  POST /api/v1/receipts        (upload)      │
│  CRUD /api/v1/invoices                      │
│  CRUD /api/v1/reconciliation_reports        │
└─────────┬──────────────────┬────────────────┘
          │                  │
          ▼                  ▼
┌──────────────────┐  ┌──────────────────────┐
│    Supabase      │  │   Cloudflare R2      │
│  (PostgreSQL)    │  │  (File Storage,      │
│                  │  │   S3-compatible)     │
│  - users         │  │                      │
│  - expenses      │  │  - receipt images    │
│  - invoices      │  │  - invoice PDFs      │
│  - reconcilia-   │  │    (future)          │
│    tion_reports  │  └──────────────────────┘
└──────────────────┘
          │
          ▼
┌──────────────────┐
│     Resend       │
│  (Email API)     │
│  - Invoice sent  │
│  - Reminders     │
└──────────────────┘
```

---

## Component Descriptions

### Rails API (`/backend`)

| Component | Purpose |
|-----------|---------|
| Devise + devise-jwt | User registration, login, JWT token issuance and revocation |
| ActiveStorage + aws-sdk-s3 | Receipt image upload, stored in Cloudflare R2 |
| rack-cors | Controls which origins can call the API |
| Resend (via HTTParty) | Sends transactional email for invoices |

**API versioning**: All routes are namespaced under `/api/v1`.

**Authentication flow**:
1. Client posts credentials to `POST /api/v1/users/sign_in`
2. Rails returns a JWT in the `Authorization` response header
3. Client stores JWT securely; attaches it as `Authorization: Bearer <token>` on every subsequent request
4. Logout via `DELETE /api/v1/users/sign_out` revokes the JWT (stored in `jti_matcher` column on User)

### Expo App (`/app`)

| Component | Purpose |
|-----------|---------|
| `src/api/client.js` | Axios instance; attaches JWT, handles 401 by clearing token and redirecting to Login |
| `src/utils/storage.js` | Platform abstraction: expo-secure-store on native, localStorage on web |
| `src/store/authStore.js` | Zustand store managing auth state (token, user profile) |
| `src/navigation/AppNavigator.js` | React Navigation: bottom tabs + stack navigators |
| `expo-image-picker` | Camera / photo library access for receipt capture |
| `react-native-paper` | Cross-platform UI components (works on Android and web) |

---

## Data Flow — Expense Creation with Receipt

```
1. User opens ExpenseFormScreen
2. Taps "Add Receipt" → ReceiptCameraScreen → expo-image-picker
3. Image selected → stored temporarily via expo-file-system
4. User fills expense form → taps Submit
5. App sends multipart POST /api/v1/expenses (includes image blob)
6. Rails creates Expense record in Supabase
7. ActiveStorage uploads image blob to Cloudflare R2
8. Rails returns expense JSON (including receipt URL signed by R2)
9. App navigates to ExpenseListScreen, showing new expense with thumbnail
```

---

## Deployment Targets

| Service | Platform | Notes |
|---------|----------|-------|
| Rails API | Render (Web Service) | Set env vars in Render dashboard |
| PostgreSQL | Supabase | Free tier; connect via `SUPABASE_DB_*` env vars |
| File Storage | Cloudflare R2 | S3-compatible; free egress |
| Expo Web | Render or Netlify | Static site from `npx expo export --platform web` |
| Expo Android | EAS Build | APK or AAB; distribute via internal link or Play Store |
| Email | Resend | Free tier: 3,000 emails/month |

---

## Key Design Decisions

- **Single Expo codebase** — avoids maintaining a separate React web app; `react-native-web` handles browser rendering with the same component code.
- **JWT-only auth** — no web sessions or cookies needed; stateless API simplifies multi-platform auth.
- **Supabase for PostgreSQL** — managed hosting with a generous free tier; no separate database server to maintain.
- **Cloudflare R2 for storage** — zero egress cost compared to AWS S3; S3-compatible API means ActiveStorage works without custom adapters.
- **API-mode Rails** — no asset pipeline, views, or Hotwire; keeps the backend lean and focused.
