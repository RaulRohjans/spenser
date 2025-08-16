import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import type { TableRow } from '~/../types/Table'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    const id = event.context.params?.id

    if (!id)
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing transaction ID.'
        })

    const result = await db
        .selectFrom('transaction')
        .innerJoin('category', 'category.id', 'transaction.category')
        .select([
            'transaction.id',
            'transaction.name',
            'transaction.value',
            'transaction.date',
            'transaction.category',
            'category.name as category_name',
            'category.icon as category_icon',
            'category.deleted as category_deleted'
        ])
        .where('transaction.id', '=', Number.parseInt(id))
        .where('transaction.user', '=', user.id)
        .where('transaction.deleted', '=', false)
        .executeTakeFirst()

    if (!result)
        throw createError({
            statusCode: 404,
            statusMessage: 'Transaction not found or access denied.'
        })

    return {
        success: true,
        data: result satisfies TableRow
    }
})
