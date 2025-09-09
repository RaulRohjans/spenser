export default defineEventHandler(() => {
    const isDemo = String(process.env.DEMO || '').toLowerCase() === 'true'
    return { isDemo }
})


