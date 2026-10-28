# ShortStay

Direct bookings for shortlet apartments. No middleman fees. Prevents double bookings with automatic calendar blocking.

## Features
- Apartment listings with photos
- Interactive date picker (disabled for blocked dates)
- Book + test payment checkout (Stripe)
- House rules section
- Host calendar view
- Automated check-in instructions email on successful booking
- Calendar blocking for CONFIRMED bookings and unexpired PENDING holds

## Tech Stack
- [Astro](https://astro.build/) 5 + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/) + PostgreSQL
- [Auth.js](https://authjs.dev/) for authentication
- [Stripe](https://stripe.com/) (test mode)
- [Resend](https://resend.com/) for emails

## Getting Started
1. Copy `.env.example` to `.env` and fill in values
2. Install dependencies: `npm install` (or `pnpm install`)
3. Run migrations: `npx prisma migrate dev`
4. Start dev server: `npm run dev`

See `AGENTS.md` for detailed constraints and implementation notes.
