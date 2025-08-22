import { readFiles } from 'h3-formidable'
import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOllama } from 'ollama-ai-provider-v2'
import { parseOfficeAsync } from 'officeparser'
import { parse as parseYaml } from 'yaml'
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

    if (!gSettings || !gSettings.token || !gSettings.importer_provider || !gSettings.model) {
        throw createError({
            statusMessage: 'LLM is not configured.',
            statusCode: 400
        })
    }

    // Load categories for the user
    const cats = await db
        .select({ id: categories.id, name: categories.name, description: categories.description })
        .from(categories)
        .where(and(eq(categories.user, user.id), eq(categories.deleted, false)))

    // Accept either multipart file or JSON body with { transactionText }
    const contentType = getHeader(event, 'content-type') || ''

    let rawText: string | undefined

    if (contentType.includes('multipart/form-data')) {
        const { files } = await readFiles(event, { maxFiles: 1 })
        const first = files && Object.values(files)[0]?.[0]
        if (!first) throw createError({ statusMessage: 'Please provide a valid file.', statusCode: 400 })

        try {
            const buf = await fs.readFile(first.filepath)
            const mimetype = (first.mimetype || '').toLowerCase()
            const filename = (first.originalFilename || '').toLowerCase()

            const textFromBuffer = async () => {
                // Use officeparser for common office/pdf formats
                if (
                    filename.endsWith('.pdf') ||
                    filename.endsWith('.docx') ||
                    filename.endsWith('.pptx') ||
                    filename.endsWith('.xlsx') ||
                    filename.endsWith('.odt') ||
                    filename.endsWith('.odp') ||
                    filename.endsWith('.ods')
                ) {
                    const res = await parseOfficeAsync(buf)
                    if (typeof res === 'string') return res
                }
                if (filename.endsWith('.json') || mimetype.includes('json')) {
                    return buf.toString('utf8')
                }
                if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
                    const doc = parseYaml(buf.toString('utf8'))
                    return typeof doc === 'string' ? doc : JSON.stringify(doc)
                }
                // default to utf8 text
                return buf.toString('utf8')
            }

            rawText = await textFromBuffer()
        } catch (err: unknown) {
            const message = (err as { message?: string } | undefined)?.message || 'Failed to read file'
            throw createError({ statusMessage: message, statusCode: 400 })
        }
    } else {
        const body = await readBody<{ transactionText?: string }>(event)
        if (!body.transactionText) {
            throw createError({ statusMessage: 'Please provide text.', statusCode: 400 })
        }
        rawText = body.transactionText
    }

    if (!rawText || rawText.trim().length === 0) throw createError({ statusMessage: 'No content to parse.', statusCode: 400 })

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
        const provider = createGoogleGenerativeAI({ apiKey: gSettings.token || '' })
        model = provider(name)
    } else if (providerName === 'ollama') {
        const name = gSettings.model || 'llama3'
        const provider = createOllama({ baseURL: gSettings.ollama_url || 'http://localhost:11434' })
        model = provider(name)
    } else {
        throw createError({ statusMessage: 'Unsupported provider.', statusCode: 400 })
    }

    const categoryGuidance = cats
        .map((c) => `- ${c.id}: ${c.name}${c.description ? ` — ${c.description}` : ''}`)
        .join('\n')

    const systemPrompt = `You are a finance assistant that extracts bank transactions from unstructured text. 
        Return a strict JSON object following the provided schema. 
        Map each transaction to a category id from the list when it is a clear match by meaning or name; otherwise set category to null. 
        Dates should be ISO-like or parseable (YYYY-MM-DD or full ISO with time). Amounts: positive for income, negative for expense.`

    const userPrompt = `Unstructured content:\n\n${rawText}\n\nUser Categories (id: name):\n${categoryGuidance}`

    try {
        const { object } = await generateObject({
            model,
            schema: responseSchema,
            system: systemPrompt,
            prompt: userPrompt
        })

        return { success: true, transactions: object.transactions }
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ai-import] Failed to generate structured transactions', {
            provider: providerName,
            model: gSettings.model,
            error: err
        })
        throw createError({
            statusCode: 500,
            statusMessage: 'AI parsing failed. Please try again later.'
        })
    }
})


