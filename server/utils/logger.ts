export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function write(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const payload = { level, message, ...(data || {}), ts: new Date().toISOString() }
    try {
        const line = JSON.stringify(payload)
        if (level === 'error') console.error(line)
        else if (level === 'warn') console.warn(line)
        else console.log(line)
    } catch {
        console.log(level.toUpperCase(), message)
    }
}

export const logger = {
    debug: (msg: string, data?: Record<string, unknown>) => write('debug', msg, data),
    info: (msg: string, data?: Record<string, unknown>) => write('info', msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => write('warn', msg, data),
    error: (msg: string, data?: Record<string, unknown>) => write('error', msg, data)
}
