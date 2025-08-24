import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { users } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { readMultipartFormData } from 'h3'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { getAvatarsDir, isAllowedMime, MIME_TO_EXT } from '~~/server/utils/filePaths'

export default defineEventHandler(async (event) => {
    const authUser = ensureAuth(event)
    const idParam = event.context.params?.id
    
    const targetUserId = Number(idParam)
    if (!targetUserId || Number.isNaN(targetUserId))
        throw createError({ statusCode: 400, statusMessage: 'Invalid user id.' })

    if (!authUser.is_admin && targetUserId !== authUser.id)
        throw createError({ statusCode: 403, statusMessage: 'Forbidden.' })

    const { avatarMaxMb } = useRuntimeConfig()
    const maxMb = Number(avatarMaxMb || '5')

    const form = await readMultipartFormData(event)
    if (!form || form.length === 0)
        throw createError({ statusCode: 400, statusMessage: 'Invalid form data.' })

    const clearPart = form.find((p) => p.name === 'clear')
    const shouldClear = clearPart?.data
        ? ['1', 'true', 'yes', 'null', ''].includes(clearPart.data.toString().trim().toLowerCase())
        : false

    const filePart = form.find((p) => p.name === 'file' && p.data)
    if (!shouldClear && !filePart)
        throw createError({ statusCode: 400, statusMessage: 'No avatar payload provided.' })

    // Fetch previous avatar to cleanup
    const current = await db
        .select({ avatar: users.avatar })
        .from(users)
        .where(and(eq(users.id, targetUserId), eq(users.deleted, false)))
        .then((r) => r[0])
    const prev = current?.avatar || null

    let newFileName: string | null = null
    if (!shouldClear && filePart) {
        const type = filePart.type || ''
        if (!isAllowedMime(type))
            throw createError({ statusCode: 400, statusMessage: 'Unsupported file type.' })
        const maxBytes = maxMb * 1024 * 1024
        if (filePart.data.length > maxBytes)
            throw createError({ statusCode: 400, statusMessage: 'File too large.' })

        const ext = MIME_TO_EXT[type]
        const fn = `${randomUUID()}${ext}`
        const dir = getAvatarsDir()
        await fs.mkdir(dir, { recursive: true })
        await fs.writeFile(join(dir, fn), filePart.data)
        newFileName = fn
    }

    await db
        .update(users)
        .set({ avatar: shouldClear ? null : newFileName })
        .where(and(eq(users.id, targetUserId), eq(users.deleted, false)))

    try {
        if ((shouldClear || newFileName) && prev && prev !== newFileName) {
            await fs.unlink(join(getAvatarsDir(), prev)).catch(() => undefined)
        }
    } catch {
        /* ignore */
    }

    return {
        success: true,
        data: { fileName: newFileName, url: newFileName ? `/avatars/${newFileName}` : null }
    }
})


