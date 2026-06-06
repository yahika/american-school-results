# 🏫 American School Results Portal — Setup Guide

## Prerequisites
- Node.js v18+ (download from nodejs.org)
- npm (comes with Node.js)

---

## Quick Start (Local Development)

### 1. Open the project folder in your terminal

```bash
cd american-school-results
```

### 2. Install dependencies (takes 1–2 minutes)

```bash
npm install
```

### 3. Set up the database

```bash
npm run db:generate   # generates Prisma client
npm run db:push       # creates the SQLite database
npm run db:seed       # inserts test data + admin account
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the portal is live!

---

## Default Login Credentials

| Role  | URL               | Username | Password     |
|-------|-------------------|----------|--------------|
| Admin | /admin/login      | admin    | Admin@2024!  |

**⚠️ Change the admin password after first login!**

```bash
npm run setup:admin
```

---

## Sample Test Students

| رقم الجلوس | الاسم              | تاريخ الميلاد |
|------------|----------------------|---------------|
| 1001       | أحمد محمد حسن       | 2007-05-15    |
| 1002       | سارة أحمد المصري    | 2007-09-23    |
| 1003       | محمد خالد الرشيدي   | 2006-03-10    |
| 1004       | فاطمة علي الزهراني  | 2008-01-07    |
| 1005       | عمر يوسف الخالدي    | 2005-11-30    |
| 1006       | نورة عبدالله السالم | 2009-06-18    |

---

## How to Upload Results (Admin)

1. Log in at `/admin/login`
2. Click **تحميل نموذج Excel** / **Download Excel Template** to get the format
3. Fill in the Excel sheet with student results
4. Drag the file into the upload area
5. Fill in semester info (name, year, term)
6. Preview the data — verify it looks correct
7. Click **حفظ** / **Save** → then **نشر** / **Publish**
8. Students can now search immediately

### Excel Format

| A | B | C | D | E | F | G… |
|---|---|---|---|---|---|----|
| رقم الجلوس | الاسم عربي | الاسم إنجليزي | الصف عربي | الصف إنجليزي | تاريخ الميلاد (YYYY-MM-DD) | أسماء المواد (درجة من 100) |

---

## Deployment on Vercel (Free Tier)

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/american-school-results.git
git push -u origin main
```

### Step 2 — Create a Postgres database

Go to [supabase.com](https://supabase.com) (free tier) or [neon.tech](https://neon.tech) (free tier):
- Create a new project
- Copy the **Connection String** (starts with `postgresql://`)

### Step 3 — Update Prisma for Postgres

In `prisma/schema.prisma`, change:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```
to:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")     # Supabase only
}
```

### Step 4 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
2. Set these **Environment Variables** in Vercel:

   | Variable       | Value                              |
   |----------------|------------------------------------|
   | `DATABASE_URL` | `postgresql://...` (your Postgres) |
   | `JWT_SECRET`   | A long random string (32+ chars)   |

   Generate a strong secret:
   ```bash
   openssl rand -base64 32
   ```

3. Click **Deploy** — Vercel builds and deploys automatically

### Step 5 — Initialize the production database

After first deploy, run the seed remotely:
```bash
npx prisma migrate deploy
npx vercel env pull .env.production.local
DATABASE_URL=your_postgres_url npm run db:seed
```

Or use the Supabase SQL editor to run Prisma migrations.

---

## Security Notes

- All admin passwords are stored with **bcrypt** (cost factor 12) — never in plaintext
- Session tokens use **JWT** (HS256) stored in **httpOnly cookies** — not accessible from JavaScript
- Name searches require **date of birth verification** — no student can see another student's result
- The `.env` file is in `.gitignore` — never commit it to GitHub
- Change `JWT_SECRET` to a strong random value in production

---

## Customization

| What to change         | Where                           |
|------------------------|---------------------------------|
| School name & logo     | `app/page.tsx` (hero section)   |
| Colors                 | `app/globals.css` (`:root`)     |
| Pass/fail threshold    | `lib/auth.ts` → `computeResultStats` |
| Grade letters          | `lib/auth.ts` → `calcLetterGrade` |
| Add subjects in seed   | `prisma/seed.ts`                |
