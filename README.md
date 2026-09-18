# Love e Birds

A Next.js dating/social app with wallet, gifts, chat, verification, admin panel, and an **Activities** (game/lottery) module.

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- **DB:** PostgreSQL via Prisma 7 (`@prisma/adapter-pg`)
- **Auth:** NextAuth v4 (credentials, JWT sessions)
- **Styling:** Tailwind CSS 4
- **Icons:** lucide-react
- **Validation:** zod

## Setup

```bash
npm install
```

Create a `.env` in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/love_e_birds"
NEXTAUTH_SECRET="a-long-random-string"
NEXTAUTH_URL="http://localhost:3000"
```

## Database (Prisma)

```bash
npm run db:generate   # generate the Prisma client (output: src/generated/prisma)
npm run db:push       # push schema to the database (no migration files)
npm run db:migrate    # create/apply a dev migration (alternative to db:push)
npm run db:seed       # seed demo data
npm run db:studio     # open Prisma Studio
```

The Prisma schema is in `prisma/schema.prisma`. The generated client lives in `src/generated/prisma` and is imported via `@/generated/prisma/client`. The shared client is `@/lib/prisma`.

## Seed

```bash
npm run db:seed
```

Idempotent demo data: location categories, interests, admin user, 15 demo users, matches, banners, announcements, gifts, **one "Airborne activities" activity with 8 products**, plus demo chat/gift/report/verification/withdrawal/notification content.

**Demo logins**
- User: `aisha@example.com` / `password123`
- Admin: `admin@example.com` / `admin123`

## Development

```bash
npm run dev
```

Open http://localhost:3000. Quality gates:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # production build
```

## Production

```bash
npm run build
npm start
```

## App structure

- `src/app/(main)/` — authenticated app pages wrapped in `MobileLayout` (header + bottom nav, max width ~565px).
- `src/app/(auth)/` — login/register.
- `src/app/activities/` — **Activities module** (standalone mobile layout, no dating-app chrome).
- `src/app/admin/` — admin panel (`requireAdmin`, own shell).
- `src/app/api/` — REST route handlers.
- `src/actions/` — server actions (`"use server"`).
- `src/components/` — shared UI.
- `src/lib/` — prisma, auth, helpers.

## Activities module

An authenticated game/lottery feature.

### User pages
- `GET /activities/[activityId]` (e.g. `/activities/airborne-activities`) — activity page: gradient header, real countdown, status badge (UPCOMING / ACTIVE / ENDING / ENDED), 2-column product grid, "More Products" right drawer, selection panel (current selection, quantity selector, total, ticket), confirm-participation modal, rules modal, hamburger menu.
- `GET /activities/history` — paginated participation history.

Entry points: a tile in the **Mine** dashboard menu and a **Home** banner (both link to `/activities/airborne-activities`).

### How participation works
1. User selects a product + quantity (selection is persisted in `ProductSelection`).
2. `totalCost = product.ticketCost × quantity` — **always computed on the server** from the DB product price; client values are never trusted.
3. On confirm, `participate` (server action) validates: auth, activity `active`, `startAt <= now < endAt`, product active, `quantity <= maxQuantity`, one participation per activity per user, sufficient wallet balance.
4. A PostgreSQL transaction then: decrements the wallet, creates a `WalletTransaction` (`ACTIVITY_ENTRY`), creates an `ActivityParticipation` (CONFIRMED), writes an `ActivityHistory` row, and clears the selection. Balance can never go negative (checked before the transaction).

### REST API
All require an authenticated session. Base: `/api`.

| Method & path | Description |
| --- | --- |
| `GET /api/activities` | List active activities |
| `GET /api/activities/:id` | One activity (id or slug) with computed status |
| `GET /api/activities/:id/products` | Products in an activity |
| `POST /api/activities/:id/select` | Save selection `{ productId, quantity }` |
| `PATCH /api/activities/:id/selection` | Update selection quantity `{ quantity }` |
| `POST /api/activities/:id/participate` | Confirm participation `{ productId, quantity }` |
| `GET /api/activities/history?page=&pageSize=` | My participation history |
| `GET /api/wallet` | My wallet (balance, frozen, totals, points) |
| `GET /api/wallet/transactions?page=&pageSize=` | My wallet transactions |

Admin APIs are handled via server actions (see below), not public REST endpoints.

### Data models (Prisma)
`Activity`, `Product`, `ProductCategory`, `ActivityProduct` (join with `displayOrder`/`isFeatured`), `ActivityParticipation`, `ProductSelection` (per user+activity), `ActivityHistory`, plus existing `Wallet` / `WalletTransaction` / `User`.

## Admin panel

Located at `/admin` (requires an ADMIN user). Sections: Dashboard, Reports, Verifications, Withdrawals, Recharges, Users, Gifts, **Activities**, **Products**, Announcements.

- **Activities** (`/admin/activities`): create/edit/deactivate, set title, slug, start/end (UTC), max quantity. Server action: `saveActivity` in `src/actions/activities-admin.ts`.
- **Products** (`/admin/products`): create/edit/activate products, set ticket cost, image, description, category; add product categories. Server actions: `saveProduct`, `saveCategory`, `addProductToActivity`, `removeProductFromActivity` in `src/actions/products-admin.ts`.

Admin mutations re-check authorization and write an `AdminAction` audit row.

## Auth

Credentials-based NextAuth (JWT). Protected pages call `getServerSession(authOptions)` and redirect to `/login` when unauthenticated. Admin routes additionally verify `role === "ADMIN"`.

## Notes

- Product images use `picsum.photos` placeholders during development; replace with real assets / the `/api/upload` endpoint for production.
- The countdown is client-side for display, but the server independently validates `endAt` on every participation, so an expired activity cannot be joined even with a stale client.
