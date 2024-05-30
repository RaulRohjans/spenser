import { OpenAI } from "@langchain/openai"
import { Ollama } from "@langchain/community/llms/ollama"
import type { BaseLLM } from "@langchain/core/language_models/llms"

export class LLM {
    constructor() {

    }

    instanceOpenAI(model: string, apiKey: string): BaseLLM {
        const openAiLlm = new OpenAI({
            model: model,
            temperature: 0.9,
            apiKey: apiKey
        })

        return openAiLlm
    }

    instanceOllama(model: string, url: string): BaseLLM {
        const ollamaLlm = new Ollama({
            baseUrl: url,
            model: model
        })

        return ollamaLlm
    }

    async sendLlmQuery(llm: BaseLLM, text: string) {
        const res = await llm.invoke(
            text
        )

        return res
    }
}