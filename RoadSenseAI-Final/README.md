# Smart Road Monitoring System
### AI-Powered Pothole Detection & Reporting Platform

A production-ready full-stack platform that lets citizens report potholes with live GPS and photos, view a real-time city-wide map, get spoken driver alerts near hazards, and gives municipal authorities an analytics-driven admin dashboard.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Leaflet + marker clustering, Recharts, Socket.IO client |
| Backend | Node.js, Express.js, Socket.IO |
| Database | PostgreSQL |
| Auth | JWT (access + refresh), bcrypt password hashing |
| File handling | Multer + Sharp (resize/thumbnail) |
| AI hook | Pluggable external detection microservice (YOLO/TensorFlow), with safe fallback if disabled |
| Security | Helmet, CORS, rate limiting, XSS-clean, HPP, input validation/sanitization |

---

## 2. Folder Structure

```
smart-road-monitoring/
├── backend/
│   ├── src/
│   │   ├── config/db.js            # PostgreSQL pool
│   │   ├── controllers/            # auth, reports, users
│   │   ├── middleware/             # auth, upload, validation, error handling
│   │   ├── routes/                 # /api/auth, /api/reports, /api/users, /api/notifications
│   │   ├── db/schema.sql           # full DB schema
│   │   ├── db/migrate.js           # runs schema + seeds admin
│   │   ├── utils/                  # tokens, email, AI detection, validators
│   │   ├── app.js                  # Express app + security middleware
│   │   └── server.js               # HTTP + Socket.IO entrypoint
│   ├── uploads/                    # uploaded images (gitignored)
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages
│   │   │   ├── page.js             # landing page
│   │   │   ├── login/, register/, forgot-password/, reset-password/
│   │   │   ├── report/             # report submission (GPS + camera)
│   │   │   ├── map/                # live map
│   │   │   └── dashboard/, dashboard/admin/
│   │   ├── components/             # Navbar, Footer, MapView
│   │   ├── context/AuthContext.js
│   │   └── lib/api.js              # axios client
│   ├── .env.local.example
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 3. Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or use the included `docker-compose.yml`)

### Backend

```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL, JWT secrets, SMTP, etc.
npm install
npm run migrate           # creates tables + a default admin account
npm run dev                # http://localhost:5000
```

The migration prints the seeded admin email/password (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars). **Change this password immediately after first login.**

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                # http://localhost:3000
```

### Or run everything with Docker

```bash
docker compose up --build
```

---

## 4. Environment Variables

**backend/.env**
```
DATABASE_URL=postgresql://user:pass@host:5432/smart_road_monitoring
JWT_SECRET=...
JWT_REFRESH_SECRET=...
COOKIE_SECRET=...
CLIENT_URL=https://your-frontend-domain.com
SMTP_HOST=... SMTP_USER=... SMTP_PASS=...
AI_DETECTION_ENABLED=false        # set true once you deploy a model service
AI_DETECTION_URL=https://your-ai-service/detect
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain.com
```

---

## 5. API Overview

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create account | Public |
| POST | `/api/auth/login` | Login, returns JWT | Public |
| POST | `/api/auth/forgot-password` | Send reset email | Public |
| POST | `/api/auth/reset-password` | Reset with token | Public |
| GET | `/api/auth/me` | Current user | JWT |
| POST | `/api/reports` | Submit report (multipart, up to 3 images) | JWT |
| GET | `/api/reports` | List reports (filters + pagination) | Public |
| GET | `/api/reports/map` | Lightweight marker payload | Public |
| GET | `/api/reports/:id` | Report detail | Public |
| GET | `/api/reports/stats` | Dashboard analytics | Admin |
| PATCH | `/api/reports/:id/status` | Update status | Admin |
| DELETE | `/api/reports/:id` | Delete fake/spam report | Admin |
| GET/PATCH | `/api/users` | Manage users | Admin |

Real-time events via Socket.IO: `report:new`, `report:updated`, `report:deleted`.

---

## 6. AI Pothole Detection

The backend calls an optional external microservice (`AI_DETECTION_URL`) for each uploaded image, expecting:
```json
{ "isPothole": true, "confidence": 92.5, "severity": "high" }
```
This is intentionally decoupled — you can deploy a Python FastAPI service running a YOLOv8/TensorFlow model separately (e.g. on a GPU instance) without touching the Node backend. If the service is disabled or unreachable, reports still submit normally with a fallback classification, so the platform never breaks due to AI downtime.

---

## 7. Deployment

**Database:** Railway, Render, Supabase, or AWS RDS (PostgreSQL).

**Backend (Render / Railway):**
1. Connect the `backend/` folder as a service, build command `npm install`, start command `npm start`.
2. Set all env vars from `.env.example`.
3. Run `npm run migrate` once (via a one-off job/shell) after first deploy.
4. Mount persistent storage for `uploads/`, or switch to S3/Cloudinary for production scale.

**Frontend (Vercel):**
1. Import the `frontend/` folder as a Vercel project.
2. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to your deployed backend URL.
3. Deploy — Vercel builds with `npm run build` automatically.

**Full stack with Docker (AWS/DigitalOcean/any VM):**
```bash
docker compose up --build -d
```

---

## 8. Security Checklist (implemented)

- JWT auth with bcrypt (cost 12) password hashing
- Helmet security headers, CORS locked to `CLIENT_URL`
- express-rate-limit (global + stricter on auth routes)
- express-validator input validation + xss-clean + hpp sanitization
- Parameterized SQL queries (no string concatenation) — SQL-injection safe
- File upload validation: type whitelist, size limit, random filenames
- Forgot-password flow never reveals whether an email is registered

---

## 9. Notes & Next Steps for Production

- Replace local disk uploads with S3/Cloudinary for multi-instance scaling.
- Add a refresh-token rotation endpoint if you need silent re-auth (the refresh token is issued but rotation endpoint is left for you to wire to your session strategy).
- Plug in a real trained pothole-detection model behind `AI_DETECTION_URL`.
- Add automated tests (Jest/Supertest for backend, Playwright for frontend) before production rollout.
