import fs from 'fs'
import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~/../server/db/client'
import { readFiles } from 'h3-formidable'
import type { NuxtError } from 'nuxt/app'
import { LLM } from '~/utils/LLM'
import { globalSettings, categories } from '~/../server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)

    const maxFiles = 1
    const { maxTransactionFileSize } = useRuntimeConfig()

    const { files } = await readFiles(event, {
        maxFiles: maxFiles,
        maxFileSize: Number(maxTransactionFileSize)
    })

    // Use uploaded file
    if (!files || Object.keys(files).length === 0)
        throw createError({
            statusMessage: 'Please provide valid file.',
            statusCode: 400
        })

    // This piece of code cannot be isolated into a function
    // otherwise nuxt will throw an error saying you used some code
    // outside a middleware, plugin or other specific place
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

    // Get first file value
    const value = Object.values(files)[0]

    if (!value)
        throw createError({
            statusMessage: 'Please provide valid file.',
            statusCode: 400
        })

    // Validate file type
    const mimetype = value[0].mimetype
    if (
        !mimetype?.toLowerCase().startsWith('text') &&
        mimetype === 'application/json'
    )
        throw createError({
            statusMessage:
                'Invalid file type, please provide text based files only.',
            statusCode: 400
        })

    const filepath = value[0].filepath
    let data
    try {
        data = fs.readFileSync(filepath, 'utf8')
    } catch (err) {
        throw createError({
            statusMessage: (err as NuxtError).message,
            statusCode: 400
        })
    }

    const llmInstance = new LLM(gSettings) //Instance LLM
    const llmTransactions = await llmInstance.parseTransactions(data, cats)

    return { success: true, transactions: llmTransactions }
})
