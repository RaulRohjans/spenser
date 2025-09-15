import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { categories } from '~~/server/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
    const schema = z.object({
        name: z.string().trim().min(1),
        icon: z.string().trim().optional().nullable(),
        description: z.string().trim().max(500).optional().nullable()
    })
    const parsed = schema.safeParse(await readBody(event))
    if (!parsed.success)
        throw createError({ statusCode: 400, statusMessage: 'Category name is required.' })
    const { name, icon, description } = parsed.data
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
