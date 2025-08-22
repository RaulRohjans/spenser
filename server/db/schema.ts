import {
    pgTable,
    serial,
    varchar,
    boolean,
    integer,
    timestamp,
    numeric,
    smallint
} from 'drizzle-orm/pg-core'

export const users = pgTable('user', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 50 }).notNull(),
    first_name: varchar('first_name', { length: 50 }).notNull(),
    last_name: varchar('last_name', { length: 50 }).notNull(),
    email: varchar('email', { length: 320 }).notNull(),
    avatar: varchar('avatar', { length: 50 }),
    is_admin: boolean('is_admin').notNull().default(false),
    password: varchar('password', { length: 72 }).notNull(),
    deleted: boolean('deleted').notNull().default(false)
})

export const categories = pgTable('category', {
    id: serial('id').primaryKey(),
    user: integer('user').notNull(),
    name: varchar('name', { length: 50 }).notNull(),
    icon: varchar('icon', { length: 50 }),
    description: varchar('description', { length: 500 }),
    deleted: boolean('deleted').notNull().default(false)
})

export const transactions = pgTable('transaction', {
    id: serial('id').primaryKey(),
    user: integer('user').notNull(),
    category: integer('category').notNull(),
    name: varchar('name', { length: 150 }),
    value: numeric('value', { precision: 12, scale: 2 }).notNull(),
    date: timestamp('date', { mode: 'date' }).notNull(),
    tz_offset_minutes: smallint('tz_offset_minutes').notNull().default(0),
    deleted: boolean('deleted').notNull().default(false)
})

export const currencies = pgTable('currency', {
    id: serial('id').primaryKey(),
    symbol: varchar('symbol', { length: 5 }).notNull(),
    placement: varchar('placement', { length: 6 }).notNull(),
    deleted: boolean('deleted').notNull().default(false)
})

export const userPreferences = pgTable('user_preferences', {
    id: serial('id').primaryKey(),
    user: integer('user').notNull().unique(),
    currency: integer('currency').notNull()
})

export const globalSettings = pgTable('global_settings', {
    id: serial('id').primaryKey(),
    importer_provider: varchar('importer_provider', { length: 50 }).notNull(),
    model: varchar('model', { length: 100 }),
    token: varchar('token', { length: 150 }),
    ollama_url: varchar('ollama_url', { length: 150 })
})

export const budgets = pgTable('budget', {
    id: serial('id').primaryKey(),
    user: integer('user').notNull(),
    category: integer('category'),
    name: varchar('name', { length: 150 }),
    value: numeric('value', { precision: 12, scale: 2 }).notNull(),
    period: varchar('period', { length: 100 }).notNull(),
    order: integer('order').notNull(),
    deleted: boolean('deleted').notNull().default(false)
})

// Inferred types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert

export type Currency = typeof currencies.$inferSelect
export type NewCurrency = typeof currencies.$inferInsert

export type UserPreferences = typeof userPreferences.$inferSelect
export type NewUserPreferences = typeof userPreferences.$inferInsert

export type GlobalSettings = typeof globalSettings.$inferSelect
export type NewGlobalSettings = typeof globalSettings.$inferInsert

export type Budget = typeof budgets.$inferSelect
export type NewBudget = typeof budgets.$inferInsert
