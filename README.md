# 🌾 FarmConnect NG

**Nigeria's direct farmer-to-buyer agricultural marketplace.**

FarmConnect NG connects Nigerian farmers straight to buyers — no middlemen. Farmers list
their produce, buyers search and compare, and both sides chat directly to agree a price and
arrange delivery.

Built with a **FastAPI** backend and a **React + Vite + Tailwind CSS + shadcn/ui** frontend,
using **SQLite** for storage so it runs anywhere with no external database.

---

## ✨ Features

### Farmers
- Secure registration and login
- Dashboard with earnings, products and order statistics
- Create, edit and delete produce listings (name, category, price, quantity, unit, location, image)
- Accept, process, ship and deliver orders
- Real-time chat with buyers
- Public storefront with ratings and reviews

### Buyers
- Dashboard with order overview and recommendations
- Search and filter the marketplace by keyword, category, state and price
- View farmer profiles, locations and ratings
- Place orders and track them from pending to delivered
- Message farmers directly
- Leave ratings and reviews on products

### Administrators
- Platform statistics dashboard (users, products, orders, messages, reports)
- Manage users: activate, deactivate or delete accounts
- Moderate listings: remove or restore inappropriate content
- Review and resolve user reports

### Platform
- Light / dark mode toggle
- Uploaded product images served from the API
- Admin accounts provisioned server-side only (not via public sign-up)

---

## 🛠️ Technology Stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Python 3, FastAPI, SQLModel (SQLAlchemy), Pydantic, PyJWT, bcrypt |
| Database  | SQLite (zero-config; easily swappable for PostgreSQL) |
| Frontend  | React 18, Vite, Tailwind CSS, shadcn/ui, Radix UI, Lucide icons |
| Realtime  | Native WebSockets (FastAPI) for chat |
| Maps      | Leaflet / react-leaflet (OpenStreetMap), Nigeria-centred |
| Charts    | Recharts (admin statistics) |

---

## 📁 Project Structure

```
FarmConnect/
├── .env                    # single environment file (gitignored)
├── .env.example            # template - copy to .env
├── start.sh                # start backend + frontend and open the browser
│
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── main.py         # app entry point, CORS, static uploads, routers
│   │   ├── schemas.py      # Pydantic request/response models
│   │   ├── core/           # config, database, security, admin bootstrap
│   │   ├── models/         # SQLModel database tables
│   │   ├── api/
│   │   │   ├── deps.py     # auth dependencies
│   │   │   └── routers/    # auth, users, products, orders, reviews,
│   │   │                   # chat, reports, dashboard, admin, uploads
│   │   └── utils/          # serialisation helpers
│   ├── uploads/            # uploaded product images (served at /uploads)
│   ├── seed.py             # optional sample data seeder
│   ├── create_admin.py     # provision an administrator from the server
│   └── requirements.txt
│
└── frontend/               # React + Vite application
    ├── src/
    │   ├── main.jsx        # providers (theme, auth, chat)
    │   ├── App.jsx         # routes
    │   ├── pages/          # landing, auth, farmer, buyer, admin, chat
    │   ├── components/     # UI + shared components
    │   │   └── ui/         # shadcn/ui primitives
    │   ├── context/        # auth, realtime chat, theme providers
    │   └── lib/            # API client, constants, utilities
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **Python** 3.10+

### 1. Configure the environment

The project uses a **single `.env` file at the root**, shared by the backend and the
frontend. Copy the template and adjust the values:

```bash
cp .env.example .env
```

Key variables: `SECRET_KEY`, `DATABASE_URL`, `FRONTEND_URL`, `VITE_API_URL`, and the
bootstrap admin settings (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, ...). Only `VITE_*`
variables are exposed to the browser.

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python seed.py                     # optional: load sample Nigerian data
python -m uvicorn app.main:app --reload --port 8000
```

The API runs at **http://localhost:8000** and interactive docs at
**http://localhost:8000/docs**.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

The Vite dev server proxies `/api` and `/uploads` to the backend on port 8000, so the two
run side by side with no CORS friction.

### Or start everything at once

From the project root:

```bash
./start.sh
```

This starts the backend and frontend, waits for the app to come up and opens the browser.
Press `Ctrl+C` to stop both.

---

## 👤 Administrator Accounts

Public sign-up can only create **farmer** or **buyer** accounts. Administrator accounts are
provisioned server-side:

- **Automatically on startup** — the backend creates the account defined by
  `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` in `.env` if it does not exist
  (existing accounts with that username are promoted to admin). This makes sure a fresh
  deployment always has a working admin.
- **Manually** — run the provisioning script:

```bash
cd backend
python create_admin.py --username admin --email you@example.com
python create_admin.py --username some_user --promote   # promote an existing account
```

---

## 📡 API Overview

Base URL: `/api`

| Group          | Endpoints |
|----------------|-----------|
| Auth           | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Users/Farmers  | `GET/PUT /users/me`, `GET /farmers`, `GET /farmers/{id}`, `GET /farmers/{id}/products`, `GET /farmers/{id}/reviews` |
| Products       | `GET /products`, `GET /products/mine`, `GET /products/{id}`, `GET /products/{id}/reviews`, `POST/PUT/DELETE /products` |
| Orders         | `POST /orders`, `GET /orders/mine`, `GET /orders/{id}`, `PATCH /orders/{id}/status`, `POST /orders/{id}/cancel` |
| Reviews        | `POST /reviews`, `GET /reviews/mine` |
| Messaging      | `GET/POST /conversations`, `GET /conversations/{id}/messages`, `POST /conversations/{id}/messages`, `PUT /conversations/{id}/read`, `WS /ws/chat` |
| Reports        | `POST /reports`, `GET /reports/mine` |
| Dashboards     | `GET /dashboard/farmer`, `GET /dashboard/buyer` |
| Administration | `GET /admin/stats`, `/admin/users`, `/admin/products`, `/admin/reports` |
| Uploads        | `POST /uploads` |

---

## 🗺️ Maps & Localisation

- The map is centred on Nigeria (`9.082, 8.6753`) and all location fields use the 36 states
  and the FCT.
- Prices are displayed in **Naira (₦)**.
- Phone numbers follow the Nigerian format.

---

## ☁️ Deployment Notes

- `.env` is gitignored — set its values as environment variables on your host
  (for example Render's dashboard).
- Mount a **persistent disk** for the SQLite database and the `backend/uploads/` directory,
  otherwise data and images reset on each deploy. The bootstrap admin is recreated on boot
  regardless.
- Set `FRONTEND_URL` to the deployed frontend origin (CORS) and `VITE_API_URL` to the
  deployed API base URL (e.g. `https://your-backend.onrender.com/api`).

---

## 📄 License

Released under the MIT License. See `LICENSE`.

---

Built for the Nigerian agricultural community. 🌱
