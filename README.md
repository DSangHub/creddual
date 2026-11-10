# Creddual

Rewards platform for debit card users.

- repo root (`src/`, `public/`, `api/plaid/`) — React (CRA) + Tailwind app and Plaid serverless functions, deployed on Vercel
- `backend/` — Node.js + Express + Prisma API (PostgreSQL)

## Development

```bash
# backend (http://localhost:5000)
cd backend
cp .env.example .env        # then set DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm start

# frontend (http://localhost:3000, proxies /api to the backend)
npm install && npm start
```

## Backend API

| Prefix | Who | What |
| --- | --- | --- |
| `/api/auth` | public | `POST /register`, `POST /login`, `GET /me` |
| `/api/products` | public | `GET /`, `GET /categories`, `GET /:id` |
| `/api/consumers` | consumer | profile, link-debit, products, purchase, partner-banks, refer-bank |
| `/api/merchants` | merchant | dashboard, products (list/add/update), analytics/inventory |
| `/api/financial` | bank | dashboard, referrals (list/update), profile |
| `/api/rewards` | consumer | `GET /`, `GET /history`, `POST /claims/:id/redeem` |
| `/api/transactions` | consumer, merchant | `GET /`, `GET /:id` |
| `/api/health` | public | health check |
