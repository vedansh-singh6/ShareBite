# ShareBite — Flask API (Phase 1 backend)

Production-ready REST API that mirrors the frontend service layer **endpoint-for-endpoint**.
The frontend runs against centralized mock data by default; flipping `VITE_API_MODE=flask`
switches it to this API with **no UI changes**.

## Stack
- Flask 3 + Flask-SQLAlchemy + Flask-CORS
- MySQL (PyMySQL driver)
- JWT auth (PyJWT) + Werkzeug password hashing (no plaintext passwords)

## Layout
```
backend/
  app.py                  # application factory + blueprint registration
  config.py               # env-driven configuration
  extensions.py           # db / cors instances
  models.py               # User, Donation, DonationEvent, CollectionTask, TaskEvent, Notification
  auth.py                 # JWT helpers + role guards
  services.py             # donation/task workflow business logic
  routes_auth.py          # /api/auth/*
  routes_donations.py     # /api/donations/*
  routes_tasks.py         # /api/tasks/*
  routes_users.py         # /api/users/*
  routes_notifications.py # /api/notifications/*
  schema.sql              # raw MySQL schema (alternative to auto-create)
  seed.py                 # create tables + demo data
  requirements.txt
  .env.example
```

## Setup
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env        # Windows  (cp on macOS/Linux), then edit DATABASE_URL + secrets

# Create the database (either let seed.py auto-create tables, or run schema.sql):
mysql -u root -p < schema.sql

python seed.py                # creates tables + demo records
python app.py                 # http://127.0.0.1:5000
```

## Connect the frontend
In the project root `.env`:
```
VITE_API_MODE=flask
```
Vite proxies `/api` → `http://127.0.0.1:5000` (see `vite.config.js`). Restart `npm run dev`.

## Demo accounts (password: `demo1234`)
| Role | Email |
|------|-------|
| Donor | donor@sharebite.demo |
| NGO (verified) | ngo@sharebite.demo |
| NGO (unverified) | care@sharebite.demo |
| Volunteer | volunteer@sharebite.demo |
| Admin | admin@sharebite.demo |

## Key endpoints
```
POST /api/auth/register            POST /api/auth/login          GET /api/auth/me
GET  /api/donations                POST /api/donations           GET /api/donations/:id
POST /api/donations/:id/accept     POST /api/donations/:id/reject
POST /api/donations/:id/cancel     POST /api/donations/:id/confirm-receipt
GET  /api/tasks                    POST /api/tasks/:id/accept
POST /api/tasks/:id/pickup         POST /api/tasks/:id/deliver
GET  /api/users                    POST /api/users/:id/verify    POST /api/users/:id/active
GET  /api/notifications            POST /api/notifications/:id/read   POST /api/notifications/read-all
GET  /api/health
```

## Status pipeline
`pending → accepted → volunteer_assigned → picked_up → delivered → completed`
plus `rejected` (per-NGO decline) and `cancelled` (donor withdrawal). All transitions are
validated server-side in `services.py` and recorded as immutable timeline events.

## Phase 1 scope
No AI/ML prediction, advanced matching, live maps or complex analytics. The schema and
service layer are structured so these can be added later without reworking the API contract.