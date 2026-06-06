# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack store/POS management system with React frontend and FastAPI backend. Supports multi-currency (GNF base currency, plus USD and EUR), inventory tracking, order management, customer/supplier management, and printable invoices/reports.

## Commands

### Frontend (`/frontend`)
```bash
yarn start        # Dev server at http://localhost:3000
yarn build        # Production build
yarn test         # Run tests (Jest via craco)
yarn test --testNamePattern="<pattern>"  # Run a single test
```

### Backend (`/backend`)
```bash
# Start the server
python server.py  # Uvicorn runs on port 8000

# Code quality
black server.py
isort server.py
flake8 server.py
mypy server.py

# Tests
pytest                                           # All tests
pytest backend_test.py::TestClass::test_method -v  # Single test
```

### Environment Variables
**Frontend** (`.env` in `/frontend`):
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

**Backend** (`.env` in `/backend`):
```
MONGO_URL=<mongodb connection string>
DB_NAME=<database name>
CORS_ORIGINS=http://localhost:3000   # optional, defaults to '*'
```

## Architecture

### Frontend (`/frontend/src`)

**Single-page app** with sidebar navigation. `index.js` → `App.js` sets up `BrowserRouter` with `CurrencyProvider` wrapping all routes.

Routes map 1:1 to large feature components in `/components/`:
- `/` → Dashboard (stats, recent orders)
- `/pos` → `POSSystem` (cart, barcode scanning, checkout)
- `/products` → `ProductsManagement`
- `/orders` → `OrdersManagement`
- `/customers` → `CustomersManagement`
- `/suppliers` → `SuppliersManagement`
- `/stock` → `StockManagement`

Each `*Management` component is self-contained — it owns its local state, fetches its own data via Axios, and renders its own forms/modals. There is no shared data layer (no Redux/Zustand/React Query).

**Global state**: Only `CurrencyContext` (`/components/CurrencyContext.js`) is global. It stores the selected currency, exchange rates (fetched from `/api/currency/settings`), and exposes `convertCurrencyLocal()`. Always wrap currency display in `<CurrencyAmount>` rather than formatting manually.

**`/components/ui/`**: Radix UI component library (50+ components). Use these for all new UI — do not introduce a new component library.

**Path alias**: `@/` resolves to `frontend/src/` (configured in `craco.config.js` and `jsconfig.json`).

**Print support**: `PrintableInvoice.js` and `PrintableReport.js` render into a hidden DOM node and use `window.print()`. The print stylesheet is at `/styles/print.css`.

### Backend (`/backend/server.py`)

Single-file FastAPI app (~826 lines). All entities, models, and endpoints live here.

**Data flow**: HTTP request → Pydantic model validation → async Motor MongoDB operation → Pydantic model response → JSON.

**MongoDB collections** (auto-created on first write):
- `suppliers`, `categories`, `products`, `customers`, `orders`, `stock_movements`, `currency_settings`

**Entity relationships**:
- `Product` references `supplier_id` (ObjectId → Supplier) and `category_id` (ObjectId → Category)
- `Order` contains embedded `OrderItem[]` with `product_id` references
- `StockMovement` references `product_id` and optionally `reference_id` (e.g., order ID)

**All prices are stored in GNF** (base currency). Currency conversion is client-side only.

**Key enums**:
- `OrderStatus`: `PENDING | PROCESSING | COMPLETED | CANCELLED`
- `PaymentStatus`: `PENDING | COMPLETED | FAILED`
- Stock movement types: `"in" | "out" | "adjustment"` (plain strings, not an enum)

**API router** is mounted at `/api` prefix. All endpoints must be registered on the `router` object, not directly on `app`.

## Key Conventions

- **Barcode lookup** is a primary POS flow: `GET /api/products/barcode/{barcode}` — any product field changes must keep barcode queryable.
- **`total_purchases`** on `Customer` is denormalized and updated in-place when an order is completed; it is not computed on the fly.
- **Stock is decremented automatically** when an order moves to `COMPLETED` status — avoid double-decrementing by checking order status transitions carefully.
- **Low-stock threshold** is per-product (`min_stock_level` field). `GET /api/stock/low` returns products where `stock_quantity <= min_stock_level`.
- Frontend uses `process.env.REACT_APP_BACKEND_URL` for all API calls — never hardcode a URL.
