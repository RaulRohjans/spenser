import { ensureAuth } from '@/utils/authFunctions'
import { db } from '@/utils/dbEngine'
import type { Selectable } from 'kysely'
import type { UserPreferences } from 'kysely-codegen'

export default defineEventHandler(async (event) => {
    // Read params
    const { currency } = await readBody(event)
    const user = ensureAuth(event)

    if (!currency)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    // Check if it's the first time saving settings
    const settingsCount = await db
        .selectFrom('user_preferences')
        .select('user_preferences.id')
        .where('user', '=', user.id)
        .executeTakeFirst()

    let opRes
    // A record exists in the db, lets edit it
    if (settingsCount) {
        opRes = await db
            .updateTable('user_preferences')
            .set('currency', currency)
            .where('id', '=', settingsCount.id)
            .where('user_preferences.user', '=', user.id)
            .execute()
    } else {
        const settings: Omit<Selectable<UserPreferences>, 'id'> = {
            user: user.id,
            currency
        }

        opRes = await db
            .insertInto('user_preferences')
            .values(settings)
            .returning('id')
            .executeTakeFirst()
    }

    if (!opRes)
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not perform the operation, an error occurred.'
        })

    return {
        success: true
    }
})
