import 'dotenv/config'
import { seedDemo } from './demoSeed'
import { seedBase } from './baseSeed'

async function main() {
    try {
        await seedBase()
        await seedDemo()
        console.log('[seed] completed')
    } catch (e) {
        console.error('[seed] error', e)
        process.exitCode = 1
    }
}

main().then(() => process.exit(process.exitCode || 0))
