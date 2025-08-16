import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import type { Selectable } from 'kysely'
import type { Category } from 'kysely-codegen'

export default defineEventHandler(async (event) => {
    const { name, icon } = await readBody(event)
    const user = ensureAuth(event)

    if (!name)
        throw createError({
            statusCode: 400,
            statusMessage: 'Category name is required.'
        })

    // Check if category already exists
    const res = await db
        .selectFrom('category')
        .select(({ fn }) => [fn.count<number>('id').as('cat_count')])
        .where('user', '=', user.id)
        .where('deleted', '=', false)
        .where(({ eb }) =>
            eb(eb.fn('upper', ['name']), '=', name.toUpperCase())
        )
        .executeTakeFirst()

    if (!res || res.cat_count > 0)
        throw createError({
            statusCode: 400,
            statusMessage: 'A category with that name already exists.'
        })

    // Insert new category
    const newCategory: Omit<Selectable<Category>, 'id'> = {
        name,
        icon: icon || null,
        user: user.id,
        deleted: false
    }

    const insertRes = await db
        .insertInto('category')
        .values(newCategory)
        .returning('id')
        .executeTakeFirst()

    if (!insertRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create category.'
        })

    return { success: true }
})
