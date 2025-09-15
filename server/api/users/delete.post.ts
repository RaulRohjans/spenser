import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { users } from '~~/server/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
    const admin = ensureAuth(event)
    if (!admin.is_admin)
        throw createError({ statusCode: 403, statusMessage: 'The given user does not have acces to this resource.' })

    const schema = z.object({
        id: z.coerce.number().int().positive().optional(),
        ids: z.array(z.coerce.number().int().positive()).optional()
    })

    const parsed = schema.safeParse(await readBody(event))
    if (!parsed.success)
        throw createError({ statusCode: 400, statusMessage: 'Invalid payload.' })

    const { id, ids } = parsed.data
    const idList: number[] = Array.isArray(ids)
        ? ids
        : id != null
            ? [Number(id)]
            : []
    if (!idList.length)
        throw createError({ statusCode: 400, statusMessage: 'Missing user ID(s).' })

    const res = await db
        .update(users)
        .set({ deleted: true })
        .where(and(inArray(users.id, idList), eq(users.deleted, false)))
        .returning({ id: users.id })
        .then((r) => r)

    if (!res || res.length === 0)
        throw createError({ statusCode: 500, statusMessage: 'Could not remove user(s) due to an unknown error.' })

    return { success: true, userIds: res.map((x) => x.id) }
})


