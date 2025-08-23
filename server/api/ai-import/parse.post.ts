import { readFiles } from 'h3-formidable'
import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOllama } from 'ollama-ai-provider-v2'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { extractTextFromFileBuffer } from '~~/server/utils/fileParsers'
import fs from 'node:fs/promises'
import { generateObject } from 'ai'
import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { categories, globalSettings } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

const parsedTransactionSchema = z.object({
    name: z.string().min(1),
    value: z.number(),
    date: z.string().min(1),
    category: z.number().nullable() // category id or null when unknown
})

const responseSchema = z.object({
    transactions: z.array(parsedTransactionSchema)
})

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)

    const gSettings = await db
        .select()
        .from(globalSettings)
        .then((r) => r[0])

    if (
        !gSettings ||
        !gSettings.token ||
        !gSettings.importer_provider ||
        !gSettings.model
    ) {
        throw createError({
            statusMessage: 'LLM is not configured.',
            statusCode: 400
        })
    }

    // Load categories for the user
    const cats = await db
        .select({
            id: categories.id,
            name: categories.name,
            description: categories.description
        })
        .from(categories)
        .where(and(eq(categories.user, user.id), eq(categories.deleted, false)))

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

    const providerName = gSettings.importer_provider
    let model
    if (providerName === 'gpt') {
        const name = gSettings.model || 'gpt-4o-mini'
        const provider = createOpenAI({ apiKey: gSettings.token || '' })
        model = provider(name)
    } else if (providerName === 'anthropic') {
        const name = gSettings.model || 'claude-3-5-sonnet-latest'
        const provider = createAnthropic({ apiKey: gSettings.token || '' })
        model = provider(name)
    } else if (providerName === 'google') {
        const name = gSettings.model || 'gemini-1.5-flash'
        const provider = createGoogleGenerativeAI({
            apiKey: gSettings.token || ''
        })
        model = provider(name)
    } else if (providerName === 'ollama') {
        const name = gSettings.model || 'llama3'
        const provider = createOllama({
            baseURL: gSettings.ollama_url || 'http://localhost:11434'
        })
        model = provider(name)
    } else if (providerName === 'openrouter') {
        const name = gSettings.model || 'anthropic/claude-3-5-sonnet-latest'
        const provider = createOpenRouter({
            apiKey: gSettings.token || ''
        })
        model = provider(name)
    } else {
        throw createError({
            statusMessage: 'Unsupported provider.',
            statusCode: 400
        })
    }

    const categoryGuidance = cats
        .map(
            (c) =>
                `- ${c.id}: ${c.name}${c.description ? ` — ${c.description}` : ''}`
        )
        .join('\n')

    const systemPrompt = `You are a precise finance extraction assistant. 
        Return ONLY valid JSON strictly matching the schema. 
        - Every transaction MUST include all fields. 
        - If category is unknown or not a confident match, set it to null (never leave it empty). 
        - Never include comments, trailing commas, ellipses, or extra text before/after the JSON. 
        - Dates must be ISO-like (YYYY-MM-DD or full ISO). Amounts: positive income, negative expense.`

    const userPrompt = `Unstructured content:\n\n${rawText}\n\nUser Categories (id: name):\n${categoryGuidance}`

    try {
        const { object } = await generateObject({
            model,
            schema: responseSchema,
            system: systemPrompt,
            prompt: userPrompt,
            // Reduce randomness and allow more output
            temperature: 0.2,
            maxOutputTokens: 8192
        })
        return { success: true, transactions: object.transactions }
    } catch (err) {
        console.error('[ai-import] generation failed', {
            provider: providerName,
            model: gSettings.model,
            // @ts-expect-error best-effort
            text: err?.text,
            error: err
        })
        throw createError({
            statusCode: 500,
            statusMessage: 'AI parsing failed. Please try again later.'
        })
    }
})
