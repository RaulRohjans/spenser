import { readFiles } from "h3-formidable"
import path from "path"
import fs from "fs"

export default defineEventHandler(async (event) => {
    //const bodyParams = await readBody(event)
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

    Object.entries(files).forEach(async ([key, value]) => {
        if(!value) return

        // Validate file type
        const mimetype = value[0].mimetype
        if(!mimetype?.toLowerCase().startsWith('text') && mimetype === 'application/json')
            throw createError({
                statusMessage: "Invalid file type, please provide text based files only.",
                statusCode: 400,
            })

        const filepath = value[0].filepath
        fs.readFile(filepath, 'utf8', function(err, data) {
            if (err) 
                throw createError({
                    statusMessage: err.message,
                    statusCode: 400,
                })
    
            console.log(data)
        })
        /*
        if (!mimetype.startsWith("image"))
            throw createError({
                statusMessage: "Only image allowed.",
                statusCode: 400,
            })
        
        let imageName = `${String(Date.now()) + String(Math.round(Math.random() * 10000000))}.${mimetype.split("/")[1]}`
        let newPath = path.join("upload", imageName)
        fs.copyFileSync(filepath, newPath)
        */

    })

    return { success: true }    
})