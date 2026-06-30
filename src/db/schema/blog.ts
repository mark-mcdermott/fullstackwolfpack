import { sql } from 'drizzle-orm'
import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { users } from './auth'

export const blogCategories = pgTable('blog_categories', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
})

export const blogTags = pgTable('blog_tags', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
})

export const blogPosts = pgTable('blog_posts', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  body: text('body').notNull(), // markdown / MDX
  coverImageUrl: text('cover_image_url'),
  authorId: text('author_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  categoryId: text('category_id').references(() => blogCategories.id, {
    onDelete: 'set null',
  }),
  readMinutes: integer('read_minutes'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const blogPostTags = pgTable(
  'blog_post_tags',
  {
    postId: text('post_id')
      .notNull()
      .references(() => blogPosts.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => blogTags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
)
