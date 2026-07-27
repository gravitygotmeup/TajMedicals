# Taj Medicals — Pharmacy Order Management

A full-stack web app for **Taj Medicals**, a neighborhood pharmacy in Nagpur. Customers can upload prescriptions, request medicines, track orders, and pick up at the counter. The owner/admin reviews, prices, and manages orders from a dashboard.

**Live:** [taj-medicals.vercel.app](https://taj-medicals.vercel.app)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19 + Vite) |
| Routing | [TanStack Router](https://tanstack.com/router) (file-based) |
| Styling | Tailwind CSS v4 + custom CSS variables |
| Database | Supabase (PostgreSQL) |
| Auth | Mock Clerk (localStorage-based, no real auth provider) |
| Email | Nodemailer via Gmail SMTP (server-side) |
| Storage | Supabase Storage (prescription images) |
| Hosting | Vercel (auto-deployed from GitHub `main`) |

---

## Project Structure

```
tajmedicals/
├── src/
│   ├── components/         # Shared UI components
│   │   ├── site-header.tsx      # Header with nav, theme toggle, mobile menu
│   │   ├── site-footer.tsx      # Footer with store info
│   │   ├── clerk-provider.tsx   # Mock Clerk auth (UserButton, useUser, etc.)
│   │   └── ui/                  # shadcn-style UI primitives (Button, Input, etc.)
│   ├── hooks/              # Custom React hooks
│   │   ├── use-theme.ts         # Dark/light mode toggle
│   │   ├── use-mobile.tsx       # Mobile detection
│   │   └── use-live-notifications.ts  # Admin polling for new orders
│   ├── integrations/       # Third-party configs
│   │   ├── supabase/client.ts        # Supabase client (browser)
│   │   └── supabase/client.server.ts # Supabase client (server, service_role)
│   ├── lib/                # Utilities
│   │   ├── email.server.ts   # Nodemailer email templates (server functions)
│   │   ├── email-client.ts   # EmailJS fallback (unused)
│   │   └── utils.ts          # Shared helpers (cn, etc.)
│   ├── routes/             # File-based routing
│   │   ├── __root.tsx       # App shell (providers, layout)
│   │   ├── index.tsx        # Landing page
│   │   ├── auth.tsx         # Login / Signup
│   │   └── _authenticated/  # Protected routes
│   │       ├── route.tsx         # Auth guard layout
│   │       ├── request-medicine.tsx  # Customer order form
│   │       ├── my-orders.tsx         # Customer order tracking
│   │       ├── payment.$orderId.tsx  # Payment / pickup info page
│   │       ├── admin.tsx             # Admin dashboard
│   │       └── account.tsx           # Profile page
│   ├── styles.css          # Global styles + dark mode overrides
│   ├── router.tsx          # Router config
│   ├── routeTree.gen.ts    # Auto-generated (don't edit)
│   └── server.ts           # TanStack Start server entry
├── supabase/
│   ├── config.toml         # Supabase project config
│   └── migrations/         # SQL migrations
│       ├── 20260715053725_*.sql   # User profiles table
│       ├── 20260715053744_*.sql   # Medicines & orders tables
│       ├── 20260715060000_*.sql   # Full schema with constraints
│       └── 20260724000000_*.sql   # Enable Realtime
├── .env                    # Local env vars (gitignored)
├── vercel.json             # Vercel build config
├── package.json
└── README.md
```

---

## How It Works

### Order Lifecycle

```
Customer places order
         │
         ▼
  [pending_review]
         │
    Admin reviews,
    sets prices,
    clicks "Confirm Pricing"
         │
         ▼
    [packaging]
         │
    Admin clicks
    "Mark Ready for Pickup"
         │
         ▼  ─── Email sent: "Your order is ready for pickup"
  [ready_for_pickup]
         │
    Customer comes to shop,
    pays at counter,
    shows pickup code
         │
    Admin clicks
    "Mark Picked Up"
         │
         ▼  ─── Email sent: "Thank you, visit again!"
  [completed]
```

### Emails Sent (3 total per order)

| Email | Trigger | Template |
|-------|---------|----------|
| Admin notification | Customer submits order | `sendAdminNewOrderEmail` |
| Customer: ready for pickup | Admin marks ready | `sendCustomerReadyForPickupEmail` |
| Customer: thank you | Admin marks picked up | `sendCustomerPickupCompletedEmail` |

### Auth (Mock Clerk)

No real Clerk account needed. Auth is simulated via **localStorage**.

| Credentials | Role |
|------------|------|
| `hellotajmedicals@gmail.com` / password: `admin123` | Admin |
| Any other email | Customer |

The role is auto-assigned based on email — only the admin email gets admin privileges.

### Payment

All payments happen **in person at the counter**. The payment page shows a QR code for reference but has **no online payment button**. When the admin marks an order as picked up, `payment_status` is automatically set to `paid`.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (secret) |
| `GMAIL_USER` | Gmail address for sending emails (`hellotajmedicals@gmail.com`) |
| `GMAIL_APP_PASSWORD` | Gmail app password (`ysrjcbiliajohjot`) |
| `APP_URL` | App URL for email links (`http://localhost:3000` local, `https://taj-medicals.vercel.app` prod) |
| `VITE_SUPABASE_URL` | Supabase URL exposed to client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key exposed to client |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID for client |

> **`.env` is gitignored.** Set these in Vercel dashboard for production.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy .env and fill in values (see .env.example or ask the owner)
cp .env.example .env

# 3. Start dev server
npm run dev
```

Runs at `http://localhost:3000`.

---

## Production (Vercel)

1. Push to GitHub `main` branch → auto-deploys to Vercel
2. In Vercel dashboard → Project Settings → Environment Variables, add **ALL** variables from `.env`
3. Ensure `NITRO_PRESET=vercel` is set
4. Framework preset: `Other` (vercel.json handles it)

---

## Database (Supabase)

**Project:** `vozrthlfemomghmiehid`  
**URL:** `https://vozrthlfemomghmiehid.supabase.co`

### Main Tables

**`orders`**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Customer's mock clerk user ID |
| `user_email` | TEXT | Customer email |
| `user_phone` | TEXT | Customer phone |
| `user_address` | TEXT | Customer address |
| `items` | JSONB | Array of `{name, quantity, price?, isCustom?}` |
| `prescription_url` | TEXT | Supabase Storage URL |
| `status` | TEXT | `pending_review` → `packaging` → `ready_for_pickup` → `completed` |
| `total_price` | NUMERIC | Total set by admin |
| `payment_status` | TEXT | `unpaid` or `paid` |
| `admin_notes` | TEXT | Pharmacist directions |
| `notes` | TEXT | Customer notes |
| `created_at` | TIMESTAMPTZ | Auto timestamp |

**`medicines`**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Medicine name |
| `description` | TEXT | Description |
| `price` | NUMERIC | Price |
| `stock` | INTEGER | Stock quantity |
| `category` | TEXT | Category |
| `created_at` | TIMESTAMPTZ | Auto timestamp |

### Realtime

The `orders` table has Realtime enabled — changes sync automatically across open browser tabs (admin sees new orders without refreshing).

### Storage

Bucket: `prescriptions` (public, for prescription image upload)

### Limits (Supabase Free Tier)

- **Database:** 500 MB (~500,000 orders)
- **Storage:** 1 GB (~2,000–5,000 images)
- **API:** 2 million requests/month

---

## Dark Mode

Toggle via the sun/moon icon in the header. Dark mode uses CSS custom properties defined in `src/styles.css` with comprehensive overrides for all emerald-themed colors.

---

## License

Private — Taj Medicals.
