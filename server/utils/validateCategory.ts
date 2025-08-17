import { db } from '~/../server/db/client'
import { categories } from '~/../server/db/schema'
import { and, eq, sql } from 'drizzle-orm'

export async function validateCategory(userId: number, categoryId: number) {
    const res = await db
        .select({ count: sql<number>`count(*)` })
        .from(categories)
        .where(
            and(
                eq(categories.user, userId),
                eq(categories.id, categoryId),
                eq(categories.deleted, false)
            )
        )
        .then((r) => r[0])

    if (!res || res.count === 0)
        throw createError({
            statusCode: 400,
            statusMessage: 'No category exists with the corresponding id.'
        })
}
