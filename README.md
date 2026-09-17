# 🌾 FarmConnect NG

**Nigeria's direct farmer-to-buyer agricultural marketplace.**

FarmConnect NG connects Nigerian farmers straight to buyers — no middlemen. Farmers list
their produce, buyers search and compare, and both sides chat directly to agree a price and
arrange delivery.

This is a final year project built with a **FastAPI** backend and a **React + Vite +
Tailwind CSS + shadcn/ui** frontend, using **SQLite** for storage so it runs anywhere with no
external database.

---

## ✨ Features

### Farmers
- Secure registration and login
- Farmer dashboard with earnings, products and order statistics
- Create, edit and delete produce listings (name, category, price, quantity, unit, location, image)
- Accept, process, ship and deliver orders
- Real-time chat with buyers
- Public storefront with ratings and reviews

### Buyers
- Buyer dashboard with order overview and recommendations
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
AgriDirect/
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── main.py              # App entry point & router wiring
│   │   ├── schemas.py           # Pydantic request/response models
│   │   ├── core/                # Config, database, security (JWT, bcrypt)
│   │   ├── models/              # SQLModel database tables
│   │   ├── api/
│   │   │   ├── deps.py          # Auth dependencies
│   │   │   └── routers/         # auth, users, products, orders, reviews,
│   │   │                        # chat, reports, dashboard, admin, uploads
│   │   └── utils/               # Serialisation helpers
│   ├── uploads/                 # Uploaded product images
│   ├── seed.py                  # Nigerian sample data seeder
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                    # React + Vite application
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx              # Routes
│   │   ├── pages/               # Landing, auth, farmer, buyer, admin, chat
│   │   ├── components/          # UI + shared components
│   │   │   └── ui/              # shadcn/ui primitives
│   │   ├── context/             # Auth & realtime chat providers
│   │   └── lib/                 # API client, constants, utilities
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env.example
│
├── Build.md                     # Roadmap / future features
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **Python** 3.10+

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # then edit SECRET_KEY etc.

python seed.py                     # optional: load sample Nigerian data
uvicorn app.main:app --reload --port 8000
```

The API runs at **http://localhost:8000** and interactive docs at
**http://localhost:8000/docs**.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env               # optional; defaults work with the dev proxy
npm run dev
```

Open **http://localhost:5173**.

The Vite dev server proxies `/api` and `/uploads` to the backend on port 8000, so the two
run side by side with no CORS friction.

---

## 👤 Demo Accounts

After running `python seed.py`:

| Role   | Username       | Password      |
|--------|----------------|---------------|
| Admin  | `admin`        | `Admin@123`   |
| Farmer | `musa_farms`   | `password123` |
| Buyer  | `chinedu_buys` | `password123` |

> Public sign-up only creates **farmer** or **buyer** accounts. Administrator accounts are
> provisioned server-side with `python create_admin.py` (see `backend/create_admin.py`).

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

## 📄 License

Released under the MIT License. See `LICENSE`.

---

Built for the Nigerian agricultural community. 🌱
