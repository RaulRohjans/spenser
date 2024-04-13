export default defineEventHandler(async (event) => {    
    const { username, password } = await readBody(event)
    
    return {
        success: true,
        token: ''
    }
})