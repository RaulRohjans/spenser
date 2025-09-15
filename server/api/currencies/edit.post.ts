import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { currencies } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
    const admin = ensureAuth(event)
    if (!admin.is_admin)
        throw createError({ statusCode: 403, statusMessage: 'This action is blocked for the given user.' })

    const schema = z.object({
        id: z.coerce.number().int().positive(),
        symbol: z.string().min(1).max(5),
        placement: z.enum(['before', 'after'])
    })
    const parsed = schema.safeParse(await readBody(event))
    if (!parsed.success)
        throw createError({ statusCode: 400, statusMessage: 'One or more mandatory fields are empty.' })
    const { id, symbol, placement } = parsed.data

    const opRes = await db
        .update(currencies)
        .set({ symbol, placement })
        .where(and(eq(currencies.id, id), eq(currencies.deleted, false)))
        .returning({ id: currencies.id })
        .then((r) => r[0])

    if (!opRes)
        throw createError({ statusCode: 500, statusMessage: 'Could not perform the operation, an error occurred.' })

    return { success: true, id: opRes.id }
})


