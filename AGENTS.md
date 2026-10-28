# AGENTS.md

## Project
- **Name:** ShortStay — hospitality webapp for shortlet apartment owners
- **Goal:** Direct bookings with no middleman fees. Eliminate messy Instagram booking management and prevent double bookings.
- **Users:** Guests and Hosts

## Critical Constraints (Must Not Break)
- **Calendar Blocking:** CONFIRMED bookings and unexpired PENDING holds must block dates. Overlap checks must run inside a database transaction to prevent race conditions.
- **Date Handling:** Use date-only values for `checkIn`/`checkOut`. Compute nights as `checkOut - checkIn`. Standard overlap: `A_start < B_end AND A_end > B_start`.
- **Payments:** Stripe in **test mode only** for MVP. Never trust client redirects for confirmation — rely on Stripe webhooks.
- **Automation:** On successful payment confirmation, automatically send the guest an email containing their checkInInstructions.
- **Required Models:** `Apartments`, `Bookings`, and `Payments` must be persisted.
- **House Rules:** Must be displayed on the apartment detail page before booking.

## Planned Tech Stack (Source of Truth For Scaffolding)
| Layer | Choice | Notes |
| :-- | :-- | :-- |
| Frontend | Next.js 15 (App Router, TypeScript) + Tailwind CSS + shadcn/ui | Monolith preferred for MVP |
| State/Data Fetching | TanStack Query + Zustand | Server state vs client state split |
| Forms/Validation | React Hook Form + Zod | For checkout, listing creation, auth |
| Date/Calendar | react-day-picker (guest), FullCalendar (host) | Guest picker must disable blocked dates |
| Auth | Auth.js (NextAuth) | Role-based (GUEST/HOST) |
| ORM/DB | Prisma + PostgreSQL (Neon/Supabase/Railway) | Relational required for integrity |
| Storage | Cloudinary or Vercel Blob | Apartment photos |
| Email | Resend | Transactional check-in instructions |
| Payments | Stripe Checkout (test) | Webhook driven confirmation |
| Hosting/Jobs | Vercel + Vercel Cron or QStash | For hold expiration |

## Suggested App Structure (When Scaffolding)
```
src/
├── app/
│   ├── (auth)/
│   ├── (guest)/listings/[slug]/, my-bookings/
│   ├── (host)/dashboard/, listings/, calendar/
│   └── api/bookings/, checkout/, webhooks/stripe/
├── components/ (ui/, calendar/, date-picker/, forms/)
├── lib/ (prisma.ts, auth.ts, stripe.ts, utils.ts)
├── services/ (availability.ts, bookings.ts, emails.ts)
└── prisma/schema.prisma
```

## Key Gotchas
- **Holds:** Create PENDING bookings with `holdExpiresAt` (e.g +10 min). Expired holds must be freed by a cron job.
- **Snapshots:** Store `pricePerNightSnapshot`, guest details, and `currency` on `Booking` (pricing/guest info can change).
- **Webhooks:** Must be idempotent. Check existing confirmed booking before processing. Verify Stripe signatures.
- **Authorization:** Hosts can only access their own apartments/bookings. All host routes/APIs must enforce ownership (check `apartment.hostId`).
- **Availability Source of Truth:** Blocked dates = CONFIRMED bookings OR (PENDING with `holdExpiresAt > now()`). Always re-validate on the server.
- **Photos:** Set a cover photo, support ordering. Only `ACTIVE` apartments should be visible to guests.

## Commands (To Be Defined)
When `package.json` is created, record the exact commands here (dev, build, lint, typecheck, prisma migrate/generate, test). Prefer `lint -> typecheck -> test` if a verification order is added. For now, none are verifiable in this empty repo.