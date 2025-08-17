import { eq, and, sql } from 'drizzle-orm'
import { categories } from '~/../server/db/schema'

export async function validateCategory(userId: number, categoryId: number) {
    const res = await db
        .select<{ count: number }>({
            count: sql<number>`count(${categories.id})`
        })
        .from(categories)
        .where(
            and(
                eq(categories.user, userId),
                eq(categories.id, categoryId),
                eq(categories.deleted, false)
            )
        )
        .then((r: { count: number }[]) => r[0])

    if (!res || res.count === 0)
        throw createError({
            statusCode: 400,
            statusMessage: 'No category exists with the corresponding id.'
        })
}
