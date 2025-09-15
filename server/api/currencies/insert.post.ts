import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { currencies } from '~~/server/db/schema'
import type { Currency } from '~~/server/db/schema'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
    const admin = ensureAuth(event)
    if (!admin.is_admin)
        throw createError({ statusCode: 403, statusMessage: 'This action is blocked for the given user.' })

    const schema = z.object({
        symbol: z.string().min(1).max(5),
        placement: z.enum(['before', 'after'])
    })
    const parsed = schema.safeParse(await readBody(event))
    if (!parsed.success)
        throw createError({ statusCode: 400, statusMessage: 'One or more mandatory fields are empty.' })
    const { symbol, placement } = parsed.data

    const opRes = await db
        .insert(currencies)
        .values({ symbol, placement, deleted: false } satisfies Omit<Currency, 'id'>)
        .returning({ id: currencies.id })
        .then((r) => r[0])

    if (!opRes)
        throw createError({ statusCode: 500, statusMessage: 'Could not perform the operation, an error occurred.' })

    return { success: true, id: opRes.id }
})


