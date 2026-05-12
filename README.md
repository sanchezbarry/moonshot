# Moonshot — Rewards Platform

A full-stack gamified rewards platform where users complete quests to earn points and redeem them for rewards.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Supabase Auth (@supabase/ssr) |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| Animations | Motion (Framer Motion) |
| Deployment | Vercel |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env.local` file in the project root:

```env
# Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co

# Supabase publishable (anon) key — safe for the browser
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Supabase secret key — server-side only, never expose to the browser
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Supabase Transaction pooler — used by the app at runtime (port 6543)
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-X-<region>.pooler.supabase.com:6543/postgres

# Supabase Session pooler — used only by drizzle-kit (push/generate), not at runtime (port 5432)
DIRECT_URL=postgresql://postgres.<project-ref>:<password>@aws-X-<region>.pooler.supabase.com:5432/postgres
```

> **Why two URLs?** The Transaction pooler (6543) doesn't support the DDL introspection queries drizzle-kit needs. The Session pooler (5432) does. At runtime, the app uses the Transaction pooler with `prepare: false`.

### 3. Push the database schema

```bash
npm run db:push
```

### 4. Run the development server

```bash
npm run dev
```

---

## Database Schema

### Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  auth.users  (Supabase managed — not directly writable)         │
│  ─────────────────────────────────────────────────────          │
│  id          UUID  PK                                           │
│  email       text                                               │
│  password    (encrypted, managed by Supabase Auth)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 1
                           │ id shared as PK — the permanent join
                           │ point between auth and your database
                           ▼ 1
┌──────────────────────────────────────────────────────────────────┐
│  profiles                                                        │
│  ────────────────────────────────────────────────────────        │
│  id               UUID  PK  (= auth.users.id)                   │
│  display_name     text                                           │
│  points_balance   int   ◄── single source of truth for balance  │
│  created_at       timestamptz                                    │
│  updated_at       timestamptz  refreshed on every mutation       │
└───────────┬──────────────────────────────┬───────────────────────┘
            │ 1                            │ 1
            │                             │
            ▼ N                           ▼ N
┌───────────────────────┐     ┌───────────────────────────────────┐
│  quest_completions    │     │  reward_redemptions               │
│  (immutable ledger)   │     │  (immutable ledger)               │
│  ─────────────────    │     │  ─────────────────────────────    │
│  id           UUID PK │     │  id           UUID  PK            │
│  user_id      UUID FK─┼──┐  │  user_id      UUID  FK ──────────┼──┐
│  quest_id     UUID FK─┼──┼─▶│  reward_id    UUID  FK ──────────┼──┼─▶
│  completed_at tstamptz│  │  │  redeemed_at  timestamptz        │  │
└───────────────────────┘  │  └───────────────────────────────────┘  │
            │ N            │                                          │
            ▼ 1            │  (FK back to profiles)                  │
┌───────────────────────┐  │                                          │
│  quests               │  └──────────────────────────────────────────┘
│  ─────────────────    │                 (FK back to profiles)        │
│  id           UUID PK │                                              │
│  title        text    │                                              ▼ 1
│  description  text    │                              ┌───────────────────────────┐
│  points_reward int    │                              │  rewards                  │
│  type         enum ───┼──► quest_type:               │  ─────────────────────    │
│  is_active    bool    │    daily_checkin             │  id           UUID  PK    │
│  created_at   tstamptz│    social                    │  title        text        │
└───────────────────────┘    onboarding                │  description  text        │
                             special                   │  points_cost  int         │
                                                       │  type         enum ───────┼──► reward_type:
                                                       │  is_active    bool        │    badge
                                                       │  created_at   timestamptz │    loot
                                                       └───────────────────────────┘
```

#### Key relationships

