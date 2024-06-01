import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import type { Selectable } from "kysely"
import type { GlobalSettings} from "kysely-codegen";
import { UserSettings } from "kysely-codegen"

export default defineEventHandler(async (event) => {
    // Read params
    const { 
        provider,
        gptModel,
        gptToken,
        ollamaModel,
        ollamaUrl
     } = await readBody(event)
    const user = ensureAuth(event)

    if (!provider || (provider === 'ollama' && !ollamaModel && !ollamaUrl) || (provider === 'gpt' && !gptToken))
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })
    
    // Check if it's the first time saving global settings
    const globalSettingsCount = await db
        .selectFrom('global_settings')
        .select('id')
        .executeTakeFirst()

    let opRes
    // A record exists in the db, lets edit it
    if(globalSettingsCount) {
        opRes = await db.updateTable('global_settings')
            .set('importer_provider', provider)
            .set('gpt_token', gptToken)
            .set('ollama_model', ollamaModel)
            .set('ollama_url', ollamaUrl)
            .where('id' , '=', globalSettingsCount.id)
            .execute()
    }
    else {
        const settings: Omit<Selectable<GlobalSettings>, 'id'> = {
            user: user.id,
            importer_provider: provider,
            gpt_model: gptModel,
            gpt_token: gptToken,
            ollama_model: ollamaModel,
            ollama_url: ollamaUrl
        }

        opRes = await db.insertInto('global_settings')
            .values(settings)
            .returning('id')
            .executeTakeFirst()
    }

    if(!opRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not perform the operation, an error occurred.'
        })

    return {
        success: true
    }
})