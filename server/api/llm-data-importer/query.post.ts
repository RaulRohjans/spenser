export default defineEventHandler(async (event) => {    
    const { transactionText } = await readBody(event)
    
    if(!transactionText) 
        throw createError({
            statusMessage: "Please provide valid text.",
            statusCode: 400,
        })
        
    console.log(transactionText)

    return { success: true }
})