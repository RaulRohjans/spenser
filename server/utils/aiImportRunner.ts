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
): Promise<{
    transactions: Array<{
        name: string
        value: number
        date: string
        category: number | null
    }>
    validation?: {
        ok: boolean
        hint?: string
        attempts: number
        maxRetries: number
    }
}> {
    const gSettings = await db
        .select()
        .from(globalSettings)
        .then((r) => r[0])

    const {
        providerName,
        apiToken,
        modelName,
        validatorModelName,
        ollamaBaseUrl,
        maxValidationRetries
    } = await resolveAiConfig(gSettings || {})

    const cats = await db
        .select({
            id: categories.id,
            name: categories.name,
            description: categories.description
        })
        .from(categories)
        .where(and(eq(categories.user, userId), eq(categories.deleted, false)))

    let model: unknown
    let validatorModel: unknown
    if (providerName === 'gpt') {
        const name = modelName || 'gpt-4o-mini'
        const provider = createOpenAI({ apiKey: apiToken || '' })
        model = provider(name)
        validatorModel = provider(validatorModelName || name)
    } else if (providerName === 'anthropic') {
        const name = modelName || 'claude-3-5-sonnet-latest'
        const provider = createAnthropic({ apiKey: apiToken || '' })
        model = provider(name)
        validatorModel = provider(validatorModelName || name)
    } else if (providerName === 'google') {
        const name = modelName || 'gemini-1.5-flash'
        const provider = createGoogleGenerativeAI({ apiKey: apiToken || '' })
        model = provider(name)
        validatorModel = provider(validatorModelName || name)
    } else if (providerName === 'ollama') {
        const name = modelName || 'llama3'
        const provider = createOllama({ baseURL: ollamaBaseUrl })
        model = provider(name)
        validatorModel = provider(validatorModelName || name)
    } else if (providerName === 'openrouter') {
        const name = modelName || 'anthropic/claude-3-5-sonnet-latest'
        const provider = createOpenRouter({ apiKey: apiToken || '' })
        model = provider(name)
        validatorModel = provider(validatorModelName || name)
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

    const systemPrompt = `You are a precise finance extraction assistant. \n
        Return ONLY valid JSON strictly matching the schema. \n
         - Every transaction MUST include all fields. \n
         - If category is unknown or not a confident match, set it to null (never leave it empty). \n
         - Never include comments, trailing commas, ellipses, or extra text before/after the JSON. \n
         - Dates must be ISO-like (YYYY-MM-DD or full ISO). Amounts: positive income, negative expense.
         - Make sure you consider values correctly 0.89 should be 0.89 not 89, values should only have 2 decimals, 
         make sure you always respect the original number even if the value is smaller than 1, ex: 0.79.`

    const userPrompt = `Unstructured content:\n\n${rawText}\n\nUser Categories (id: name):\n${categoryGuidance}`

    const runOnce = async (extraInstruction?: string) => {
        const finalUserPrompt = extraInstruction
            ? `${userPrompt}\n\nImportant: ${extraInstruction}`
            : userPrompt

        const { object } = await generateObject({
            // @ts-expect-error model type is provided by providers
            model,
            schema: responseSchema,
            system: systemPrompt,
            prompt: finalUserPrompt,
            temperature: 0.2,
            maxOutputTokens: 8192,
            abortSignal
        })
        return object.transactions
    }

    const validate = async (
        originalRaw: string,
        extracted: Array<{
            name: string
            value: number
            date: string
            category: number | null
        }>
    ): Promise<{ ok: boolean; hint?: string }> => {
        const validationSchema = z.object({
            ok: z.boolean(),
            hint: z.string().optional()
        })
        const validationPrompt = `You are a pragmatic validator for extracted financial transactions.
            Context input (unstructured):\n\n${originalRaw}\n\nExtracted JSON: ${JSON.stringify(extracted)}\n\n
            Focus on structural correctness and obvious numeric/date problems. Do NOT nitpick formatting or style.
            Allowed and expected normalizations:
            - Dates may be normalized to YYYY-MM-DD (ISO-like) even if the source shows DD/MM/YYYY. This is correct and SHOULD NOT be flagged.
            - Names should be kept as-is from the source; do NOT flag casing/style differences unless they are generic placeholders like "Unknown".
            - Category can be null when there is no confident match. This is valid and SHOULD NOT be flagged.

            Validate ONLY:
            1) Dates: each is a valid calendar date, preferably normalized to YYYY-MM-DD or full ISO (strings are fine). No out-of-range values.
            2) Values: numeric, reasonable scale (e.g., avoid missing decimals like -32 instead of -0.32), negative for expenses and positive for income.
            3) Category: integer id or null.
            4) JSON structure strictly matches the schema.
            5) Item count roughly matches the volume of the input content (soft check).

            Respond with EXACT JSON: { ok: boolean, hint?: string }.
            If not ok:
            - Format hint as plain text lines using a leading "- " for each distinct topic or error.
            - Insert explicit newline characters ("\n") between lines or paragraphs where appropriate.
            - Keep the message concise and actionable.
            Avoid false positives about date normalization, null categories, or name casing.`

        const { object } = await generateObject({
            // @ts-expect-error validator model typing
            model: validatorModel,
            schema: validationSchema,
            system: 'You validate and output only the minimal JSON object requested.',
            prompt: validationPrompt,
            temperature: 0.1,
            maxOutputTokens: 2048,
            abortSignal
        })
        return object
    }

    try {
        // First pass
        let transactions = await runOnce()
        let verdict = await validate(rawText, transactions)

        // Retry loop according to configuration
        let attempts = 0
        const totalRetries = Math.max(0, maxValidationRetries)
        while (!verdict.ok && attempts < totalRetries) {
            attempts++

            const hint = verdict.hint
                ? String(verdict.hint)
                : 'Ensure valid ISO-like dates, correct value scale (decimals), and valid category ids or null.'
            try {
                transactions = await runOnce(`Fix previous issues: ${hint}.
                    Rules: 
                    - Normalize dates to YYYY-MM-DD; do not try to mimic DD/MM/YYYY.
                    - Keep names as in the source; do not change casing.
                    - Do not invent categories; set unknown to null.
                    - Preserve the JSON schema and numeric precision (fix missing decimals).`)

                verdict = await validate(rawText, transactions)
            } catch (retryErr) {
                console.error('[aiImportRunner] retry attempt failed', {
                    userId,
                    attempt: attempts,
                    errorName: (retryErr as { name?: string } | null)?.name,
                    errorMessage: (retryErr as { message?: string } | null)
                        ?.message
                })
                break
            }
        }

        return {
            transactions,
            validation: {
                ok: !!verdict.ok,
                hint: verdict.hint,
                attempts,
                maxRetries: totalRetries
            }
        }
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
