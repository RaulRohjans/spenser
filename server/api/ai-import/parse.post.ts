import { readFiles } from 'h3-formidable'
import { extractTextFromFileBuffer } from '~~/server/utils/fileParsers'
import fs from 'node:fs/promises'
import { ensureAuth } from '~~/server/utils/auth'
import { createAsyncTask, runAsyncTask } from '~~/server/utils/asyncTasks'
import { runAiImportParse } from '~~/server/utils/aiImportRunner'

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)

    // Accept either multipart file or JSON body with { transactionText }
    const contentType = getHeader(event, 'content-type') || ''

    let rawText: string | undefined
    if (contentType.includes('multipart/form-data')) {
        const { files } = await readFiles(event, { maxFiles: 1 })
        const first = files && Object.values(files)[0]?.[0]
        if (!first)
            throw createError({
                statusMessage: 'Please provide a valid file.',
                statusCode: 400
            })

        try {
            const buf = await fs.readFile(first.filepath)
            const mimetype = (first.mimetype || '').toLowerCase()
            const filename = (first.originalFilename || '').toLowerCase()

            const textFromBuffer = async (): Promise<string> => {
                try {
                    return await extractTextFromFileBuffer(
                        filename,
                        mimetype,
                        buf
                    )
                } catch (fileErr) {
                    console.error('[ai-import] File parsing error', {
                        filename,
                        mimetype,
                        error: fileErr
                    })
                    throw createError({
                        statusCode: 400,
                        statusMessage: 'Unsupported or unreadable file.'
                    })
                }
            }

            rawText = await textFromBuffer()
        } catch (err: unknown) {
            const message =
                (err as { message?: string } | undefined)?.message ||
                'Failed to read file'
            throw createError({ statusMessage: message, statusCode: 400 })
        }
    } else {
        const body = await readBody<{ transactionText?: string }>(event)
        if (!body.transactionText) {
            throw createError({
                statusMessage: 'Please provide text.',
                statusCode: 400
            })
        }
        rawText = body.transactionText
    }

    if (!rawText || rawText.trim().length === 0)
        throw createError({
            statusMessage: 'No content to parse.',
            statusCode: 400
        })

    // Create task and start background processing
    const task = createAsyncTask({
        userId: user.id,
        type: 'ai-import-parse',
        title: 'Parsing transactions with AI',
        message: 'Preparing and analyzing your import'
    })

    // Fire and forget runner
    runAsyncTask(task.id, async (signal) => {
        const result = await runAiImportParse(user.id, rawText!, signal)
        return result
    })

    return { success: true, taskId: task.id }
})