| Relationship | Cardinality | Notes |
|---|---|---|
| `auth.users` → `profiles` | 1 : 1 | Same UUID used as PK in both. Created together at signup |
| `profiles` → `quest_completions` | 1 : N | One row per completion event; streak is derived from this table |
| `quest_completions` → `quests` | N : 1 | Many completions can reference the same quest definition |
| `profiles` → `reward_redemptions` | 1 : N | One row per redemption; badge ownership is derived from this table |
| `reward_redemptions` → `rewards` | N : 1 | Many redemptions can reference the same reward definition |

#### Design decisions

- **No stored streak column.** The current streak is always calculated on demand by walking `quest_completions` backwards from today. The ledger is the source of truth — a stored counter would risk going out of sync.
- **No stored badge column on profiles.** Whether a user owns a badge is derived by joining `reward_redemptions` with `rewards WHERE type = 'badge'`. Same principle: the ledger over a denormalised flag.
- **Atomic transactions everywhere.** Every point change (check-in, redemption) writes a ledger entry and updates `profiles.points_balance` inside a single transaction. There is no path to phantom points or an orphaned record.

---

### Table Reference

#### `profiles`
Extends Supabase's internal `auth.users` table. Created automatically when a user signs up.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key. Matches `auth.users.id` — this is the join point between auth and your DB |
| `display_name` | text | Set on signup |
| `points_balance` | integer | Running balance. Updated atomically via SQL increment to avoid race conditions |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Refreshed on every points mutation |

---

#### `quests`
Quest definitions. The actual completion events live in `quest_completions`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `title` | text | |
| `description` | text | |
| `points_reward` | integer | Points awarded on completion |
| `type` | enum | `daily_checkin`, `social`, `onboarding`, `special` |
| `is_active` | boolean | Inactive quests are hidden from users |
| `created_at` | timestamptz | |

---

#### `quest_completions`
Immutable ledger of every quest completion event. One row per completion.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `user_id` | UUID | FK → `profiles.id` (cascade delete) |
| `quest_id` | UUID | FK → `quests.id` (cascade delete) |
| `completed_at` | timestamptz | Used to enforce the one-per-UTC-day rule for `daily_checkin` quests |

**Daily check-in enforcement:** The application queries this table for any row where `user_id` matches, `quest_id` is the daily check-in quest, and `completed_at >= today 00:00 UTC`. If a row exists, the check-in is rejected. No separate "last checked in" column is needed — the ledger is the source of truth.

**Streak calculation:** To compute the current streak, all completions for the user + quest are fetched and deduplicated to one entry per UTC calendar day. The algorithm walks backwards from today (or yesterday if not yet checked in today), counting consecutive days until it finds a gap. No streak column is stored — the streak is always derived from the ledger on demand.

---

#### `rewards`
Reward catalogue. Supports two behavioural types.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `title` | text | |
| `description` | text | |
| `points_cost` | integer | Deducted from `profiles.points_balance` on redemption |
| `type` | enum | `badge` (one-time collectible shown on dashboard) or `loot` (repeatable, applies a random effect) |
| `is_active` | boolean | |
| `created_at` | timestamptz | |

---

#### `reward_redemptions`
Immutable ledger of every reward redemption. One row per redemption event.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `user_id` | UUID | FK → `profiles.id` (cascade delete) |
| `reward_id` | UUID | FK → `rewards.id` (cascade delete) |
| `redeemed_at` | timestamptz | |

**Badge uniqueness:** To enforce that a `badge`-type reward can only be redeemed once, the application queries this table before allowing redemption. If a row already exists for `(user_id, reward_id)`, the redemption is rejected.

---

## How the Application Works

### Authentication Flow

```
User fills signup form
    │
    ▼
supabase.auth.signUp()          — Supabase creates a row in auth.users
    │
    ▼
db.insert(profiles)             — App creates a matching row in profiles
    │                             using the same UUID as auth.users.id
    ▼
redirect → /quests
```

Login follows the same pattern in reverse: `signInWithPassword()` → profile upsert (safety net in case signup failed mid-way) → redirect.

