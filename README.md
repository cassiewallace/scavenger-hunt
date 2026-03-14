# VNTRbirds Venture Out — Scavenger Hunt App

Mobile-first scavenger hunt submission app for the **[VNTRbirds Venture Out](https://www.vntrbirds.com) Femme Backcountry Festival** · Salida, CO.

Built with **Vite + React + Tailwind CSS**, **Supabase** backend, and **Firebase Hosting** with GitHub Actions CI/CD.

---

## What This Is

Teams of backcountry skiers and splitboarders compete to photograph items on a scavenger hunt list during the festival. This app handles:

- **Team registration** — create or join a team by name; session persists in localStorage so any device can resume
- **Hunt list** — browse all items, search by keyword, filter to incomplete items; auto-sorted (sponsor items first, then by point value descending)
- **Photo/video submission** — tap the camera button on any item to upload media; duplicate submissions are prevented at the database level
- **Live leaderboard** — real-time Supabase Realtime subscription; updates on every submission across all devices
- **Admin panel** — passphrase-protected; toggle submissions open/closed; download all submissions as a ZIP or individual files per item

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing — logo, CTA button, live leaderboard |
| `/register` | Create a new team or join an existing one |
| `/hunt` | Team hunt dashboard — browse, search, and submit items |
| `/admin` | Admin panel (passphrase-protected) |

The `/register` page has two tabs: **Create a team** (enters a new team name) and **Join a team** (shows teams with fewer than 2 members). Once registered, a session is stored in `localStorage` and the user is sent directly to `/hunt`.

---

## Item Types

Items are defined in `src/items.js` — the single source of truth. Edit this file to change labels, points, or add/remove items before the event.

```js
{ id: "unique_id", label: "Display label", points: 10, item_type: "standard" }
// item_type: "standard" | "sponsor"
```

- **`standard`** — regular hunt items, sorted by point value on the hunt list
- **`sponsor`** — sponsor spotlight items, shown first with a distinct white card style, magenta left border, and the sponsor's logo

Sponsor logos live in `public/sponsors/<filename>.png` and are mapped in `src/constants/sponsorLogos.js`:

```js
sponsor_karitraa: { file: 'kari-traa.png', lightBg: true }
// lightBg: true  — logo renders directly on the white sponsor card
// lightBg: false — logo gets a dark pill background (for white/light logos)
```

---

## UI Notes

- **Hunt header** — team name on the left, feather count on the right; back button returns to the leaderboard
- **Item cards** — left slot contains the camera button (or submission thumbnail) with the points badge below it; badge turns green with a checkmark once submitted
- **Sponsor cards** — white background, magenta left border, sponsor logo above the item description
- **UploadFlow** — expands inline below the item; accepts photo or video up to 50 MB; shows upload progress; sponsor card variant uses dark-on-light colors for contrast
- **CTA buttons** — white background, black border, black text throughout

---

## Brand Colors

All tokens are defined in `src/constants/brand.js`. Tailwind picks them up via `tailwind.config.js`.

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#0f0f0f` | Page background |
| `surface` | `#1c1c1c` | Cards, headers |
| `teal` | `#26c4bc` | Scores, badges, focus rings |
| `magenta` | `#b030ba` | Sponsor card accents |
| `success` | green | Found item badge |
| `error` | red | Validation messages |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in values
cp .env.example .env.local

# 3. Start dev server
npm run dev
# → http://localhost:5173
```

---

## Supabase Setup

### 1. Create a project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a region close to your event
3. Copy your **Project URL** and **anon key** from **Settings → API**

### 2. Create tables

Run in the **SQL Editor**:

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

### 3. Storage bucket

1. Dashboard → **Storage → New bucket**
2. Name: `hunt-submissions`, toggle **Public** on
3. Add storage policies:

```sql
create policy "Public inserts"
on storage.objects for insert
with check (bucket_id = 'hunt-submissions');

create policy "Public reads"
on storage.objects for select
using (bucket_id = 'hunt-submissions');
```

### 4. Enable Realtime

Dashboard → **Database → Replication** → enable for `submissions` and `app_settings`.

### 5. Environment variables

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ADMIN_PASSPHRASE=choose-something-secure
```

---

## Firebase Hosting Setup

### 1. Create a Firebase project

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Disable Google Analytics → **Create project**
3. Note your **Project ID**

### 2. Update `.firebaserc`

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### 3. GitHub Actions CI/CD

The repo deploys automatically on every push to `main` via `.github/workflows/`. Add these secrets to your GitHub repo (**Settings → Secrets → Actions**):

| Secret | Value |
|--------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_ADMIN_PASSPHRASE` | Admin panel passphrase |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON |

### 4. Manual deploy

```bash
npm install -g firebase-tools
firebase login
npm run build
firebase deploy
```

Live at: `https://your-project-id.web.app`

### 5. Custom domain (optional)

Firebase console → **Hosting → Add custom domain** → follow DNS steps. SSL is auto-provisioned.

---

## Assets

| File | Description |
|------|-------------|
| `public/logo.png` | Event logo — displayed on Landing and Register pages |
| `public/favicon.png` | Browser tab icon |
| `public/sponsors/*.png` | Sponsor logos — filename must match `src/constants/sponsorLogos.js` |

---

## Pre-Event Checklist

- Update `src/items.js` with final item list, labels, and point values
- Add sponsor logos to `public/sponsors/` and verify filenames in `src/constants/sponsorLogos.js`
- Set GitHub Actions secrets (Supabase URL, anon key, admin passphrase)
- Push to `main` to trigger a production build
- Confirm submissions toggle is **Open** in `/admin` before the event starts
- Test upload flow on iOS and Android
- Print QR code pointing to your Firebase URL and post at event HQ
