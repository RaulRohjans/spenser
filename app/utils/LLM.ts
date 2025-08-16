import { OpenAI } from '@langchain/openai'
import { Ollama } from '@langchain/community/llms/ollama'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import type { Selectable } from 'kysely'
import type { Category, GlobalSettings } from 'kysely-codegen'
import type { BaseLLM } from '@langchain/core/language_models/llms'
import type { LlmTransactionObject } from '~/../types/Data'

export class LLM {
    llm: BaseLLM

    constructor(settings: Selectable<GlobalSettings>) {
        switch (settings.importer_provider) {
            case 'ollama':
                this.llm = this.instanceOllama(
                    settings.ollama_model || '',
                    settings.ollama_url || ''
                )
                break
            case 'gpt':
                this.llm = this.instanceOpenAI(
                    settings.gpt_model || '',
                    settings.gpt_token || ''
                )
                break
            default:
                throw createError({
                    statusCode: 400,
                    statusMessage: 'The settings provided are invalid'
                })
        }
    }

    instanceOpenAI(model: string, apiKey: string): BaseLLM {
        const openAiLlm = new OpenAI({
            model: model,
            temperature: 0.9,
            openAIApiKey: apiKey
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

    async parseTransactions(
        transactions: string,
        categories: Selectable<Category>[]
    ) {
        const prompt = ChatPromptTemplate.fromMessages([
            [
                'system',
                `You are a tool whose main purpose is to parse transactions in multiple formats into an array of JSON objects, where each object is a transaction and needs to follow the following type definition:

                {{
                    category: number,
                    name: string,
                    value: number,
                    date: string
                }}

                - Name is the name/description of the transaction;
                - value is the total value of the transaction;
                - date is the date the transaction was made, this has to be in a date time string with a format. Example: "2019-01-01T00:00:00";
                - category is the id of the category;
                `
            ],
            [
                'human',
                `You will have to choose the category you think best fits the transaction based on the value and name/description or the transaction, from the following list for each of the transactions:
                
                '
                {categories}
                '
                
                Here is the list of transactions you will need to put into an array of JSON Objects, as mentioned in the beginning and attribute the corresponding categories to:
                
                '
                {transactions}
                '

                Give me the complete list and just the json and nothing more! Be sure to generate the complete list of transactions into the requested JSON format.
                `
            ]
        ])

        const chain = prompt.pipe(this.llm)
        const result = await chain.invoke({
            categories: JSON.stringify(categories),
            transactions: transactions
        })

        // Parse the result to JSON
        // We have to make sure there is no extra text before or after the json code
        // the LLM provides
        const parsedResponse = result
            .substring(result.indexOf('['), result.lastIndexOf(']') + 1)
            .trim()
        console.log(parsedResponse)
        const parsedTransactions: LlmTransactionObject[] =
            JSON.parse(parsedResponse)

        return parsedTransactions
    }
}