The `proxy.ts` file (Next.js 16's replacement for middleware) intercepts every request. Unauthenticated users hitting protected routes (`/dashboard`, `/quests`, `/rewards`) are redirected to `/login`. Authenticated users hitting `/login` or `/signup` are redirected to `/dashboard`.

---

### Points Flow

Every point change follows this pattern to guarantee consistency:

```
User triggers an action (check-in, reward redemption)
    │
    ▼
Server Action runs on the server
    │
    ├── Check eligibility (already checked in today? enough balance?)
    │
    ▼
db.transaction(async (tx) => {
    tx.insert(quest_completions | reward_redemptions)   ← ledger entry
    tx.update(profiles).set({
        points_balance: sql`points_balance + ${delta}`  ← atomic SQL increment
    })
})
    │
    ▼
Return new balance to client → AlertDialog shows result
```

The transaction guarantees that a ledger record and the corresponding balance change are **always written together or not at all**. You cannot have phantom points (balance updated without a ledger entry) or an orphaned record (ledger entry without a balance change).

The `sql\`points_balance + ${delta}\`` pattern avoids the read-modify-write race condition that would occur if the app fetched the balance, added to it in JavaScript, and wrote it back.

---

### Daily Check-in Quest

#### Streak logic

The check-in operates on a **7-day streak cycle**. Every completed day advances the streak by 1. On every 7th consecutive day, a **+300 pt bonus** is awarded on top of the regular 100 pts. Missing a day resets the streak to 0.

```
streak 1 → 100 pts
streak 2 → 100 pts
streak 3 → 100 pts
streak 4 → 100 pts
streak 5 → 100 pts
streak 6 → 100 pts
streak 7 → 400 pts  (100 base + 300 bonus)
streak 8 → 100 pts  (new cycle begins)
```

#### Check-in flow

```
User opens /quests — server page fetches dailyQuest + calls getStreakInfo()
    │
    ▼
Streak is derived from quest_completions (deduplicated by UTC date, walked backwards)
    │
    ├── checkedInToday = true  → button shows "✓ Checked in today" (disabled)
    └── checkedInToday = false → button active, UI shows 7-dot progress bar
    │
    ▼                         (on button click)
dailyCheckIn() server action
    │
    ├── Query quest_completions for completed_at >= today 00:00 UTC
    │       found → return already_checked_in + time until next UTC midnight
    │
    ├── Calculate previousStreak (walk backwards from yesterday)
    │       newStreak = previousStreak + 1
    │       bonusAwarded = newStreak % 7 === 0
    │       totalPoints = 100 + (bonusAwarded ? 300 : 0)
    │
    ▼
db.transaction:
    INSERT quest_completions
    UPDATE profiles SET points_balance = points_balance + totalPoints
    │
    ▼
Return { newStreak, bonusAwarded, newBalance } → client updates streak dots + shows dialog
```

#### UI

The card popup shows:
- Current streak counter (`🔥 N day streak`)
- A 7-segment progress bar — each segment represents one day in the cycle
- The 7th segment is highlighted in amber with a `+300` label beneath it
- A hint line on day 6: *"Check in tomorrow for your 7-day bonus: +300 pts!"*
- The success dialog distinguishes between a normal check-in and a 7-day bonus completion

---

### Rewards

**Pioneer Badge** (`type: badge`)
- Costs 100 pts
- One-time per user — checked by querying `reward_redemptions` before allowing redemption
- On redemption: 100 pts deducted, row inserted into `reward_redemptions`
- Appears on dashboard under "Badges" by joining `reward_redemptions` with `rewards` where `type = 'badge'`

**Double or Half** (`type: loot`)
- Costs 100 pts
- Repeatable
- On redemption: 100 pts deducted, then remaining balance is either doubled (50%) or halved (50%) using a server-side coin flip
- The random multiplier is applied inside the transaction so the ledger entry and the final balance are always consistent

---

## Database Scripts

```bash
npm run db:push      # Apply schema changes directly to the database (no migration files)
npm run db:generate  # Generate SQL migration files
npm run db:studio    # Open Drizzle Studio (visual DB browser at localhost:4983)
```
