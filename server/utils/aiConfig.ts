type AiProviderName = 'gpt' | 'anthropic' | 'google' | 'ollama' | 'openrouter'
import { db } from '~~/server/db/client'
import { aiModels } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'

export interface ResolvedAiConfig {
    providerName: AiProviderName
    apiToken: string
    modelName: string
    validatorModelName: string
    ollamaBaseUrl: string
    maxValidationRetries: number
}

export async function resolveAiConfig(
    gSettings: Partial<{
        ai_model?: number | null
    }>
): Promise<ResolvedAiConfig> {
    // Prefer fully configured admin settings; otherwise fall back to ENV
    const envProvider = process.env.AI_PROVIDER
    const envToken = process.env.AI_TOKEN
    const envModel = process.env.AI_MODEL
    const envValidatorModel = process.env.AI_VALIDATOR_MODEL
    const envOllamaUrl = process.env.OLLAMA_URL
    const envMaxRetries = Number(process.env.AI_VALIDATOR_RETRIES || '1')

    let providerName: AiProviderName | '' = ''
    let apiToken: string = ''
    let modelName: string = ''
    let validatorModelName: string = ''
    let ollamaBaseUrl: string = envOllamaUrl || 'http://localhost:11434'

    if (gSettings?.ai_model) {
        try {
            const rec = await db
                .select({
                    provider: aiModels.provider,
                    model: aiModels.model,
                    validator_model: aiModels.validator_model,
                    token: aiModels.token,
                    ollama_url: aiModels.ollama_url
                })
                .from(aiModels)
                .where(eq(aiModels.id, gSettings.ai_model))
                .then((r) => r[0])

            if (rec) {
                providerName = (rec.provider || '').toLowerCase() as AiProviderName | ''
                apiToken = rec.token || ''
                modelName = rec.model || ''
                validatorModelName = rec.validator_model || ''
                ollamaBaseUrl = rec.ollama_url || ollamaBaseUrl
            }
        } catch {
            /* fall back to env */
        }
    }

    if (!providerName) providerName = ((envProvider || '').toLowerCase() as AiProviderName | '')
    if (!apiToken) apiToken = envToken || ''
    if (!modelName) modelName = envModel || ''
    if (!validatorModelName) validatorModelName = envValidatorModel || modelName
    if (!ollamaBaseUrl) ollamaBaseUrl = envOllamaUrl || 'http://localhost:11434'
    const maxValidationRetries = Number.isFinite(envMaxRetries) ? Math.max(0, Math.floor(envMaxRetries)) : 1

    const allowedProviders: ReadonlyArray<AiProviderName> = [
        'gpt',
        'anthropic',
        'google',
        'ollama',
        'openrouter'
    ]

    if (!providerName || !allowedProviders.includes(providerName)) {
        throw createError({
            statusMessage:
                'Unsupported or missing provider. Use one of: gpt, anthropic, google, ollama, openrouter.',
            statusCode: 400
        })
    }

    if ((providerName !== 'ollama' && !apiToken) || !modelName) {
        throw createError({
            statusMessage:
                'LLM is not configured. Configure Admin settings or ENV (AI_PROVIDER, AI_TOKEN, AI_MODEL).',
            statusCode: 400
        })
    }

    return { providerName, apiToken, modelName, validatorModelName, ollamaBaseUrl, maxValidationRetries }
}


