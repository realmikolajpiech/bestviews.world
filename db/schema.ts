import { bigint, boolean, index, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';

export const userViewStates = pgTable('user_view_states', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  viewSlug: text('view_slug').notNull(),
  saved: boolean('saved').notNull().default(false),
  visited: boolean('visited').notNull().default(false),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
}, (table) => [
  uniqueIndex('idx_user_view_state_unique').on(table.userId, table.viewSlug),
  index('idx_user_view_state_user').on(table.userId),
]);

export const communityTips = pgTable('community_tips', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  viewSlug: text('view_slug').notNull(),
  body: text('body').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
}, (table) => [index('idx_tips_view_created').on(table.viewSlug, table.createdAt)]);

export const viewpointSubmissions = pgTable('viewpoint_submissions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  coordinates: text('coordinates').notNull(),
  lookDirection: text('look_direction'),
  photoKey: text('photo_key'),
  status: text('status').notNull().default('pending'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
}, (table) => [
  index('idx_submissions_user_created').on(table.userId, table.createdAt),
  index('idx_submissions_status_created').on(table.status, table.createdAt),
]);
