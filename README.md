# Unveil

Minimal landing page derived from the provided Figma node, with a static HTML/CSS/JS frontend and an Express + PostgreSQL waitlist backend.

## Stack

- Static frontend served from `public/`
- Express server in `server.js`
- PostgreSQL email storage via `pg`

## Setup

1. Install Node.js 18+.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the example environment file and set your database URL:

   ```bash
   cp .env.example .env
   ```

4. Start the app:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000`.

## Environment

- `PORT`: Express port. Defaults to `3000`.
- `DATABASE_URL`: PostgreSQL connection string used for waitlist inserts.

## Database

The server auto-creates the `waitlist_emails` table on boot when `DATABASE_URL` is configured.

If you want to create it manually instead, run:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```
