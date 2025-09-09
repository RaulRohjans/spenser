type AiProviderName = 'gpt' | 'anthropic' | 'google' | 'ollama' | 'openrouter'

export interface ResolvedAiConfig {
    providerName: AiProviderName
    apiToken: string
    modelName: string
    ollamaBaseUrl: string
}

export function resolveAiConfig(
    gSettings: Partial<{
        importer_provider: string | null
        token: string | null
        model: string | null
        ollama_url?: string | null
    }>
): ResolvedAiConfig {
    // Prefer fully configured admin settings; otherwise fall back to ENV
    const envProvider = process.env.AI_PROVIDER
    const envToken = process.env.AI_TOKEN
    const envModel = process.env.AI_MODEL
    const envOllamaUrl = process.env.OLLAMA_URL

    const hasAdminConfig = Boolean(
        gSettings && gSettings.importer_provider && gSettings.token && gSettings.model
    )

    const providerRaw = hasAdminConfig ? gSettings.importer_provider : envProvider
    const providerName = (providerRaw || '').toLowerCase() as AiProviderName | ''
    const apiToken = (hasAdminConfig ? gSettings.token : envToken) || ''
    const modelName = (hasAdminConfig ? gSettings.model : envModel) || ''
    const ollamaBaseUrl = gSettings.ollama_url || envOllamaUrl || 'http://localhost:11434'

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

    return { providerName, apiToken, modelName, ollamaBaseUrl }
}


