import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'

// Discriminates quest types so we can handle daily check-in logic separately
export const questTypeEnum = pgEnum('quest_type', [
  'daily_checkin',
  'social',
  'onboarding',
  'special',
])

// Mirrors auth.users — id is the Supabase auth user UUID, not auto-generated
// pointsBalance is the source of truth for a user's spendable points
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  displayName: text('display_name'),
  pointsBalance: integer('points_balance').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Quest definitions — actual completion tracking lives in quest_completions
export const quests = pgTable('quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  pointsReward: integer('points_reward').notNull(),
  type: questTypeEnum('type').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// One row per completion event — for daily_checkin quests, completedAt.date()
// is used to enforce the one-per-day constraint in the application layer
export const questCompletions = pgTable('quest_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  questId: uuid('quest_id')
    .references(() => quests.id, { onDelete: 'cascade' })
    .notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
})

// Reward catalogue — pointsCost is deducted from profiles.pointsBalance on redemption
export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  pointsCost: integer('points_cost').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Immutable redemption ledger — balance check + deduction + insert happen in a transaction
export const rewardRedemptions = pgTable('reward_redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  rewardId: uuid('reward_id')
    .references(() => rewards.id, { onDelete: 'cascade' })
    .notNull(),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }).defaultNow().notNull(),
})

// Inferred TypeScript types for use in application code
export type Profile = typeof profiles.$inferSelect
export type Quest = typeof quests.$inferSelect
export type QuestCompletion = typeof questCompletions.$inferSelect
export type Reward = typeof rewards.$inferSelect
export type RewardRedemption = typeof rewardRedemptions.$inferSelect
