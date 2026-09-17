# Build.md — Roadmap & Future Features

This document tracks features that are **planned** but intentionally deferred from the
current release. Version 1.0 focuses on the core marketplace: authentication, product
listings, orders, real-time messaging, reviews and the three role dashboards.

Deferred items are grouped below with enough detail to be implemented later.

---

## 1. Order OTP Verification

**Goal:** Prevent fake or accidental orders by requiring the buyer to confirm an
order with a one-time password sent by email/SMS.

**Planned approach**
- Generate a 4–6 digit OTP when an order is created.
- Store only a hash of the OTP on the order record.
- Send the OTP to the buyer's email (SMTP) and/or phone (SMS gateway such as
  Termii or Africa's Talking — Nigerian providers).
- Add `POST /api/orders/{id}/verify-otp`; deduct reserved stock only after a
  successful verification.
- Add an OTP entry step in the buyer order flow.

**Backend touchpoints:** `models/order.py`, `api/routers/orders.py`, new
`services/notifications.py`, env vars `SMTP_*` / `SMS_API_KEY`.

---

## 2. Payments (Nigeria)

**Goal:** Allow buyers to pay online and farmers to receive settlements.

**Planned approach**
- Integrate **Paystack** and/or **Flutterwave** (both support Naira, cards,
  bank transfer and USSD).
- Backend: `models/payment.py`, `api/routers/payments.py`, webhook endpoint with
  signature verification.
- Payment statuses: `pending`, `paid`, `failed`, `refunded`.
- Buyer flow: choose *Pay online* or *Cash on delivery*.
- Farmer wallet/settlement view.

**Notes:** Keep all secret keys in `.env`; never commit them. Add a sandbox mode
for demos.

---

## 3. Delivery Route Optimisation

**Goal:** Help farmers delivering multiple orders in one trip visit stops in the
most efficient order.

**Planned approach**
- Use the **Nearest Neighbour** heuristic over **Haversine** distances from a
  chosen start point.
- Persist a delivery sequence per order batch and expose it on the farmer’s
  order page with map links.
- Endpoint: `POST /api/optimize/routes`.
- Show estimated distance and travel time.

**Why deferred:** requires reliable GPS coordinates on orders and buyers, which
we are rolling out gradually (the location picker is already in place).

---

## 4. AI Farm Assistant

**Goal:** A chat assistant that helps farmers write listings and answer simple
questions in English, Nigerian Pidgin, Yoruba, Hausa and Igbo.

**Planned approach**
- Add an `ai` module backed by an LLM (e.g. Groq or OpenAI) with function calling
  over the existing product endpoints.
- Support voice input (speech-to-text) and image upload for produce photos.
- Language toggle in the UI.

**Why deferred:** needs an external API key and adds operational cost.

---

## 5. Notifications

- In-app notification centre (order updates, new messages, reviews).
- Email notifications for order status changes.
- SMS for critical events.

**Planned approach:** a `notifications` table plus a small delivery worker; the
WebSocket channel can push in-app notifications live.

---

## 6. Logistics & Delivery Tracking

- Delivery addresses with saved bookmarks.
- Live order tracking map (farm → buyer).
- Ability to assign a driver/partner.

---

## 7. Trust, Safety & Verification

- Farmer identity/business verification (BVN or ID upload) with an admin review
  queue.
- Badges for verified farmers.
- Advanced moderation: keyword/auto-flagging, audit log of admin actions.

---

## 8. Analytics & Reporting

- Farmer sales analytics over time (charts, best-selling produce).
- Admin exportable reports (CSV/PDF) of users, orders and transactions.
- Regional demand insights for farmers (what is in demand in which states).

---

## 9. Platform & Engineering

- **PostgreSQL** migration path (already abstracted through SQLModel).
- **Alembic** database migrations.
- **Docker** and CI/CD pipelines.
- Automated tests (pytest for the API, Vitest/React Testing Library for the UI).
- Rate limiting and refresh-token authentication.
- Full-text search improvements (e.g. SQLite FTS5 or Postgres `tsvector`).

---

## 10. Nice-to-haves

- Multi-image galleries per product.
- Bulk upload for farmers.
- Wishlist / saved products for buyers.
- Ratings on delivery speed and communication.
- Progressive Web App (PWA) support for low-bandwidth users.
- Offline-friendly caching.

---

_Last updated: version 1.0._
