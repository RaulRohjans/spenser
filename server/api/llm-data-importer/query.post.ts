import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~~/server/db/client'
import { LLM } from '~/utils/LLM'
import { globalSettings, categories } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)
    const { transactionText } = await readBody(event)

    if (!transactionText)
        throw createError({
            statusMessage: 'Please provide valid text.',
            statusCode: 400
        })

    const gSettings = await db
        .select()
        .from(globalSettings)
        .where(eq(globalSettings.user, user.id))
        .then((r) => r[0])

    if (!gSettings)
        throw createError({
            statusMessage: 'No LLM settings are configured for this instance.',
            statusCode: 400
        })

    // Get categories to feed LLM with
    const cats = await db
        .select()
        .from(categories)
        .where(and(eq(categories.user, user.id), eq(categories.deleted, false)))

    const llmInstance = new LLM(gSettings) //Instance LLM
    const llmTransactions = await llmInstance.parseTransactions(
        transactionText,
        cats
    )

    return { success: true, transactions: llmTransactions }
})
