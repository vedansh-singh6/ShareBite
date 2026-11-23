# 🥗 ShareBite — Good Food Deserves a Second Chance

A premium food-redistribution platform connecting **surplus food donors**, **NGOs** and
**volunteers** so edible food reaches people in time — not landfills.

> Societal Project · Academic Year 2026–27 · Dept. of AI & ML,
> BMS Institute of Technology and Management, Yelahanka, Bengaluru.
> Guide: **Prof. Amitha S K** · Team: Pratyush Singh, Vedansh Singh, Anuneet Sharma, Abhijeet Shankar Pathak.

This is a **functional Phase 1 MVP** — the complete Donor → NGO → Volunteer → NGO-confirmation
workflow works end-to-end against a single shared data source, with a production-ready Flask +
MySQL backend included and ready to connect.

---

## ✨ Highlights
- **Premium SaaS design** — pastel gradients, glassmorphism, Plus Jakarta Sans + Inter,
  Framer Motion micro-interactions, fully responsive.
- **Four role-based dashboards** — Donor, NGO, Volunteer (mobile-first), Admin.
- **Real workflow, not a prototype** — every status change propagates to all dashboards.
- **Derived analytics** — all stats computed from actual records (Recharts).
- **API-ready architecture** — centralized service layer; swap mock → Flask with one env var.
- **Tested** — 32-assertion end-to-end workflow test (`npm run test:workflow`).

## 🧱 Tech stack
| Layer | Tech |
|-------|------|
| Frontend | React 18 (JSX), Vite, Tailwind CSS, React Router, Framer Motion, Lucide, Recharts, Axios |
| Backend | Python Flask, Flask-SQLAlchemy, JWT, Werkzeug hashing |
| Database | MySQL (PyMySQL) |
| Data (demo) | Centralized mock DB + service layer (localStorage, cross-tab synced) |

## 🚀 Quick start (frontend, demo mode)
```bash
npm install
npm run dev          # http://localhost:5173
```
No backend or database needed — demo data is seeded automatically.

**Demo accounts** (password `demo1234`), or use the one-click buttons on the login page:
| Role | Email |
|------|-------|
| Donor | donor@sharebite.demo |
| NGO | ngo@sharebite.demo |
| Volunteer | volunteer@sharebite.demo |
| Admin | admin@sharebite.demo |

### Try the full workflow
1. Log in as **Donor** → *New Donation* → publish surplus food.
2. Log in as **NGO** → *Browse Donations* → **Accept** it (a collection task is created).
3. Log in as **Volunteer** → **Accept Task** → **Confirm Pickup** → **Confirm Delivery**.
4. Log back in as **NGO** → *Accepted* → **Confirm Receipt** → status becomes **Completed**.
5. Every dashboard and history now reflects the completed donation.

> Use **Reset demo data** (sidebar) anytime to restore the original seed.

## 🔌 Connect the Flask backend
See [`backend/README.md`](backend/README.md). In short:
```bash
cd backend
pip install -r requirements.txt
copy .env.example .env      # edit DATABASE_URL + secrets
python seed.py && python app.py
```
Then in the project root `.env` set `VITE_API_MODE=flask` and restart `npm run dev`.
The frontend switches to the real API with **zero UI changes**.

## 🧪 Tests & build
```bash
npm run test:workflow   # end-to-end workflow assertions against the real service layer
npm run build           # production build (code-split)
npm run preview         # serve the production build
```

## 📁 Project structure
```
src/
  lib/            constants, utils, derived statistics
  data/           demo seed data
  services/       apiClient, mock db, auth/donation/task/user/notification services
  context/        Auth, Data (live shared store), Toast
  components/
    ui.jsx        design-system primitives
    layout/       navbar, footer, dashboard shell, protected routes
    donations/    DonationCard, DonationForm, StatusTimeline, DetailModal, TaskCard
  pages/
    public/       Landing, About, Impact, Login, Register
    donor/        Dashboard, NewDonation, MyDonations
    ngo/          Dashboard, BrowseDonations, AcceptedDonations
    volunteer/    Dashboard, History
    admin/        Dashboard, Users, Donations
backend/          Flask API (models, services, routes, schema.sql, seed)
tests/            end-to-end workflow test
```

## 🔄 Donation status pipeline
```
Pending → Accepted → Volunteer Assigned → Picked Up → Delivered → Completed
```
Plus **Rejected** (an NGO declines; stays visible to others) and **Cancelled** (donor withdraws).

## 🎯 Phase 1 scope
Implemented: registration/login, role-based access, donation CRUD, NGO acceptance, volunteer
collection workflow, NGO receipt confirmation, admin user/NGO management, derived analytics.

**Intentionally out of scope** (architecture is ready for them): AI/ML surplus prediction,
smart distance/urgency matching, live maps, advanced analytics.

## 🌍 SDG alignment
SDG 1 (No Poverty) · 2 (Zero Hunger) · 8 (Decent Work) · 12 (Responsible Consumption) · 13 (Climate Action).

---
*Demo data shown throughout the app is clearly labelled and illustrative.*