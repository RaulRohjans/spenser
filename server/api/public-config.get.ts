export default defineEventHandler(() => {
    const dailyReset = String(process.env.DAILY_RESET || '').toLowerCase() === 'true'
    const demo = String(process.env.DEMO || '').toLowerCase() === 'true'
    const umamiScriptUrl = process.env.UMAMI_SCRIPT_URL || ''
    const umamiWebsiteId = process.env.UMAMI_ID || ''

    return {
        dailyReset,
        demo,
        umamiScriptUrl,
        umamiWebsiteId
    }
})


