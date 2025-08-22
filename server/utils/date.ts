export function parseDateOrThrow(input: unknown, fieldName = 'date'): Date {
    if (input instanceof Date) {
        if (Number.isNaN(input.getTime()))
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid ${fieldName} format.`
            })
        return input
    }

    if (typeof input === 'string' || typeof input === 'number') {
        const d = new Date(input)
        if (Number.isNaN(d.getTime()))
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid ${fieldName} format.`
            })
        return d
    }

    throw createError({
        statusCode: 400,
        statusMessage: `Invalid ${fieldName} format.`
    })
}

export function resolveTzOffsetMinutes(
    input: unknown,
    fallback: number = 0
): number {
    // If client provides numeric offset explicitly, trust it
    if (typeof input === 'number') return clampOffset(input)

    // If client sends an ISO string with explicit offset, parse it
    if (typeof input === 'string') {
        // Matches YYYY-MM-DDTHH:mm:ss(.sss)?(+|-)HH:MM or Z
        const isoOffsetMatch = input.match(/([+-]\d{2}:?\d{2}|Z)$/)
        if (isoOffsetMatch && isoOffsetMatch[1]) {
            const off = isoOffsetMatch[1]
            if (off === 'Z') return 0
            const [sign, hh, mm] =
                off.replace(':', '').match(/^([+-])(\d{2})(\d{2})$/) ?? []
            if (sign && hh && mm) {
                const total = Number(hh) * 60 + Number(mm)
                return clampOffset(sign === '-' ? -total : total)
            }
        }
    }

    // If Date object, derive offset based on local environment at that instant
    if (input instanceof Date) {
        if (!Number.isNaN(input.getTime()))
            return clampOffset(-input.getTimezoneOffset())
    }

    return clampOffset(fallback)
}

export function clampOffset(minutes: number): number {
    // clamp to plausible range (-14:00 to +14:00)
    if (minutes > 14 * 60) return 14 * 60
    if (minutes < -14 * 60) return -14 * 60
    return Math.trunc(minutes)
}

export function coerceDateAndOffset(
    input: unknown,
    tzOffsetMinutesInput?: unknown
): { date: Date; tz_offset_minutes: number } {
    // If input is the shared DateTimeWithOffset object
    const maybe = input as
        | { date?: unknown; tzOffsetMinutes?: number }
        | undefined
    if (
        maybe &&
        Object.prototype.hasOwnProperty.call(maybe, 'date') &&
        Object.prototype.hasOwnProperty.call(maybe, 'tzOffsetMinutes')
    ) {
        const date = parseDateOrThrow(maybe.date)
        const tz_offset_minutes = clampOffset(
            typeof maybe.tzOffsetMinutes === 'number'
                ? maybe.tzOffsetMinutes
                : 0
        )
        return { date, tz_offset_minutes }
    }

    // Back-compat path for raw inputs
    const date = parseDateOrThrow(input)
    const tz_offset_minutes = resolveTzOffsetMinutes(
        typeof tzOffsetMinutesInput === 'number' ? tzOffsetMinutesInput : input,
        0
    )
    return { date, tz_offset_minutes }
}
