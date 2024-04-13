/*
 * Get request with query params
*/
export default defineEventHandler((event) => {
    
    const { name } = getQuery(event)
    
    return {
        message: `ok, the name is ${name}`
    }
})