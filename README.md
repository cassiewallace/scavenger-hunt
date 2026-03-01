# VNTRbirds Venture Out — Scavenger Hunt App

Mobile-first scavenger hunt submission app for the **[VNTRbirds Venture Out](https://www.vntrbirds.com) Femme Backcountry Festival** · Salida, CO.

Built with Vite + React + Tailwind CSS · Supabase backend · Firebase Hosting.

---

## App Overview

| Route | Description |
|-------|-------------|
| `/` | Home hub — brand logo, Submit a Find, Add a Team, live leaderboard |
| `/register` | Team registration or session resume on a new device |
| `/hunt` | Team hunt dashboard — browse and submit items |
| `/leaderboard` | Full-page public live leaderboard |
| `/admin` | Admin view (passphrase-protected) |

Teams register by entering a name. The same team name on any device resumes the session. Two teammates can join the same team by using the same name.

---

## Brand Image Setup

The app references `/logo.png` from the `public/` directory (`public/logo.png`).
Recommended: PNG, at least 600×600 px.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in values
cp .env.example .env.local

# 3. Start dev server (http://localhost:5173)
npm run dev
```

---

## Step 1 — Supabase Setup

### 1.1 Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a region close to your event location (e.g., US West)
3. Note your **Project URL** and **anon/public API key** from:
   **Settings → API → Project URL & anon key**

### 1.2 Create tables

Open the **SQL Editor** in Supabase and run:

```sql
-- Teams
create table teams (
  id uuid primary key default gen_random_uuid(),
  team_name text not null unique,
  created_at timestamptz default now()
);

-- App settings
create table app_settings (
  key text primary key,
  value text not null
);

-- Seed: submissions open by default
insert into app_settings (key, value) values ('submissions_open', 'true');

-- Submissions
create table submissions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id),
  item_id text not null,
  item_label text not null,
  points integer not null,
  item_type text not null,
  ig_post_url text,
  file_path text,
  created_at timestamptz default now(),
  unique (team_id, item_id)
);
```

### 1.3 Create Storage bucket

1. Dashboard → **Storage** → **New bucket**
2. Name: `hunt-submissions`
3. Toggle **Public bucket** on ✓ → **Create bucket**
4. Go to **Storage → Policies → hunt-submissions** and run:

```sql
-- Allow anyone to upload
create policy "Public inserts"
on storage.objects for insert
with check (bucket_id = 'hunt-submissions');

-- Allow public reads (thumbnails, admin previews)
create policy "Public reads"
on storage.objects for select
using (bucket_id = 'hunt-submissions');
```

### 1.4 Enable Realtime

1. Dashboard → **Database → Replication**
2. Enable Realtime for both `submissions` ✓ and `app_settings` ✓

### 1.5 Set environment variables

Fill in `.env.local` (copy from `.env.example`):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ADMIN_PASSPHRASE=choose-something-secure
```

---

## Step 2 — Firebase Hosting Setup

### 2.1 Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g., `vntrbirds-hunt`)
3. Disable Google Analytics (not needed) → **Create project**
4. Note your **Project ID** (shown on the project overview page)

### 2.2 Update `.firebaserc`

Replace `vntrbirds-scavenger-hunt` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-firebase-project-id"
  }
}
```

### 2.3 Deploy

```bash
# Install Firebase CLI (once)
npm install -g firebase-tools

# Login
firebase login

# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

Your app will be live at: **`https://your-project-id.web.app`**

### 2.4 Optional: Custom domain

1. Firebase console → **Hosting → Add custom domain**
2. Enter your domain (e.g., `hunt.vntrbirds.com`)
3. Follow the DNS verification steps — SSL is auto-provisioned within ~24 hours

---

## Step 3 — QR Code

1. Go to [qr-code-generator.com](https://www.qr-code-generator.com) or [goqr.me](https://goqr.me)
2. Paste your Firebase URL: `https://your-project-id.web.app`
3. Download as PNG or SVG (at least 500×500 px for print)
4. Print and post at the Scout Hut / event HQ

---

## Brand Colors

All colors are defined in `src/constants/brand.js` with documented WCAG contrast ratios.
To retheme, edit that file only — `tailwind.config.js` imports from it automatically.

| Token | Hex | Usage | Contrast on bg |
|-------|-----|-------|----------------|
| `bg` | `#0f0f0f` | Page background | — |
| `surface` | `#1c1c1c` | Cards, headers | — |
| `magenta` | `#b030ba` | Primary CTA buttons (white text) | 5.3:1 ✓ AA |
| `teal` | `#26c4bc` | Secondary CTA, scores (dark text) | 9.4:1 ✓ AAA |
| `blue` | `#4b8fd4` | Links, admin accents | 5.8:1 ✓ AA |
| `lavender` | `#9b85d0` | Decorative | 4.9:1 ✓ AA |

---

## Updating Hunt Items

Edit `src/items.js` — the single source of truth for all hunt items:

```js
{ id: "unique_id", label: "Display label", points: 10, item_type: "standard" }
// item_type: "standard" | "sponsor"
```

---

## TODO Checklist

- [x] Save brand logo to `public/logo.png`
- [x] Create Supabase project → run SQL → enable Realtime
- [x] Fill in `.env.local` with Supabase URL, anon key, admin passphrase
- [x] Create Firebase project → update `.firebaserc` project ID
- [x] Run `npm run build && firebase deploy`
- [ ] Generate and print QR code for the event
- [x] Confirm sponsor item point values (30 pts each)
- [x] Review `src/items.js` for any last-minute changes
