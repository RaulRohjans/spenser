import { ensureAuth } from '@/utils/authFunctions'
import { db } from '~~/server/db/client'
import { currencies } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import type { Currency } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
    // Read params
    const { id, symbol, placement } = await readBody(event)
    const operation = event.context.params?.operation || null
    const user = ensureAuth(event)

    // Validate if user is admin
    if (!user.is_admin)
        throw createError({
            statusCode: 401,
            statusMessage: 'This action is blocked for the given user.'
        })

    // No need to do rest of the logic
    if (operation === 'delete' && id) {
        // Mark record as deleted in the database
        const res = await db
            .update(currencies)
            .set({ deleted: true })
            .where(and(eq(currencies.id, id), eq(currencies.deleted, false)))
            .returning({ id: currencies.id })
            .then((r) => r[0])

        if (!res)
            throw createError({
                statusCode: 500,
                statusMessage: 'Could not find currency record to remove.'
            })

        return { success: true }
    }

    if (!symbol || !placement)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    let opRes
    switch (operation) {
        case 'duplicate':
        case 'insert': {
            // Create currency record
            const currency: Omit<Currency, 'id'> = {
                placement,
                symbol,
                deleted: false
            }

            // Add currency to persistent storage
            opRes = await db
                .insert(currencies)
                .values(currency)
                .returning({ id: currencies.id })
                .then((r) => r[0])
            break
        }
        case 'edit':
            // Update currency in the database
            opRes = await db
                .update(currencies)
                .set({ placement, symbol })
                .where(
                    and(eq(currencies.id, id), eq(currencies.deleted, false))
                )
                .returning({ id: currencies.id })
                .then((r) => r[0])
            break
        default:
            throw createError({
                statusCode: 500,
                statusMessage: 'Invalid operation.'
            })
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
