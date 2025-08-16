import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import type { Selectable } from 'kysely'
import type { Transaction } from 'kysely-codegen'
import { validateCategory } from '../../utils/validateCategory'

export default defineEventHandler(async (event) => {
    const { category, name, value, date } = await readBody(event)
    const user = ensureAuth(event)

    if (!category || !value || !date)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    await validateCategory(user.id, category)

    const transactionRecord: Omit<Selectable<Transaction>, 'id'> = {
        user: user.id,
        category,
        name,
        value,
        date,
        deleted: false
    }

    const opRes = await db
        .insertInto('transaction')
        .values(transactionRecord)
        .returning('id')
        .executeTakeFirst()

    if (!opRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create transaction.'
        })

    return { success: true }
})
