# EasyBuyCorner - Server

Basic TypeScript + Express + Mongoose starter for the EasyBuyCorner e-commerce backend.

Quick start

1. Copy `.env.example` to `.env` and set `MONGO_URI` if needed.
2. Install deps:

```bash
npm install
```

3. Run in development (hot reload):

```bash
npm run dev
```

4. Build and run production:

```bash
npm run build
npm start
```

API routes

- `GET /api/products` — list products
- `POST /api/products` — create product (JSON body: `name`, `description`, `price`)
