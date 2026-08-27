import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const userViewStates = sqliteTable('user_view_states', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  viewSlug: text('view_slug').notNull(),
  saved: integer('saved', { mode: 'boolean' }).notNull().default(false),
  visited: integer('visited', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updated_at').notNull(),
}, (table) => [
  uniqueIndex('idx_user_view_state_unique').on(table.userId, table.viewSlug),
  index('idx_user_view_state_user').on(table.userId),
]);

export const communityTips = sqliteTable('community_tips', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  viewSlug: text('view_slug').notNull(),
  body: text('body').notNull(),
  createdAt: integer('created_at').notNull(),
}, (table) => [index('idx_tips_view_created').on(table.viewSlug, table.createdAt)]);

export const viewpointSubmissions = sqliteTable('viewpoint_submissions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  coordinates: text('coordinates').notNull(),
  lookDirection: text('look_direction'),
  photoKey: text('photo_key'),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at').notNull(),
}, (table) => [
  index('idx_submissions_user_created').on(table.userId, table.createdAt),
  index('idx_submissions_status_created').on(table.status, table.createdAt),
]);
