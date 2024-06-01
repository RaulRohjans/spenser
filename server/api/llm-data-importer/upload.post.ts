import fs from "fs"
import { ensureAuth } from "@/utils/authFunctions"
import { db } from '@/utils/dbEngine'
import { readFiles } from "h3-formidable"
import type { NuxtError } from "nuxt/app"
import { LLM } from "~/utils/LLM"

export default defineEventHandler(async (event) => {
    const user = ensureAuth(event)  

    const maxFiles = 1
    const { MAX_TRANSACTION_FILE_SIZE } = useRuntimeConfig()
    
    const { files } = await readFiles(event, {
        maxFiles: maxFiles,
        maxFileSize: Number(MAX_TRANSACTION_FILE_SIZE),
    })
    
    // Use uploaded file
    if (!files || Object.keys(files).length === 0)
        throw createError({
            statusMessage: "Please provide valid file.",
            statusCode: 400,
        })

    // This piece of code cannot be isolated into a function 
    // otherwise nuxt will throw an error saying you used some code
    // outside a middleware, plugin or other specific place
    const globalSettings = await db.selectFrom('global_settings')
        .selectAll()
        .where('user', '=', user.id)
        .executeTakeFirst()

    if(!globalSettings)
        throw createError({
            statusMessage: "No LLM settings are configured for this instance.",
            statusCode: 400,
        })

    // Get categories to feed LLM with
    const categories = await db.selectFrom('category')
        .selectAll()
        .where('category.user', '=', user.id)
        .execute()

    // Get first file value
    const value = Object.values(files)[0]
    
    if(!value)
        throw createError({
            statusMessage: "Please provide valid file.",
            statusCode: 400,
        })

    // Validate file type
    const mimetype = value[0].mimetype
    if(!mimetype?.toLowerCase().startsWith('text') && mimetype === 'application/json')
        throw createError({
            statusMessage: "Invalid file type, please provide text based files only.",
            statusCode: 400,
        })

    const filepath = value[0].filepath
    let data
    try { data = fs.readFileSync(filepath, 'utf8') }
    catch(err) {
        throw createError({
            statusMessage: (err as NuxtError).message,
            statusCode: 400,
        })
    }

    const llmInstance = new LLM(globalSettings) //Instance LLM
    const llmTransactions = await llmInstance.parseTransactions(data, categories)    

    return { success: true, transactions: llmTransactions }    
})