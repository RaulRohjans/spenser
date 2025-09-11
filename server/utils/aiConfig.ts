type AiProviderName = 'gpt' | 'anthropic' | 'google' | 'ollama' | 'openrouter'

export interface ResolvedAiConfig {
    providerName: AiProviderName
    apiToken: string
    modelName: string
    validatorModelName: string
    ollamaBaseUrl: string
    maxValidationRetries: number
}

export function resolveAiConfig(
    gSettings: Partial<{
        importer_provider: string | null
        token: string | null
        model: string | null
        validator_model?: string | null
        ollama_url?: string | null
    }>
): ResolvedAiConfig {
    // Prefer fully configured admin settings; otherwise fall back to ENV
    const envProvider = process.env.AI_PROVIDER
    const envToken = process.env.AI_TOKEN
    const envModel = process.env.AI_MODEL
    const envValidatorModel = process.env.AI_VALIDATOR_MODEL
    const envOllamaUrl = process.env.OLLAMA_URL
    const envMaxRetries = Number(process.env.AI_VALIDATOR_RETRIES || '1')

    const hasAdminConfig = Boolean(
        gSettings && gSettings.importer_provider && gSettings.token && gSettings.model
    )

    const providerRaw = hasAdminConfig ? gSettings.importer_provider : envProvider
    const providerName = (providerRaw || '').toLowerCase() as AiProviderName | ''
    const apiToken = (hasAdminConfig ? gSettings.token : envToken) || ''
    const modelName = (hasAdminConfig ? gSettings.model : envModel) || ''
    const validatorModelName =
        (hasAdminConfig ? gSettings.validator_model : envValidatorModel) || modelName
    const ollamaBaseUrl = gSettings.ollama_url || envOllamaUrl || 'http://localhost:11434'
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

    if (!apiToken || !modelName) {
        throw createError({
            statusMessage:
                'LLM is not configured. Configure Admin settings or ENV (AI_PROVIDER, AI_TOKEN, AI_MODEL).',
            statusCode: 400
        })
    }

    return { providerName, apiToken, modelName, validatorModelName, ollamaBaseUrl, maxValidationRetries }
}


