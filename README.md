# Moonshot — Rewards Platform

A full-stack gamified rewards platform where users complete quests to earn points and redeem them for rewards.

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

### 3. Push the database schema

```bash
npm run db:push
```

### 4. Run the development server

```bash
npm run dev
```



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


## Database Scripts

```bash
npm run db:push      # Apply schema changes directly to the database (no migration files)
npm run db:generate  # Generate SQL migration files
npm run db:studio    # Open Drizzle Studio (visual DB browser at localhost:4983)
```
