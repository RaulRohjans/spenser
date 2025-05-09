import { db } from '@/utils/dbEngine'

export async function validateCategory(userId: number, categoryId: number) {
    const res = await db
        .selectFrom('category')
        .select(({ fn }) => [fn.count<number>('category.id').as('count')])
        .where('category.user', '=', userId)
        .where('category.id', '=', categoryId)
        .where('category.deleted', '=', false)
        .executeTakeFirst()

    if (!res || res.count === 0)
        throw createError({
            statusCode: 400,
            statusMessage: 'No category exists with the corresponding id.'
        })
}