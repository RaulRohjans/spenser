import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { globalSettings } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
    // Read params
    const { provider, model, token, ollamaUrl } = await readBody(event)
    ensureAuth(event)

    if (
        !provider ||
        ((provider === 'gpt' ||
            provider === 'anthropic' ||
            provider === 'google') &&
            !token) ||
        (provider === 'ollama' && (!model || !ollamaUrl))
    )
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    const opRes = await db
        .update(globalSettings)
        .set({
            importer_provider: provider,
            model,
            token,
            ollama_url: ollamaUrl
        })
        .returning({ id: globalSettings.id })
        .then((r) => r[0])

    if (!opRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not perform the operation, an error occurred.'
        })

    return {
        success: true
    }
})
