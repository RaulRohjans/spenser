import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { aiModels } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { id, provider, model, validator_model, token, ollama_url } = await readBody(event)
    const user = ensureAuth(event)
    if (!user.is_admin)
        throw createError({ statusCode: 403, statusMessage: 'The given user does not have access to this resource.' })

    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID is required.' })
    if (!provider || !model)
        throw createError({ statusCode: 400, statusMessage: 'One or more mandatory fields are empty.' })

    const res = await db
        .update(aiModels)
        .set({ provider, model, validator_model, token, ollama_url })
        .where(and(eq(aiModels.id, Number(id)), eq(aiModels.deleted, false)))
        .returning({ id: aiModels.id })
        .then((r) => r[0])

    if (!res) throw createError({ statusCode: 500, statusMessage: 'Could not update AI model.' })
    return { success: true, id: res.id }
})


