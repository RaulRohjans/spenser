import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { aiModels } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
    const { provider, model, validator_model, token, ollama_url } = await readBody(event)
    const user = ensureAuth(event)
    if (!user.is_admin)
        throw createError({ statusCode: 401, statusMessage: 'The given user does not have access to this resource.' })

    if (!provider || !model)
        throw createError({ statusCode: 400, statusMessage: 'One or more mandatory fields are empty.' })

    const res = await db
        .insert(aiModels)
        .values({ provider, model, validator_model, token, ollama_url, deleted: false })
        .returning({ id: aiModels.id })
        .then((r) => r[0])

    if (!res) throw createError({ statusCode: 500, statusMessage: 'Could not create AI model.' })
    return { success: true, id: res.id }
})


