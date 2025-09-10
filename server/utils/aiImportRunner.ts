import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOllama } from 'ollama-ai-provider-v2'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateObject } from 'ai'
import { db } from '~~/server/db/client'
import { categories, globalSettings } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { resolveAiConfig } from '~~/server/utils/aiConfig'

const parsedTransactionSchema = z.object({
    name: z.string().min(1),
    value: z.number(),
    date: z.string().min(1),
    category: z.number().nullable()
})

const responseSchema = z.object({
    transactions: z.array(parsedTransactionSchema)
})

export async function runAiImportParse(
    userId: number,
    rawText: string,
    abortSignal?: AbortSignal
): Promise<{ transactions: Array<{ name: string; value: number; date: string; category: number | null }> }> {
    const gSettings = await db
        .select()
        .from(globalSettings)
        .then((r) => r[0])

    const { providerName, apiToken, modelName, ollamaBaseUrl } = resolveAiConfig(
        gSettings || {}
    )

    const cats = await db
        .select({
            id: categories.id,
            name: categories.name,
            description: categories.description
        })
        .from(categories)
        .where(and(eq(categories.user, userId), eq(categories.deleted, false)))

    let model: unknown
    if (providerName === 'gpt') {
        const name = modelName || 'gpt-4o-mini'
        const provider = createOpenAI({ apiKey: apiToken || '' })
        model = provider(name)
    } else if (providerName === 'anthropic') {
        const name = modelName || 'claude-3-5-sonnet-latest'
        const provider = createAnthropic({ apiKey: apiToken || '' })
        model = provider(name)
    } else if (providerName === 'google') {
        const name = modelName || 'gemini-1.5-flash'
        const provider = createGoogleGenerativeAI({ apiKey: apiToken || '' })
        model = provider(name)
    } else if (providerName === 'ollama') {
        const name = modelName || 'llama3'
        const provider = createOllama({ baseURL: ollamaBaseUrl })
        model = provider(name)
    } else if (providerName === 'openrouter') {
        const name = modelName || 'anthropic/claude-3-5-sonnet-latest'
        const provider = createOpenRouter({ apiKey: apiToken || '' })
        model = provider(name)
    } else {
        throw createError({ statusMessage: 'Unsupported provider.', statusCode: 400 })
    }

    const categoryGuidance = cats
        .map((c) => `- ${c.id}: ${c.name}${c.description ? ` — ${c.description}` : ''}`)
        .join('\n')

    const systemPrompt = `You are a precise finance extraction assistant. \n
        Return ONLY valid JSON strictly matching the schema. \n
         - Every transaction MUST include all fields. \n
         - If category is unknown or not a confident match, set it to null (never leave it empty). \n
         - Never include comments, trailing commas, ellipses, or extra text before/after the JSON. \n
         - Dates must be ISO-like (YYYY-MM-DD or full ISO). Amounts: positive income, negative expense.`

    const userPrompt = `Unstructured content:\n\n${rawText}\n\nUser Categories (id: name):\n${categoryGuidance}`

    try {
        const { object } = await generateObject({
            // @ts-expect-error model type is provided by providers
            model,
            schema: responseSchema,
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.2,
            maxOutputTokens: 8192,
            abortSignal
        })
        return { transactions: object.transactions }
    } catch (err) {
        // Detailed server log for failures
        console.error('[aiImportRunner] generateObject failed', {
            userId,
            provider: (model as { modelId?: string } | null)?.modelId,
            errorName: (err as { name?: string } | null)?.name,
            errorMessage: (err as { message?: string } | null)?.message,
            errorStack: (err as { stack?: string } | null)?.stack
        })
        throw err
    }
}


