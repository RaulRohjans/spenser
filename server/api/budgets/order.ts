import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'

export default defineEventHandler(async (event) => {
    // Read params
    const { positions } = await readBody(event)
    const user = ensureAuth(event)

    if (!positions)
        throw createError({
            statusCode: 400,
            statusMessage: 'No positions to be persisted were found.'
        })    
    

    Object.entries(positions).forEach(async ([key, value]) => {
        const opRes = await db.updateTable('budget')
            .set('order', Number(value))
            .where('id' , '=', Number(key))
            .where('user', '=', user.id)
            .execute()

        if(!opRes)
            throw createError({
                statusCode: 500,
                statusMessage: 'Could not persist order in the database.'
            })
    })

    return {
        success: true
    }
})