import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { categories } from '~~/server/db/schema'
import { and, eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { name, icon, description } = await readBody(event)
    const user = ensureAuth(event)

    if (!name)
        throw createError({
            statusCode: 400,
            statusMessage: 'Category name is required.'
        })

    // Check if category already exists
    const res = await db
        .select({ cat_count: sql<number>`count(*)` })
        .from(categories)
        .where(
            and(
                eq(categories.user, user.id),
                eq(categories.deleted, false),
                sql`upper(${categories.name}) = ${name.toUpperCase()}`
            )
        )
        .then((r) => r[0])

    if (!res || res.cat_count > 0)
        throw createError({
            statusCode: 400,
            statusMessage: 'A category with that name already exists.'
        })

    // Insert new category
    const insertRes = await db
        .insert(categories)
        .values({
            name,
            icon: icon || null,
            description: description || null,
            user: user.id,
            deleted: false
        })
        .returning({ id: categories.id })
        .then((r) => r[0])

    if (!insertRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create category.'
        })

    return { success: true }
})
