import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import { LLM } from '~/utils/LLM'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    const { transactionText } = await readBody(event)

    if (!transactionText)
        throw createError({
            statusMessage: 'Please provide valid text.',
            statusCode: 400
        })

    const globalSettings = await db
        .selectFrom('global_settings')
        .selectAll()
        .where('user', '=', user.id)
        .executeTakeFirst()

    if (!globalSettings)
        throw createError({
            statusMessage: 'No LLM settings are configured for this instance.',
            statusCode: 400
        })

    // Get categories to feed LLM with
    const categories = await db
        .selectFrom('category')
        .selectAll()
        .where('category.user', '=', user.id)
        .execute()

    const llmInstance = new LLM(globalSettings) //Instance LLM
    const llmTransactions = await llmInstance.parseTransactions(
        transactionText,
        categories
    )

    return { success: true, transactions: llmTransactions }
})
