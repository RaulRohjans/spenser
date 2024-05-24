import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import { Selectable } from "kysely"
import { Transaction } from "kysely-codegen"

export default defineEventHandler(async (event) => {
    // Read params
    const {
        id,
        category,
        name,
        value,
        date
    } = await readBody(event)
    const operation = event.context.params?.operation || null
    const user = ensureAuth(event)

    // No need to do rest of the logic
    if(operation === 'delete') {
        // Remove the transaction in the database
        await db.deleteFrom('transaction')
            .where('id' , '=', id)
            .where('user', '=', user.id)
            .execute()
        return { success: true }
    }

    if (!category || !value || !date)
        throw createError({
            statusCode: 400,
            statusMessage: 'One or more mandatory fields are empty.'
        })

    // Check if user has access to that category
    const validateCategory = async () => {
        const res = await db.selectFrom('category')
            .select(({ fn }) => [
                fn.count<number>('category.id').as('count')
            ])
            .where('category.user', '=', user.id)
            .where('category.id', '=', category)
            .executeTakeFirst()

        if(!res) 
            throw createError({
                statusCode: 500,
                statusMessage: 'Could not validate new data.'
            })

        if(res.count === 0)
            throw createError({
                statusCode: 400,
                statusMessage: 'A category with that name already exists.'
            })
    }

    let opRes
    switch(operation) {
        case 'duplicate':
        case 'insert':
            await validateCategory()

            // Create transation record
            let categoryRecord: Omit<Selectable<Transaction>, 'id'> = {
                user: user.id,
                category,
                name,
                value,
                date
            }

            // Add transaction to persistent storage
            opRes = await db.insertInto('transaction')
                .values(categoryRecord)
                .returning('id')
                .executeTakeFirst()
            break
        case 'edit':
            await validateCategory()

            // Update transaction in the database
            opRes = await db.updateTable('transaction')
                .set('category', category)
                .set('name', name)
                .set('value', value)
                .set('date', date)
                .where('id' , '=', id)
                .where('user', '=', user.id)
                .execute()
            break
        default:
            throw createError({
                statusCode: 500,
                statusMessage: 'Invalid operation.'
            })
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