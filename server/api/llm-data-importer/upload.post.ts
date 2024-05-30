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
    if (files && Object.keys(files).length > 0) {
        console.log(files)
        Object.entries(files).forEach(async ([key, value]) => {
            if(!value) return

            const filepath = value[0].filepath
            const mimetype = value[0].mimetype

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
    } else {
        const bodyParams = await readBody(event)
        console.log(bodyParams)
        /**
         if(bodyParams.transactionText) { // Use text entry 
             console.log(bodyParams.transactionText)
             return { success: true }    
         }
         
         */
    }
    

    throw createError({
        statusMessage: "Please provide an import source, either upload a file or provide text!",
        statusCode: 400,
    })
})