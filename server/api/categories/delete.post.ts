import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { categories } from '~~/server/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
    const schema = z.object({
        id: z.coerce.number().int().positive().optional(),
        ids: z.array(z.coerce.number().int().positive()).optional()
    })
    const parsed = schema.safeParse(await readBody(event))
    if (!parsed.success)
        throw createError({ statusCode: 400, statusMessage: 'ID(s) are required.' })
    const { id, ids } = parsed.data
    const user = ensureAuth(event)

    const idList: number[] = Array.isArray(ids)
        ? ids.filter((n: unknown) => Number.isFinite(Number(n))).map((n: any) => Number(n))
        : id != null
            ? [Number(id)]
            : []

    if (!idList.length)
        throw createError({ statusCode: 400, statusMessage: 'ID(s) are required.' })

    const deleteRes = await db
        .update(categories)
        .set({ deleted: true })
        .where(
            and(
                inArray(categories.id, idList),
                eq(categories.user, user.id),
                eq(categories.deleted, false)
            )
        )
        .returning({ id: categories.id })
        .then((r) => r)

    if (!deleteRes || deleteRes.length === 0)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete category(ies).'
        })

    return { success: true, deletedIds: deleteRes.map((x) => x.id) }
})
