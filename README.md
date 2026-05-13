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

---


## Database Scripts

```bash
npm run db:push      # Apply schema changes directly to the database (no migration files)
npm run db:generate  # Generate SQL migration files
npm run db:studio    # Open Drizzle Studio (visual DB browser at localhost:4983)
```
