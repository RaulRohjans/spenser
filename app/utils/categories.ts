
export async function validateCategory(userId: number, categoryId: number) {
    const res = await db
        .selectFrom('category')
        .select(({ fn }) => [fn.count<number>('id').as('count')])
        .where('user', '=', userId)
        .where('id', '=', categoryId)
        .where('deleted', '=', false)
        .executeTakeFirst()
  
    if (!res || res.count === 0)
        throw createError({
            statusCode: 400,
            statusMessage: 'No category exists with the corresponding id.'
        })
}