import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~/../server/db/client'
import { globalSettings } from '~/../server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    // Read params
    const { provider, gptModel, gptToken, ollamaModel, ollamaUrl } =
        await readBody(event)
    const user = ensureAuth(event)

    if (
        !provider ||
        (provider === 'ollama' && !ollamaModel && !ollamaUrl) ||
        (provider === 'gpt' && !gptToken)
    )
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    // Check if it's the first time saving global settings
    const saved = await db
        .select({ id: globalSettings.id })
        .from(globalSettings)
        .where(eq(globalSettings.user, user.id))
        .then((r) => r[0])

    let opRes
    // A record exists in the db, lets edit it
    if (saved) {
        opRes = await db
            .update(globalSettings)
            .set({
                importer_provider: provider,
                gpt_model: gptModel,
                gpt_token: gptToken,
                ollama_model: ollamaModel,
                ollama_url: ollamaUrl
            })
            .where(eq(globalSettings.id, saved.id))
            .returning({ id: globalSettings.id })
            .then((r) => r[0])
    } else {
        opRes = await db
            .insert(globalSettings)
            .values({
                user: user.id,
                importer_provider: provider,
                gpt_model: gptModel,
                gpt_token: gptToken,
                ollama_model: ollamaModel,
                ollama_url: ollamaUrl
            })
            .returning({ id: globalSettings.id })
            .then((r) => r[0])
    }

    if (!opRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not perform the operation, an error occurred.'
        })

    return {
        success: true
    }
})
